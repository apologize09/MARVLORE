/**
 * Operator-facing CMS routes.
 * Kept modular (Website / Work / Media / System) to mirror site build-*.mjs boundaries.
 */

export type ContentKind = 'collection' | 'single';

export type ContentLink = {
  /** URL segment under /ops/website or /ops/work */
  slug: string;
  /** Operator label */
  label: string;
  /** Short helper for editors */
  hint: string;
  /** Strapi content-type UID */
  uid: string;
  kind: ContentKind;
  /** Content-Manager deep link (advanced editor fallback) */
  cmTo: string;
  /** Optional module tag matching frontend build scripts */
  module?: 'hero' | 'about' | 'services' | 'contact' | 'work' | 'seo' | 'faq';
};

const cmCollection = (uid: string) => `/content-manager/collection-types/${uid}`;
const cmSingle = (uid: string) => `/content-manager/single-types/${uid}`;

/** Website Management — homepage sections (in-hub paths: /ops/website/:slug) */
export const WEBSITE_LINKS: ContentLink[] = [
  {
    slug: 'hero',
    label: '首页主视觉',
    hint: '首页轮播 / 轨道媒体',
    uid: 'api::hero-item.hero-item',
    kind: 'collection',
    cmTo: cmCollection('api::hero-item.hero-item'),
    module: 'hero',
  },
  {
    slug: 'about',
    label: '关于我们',
    hint: '关于页文案与拼贴图',
    uid: 'api::about-page.about-page',
    kind: 'single',
    cmTo: cmSingle('api::about-page.about-page'),
    module: 'about',
  },
  {
    slug: 'services',
    label: '服务项目',
    hint: '服务目录条目',
    uid: 'api::service-item.service-item',
    kind: 'collection',
    cmTo: cmCollection('api::service-item.service-item'),
    module: 'services',
  },
  {
    slug: 'awards',
    label: '奖项',
    hint: '奖项轮播',
    uid: 'api::award.award',
    kind: 'collection',
    cmTo: cmCollection('api::award.award'),
  },
  {
    slug: 'contact',
    label: '联系我们',
    hint: '联络与全局站点信息',
    uid: 'api::global-setting.global-setting',
    kind: 'single',
    cmTo: cmSingle('api::global-setting.global-setting'),
    module: 'contact',
  },
  {
    slug: 'faq',
    label: 'FAQ',
    hint: '常见问题',
    uid: 'api::faq.faq',
    kind: 'collection',
    cmTo: cmCollection('api::faq.faq'),
    module: 'faq',
  },
  {
    slug: 'seo',
    label: '页面 SEO',
    hint: '页面 SEO 条目',
    uid: 'api::page-seo.page-seo',
    kind: 'collection',
    cmTo: cmCollection('api::page-seo.page-seo'),
    module: 'seo',
  },
];

/** Work Studio — portfolio pipeline (in-hub paths: /ops/work/:slug) */
export const WORK_LINKS: ContentLink[] = [
  {
    slug: 'overview',
    label: '作品页面配置',
    hint: 'Work 频道页标题与 SEO',
    uid: 'api::work-page.work-page',
    kind: 'single',
    cmTo: cmSingle('api::work-page.work-page'),
    module: 'work',
  },
  {
    slug: 'categories',
    label: '作品分类',
    hint: '作品一级 / 二级分类',
    uid: 'api::work-category.work-category',
    kind: 'collection',
    cmTo: cmCollection('api::work-category.work-category'),
    module: 'work',
  },
  {
    slug: 'tags',
    label: '作品标签',
    hint: '作品筛选标签',
    uid: 'api::work-tag.work-tag',
    kind: 'collection',
    cmTo: cmCollection('api::work-tag.work-tag'),
    module: 'work',
  },
  {
    slug: 'projects',
    label: '作品列表',
    hint: '作品条目与封面媒体',
    uid: 'api::work-project.work-project',
    kind: 'collection',
    cmTo: cmCollection('api::work-project.work-project'),
    module: 'work',
  },
  {
    slug: 'media',
    label: '作品素材',
    hint: '作品详情页媒体块',
    uid: 'api::work-project-media.work-project-media',
    kind: 'collection',
    cmTo: cmCollection('api::work-project-media.work-project-media'),
    module: 'work',
  },
];

export const MEDIA_LINKS: Array<{ label: string; hint: string; to: string }> = [
  {
    label: '媒体库',
    hint: '上传、预览、替换图片与视频',
    to: '/plugins/upload',
  },
];

export const SYSTEM_LINKS: Array<{ label: string; hint: string; to: string }> = [
  { label: '用户', hint: '后台登录账号', to: '/settings/users' },
  { label: '角色与权限', hint: '管理员角色', to: '/settings/roles' },
  { label: '语言', hint: '内容语言（i18n）', to: '/settings/internationalization' },
  { label: 'API 权限', hint: 'Public / Authenticated 权限', to: '/settings/users-permissions' },
  { label: '系统配置', hint: '应用信息与偏好', to: '/settings/application-infos' },
];

/** Stats cards for Dashboard — one request path each */
export const DASHBOARD_STATS = [
  { key: 'hero', label: '首页主视觉', uid: 'api::hero-item.hero-item', kind: 'collection' as const },
  { key: 'services', label: '服务项目', uid: 'api::service-item.service-item', kind: 'collection' as const },
  { key: 'awards', label: '奖项', uid: 'api::award.award', kind: 'collection' as const },
  { key: 'work', label: '作品案例', uid: 'api::work-project.work-project', kind: 'collection' as const },
  { key: 'faq', label: '常见问题', uid: 'api::faq.faq', kind: 'collection' as const },
];
