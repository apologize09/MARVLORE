#!/usr/bin/env node
/**
 * Replace manual ?v= labels with content hashes and write a manifest
 * used by server.mjs for immutable Cache-Control.
 *
 * Cascades: rewritten importers change their own bytes, so we iterate
 * until hashes stabilize (or hit a pass cap).
 *
 * Usage: node scripts/hash-assets.mjs
 */
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {dirname, extname, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const MANIFEST = join(DIST, 'asset-manifest.json');
const TEXT_EXTS = new Set(['.js', '.mjs', '.css', '.html']);
const HASH_EXTS = new Set(['.js', '.mjs', '.css', '.woff2', '.ttf', '.webp', '.png', '.svg', '.mp4']);
const MAX_PASSES = 8;

// import/from/href/src/url("…") capturing a relative/root asset path
// Covers: from '…', import '…', dynamic import('…'), href/src/url.
// Path must stop before ? so import('…?v=') rewrites the query, not the path.
const REF_RE =
  /((?:from|import)\s*\(?\s*['"]|href=["']|src=["']|url\(\s*['"]?)(\.\/[^'"\s)?]+|\/[^'"\s)?]+)(\?[^'"\s)]*)?(['"]\s*\)?|['"])/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function shortHash(buf) {
  return createHash('sha256').update(buf).digest('hex').slice(0, 10);
}

function toPosix(p) {
  return p.split(sep).join('/');
}

function resolveRef(fromFile, ref) {
  const clean = ref.split('?')[0].split('#')[0];
  if (clean.startsWith('/')) return resolve(DIST, '.' + clean);
  return resolve(dirname(fromFile), clean);
}

function hashFile(abs) {
  if (!existsSync(abs) || !statSync(abs).isFile()) return null;
  if (!HASH_EXTS.has(extname(abs).toLowerCase())) return null;
  return shortHash(readFileSync(abs));
}

function rewriteText(file, text) {
  let changed = false;
  const next = text.replace(REF_RE, (full, prefix, refPath, _oldQuery, suffix) => {
    if (refPath.includes('://') || refPath.startsWith('data:')) return full;
    const abs = resolveRef(file, refPath);
    if (!abs.startsWith(DIST)) return full;
    const hash = hashFile(abs);
    if (!hash) return full;
    const desired = `${prefix}${refPath.split('?')[0]}?v=${hash}${suffix}`;
    if (desired !== full) changed = true;
    return desired;
  });
  return {text: next, changed};
}

function buildManifest() {
  const files = walk(DIST).filter((f) => HASH_EXTS.has(extname(f).toLowerCase()));
  const assets = {};
  for (const file of files) {
    const rel = toPosix(relative(DIST, file));
    assets[rel] = shortHash(readFileSync(file));
  }
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    hashLength: 10,
    assets,
  };
  writeFileSync(MANIFEST, JSON.stringify(payload, null, 2) + '\n');
  return payload;
}

function main() {
  const textFiles = walk(DIST).filter((f) => TEXT_EXTS.has(extname(f).toLowerCase()));
  let totalEdits = 0;
  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    let passEdits = 0;
    for (const file of textFiles) {
      const raw = readFileSync(file, 'utf8');
      const {text, changed} = rewriteText(file, raw);
      if (!changed) continue;
      writeFileSync(file, text);
      passEdits += 1;
    }
    totalEdits += passEdits;
    console.log(`pass ${pass}: rewrote ${passEdits} files`);
    if (passEdits === 0) break;
  }
  const manifest = buildManifest();
  console.log(
    `hash-assets: ${totalEdits} file rewrites, ${Object.keys(manifest.assets).length} hashed assets → asset-manifest.json`,
  );
}

main();
