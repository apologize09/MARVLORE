import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cms = (name) => pathToFileURL(path.join(root, 'dist/cms', name)).href;

function stubBrowser({ search = '', storage = {}, hostname = '127.0.0.1' } = {}) {
  globalThis.location = { search, hostname };
  globalThis.localStorage = {
    getItem: (key) => (key in storage ? storage[key] : null),
    setItem: (key, value) => {
      storage[key] = String(value);
    },
  };
}

test('normalizeCategoryToOverview maps DTO onto overview ViewModel', async () => {
  const { normalizeCategoryToOverview } = await import(cms('work-normalize.js'));
  const result = normalizeCategoryToOverview(
    {
      slug: 'film',
      name: '影像创作',
      description: 'CMS description',
      coverUrl: 'assets/work/covers/film.webp',
    },
    {
      film: {
        id: 'film',
        eyebrow: 'Film',
        title: 'Film',
        cn: '影像',
        description: 'static',
        image: 'work/covers/film.webp',
        tags: ['Motion'],
        imageFit: 'cover',
        imagePosition: '50% 40%',
      },
    },
  );
  assert.equal(result.id, 'film');
  assert.equal(result.cn, '影像');
  assert.equal(result.description, 'CMS description');
  assert.equal(result.image, 'work/covers/film.webp');
  assert.equal(result.eyebrow, 'Film');
  assert.deepEqual(result.tags, ['Motion']);
});

test('normalizeProjectToReelItem and detail keep legacyId + media paths', async () => {
  const {
    normalizeProjectToReelItem,
    normalizeProjectToDetail,
    buildDetailList,
  } = await import(cms('work-normalize.js'));
  const dto = {
    legacyId: 'reel-aurora',
    slug: 'aurora',
    title: 'Aurora',
    subtitle: 'Brand film',
    summary: 'Summary',
    description: 'Intro copy',
    eyebrow: 'Featured',
    tags: [{ name: 'Film' }, 'Motion'],
    category: { slug: 'film' },
    coverUrl: './assets/work/aurora.jpg',
    thumbnailUrl: './assets/work/aurora-thumb.jpg',
    homePreviewVideoUrl: './assets/hero-video/aurora-home-360p.mp4',
    previewVideoUrl: './assets/hero-video/aurora-preview.mp4',
    videoUrl: './assets/hero-video/aurora.mp4',
    focusX: 42,
    cover: { alternativeText: 'Aurora cover', width: 1600, height: 900 },
    mediaItems: [
      {
        blockType: 'image',
        imageUrl: './assets/work/aurora-1.jpg',
        altText: 'Still 1',
        image: { width: 1200, height: 800 },
      },
      {
        blockType: 'video',
        videoUrl: './assets/hero-video/aurora-clip.mp4',
        posterUrl: './assets/work/aurora.jpg',
        caption: 'Clip',
      },
    ],
  };
  const reel = normalizeProjectToReelItem(dto);
  assert.equal(reel.id, 'reel-aurora');
  assert.equal(reel.category, 'film');
  assert.equal(reel.src, './assets/work/aurora.jpg');
  assert.equal(reel.thumbnailSrc, './assets/work/aurora.jpg');
  assert.equal(reel.homePreviewSrc, './assets/hero-video/aurora-home-360p.mp4');
  assert.equal(reel.previewSrc, './assets/hero-video/aurora-home-360p.mp4');
  assert.equal(reel.focusX, 42);

  const detail = normalizeProjectToDetail(dto, { index: 1, total: 2, nextId: 'next' });
  assert.equal(detail.id, 'reel-aurora');
  assert.equal(detail.cover.type, 'video');
  assert.equal(detail.media.length, 2);
  assert.equal(detail.media[0].type, 'image');
  assert.equal(detail.media[1].type, 'video');
  assert.deepEqual(detail.tags, ['Film', 'Motion']);

  const list = buildDetailList([dto, { ...dto, legacyId: 'reel-b', slug: 'b', title: 'B', videoUrl: null }]);
  assert.equal(list[0].nextId, 'reel-b');
  assert.equal(list[1].nextId, 'reel-aurora');
  assert.equal(list[1].cover.type, 'image');
});

test('work-cache stores and expires entries', async () => {
  const { cacheClear, cacheGet, cacheSet } = await import(cms('work-cache.js'));
  cacheClear();
  cacheSet(['a'], { ok: 1 }, 60_000);
  assert.deepEqual(cacheGet(['a']), { ok: 1 });
  cacheSet(['b'], { ok: 2 }, 1);
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(cacheGet(['b']), null);
  cacheClear();
});

test('static fallback bundle matches Work ViewModel shape', async () => {
  const { buildStaticBundle } = await import(cms('work-fallback.js'));
  const bundle = buildStaticBundle();
  assert.equal(bundle.source, 'static');
  assert.ok(Array.isArray(bundle.projects) && bundle.projects.length >= 4);
  assert.ok(Array.isArray(bundle.workReelItems) && bundle.workReelItems.length > 0);
  assert.ok(bundle.workReelOptions && typeof bundle.workReelOptions === 'object');
  assert.ok(Array.isArray(bundle.workDetailCases) && bundle.workDetailCases.length > 0);
  assert.ok(bundle.detailById instanceof Map);
  const first = bundle.projects[0];
  assert.ok(first.id && first.title && first.cn);
  const detail = bundle.workDetailCases[0];
  assert.ok(detail.id && detail.cover && Array.isArray(detail.tags));
});

