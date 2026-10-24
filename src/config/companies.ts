// Developers and agencies shown in the listing owner popup. Source: bali_developers_top30.csv and
// the contacts gathered for imported listings (Data/investments_villas/sellers.csv).
// logoUrl is optional; without it the popup uses the website favicon or the initials.

export type CompanyType = 'developer' | 'agency';

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  aliases?: string[];
  website?: string;
  phone?: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  logoUrl?: string;
}

export const COMPANIES: Company[] = [
  { id: "mirah-investment-development", name: "MIRAH Investment & Development", type: 'developer', website: "https://mirahdevelopments.com", phone: "+6285100800800", whatsapp: "+6285100800800", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=MIRAH+Investment+Development+Bali" },
  { id: "breig-property", name: "BREIG Property", type: 'developer', aliases: ["BREIG Property Investment"], website: "https://breig-property.com", phone: "+6285333735583", whatsapp: "+6285333735583", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=BREIG+Property+Bali" },
  { id: "oxo-living", name: "OXO Living", type: 'developer', website: "https://oxoliving.com", phone: "+6281128777772", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=OXO+Living+Bali" },
  { id: "magnum-estate", name: "Magnum Estate", type: 'developer', phone: "+6281558668888", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magnum+Estate+Bali" },
  { id: "loyo-bondar", name: "LOYO & BONDAR", type: 'developer', aliases: ["Loyo"], website: "https://loyobondar.com", phone: "+6281330842982", whatsapp: "+6281330842982", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=LOYO+Bondar+Bali" },
  { id: "sunny-development-group", name: "Sunny Development Group", type: 'developer', phone: "+6281138308920", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Sunny+Development+Group+Bali" },
  { id: "alex-villas", name: "Alex Villas", type: 'developer', website: "https://alexvillasgroup.com", phone: "+6281138305453", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Alex+Villas+Group+Bali" },
  { id: "evdekimi", name: "EVDEkimi", type: 'developer', website: "https://evdekimibali.com", phone: "+6281138803888", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=EVDEkimi+Bali" },
  { id: "dm-projects", name: "DM Projects", type: 'developer', website: "https://www.dmprojects-bali.com", phone: "+6281138887555", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=DM+Projects+Bali" },
  { id: "high-quality-construction", name: "High Quality Construction", type: 'developer', website: "https://hqc-asia.com", phone: "+6282147698159", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=High+Quality+Construction+Bali" },
  { id: "bali-baza-development", name: "Bali Baza Development", type: 'developer', website: "https://balibaza.com", phone: "+6285190083218", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bali+Baza+Development" },
  { id: "nuanu-developments", name: "Nuanu Developments", type: 'developer', googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Nuanu+Development+Bali" },
  { id: "parq-development", name: "PARQ Development", type: 'developer', aliases: ["Parq"], googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=PARQ+Development+Bali" },
  { id: "lyvin-properties", name: "Lyvin Properties", type: 'developer', website: "https://lyvinproperties.co", phone: "+628113881411", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Lyvin+Properties+Bali" },
  { id: "yolla-group", name: "Yolla Group", type: 'developer', website: "https://yollabali.com", phone: "+6281130999921", whatsapp: "+6281130999921", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Yolla+Group+Bali" },
  { id: "anta-group", name: "Anta Group", type: 'developer', googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Anta+Group+Bali" },
  { id: "franz-group", name: "Franz Group", type: 'developer', website: "https://www.franz-group.com", phone: "+6281717767770", whatsapp: "+6281717767770", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Franz+Group+Bali" },
  { id: "dream-house", name: "Dream House", type: 'developer', website: "https://dhbali.com", phone: "+6281995563760", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Dream+House+Developer+Bali" },
  { id: "nexa", name: "NEXA", type: 'developer', website: "https://nexauniverse.com", phone: "+6281280000100", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=NEXA+Developer+Bali" },
  { id: "bali-capital-group", name: "Bali Capital Group", type: 'developer', website: "https://balicapitalgroup.ru", phone: "+6282340779304", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bali+Capital+Group" },
  { id: "predmet-construction", name: "Predmet Construction", type: 'developer', website: "https://predmet.construction", phone: "+6282340382167", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Predmet+Construction+Bali" },
  { id: "balitecture", name: "Balitecture", type: 'developer', phone: "+6282313600632", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Balitecture+Bali" },
  { id: "vibe-development", name: "Vibe Development", type: 'developer', googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Vibe+Development+Bali" },
  { id: "adva-development", name: "ADVA Development", type: 'developer', googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=ADVA+Development+Bali" },
  { id: "618-development", name: "618 Development", type: 'developer', website: "https://618development.com", phone: "+628888618618", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=618+Development+Bali" },
  { id: "bali-bliss-properties", name: "Bali Bliss Properties", type: 'developer', website: "https://balibliss.properties", phone: "+628211201902", whatsapp: "+628211201902", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bali+Bliss+Properties" },
  { id: "big-waves-development", name: "Big Waves Development", type: 'developer', googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Big+Waves+Development+Bali" },
  { id: "revolt-group", name: "Revolt Group", type: 'developer', googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Revolt+Group+Bali" },
  { id: "investland-bali", name: "Investland Bali", type: 'developer', website: "https://investlandbali.com", phone: "+3726028566", whatsapp: "+37256832434", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Investland+Bali" },
  { id: "ilot-property", name: "ILOT Property", type: 'developer', aliases: ["Ilot Property"], website: "https://ilotpropertybali.com", phone: "+6287766045736", whatsapp: "+6287766045736", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=ILOT+Property+Bali" },
  { id: "kibarer-property", name: "Kibarer Property", type: 'agency', website: "https://kibarer-property.com", phone: "+6288219082080", whatsapp: "+6288219082080", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kibarer+Property+Bali" },
  { id: "estatewin-bali", name: "Estatewin Bali", type: 'agency', website: "https://estatewin-bali.com", phone: "+6287817604621", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Estatewin+Bali" },
  { id: "anteya", name: "Anteya", type: 'agency', website: "https://anteyac.com", phone: "+6280332160619", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Anteya+Bali" },
  { id: "power-property", name: "Power Property", type: 'agency', website: "https://www.powerbali.com", phone: "+628113973555", whatsapp: "+628113973555", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Power+Property+Bali" },
  { id: "fullers-properties", name: "Fullers Properties", type: 'agency', website: "https://fullersproperties.com", phone: "+6281928686777", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fullers+Properties+Bali" },
  { id: "emas-estate", name: "Emas Estate", type: 'agency', website: "https://emasestate.com", phone: "+6282194359401", whatsapp: "+6282194359401", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Emas+Estate+Bali" },
  { id: "big-bali-group", name: "Big Bali Group", type: 'developer', website: "https://bigbaligroup.com", phone: "+628888986888", googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Big+Bali+Group" }
];

const normalizeCompanyName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const COMPANY_BY_NAME = new Map<string, Company>(
  COMPANIES.flatMap(company => [company.name, ...(company.aliases || [])]
    .map(name => [normalizeCompanyName(name), company] as [string, Company]))
);

export const findCompanyByName = (...names: Array<string | undefined>) => {
  for (const name of names) {
    const company = name ? COMPANY_BY_NAME.get(normalizeCompanyName(name)) : undefined;
    if (company) return company;
  }
  return undefined;
};
