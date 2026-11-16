/**
 * work-project controller — public REST prefers projects under active categories
 */
import { factories } from '@strapi/strapi';
import { mergeActiveCategoryFilter } from '../../../utils/work-rules';

export default factories.createCoreController('api::work-project.work-project', () => ({
  async find(ctx) {
    ctx.query = mergeActiveCategoryFilter(ctx.query as Record<string, unknown>);
    return super.find(ctx);
  },

  async findOne(ctx) {
    ctx.query = mergeActiveCategoryFilter(ctx.query as Record<string, unknown>);
    return super.findOne(ctx);
  },
}));
