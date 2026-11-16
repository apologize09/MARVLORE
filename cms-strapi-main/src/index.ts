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
};

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

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensurePublicPermissions(strapi);
  },
};
