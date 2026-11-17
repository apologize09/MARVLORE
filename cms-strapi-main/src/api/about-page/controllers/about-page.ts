/**
 * about-page controller — public DTO (copy + collage media overrides)
 */
import { factories } from '@strapi/strapi';
import { toAboutPageDto } from '../../../utils/site-dto';
import { resolveLocale } from '../../../utils/work-query';

export default factories.createCoreController('api::about-page.about-page', ({ strapi }) => ({
  async find(ctx) {
    const locale = resolveLocale(ctx.query.locale);
    const row = await strapi.documents('api::about-page.about-page').findFirst({
      locale,
      status: 'published',
      populate: {
        stats: true,
        collageImages: true,
        seo: true,
      },
    });
    ctx.body = {
      data: toAboutPageDto((row as Record<string, unknown>) || null),
      meta: { locale },
    };
  },
}));
