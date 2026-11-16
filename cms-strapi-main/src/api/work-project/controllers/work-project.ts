/**
 * work-project controller — public DTO list/detail + featured/related/search
 */
import { factories } from '@strapi/strapi';
import { createWorkPublicService } from '../../../services/work-public';
import { toProjectDetailDto } from '../../../utils/work-dto';
import { projectDetailPopulate, resolveLocale } from '../../../utils/work-query';
import { mergeActiveCategoryFilter } from '../../../utils/work-rules';

export default factories.createCoreController('api::work-project.work-project', ({ strapi }) => {
  const work = createWorkPublicService(strapi);

  return {
    async find(ctx) {
      return work.listProjects(ctx);
    },

    async findOne(ctx) {
      const id = String(ctx.params.id || ctx.params.documentId || '');
      if (!id) {
        ctx.status = 400;
        ctx.body = { error: { code: 'INVALID_FILTER', message: 'Missing project id/slug' } };
        return;
      }

      try {
        const locale = resolveLocale(ctx.query.locale);
        const asDoc = await strapi.documents('api::work-project.work-project').findOne({
          documentId: id,
          locale,
          status: 'published',
          populate: projectDetailPopulate(),
        });
        if (asDoc) {
          ctx.body = { data: toProjectDetailDto(asDoc as any), meta: { locale } };
          return;
        }
      } catch {
        // not a documentId — try slug
      }

      ctx.params.slug = id;
      return work.getProjectBySlug(ctx);
    },

    async featured(ctx) {
      return work.getFeatured(ctx);
    },

    async related(ctx) {
      return work.getRelated(ctx);
    },

    async findBySlug(ctx) {
      return work.getProjectBySlug(ctx);
    },

    async search(ctx) {
      return work.search(ctx);
    },

    async findRaw(ctx) {
      ctx.query = mergeActiveCategoryFilter(ctx.query as Record<string, unknown>);
      return super.find(ctx);
    },
  };
});
