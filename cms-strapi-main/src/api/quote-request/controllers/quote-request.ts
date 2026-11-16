import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quote-request.quote-request', () => ({
    async create(ctx) {
      const incoming = ctx.request.body?.data || ctx.request.body || {};
      const year = new Date().getFullYear();
      const referenceNo = `RFQ-${year}-${Math.floor(100000 + Math.random() * 900000)}`;

      ctx.request.body = {
        data: {
          fullName: incoming.fullName,
          companyName: incoming.companyName,
          email: incoming.email,
          phone: incoming.phone,
          productLines: incoming.productLines,
          estimatedVolume: incoming.estimatedVolume,
          nicotineStrength: incoming.nicotineStrength,
          caffeineDosage: incoming.caffeineDosage,
          nootropicFocus: incoming.nootropicFocus,
          flavorPreference: incoming.flavorPreference,
          pouchType: incoming.pouchType,
          targetLaunchDate: incoming.targetLaunchDate,
          message: incoming.message,
          referenceNo,
          status: 'new',
        },
      };

      const response = await super.create(ctx);
      return {
        ...response,
        referenceNo,
      };
    },
  })
);
