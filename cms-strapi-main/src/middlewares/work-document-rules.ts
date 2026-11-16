import type { Core } from '@strapi/strapi';
import {
  WORK_UIDS,
  assertCategoryDeletable,
  assertCategoryPayload,
  assertMediaPayload,
  assertProjectDeletable,
  assertProjectPayload,
  assertTagPayload,
} from '../utils/work-rules';

const WRITE_ACTIONS = new Set(['create', 'update', 'delete', 'publish', 'unpublish', 'discardDraft']);

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
    };
    const data = params.data || {};

    if (uid === WORK_UIDS.category) {
      if (action === 'create') {
        await assertCategoryPayload(strapi, data);
      } else if (action === 'update' && params.documentId) {
        const existing = await strapi.documents(WORK_UIDS.category).findOne({
          documentId: params.documentId,
          status: 'draft',
          fields: ['documentId', 'level'],
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
      } else if (action === 'update' && params.documentId) {
        const existing = await strapi.documents(WORK_UIDS.project).findOne({
          documentId: params.documentId,
          status: 'draft',
          fields: ['documentId'],
          populate: {
            category: { fields: ['documentId', 'level', 'isActive'] },
            tags: { fields: ['documentId'] },
          },
        });
        await assertProjectPayload(strapi, data, existing as any, { requireCategory: true });
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

    return next();
  });
}
