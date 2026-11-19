import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoute = pathToFileURL(path.join(root, 'src/work/route.js')).href;

test('parseWorkPath maps home, list, detail, and not-found', async () => {
  const { parseWorkPath } = await import(srcRoute);
  assert.deepEqual(parseWorkPath('/'), { type: 'home' });
  assert.deepEqual(parseWorkPath('/work'), { type: 'work-list' });
  assert.deepEqual(parseWorkPath('/work/'), { type: 'work-list' });
  assert.deepEqual(parseWorkPath('/work/brand-film'), { type: 'work-detail', slug: 'brand-film' });
  assert.deepEqual(parseWorkPath('/work/a%20b'), { type: 'work-detail', slug: 'a b' });
  assert.equal(parseWorkPath('/work/foo.bar').type, 'not-found');
  assert.equal(parseWorkPath('/about').type, 'not-found');
});

test('workRouteToUrl builds path URLs', async () => {
  const { workRouteToUrl } = await import(srcRoute);
  assert.equal(workRouteToUrl({ type: 'home' }), '/');
  assert.equal(workRouteToUrl({ type: 'work-list' }, { search: '?q=brand' }), '/work?q=brand');
  assert.equal(
    workRouteToUrl({ type: 'work-detail', slug: 'acme' }, { search: 'category=film' }),
    '/work/acme?category=film',
  );
});

test('home Work template includes view more CTA to /work', async () => {
  const components = await import('node:fs/promises').then((fs) =>
    fs.readFile(path.join(root, 'dist/components.js'), 'utf8'),
  );
  assert.match(components, /data-work-channel-cta/);
  assert.match(components, /href="\/work"/);
  assert.match(components, /view more/);
});
