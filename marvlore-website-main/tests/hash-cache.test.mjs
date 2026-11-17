import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, existsSync} from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function get(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({hostname: '127.0.0.1', port: 5199, path: urlPath}, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks)}));
    }).on('error', reject);
  });
}

test('asset-manifest lists content hashes for fingerprinted files', () => {
  const manifestPath = path.join(dist, 'asset-manifest.json');
  assert.equal(existsSync(manifestPath), true, 'run pnpm hash:assets before tests');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.version, 1);
  assert.ok(manifest.assets['app.js']);
  assert.ok(manifest.assets['styles.css']);
  const app = readFileSync(path.join(dist, 'app.js'));
  const expected = createHash('sha256').update(app).digest('hex').slice(0, 10);
  assert.equal(manifest.assets['app.js'], expected);
});

test('manual version labels are replaced by content hashes in index.html', () => {
  const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
  assert.equal(/\?v=(hero-|menu-|work-|cover-|contact-|cn-|explore-|wall-|service-)/.test(html), false);
  assert.match(html, /app\.js\?v=[a-f0-9]{10}/);
  assert.match(html, /fonts\.css\?v=[a-f0-9]{10}/);
});

test('server serves immutable cache for matching content-hash query', async () => {
  const manifest = JSON.parse(readFileSync(path.join(dist, 'asset-manifest.json'), 'utf8'));
  const hash = manifest.assets['styles.css'];
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: {...process.env, PORT: '5199'},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server start timeout')), 5000);
    child.stdout.on('data', (buf) => {
      if (String(buf).includes('Local:')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on('error', reject);
  });
  try {
    const ok = await get(`/styles.css?v=${hash}`);
    assert.equal(ok.status, 200);
    assert.equal(ok.headers['cache-control'], 'public, max-age=31536000, immutable');

    const stale = await get('/styles.css?v=deadbeef01');
    assert.equal(stale.status, 200);
    assert.equal(stale.headers['cache-control'], 'public, max-age=0, must-revalidate');

    const html = await get('/');
    assert.equal(html.status, 200);
    assert.equal(html.headers['cache-control'], 'no-cache');
  } finally {
    child.kill('SIGTERM');
  }
});
