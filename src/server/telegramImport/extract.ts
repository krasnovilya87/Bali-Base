// Telegram post -> site listing: contacts by code, then Gemini in two passes (section + subcategory, then every
// field of that subcategory), then validation against the site schema and merging of reposts.
import { GoogleGenAI } from '@google/genai';
import { trackGeminiCall } from '../geminiUsage';
import { getSiteSchema, type SchemaField } from './schema';

export type TelegramSender = { type: string; id?: string; username?: string | null; name?: string | null; phone?: string | null; bot?: boolean };
export type TelegramPost = {
  key: string;
  channel: string;
  messageId: number;
  messageIds: number[];
  photoIds: number[];
  date: string;
  text: string;
  sender: TelegramSender | null;
  url: string;
};
export type Contacts = {
  authorUsername: string | null;
  authorName: string | null;
  authorId: string | null;
  phones: string[];
  usernames: string[];
  whatsapp: boolean;
  links: string[];
  emails: string[];
};
export type Pass1 = Record<string, any>;
export type Pass2 = Record<string, any>;
export type Listing = Record<string, any>;

const MODEL = process.env.TELEGRAM_IMPORT_GEMINI_MODEL || 'gemini-flash-latest';
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];
const ATTEMPTS = 40;
const BATCH_PASS1 = 12;
const BATCH_PASS2 = 6;
const RATES: Record<string, number> = { USD: 16_500, EUR: 18_000, RUB: 200 };
export const SECTIONS = ['ads', 'services', 'afisha', 'life'] as const;
const SECTION_ALIASES: Record<string, string> = { market: 'ads', service: 'services', events: 'afisha', event: 'afisha' };

// ---------- contacts (by code, no model) ----------

const PHONE_RE = /(?<![\w/])(\+?\d[\d\s\-().]{7,18}\d)(?![\w/])/g;
const WA_LINK_RE = /(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?\+?(\d{8,15})/gi;
const USERNAME_RE = /(?<![\w.])@([A-Za-z][A-Za-z0-9_]{3,31})\b/g;
const TG_LINK_RE = /(?:https?:\/\/)?t\.me\/([A-Za-z][A-Za-z0-9_]{3,31})(?![/\w])/gi;
const LINK_RE = /https?:\/\/\S+|(?:instagram\.com|wa\.me|t\.me)\/\S+/gi;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;

const normalizePhone = (raw: string): string | null => {
  let digits = raw.replace(/\D/g, '');
  let hasPlus = raw.trim().startsWith('+');
  if (digits.startsWith('0') && !digits.startsWith('00') && digits.length >= 9 && digits.length <= 13) {
    return digits.startsWith('08') ? `+62${digits.slice(1)}` : null; // Indonesian mobile in local form
  }
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
    hasPlus = true;
  }
  if (digits.startsWith('62') && digits.length >= 10 && digits.length <= 14) return `+${digits}`;
  if (digits.startsWith('8') && digits.length >= 9 && digits.length <= 12 && !hasPlus) return `+62${digits}`;
  if (hasPlus && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  if (digits.startsWith('7') && digits.length === 11) return `+${digits}`; // Russian number without +
  return null;
};

const allMatches = (text: string, re: RegExp, group = 0) => [...text.matchAll(re)].map(match => match[group]);

export const extractContacts = (post: TelegramPost): Contacts => {
  const { text } = post;
  const phones: string[] = [];
  const addPhone = (phone: string | null) => {
    if (phone && !phones.includes(phone)) phones.push(phone);
  };
  allMatches(text, WA_LINK_RE, 1).forEach(raw => addPhone(normalizePhone(`+${raw}`)));
  for (const raw of allMatches(text.replace(LINK_RE, ' '), PHONE_RE, 1)) {
    if (/\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(raw)) continue; // a date, not a phone
    addPhone(normalizePhone(raw));
  }
  const usernames: string[] = [];
  for (const name of [...allMatches(text.replace(EMAIL_RE, ' '), USERNAME_RE, 1), ...allMatches(text, TG_LINK_RE, 1)]) {
    if (name.toLowerCase() !== post.channel.toLowerCase() && !usernames.includes(name)) usernames.push(name);
  }
  const sender = post.sender || { type: 'unknown' };
  if (sender.phone) phones.push(sender.phone);
  return {
    authorUsername: sender.type === 'user' && !sender.bot ? sender.username || null : null,
    authorName: sender.name || null,
    authorId: sender.id || null,
    phones,
    usernames,
    whatsapp: /whats\s?app|ватсап|вотсап|wa\.me|\bwa\b/i.test(text),
    links: [...new Set(allMatches(text, LINK_RE))].sort(),
    emails: [...new Set(allMatches(text, EMAIL_RE))].sort()
  };
};

export const hasContact = (contacts: Contacts) => Boolean(contacts.authorUsername || contacts.phones.length || contacts.usernames.length);

// ---------- Gemini ----------

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type LogFn = (line: string) => void;

const askGemini = async (prompt: string, log: LogFn): Promise<unknown> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server.');
  const ai = new GoogleGenAI({ apiKey });
  const models = [MODEL, ...FALLBACK_MODELS.filter(model => model !== MODEL)];
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const model = models[attempt % models.length]; // an overloaded model (503) is retried with the next one
    try {
      const response = await trackGeminiCall(model, () => ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature: 0.1 }
      }));
      return JSON.parse(response.text || '');
    } catch (error: any) {
      const status = Number(error?.status ?? error?.code);
      const retryable = [404, 429, 500, 503].includes(status) || error instanceof SyntaxError || !status;
      if (!retryable || attempt === ATTEMPTS - 1) throw error;
      const wait = Math.min(10 * (Math.floor(attempt / models.length) + 1), 60);
      log(`  ${model} ${status || error?.name || 'error'}, retry in ${wait}s`);
      await sleep(wait * 1000);
    }
  }
  throw new Error('Gemini: too many retries');
};

