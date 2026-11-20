import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => readFileSync(path.join(root, rel), 'utf8');

test('index.html ships a static hero shell before app.js', () => {
  const html = load('dist/index.html');
  assert.match(html, /class="boot-pending"/);
  assert.match(html, /id="app"/);
  assert.match(html, /Ideas Make Brands POP/);
  assert.match(html, /id="hero-orbit"/);
  assert.match(html, /boot-shell/);
});

test('index.html defers below-fold CSS with media=print onload', () => {
  const html = load('dist/index.html');
  assert.match(html, /services\/experience\.css[^>]*media="print"/);
  assert.match(html, /navigation\/menu\.css[^>]*media="print"/);
  // Work channel CSS stays blocking for /work deep links.
  assert.match(html, /work-listing\.css\?v=/);
  assert.doesNotMatch(html, /work-listing\.css[^>]*media="print"/);
});

test('app.js dynamically imports heavy islands instead of static import', () => {
  const src = load('dist/app.js');
  assert.match(src, /import\('\.\/hero\/orbit\.js/);
  assert.match(src, /import\('\.\/about\/reference\.js/);
  assert.match(src, /import\('\.\/services\/experience\.js/);
  assert.match(src, /import\('\.\/navigation\/menu\.js/);
  assert.doesNotMatch(src, /import\s*\{[^}]*mountHeroOrbit[^}]*\}\s*from\s*'\.\/hero\/orbit/);
  assert.doesNotMatch(src, /import\s*\{[^}]*mountSiteNavigation[^}]*\}\s*from\s*'\.\/navigation\/menu/);
  assert.match(src, /getHeroProjects/);
  assert.match(src, /heroImportP/);
});

test('hero-entry does not wait for all posters and fonts before ready', () => {
  const src = load('src/hero/hero-entry.jsx');
  assert.match(src, /slice\(0,\s*2\)/);
  assert.match(src, /280/);
  assert.doesNotMatch(src, /document\.fonts\?\.ready/);
  assert.match(src, /scrollY/);
});

test('index.html modulepreloads hero orbit and shows a boot poster', () => {
  const html = load('dist/index.html');
  assert.match(html, /rel="modulepreload"[^>]*hero\/orbit\.js/);
  assert.match(html, /boot-hero-poster/);
  assert.match(html, /swft-icon-poster\.webp/);
});
