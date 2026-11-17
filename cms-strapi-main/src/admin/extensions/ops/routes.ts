/**
 * Operator-facing CMS routes.
 * Kept modular (Website / Work / Media / System) to mirror site build-*.mjs boundaries.
 */

export type ContentLink = {
  /** Operator label (zh) */
  label: string;
  /** Short helper for editors */
  hint: string;
  /** Content-Manager deep link (admin-relative) */
  to: string;
  /** Optional module tag matching frontend build scripts */
  module?: 'hero' | 'about' | 'services' | 'contact' | 'work' | 'seo' | 'faq';
};

const cmCollection = (uid: string) => `/content-manager/collection-types/${uid}`;
const cmSingle = (uid: string) => `/content-manager/single-types/${uid}`;

/** Website Management — homepage sections */
export const WEBSITE_LINKS: ContentLink[] = [
  {
    label: 'Hero',
    hint: '首页轮播 / 轨道媒体',
    to: cmCollection('api::hero-item.hero-item'),
    module: 'hero',
  },
  {
    label: 'About',
    hint: '关于页文案与拼贴图',
    to: cmSingle('api::about-page.about-page'),
    module: 'about',
  },
  {
    label: 'Services',
    hint: '服务目录条目',
    to: cmCollection('api::service-item.service-item'),
    module: 'services',
  },
  {
    label: 'Awards',
    hint: '奖项轮播',
    to: cmCollection('api::award.award'),
  },
  {
    label: 'Contact',
    hint: '联络与全局站点信息',
    to: cmSingle('api::global-setting.global-setting'),
    module: 'contact',
  },
  {
    label: 'FAQ',
    hint: '常见问题',
    to: cmCollection('api::faq.faq'),
    module: 'faq',
  },
  {
    label: 'SEO',
    hint: '页面 SEO 条目',
    to: cmCollection('api::page-seo.page-seo'),
    module: 'seo',
  },
];

/** Work Studio — portfolio pipeline */
export const WORK_LINKS: ContentLink[] = [
  {
    label: '作品总览',
    hint: 'Work 频道页标题与 SEO',
    to: cmSingle('api::work-page.work-page'),
    module: 'work',
  },
  {
    label: '分类',
    hint: '作品一级 / 二级分类',
    to: cmCollection('api::work-category.work-category'),
    module: 'work',
  },
  {
    label: '标签',
    hint: '作品筛选标签',
    to: cmCollection('api::work-tag.work-tag'),
    module: 'work',
  },
  {
    label: '作品',
    hint: '作品条目与封面媒体',
    to: cmCollection('api::work-project.work-project'),
    module: 'work',
  },
  {
    label: '详情媒体',
    hint: '作品详情页媒体块',
    to: cmCollection('api::work-project-media.work-project-media'),
    module: 'work',
  },
];

export const MEDIA_LINKS: ContentLink[] = [
  {
    label: '媒体库',
    hint: '上传、预览、替换图片与视频',
    to: '/plugins/upload',
  },
];

export const SYSTEM_LINKS: ContentLink[] = [
  { label: '用户', hint: '后台登录账号', to: '/settings/users' },
  { label: '角色与权限', hint: '管理员角色', to: '/settings/roles' },
  { label: '语言', hint: '内容语言（i18n）', to: '/settings/internationalization' },
  { label: 'API 权限', hint: 'Public / Authenticated 权限', to: '/settings/users-permissions' },
  { label: '系统配置', hint: '应用信息与偏好', to: '/settings/application-infos' },
];

/** Stats cards for Dashboard — one request path each */
export const DASHBOARD_STATS = [
  { key: 'hero', label: 'Hero', uid: 'api::hero-item.hero-item', kind: 'collection' as const },
  { key: 'services', label: 'Services', uid: 'api::service-item.service-item', kind: 'collection' as const },
  { key: 'awards', label: 'Awards', uid: 'api::award.award', kind: 'collection' as const },
  { key: 'work', label: '作品', uid: 'api::work-project.work-project', kind: 'collection' as const },
  { key: 'faq', label: 'FAQ', uid: 'api::faq.faq', kind: 'collection' as const },
];