// ---------- pass 1: section and subcategory ----------

const treeText = () => {
  const schema = getSiteSchema();
  const lines = ["MARKET (section 'ads') - selling PERSONAL items/goods by a private person. subCategory is one of the ids "
    + "listed after a group name (e.g. 'phones', 'surfing', 'ads_scooters'), NEVER the group name itself:"];
  const groups = new Map<string, string[]>();
  for (const item of schema.ads.subcategories) {
    groups.set(item.group, [...(groups.get(item.group) || []), `${item.id} (${item.label})`]);
  }
  groups.forEach((items, group) => lines.push(`  ${group}: ${items.join(', ')}`));
  lines.push("SERVICES (section 'services') - someone offers a service. subCategory id -> serviceSubcategory ids:");
  for (const item of schema.services.subcategories) {
    lines.push(`  ${item.id} (${item.label}): ${item.subcategories.map(sub => sub.id.split('.').slice(1).join('.')).join(', ')}`);
  }
  lines.push("AFISHA (section 'afisha') - an event with a date: party, concert, workshop, retreat, tour... subCategory ids: "
    + schema.afisha.subcategories.map(item => `${item.id} (${item.label})`).join(', '));
  lines.push("LIFE (section 'life') - community posts: vacancies, looking for company, family, sport partners, hobbies, "
    + 'animals (incl. giving away pets), help requests, lost & found, warnings. subCategory ids: '
    + schema.life.subcategories.map(item => `${item.id} (${item.label})`).join(', '));
  return lines.join('\n');
};

