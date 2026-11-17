import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => readFileSync(path.join(root, rel), 'utf8');

test('cmsSite hero flag exists', () => {
  const src = load('dist/cms/config.js');
  assert.match(src, /'hero'/);
  assert.match(src, /useHero/);
});

test('work-api exposes getHeroItems', () => {
  assert.match(load('dist/cms/work-api.js'), /getHeroItems/);
  assert.match(load('dist/cms/work-api.js'), /hero-items/);
});

test('static bundle includes hero projects and orbit images', async () => {
  const { buildStaticBundle } = await import('../dist/cms/work-fallback.js');
  const bundle = buildStaticBundle();
  assert.equal(bundle.heroProjects.length, 8);
  assert.equal(bundle.heroImages.length, 8);
});

test('work-runtime publishes hero arrays on window', () => {
  const src = load('dist/cms/work-runtime.js');
  assert.match(src, /__MARVLORE_HERO_PROJECTS__/);
  assert.match(src, /__MARVLORE_HERO_IMAGES__/);
});

test('hero-entry resolves projects from window without importing work-runtime', () => {
  const src = load('src/hero/hero-entry.jsx');
  assert.match(src, /__MARVLORE_HERO_PROJECTS__/);
  assert.doesNotMatch(src, /from ['"][^'"]*work-runtime/);
});

test('app.js uses getHeroProjects for gallery brand group', () => {
  assert.match(load('dist/app.js'), /getHeroProjects/);
});
