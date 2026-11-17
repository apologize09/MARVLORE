import type { StrapiApp } from '@strapi/strapi/admin';

const ADMIN_UI_LOCALE = 'zh-Hans';
const STORAGE_KEY = 'strapi-admin-language';

export default {
  config: {
    // Admin panel UI languages (content locales zh-CN + en stay on the i18n plugin)
    locales: [ADMIN_UI_LOCALE, 'en'],
  },
  bootstrap(_app: StrapiApp) {
    // Default new browsers / login screen to Simplified Chinese when unset
    try {
      if (typeof window !== 'undefined' && !window.localStorage.getItem(STORAGE_KEY)) {
        window.localStorage.setItem(STORAGE_KEY, ADMIN_UI_LOCALE);
      }
    } catch {
      // ignore private-mode / unavailable storage
    }
  },
};
