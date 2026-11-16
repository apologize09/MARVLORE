/**
 * work-tag controller — public REST filters to active tags
 */
import { factories } from '@strapi/strapi';
import { mergeIsActiveFilter } from '../../../utils/work-rules';

export default factories.createCoreController('api::work-tag.work-tag', () => ({
  async find(ctx) {
    ctx.query = mergeIsActiveFilter(ctx.query as Record<string, unknown>);
    return super.find(ctx);
  },

  async findOne(ctx) {
    ctx.query = mergeIsActiveFilter(ctx.query as Record<string, unknown>);
    return super.findOne(ctx);
  },
}));
