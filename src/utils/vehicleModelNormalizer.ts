import { SCOOTER_MODEL_OPTIONS } from './scooterFilters';

type VehicleModelSearchContext = {
  category?: string;
  subCategories?: string[];
};

type ModelAliasEntry = {
  value: string;
  label: string;
  aliases: string[];
};

export type VehicleModelNormalizationResult = {
  query: string;
  modelValue: string | null;
  modelLabel: string | null;
  matchedAlias: string | null;
};

const isTransportBikeContext = (context: VehicleModelSearchContext = {}) =>
  context.category === 'transport' &&
  (!context.subCategories?.length || context.subCategories.includes('scooters'));

const baseAliasesByModel: Record<string, string[]> = {
  nmax: ['nmax', 'n max', 'n-max', 'эн макс', 'ен макс', 'энмакс', 'енмакс', 'max'],
  nmax_turbo: ['nmax turbo', 'n max turbo', 'n-max turbo', 'эн макс турбо', 'ен макс турбо'],
  xmax: ['xmax', 'x max', 'x-max', 'икс макс', 'иксмакс'],
  honda_pcx: ['honda pcx', 'honda pc x', 'хонда pcx', 'хонда пи си икс'],
  pcx: ['pcx', 'pc x', 'пи си икс', 'писи икс'],
  aerox_155: ['aerox', 'aerox 155', 'aero x', 'аэрокс', 'аэро икс'],
  scoopy: ['scoopy', 'scoopi', 'scopy', 'скупи', 'скуппи'],
  vario_160: ['vario 160', 'варио 160'],
  vario_125: ['vario 125', 'варио 125'],
  fazzio: ['fazzio', 'фазио', 'фаззио'],
  vespa_sprint_150: ['vespa sprint', 'vespa sprint 150', 'веспа спринт'],
  vespa_primavera_150: ['vespa primavera', 'vespa primavera 150', 'веспа примавера'],
  beat_110: ['beat', 'beat 110', 'бит', 'бит 110'],
  genio_110: ['genio', 'genio 110', 'дженио'],
  grand_filano_125: ['grand filano', 'grand filano 125', 'гранд филано'],
  freego_125: ['freego', 'free go', 'freego 125', 'фриго'],
  mio_125: ['mio', 'mio 125', 'мио'],
  adv: ['adv', 'адв']
};

const genericAliases: Record<string, string> = {
  vespa: 'vespa_sprint_150',
  'веспа': 'vespa_sprint_150',
  vario: 'vario_160',
  'варио': 'vario_160'
};

const normalizePhrase = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[-_]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const compactPhrase = (value: string) => normalizePhrase(value).replace(/\s+/g, '');

const modelEntries: ModelAliasEntry[] = SCOOTER_MODEL_OPTIONS.map(model => {
  const labelAliases = [
    model.label,
    model.value,
    model.label.replace(/\d+$/g, '').trim()
  ].filter(Boolean);

  return {
    value: model.value,
    label: model.label,
    aliases: Array.from(new Set([
      ...labelAliases,
      ...(baseAliasesByModel[model.value] || [])
    ]))
  };
});

const getAliasRecords = (allowAmbiguousShortAliases: boolean) => {
  const records = modelEntries.flatMap(entry =>
    entry.aliases
      .filter(alias => allowAmbiguousShortAliases || compactPhrase(alias) !== 'max')
      .map(alias => ({
        value: entry.value,
        label: entry.label,
        alias,
        normalized: normalizePhrase(alias),
        compact: compactPhrase(alias)
      }))
  );

  Object.entries(genericAliases).forEach(([alias, value]) => {
    const entry = modelEntries.find(model => model.value === value);
    if (entry) {
      records.push({
        value: entry.value,
        label: entry.label,
        alias,
        normalized: normalizePhrase(alias),
        compact: compactPhrase(alias)
      });
    }
  });

  return records.sort((a, b) => b.normalized.length - a.normalized.length);
};

const levenshteinDistance = (a: string, b: string) => {
  const dp = Array.from({ length: a.length + 1 }, (_, index) => index);

  for (let i = 1; i <= b.length; i += 1) {
    let previous = dp[0];
    dp[0] = i;
    for (let j = 1; j <= a.length; j += 1) {
      const temp = dp[j];
      dp[j] = b[i - 1] === a[j - 1]
        ? previous
        : Math.min(previous + 1, dp[j] + 1, dp[j - 1] + 1);
      previous = temp;
    }
  }

  return dp[a.length];
};

const getQueryPhrases = (normalizedQuery: string) => {
  const words = normalizedQuery.split(' ').filter(Boolean);
  const phrases: string[] = [];

  for (let size = Math.min(3, words.length); size >= 1; size -= 1) {
    for (let index = 0; index <= words.length - size; index += 1) {
      phrases.push(words.slice(index, index + size).join(' '));
    }
  }

  return phrases;
};

export const findVehicleModelInQuery = (
  query: string,
  context: VehicleModelSearchContext = {}
): VehicleModelNormalizationResult => {
  const normalizedQuery = normalizePhrase(query);
  const allowAmbiguousShortAliases = isTransportBikeContext(context);
  const aliases = getAliasRecords(allowAmbiguousShortAliases);

  for (const record of aliases) {
    const pattern = new RegExp(`(^|\\s)${record.normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'u');
    if (pattern.test(normalizedQuery)) {
      return {
        query: normalizedQuery.replace(pattern, `$1${record.label}`).replace(/\s+/g, ' ').trim(),
        modelValue: record.value,
        modelLabel: record.label,
        matchedAlias: record.alias
      };
    }

    const compactPhraseMatch = getQueryPhrases(normalizedQuery).find(phrase => compactPhrase(phrase) === record.compact);
    if (compactPhraseMatch) {
      const phrasePattern = new RegExp(`(^|\\s)${compactPhraseMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'u');
      return {
        query: normalizedQuery.replace(phrasePattern, `$1${record.label}`).replace(/\s+/g, ' ').trim(),
        modelValue: record.value,
        modelLabel: record.label,
        matchedAlias: record.alias
      };
    }
  }

  const knownFuzzyAliases = aliases.filter(record => record.compact.length >= 5);
  for (const phrase of getQueryPhrases(normalizedQuery)) {
    const compact = compactPhrase(phrase);
    if (compact.length < 5) continue;

    const match = knownFuzzyAliases.find(record => {
      const distance = levenshteinDistance(compact, record.compact);
      const threshold = compact.length >= 8 ? 2 : 1;
      return distance > 0 && distance <= threshold;
    });

    if (match) {
      const phrasePattern = new RegExp(`(^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$)`, 'u');
      return {
        query: normalizedQuery.replace(phrasePattern, `$1${match.label}`).replace(/\s+/g, ' ').trim(),
        modelValue: match.value,
        modelLabel: match.label,
        matchedAlias: match.alias
      };
    }
  }

  return {
    query: normalizedQuery,
    modelValue: null,
    modelLabel: null,
    matchedAlias: null
  };
};

export const normalizeVehicleModelSearchQuery = (
  query: string,
  context: VehicleModelSearchContext = {}
) => {
  const result = findVehicleModelInQuery(query, context);
  return result.modelLabel
    ? {
        ...result,
        query: result.query || result.modelLabel
      }
    : result;
};
