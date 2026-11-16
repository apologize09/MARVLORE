#!/usr/bin/env node
/**
 * Rebuild published WebP (and hero halo) from design/images masters.
 *
 * Rules:
 * - Cap long edge at 1600 (desktop retina for cards / covers)
 * - WebP quality 80
 * - Skip service-tags (UI sprites) and already-small awards unless oversize
 * - Convert orbit/hero-orbit-light.png → .webp
 *
 * Usage: node scripts/optimize-images.mjs
 */
import {cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {dirname, extname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist/assets');
const DESIGN = join(ROOT, 'design/images/assets');
const MAX_EDGE = 1600;
const QUALITY = 80;
const SKIP_DIRS = new Set(['service-tags']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(path, out);
    } else if (/\.(webp|png|jpe?g)$/i.test(name)) {
      out.push(path);
    }
  }
  return out;
}

function ensureMasters() {
  mkdirSync(DESIGN, {recursive: true});
  const distFiles = walk(DIST);
  let copied = 0;
  for (const src of distFiles) {
    const rel = relative(DIST, src);
    const dest = join(DESIGN, rel);
    if (existsSync(dest)) continue;
    mkdirSync(dirname(dest), {recursive: true});
    cpSync(src, dest);
    copied += 1;
  }
  // Prefer keeping PNG halo master even after dist switches to webp
  const haloPng = join(DIST, 'orbit/hero-orbit-light.png');
  const haloMaster = join(DESIGN, 'orbit/hero-orbit-light.png');
  if (existsSync(haloPng) && !existsSync(haloMaster)) {
    mkdirSync(dirname(haloMaster), {recursive: true});
    cpSync(haloPng, haloMaster);
    copied += 1;
  }
  console.log(`masters: ${copied} newly archived → ${DESIGN}`);
}

function outPathFor(rel) {
  if (rel === 'orbit/hero-orbit-light.png') return join(DIST, 'orbit/hero-orbit-light.webp');
  if (/\.png$/i.test(rel) || /\.jpe?g$/i.test(rel)) {
    // Only convert the known halo PNG; leave other PNGs alone if any appear in masters
    return join(DIST, rel);
  }
  return join(DIST, rel);
}

async function encodeOne(masterPath) {
  const rel = relative(DESIGN, masterPath);
  const isHalo = rel === 'orbit/hero-orbit-light.png';
  if (/\.png$/i.test(rel) && !isHalo) {
    return null;
  }

  const dest = outPathFor(rel);
  mkdirSync(dirname(dest), {recursive: true});

  const image = sharp(masterPath, {failOn: 'none'});
  const meta = await image.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const long = Math.max(w, h);
  const needsResize = long > MAX_EDGE;
  const pipeline = sharp(masterPath, {failOn: 'none'}).rotate();
  if (needsResize) {
    pipeline.resize({
      width: w >= h ? MAX_EDGE : undefined,
      height: h > w ? MAX_EDGE : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const before = existsSync(dest) ? statSync(dest).size : (existsSync(join(DIST, rel)) ? statSync(join(DIST, rel)).size : 0);
  await pipeline.webp({quality: QUALITY, effort: 4}).toFile(dest + '.tmp');
  const tmpStat = statSync(dest + '.tmp');
  // Keep existing if somehow larger after encode (rare for oversize sources)
  if (before > 0 && tmpStat.size >= before * 0.98 && !needsResize && !isHalo) {
    rmSync(dest + '.tmp');
    return {rel, skipped: true, width: w, height: h, bytes: before};
  }
  rmSync(dest, {force: true});
  cpSync(dest + '.tmp', dest);
  rmSync(dest + '.tmp');
  if (isHalo) {
    const legacy = join(DIST, 'orbit/hero-orbit-light.png');
    if (existsSync(legacy)) rmSync(legacy);
  }
  const after = statSync(dest);
  const outMeta = await sharp(dest).metadata();
  return {
    rel: relative(DIST, dest),
    skipped: false,
    width: outMeta.width,
    height: outMeta.height,
    bytes: after.size,
    before,
  };
}

async function main() {
  ensureMasters();
  const masters = walk(DESIGN);
  const results = [];
  for (const master of masters) {
    const result = await encodeOne(master);
    if (result) results.push(result);
  }

  const changed = results.filter((r) => !r.skipped);
  const total = results.reduce((n, r) => n + r.bytes, 0);
  console.log(`encoded ${changed.length}/${results.length} images`);
  console.log(`shipped bytes ≈ ${(total / 1e6).toFixed(2)} MB`);
  writeFileSync(
    join(ROOT, 'scripts/.optimize-images-report.json'),
    JSON.stringify({maxEdge: MAX_EDGE, quality: QUALITY, results}, null, 2),
  );
  console.log('report → scripts/.optimize-images-report.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
