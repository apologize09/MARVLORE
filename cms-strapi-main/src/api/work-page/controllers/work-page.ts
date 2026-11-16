/**
 * work-page controller — public DTO
 */
import { factories } from '@strapi/strapi';
import { createWorkPublicService } from '../../../services/work-public';

export default factories.createCoreController('api::work-page.work-page', ({ strapi }) => {
  const work = createWorkPublicService(strapi);

  return {
    async find(ctx) {
      return work.getWorkPage(ctx);
    },
  };
});
