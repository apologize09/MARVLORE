import type { Core } from '@strapi/strapi';
import { registerWorkDocumentRules } from './middlewares/work-document-rules';

const PUBLIC_ACTIONS: Record<string, string[]> = {
  article: ['find', 'findOne'],
  category: ['find', 'findOne'],
  author: ['find', 'findOne'],
  global: ['find', 'findOne'],
  about: ['find', 'findOne'],
  faq: ['find', 'findOne'],
  certification: ['find', 'findOne'],
  'page-seo': ['find', 'findOne'],
  // Phase 2 — Work public read (Draft & Publish already scopes live content for Public)
  'work-category': ['find', 'findOne'],
  'work-tag': ['find', 'findOne'],
  'work-project': ['find', 'findOne'],
  'work-project-media': ['find', 'findOne'],
  'work-page': ['find'],
  // V1.0 Contact / Awards (editorial read only)
  'global-setting': ['find'],
  award: ['find', 'findOne'],
  'service-item': ['find', 'findOne'],
  'about-page': ['find'],
  'hero-item': ['find', 'findOne'],
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
  register({ strapi }: { strapi: Core.Strapi }) {
    registerWorkDocumentRules(strapi);
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureContentLocales(strapi);
    await ensurePublicPermissions(strapi);
  },
};
