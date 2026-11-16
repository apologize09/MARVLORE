/**
 * work-category controller — public REST filters to active categories
 */
import { factories } from '@strapi/strapi';
import { mergeIsActiveFilter } from '../../../utils/work-rules';

export default factories.createCoreController('api::work-category.work-category', () => ({
  async find(ctx) {
    ctx.query = mergeIsActiveFilter(ctx.query as Record<string, unknown>);
    return super.find(ctx);
  },

  async findOne(ctx) {
    ctx.query = mergeIsActiveFilter(ctx.query as Record<string, unknown>);
    return super.findOne(ctx);
  },
}));
