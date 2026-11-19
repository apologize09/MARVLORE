import type { Core } from '@strapi/strapi';

/**
 * Content Manager relation pickers for work-project.category (and tag.categories)
 * must only offer level-2 作品方向. Level-1 "Work" is a parent container and should
 * not appear (it also often lacked nameCn and rendered as documentId).
 *
 * Injects filters.level=$eq:2 into CM findAvailable queries.
 */
const TARGETS: Array<{ model: string; field: string }> = [
  { model: 'api::work-project.work-project', field: 'category' },
  { model: 'api::work-tag.work-tag', field: 'categories' },
];

function matchTarget(path: string): boolean {
  // /content-manager/relations/:model[/ :id]/:targetField
  for (const { model, field } of TARGETS) {
    const escModel = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
      `^/content-manager/relations/${escModel}(?:/[^/?#]+)?/${field}(?:/)?$`,
    );
    if (re.test(path.split('?')[0])) return true;
  }
  return false;
}

function injectLevel2Filter(query: Record<string, unknown>) {
  const existing = query.filters;
  const levelClause = { level: { $eq: 2 } };

  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    query.filters = levelClause;
    return;
  }

  const filters = existing as Record<string, unknown>;
  if (Array.isArray(filters.$and)) {
    filters.$and = [...filters.$and, levelClause];
  } else {
    query.filters = {
      $and: [filters, levelClause],
    };
  }
}

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<void>) => {
    const path = String(ctx.path || ctx.request?.path || '');
    if (ctx.method === 'GET' && matchTarget(path)) {
      const query = (ctx.request.query || {}) as Record<string, unknown>;
      injectLevel2Filter(query);
      ctx.request.query = query;
      strapi.log.debug?.(`[work-category-relation-filter] level=2 on ${path}`);
    }
    await next();
  };
};
