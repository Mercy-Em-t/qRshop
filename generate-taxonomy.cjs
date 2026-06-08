const XLSX = require('xlsx');
const fs = require('fs');
const wb = XLSX.readFile('taxonomy-with-ids.en-GB.xls');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, {header:1});

const entries = [];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length < 2) continue;
  const id = parseInt(r[0]);
  if (isNaN(id)) continue;
  const levels = r.slice(1).map(x => (x || '').toString().trim()).filter(Boolean);
  if (levels.length === 0) continue;
  entries.push([id, ...levels]);
}

const lines = [
  "export const TAXONOMY = " + JSON.stringify(entries) + ";",
  "export function getL1Categories() { return [...new Set(TAXONOMY.map(e => e[1]))].sort(); }",
  "export function getL2Categories(l1) { if (!l1) return []; return [...new Set(TAXONOMY.filter(e => e[1] === l1 && e.length >= 3).map(e => e[2]))].filter(Boolean).sort(); }",
  "export function getL3Categories(l1, l2) { if (!l1 || !l2) return []; return [...new Set(TAXONOMY.filter(e => e[1] === l1 && e[2] === l2 && e.length >= 4).map(e => e[3]))].filter(Boolean).sort(); }",
  "export function getL4Categories(l1, l2, l3) { if (!l1 || !l2 || !l3) return []; return [...new Set(TAXONOMY.filter(e => e[1] === l1 && e[2] === l2 && e[3] === l3 && e.length >= 5).map(e => e[4]))].filter(Boolean).sort(); }",
  "export function findLeafEntry(l1, l2, l3, l4) { let candidates = TAXONOMY.filter(e => e[1] === l1); if (l2) candidates = candidates.filter(e => e[2] === l2); if (l3) candidates = candidates.filter(e => e[3] === l3); if (l4) candidates = candidates.filter(e => e[4] === l4); candidates.sort((a, b) => b.length - a.length); return candidates[0] || null; }",
  "export function findById(id) { return TAXONOMY.find(e => e[0] === Number(id)) || null; }",
  "export function entryToPath(entry) { if (!entry) return ''; return entry.slice(1).join(' > '); }"
];

fs.mkdirSync('src/data', {recursive: true});
fs.writeFileSync('src/data/google-taxonomy.js', lines.join('\n'), 'utf8');
console.log('Done generating taxonomy data.');
