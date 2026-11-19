import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function get(port, pathname) {
  return new Promise((resolve, reject) => {
    http
      .get({ hostname: '127.0.0.1', port, path: pathname }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            body: Buffer.concat(chunks).toString('utf8'),
            type: res.headers['content-type'] || '',
          });
        });
      })
      .on('error', reject);
  });
}

test('server.mjs serves index.html for /work and /work/:slug', async () => {
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root,
    env: { ...process.env, HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let port = 0;
  const onData = (buf) => {
    const text = String(buf);
    const match = /Local:\s*http:\/\/127\.0\.0\.1:(\d+)/.exec(text);
    if (match) port = Number(match[1]);
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
  const started = Date.now();
  while (!port && Date.now() - started < 8000) {
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.ok(port, 'server did not print listening port');
  try {
    const home = await get(port, '/');
    assert.equal(home.status, 200);
    assert.match(home.body, /<main id="app"><\/main>/);

    for (const pathname of ['/work', '/work/sample-slug']) {
      const res = await get(port, pathname);
      assert.equal(res.status, 200, pathname);
      assert.match(res.type, /text\/html/);
      assert.match(res.body, /<main id="app"><\/main>/);
      assert.match(res.body, /<base href="\/">/);
    }
    for (const pathname of ['/work/', '/work/sample-slug/']) {
      const res = await get(port, pathname);
      assert.equal(res.status, 308, pathname);
    }

    const missing = await get(port, '/definitely-missing-path');
    assert.equal(missing.status, 404);
  } finally {
    child.kill('SIGTERM');
    await Promise.race([once(child, 'exit'), new Promise((r) => setTimeout(r, 2000))]);
  }
});
