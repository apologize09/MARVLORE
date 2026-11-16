/**
 * work-category controller — public tree + slug detail DTOs
 */
import { factories } from '@strapi/strapi';
import { createWorkPublicService } from '../../../services/work-public';
import { toCategoryDto } from '../../../utils/work-dto';
import { resolveLocale } from '../../../utils/work-query';
import { mergeIsActiveFilter } from '../../../utils/work-rules';

export default factories.createCoreController('api::work-category.work-category', ({ strapi }) => {
  const work = createWorkPublicService(strapi);

  return {
    async find(ctx) {
      return work.getCategoryTree(ctx);
    },

    async findOne(ctx) {
      const id = String(ctx.params.id || ctx.params.documentId || '');
      if (!id) {
        ctx.status = 400;
        ctx.body = { error: { code: 'INVALID_FILTER', message: 'Missing category id/slug' } };
        return;
      }

      try {
        const locale = resolveLocale(ctx.query.locale);
        const asDoc = await strapi.documents('api::work-category.work-category').findOne({
          documentId: id,
          locale,
          status: 'published',
          populate: {
            parent: { fields: ['documentId', 'name', 'slug', 'level'] },
            children: {
              filters: { isActive: { $eq: true } },
              fields: ['documentId', 'name', 'slug', 'level', 'sortOrder', 'isActive', 'coverUrl', 'legacyId'],
              sort: ['sortOrder:asc'],
            },
            cover: { fields: ['url', 'alternativeText', 'width', 'height', 'mime', 'name'] },
          },
        });
        if (asDoc && (asDoc as any).isActive !== false) {
          const dto = toCategoryDto(asDoc as any) as any;
          dto.children = Array.isArray((asDoc as any).children)
            ? (asDoc as any).children.map(toCategoryDto)
            : [];
          ctx.body = { data: dto, meta: { locale } };
          return;
        }
      } catch {
        // slug fallback
      }

      ctx.params.slug = id;
      return work.getCategoryBySlug(ctx);
    },

    async tree(ctx) {
      return work.getCategoryTree(ctx);
    },

    async findBySlug(ctx) {
      return work.getCategoryBySlug(ctx);
    },

    async findRaw(ctx) {
      ctx.query = mergeIsActiveFilter(ctx.query as Record<string, unknown>);
      return super.find(ctx);
    },
  };
});