const pass1Rules = () => `You sort Telegram posts from Bali expat chats into sections of the BaliBase site.

${treeText()}

REJECT (section 'reject') with a short reject_reason in English when the post is:
- renting or selling real estate (villa, house, room, apartment, land) -> "real_estate"
- renting out a bike/car/scooter (rent, not sale) -> "vehicle_rent"
- "buy / looking for / need" requests for items -> "wanted"
- currency exchange, crypto, money transfer -> "exchange"
- an advert for a channel/chat/group, spam, or meaningless/too short text -> "spam"
- selling by a shop/business many different new goods (not a personal item) -> "shop"
- anything that fits no section -> "other"
Note: a business offering a SERVICE goes to services (not reject). Selling a vehicle is market.
"Продам X" / "for sale X" about one or a few personal items is ALWAYS market, even if the text is very short
or the seller also accepts an exchange.

For every post return an object:
{"i": <post index>, "section": "ads|services|afisha|life|reject", "reject_reason": "...or null",
 "subCategory": "<id from the lists above or null>",
 "serviceSubcategory": "<for services: the sub id from the list, e.g. 'cleaning', else null>",
 "title": "<short headline, max 60 chars, in the post's language, no emoji, e.g. 'iPhone 14 Pro 256GB'>",
 "price": <number exactly as written, or null>, "currency": "IDR|USD|EUR|RUB|null",
 "price_note": "<'negotiable', 'free', 'from', 'per hour', 'per lesson' or null>",
 "district": "<one of ${JSON.stringify(getSiteSchema().districts)} if the text names the area (Canggu, Ubud...), else null>",
 "language": "<ru|en|id|other: language of the post>"}
Price rules: "2.5jt" / "2,5 juta" / "2.5 млн" / "2.5 mln" / "2.5🍋" / "2.5 лимона" -> 2500000 IDR; "250k"/"250к"/"250rb" -> 250000 IDR; "$300" -> 300 USD.
If several items with different prices, take the main/first item's price. Give away for free -> price 0, price_note "free".
Answer with a JSON array, one object per post, same order.`;

const normalizeSection = (info: Pass1): Pass1 => ({ ...info, section: SECTION_ALIASES[info.section] || info.section });

export const runPass1 = async (posts: TelegramPost[], save: (batch: Record<string, Pass1>) => Promise<void>, log: LogFn) => {
  const rules = pass1Rules();
  for (let start = 0; start < posts.length; start += BATCH_PASS1) {
    const chunk = posts.slice(start, start + BATCH_PASS1);
    const listing = chunk
      .map((post, index) => `### POST ${index}\nphotos: ${post.photoIds.length}\n${post.text.slice(0, 2500) || '(no text)'}`)
      .join('\n\n');
    const answer = await askGemini(`${rules}\n\nPOSTS:\n${listing}`, log);
    const batch: Record<string, Pass1> = {};
    for (const item of Array.isArray(answer) ? answer : []) {
      const post = chunk[Number(item?.i)];
      if (post) batch[post.key] = normalizeSection(item);
    }
    await save(batch);
    log(`  pass 1: ${Math.min(start + BATCH_PASS1, posts.length)}/${posts.length}`);
  }
};

// ---------- pass 2: subcategory fields ----------

const fieldsText = (fields: SchemaField[]) => fields.map(field => {
  let line = `- ${field.id} (${field.label}${field.unit ? `, ${field.unit}` : ''})`;
  line += field.options?.length
    ? `${field.multiple ? ' multiple of: ' : ' one of: '}${field.options.map(option => option.value).join(', ')}`
    : ` ${field.kind}`;
  if (field.productTypes?.length) line += ` [only for productType ${field.productTypes.join(', ')}]`;
  return line;
}).join('\n');

const list = (values: string[]) => JSON.stringify(values);

