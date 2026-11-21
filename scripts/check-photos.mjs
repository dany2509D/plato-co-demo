// Verifica fotos del menú: node scripts/check-photos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const photosDir = path.join(root, 'src/assets/photos');
const manifest = JSON.parse(fs.readFileSync(path.join(photosDir, 'manifest.json'), 'utf8'));
const seed = fs.readFileSync(path.join(root, 'src/data/seed.js'), 'utf8');

const block = seed.split('const MENU = [')[1].split('\n];')[0];
const names = [...block.matchAll(/^\s*\['([^']+)'/gm)].map((m) => m[1]);
const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ids = names.map((n, i) => `prod-${String(i + 1).padStart(2, '0')}-${slug(n)}`);

const CREDIT = ['author', 'source', 'pageUrl', 'license', 'licenseUrl'];
const errors = [];
let total = 0, max = 0, maxName = '', count = 0;
const sizes = { menu: 0, hero: 0 };
const missing = [];

function checkEntry(group, key, e) {
  if (!e) { errors.push(`${group}/${key}: sin entrada en manifest`); return false; }
  if (!e.file) errors.push(`${group}/${key}: falta "file"`);
  if (!e.alt) errors.push(`${group}/${key}: falta "alt"`);
  for (const f of CREDIT) if (!e.credit || !e.credit[f]) errors.push(`${group}/${key}: credit.${f} vacío`);
  if (group === 'hero' && (!e.width || !e.height)) errors.push(`${group}/${key}: faltan width/height`);
  const p = path.join(photosDir, e.file || '');
  if (!e.file || !fs.existsSync(p)) { errors.push(`${group}/${key}: archivo no existe (${e.file})`); return false; }
  const s = fs.statSync(p).size;
  total += s; count++; sizes[group] += s;
  if (s > max) { max = s; maxName = e.file; }
  const limit = group === 'menu' ? 70000 : 220000;
  if (s > limit) errors.push(`${group}/${key}: ${s} B supera ${limit} B`);
  return true;
}

let menuOk = 0;
for (const id of ids) {
  if (checkEntry('menu', id, manifest.menu[id])) menuOk++; else missing.push(id);
}
for (const k of Object.keys(manifest.menu)) if (!ids.includes(k)) errors.push(`menu/${k}: id no existe en seed.js`);
let heroOk = 0;
for (const [k, e] of Object.entries(manifest.hero)) if (checkEntry('hero', k, e)) heroOk++;

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`Productos en seed.js: ${ids.length}`);
console.log(`Fotos de menú OK: ${menuOk}/${ids.length}${missing.length ? ' (faltan: ' + missing.join(', ') + ')' : ''}`);
console.log(`Fotos hero/ambiente OK: ${heroOk}/${Object.keys(manifest.hero).length}`);
console.log(`Tamaño total: ${(total / 1048576).toFixed(2)} MB en ${count} archivos (menú ${kb(sizes.menu)}, hero ${kb(sizes.hero)})`);
console.log(`Archivo más grande: ${maxName} (${kb(max)})`);
console.log(`Compartidas: ${Object.values(manifest.menu).filter((e) => e.shared).length}`);
if (total > 4.5 * 1048576) errors.push('Total supera 4.5 MB');
if (errors.length) { console.log('\nERRORES:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log('\nTodo en orden.');
