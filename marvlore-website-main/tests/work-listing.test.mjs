import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('projectDtoToCard maps slug cover and category', async () => {
  const mod = await import(pathToFileURL(path.join(root, 'src/work/project-card.js')).href);
  const card = mod.projectDtoToCard({
    slug: 'brand-film',
    legacyId: 'legacy-1',
    title: 'Brand Film',
    summary: 'A short film',
    projectYear: 2026,
    focusX: 40,
    category: { slug: 'film', name: 'Film', nameCn: '影视' },
    coverUrl: '/uploads/cover.webp',
    cover: { width: 1200, height: 800, alternativeText: 'cover' },
  });
  assert.equal(card.slug, 'brand-film');
  assert.equal(card.categorySlug, 'film');
  assert.equal(card.categoryLabel, '影视');
  assert.equal(card.coverUrl, './uploads/cover.webp');
  assert.match(mod.renderProjectCard(card), /href="\/work\/brand-film"/);
  assert.match(mod.renderProjectCard(card), /loading="lazy"/);
  assert.match(mod.renderProjectCard(card), /aspect-ratio:1200 \/ 800/);
});

test('built work-listing exposes mountWorkListingPage', async () => {
  const listing = await import(pathToFileURL(path.join(root, 'dist/work-listing.js')).href);
  assert.equal(typeof listing.mountWorkListingPage, 'function');
  assert.equal(typeof listing.applyWorkListingSeo, 'function');
});
