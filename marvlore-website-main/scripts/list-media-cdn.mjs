#!/usr/bin/env node
/**
 * List media files under dist/assets for CDN sync planning (dry-run).
 * Does not upload — print inventory JSON for R2/here.now media mirrors.
 *
 * Usage: node scripts/list-media-cdn.mjs
 */
import {readdirSync, statSync, readFileSync} from 'node:fs';
import {dirname, extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'dist/assets');
const MEDIA_EXTS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.svg', '.mp4', '.webm', '.woff2', '.ttf', '.otf']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (MEDIA_EXTS.has(extname(name).toLowerCase())) out.push(path);
  }
  return out;
}

function readBase() {
  const fromEnv = (process.env.MEDIA_CDN_BASE || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  try {
    return String(JSON.parse(readFileSync(join(ROOT, 'deployment.json'), 'utf8')).mediaCdnBase || '')
      .trim()
      .replace(/\/$/, '');
  } catch {
    return '';
  }
}

const files = walk(ASSETS).map((file) => {
  const rel = relative(join(ROOT, 'dist'), file).split(/[/\\]/).join('/');
  const size = statSync(file).size;
  return {path: rel, size};
});
files.sort((a, b) => b.size - a.size);

const base = readBase();
const totalBytes = files.reduce((n, f) => n + f.size, 0);
const summary = {
  mediaCdnBase: base || null,
  sameOrigin: !base,
  fileCount: files.length,
  totalBytes,
  totalMB: Math.round((totalBytes / 1e6) * 100) / 100,
  largest: files.slice(0, 15),
  note: base
    ? 'Upload dist/assets to the CDN origin preserving paths, then set mediaCdnBase and run apply-media-cdn.'
    : 'mediaCdnBase empty — media stays on here.now (Cloudflare-fronted). Set mediaCdnBase when a separate origin is ready.',
};

console.log(JSON.stringify(summary, null, 2));