// Field instructions for pass 2 and the attribute fields used to validate the answer.
const sectionSchema = (section: string, sub: string): { text: string; fields: SchemaField[] } => {
  const schema = getSiteSchema();
  if (section === 'ads') {
    const item = schema.ads.subcategories.find(candidate => candidate.id === sub);
    const fields = item?.fields || [];
    const common = schema.ads.common;
    const types = item?.productTypes.map(type => type.value).join(', ') || '';
    const brands = item?.brands.join(', ') || '';
    return {
      fields,
      text: `Item for sale, subCategory ${sub}.
Top-level keys:
- classifiedCondition: one of ${list(common.condition)}
- classifiedFulfillment: array of ${list(common.fulfillment)} (pickup if the buyer must come; delivery_available if seller delivers)
- classifiedAudience: one of ${list(common.audience)} (clothes, shoes, sport gear for whom)
- classifiedLevel: one of ${list(common.level)} (sport gear level)
- classifiedUrgentSale: true if "urgent/срочно/before leaving/отъезд"
${types ? `- classifiedProductType: one of ${types}` : ''}
attributes keys (classified_brand: brand name${brands ? `, prefer one of: ${brands}` : ''}; classified_model; classified_purchase_year):
${fieldsText(fields)}`
    };
  }
  if (section === 'services') {
    const common = schema.services.common;
    return {
      fields: [],
      text: `Service offer, subCategory ${sub}.
Top-level keys:
- serviceFormats: array of ${list(common.formats)} (provider_place = at the master's place; client_visit = comes to you)
- serviceLanguages: array of ${list(common.languages)}
- servicePriceType: one of ${list(common.priceType)}
- serviceAvailability: array of ${list(common.availability)}
- serviceProviderType: one of ${list(common.providerType)}
- serviceDistricts: array of ${list(schema.districts)} where the service is provided (empty if not stated)
- serviceExperienceYears: number
- serviceFreeConsultation: true/false
- serviceUrgentAvailable: true/false
- serviceLicensed / serviceCertified: true if the text says licensed / has certificates
attributes: {}`
    };
  }
  if (section === 'afisha') {
    const item = schema.afisha.subcategories.find(candidate => candidate.id === sub);
    const fields = [...schema.afisha.common, ...(item?.fields || [])];
    return {
      fields,
      text: `Event, subCategory ${sub}.
Top-level keys:
- eventDate: "YYYY-MM-DD" date of the event (the post was published on {posted}; resolve "tomorrow", "Saturday" etc. from it; null if no date)
- eventEndDate: "YYYY-MM-DD" for multi-day events, else null
- venueName: name of the place (club, cafe, studio) or null
- address: address or area text or null
attributes keys (afisha_start_time as "HH:MM"; afisha_registration_url only a real http link):
${fieldsText(fields)}`
    };
  }
  const item = schema.life.subcategories.find(candidate => candidate.id === sub);
  const fields = item?.fields || [];
  return { fields, text: `Community post, subCategory ${sub}.\nattributes keys:\n${fieldsText(fields) || '(none)'}` };
};

const PASS2_RULES = `Fill structured fields of BaliBase listings from Telegram posts.
Use ONLY facts written in the post text. If a value is not stated, leave the key out (do not guess).
For option fields use exactly the given option values. Numbers are plain numbers (no units).
Also return "description": the post text cleaned for a listing card - keep all facts, remove greetings, hashtags,
channel adverts and repeated emoji; keep the original language; keep line breaks.
Return a JSON array: [{"i": <post index>, "description": "...", <top-level keys>..., "attributes": {...}}].`;

export const runPass2 = async (
  items: Array<TelegramPost & { section: string; subCategory: string }>,
  save: (batch: Record<string, Pass2>) => Promise<void>,
  log: LogFn
) => {
  const groups = new Map<string, typeof items>();
  items.forEach(item => {
    const groupKey = `${item.section}|${item.subCategory}`;
    groups.set(groupKey, [...(groups.get(groupKey) || []), item]);
  });
  let done = 0;
  for (const group of groups.values()) {
    const { text: instructions } = sectionSchema(group[0].section, group[0].subCategory);
    for (let start = 0; start < group.length; start += BATCH_PASS2) {
      const chunk = group.slice(start, start + BATCH_PASS2);
      const listing = chunk
        .map((post, index) => `### POST ${index} (published ${post.date.slice(0, 10)})\n${post.text.slice(0, 3000)}`)
        .join('\n\n');
      const prompt = `${PASS2_RULES}\n\n${instructions.replace('{posted}', chunk[0].date.slice(0, 10))}\n\nPOSTS:\n${listing}`;
      const answer = await askGemini(prompt, log);
      const batch: Record<string, Pass2> = {};
      for (const row of Array.isArray(answer) ? answer : []) {
        const post = chunk[Number(row?.i)];
        if (post) batch[post.key] = row;
      }
      await save(batch);
      done += chunk.length;
      log(`  pass 2: ${done}/${items.length}`);
    }
  }
};

