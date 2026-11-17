/**
 * hero-item controller — public list DTO for Hero carousel / orbit
 */
import { factories } from '@strapi/strapi';
import { toHeroItemDto } from '../../../utils/site-dto';
import { resolveLocale } from '../../../utils/work-query';

export default factories.createCoreController('api::hero-item.hero-item', ({ strapi }) => ({
  async find(ctx) {
    const locale = resolveLocale(ctx.query.locale);
    const role = typeof ctx.query.role === 'string' ? ctx.query.role : null;
    const filters: any = { isActive: { $eq: true } };
    if (role === 'project' || role === 'orbit') {
      filters.role = { $eq: role };
    }
    const rows = await strapi.documents('api::hero-item.hero-item').findMany({
      locale,
      status: 'published',
      filters,
      sort: ['sortOrder:asc'],
      limit: 50,
      populate: {
        image: true,
        video: true,
        videoHd: true,
        preview: true,
        homePreview: true,
      },
    });
    const data = (rows || []).map((row) => toHeroItemDto(row as Record<string, unknown>));
    ctx.body = {
      data,
      meta: {
        locale,
        total: data.length,
        projects: data.filter((item) => item.role === 'project').length,
        orbit: data.filter((item) => item.role === 'orbit').length,
      },
    };
  },
}));
