import type { Core } from '@strapi/strapi';
import { getWorkCacheVersion } from '../utils/work-cache-version';

const WORK_API_PREFIXES = [
  '/api/work-page',
  '/api/work-categories',
  '/api/work-tags',
  '/api/work-projects',
  '/api/work-search',
  '/api/work-cache-version',
];

/**
 * Short public cache for Work read APIs + cache-version header for clients.
 */
export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const path = String(ctx.path || ctx.request?.path || '');
    const isWork = WORK_API_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
    await next();
    if (!isWork || (ctx.method !== 'GET' && ctx.method !== 'HEAD')) return;
    if (ctx.status && ctx.status >= 400) return;

    const version = getWorkCacheVersion();
    ctx.set('X-Marvlore-Work-Cache', String(version));
    ctx.set('Vary', 'Origin, Accept-Encoding');

    if (path === '/api/work-cache-version' || path.startsWith('/api/work-cache-version?')) {
      ctx.set('Cache-Control', 'no-store');
      return;
    }

    // Public read: brief freshness + SWR. Media URLs themselves stay on website CDN policy.
    ctx.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    strapi.log.debug?.(`[work-cache] ${path} v=${version}`);
  };
};
