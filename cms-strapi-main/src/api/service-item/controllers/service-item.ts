/**
 * service-item controller — public list DTO for Services directory
 */
import { factories } from '@strapi/strapi';
import { toServiceItemDto } from '../../../utils/site-dto';
import { resolveLocale } from '../../../utils/work-query';

export default factories.createCoreController('api::service-item.service-item', ({ strapi }) => ({
  async find(ctx) {
    const locale = resolveLocale(ctx.query.locale);
    const rows = await strapi.documents('api::service-item.service-item').findMany({
      locale,
      status: 'published',
      filters: { isActive: { $eq: true } },
      sort: ['sortOrder:asc'],
      limit: 50,
    });
    const data = (rows || []).map((row) => toServiceItemDto(row as Record<string, unknown>));
    ctx.body = { data, meta: { locale, total: data.length } };
  },

  async findOne(ctx) {
    const id = String(ctx.params.id || ctx.params.documentId || '');
    if (!id) {
      ctx.status = 400;
      ctx.body = { error: { code: 'INVALID_FILTER', message: 'Missing service id' } };
      return;
    }
    const locale = resolveLocale(ctx.query.locale);
    let row = null as Record<string, unknown> | null;
    try {
      row = (await strapi.documents('api::service-item.service-item').findOne({
        documentId: id,
        locale,
        status: 'published',
      })) as Record<string, unknown> | null;
    } catch {
      row = null;
    }
    if (!row) {
      const bySlug = await strapi.documents('api::service-item.service-item').findMany({
        locale,
        status: 'published',
        filters: { slug: { $eq: id }, isActive: { $eq: true } },
        limit: 1,
      });
      row = (bySlug[0] as Record<string, unknown>) || null;
    }
    if (!row || row.isActive === false) {
      ctx.status = 404;
      ctx.body = { error: { code: 'NOT_FOUND', message: 'Service not found' } };
      return;
    }
    ctx.body = { data: toServiceItemDto(row), meta: { locale } };
  },
}));
