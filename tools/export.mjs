// Exports observatory.b3d.json to the playable site in this repo's root, exactly like the IDE's
// Export button (index.html, star-observatory.js and the installable-app files).
//   node tools/export.mjs ../demo_blocky_3d
// The argument is a checkout of the blocky3D engine repo (it uses its runtime and exporter).
// Or skip this: open the cart in the IDE, press Export, and unzip the result into the repo root.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const engine = pathToFileURL(resolve(process.argv[2] || '../demo_blocky_3d') + '/');
const root = new URL('../', import.meta.url);
const { indexHtml, gameJs, gameSlug, checkSyntax, appFiles } = await import(new URL('js/export.js', engine));

const cart = JSON.parse(readFileSync(new URL('observatory.b3d.json', root), 'utf8'));
checkSyntax(cart.code);
const runtime = readFileSync(new URL('runtime/blocky3d.runtime.js', engine), 'utf8');
const slug = gameSlug(cart.name);
const js = gameJs(cart, runtime);
writeFileSync(new URL('index.html', root), indexHtml('Star Observatory', slug + '.js'));
writeFileSync(new URL(slug + '.js', root), js);
for (const f of await appFiles(cart, slug, js)) writeFileSync(new URL(f.name, root), f.data);
console.log(`exported ${slug}.js (${(js.length / 1024) | 0} KB) and index.html`);
