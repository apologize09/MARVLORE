import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cms = (name) => pathToFileURL(path.join(root, 'dist/cms', name)).href;

test('read/write work filters round-trip and preserve unrelated params', async () => {
  const {
    readWorkFilters,
    applyFiltersToParams,
    hasActiveFilters,
    emptyWorkFilters,
    filtersEqual,
    toSearchQuery,
  } = await import(cms('work-filter-state.js'));

  const parsed = readWorkFilters(
    '?cmsWork=all&cmsBase=http://127.0.0.1:1337&q=brand&subcategory=film&tags=cgi,3d&sort=latest&page=2',
  );
  assert.equal(parsed.q, 'brand');
  assert.equal(parsed.subcategory, 'film');
  assert.deepEqual(parsed.tags, ['cgi', '3d']);
  assert.equal(parsed.sort, 'latest');
  assert.equal(parsed.page, 2);
  assert.equal(hasActiveFilters(parsed), true);
  assert.equal(hasActiveFilters(emptyWorkFilters()), false);

  const params = applyFiltersToParams(
    new URLSearchParams('cmsWork=all&cmsBase=http://127.0.0.1:1337'),
    parsed,
  );
  assert.equal(params.get('cmsWork'), 'all');
  assert.equal(params.get('cmsBase'), 'http://127.0.0.1:1337');
  assert.equal(params.get('q'), 'brand');
  assert.equal(params.get('tags'), 'cgi,3d');
  assert.equal(params.get('subcategory'), 'film');
  assert.equal(params.get('sort'), 'latest');
  assert.equal(params.get('page'), '2');

  const cleared = applyFiltersToParams(params, emptyWorkFilters());
  assert.equal(cleared.get('cmsWork'), 'all');
  assert.equal(cleared.get('q'), null);
  assert.equal(cleared.get('tags'), null);

  const query = toSearchQuery(parsed, 'zh-CN');
  assert.equal(query.q, 'brand');
  assert.equal(query.subcategory, 'film');
  assert.equal(query.tags, 'cgi,3d');
  assert.equal(query.sort, 'latest');

  assert.equal(filtersEqual(parsed, { ...parsed, tags: ['cgi', '3d'] }), true);
  assert.equal(filtersEqual(parsed, { ...parsed, q: 'other' }), false);
});

test('tags parse accepts comma lists and arrays', async () => {
  const { parseTags, readWorkFilters } = await import(cms('work-filter-state.js'));
  assert.deepEqual(parseTags('a, b,,c'), ['a', 'b', 'c']);
  assert.deepEqual(parseTags(['x', 'y,z']), ['x', 'y', 'z']);
  assert.deepEqual(readWorkFilters('?tags=cgi').tags, ['cgi']);
});

test('getCmsConfig keeps Work filter bar off unless cmsFilter=on', async () => {
  globalThis.location = { search: '?cmsWork=list' };
  globalThis.localStorage = { getItem: () => null };
  const { getCmsConfig } = await import(`${cms('config.js')}?t=${Date.now()}-list`);
  const cfg = getCmsConfig();
  assert.equal(cfg.useList, true);
  // Homepage / default: search+tag bar stays hidden; module kept for later pages
  assert.equal(cfg.useFilter, false);

  globalThis.location = { search: '?cmsWork=categories' };
  const { getCmsConfig: get2 } = await import(`${cms('config.js')}?t=${Date.now()}-cats`);
  assert.equal(get2().useFilter, false);

  globalThis.location = { search: '?cmsWork=categories&cmsFilter=1' };
  const { getCmsConfig: get3 } = await import(`${cms('config.js')}?t=${Date.now()}-flag`);
  assert.equal(get3().useFilter, true);

  globalThis.location = { search: '?cmsWork=all&cmsFilter=on' };
  const { getCmsConfig: get4 } = await import(`${cms('config.js')}?t=${Date.now()}-on`);
  assert.equal(get4().useFilter, true);
});

test('work-api search builds /api/work-search URL', async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return {
      ok: true,
      async json() {
        return { data: [], meta: { total: 0 } };
      },
    };
  };
  const { cacheClear } = await import(cms('work-cache.js'));
  cacheClear();
  const { createWorkApi } = await import(`${cms('work-api.js')}?t=${Date.now()}-api`);
  const api = createWorkApi({
    baseUrl: 'http://cms.test',
    locale: 'zh-CN',
    timeoutMs: 1000,
  });
  await api.search({ q: 'Film', subcategory: 'film', tags: 'cgi,3d', page: 1, pageSize: 12 });
  assert.ok(calls[0].includes('/api/work-search'));
  assert.ok(calls[0].includes('q=Film'));
  assert.ok(calls[0].includes('subcategory=film'));
  assert.ok(calls[0].includes('tags=cgi'));
});
