import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  parseWorkListQuery,
  resolveLocale,
  parseTags,
} = require('../dist/src/utils/work-query.js');
const { buildCategoryTree, toProjectCardDto, paginationMeta } = require('../dist/src/utils/work-dto.js');

assert.equal(resolveLocale('zh'), 'zh-CN');
assert.equal(resolveLocale('en'), 'en');
assert.throws(() => resolveLocale('fr'), /locale/);

assert.deepEqual(parseTags('a,b , c'), ['a', 'b', 'c']);
const q = parseWorkListQuery({ locale: 'en', page: '2', pageSize: '12', tags: 'cgi,3d', sort: 'latest' });
assert.equal(q.page, 2);
assert.equal(q.start, 12);
assert.deepEqual(q.tags, ['cgi', '3d']);
assert.equal(q.showOnHome, undefined);
const homeQ = parseWorkListQuery({ showOnHome: 'true', pageSize: '12' });
assert.equal(homeQ.showOnHome, true);
assert.equal(parseWorkListQuery({ showOnHome: '0', pageSize: '12' }).showOnHome, false);
assert.throws(() => parseWorkListQuery({ pageSize: '100' }), /pageSize/);
assert.throws(() => parseWorkListQuery({ showOnHome: 'maybe', pageSize: '12' }), /showOnHome/);

const tree = buildCategoryTree([
  { documentId: '1', name: 'A', slug: 'a', level: 1, sortOrder: 0, isActive: true },
  { documentId: '2', name: 'B', slug: 'b', level: 2, sortOrder: 0, isActive: true, parent: { documentId: '1', slug: 'a', name: 'A', level: 1 } },
]);
assert.equal(tree.length, 1);
assert.equal(tree[0].children.length, 1);

const card = toProjectCardDto({
  documentId: 'p1',
  slug: 's',
  title: 'T',
  projectType: 'image',
  coverUrl: '/x.webp',
  tags: [{ slug: 'cgi' }],
  category: { slug: 'film', name: 'Film', parent: { slug: 'creative' } },
});
assert.equal(card.category.parentSlug, 'creative');
assert.deepEqual(card.tags, ['cgi']);
assert.equal(card.cover.url, '/x.webp');
assert.deepEqual(paginationMeta(1, 12, 25), { page: 1, pageSize: 12, pageCount: 3, total: 25 });

console.log('verify-work-query-unit: OK');
