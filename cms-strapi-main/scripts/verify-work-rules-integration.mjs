/**
 * Boots Strapi against a disposable DB copy and exercises document-rule validations.
 * Run: node ./scripts/verify-work-rules-integration.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

process.chdir(root);
process.env.PORT = process.env.PORT || '1340';
process.env.DATABASE_FILENAME = process.env.DATABASE_FILENAME || '.tmp/verify-work-rules.db';

const backup = path.join(root, '.backups/phase1-20261116/data.db');
const target = path.join(root, process.env.DATABASE_FILENAME);
fs.mkdirSync(path.dirname(target), { recursive: true });
if (fs.existsSync(backup)) {
  fs.copyFileSync(backup, target);
} else {
  fs.rmSync(target, { force: true });
}

const { createStrapi } = require('@strapi/strapi');

const app = await createStrapi({ distDir: './dist' }).load();

const catUid = 'api::work-category.work-category';
const tagUid = 'api::work-tag.work-tag';
const projectUid = 'api::work-project.work-project';
const mediaUid = 'api::work-project-media.work-project-media';

let failed = 0;
async function expectReject(label, fn) {
  try {
    await fn();
    console.error('FAIL (expected reject):', label);
    failed += 1;
  } catch (err) {
    console.log('OK reject:', label, '-', err.message || err);
  }
}

async function expectOk(label, fn) {
  try {
    const result = await fn();
    console.log('OK:', label);
    return result;
  } catch (err) {
    console.error('FAIL:', label, err.message || err);
    failed += 1;
    return null;
  }
}

const level1 = await expectOk('create level-1 category', () =>
  app.documents(catUid).create({
    data: {
      name: 'Creative',
      slug: 'creative-verify',
      level: 1,
      isActive: true,
      sortOrder: 0,
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

await expectReject('level-1 with parent', () =>
  app.documents(catUid).create({
    data: {
      name: 'Bad',
      slug: 'bad-l1',
      level: 1,
      parent: level1.documentId,
      isActive: true,
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

await expectReject('level-2 without parent', () =>
  app.documents(catUid).create({
    data: {
      name: 'Orphan',
      slug: 'orphan-l2',
      level: 2,
      isActive: true,
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

const level2 = await expectOk('create level-2 under level-1', () =>
  app.documents(catUid).create({
    data: {
      name: 'Film',
      slug: 'film-verify',
      level: 2,
      parent: level1.documentId,
      isActive: true,
      sortOrder: 0,
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

await expectReject('project without category', () =>
  app.documents(projectUid).create({
    data: {
      title: 'No Cat',
      slug: 'no-cat',
      projectType: 'image',
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

await expectReject('project on level-1 category', () =>
  app.documents(projectUid).create({
    data: {
      title: 'Bad Cat',
      slug: 'bad-cat',
      projectType: 'image',
      category: level1.documentId,
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

const project = await expectOk('create project on level-2', () =>
  app.documents(projectUid).create({
    data: {
      title: 'Verify Project',
      slug: 'verify-project',
      projectType: 'video',
      category: level2.documentId,
      videoUrl: '/assets/hero-video/demo.mp4',
      sortOrder: 1,
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

await expectReject('image media without asset', () =>
  app.documents(mediaUid).create({
    data: {
      blockType: 'image',
      project: project.documentId,
      sortOrder: 0,
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

await expectOk('image media with imageUrl', () =>
  app.documents(mediaUid).create({
    data: {
      blockType: 'image',
      project: project.documentId,
      imageUrl: '/assets/work/demo.webp',
      sortOrder: 0,
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

await expectReject('delete category with projects', () =>
  app.documents(catUid).delete({ documentId: level2.documentId })
);

await expectReject('delete category with children', () =>
  app.documents(catUid).delete({ documentId: level1.documentId })
);

// tag scoped to level2, then project with wrong applicability is covered when tag has categories
const tag = await expectOk('create tag scoped to level-2', () =>
  app.documents(tagUid).create({
    data: {
      name: 'CGI',
      slug: 'cgi-verify',
      isActive: true,
      categories: [level2.documentId],
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

await expectReject('tag linked to level-1 category', () =>
  app.documents(tagUid).create({
    data: {
      name: 'BadTag',
      slug: 'bad-tag',
      categories: [level1.documentId],
    },
    status: 'published',
    locale: 'zh-CN',
  })
);

await app.destroy();

if (failed > 0) {
  console.error(`verify-work-rules-integration: ${failed} failure(s)`);
  process.exit(1);
}
console.log('verify-work-rules-integration: OK');
process.exit(0);
