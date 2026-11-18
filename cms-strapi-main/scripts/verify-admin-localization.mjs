#!/usr/bin/env node
/**
 * Admin localization guardrails (P4).
 * - Ops zh/en dictionary key parity
 * - t('…') keys used by ops modules resolve
 * - Content Type displayName Chinese for active models
 * - Schema structural fingerprint (UID / attrs / relations) unchanged
 * - Native zh-Hans override file present
 * - Website tree not required here (git-level); warn if scripts assume CMS-only
 *
 * Exit 0 = pass; 1 = fail. Warnings printed but non-fatal unless --strict-warnings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT_WARN = process.argv.includes('--strict-warnings');
const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function flattenDictKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) keys.push(...flattenDictKeys(v, p));
    else keys.push(p);
  }
  return keys.sort();
}

/** Minimal extract of `export const X: OpsDict = { ... };` object literal via Function — files are trusted repo sources. */
function loadOpsDictFromTs(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const m = src.match(/export const \w+[^=]*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!m) throw new Error(`cannot parse dict object in ${filePath}`);
  // strip trailing `as const` if any
  const lit = m[1].replace(/\s+as const\s*$/, '');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${lit});`)();
}

function checkDictParity() {
  const zhPath = path.join(CMS_ROOT, 'src/admin/extensions/i18n/zh-CN.ts');
  const enPath = path.join(CMS_ROOT, 'src/admin/extensions/i18n/en.ts');
  if (!fs.existsSync(zhPath) || !fs.existsSync(enPath)) {
    fail('ops dictionary files missing (zh-CN.ts / en.ts)');
    return;
  }
  const zh = loadOpsDictFromTs(zhPath);
  const en = loadOpsDictFromTs(enPath);
  const zhKeys = flattenDictKeys(zh);
  const enKeys = flattenDictKeys(en);
  const zhSet = new Set(zhKeys);
  const enSet = new Set(enKeys);
  for (const k of zhKeys) if (!enSet.has(k)) fail(`en missing key: ${k}`);
  for (const k of enKeys) if (!zhSet.has(k)) fail(`zh-CN missing key: ${k}`);
  const zhDup = zhKeys.filter((k, i) => zhKeys.indexOf(k) !== i);
  if (zhDup.length) fail(`duplicate zh keys: ${zhDup.join(', ')}`);
  console.log(`✓ dict parity (${zhKeys.length} keys)`);
}

function checkTUsage() {
  const zh = loadOpsDictFromTs(path.join(CMS_ROOT, 'src/admin/extensions/i18n/zh-CN.ts'));
  const allowed = new Set(flattenDictKeys(zh));
  const opsDir = path.join(CMS_ROOT, 'src/admin/extensions/ops');
  const files = [];
  function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(tsx|ts)$/.test(ent.name)) files.push(p);
    }
  }
  walk(opsDir);
  const used = new Set();
  const re = /\bt\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(text))) {
      used.add(m[1]);
      if (!allowed.has(m[1])) fail(`${path.relative(CMS_ROOT, f)} uses unknown t('${m[1]}')`);
    }
  }
  console.log(`✓ t() keys resolve (${used.size} used)`);
}

function hasCjk(s) {
  return /[\u4e00-\u9fff]/.test(String(s || ''));
}

function checkDisplayNames() {
  const active = [
    'about-page',
    'award',
    'faq',
    'global-setting',
    'hero-item',
    'page-seo',
    'service-item',
    'work-category',
    'work-page',
    'work-project',
    'work-project-media',
    'work-tag',
  ];
  for (const api of active) {
    const p = path.join(CMS_ROOT, `src/api/${api}/content-types/${api}/schema.json`);
    const s = JSON.parse(fs.readFileSync(p, 'utf8'));
    const dn = s.info?.displayName;
    if (!hasCjk(dn)) fail(`${api} displayName not Chinese: ${dn}`);
  }
  console.log(`✓ active Content Type displayNames are Chinese (${active.length})`);
}

function fingerprintAttr(a) {
  const out = { type: a.type };
  for (const k of [
    'relation',
    'target',
    'component',
    'components',
    'repeatable',
    'required',
    'unique',
    'default',
    'multiple',
    'allowedTypes',
    'enum',
  ]) {
    if (a[k] !== undefined) out[k] = a[k];
  }
  return out;
}

function currentFingerprint() {
  const apis = {};
  for (const api of fs.readdirSync(path.join(CMS_ROOT, 'src/api'))) {
    const p = path.join(CMS_ROOT, `src/api/${api}/content-types/${api}/schema.json`);
    if (!fs.existsSync(p)) continue;
    const s = JSON.parse(fs.readFileSync(p, 'utf8'));
    const attrs = {};
    for (const [k, v] of Object.entries(s.attributes || {})) attrs[k] = fingerprintAttr(v);
    apis[`api::${api}.${api}`] = {
      collectionName: s.collectionName,
      kind: s.kind || null,
      singularName: s.info.singularName,
      pluralName: s.info.pluralName,
      attributes: attrs,
    };
  }
  const comps = {};
  const sharedDir = path.join(CMS_ROOT, 'src/components/shared');
  for (const f of fs.readdirSync(sharedDir).filter((x) => x.endsWith('.json'))) {
    const s = JSON.parse(fs.readFileSync(path.join(sharedDir, f), 'utf8'));
    const uid = `shared.${f.replace(/\.json$/, '')}`;
    const attrs = {};
    for (const [k, v] of Object.entries(s.attributes || {})) attrs[k] = fingerprintAttr(v);
    comps[uid] = { collectionName: s.collectionName, attributes: attrs };
  }
  return { apis, comps };
}

function checkSchemaFingerprint() {
  const fixturePath = path.join(
    CMS_ROOT,
    'scripts/fixtures/admin-localization-schema-fingerprint.json',
  );
  if (!fs.existsSync(fixturePath)) {
    fail('missing schema fingerprint fixture');
    return;
  }
  const expected = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const actual = currentFingerprint();
  const expApis = Object.keys(expected.apis).sort();
  const actApis = Object.keys(actual.apis).sort();
  if (JSON.stringify(expApis) !== JSON.stringify(actApis)) {
    fail(`API UID set changed.\n  expected: ${expApis.join(', ')}\n  actual: ${actApis.join(', ')}`);
  }
  for (const uid of expApis) {
    if (!actual.apis[uid]) continue;
    const a = JSON.stringify(expected.apis[uid]);
    const b = JSON.stringify(actual.apis[uid]);
    if (a !== b) fail(`structural drift in ${uid}`);
  }
  for (const uid of Object.keys(expected.comps || {}).sort()) {
    if (!actual.comps[uid]) {
      fail(`missing component ${uid}`);
      continue;
    }
    if (JSON.stringify(expected.comps[uid]) !== JSON.stringify(actual.comps[uid])) {
      fail(`structural drift in component ${uid}`);
    }
  }
  console.log(`✓ schema structural fingerprint (${expApis.length} APIs, ${Object.keys(expected.comps || {}).length} comps)`);
}

function checkNativeFile() {
  const p = path.join(CMS_ROOT, 'src/admin/extensions/i18n/strapi-native-zh-Hans.ts');
  if (!fs.existsSync(p)) fail('missing strapi-native-zh-Hans.ts');
  else {
    const text = fs.readFileSync(p, 'utf8');
    if (!text.includes('containers.edit.tabs.draft') && !text.includes('"草稿"')) {
      warn('native zh-Hans file may be incomplete (draft tab key not found)');
    }
    console.log('✓ native zh-Hans override present');
  }
}

function checkOpsHubsRegistered() {
  const reg = fs.readFileSync(path.join(CMS_ROOT, 'src/admin/extensions/ops/register.ts'), 'utf8');
  for (const route of ['/ops/dashboard', '/ops/website', '/ops/work', '/ops/media', '/ops/seo', '/ops/system']) {
    if (!reg.includes(route)) fail(`register.ts missing hub ${route}`);
  }
  console.log('✓ six ops hubs registered');
}

function checkHardcodedEnglishHints() {
  // Soft scan: title="English" patterns in ops modules
  const mods = path.join(CMS_ROOT, 'src/admin/extensions/ops/modules');
  for (const f of fs.readdirSync(mods).filter((x) => x.endsWith('.tsx'))) {
    const text = fs.readFileSync(path.join(mods, f), 'utf8');
    const m = text.match(/title=["']([A-Za-z][^"']{2,})["']/);
    if (m) warn(`${f} hardcodes English title="${m[1]}" (prefer t())`);
  }
}

function main() {
  process.chdir(CMS_ROOT);
  console.log('verify-admin-localization');
  checkDictParity();
  checkTUsage();
  checkDisplayNames();
  checkSchemaFingerprint();
  checkNativeFile();
  checkOpsHubsRegistered();
  checkHardcodedEnglishHints();

  for (const w of warnings) console.warn('⚠', w);
  if (errors.length) {
    console.error('\nFAILED:');
    for (const e of errors) console.error('✗', e);
    process.exit(1);
  }
  if (STRICT_WARN && warnings.length) {
    console.error('\nFAILED (--strict-warnings):', warnings.length, 'warnings');
    process.exit(1);
  }
  console.log('\nOK');
}

main();
