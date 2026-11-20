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

test('Phase4: critical CSS blocks; section CSS is deferred with data-defer-section', () => {
  const html = load('dist/index.html');
  assert.match(html, /styles\.css\?v=/);
  assert.match(html, /hero\/orbit\.css\?v=/);
  assert.match(html, /services\/experience\.css[^>]*media="print"/);
  assert.match(html, /data-defer-section="services"/);
  assert.match(html, /data-defer-section="nav"/);
  assert.match(html, /work-listing\.css[^>]*media="print"/);
  assert.match(html, /data-defer-section="work"/);
});

test('Phase3: sections mount via observeOnce / IntersectionObserver', () => {
  const src = load('dist/app.js');
  assert.match(src, /function observeOnce/);
  assert.match(src, /IntersectionObserver/);
  assert.match(src, /scheduleSectionMounts/);
  assert.match(src, /mountServicesSection/);
  assert.match(src, /mountNav/);
  assert.doesNotMatch(src, /async function mountDeferredIslands/);
});

test('Phase3: CMS DOM replace rebinds section IO (awards/work/contact)', () => {
  const src = load('dist/app.js');
  assert.match(src, /function rebindSectionWatch/);
  assert.match(src, /sectionWatchers/);
  assert.match(src, /rebindSectionWatch\('awards'/);
  assert.match(src, /rebindSectionWatch\('work'/);
  assert.match(src, /rebindSectionWatch\('contact'/);
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

test('Phase1: CMS boot is not awaited before hero/core paint', () => {
  const src = load('dist/app.js');
  assert.match(src, /paintAppShell/);
  assert.match(src, /applyCmsDomUpdate/);
  assert.match(src, /cmsBoot\.then/);
  assert.doesNotMatch(src, /await\s+ensureCms\s*\(/);
  assert.doesNotMatch(src, /await\s+cmsBoot\b/);
  assert.doesNotMatch(src, /await\s+bootWorkBundle\s*\(/);
  assert.doesNotMatch(src, /#app'\)\.innerHTML\s*=/);
});

test('Phase2: shell reuses #home and keeps boot poster', () => {
  const src = load('dist/app.js');
  assert.match(src, /getElementById\('home'\)/);
  assert.match(src, /boot-hero-poster/);
  assert.match(src, /insertAdjacentHTML/);
  const html = load('dist/index.html');
  assert.match(html, /boot-hero-poster/);
  assert.match(html, /id="hero-orbit"/);
});

test('hero-entry does not wait for all posters and fonts before ready', () => {
  const src = load('src/hero/hero-entry.jsx');
  assert.match(src, /slice\(0,\s*2\)/);
  assert.match(src, /280/);
  assert.doesNotMatch(src, /document\.fonts\?\.ready/);
  assert.match(src, /scrollY/);
});

test('CircularCarousel does not gate intro on a 2.4s full-deck decode', () => {
  const src = load('src/hero/CircularCarousel.jsx');
  assert.match(src, /slice\(0,\s*2\)/);
  assert.match(src, /320/);
  assert.doesNotMatch(src, /setTimeout\(resolve,\s*2400\)/);
});

test('hash-assets rewrites dynamic import() queries', () => {
  const src = load('scripts/hash-assets.mjs');
  assert.match(src, /\[\^'"\\s\)\?\]\+/);
  assert.match(src, /import\)\\s\*\\\(\?\\s\*\['"\]/);
});

test('index.html modulepreloads hero orbit and shows a boot poster', () => {
  const html = load('dist/index.html');
  assert.match(html, /rel="modulepreload"[^>]*hero\/orbit\.js/);
  assert.match(html, /boot-hero-poster/);
  assert.match(html, /swft-icon-poster\.webp/);
});
