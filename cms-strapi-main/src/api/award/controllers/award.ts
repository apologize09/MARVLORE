/**
 * award controller — public list DTO for awards carousel
 */
import { factories } from '@strapi/strapi';
import { toAwardDto } from '../../../utils/site-dto';
import { resolveLocale } from '../../../utils/work-query';

export default factories.createCoreController('api::award.award', ({ strapi }) => ({
  async find(ctx) {
    const locale = resolveLocale(ctx.query.locale);
    const rows = await strapi.documents('api::award.award').findMany({
      locale,
      status: 'published',
      filters: { isActive: { $eq: true } },
      sort: ['sortOrder:asc'],
      limit: 50,
    });
    const data = (rows || []).map((row) => toAwardDto(row as Record<string, unknown>));
    ctx.body = { data, meta: { locale, total: data.length } };
  },

  async findOne(ctx) {
    const id = String(ctx.params.id || ctx.params.documentId || '');
    if (!id) {
      ctx.status = 400;
      ctx.body = { error: { code: 'INVALID_FILTER', message: 'Missing award id' } };
      return;
    }
    const locale = resolveLocale(ctx.query.locale);
    const row = await strapi.documents('api::award.award').findOne({
      documentId: id,
      locale,
      status: 'published',
    });
    if (!row || (row as any).isActive === false) {
      ctx.status = 404;
      ctx.body = { error: { code: 'NOT_FOUND', message: 'Award not found' } };
      return;
    }
    ctx.body = { data: toAwardDto(row as Record<string, unknown>), meta: { locale } };
  },
}));
