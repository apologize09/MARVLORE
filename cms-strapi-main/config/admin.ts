import type { Core } from '@strapi/strapi';

const isDev = env('NODE_ENV') !== 'production';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET')!,
  },
  // Local develop: avoid locking operators out after a few failed attempts / session-write glitches.
  // Production keeps Strapi defaults (5 / 5min) unless overridden.
  rateLimit: {
    enabled: env.bool('ADMIN_RATE_LIMIT_ENABLED', true),
    interval: { min: env.int('ADMIN_RATE_LIMIT_INTERVAL_MIN', 5) },
    max: env.int('ADMIN_RATE_LIMIT_MAX', isDev ? 100 : 5),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT')!,
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT')!,
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY')!,
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});

export default config;
