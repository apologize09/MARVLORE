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
