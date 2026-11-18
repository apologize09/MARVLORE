#!/usr/bin/env node
/**
 * Align Work CMS copy + showOnHome flags with the current site display.
 *
 * Dry-run by default. Execute with:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/align-work-home-display.mjs --execute
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
process.chdir(root);

const CMS = (process.env.CMS_BASE || 'http://127.0.0.1:1337').replace(/\/$/, '');
const EXECUTE = process.argv.includes('--execute');
const EMAIL = process.env.ADMIN_EMAIL || 'a1058487401@gmail.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Marvlore!Admin2026';

const SITE_TITLE = 'Creative Work';
const SITE_INTRO = '从品牌视觉到动态影像与数字体验，让创意成为品牌的表达。';
const DIRECTION_SHELLS = new Set(['film', 'visual', 'web', 'culture']);

async function json(url, opts = {}) {
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${url} → ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

async function main() {
  const login = await json(`${CMS}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const token = login?.data?.token;
  if (!token) throw new Error('admin login failed');
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const pageRes = await json(`${CMS}/api/work-page?locale=zh-CN`);
  const page = pageRes?.data;
  if (!page?.documentId) throw new Error('work-page missing');

  const pagePatch = {
    title: SITE_TITLE,
    intro: SITE_INTRO,
  };
  console.log('[work-page]', page.documentId, {
    from: { title: page.title, intro: page.intro },
    to: pagePatch,
  });
  if (EXECUTE) {
    await json(`${CMS}/content-manager/single-types/api::work-page.work-page?locale=zh-CN`, {
      method: 'PUT',
      headers: auth,
      body: JSON.stringify(pagePatch),
    });
    // publish
    await json(
      `${CMS}/content-manager/single-types/api::work-page.work-page/actions/publish?locale=zh-CN`,
      { method: 'POST', headers: auth, body: '{}' },
    );
    console.log('[work-page] published');
  }

  // List projects via Content Manager for documentIds
  const list = await json(
    `${CMS}/content-manager/collection-types/api::work-project.work-project?locale=zh-CN&pageSize=100`,
    { headers: auth },
  );
  const rows = list?.results || list?.data || [];
  console.log(`[projects] ${rows.length} rows`);

  for (const row of rows) {
    const legacyId = row.legacyId || row.slug;
    const shouldHome = Boolean(legacyId && !DIRECTION_SHELLS.has(legacyId));
    if (!!row.showOnHome === shouldHome) continue;
    console.log('[showOnHome]', legacyId, row.showOnHome, '→', shouldHome);
    if (!EXECUTE) continue;
    await json(
      `${CMS}/content-manager/collection-types/api::work-project.work-project/${row.documentId}?locale=zh-CN`,
      {
        method: 'PUT',
        headers: auth,
        body: JSON.stringify({ showOnHome: shouldHome }),
      },
    );
    await json(
      `${CMS}/content-manager/collection-types/api::work-project.work-project/${row.documentId}/actions/publish?locale=zh-CN`,
      { method: 'POST', headers: auth, body: '{}' },
    );
  }

  console.log(EXECUTE ? 'done (executed)' : 'dry-run only; pass --execute to apply');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
