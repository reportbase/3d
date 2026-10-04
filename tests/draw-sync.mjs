// Checks that the code 3d.html copies from draw.html is still identical to draw's.
//
// 3d.html carries three blocks of draw.html verbatim (draw's curve library
// tvf-core, its SVG importer and its .tvf reader), each between marker lines:
//     // >>> copied from draw.html, unchanged: NAME
//     ...
//     // <<< end of NAME
// This fails when draw.html no longer contains a block word for word, which means
// draw changed and 3d.html's copy needs bringing up to date.
//
//   node tests/draw-sync.mjs                         compares with draw on GitHub (main)
//   DRAW_HTML=../draw/draw.html node tests/draw-sync.mjs   compares with a local copy

import { readFile } from 'node:fs/promises';

const DRAW_URL = 'https://raw.githubusercontent.com/reportbase/draw/main/draw.html';
const mine = await readFile(new URL('../3d.html', import.meta.url), 'utf8');
const draw = process.env.DRAW_HTML ? await readFile(process.env.DRAW_HTML, 'utf8')
                                   : await (await fetch(DRAW_URL)).text();
if (draw.length < 100000) { console.error('could not load draw.html (' + draw.length + ' bytes)'); process.exit(1); }

const blocks = [...mine.matchAll(/\/\/ >>> copied from draw\.html, unchanged: (\S+)\n([\s\S]*?)\n\/\/ <<< end of \1/g)];
if (!blocks.length) { console.error('no copied blocks found in 3d.html'); process.exit(1); }

let stale = 0;
for (const [, name, body] of blocks){
  if (draw.includes(body)) { console.log(`ok   ${name} (${body.split('\n').length} lines)`); continue; }
  stale++;
  /* say where they part, so the fix is quick to find */
  const firstLine = body.split('\n').find(l => l.trim()) || '';
  const at = draw.indexOf(firstLine);
  let note = 'its first line is no longer in draw.html';
  if (at >= 0){ const a = body.split('\n'), b = draw.slice(at).split('\n'); let i = 0; while (i < a.length && a[i] === b[i]) i++;
    note = `differs from draw.html at its line ${i + 1}:\n    3d:   ${(a[i] ?? '(end)').slice(0, 120)}\n    draw: ${(b[i] ?? '(end)').slice(0, 120)}`; }
  console.log(`STALE ${name}: ${note}`);
}
if (stale){
  console.error(`\n${stale} block(s) out of date. Copy the current code from draw.html between the markers in 3d.html, then run npm test.`);
  process.exit(1);
}
console.log('\n3d.html matches draw.html');
