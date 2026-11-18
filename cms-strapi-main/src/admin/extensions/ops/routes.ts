/**
 * Operator-facing CMS routes.
 * Six hubs mirror the localization-pack menu groups.
 * Strapi 5.52 has no nested addMenuLink — subsections live as hub cards.
 */

export type ContentKind = 'collection' | 'single';

export type ContentLink = {
  /** URL segment under hub */
  slug: string;
  /** Operator label */
  label: string;
  /** Short helper for editors */
  hint: string;
  /** Strapi content-type UID */
  uid: string;
  kind: ContentKind;
  /** Content-Manager deep link */
  cmTo: string;
  /** Optional module tag matching frontend build scripts */
  module?: 'hero' | 'about' | 'services' | 'contact' | 'work' | 'seo' | 'faq';
};

const cmCollection = (uid: string) => `/content-manager/collection-types/${uid}`;
const cmSingle = (uid: string) => `/content-manager/single-types/${uid}`;

/** 官网内容管理 */
export const WEBSITE_LINKS: ContentLink[] = [
  {
    slug: 'hero',
    label: '首页管理',
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
    slug: 'contact',
    label: '联系与站点配置',
    hint: '联络信息、品牌与版权（含原「全局网站配置」）',
    uid: 'api::global-setting.global-setting',
    kind: 'single',
    cmTo: cmSingle('api::global-setting.global-setting'),
    module: 'contact',
  },
  {
    slug: 'faq',
    label: '常见问题',
    hint: 'FAQ 条目',
    uid: 'api::faq.faq',
    kind: 'collection',
    cmTo: cmCollection('api::faq.faq'),
    module: 'faq',
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
    slug: 'certification',
    label: '认证资质',
    hint: '归档模型；按需维护',
    uid: 'api::certification.certification',
    kind: 'collection',
    cmTo: cmCollection('api::certification.certification'),
  },
];

/** 作品案例管理 */
export const WORK_LINKS: ContentLink[] = [
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
    slug: 'overview',
    label: '作品频道页',
    hint: 'Work 频道标题、精选与 SEO',
    uid: 'api::work-page.work-page',
    kind: 'single',
    cmTo: cmSingle('api::work-page.work-page'),
    module: 'work',
  },
  {
    slug: 'media',
    label: '关联素材',
    hint: '作品详情页媒体块',
    uid: 'api::work-project-media.work-project-media',
    kind: 'collection',
    cmTo: cmCollection('api::work-project-media.work-project-media'),
    module: 'work',
  },
];

/** 内容与 SEO */
export const SEO_LINKS: ContentLink[] = [
  {
    slug: 'articles',
    label: '文章管理',
    hint: '归档文章模型',
    uid: 'api::article.article',
    kind: 'collection',
    cmTo: cmCollection('api::article.article'),
  },
  {
    slug: 'categories',
    label: '文章分类',
    hint: '归档文章分类',
    uid: 'api::category.category',
    kind: 'collection',
    cmTo: cmCollection('api::category.category'),
  },
  {
    slug: 'authors',
    label: '作者管理',
    hint: '归档作者',
    uid: 'api::author.author',
    kind: 'collection',
    cmTo: cmCollection('api::author.author'),
  },
  {
    slug: 'page-seo',
    label: 'SEO配置',
    hint: '按路由的 SEO 条目',
    uid: 'api::page-seo.page-seo',
    kind: 'collection',
    cmTo: cmCollection('api::page-seo.page-seo'),
    module: 'seo',
  },
];

/** 媒体资源管理 — 无独立「媒体同步」后台页（仅 CLI），不展示虚构入口 */
export const MEDIA_LINKS: Array<{ label: string; hint: string; to: string }> = [
  {
    label: '全部素材',
    hint: '上传、预览、替换图片与视频',
    to: '/plugins/upload',
  },
  {
    label: '图片资源',
    hint: '进入媒体库后按图片类型筛选',
    to: '/plugins/upload?sort=createdAt:DESC',
  },
  {
    label: '视频资源',
    hint: '进入媒体库后按视频类型筛选',
    to: '/plugins/upload?sort=createdAt:DESC',
  },
  {
    label: '文件资源',
    hint: '进入媒体库浏览全部文件与文件夹',
    to: '/plugins/upload',
  },
];

/** 系统设置 — 「运行状态」当前无独立页，暂不展示 */
export const SYSTEM_LINKS: Array<{ label: string; hint: string; to: string }> = [
  { label: '管理员', hint: '后台登录账号', to: '/settings/users' },
  { label: '角色与权限', hint: '管理员角色与权限', to: '/settings/roles' },
  { label: '多语言设置', hint: '内容语言（i18n）', to: '/settings/internationalization' },
  { label: 'API 权限', hint: 'Public / Authenticated 权限', to: '/settings/users-permissions' },
  { label: '系统信息', hint: '应用信息与偏好', to: '/settings/application-infos' },
];

/** Stats cards for Dashboard — one request path each */
export const DASHBOARD_STATS = [
  { key: 'hero', label: '首页管理', uid: 'api::hero-item.hero-item', kind: 'collection' as const },
  { key: 'services', label: '服务项目', uid: 'api::service-item.service-item', kind: 'collection' as const },
  { key: 'awards', label: '奖项', uid: 'api::award.award', kind: 'collection' as const },
  { key: 'work', label: '作品案例', uid: 'api::work-project.work-project', kind: 'collection' as const },
  { key: 'faq', label: '常见问题', uid: 'api::faq.faq', kind: 'collection' as const },
];
