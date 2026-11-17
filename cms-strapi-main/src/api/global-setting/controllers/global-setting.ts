/**
 * global-setting controller — public contact/brand DTO
 */
import { factories } from '@strapi/strapi';
import { toGlobalSettingDto } from '../../../utils/site-dto';

export default factories.createCoreController(
  'api::global-setting.global-setting',
  ({ strapi }) => ({
    async find(ctx) {
      const row = await strapi.documents('api::global-setting.global-setting').findFirst({
        populate: {
          defaultSeo: true,
          socialLinks: true,
        },
      });
      ctx.body = {
        data: toGlobalSettingDto((row as Record<string, unknown>) || null),
        meta: {},
      };
    },
  }),
);
