'use strict';

const fs = require('fs');
const path = require('path');
const seed = require('../data/pouch-seed.json');

const MIME_BY_EXT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

function lookupMime(ext) {
  const key = String(ext || '').toLowerCase();
  try {
    return require('mime-types').lookup(key) || MIME_BY_EXT[key] || 'application/octet-stream';
  } catch {
    return MIME_BY_EXT[key] || 'application/octet-stream';
  }
}

const FRONTEND_IMAGES = path.resolve(
  __dirname,
  '../../../Phoenix-Pouch-Co.--main2.0/src/assets/images'
);
const LOCAL_UPLOADS = path.join(__dirname, '..', 'data', 'uploads');
const EXTRA_IMAGES = process.env.SEED_IMAGES_DIR
  ? path.resolve(process.env.SEED_IMAGES_DIR)
  : null;

async function count(uid) {
  try {
    return await strapi.db.query(uid).count();
  } catch {
    return 0;
  }
}

async function setPublicPermissions(newPermissions) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) return;

  for (const controller of Object.keys(newPermissions)) {
    for (const action of newPermissions[controller]) {
      const actionId = `api::${controller}.${controller}.${action}`;
      const existing = await strapi.query('plugin::users-permissions.permission').findOne({
        where: { action: actionId, role: publicRole.id },
      });
      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { action: actionId, role: publicRole.id },
        });
      }
    }
  }
}

function resolveImagePath(fileName) {
  const candidates = [
    path.join(LOCAL_UPLOADS, fileName),
    path.join(FRONTEND_IMAGES, fileName),
  ];
  if (EXTRA_IMAGES) candidates.unshift(path.join(EXTRA_IMAGES, fileName));
  return candidates.find((filePath) => fs.existsSync(filePath)) || null;
}

function getFileData(fileName) {
  const filePath = resolveImagePath(fileName);
  if (!filePath) return null;
  const stats = fs.statSync(filePath);
  const ext = fileName.split('.').pop();
  return {
    filepath: filePath,
    originalFileName: fileName,
    size: stats.size,
    mimetype: lookupMime(ext),
  };
}

async function uploadFile(file, name) {
  return strapi.plugin('upload').service('upload').upload({
    files: file,
    data: {
      fileInfo: {
        alternativeText: name,
        caption: name,
        name,
      },
    },
  });
}

async function checkFileExistsBeforeUpload(fileName) {
  if (!fileName) return null;
  const nameNoExt = fileName.replace(/\.[^.]+$/, '');
  const existing = await strapi.query('plugin::upload.file').findOne({
    where: { name: nameNoExt },
  });
  if (existing) return existing;

  const fileData = getFileData(fileName);
  if (!fileData) {
    console.warn(`[seed] image not found: ${fileName}`);
    return null;
  }
  const [file] = await uploadFile(fileData, nameNoExt);
  return file;
}

async function createEntry(uid, data) {
  await strapi.documents(uid).create({ data });
}

async function importCertifications() {
  if ((await count('api::certification.certification')) > 0) return;
  for (const entry of seed.certifications) {
    await createEntry('api::certification.certification', entry);
  }
}

async function importFaqs() {
  if ((await count('api::faq.faq')) > 0) return;
  for (const entry of seed.faqs) {
    await createEntry('api::faq.faq', entry);
  }
}

async function importServiceModels() {
  if ((await count('api::service-model.service-model')) > 0) return;
  for (const entry of seed.serviceModels) {
    await createEntry('api::service-model.service-model', entry);
  }
}

async function importPageSeos() {
  if ((await count('api::page-seo.page-seo')) > 0) return;
  for (const entry of seed.pageSeos || []) {
    const shareImage = await checkFileExistsBeforeUpload(entry.shareImage);
    await createEntry('api::page-seo.page-seo', {
      ...entry,
      shareImage: shareImage || undefined,
    });
  }
}

async function importProcessSteps() {
  if ((await count('api::process-step.process-step')) > 0) return;
  for (const step of seed.processSteps) {
    const image = await checkFileExistsBeforeUpload(step.image);
    await createEntry('api::process-step.process-step', {
      ...step,
      image: image || undefined,
    });
  }
}

async function importProductLines() {
  if ((await count('api::product-line.product-line')) > 0) return;
  for (const line of seed.productLines) {
    const heroImage = await checkFileExistsBeforeUpload(line.heroImage);
    const canImage = await checkFileExistsBeforeUpload(line.canImage);
    const openCanImage = await checkFileExistsBeforeUpload(line.openCanImage);
    const heroBanner = await checkFileExistsBeforeUpload(line.heroBanner);
    const categoryImage = await checkFileExistsBeforeUpload(line.categoryImage);
    const packagingImage = await checkFileExistsBeforeUpload(line.packagingImage);
    await createEntry('api::product-line.product-line', {
      ...line,
      heroImage: heroImage || undefined,
      canImage: canImage || undefined,
      openCanImage: openCanImage || undefined,
      heroBanner: heroBanner || undefined,
      categoryImage: categoryImage || undefined,
      packagingImage: packagingImage || undefined,
      publishedAt: Date.now(),
    });
  }
}

