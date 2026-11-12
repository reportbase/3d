// Checks that the code 3d.html copies from draw is still identical to draw's.
//
// 3d.html carries three blocks of draw verbatim, each between marker lines: draw's
// curve library tvf-core (the top of draw's tvf-core.js, which draw.html loads; it
// used to be inlined in draw.html), its SVG importer (in draw's svg-import.js, which
// draw.html loads too; it was a stretch of draw.html until 12 Nov 2026, and moved out
// line for line, so the copy here did not change) and from draw.html its .tvf
// reader. The markers still say "copied from draw.html", as the blocks always have:
//     // >>> copied from draw.html, unchanged: NAME
//     ...
//     // <<< end of NAME
// This fails when draw no longer contains a block word for word, which means draw
// changed and 3d.html's copy needs bringing up to date.
//
//   node tests/draw-sync.mjs                         compares with draw on GitHub (main)
//   DRAW_HTML=../draw/draw.html node tests/draw-sync.mjs   compares with a local copy
//                                                    (tvf-core.js and svg-import.js are read from beside it)

import { readFile } from 'node:fs/promises';

const DRAW_RAW = 'https://raw.githubusercontent.com/reportbase/draw/main/';
const mine = await readFile(new URL('../3d.html', import.meta.url), 'utf8');
const local = process.env.DRAW_HTML;
const load = async name => local ? await readFile(new URL(name, new URL('file://' + (local.startsWith('/') ? '' : process.cwd() + '/') + local)), 'utf8').catch(() => '')
                                 : await (await fetch(DRAW_RAW + name)).text().catch(() => '');
const html = await load('draw.html'), core = await load('tvf-core.js'), svg = await load('svg-import.js');
if (html.length < 100000) { console.error('could not load draw.html (' + html.length + ' bytes)'); process.exit(1); }
if (core.length < 10000) { console.error('could not load tvf-core.js (' + core.length + ' bytes)'); process.exit(1); }
if (svg.length < 10000) { console.error('could not load svg-import.js (' + svg.length + ' bytes)'); process.exit(1); }
// one haystack: each block is looked for in any of the files
const draw = html + '\n' + core + '\n' + svg;

const blocks = [...mine.matchAll(/\/\/ >>> copied from draw\.html, unchanged: (\S+)\n([\s\S]*?)\n\/\/ <<< end of \1/g)];
if (!blocks.length) { console.error('no copied blocks found in 3d.html'); process.exit(1); }

let stale = 0;
for (const [, name, body] of blocks){
  if (draw.includes(body)) { console.log(`ok   ${name} (${body.split('\n').length} lines)`); continue; }
  stale++;
  /* say where they part, so the fix is quick to find */
  const firstLine = body.split('\n').find(l => l.trim()) || '';
  const at = draw.indexOf(firstLine);
  let note = 'its first line is no longer in draw.html, tvf-core.js or svg-import.js';
  if (at >= 0){ const a = body.split('\n'), b = draw.slice(at).split('\n'); let i = 0; while (i < a.length && a[i] === b[i]) i++;
    note = `differs from draw at its line ${i + 1}:\n    3d:   ${(a[i] ?? '(end)').slice(0, 120)}\n    draw: ${(b[i] ?? '(end)').slice(0, 120)}`; }
  console.log(`STALE ${name}: ${note}`);
}
if (stale){
  console.error(`\n${stale} block(s) out of date. Copy the current code from draw (draw.html, tvf-core.js for tvf-core, svg-import.js for svg-importer) between the markers in 3d.html, then run npm test.`);
  process.exit(1);
}
console.log('\n3d.html matches draw');