// ---------- validation and listing build ----------

const EXTRA_FIELDS: Record<string, SchemaField> = {
  classified_brand: { id: 'classified_brand', label: 'Brand', kind: 'text' },
  classified_model: { id: 'classified_model', label: 'Model', kind: 'text' },
  classified_purchase_year: { id: 'classified_purchase_year', label: 'Purchase year', kind: 'number' }
};

const cleanAttributes = (raw: unknown, fields: SchemaField[], productType: string | null) => {
  const byId: Record<string, SchemaField> = { ...Object.fromEntries(fields.map(field => [field.id, field])), ...EXTRA_FIELDS };
  const clean: Record<string, string | number | boolean | string[]> = {};
  for (const [fieldId, value] of Object.entries((raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>)) {
    const field = byId[fieldId];
    if (!field || value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length)) continue;
    if (field.productTypes?.length && !field.productTypes.includes(productType || '')) continue;
    const options = new Set((field.options || []).map(option => option.value));
    if (options.size) {
      const values = (Array.isArray(value) ? value : [value]).map(String).filter(item => options.has(item));
      if (values.length) clean[fieldId] = field.multiple ? values : values[0];
    } else if (field.kind === 'number') {
      const number = Number(String(value).replace(',', '.'));
      if (Number.isFinite(number)) clean[fieldId] = number;
    } else if (field.kind === 'boolean') {
      clean[fieldId] = Boolean(value);
    } else if (typeof value !== 'object') {
      clean[fieldId] = String(value).trim();
    }
  }
  return clean;
};

const pick = (value: unknown, allowed: string[]) => (typeof value === 'string' && allowed.includes(value) ? value : undefined);
const pickMany = (value: unknown, allowed: string[]) => {
  const values = (Array.isArray(value) ? value : value ? [value] : []).filter((item): item is string => allowed.includes(item));
  return values.length ? values : undefined;
};

const priceIdr = (info: Pass1) => {
  const { price } = info;
  if (typeof price !== 'number' || price <= 0) return 0;
  return Math.round(price * (RATES[info.currency] || 1));
};

const priceText = (info: Pass1) => {
  const { price } = info;
  if (info.price_note === 'free' || price === 0) return 'Free';
  if (typeof price !== 'number') return info.price_note === 'negotiable' ? 'Negotiable' : '—';
  const symbol = ({ USD: '$', EUR: '€', RUB: '₽' } as Record<string, string>)[info.currency];
  const amount = Number.isInteger(price) ? price.toLocaleString('en-US').replace(/,/g, ' ') : String(price);
  const text = symbol ? `${symbol}${amount}` : `Rp ${amount}`;
  return info.price_note === 'from' ? `from ${text}` : text;
};

