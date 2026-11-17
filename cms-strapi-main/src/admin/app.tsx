import type { StrapiApp } from '@strapi/strapi/admin';
import {
  BRAND,
  installMarvloreDocumentTitle,
  marvloreBrandTranslations,
} from './extensions/marvlore-brand';

const ADMIN_UI_LOCALE = 'zh-Hans';
const STORAGE_KEY = 'strapi-admin-language';

export default {
  config: {
    // Admin panel UI languages (content locales zh-CN + en stay on the i18n plugin)
    locales: [ADMIN_UI_LOCALE, 'en'],
    translations: marvloreBrandTranslations,
  },
  bootstrap(_app: StrapiApp) {
    installMarvloreDocumentTitle();

    // Default new browsers / login screen to Simplified Chinese when unset
    try {
      if (typeof window !== 'undefined' && !window.localStorage.getItem(STORAGE_KEY)) {
        window.localStorage.setItem(STORAGE_KEY, ADMIN_UI_LOCALE);
      }
    } catch {
      // ignore private-mode / unavailable storage
    }

    // Helpful for debugging branding in the browser console
    if (typeof window !== 'undefined') {
      (window as unknown as { __MARVLORE_ADMIN_BRAND__?: string }).__MARVLORE_ADMIN_BRAND__ = BRAND;
    }
  },
};
