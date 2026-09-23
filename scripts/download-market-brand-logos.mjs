import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const outputDir = path.join(root, 'public', 'brand-logos');
const catalogFiles = [
  'src/config/electronicsCatalog.ts',
  'src/config/transportCatalog.ts',
  'src/config/marketOtherCatalog.ts',
  'src/config/marketSportsCatalog.ts'
];
let iconifyCollection = null;
let nextCommonsRequestAt = 0;
let commonsApiDisabled = false;

const simpleIconAliases = {
  'H&M Home': 'handm',
  'H&M Kids': 'handm',
  HM: 'handm',
  'Zara Home': 'zara',
  'Zara Kids': 'zara',
  'Uniqlo Kids': 'uniqlo',
  NikeSwim: 'nike',
  'Nike Kids': 'nike',
  AdidasCombat: 'adidas',
  'Adidas Kids': 'adidas',
  'Levi Strauss': 'levis',
  'Black+Decker': 'blackanddecker',
  BlackDecker: 'blackanddecker',
  'The North Face': 'thenorthface',
  "L'Oreal": 'loreal',
  "Carter's": 'carters',
  'La Roche-Posay': 'larocheposay',
  FaberCastell: 'fabercastell',
  MichaelKors: 'michaelkors',
  KateSpade: 'katespade',
  DanielWellington: 'danielwellington',
  PopMart: 'popmart',
  GoodSmile: 'goodsmilecompany'
};

const asciiName = name => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const fileSlug = name => asciiName(name)
  .replace(/&/g, 'and')
  .replace(/\+/g, 'plus')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const simpleSlug = name => asciiName(name)
  .replace(/&/g, 'and')
  .replace(/\+/g, 'plus')
  .replace(/[^a-z0-9]/g, '');

