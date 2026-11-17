#!/usr/bin/env node
/**
 * Verify Strapi 5.52 i18n plugin + required locales (zh-CN default, en).
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const strapiPkg = require(path.join(root, 'node_modules/@strapi/strapi/package.json'));
let i18nPkg = null;
try {
  i18nPkg = require(path.join(root, 'node_modules/@strapi/i18n/package.json'));
} catch {
  i18nPkg = null;
}

const { createStrapi } = require('@strapi/strapi');
const app = await createStrapi({ distDir: './dist' }).load();
try {
  const plugin = app.plugin('i18n');
  if (!plugin) throw new Error('i18n plugin not loaded');

  const locales = await plugin.service('locales').find();
  const codes = (locales || []).map((l) => l.code).sort();
  const defaultLocale = await plugin.service('locales').getDefaultLocale();

  const report = {
    strapi: strapiPkg.version,
    i18nPackage: i18nPkg ? { name: i18nPkg.name, version: i18nPkg.version } : null,
    pluginLoaded: true,
    locales: codes,
    defaultLocale,
    ok:
      Boolean(i18nPkg) &&
      i18nPkg.version === strapiPkg.version &&
      codes.includes('zh-CN') &&
      codes.includes('en') &&
      defaultLocale === 'zh-CN',
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
} finally {
  await app.destroy();
}
