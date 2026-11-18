import type { StrapiApp } from '@strapi/strapi/admin';
import {
  BRAND,
  installMarvloreDocumentTitle,
  marvloreBrandTranslations,
} from './extensions/marvlore-brand';
import { nativeAdminTranslations } from './extensions/i18n';
import { registerOpsMenu } from './extensions/ops/register';
import { installWorkCategoryListUx } from './extensions/work-category-list';
import MarvloreMark from './extensions/marvlore-mark.svg';

const ADMIN_UI_LOCALE = 'zh-Hans';
const STORAGE_KEY = 'strapi-admin-language';

/** Chinese labels for Content Manager type names (ops-friendly). */
const contentTypeNameTranslations = {
  'zh-Hans': {
    'content-manager.api::hero-item.hero-item': '首页主视觉',
    'content-manager.api::about-page.about-page': '关于我们页面',
    'content-manager.api::service-item.service-item': '服务项目',
    'content-manager.api::award.award': '奖项',
    'content-manager.api::global-setting.global-setting': '全局网站配置',
    'content-manager.api::faq.faq': '常见问题',
    'content-manager.api::page-seo.page-seo': 'SEO配置',
    'content-manager.api::work-page.work-page': '作品页面配置',
    'content-manager.api::work-category.work-category': '作品分类',
    'content-manager.api::work-tag.work-tag': '作品标签',
    'content-manager.api::work-project.work-project': '作品案例',
    'content-manager.api::work-project-media.work-project-media': '关联素材',
    'content-manager.api::article.article': '（归档）文章',
    'content-manager.api::author.author': '（归档）作者',
    'content-manager.api::category.category': '（归档）文章分类',
    'content-manager.api::certification.certification': '（归档）认证资质',
    'marvlore.ops.dashboard': '工作台',
    'marvlore.ops.website': '官网内容管理',
    'marvlore.ops.work': '作品案例管理',
    'marvlore.ops.media': '媒体资源管理',
    'marvlore.ops.seo': '内容与 SEO',
    'marvlore.ops.system': '系统设置',
  },
  en: {
    'marvlore.ops.dashboard': 'Dashboard',
    'marvlore.ops.website': 'Website Management',
    'marvlore.ops.work': 'Work Studio',
    'marvlore.ops.media': 'Media Library',
    'marvlore.ops.seo': 'Content & SEO',
    'marvlore.ops.system': 'System',
  },
};

function mergeTranslations(
  base: Record<string, Record<string, string>>,
  extra: Record<string, Record<string, string>>,
) {
  const out: Record<string, Record<string, string>> = { ...base };
  for (const [locale, dict] of Object.entries(extra)) {
    out[locale] = { ...(out[locale] || {}), ...dict };
  }
  return out;
}

export default {
  config: {
    locales: [ADMIN_UI_LOCALE, 'en'],
    translations: mergeTranslations(
      mergeTranslations(
        nativeAdminTranslations(),
        marvloreBrandTranslations as unknown as Record<string, Record<string, string>>,
      ),
      contentTypeNameTranslations,
    ),
    auth: { logo: MarvloreMark },
    menu: { logo: MarvloreMark },
    head: { favicon: MarvloreMark },
  },
  register(app: StrapiApp) {
    registerOpsMenu(app);
  },
  bootstrap(_app: StrapiApp) {
    installMarvloreDocumentTitle();
    installWorkCategoryListUx();

    try {
      if (typeof window !== 'undefined' && !window.localStorage.getItem(STORAGE_KEY)) {
        window.localStorage.setItem(STORAGE_KEY, ADMIN_UI_LOCALE);
      }
    } catch {
      // ignore private-mode / unavailable storage
    }

    if (typeof window !== 'undefined') {
      (window as unknown as { __MARVLORE_ADMIN_BRAND__?: string }).__MARVLORE_ADMIN_BRAND__ = BRAND;
    }
  },
};
