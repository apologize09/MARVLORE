import type { Core } from '@strapi/strapi';

const PUBLIC_ACTIONS: Record<string, string[]> = {
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
  // Work public read is deferred to Phase 2 (permissions matrix).
};

const REQUIRED_LOCALES: Array<{ code: string; name: string }> = [
  { code: 'en', name: 'English (en)' },
  { code: 'zh-CN', name: 'Chinese (zh-CN)' },
];

async function ensurePublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) return;

  for (const [controller, actions] of Object.entries(PUBLIC_ACTIONS)) {
    for (const action of actions) {
      const actionId = `api::${controller}.${controller}.${action}`;
      const existing = await strapi.query('plugin::users-permissions.permission').findOne({
        where: {
          action: actionId,
          role: publicRole.id,
        },
      });
      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: {
            action: actionId,
            role: publicRole.id,
          },
        });
      }
    }
  }
}

async function ensureContentLocales(strapi: Core.Strapi) {
  const i18n = strapi.plugin('i18n');
  if (!i18n) {
    strapi.log.warn('[bootstrap] i18n plugin missing; skip locale ensure');
    return;
  }

  const localesService = i18n.service('locales');
  const existing = await localesService.find();
  const codes = new Set((existing || []).map((locale: { code: string }) => locale.code));

  for (const locale of REQUIRED_LOCALES) {
    if (codes.has(locale.code)) continue;
    await localesService.create(locale);
    codes.add(locale.code);
    strapi.log.info(`[bootstrap] created locale ${locale.code}`);
  }

  if (codes.has('zh-CN')) {
    const currentDefault = await localesService.getDefaultLocale();
    if (currentDefault !== 'zh-CN') {
      await localesService.setDefaultLocale({ code: 'zh-CN' });
      strapi.log.info('[bootstrap] set default locale to zh-CN');
    }
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureContentLocales(strapi);
    await ensurePublicPermissions(strapi);
  },
};
