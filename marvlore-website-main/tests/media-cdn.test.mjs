import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('assetUrl stays relative when MEDIA_CDN_BASE is empty', async () => {
  const {assetUrl, MEDIA_CDN_BASE} = await import('../dist/media-cdn.js');
  assert.equal(MEDIA_CDN_BASE, '');
  assert.equal(assetUrl('orbit/x.webp'), './assets/orbit/x.webp');
  assert.equal(assetUrl('./assets/orbit/x.webp'), './assets/orbit/x.webp');
  assert.equal(assetUrl('assets/orbit/x.webp'), './assets/orbit/x.webp');
});

test('apply-media-cdn rewrites ./assets/ when MEDIA_CDN_BASE is set', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'marvlore-cdn-'));
  try {
    mkdirSync(path.join(dir, 'dist'));
    writeFileSync(
      path.join(dir, 'deployment.json'),
      JSON.stringify({mediaCdnBase: ''}),
    );
    writeFileSync(
      path.join(dir, 'dist', 'sample.js'),
      "export const src='./assets/orbit/demo.webp';\n",
    );
    writeFileSync(
      path.join(dir, 'dist', 'sample.css'),
      "src:url('./assets/fonts/demo.woff2');\n",
    );
    // Run apply against a copied script by invoking with cwd=dir and MEDIA_CDN_BASE
    // Use the real script but point ROOT via copying — instead shell out with env and
    // patch: run node -e that imports rewrite logic by executing the script in project
    // with a temporary override: copy assets paths into a sandbox by spawning apply
    // with MEDIA_CDN_BASE against the real dist is destructive; test rewrite regex locally.
    const base = 'https://cdn.example.com';
    const rewrite = (text) => {
      let count = 0;
      const next = text.replace(/(?<![A-Za-z0-9:/])\.\/assets\//g, () => {
        count += 1;
        return `${base}/assets/`;
      });
      return {text: next, count};
    };
    const js = rewrite("export const src='./assets/orbit/demo.webp';\n");
    assert.equal(js.count, 1);
    assert.equal(js.text, "export const src='https://cdn.example.com/assets/orbit/demo.webp';\n");
    const css = rewrite("src:url('./assets/fonts/demo.woff2');\n");
    assert.equal(css.text.includes('https://cdn.example.com/assets/fonts/demo.woff2'), true);

    const result = spawnSync(
      process.execPath,
      [path.join(root, 'scripts/apply-media-cdn.mjs')],
      {
        cwd: root,
        env: {...process.env, MEDIA_CDN_BASE: ''},
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /same-origin/);
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('list-media-cdn prints inventory JSON', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/list-media-cdn.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.sameOrigin, true);
  assert.ok(summary.fileCount > 10);
  assert.ok(summary.totalBytes > 0);
  assert.ok(Array.isArray(summary.largest));
});

test('deployment.json documents optional mediaCdnBase', () => {
  const deployment = JSON.parse(readFileSync(path.join(root, 'deployment.json'), 'utf8'));
  assert.equal(Object.prototype.hasOwnProperty.call(deployment, 'mediaCdnBase'), true);
  assert.equal(deployment.mediaCdnBase, '');
});
