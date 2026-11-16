/**
 * Phase 3 Work API integration check against a disposable DB.
 * Run after `pnpm build`: node ./scripts/verify-work-api.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
process.chdir(root);

process.env.PORT = process.env.PORT || '1341';
process.env.DATABASE_FILENAME = '.tmp/verify-work-api.db';

const backupCandidates = [
  path.join(root, '.backups/remove-legacy-cts-20261116/data.db'),
  path.join(root, '.backups/phase1-20261116/data.db'),
  path.join(root, '.tmp/data.db'),
];
const backup = backupCandidates.find((p) => fs.existsSync(p));
const target = path.join(root, process.env.DATABASE_FILENAME);
fs.mkdirSync(path.dirname(target), { recursive: true });
if (backup) fs.copyFileSync(backup, target);
else fs.rmSync(target, { force: true });

const { createStrapi } = require('@strapi/strapi');
const app = await createStrapi({ distDir: './dist' }).load();

const catUid = 'api::work-category.work-category';
const tagUid = 'api::work-tag.work-tag';
const projectUid = 'api::work-project.work-project';
const pageUid = 'api::work-page.work-page';
const mediaUid = 'api::work-project-media.work-project-media';

let failed = 0;
function ok(label) {
  console.log('OK', label);
}
function fail(label, err) {
  failed += 1;
  console.error('FAIL', label, err?.message || err);
}

try {
  const l1 = await app.documents(catUid).create({
    data: { name: '创意', slug: 'creative', level: 1, isActive: true, sortOrder: 0 },
    status: 'published',
    locale: 'zh-CN',
  });
  const l2 = await app.documents(catUid).create({
    data: {
      name: '影像',
      slug: 'film',
      level: 2,
      parent: l1.documentId,
      isActive: true,
      sortOrder: 0,
    },
    status: 'published',
    locale: 'zh-CN',
  });
  const tag = await app.documents(tagUid).create({
    data: { name: 'CGI', slug: 'cgi', isActive: true, categories: [l2.documentId] },
    status: 'published',
    locale: 'zh-CN',
  });
  const project = await app.documents(projectUid).create({
    data: {
      title: '示例作品',
      slug: 'sample-project',
      summary: 'brand film sample',
      projectType: 'video',
      category: l2.documentId,
      tags: [tag.documentId],
      isFeatured: true,
      showOnHome: true,
      sortOrder: 1,
      videoUrl: '/assets/hero-video/demo.mp4',
      coverUrl: '/assets/work/demo.webp',
    },
    status: 'published',
    locale: 'zh-CN',
  });
  await app.documents(mediaUid).create({
    data: {
      blockType: 'image',
      project: project.documentId,
      imageUrl: '/assets/work/demo.webp',
      sortOrder: 0,
    },
    status: 'published',
    locale: 'zh-CN',
  });
  const existingPage = await app.documents(pageUid).findFirst({
    locale: 'zh-CN',
    status: 'draft',
  });
  const pageData = {
    title: '作品',
    intro: 'Work intro',
    showFeatured: true,
    featuredProjects: [project.documentId],
    displayCategories: [l1.documentId, l2.documentId],
  };
  if (existingPage?.documentId) {
    await app.documents(pageUid).update({
      documentId: existingPage.documentId,
      data: pageData,
      status: 'published',
      locale: 'zh-CN',
    });
  } else {
    await app.documents(pageUid).create({
      data: pageData,
      status: 'published',
      locale: 'zh-CN',
    });
  }

  // Exercise service layer directly (no HTTP server)
  const { createWorkPublicService } = require('../dist/src/services/work-public.js');
  const work = createWorkPublicService(app);

  const fakeCtx = (query = {}, params = {}) => {
    const ctx = {
      query,
      params,
      status: 200,
      body: null,
    };
    return ctx;
  };

  {
    const ctx = fakeCtx({ locale: 'zh-CN' });
    await work.getCategoryTree(ctx);
    if (!Array.isArray(ctx.body?.data) || !ctx.body.data[0]?.children) throw new Error(JSON.stringify(ctx.body));
    ok('category tree');
  }
  {
    const ctx = fakeCtx({ locale: 'zh-CN' }, { slug: 'film' });
    await work.getCategoryBySlug(ctx);
    if (ctx.body?.data?.slug !== 'film') throw new Error(JSON.stringify(ctx.body));
    ok('category by slug');
  }
  {
    const ctx = fakeCtx({ locale: 'zh-CN' });
    await work.getTags(ctx);
    if (!ctx.body?.data?.some((t) => t.slug === 'cgi')) throw new Error(JSON.stringify(ctx.body));
    ok('tags');
  }
  {
    const ctx = fakeCtx({ locale: 'zh-CN', tags: 'cgi', pageSize: 12 });
    await work.listProjects(ctx);
    if (!ctx.body?.data?.some((p) => p.slug === 'sample-project')) throw new Error(JSON.stringify(ctx.body));
    ok('projects list + tag OR');
  }
  {
    const ctx = fakeCtx({ locale: 'zh-CN', pageSize: 99 });
    await work.listProjects(ctx);
    if (ctx.status !== 400 || ctx.body?.error?.code !== 'INVALID_FILTER') throw new Error(JSON.stringify(ctx.body));
    ok('pageSize cap');
  }
  {
    const ctx = fakeCtx({ locale: 'zh-CN' }, { slug: 'sample-project' });
    await work.getProjectBySlug(ctx);
    if (!ctx.body?.data?.mediaItems) throw new Error(JSON.stringify(ctx.body));
    ok('project detail');
  }
  {
    const ctx = fakeCtx({ locale: 'zh-CN' });
    await work.getFeatured(ctx);
    if (!ctx.body?.data?.length) throw new Error(JSON.stringify(ctx.body));
    ok('featured');
  }
  {
    const ctx = fakeCtx({ locale: 'zh-CN' }, { documentId: project.documentId });
    await work.getRelated(ctx);
    if (!Array.isArray(ctx.body?.data)) throw new Error(JSON.stringify(ctx.body));
    ok('related');
  }
  {
    const ctx = fakeCtx({ locale: 'zh-CN', q: 'brand' });
    await work.search(ctx);
    if (!ctx.body?.meta?.query) throw new Error(JSON.stringify(ctx.body));
    ok('search');
  }
  {
    const ctx = fakeCtx({ locale: 'zh-CN' });
    await work.getWorkPage(ctx);
    if (!ctx.body?.data?.title) throw new Error(JSON.stringify(ctx.body));
    ok('work page');
  }
} catch (err) {
  fail('setup/run', err);
}

await app.destroy();
if (failed) {
  console.error(`verify-work-api: ${failed} failure(s)`);
  process.exit(1);
}
console.log('verify-work-api: OK');
process.exit(0);
