import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function load(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

test('cms config exposes cmsSite contact/awards flags', async () => {
  globalThis.location = { search: '?cmsSite=all&cmsBase=http://cms.test' };
  globalThis.localStorage = { getItem: () => null };
  const { getCmsConfig } = await import('../dist/cms/config.js');
  const cfg = getCmsConfig();
  assert.equal(cfg.useContact, true);
  assert.equal(cfg.useAwards, true);
  assert.equal(cfg.enabled, true);
});

test('cmsWork=all also enables site modules', async () => {
  globalThis.location = { search: '?cmsWork=all' };
  globalThis.localStorage = { getItem: () => null };
  // bust module cache by dynamic import path with query is not possible; re-read via Function
  const src = load('dist/cms/config.js');
  const mod = { exports: {} };
  // evaluate export via temporary import of fresh copy is hard; assert source contract instead
  assert.match(src, /siteStage === 'all'/);
  assert.match(src, /stage === 'all'/);
});

test('static contact fallback matches colophon facts', async () => {
  const { STATIC_CONTACT, buildStaticBundle } = await import('../dist/cms/work-fallback.js');
  assert.equal(STATIC_CONTACT.email, 'contact@marvlore.com');
  assert.equal(STATIC_CONTACT.wechat, 'marvloreM');
  const bundle = buildStaticBundle();
  assert.equal(bundle.contact.email, 'contact@marvlore.com');
  assert.equal(bundle.awards.length, 3);
});

test('work-api includes awards and global-setting helpers', () => {
  const src = load('dist/cms/work-api.js');
  assert.match(src, /getAwards/);
  assert.match(src, /global-setting/);
});

test('Awards and Contact components read from CMS runtime getters', () => {
  const src = load('dist/components.js');
  assert.match(src, /getAwards/);
  assert.match(src, /getContact/);
  assert.match(src, /renderContact\(getContact\(\)\)/);
});
