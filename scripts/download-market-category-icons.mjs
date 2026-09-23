import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const sourcePath = path.join(root, 'src', 'app', 'menu.ts');
const outputDir = path.join(root, 'public', 'category-icons');
const sourceText = await fs.readFile(sourcePath, 'utf8');
const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true);
const icons = new Set();

const toFileName = icon => Array.from(icon)
  .map(character => character.codePointAt(0).toString(16))
  .filter(codePoint => codePoint !== 'fe0f')
  .join('-');

const visit = node => {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'ADS_L3_SUBCATEGORIES' && node.initializer) {
    const collectIcons = child => {
      if (ts.isPropertyAssignment(child) && child.name.getText(source) === 'icon' && ts.isStringLiteralLike(child.initializer)) {
        icons.add(child.initializer.text);
      }
      ts.forEachChild(child, collectIcons);
    };
    collectIcons(node.initializer);
  }
  ts.forEachChild(node, visit);
};

visit(source);
await fs.mkdir(outputDir, { recursive: true });

const results = await Promise.all([...icons].map(async icon => {
  const fileName = `${toFileName(icon)}.svg`;
  const destination = path.join(outputDir, fileName);
  try {
    await fs.access(destination);
    return { status: 'existing' };
  } catch {
    // Download the missing transparent SVG.
  }

  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${fileName}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return { status: 'missing' };
    const svg = await response.text();
    if (!/<svg[\s>]/i.test(svg)) return { status: 'missing' };
    await fs.writeFile(destination, svg, 'utf8');
    return { status: 'downloaded' };
  } catch {
    return { status: 'missing' };
  }
}));

const counts = results.reduce((summary, result) => {
  summary[result.status] = (summary[result.status] || 0) + 1;
  return summary;
}, {});
console.log(JSON.stringify({ total: icons.size, ...counts }, null, 2));
