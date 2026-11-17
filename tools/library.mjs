// THE LIBRARY'S INDEX AND PICTURES (17 Nov 2026). assets/ holds the objects the studio, games and wander share, each a
// .tvf3d. This writes assets/index.json (what the studio's foot lists) and a small picture of each in assets/thumbs/,
// by opening every file in the studio itself and keeping the picture its history takes.
//
//   node tools/library.mjs            (LIBS_DIR=path/node_modules where the CDNs are blocked, as the tests take it)
//
// Run it after adding, changing or removing a file in assets/. A file's kind is read from its name (sun-, planet-,
// moon-, asteroid- are bodies, from wander; the rest are props) unless KINDS below says otherwise.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url)), DIR = join(ROOT, 'assets');
const KINDS = { windmill: ['prop', 'games'], bumper: ['prop', 'games'], rock: ['prop', 'games'], pipe: ['prop', 'games'] };
const kindOf = n => KINDS[n] || (/^(sun|planet|moon|asteroid)-/.test(n) ? [n.split('-')[0], 'wander'] : ['object', '3d']);
const ORDER = ['object', 'prop', 'sun', 'planet', 'moon', 'asteroid'];

const server = createServer(async (q, r) => { try { const p = decodeURIComponent(q.url.split('?')[0]); const b = await readFile(join(ROOT, p === '/' ? '3d.html' : p));
  r.writeHead(200, { 'content-type': { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript' }[extname(p)] || 'application/octet-stream' }); r.end(b); } catch { r.writeHead(404); r.end(); } }).listen(0);
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
const browser = await chromium.launch(launch), page = await browser.newPage({ viewport: { width: 900, height: 600 } });
if (process.env.LIBS_DIR){ const lib = f => readFile(join(process.env.LIBS_DIR, 'three', f));
  await page.route(/three\.js\/r128\/three\.min\.js/, async r => r.fulfill({ contentType: 'text/javascript', body: await lib('build/three.min.js') }));
  for (const c of ['OrbitControls', 'TransformControls']) await page.route(new RegExp(c + '\\.js'), async r => r.fulfill({ contentType: 'text/javascript', body: await lib('examples/js/controls/' + c + '.js') })); }
await page.goto(`http://127.0.0.1:${server.address().port}/3d.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__studio && __studio.S.parts.length > 0, null, { timeout: 60000 });

await mkdir(join(DIR, 'thumbs'), { recursive: true });
const files = (await readdir(DIR)).filter(f => f.endsWith('.tvf3d')).sort(), objects = [];
for (const file of files){
  const name = file.replace(/\.tvf3d$/, ''), [kind, from] = kindOf(name), text = await readFile(join(DIR, file), 'utf8');
  const img = await page.evaluate(async ([text, file]) => { const made = __studio.importTvf3d(text, file, true); __studio.S.sel = null; __studio.select_ && __studio.select_(null);
    { const c = __studio.cam(), o = __studio.orbit(); c.position.lerp(o.target, 0.55); c.updateProjectionMatrix(); o.update(); }      // closer than the studio frames it: a tile's picture is small
    await new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok))); await new Promise(ok => setTimeout(ok, 250));
    const H = __studio.hist(), h = H[__studio.hpos()]; return { img: h && h.img, parts: made.length }; }, [text, file]);
  if (!img.img) throw new Error('no picture of ' + file);
  await writeFile(join(DIR, 'thumbs', name + '.jpg'), Buffer.from(img.img.split(',')[1], 'base64'));
  objects.push({ name, file, kind, from, parts: img.parts, thumb: 'thumbs/' + name + '.jpg' });
  console.log(file, kind, img.parts + ' part' + (img.parts > 1 ? 's' : ''));
}
objects.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.name.localeCompare(b.name));
await writeFile(join(DIR, 'index.json'), JSON.stringify({ format: '3d-library', version: 1, objects }, null, 1) + '\n');
console.log(objects.length + ' objects in assets/index.json');
await browser.close(); server.close();
