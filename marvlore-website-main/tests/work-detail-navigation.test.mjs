import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('work-detail supports path mode and not-found rendering', async () => {
  const source = await readFile(path.join(root, 'dist/work-detail.js'), 'utf8');
  assert.match(source, /pathMode/);
  assert.match(source, /detailPathFor/);
  assert.match(source, /renderNotFound/);
  assert.match(source, /returnUrl/);
  assert.match(source, /applyDetailSeo/);
});

test('work-runtime indexes detail by slug and prefers related next', async () => {
  const source = await readFile(path.join(root, 'dist/cms/work-runtime.js'), 'utf8');
  assert.match(source, /item\.slug === id/);
  assert.match(source, /getRelated/);
  assert.match(source, /detailById\.set\(hydrated\.slug/);
});

test('normalize detail VM includes slug', async () => {
  const source = await readFile(path.join(root, 'dist/cms/work-normalize.js'), 'utf8');
  assert.match(source, /slug: projectDto\.slug/);
});
