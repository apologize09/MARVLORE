import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cms = (name) => pathToFileURL(path.join(root, 'dist/cms', name)).href;

test('normalizeLocale maps zh and en variants', async () => {
  const { normalizeLocale, WORK_LOCALES } = await import(cms('locale.js'));
  assert.equal(normalizeLocale('zh'), 'zh-CN');
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('nope'), 'zh-CN');
  assert.deepEqual(
    WORK_LOCALES.map((l) => l.code),
    ['zh-CN', 'en'],
  );
});

test('applyWorkSeo writes title description and og tags', async () => {
  const { applyWorkSeo } = await import(cms('seo.js'));
  globalThis.location = { href: 'http://127.0.0.1:5173/?cmsWork=all#work', origin: 'http://127.0.0.1:5173' };
  const headKids = [];
  const head = {
    querySelector(sel) {
      return headKids.find((n) => {
        if (sel.startsWith('meta[name=')) return n.getAttribute('name') === sel.slice(11, -2);
        if (sel.startsWith('meta[property=')) return n.getAttribute('property') === sel.slice(15, -2);
        if (sel.startsWith('link[')) return false;
        return false;
      });
    },
    querySelectorAll(sel) {
      if (sel.includes('data-cms-hreflang')) return headKids.filter((n) => n.getAttribute('data-cms-hreflang'));
      return [];
    },
    append(node) {
      headKids.push(node);
    },
  };
  globalThis.document = {
    title: 'old',
    head,
    querySelector: () => null,
    createElement(tag) {
      const attrs = {};
      return {
        tagName: tag.toUpperCase(),
        setAttribute(k, v) {
          attrs[k] = String(v);
        },
        getAttribute(k) {
          return attrs[k] ?? null;
        },
        removeAttribute(k) {
          delete attrs[k];
        },
        remove() {
          const i = headKids.indexOf(this);
          if (i >= 0) headKids.splice(i, 1);
        },
      };
    },
  };

  const result = applyWorkSeo(
    {
      metaTitle: 'Work EN',
      metaDescription: 'Desc',
      shareImage: { url: '/assets/og.webp' },
    },
    { locale: 'en' },
  );
  assert.equal(result.title, 'Work EN');
  assert.equal(document.title, 'Work EN');
  assert.ok(headKids.some((n) => n.getAttribute('property') === 'og:title' && n.getAttribute('content') === 'Work EN'));
  assert.ok(headKids.some((n) => n.getAttribute('property') === 'og:locale' && n.getAttribute('content') === 'en_US'));
  assert.ok(headKids.some((n) => n.getAttribute('data-cms-hreflang') === 'en'));
});

test('work-cache clear removes entries', async () => {
  const { cacheClear, cacheGet, cacheSet } = await import(cms('work-cache.js'));
  cacheClear();
  cacheSet(['x'], 1, 60_000);
  assert.equal(cacheGet(['x']), 1);
  cacheClear();
  assert.equal(cacheGet(['x']), null);
});
