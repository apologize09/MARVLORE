import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (rel) => readFileSync(path.join(root, rel), 'utf8');

test('index.html ships welcome shell before empty #app paint', () => {
  const html = load('dist/index.html');
  assert.match(html, /id="welcome-shell"/);
  assert.match(html, /欢迎来到/);
  assert.match(html, /MARVLORE/);
  assert.match(html, /迈络/);
  assert.match(html, /Ideas Make Brands POP/);
  assert.match(html, /welcome\.css/);
  assert.match(html, /welcome-skip/);
  // Welcome lives outside #app so boot innerHTML cannot wipe it mid-exit.
  const welcomeAt = html.indexOf('id="welcome-shell"');
  const appAt = html.indexOf('<main id="app"');
  assert.ok(welcomeAt > 0 && appAt > welcomeAt);
});

test('welcome.css uses site tokens and exit handoff', () => {
  const css = load('dist/welcome.css');
  assert.match(css, /--lime|#bdff3b/);
  assert.match(css, /welcome-rise/);
  assert.match(css, /welcome-exit|is-leaving/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /Newsreader|font-heading/);
});

test('app.js dismisses welcome shell around boot', () => {
  const src = load('dist/app.js');
  assert.match(src, /function dismissWelcomeShell/);
  assert.match(src, /dismissWelcomeShell\(/);
  assert.match(src, /welcome-shell/);
});