const readBrands = async () => {
  const brands = new Map();

  for (const relativePath of catalogFiles) {
    const sourceText = await fs.readFile(path.join(root, relativePath), 'utf8');
    const source = ts.createSourceFile(relativePath, sourceText, ts.ScriptTarget.Latest, true);

    const visit = node => {
      if (
        ts.isPropertyAssignment(node)
        && ts.isArrayLiteralExpression(node.initializer)
        && ts.isCallExpression(node.parent?.parent)
        && node.parent.parent.expression.getText(source) === 'catalog'
      ) {
        const name = node.name.getText(source).replace(/^['"]|['"]$/g, '');
        brands.set(name, brands.get(name) || { name });
      }

      if (ts.isObjectLiteralExpression(node)) {
        const values = {};
        for (const property of node.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const key = property.name.getText(source).replace(/^['"]|['"]$/g, '');
          if (ts.isStringLiteralLike(property.initializer)) values[key] = property.initializer.text;
          if (key === 'models' && ts.isArrayLiteralExpression(property.initializer)) values.models = true;
        }
        if (values.name && values.models) {
          const current = brands.get(values.name) || { name: values.name };
          brands.set(values.name, {
            ...current,
            logoSlug: values.logoSlug || current.logoSlug,
            logoUrl: values.logoUrl || current.logoUrl
          });
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(source);
  }

  return [...brands.values()];
};

const fetchSvg = async url => {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'BaliBase brand asset fetcher' },
    redirect: 'follow',
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) return null;
  const body = await response.text();
  return /<svg[\s>]/i.test(body) ? body.slice(body.search(/<svg[\s>]/i)) : null;
};

const loadIconifyCollection = async () => {
  try {
    const response = await fetch('https://cdn.jsdelivr.net/npm/@iconify-json/logos@latest/icons.json', {
      headers: { 'User-Agent': 'BaliBase brand asset fetcher' },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) return {};
    return (await response.json()).icons || {};
  } catch {
    return {};
  }
};

const iconifySvg = (slug) => {
  const icon = iconifyCollection?.[slug];
  if (!icon?.body) return null;
  const width = icon.width || 256;
  const height = icon.height || 256;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${icon.body}</svg>`;
};

const commonsSvg = async brandName => {
  const fileName = brandName.replace(/\s+/g, '_');
  for (const candidate of [`${fileName}_logo.svg`, `${fileName}_wordmark.svg`]) {
    const url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(candidate)}`;
    try {
      const svg = await fetchSvg(url);
      if (svg) return { svg, url };
    } catch {
      // Fall through to the Commons search API.
    }
  }

  if (commonsApiDisabled) return null;
  const brandPattern = new RegExp(`(^|[^a-z0-9])${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '[^a-z0-9]+')}([^a-z0-9]|$)`);
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `"${brandName}" logo filetype:svg`,
    gsrnamespace: '6',
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url',
    format: 'json',
    origin: '*'
  });

  try {
    const delay = Math.max(0, nextCommonsRequestAt - Date.now());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    nextCommonsRequestAt = Date.now() + 900;
    let response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': 'BaliBase/1.0 (brand logo asset fetcher)' },
      signal: AbortSignal.timeout(15000)
    });
    if (response.status === 429) {
      commonsApiDisabled = true;
      return null;
    }
    if (!response.ok) return null;
    const pages = Object.values((await response.json()).query?.pages || {})
      .filter(page => page.title?.toLowerCase().endsWith('.svg') && page.imageinfo?.[0]?.url)
      .filter(page => brandPattern.test(page.title.toLowerCase().replace(/^file:/, '')))
      .sort((left, right) => {
        const score = page => {
          const title = page.title.toLowerCase();
          return (title.includes('logo') ? 3 : 0)
            + (title.includes('wordmark') ? 2 : 0)
            - (title.includes('old') || title.includes('former') ? 3 : 0);
        };
        return score(right) - score(left);
      });
    if (!pages.length) return null;
    const url = pages[0].imageinfo[0].url;
    const svg = await fetchSvg(url);
    return svg ? { svg, url } : null;
  } catch {
    return null;
  }
};

const downloadBrand = async brand => {
  const destination = path.join(outputDir, `${fileSlug(brand.name)}.svg`);
  try {
    await fs.access(destination);
    return { status: 'existing', name: brand.name };
  } catch {
    // Continue with download candidates.
  }

  const iconSlug = brand.logoSlug || simpleIconAliases[brand.name] || simpleSlug(brand.name);
  const iconifySlug = fileSlug(brand.name);
  const candidates = [
    brand.logoUrl,
    iconSlug ? `https://cdn.simpleicons.org/${iconSlug}/1E293B` : null
  ].filter(Boolean);

  for (const url of [...new Set(candidates)]) {
    try {
      const svg = await fetchSvg(url);
      if (!svg) continue;
      await fs.writeFile(destination, svg, 'utf8');
      return { status: 'downloaded', name: brand.name, url };
    } catch {
      // Try the next public vector source.
    }
  }

  const bundledSvg = iconifySvg(iconifySlug) || iconifySvg(iconSlug);
  if (bundledSvg) {
    await fs.writeFile(destination, bundledSvg, 'utf8');
    return { status: 'downloaded', name: brand.name, url: `iconify:logos:${iconifySlug}` };
  }

  const commonsResult = await commonsSvg(brand.name);
  if (commonsResult) {
    await fs.writeFile(destination, commonsResult.svg, 'utf8');
    return { status: 'downloaded', name: brand.name, url: commonsResult.url };
  }

  return { status: 'missing', name: brand.name };
};

await fs.mkdir(outputDir, { recursive: true });
iconifyCollection = await loadIconifyCollection();
const brands = await readBrands();
const results = [];
const concurrency = 4;

for (let index = 0; index < brands.length; index += concurrency) {
  results.push(...await Promise.all(brands.slice(index, index + concurrency).map(downloadBrand)));
}

const counts = results.reduce((summary, result) => {
  summary[result.status] = (summary[result.status] || 0) + 1;
  return summary;
}, {});
const missing = results.filter(result => result.status === 'missing').map(result => result.name);

console.log(JSON.stringify({ total: brands.length, ...counts, missing }, null, 2));
