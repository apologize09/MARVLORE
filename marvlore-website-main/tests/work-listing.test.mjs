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

test('tagsForActiveCategory filters by scoped category', async () => {
  const helpers = await import(pathToFileURL(path.join(root, 'src/work/listing-tags.js')).href);
  const tags = [
    { slug: 'cgi', name: 'CGI', categorySlugs: ['film'] },
    { slug: 'brand-visual', name: '品牌视觉', categories: [{ slug: 'visual' }] },
    { slug: 'loose', name: 'Loose', categorySlugs: [] },
  ];
  assert.deepEqual(
    helpers.tagsForActiveCategory(tags, 'film').map((t) => t.slug),
    ['cgi'],
  );
  assert.deepEqual(
    helpers.tagsForActiveCategory(tags, 'visual').map((t) => t.slug),
    ['brand-visual'],
  );
  assert.equal(helpers.tagsForActiveCategory(tags, 'all').length, 3);
  assert.deepEqual(helpers.pruneSelectedTags(['cgi', 'brand-visual'], tags.slice(0, 1)), ['cgi']);
});

test('inferTagCategoriesFromProjects maps project tags to L2 slugs', async () => {
  const helpers = await import(pathToFileURL(path.join(root, 'src/work/listing-tags.js')).href);
  const map = helpers.inferTagCategoriesFromProjects([
    { category: { slug: 'film' }, tags: ['cgi', '3d-animation'] },
    { category: { slug: 'visual' }, tags: [{ slug: 'brand-visual' }] },
  ]);
  assert.ok(map.get('cgi').has('film'));
  assert.ok(map.get('brand-visual').has('visual'));
});
