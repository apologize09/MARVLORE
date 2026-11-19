#!/usr/bin/env node
/**
 * Chinese Content Manager labels for work-project (and related Work types).
 * Only updates metadatas.*.edit/list.label — no schema structure changes.
 *
 * Dry-run by default. Apply: node scripts/patch-work-project-field-labels-cn.mjs --execute
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CMS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXECUTE = process.argv.includes('--execute');

const LABELS = {
  'api::work-project.work-project': {
    title: '标题',
    slug: '别名',
    subtitle: '副标题',
    eyebrow: '眉题',
    summary: '摘要',
    description: '描述',
    category: '所属分类',
    categoryNameCn: '所属分类中文名',
    tags: '标签',
    cover: '封面',
    coverUrl: '封面 URL（静态回退）',
    thumbnail: '缩略图（已停用）',
    thumbnailUrl: '缩略图 URL（已停用）',
    heroMedia: '主视觉媒体',
    heroMediaUrl: '主视觉媒体 URL（静态回退）',
    video: '视频',
    videoUrl: '视频 URL（静态回退）',
    poster: '海报（已停用）',
    posterUrl: '海报 URL（已停用）',
    previewVideo: '预览视频（已停用）',
    previewVideoUrl: '预览视频 URL（已停用）',
    homePreviewVideo: '首页预览视频',
    homePreviewVideoUrl: '首页预览视频 URL（静态回退）',
    clientName: '客户名称',
    projectYear: '项目年份',
    projectType: '项目类型',
    focusX: '焦点 X',
    focusY: '焦点 Y',
    isFeatured: '精选',
    showOnHome: '首页展示',
    sortOrder: '排序',
    relatedProjects: '相关作品',
    relatedFrom: '被关联自',
    mediaItems: '详情媒体块',
    legacyId: '旧版 ID',
    seo: 'SEO',
  },
  'api::work-category.work-category': {
    name: '英文名',
    nameCn: '中文名',
    eyebrow: '眉题',
    slug: '别名',
    description: '描述',
    level: '层级',
    parent: '父分类',
    children: '子分类',
    cover: '封面',
    coverUrl: '封面 URL（静态回退）',
    sortOrder: '排序',
    isActive: '启用',
    legacyId: '旧版 ID',
    tags: '标签',
    projects: '作品',
    seo: 'SEO',
  },
  'api::work-tag.work-tag': {
    name: '名称',
    slug: '别名',
    description: '描述',
    color: '颜色',
    categories: '适用分类',
    projects: '作品',
    sortOrder: '排序',
    isActive: '启用',
    legacyId: '旧版 ID',
  },
  'api::work-project-media.work-project-media': {
    project: '所属作品',
    blockType: '块类型',
    title: '标题',
    body: '正文',
    image: '图片',
    imageUrl: '图片 URL（静态回退）',
    video: '视频',
    videoUrl: '视频 URL（静态回退）',
    poster: '海报',
    posterUrl: '海报 URL（静态回退）',
    embedUrl: '嵌入链接',
    altText: '替代文本',
    caption: '图注',
    displayMode: '展示模式',
    aspectRatio: '宽高比',
    sortOrder: '排序',
    legacyId: '旧版 ID',
  },
  'api::work-page.work-page': {
    title: '标题',
    intro: '引言',
    featuredProjects: '精选作品',
    displayCategories: '展示分类',
    showFeatured: '显示精选',
    seo: 'SEO',
  },
  'api::hero-item.hero-item': {
    title: '标题',
    slug: '别名',
    role: '角色',
    mediaType: '媒体类型',
    alt: '替代文本',
    image: '图片',
    imageUrl: '图片 URL（静态回退）',
    video: '视频',
    videoUrl: '视频 URL（静态回退）',
    videoHd: '高清视频',
    videoUrlHd: '高清视频 URL（静态回退）',
    preview: '预览图',
    previewUrl: '预览图 URL（静态回退）',
    homePreview: '首页预览',
    homePreviewUrl: '首页预览 URL（静态回退）',
    slides: '幻灯片',
    width: '宽度',
    height: '高度',
    sortOrder: '排序',
    isActive: '启用',
    legacyId: '旧版 ID',
  },
  'api::about-page.about-page': {
    brandName: '品牌名（英）',
    brandNameCn: '品牌名（中）',
    partnerLine: '合作说明（英）',
    partnerLineCn: '合作说明（中）',
    stats: '数据统计',
    collageImages: '拼贴图',
    seo: 'SEO',
  },
  'api::service-item.service-item': {
    titleEn: '标题（英）',
    titleCn: '标题（中）',
    slug: '别名',
    description: '描述',
    image: '图片',
    imageUrl: '图片 URL（静态回退）',
    typeScale: '字号比例',
    sortOrder: '排序',
    isActive: '启用',
    legacyId: '旧版 ID',
  },
  'api::award.award': {
    name: '名称',
    alt: '替代文本',
    image: '图片',
    imageUrl: '图片 URL（静态回退）',
    organization: '颁发机构',
    description: '描述',
    awardYear: '年份',
    externalUrl: '外部链接',
    sortOrder: '排序',
    isActive: '启用',
    legacyId: '旧版 ID',
  },
  'api::global-setting.global-setting': {
    siteName: '站点名称（英）',
    siteNameCn: '站点名称（中）',
    tagline: '标语',
    email: '邮箱',
    phone: '电话',
    phoneDisplay: '电话展示文案',
    wechat: '微信',
    addressEn: '地址（英）',
    addressCn: '地址（中）',
    studioNoteEn: '工作室说明（英）',
    studioNoteCn: '工作室说明（中）',
    welcomeCn: '欢迎语（中）',
    copyrightText: '版权文案',
    defaultSeo: '默认 SEO',
    socialLinks: '社交链接',
  },
  'api::faq.faq': {
    question: '问题',
    answer: '回答',
    category: '分类',
    sortOrder: '排序',
  },
  'api::page-seo.page-seo': {
    pageId: '页面 ID',
    path: '路径',
    metaTitle: 'SEO 标题',
    metaDescription: 'SEO 描述',
    ogTitle: 'OG 标题',
    ogDescription: 'OG 描述',
    keywords: '关键词',
    robots: 'Robots',
    shareImage: '分享图',
    sortOrder: '排序',
  },
  'api::article.article': {
    title: '标题',
    description: '描述',
    slug: '别名',
    cover: '封面',
    author: '作者',
    category: '分类',
    blocks: '内容块',
  },
  'api::author.author': {
    name: '名称',
    avatar: '头像',
    email: '邮箱',
    articles: '文章',
  },
  'api::category.category': {
    name: '名称',
    slug: '别名',
    articles: '文章',
    description: '描述',
  },
  'api::certification.certification': {
    codeKey: '编码键',
    name: '名称',
    code: '证书编号',
    description: '描述',
    verifiedBy: '认证机构',
    sortOrder: '排序',
  },
};

const DESCRIPTIONS = {
  'api::work-project.work-project': {
    category: '官网作品方向（二级分类）',
    categoryNameCn: '由所属分类自动同步，列表筛选用。一般无需手改。',
    cover: '作品主图：列表缩略、详情封面、视频海报均使用此图。',
    coverUrl: '可选；无媒体库文件时的静态资源回退路径',
    thumbnailUrl: '已停用：前台统一使用封面。',
    heroMediaUrl: '可选',
    videoUrl: '可选',
    posterUrl: '已停用：前台统一使用封面。',
    previewVideoUrl: '已停用：前台统一使用首页预览视频。',
    homePreviewVideo: '首页圆柱卡片循环预览（轻量）；列表预览也使用此视频。',
    homePreviewVideoUrl: '可选；无媒体库文件时的静态资源回退路径。',
  },
};

function applyLabels(cfg, uid) {
  const map = LABELS[uid];
  if (!map) return cfg;
  const next = structuredClone(cfg);
  next.metadatas = next.metadatas || {};
  const descs = DESCRIPTIONS[uid] || {};

  for (const [field, label] of Object.entries(map)) {
    next.metadatas[field] = next.metadatas[field] || { edit: {}, list: {} };
    next.metadatas[field].edit = {
      ...(next.metadatas[field].edit || {}),
      label,
      visible: next.metadatas[field].edit?.visible !== false,
      editable: next.metadatas[field].edit?.editable !== false,
      ...(descs[field] ? { description: descs[field] } : {}),
    };
    next.metadatas[field].list = {
      ...(next.metadatas[field].list || {}),
      label,
      searchable: next.metadatas[field].list?.searchable !== false,
      sortable: next.metadatas[field].list?.sortable !== false,
    };
  }
  return next;
}

async function main() {
  process.chdir(CMS_ROOT);
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ distDir: './dist' }).load();

  try {
    for (const uid of Object.keys(LABELS)) {
      const key = `plugin_content_manager_configuration_content_types::${uid}`;
      const row = await app.db.query('strapi::core-store').findOne({ where: { key } });
      if (!row) {
        console.warn('missing', key);
        continue;
      }
      const cfg = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      const next = applyLabels(cfg, uid);
      const sample = ['title', 'slug', 'subtitle', 'cover', 'thumbnail', 'heroMedia']
        .filter((f) => next.metadatas?.[f])
        .map((f) => `${f}=${next.metadatas[f].edit.label}`)
        .join(', ');
      console.log(uid, '→', sample || '(ok)');
      if (EXECUTE) {
        await app.db.query('strapi::core-store').update({
          where: { id: row.id },
          data: { value: JSON.stringify(next) },
        });
      }
    }
    if (!EXECUTE) console.log('dry-run only; pass --execute to apply');
    else console.log('CM field labels updated');
  } finally {
    await app.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
