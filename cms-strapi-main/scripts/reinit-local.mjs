#!/usr/bin/env node
/**
 * 本地重新初始化 Strapi：清空 SQLite / 缓存，创建管理员，灌入 pouch-seed，清理孤儿上传。
 *
 * 用法：
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='ComplexPass1!' npm run reinit:local
 *
 * 可选：
 *   SKIP_SEED=1          只重建空库与管理员
 *   KEEP_UPLOADS=1       不清空 public/uploads（默认会先清空再由 seed 重新上传）
 *
 * 不修改 .env。仅操作本地 SQLite（DATABASE_FILENAME，默认 .tmp/data.db）。
 */
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function loadEnvFile() {
  const envPath = path.join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function norm(value) {
  return String(value).toLowerCase().replace(/-/g, '_').replace(/@/g, '_');
}

function seedKey(fileName) {
  return norm(path.parse(fileName).name);
}

function publicKey(fileName) {
  let stem = path.parse(fileName).name;
  stem = stem.replace(/_[0-9a-f]{8,12}$/i, '');
  return norm(stem);
}

function collectImageRefs(node, refs) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectImageRefs(item, refs));
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (
      typeof value === 'string' &&
      [
        'image',
        'cover',
        'avatar',
        'shareImage',
        'heroImage',
        'canImage',
        'openCanImage',
        'heroBanner',
        'categoryImage',
        'packagingImage',
        'favicon',
        'cleanroom',
        'yourBrandConcept',
        'phoenixFacilityAerial',
        'phoenixLogistics',
        'phoenixEcosystem',
        'phoenixTalent',
        'processHeroBanner',
      ].includes(key)
    ) {
      refs.add(value);
    } else if (key === 'images' && value && typeof value === 'object') {
      Object.values(value).forEach((item) => {
        if (typeof item === 'string') refs.add(item);
      });
    } else {
      collectImageRefs(value, refs);
    }
  }
}

function prepareSeedImages() {
  const seed = JSON.parse(readFileSync(path.join(root, 'data/pouch-seed.json'), 'utf8'));
  const refs = new Set();
  collectImageRefs(seed, refs);

  const uploadsDir = path.join(root, 'public/uploads');
  const index = new Map();
  if (existsSync(uploadsDir)) {
    for (const name of readdirSync(uploadsDir)) {
      if (name.startsWith('.') || /^(large_|medium_|small_|thumbnail_)/.test(name)) continue;
      const full = path.join(uploadsDir, name);
      if (!statSync(full).isFile()) continue;
      index.set(publicKey(name), full);
    }
  }

  const outDir = path.join(root, '.tmp/seed-images');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  let mapped = 0;
  const missing = [];
  for (const ref of [...refs].sort()) {
    const dest = path.join(outDir, ref);
    mkdirSync(path.dirname(dest), { recursive: true });
    const local = path.join(root, 'data/uploads', ref);
    const fromPublic = index.get(seedKey(ref));
    if (existsSync(local)) {
      copyFileSync(local, dest);
      mapped += 1;
    } else if (fromPublic) {
      copyFileSync(fromPublic, dest);
      mapped += 1;
    } else {
      missing.push(ref);
    }
  }

  if (missing.length) {
    console.error('[reinit] missing seed images:', missing.join(', '));
    process.exit(1);
  }
  console.log(`[reinit] prepared ${mapped} seed images → .tmp/seed-images`);
  return outDir;
}

function clearUploads() {
  const uploadsDir = path.join(root, 'public/uploads');
  mkdirSync(uploadsDir, { recursive: true });
  for (const name of readdirSync(uploadsDir)) {
    if (name === '.gitkeep') continue;
    unlinkSync(path.join(uploadsDir, name));
  }
  console.log('[reinit] cleared public/uploads');
}

function backupAndWipeDb() {
  const dbRel = process.env.DATABASE_FILENAME || '.tmp/data.db';
  const dbPath = path.resolve(root, dbRel);
  const backupDir = path.join(root, '.tmp/backup');
  mkdirSync(backupDir, { recursive: true });
  if (existsSync(dbPath)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `data.db.pre-reinit-${stamp}`);
    copyFileSync(dbPath, backupPath);
    console.log(`[reinit] backed up SQLite → ${path.relative(root, backupPath)}`);
  }
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    const candidate = `${dbPath}${suffix}`;
    if (existsSync(candidate)) unlinkSync(candidate);
  }
  for (const dir of ['.cache', '.strapi', 'dist', 'build']) {
    rmSync(path.join(root, dir), { recursive: true, force: true });
  }
  console.log('[reinit] wiped SQLite + build caches');
}

function ensureAdminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  if (!email) {
    console.error('[reinit] set ADMIN_EMAIL before running');
    process.exit(1);
  }
  if (!password) {
    password = `Mv!${randomBytes(9).toString('base64url')}`;
    process.env.ADMIN_PASSWORD = password;
  }
  const credPath = path.join(root, '.tmp/admin-credentials.txt');
  writeFileSync(
    credPath,
    [`email=${email}`, `password=${password}`, 'firstname=Admin', 'lastname=Marvlore', ''].join(
      '\n'
    ),
    { mode: 0o600 }
  );
  console.log(`[reinit] admin credentials written to ${path.relative(root, credPath)} (gitignored)`);
  return { email, password };
}

loadEnvFile();

if ((process.env.DATABASE_CLIENT || 'sqlite') !== 'sqlite') {
  console.error('[reinit] refuse non-sqlite DATABASE_CLIENT; this script is local-only');
  process.exit(1);
}

const skipSeed = process.env.SKIP_SEED === '1';
const keepUploads = process.env.KEEP_UPLOADS === '1';

backupAndWipeDb();
if (!keepUploads && !skipSeed) clearUploads();

const { email, password } = ensureAdminCredentials();
run('npx', [
  'strapi',
  'admin:create-user',
  '--firstname=Admin',
  '--lastname=Marvlore',
  `--email=${email}`,
  `--password=${password}`,
]);

if (!skipSeed) {
  const seedImages = prepareSeedImages();
  run('npm', ['run', 'seed:example'], { SEED_IMAGES_DIR: seedImages });
}

const fingerprint = createHash('sha256')
  .update(readFileSync(path.resolve(root, process.env.DATABASE_FILENAME || '.tmp/data.db')))
  .digest('hex')
  .slice(0, 12);
console.log(`[reinit] done. SQLite fingerprint=${fingerprint}`);
console.log('[reinit] next: npm run develop  →  http://127.0.0.1:1337/admin');
