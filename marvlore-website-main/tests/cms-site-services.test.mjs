import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => readFileSync(path.join(root, rel), 'utf8');

test('cmsSite services flag is recognized in config', () => {
  const src = load('dist/cms/config.js');
  assert.match(src, /services/);
  assert.match(src, /useServices/);
});

test('work-api exposes getServices', () => {
  assert.match(load('dist/cms/work-api.js'), /getServices/);
  assert.match(load('dist/cms/work-api.js'), /service-items/);
});

test('static bundle includes nine services', async () => {
  const { buildStaticBundle } = await import('../dist/cms/work-fallback.js');
  const bundle = buildStaticBundle();
  assert.equal(bundle.services.length, 9);
  assert.equal(bundle.services[0].id, 'film');
});

test('work-runtime publishes service items on window', () => {
  assert.match(load('dist/cms/work-runtime.js'), /__MARVLORE_SERVICE_ITEMS__/);
});

test('experience resolves items from window without importing work-runtime', () => {
  const src = load('src/services/experience.jsx');
  assert.match(src, /__MARVLORE_SERVICE_ITEMS__/);
  assert.doesNotMatch(src, /from ['"][^'"]*work-runtime/);
});
