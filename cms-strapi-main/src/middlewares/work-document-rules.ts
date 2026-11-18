import type { Core } from '@strapi/strapi';
import { bumpWorkCacheVersion } from '../utils/work-cache-version';
import {
  WORK_UIDS,
  assertCategoryDeletable,
  assertCategoryPayload,
  assertMediaPayload,
  assertProjectDeletable,
  assertProjectPayload,
  assertTagPayload,
  extractRelationIds,
  isRelationNoop,
  resolveCategoryNameCn,
} from '../utils/work-rules';

const WRITE_ACTIONS = new Set(['create', 'update', 'delete', 'publish', 'unpublish', 'discardDraft']);
const WORK_UID_SET = new Set<string>(Object.values(WORK_UIDS));

export function registerWorkDocumentRules(strapi: Core.Strapi) {
  strapi.documents.use(async (ctx, next) => {
    const uid = ctx.uid as string;
    const action = ctx.action as string;

    if (!WRITE_ACTIONS.has(action)) {
      return next();
    }

    const params = (ctx.params || {}) as {
      documentId?: string;
      data?: Record<string, unknown>;
      locale?: string;
    };
    const data = params.data || {};
    const locale = params.locale;

    if (uid === WORK_UIDS.category) {
      if (action === 'create') {
        await assertCategoryPayload(strapi, data);
      } else if (action === 'update' && params.documentId) {
        const existing = await strapi.documents(WORK_UIDS.category).findOne({
          documentId: params.documentId,
          status: 'draft',
          fields: ['documentId', 'level', 'name', 'nameCn'],
          populate: { parent: { fields: ['documentId', 'level'] } },
        });
        await assertCategoryPayload(strapi, data, existing as any);
      } else if (action === 'delete' && params.documentId) {
        await assertCategoryDeletable(strapi, params.documentId);
      }
    }

    if (uid === WORK_UIDS.tag) {
      if (action === 'create') {
        await assertTagPayload(strapi, data);
      } else if (action === 'update' && params.documentId) {
        const existing = await strapi.documents(WORK_UIDS.tag).findOne({
          documentId: params.documentId,
          status: 'draft',
          fields: ['documentId'],
          populate: { categories: { fields: ['documentId', 'level'] } },
        });
        await assertTagPayload(strapi, data, existing as any);
      }
    }

    if (uid === WORK_UIDS.project) {
      if (action === 'create') {
        await assertProjectPayload(strapi, data, null, { requireCategory: true });
        await syncProjectCategoryNameCn(strapi, data, null);
      } else if (action === 'update' && params.documentId) {
        const existing = await strapi.documents(WORK_UIDS.project).findOne({
          documentId: params.documentId,
          status: 'draft',
          ...(locale ? { locale } : {}),
          fields: ['documentId', 'categoryNameCn'],
          populate: {
            category: { fields: ['documentId', 'level', 'isActive', 'name', 'nameCn'] },
            tags: { fields: ['documentId'] },
          },
        });
        await assertProjectPayload(strapi, data, existing as any, { requireCategory: true });
        await syncProjectCategoryNameCn(strapi, data, existing as any);
      } else if (action === 'delete' && params.documentId) {
        await assertProjectDeletable(strapi, params.documentId);
      }
    }

    if (uid === WORK_UIDS.media) {
      if (action === 'create') {
        assertMediaPayload(data);
      } else if (action === 'update' && params.documentId) {
        const existing = await strapi.documents(WORK_UIDS.media).findOne({
          documentId: params.documentId,
          status: 'draft',
        });
        assertMediaPayload(data, (existing || {}) as Record<string, unknown>);
      }
    }

    const result = await next();

    // When a category Chinese name changes, refresh denormalized labels on projects.
    if (
      uid === WORK_UIDS.category &&
      (action === 'update' || action === 'publish') &&
      params.documentId &&
      Object.prototype.hasOwnProperty.call(data, 'nameCn')
    ) {
      await cascadeCategoryNameCn(strapi, params.documentId, locale);
    }

    // Publish / unpublish / edits invalidate public Work caches.
    if (WORK_UID_SET.has(uid)) {
      const bumped = bumpWorkCacheVersion(`${uid}:${action}`);
      strapi.log.info(`[work-cache] bumped version=${bumped.version} via ${bumped.reason}`);
    }

    return result;
  });
}

async function syncProjectCategoryNameCn(
  strapi: Core.Strapi,
  data: Record<string, unknown>,
  existing?: {
    category?: { documentId?: string; name?: string; nameCn?: string | null } | null;
    categoryNameCn?: string | null;
  } | null
) {
  const categoryTouched = Object.prototype.hasOwnProperty.call(data, 'category');
  const categoryNoop = categoryTouched && isRelationNoop(data.category);
  let categoryId: string | null = null;

  if (categoryTouched && !categoryNoop) {
    categoryId = extractRelationIds(data.category)[0] || null;
  } else if (existing?.category?.documentId) {
    categoryId = existing.category.documentId;
  }

  // Prefer freshly resolved label; fall back to existing relation snapshot.
  let label: string | null = null;
  if (categoryId) {
    label = await resolveCategoryNameCn(strapi, categoryId);
  } else if (!categoryTouched || categoryNoop) {
    const snapCn = existing?.category?.nameCn;
    const snapName = existing?.category?.name;
    label =
      (typeof snapCn === 'string' && snapCn.trim()) ||
      (typeof snapName === 'string' && snapName.trim()) ||
      existing?.categoryNameCn ||
      null;
  }

  if (label != null) {
    data.categoryNameCn = label;
  } else if (categoryTouched && !categoryNoop && !categoryId) {
    data.categoryNameCn = null;
  }
}

async function cascadeCategoryNameCn(
  strapi: Core.Strapi,
  categoryDocumentId: string,
  locale?: string
) {
  const label = await resolveCategoryNameCn(strapi, categoryDocumentId);
  if (!label) return;

  const projects = await strapi.documents(WORK_UIDS.project).findMany({
    filters: { category: { documentId: categoryDocumentId } },
    fields: ['documentId', 'categoryNameCn'],
    status: 'draft',
    ...(locale ? { locale } : {}),
    limit: 500,
  });

  for (const project of projects as Array<{ documentId?: string; categoryNameCn?: string | null }>) {
    if (!project.documentId) continue;
    if (project.categoryNameCn === label) continue;
    await strapi.documents(WORK_UIDS.project).update({
      documentId: project.documentId,
      ...(locale ? { locale } : {}),
      data: { categoryNameCn: label },
    });
  }
}