async function importGlobal() {
  const g = seed.global;
  const favicon = await checkFileExistsBeforeUpload(g.images.favicon);
  const shareImage = await checkFileExistsBeforeUpload(g.images.shareImage);
  const payload = {
    siteName: g.siteName,
    siteDescription: g.siteDescription,
    tagline: g.tagline,
    subTagline: g.subTagline,
    location: g.location,
    address: g.address,
    email: g.email,
    phone: g.phone,
    whatsapp: g.whatsapp,
    wechat: g.wechat,
    facilitySize: g.facilitySize,
    annualCapacity: g.annualCapacity,
    activeLines: g.activeLines,
    sampleTurnaround: g.sampleTurnaround,
    productionLeadTime: g.productionLeadTime,
    moq: g.moq,
    heroVideoUrl: g.heroVideoUrl,
    whyChooseUs: g.whyChooseUs,
    favicon: favicon || undefined,
    cleanroom: (await checkFileExistsBeforeUpload(g.images.cleanroom)) || undefined,
    yourBrandConcept: (await checkFileExistsBeforeUpload(g.images.yourBrandConcept)) || undefined,
    phoenixFacilityAerial:
      (await checkFileExistsBeforeUpload(g.images.phoenixFacilityAerial)) || undefined,
    phoenixLogistics: (await checkFileExistsBeforeUpload(g.images.phoenixLogistics)) || undefined,
    phoenixEcosystem: (await checkFileExistsBeforeUpload(g.images.phoenixEcosystem)) || undefined,
    phoenixTalent: (await checkFileExistsBeforeUpload(g.images.phoenixTalent)) || undefined,
    processHeroBanner: (await checkFileExistsBeforeUpload(g.images.processHeroBanner)) || undefined,
    defaultSeo: {
      ...g.defaultSeo,
      shareImage: shareImage || undefined,
    },
  };

  const existing = await strapi.documents('api::global.global').findFirst();
  if (existing?.documentId) {
    await strapi.documents('api::global.global').update({
      documentId: existing.documentId,
      data: payload,
    });
    return;
  }
  await createEntry('api::global.global', payload);
}

async function importAbout() {
  const existing = await strapi.documents('api::about.about').findFirst();
  const payload = {
    title: seed.about.title,
    blocks: seed.about.blocks,
  };
  if (existing?.documentId) {
    if (existing.title === 'About the strapi blog' || !existing.title) {
      await strapi.documents('api::about.about').update({
        documentId: existing.documentId,
        data: payload,
      });
    }
    return;
  }
  await createEntry('api::about.about', payload);
}

async function importTaxonomy() {
  if ((await count('api::category.category')) === 0) {
    for (const category of seed.categories) {
      await createEntry('api::category.category', category);
    }
  }
  if ((await count('api::author.author')) === 0) {
    for (const author of seed.authors) {
      const avatar = await checkFileExistsBeforeUpload(author.avatar);
      await createEntry('api::author.author', { ...author, avatar: avatar || undefined });
    }
  }
  if ((await count('api::article.article')) === 0) {
    const authors = await strapi.documents('api::author.author').findMany();
    const categories = await strapi.documents('api::category.category').findMany();
    const author = authors[0];
    for (const article of seed.articles) {
      const cover = await checkFileExistsBeforeUpload(article.cover);
      const category = categories.find((item) => item.slug === article.category);
      await createEntry('api::article.article', {
        title: article.title,
        slug: article.slug,
        description: article.description,
        cover: cover || undefined,
        blocks: article.blocks,
        author: author?.documentId ? { documentId: author.documentId } : undefined,
        category: category?.documentId ? { documentId: category.documentId } : undefined,
        publishedAt: Date.now(),
      });
    }
  }
}

async function importSeedData() {
  await setPublicPermissions({
    article: ['find', 'findOne'],
    category: ['find', 'findOne'],
    author: ['find', 'findOne'],
    global: ['find', 'findOne'],
    about: ['find', 'findOne'],
    'product-line': ['find', 'findOne'],
    'process-step': ['find', 'findOne'],
    faq: ['find', 'findOne'],
    certification: ['find', 'findOne'],
    'service-model': ['find', 'findOne'],
    'page-seo': ['find', 'findOne'],
    'quote-request': ['create'],
  });

  await importCertifications();
  await importFaqs();
  await importServiceModels();
  await importPageSeos();
  await importProcessSteps();
  await importProductLines();
  await importGlobal();
  await importAbout();
  await importTaxonomy();
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';
  try {
    console.log('Seeding Phoenix Pouch Co. CMS data...');
    await importSeedData();
    console.log('Seed complete.');
  } catch (error) {
    console.error('Seed failed', error);
    await app.destroy();
    process.exit(1);
  }
  await app.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
