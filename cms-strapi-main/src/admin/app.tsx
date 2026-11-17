import type { StrapiApp } from '@strapi/strapi/admin';
import {
  BRAND,
  installMarvloreDocumentTitle,
  marvloreBrandTranslations,
} from './extensions/marvlore-brand';
import { registerOpsMenu } from './extensions/ops/register';
import MarvloreMark from './extensions/marvlore-mark.svg';

const ADMIN_UI_LOCALE = 'zh-Hans';
const STORAGE_KEY = 'strapi-admin-language';

/** Chinese labels for Content Manager type names (ops-friendly). */
const contentTypeNameTranslations = {
  'zh-Hans': {
    'content-manager.api::hero-item.hero-item': 'Hero',
    'content-manager.api::about-page.about-page': 'About',
    'content-manager.api::service-item.service-item': 'Services',
    'content-manager.api::award.award': 'Awards',
    'content-manager.api::global-setting.global-setting': 'Contact',
    'content-manager.api::faq.faq': 'FAQ',
    'content-manager.api::page-seo.page-seo': 'SEO',
    'content-manager.api::work-page.work-page': '作品总览',
    'content-manager.api::work-category.work-category': '分类',
    'content-manager.api::work-tag.work-tag': '标签',
    'content-manager.api::work-project.work-project': '作品',
    'content-manager.api::work-project-media.work-project-media': '详情媒体',
    'content-manager.api::article.article': '（归档）Article',
    'content-manager.api::author.author': '（归档）Author',
    'content-manager.api::category.category': '（归档）Category',
    'content-manager.api::certification.certification': '（归档）Certification',
    'marvlore.ops.dashboard': 'Dashboard',
    'marvlore.ops.website': 'Website Management',
    'marvlore.ops.work': 'Work Studio',
    'marvlore.ops.media': 'Media Library',
    'marvlore.ops.system': 'System',
  },
  en: {
    'marvlore.ops.dashboard': 'Dashboard',
    'marvlore.ops.website': 'Website Management',
    'marvlore.ops.work': 'Work Studio',
    'marvlore.ops.media': 'Media Library',
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
      marvloreBrandTranslations as unknown as Record<string, Record<string, string>>,
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
