import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    // Admin UI locale packs (content locales zh-CN + en are managed via i18n plugin)
    locales: ['zh-Hans', 'zh', 'en'],
  },
  bootstrap(_app: StrapiApp) {},
};
