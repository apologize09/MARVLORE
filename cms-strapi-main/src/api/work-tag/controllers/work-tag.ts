/**
 * work-tag controller — public DTO list
 */
import { factories } from '@strapi/strapi';
import { createWorkPublicService } from '../../../services/work-public';
import { mergeIsActiveFilter } from '../../../utils/work-rules';

export default factories.createCoreController('api::work-tag.work-tag', ({ strapi }) => {
  const work = createWorkPublicService(strapi);

  return {
    async find(ctx) {
      return work.getTags(ctx);
    },

    async findOne(ctx) {
      ctx.query = mergeIsActiveFilter(ctx.query as Record<string, unknown>);
      const response = await super.findOne(ctx);
      if (!response?.data) return response;
      const { toTagDto } = await import('../../../utils/work-dto');
      return { data: toTagDto(response.data), meta: response.meta };
    },

    async findRaw(ctx) {
      ctx.query = mergeIsActiveFilter(ctx.query as Record<string, unknown>);
      return super.find(ctx);
    },
  };
});