const FALLBACK_SUBCATEGORY: Record<string, string> = { ads: 'other_ads', services: 'other_services', afisha: 'afisha_other', life: 'life_other' };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const buildListing = (post: TelegramPost, contacts: Contacts, rawInfo: Pass1, details: Pass2): { listing?: Listing; reason?: string } => {
  const schema = getSiteSchema();
  const info = normalizeSection(rawInfo);
  const section: string = info.section;
  if (!(SECTIONS as readonly string[]).includes(section)) return { reason: info.reject_reason || 'other' };
  const validSubs = (section === 'ads' ? schema.ads.subcategories
    : section === 'services' ? schema.services.subcategories
      : section === 'afisha' ? schema.afisha.subcategories
        : schema.life.subcategories).map(item => item.id);
  const sub: string = validSubs.includes(info.subCategory) ? info.subCategory : FALLBACK_SUBCATEGORY[section];

  const price = priceIdr(info);
  const isFree = info.price_note === 'free' || info.price === 0;
  if (!hasContact(contacts)) return { reason: 'no_contact' };
  if (section === 'ads') {
    if (!post.photoIds.length) return { reason: 'no_photo' };
    if (!price && !isFree) return { reason: 'no_price' };
  }

  const { fields } = sectionSchema(section, sub);
  const username = contacts.authorUsername || contacts.usernames[0] || undefined;
  const listing: Listing = {
    id: `tg-${post.channel}-${post.messageId}`,
    ownerId: 'telegram-import',
    importSource: 'telegram',
    category: section,
    subCategory: sub,
    title: String(info.title || post.text.slice(0, 60)).trim(),
    description: String(details.description || post.text).trim(),
    district: schema.districts.includes(info.district) ? info.district : '',
    address: details.address || '',
    images: [],
    photoIds: post.photoIds,
    photoChannel: post.channel,
    pricePerDay: price,
    priceText: priceText(info),
    priceOriginal: { amount: info.price ?? null, currency: info.currency ?? null, note: info.price_note ?? null },
    telegramUsername: username,
    whatsappNumber: contacts.phones[0] || '',
    ownerName: contacts.authorName || (username ? `@${username}` : ''),
    contacts,
    status: 'moderation',
    isApproved: false,
    isNew: true,
    rating: 0,
    reviewsCount: 0,
    reviews: [],
    hasDropPrice: false,
    clicksCount: 0,
    viewsCount: 0,
    yearBuilt: 'other',
    interiorStyle: 'basic',
    createdAt: post.date,
    sourceUrl: post.url,
    sourceChannel: post.channel,
    sourceMessageId: post.messageId,
    language: info.language
  };

  if (section === 'ads') {
    const common = schema.ads.common;
    const item = schema.ads.subcategories.find(candidate => candidate.id === sub)!;
    const types = item.productTypes.map(type => type.value);
    const productType = types.includes(details.classifiedProductType) ? details.classifiedProductType : null;
    Object.assign(listing, {
      classifiedCondition: pick(details.classifiedCondition, common.condition),
      classifiedFulfillment: pickMany(details.classifiedFulfillment, common.fulfillment),
      classifiedAudience: pick(details.classifiedAudience, common.audience),
      classifiedLevel: pick(details.classifiedLevel, common.level),
      classifiedUrgentSale: details.classifiedUrgentSale ? true : undefined,
      classifiedProductType: productType || undefined,
      classifiedAttributes: cleanAttributes(details.attributes, fields, productType)
    });
  } else if (section === 'services') {
    const common = schema.services.common;
    const serviceSub = String(info.serviceSubcategory || '');
    const full = serviceSub ? `${sub}.${serviceSub.split('.').pop()}` : '';
    const allowed = new Set(schema.services.subcategories.find(group => group.id === sub)?.subcategories.map(item => item.id) || []);
    Object.assign(listing, {
      serviceSubcategory: allowed.has(full) ? full : allowed.has(`${sub}.other`) ? `${sub}.other` : undefined,
      serviceFormats: pickMany(details.serviceFormats, common.formats),
      serviceLanguages: pickMany(details.serviceLanguages, common.languages),
      servicePriceType: pick(details.servicePriceType, common.priceType),
      serviceAvailability: pickMany(details.serviceAvailability, common.availability),
      serviceProviderType: pick(details.serviceProviderType, common.providerType) || 'private_specialist',
      serviceDistricts: pickMany(details.serviceDistricts, schema.districts),
      serviceExperienceYears: typeof details.serviceExperienceYears === 'number' ? details.serviceExperienceYears : undefined,
      serviceFreeConsultation: details.serviceFreeConsultation === true || undefined,
      serviceUrgentAvailable: details.serviceUrgentAvailable === true || undefined,
      serviceLicensed: details.serviceLicensed === true || undefined,
      serviceCertified: details.serviceCertified === true || undefined
    });
  } else if (section === 'afisha') {
    const eventDate = details.eventDate;
    if (typeof eventDate !== 'string' || !DATE_RE.test(eventDate)) return { reason: 'no_event_date' };
    const endDate = typeof details.eventEndDate === 'string' && DATE_RE.test(details.eventEndDate) ? details.eventEndDate : eventDate;
    if (endDate < new Date().toISOString().slice(0, 10)) return { reason: 'event_passed' };
    const attributes: Record<string, unknown> = cleanAttributes(details.attributes, fields, null);
    attributes.afisha_event_date = eventDate;
    if (endDate !== eventDate) attributes.afisha_event_end_date = endDate;
    if (details.venueName) attributes.afisha_venue_name = String(details.venueName);
    listing.classifiedAttributes = attributes;
    listing.expirationDate = new Date(Date.parse(`${endDate}T00:00:00Z`) + 86_400_000).toISOString();
  } else {
    listing.classifiedAttributes = cleanAttributes(details.attributes, fields, null);
  }
  return { listing: Object.fromEntries(Object.entries(listing).filter(([, value]) => value !== undefined && value !== null)) };
};

