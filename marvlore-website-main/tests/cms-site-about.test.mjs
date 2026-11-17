import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => readFileSync(path.join(root, rel), 'utf8');

test('cmsSite about flag exists', () => {
  const src = load('dist/cms/config.js');
  assert.match(src, /'about'/);
  assert.match(src, /useAbout/);
});

test('work-api exposes getAboutPage', () => {
  assert.match(load('dist/cms/work-api.js'), /getAboutPage/);
  assert.match(load('dist/cms/work-api.js'), /about-page/);
});

test('work-runtime publishes about payload on window', () => {
  assert.match(load('dist/cms/work-runtime.js'), /__MARVLORE_ABOUT__/);
});

test('reference-data merges collage without dropping geometry fields', async () => {
  const mod = await import('../src/about/reference-data.js');
  globalThis.window = {
    __MARVLORE_ABOUT__: {
      copy: { name: 'X', chineseName: '（测）', partner: 'p', partnerChinese: '中', stats: [{ number: '1', lines: ['a'] }] },
      collage: [{ slotIndex: 0, src: './assets/custom.webp', alt: 'custom', focus: '10% 20%' }],
    },
  };
  const cards = mod.resolveReferenceCards();
  assert.equal(cards[0].src, './assets/custom.webp');
  assert.equal(cards[0].alt, 'custom');
  assert.equal(cards[0].focus, '10% 20%');
  assert.ok('left' in cards[0] && 'top' in cards[0] && 'scatter' in cards[0]);
  assert.equal(cards[1].src, mod.referenceCards[1].src);
  const copy = mod.resolveAboutCopy();
  assert.equal(copy.name, 'X');
  assert.equal(copy.stats[0].number, '1');
});
