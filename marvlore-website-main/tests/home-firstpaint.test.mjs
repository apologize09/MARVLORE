import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => readFileSync(path.join(root, rel), 'utf8');

test('Phase A: welcome shell is in HTML before app.js', () => {
  const html = load('dist/index.html');
  assert.match(html, /id="welcome-shell"/);
  assert.match(html, /欢迎来到/);
  assert.match(html, /MARVLORE/);
  assert.match(html, /迈络/);
  assert.match(html, /Ideas Make Brands POP/);
  assert.match(html, /welcome\.css/);
  assert.match(html, /welcome-skip/);
});

test('Phase A: hero boot shell + poster under welcome', () => {
  const html = load('dist/index.html');
  assert.match(html, /id="app"/);
  assert.match(html, /id="home"/);
  assert.match(html, /id="hero-orbit"/);
  assert.match(html, /boot-hero-poster/);
  assert.match(html, /swft-icon-poster\.webp/);
  assert.match(html, /rel="modulepreload"[^>]*hero\/orbit\.js/);
});

test('Phase B: CMS boot is not awaited before shell / hero paint', () => {
  const src = load('dist/app.js');
  assert.match(src, /paintAppShell/);
  assert.match(src, /dismissWelcomeShell/);
  assert.match(src, /cmsBoot\.then/);
  assert.match(src, /applyCmsDomUpdate/);
  assert.doesNotMatch(src, /await\s+bootWorkBundle\s*\(/);
  assert.doesNotMatch(src, /await\s+cmsBoot\b/);
  assert.doesNotMatch(src, /#app'\)\.innerHTML\s*=/);
});

test('Phase B: shell reuses #home and keeps boot poster', () => {
  const src = load('dist/app.js');
  assert.match(src, /getElementById\('home'\)/);
  assert.match(src, /boot-hero-poster/);
  assert.match(src, /insertAdjacentHTML/);
});

test('welcome.css ships enter + exit motion', () => {
  const css = load('dist/welcome.css');
  assert.match(css, /@keyframes welcome-rise/);
  assert.match(css, /@keyframes welcome-exit/);
  assert.match(css, /\.welcome-shell\.is-leaving/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /--lime|#bdff3b/);
});

test('Phase C: sections mount via observeOnce / dynamic import', () => {
  const src = load('dist/app.js');
  assert.match(src, /function observeOnce/);
  assert.match(src, /IntersectionObserver/);
  assert.match(src, /scheduleSectionMounts/);
  assert.match(src, /import\('\.\/hero\/orbit\.js/);
  assert.match(src, /import\('\.\/services\/experience\.js/);
  assert.match(src, /import\('\.\/navigation\/menu\.js/);
  assert.doesNotMatch(src, /import\s*\{[^}]*mountHeroOrbit[^}]*\}\s*from\s*'\.\/hero\/orbit/);
  assert.doesNotMatch(src, /import\s*\{[^}]*mountSiteNavigation[^}]*\}\s*from\s*'\.\/navigation\/menu/);
  assert.match(src, /rebindSectionWatch/);
});

test('Phase D: critical CSS blocks; section CSS deferred with data-defer-section', () => {
  const html = load('dist/index.html');
  assert.match(html, /styles\.css\?v=/);
  assert.match(html, /hero\/orbit\.css\?v=/);
  assert.match(html, /welcome\.css\?v=/);
  assert.match(html, /services\/experience\.css[^>]*media="print"/);
  assert.match(html, /data-defer-section="services"/);
  assert.match(html, /data-defer-section="nav"/);
  assert.match(html, /work-listing\.css[^>]*media="print"/);
  assert.match(html, /data-defer-section="work"/);
});

test('Phase E: hero intro gates are short; hash-assets rewrites import()', () => {
  const entry = load('src/hero/hero-entry.jsx');
  assert.match(entry, /slice\(0,\s*2\)/);
  assert.match(entry, /280/);
  assert.doesNotMatch(entry, /document\.fonts\?\.ready/);
  const carousel = load('src/hero/CircularCarousel.jsx');
  assert.match(carousel, /slice\(0,\s*2\)/);
  assert.match(carousel, /320/);
  assert.doesNotMatch(carousel, /setTimeout\(resolve,\s*2400\)/);
  const hash = load('scripts/hash-assets.mjs');
  assert.match(hash, /import\\s\*\\\(/);
  assert.match(hash, /\[\^'"\\s\)\?\]\+/);
});