test('getCmsConfig defaults to all and stages progressively', async () => {
  stubBrowser({ search: '' });
  const { getCmsConfig } = await import(`${cms('config.js')}?t=${Date.now()}-1`);
  const defaults = getCmsConfig();
  assert.equal(defaults.stage, 'all');
  assert.equal(defaults.siteStage, 'all');
  assert.equal(defaults.enabled, true);
  assert.equal(defaults.baseUrl, 'http://127.0.0.1:1337');

  stubBrowser({ search: '?cmsWork=categories&cmsBase=http://cms.test:1337' });
  const { getCmsConfig: get2 } = await import(`${cms('config.js')}?t=${Date.now()}-2`);
  const cats = get2();
  assert.equal(cats.stage, 'categories');
  assert.equal(cats.useCategories, true);
  assert.equal(cats.useList, false);
  assert.equal(cats.useDetail, false);
  assert.equal(cats.baseUrl, 'http://cms.test:1337');

  stubBrowser({ search: '?cmsWork=off&cmsSite=off' });
  const { getCmsConfig: get3 } = await import(`${cms('config.js')}?t=${Date.now()}-3`);
  const off = get3();
  assert.equal(off.stage, 'off');
  assert.equal(off.enabled, false);
});

test('getCmsConfig uses admin.marvlore.com on public hosts and ignores loopback override', async () => {
  stubBrowser({ search: '', hostname: 'www.marvlore.com' });
  const { getCmsConfig } = await import(`${cms('config.js')}?t=${Date.now()}-prod`);
  assert.equal(getCmsConfig().baseUrl, 'https://admin.marvlore.com');

  stubBrowser({
    search: '?cmsBase=http://127.0.0.1:1337',
    hostname: 'www.marvlore.com',
  });
  const { getCmsConfig: getLoop } = await import(`${cms('config.js')}?t=${Date.now()}-loop`);
  assert.equal(getLoop().baseUrl, 'https://admin.marvlore.com');
});

test('resolveWorkBundle stays on static when flag is off', async () => {
  stubBrowser({ search: '?cmsWork=off&cmsSite=off' });
  const { resolveWorkBundle } = await import(`${cms('work-loader.js')}?t=${Date.now()}-off`);
  const bundle = await resolveWorkBundle();
  assert.equal(bundle.source, 'static');
  assert.ok(bundle.projects.length >= 4);
});

test('resolveWorkBundle categories stage merges CMS tree over static order', async () => {
  stubBrowser({ search: '?cmsWork=categories&cmsBase=http://cms.test' });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.match(String(url), /\/api\/work-categories/);
    return {
      ok: true,
      async json() {
        return {
          data: [
            {
              slug: 'work',
              level: 1,
              children: [
                {
                  slug: 'film',
                  level: 2,
                  name: '影像创作 CMS',
                  description: 'From CMS',
                  coverUrl: 'assets/work/covers/film.webp',
                },
              ],
            },
          ],
        };
      },
    };
  };
  try {
    const { cacheClear } = await import(cms('work-cache.js'));
    cacheClear();
    const { resolveWorkBundle } = await import(`${cms('work-loader.js')}?t=${Date.now()}-cats`);
    const bundle = await resolveWorkBundle();
    assert.equal(bundle.source, 'cms:categories');
    const film = bundle.projects.find((p) => p.id === 'film');
    assert.ok(film);
    assert.equal(film.description, 'From CMS');
    assert.equal(film.title, '影像创作 CMS');
    // reel stays static at categories stage
    assert.ok(bundle.workReelItems.length > 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resolveWorkBundle falls back to static when CMS request fails', async () => {
  stubBrowser({ search: '?cmsWork=list&cmsBase=http://cms.down' });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError('network down');
  };
  try {
    const { cacheClear } = await import(cms('work-cache.js'));
    cacheClear();
    const { resolveWorkBundle } = await import(`${cms('work-loader.js')}?t=${Date.now()}-fail`);
    const bundle = await resolveWorkBundle();
    assert.equal(bundle.source, 'static-fallback');
    assert.ok(bundle.projects.length >= 4);
    assert.ok(bundle.error);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('bootWorkBundle installs runtime getters used by Work consumers', async () => {
  stubBrowser({ search: '?cmsWork=off&cmsSite=off' });
  const runtime = await import(`${cms('work-runtime.js')}?t=${Date.now()}-boot`);
  const installed = await runtime.bootWorkBundle();
  assert.equal(installed.source, 'static');
  assert.equal(runtime.getProjects(), installed.projects);
  assert.equal(runtime.getWorkReelItems(), installed.workReelItems);
  const sample = installed.workDetailCases[0];
  assert.deepEqual(runtime.getWorkDetail(sample.id), sample);
});
