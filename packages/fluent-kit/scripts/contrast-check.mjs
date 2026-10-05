
// WCAG 2.1 contrast gate for TIER 2 semantic tokens. Exit 1 = fail build.
import {readFileSync} from 'node:fs';
const css = readFileSync(new URL('../src/theme.css', import.meta.url),'utf8');
const vars = {};
for (const m of css.matchAll(/(--[A-Za-z0-9-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
function get(n){
  let v = vars[n], d = 0;
  while (typeof v === 'string' && v.startsWith('var(')) {
    if (d++ > 12) return null;
    const r = /var\((--[A-Za-z0-9-]+)\)/.exec(v);
    if (!r) return null;
    v = vars[r[1]];
  }
  return typeof v === 'string' ? v.trim() : null;
}
const rgb = h => {
  h = String(h).trim().replace('#','');
  if (h.length === 3) h = h.split('').map(c=>c+c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0,2,4].map(i => parseInt(h.substr(i,2),16));
};
const lum = a => { const [r,g,b] = a.map(v => { v/=255; return v<=0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; });
  return 0.2126*r + 0.7152*g + 0.0722*b; };
const ratio = (a,b) => { const l1=lum(a), l2=lum(b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };

const PAIRS = [
  ['text-primary','surface-1',4.5,'body text on card'],
  ['text-primary','surface-2',4.5,'body text'],
  ['text-secondary','surface-1',4.5,'secondary text'],
  ['text-tertiary','surface-1',4.5,'tertiary text'],
  ['text-tertiary','surface-2',4.5,'tertiary on surface-2'],
  ['text-disabled','surface-1',3.0,'disabled text'],
  ['text-on-accent','accent',4.5,'button label'],
  ['text-on-accent','accent-hover',4.5,'button label hover'],
  ['text-on-accent','danger-strong',4.5,'danger button label'],
  ['accent','accent-subtle',4.5,'accent text on subtle'],
  ['success-strong','success-subtle',4.5,'Badge tone=success'],
  ['warning-strong','warning-subtle',4.5,'Badge tone=warning'],
  ['danger-strong','danger-subtle',4.5,'Badge tone=danger'],
  ['info-strong','info-subtle',4.5,'Badge tone=info'],
  ['border-default','surface-1',3.0,'info-bearing border (1.4.11)'],
  ['border-strong','surface-1',3.0,'strong border'],
];
let fail = 0;
console.log('| Token pair | Resolved | Ratio | Min | Note | Result |');
console.log('|---|---|---|---|---|---|');
for (const [f,b,min,note] of PAIRS) {
  const hf = get('--fluent-'+f), hb = get('--fluent-'+b);
  const A = hf && rgb(hf), B = hb && rgb(hb);
  const r = A && B ? ratio(A,B) : null;
  const ok = r !== null && r >= min;
  if (!ok) fail++;
  console.log(`| \`${f} / ${b}\` | ${A&&B ? hf+' on '+hb : 'UNRESOLVED'} | ${r===null?'—':r.toFixed(2)} | ${min} | ${note} | ${ok?'PASS':'**FAIL**'} |`);
}
console.log('\n' + (fail ? `FAILURES: ${fail}/${PAIRS.length}` : `ALL PASS (${PAIRS.length} pairs)`));
process.exit(fail ? 1 : 0);