// ---------- reposts ----------

const norm = (text: string) => text.toLowerCase().replace(/[\W_]+/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);

// Ratcliff/Obershelp similarity, the same measure as Python's difflib.SequenceMatcher.ratio().
const similarity = (a: string, b: string) => {
  if (!a.length && !b.length) return 1;
  const matches = (left: string, right: string): number => {
    if (!left.length || !right.length) return 0;
    let best = 0;
    let bestLeft = 0;
    let bestRight = 0;
    const lengths = new Array(right.length + 1).fill(0);
    for (let i = 1; i <= left.length; i += 1) {
      let previous = 0;
      for (let j = 1; j <= right.length; j += 1) {
        const current = lengths[j];
        lengths[j] = left[i - 1] === right[j - 1] ? previous + 1 : 0;
        if (lengths[j] > best) {
          best = lengths[j];
          bestLeft = i - best;
          bestRight = j - best;
        }
        previous = current;
      }
    }
    if (!best) return 0;
    return best
      + matches(left.slice(0, bestLeft), right.slice(0, bestRight))
      + matches(left.slice(bestLeft + best), right.slice(bestRight + best));
  };
  return (2 * matches(a, b)) / (a.length + b.length);
};

// The same event posted again (often by different people): same date and a near-identical title.
const sameEvent = (a: Listing, b: Listing) => {
  const dateA = a.classifiedAttributes?.afisha_event_date;
  if (!dateA || dateA !== b.classifiedAttributes?.afisha_event_date) return false;
  const titleA = norm(a.title);
  const titleB = norm(b.title);
  return titleA === titleB || similarity(titleA, titleB) >= 0.8;
};

export const mergeReposts = (listings: Listing[]) => {
  const kept: Listing[] = [];
  for (const listing of [...listings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) { // keep the newest
    const author = listing.contacts.authorId;
    const text = norm(listing.description);
    const twin = kept.find(other => other.category === listing.category && (
      (listing.category === 'afisha' && sameEvent(other, listing))
      // one author advertising the same service again with a reworded text
      || (listing.category === 'services' && author && other.contacts.authorId === author
        && other.serviceSubcategory === listing.serviceSubcategory)
      || ((author && other.contacts.authorId === author) || norm(other.description) === text)
        && similarity(norm(other.description), text) >= 0.85
    ));
    if (twin) {
      twin.repostUrls = [...(twin.repostUrls || []), listing.sourceUrl];
      if (!twin.photoIds.length && listing.photoIds.length) {
        twin.photoIds = listing.photoIds;
        twin.photoChannel = listing.photoChannel;
      }
    } else {
      kept.push(listing);
    }
  }
  return kept;
};
