import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ValidationError, ApplicationError } = errors;

export const WORK_UIDS = {
  category: 'api::work-category.work-category',
  tag: 'api::work-tag.work-tag',
  project: 'api::work-project.work-project',
  media: 'api::work-project-media.work-project-media',
  page: 'api::work-page.work-page',
} as const;

/** Empty allowlist = embed blocks rejected (Phase 0/1 guidance). */
const EMBED_HOST_ALLOWLIST = (process.env.WORK_EMBED_HOST_ALLOWLIST || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function extractRelationIds(value: unknown): string[] {
  if (value == null || value === '') return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => extractRelationIds(item));
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.documentId === 'string') return [obj.documentId];
    if (obj.id != null) return [String(obj.id)];
    if ('connect' in obj) return extractRelationIds(obj.connect);
    if ('set' in obj) return extractRelationIds(obj.set);
  }
  return [];
}

function fail(message: string): never {
  throw new ValidationError(message);
}

async function findCategory(strapi: Core.Strapi, documentId: string) {
  return strapi.documents(WORK_UIDS.category).findOne({
    documentId,
    status: 'draft',
    fields: ['documentId', 'level', 'isActive', 'name'],
    populate: {
      parent: { fields: ['documentId', 'level', 'isActive'] },
    },
  });
}

async function findTag(strapi: Core.Strapi, documentId: string) {
  return strapi.documents(WORK_UIDS.tag).findOne({
    documentId,
    status: 'draft',
    fields: ['documentId', 'isActive', 'name'],
    populate: {
      categories: { fields: ['documentId', 'level', 'isActive'] },
    },
  });
}

export async function assertCategoryPayload(
  strapi: Core.Strapi,
  data: Record<string, unknown>,
  existing?: { level?: number; parent?: { documentId?: string } | null } | null
) {
  const levelRaw = data.level !== undefined ? data.level : existing?.level;
  const level = Number(levelRaw);

  if (![1, 2].includes(level)) {
    fail('work-category.level must be 1 or 2');
  }

  const parentTouched = Object.prototype.hasOwnProperty.call(data, 'parent');
  const parentIds = parentTouched
    ? extractRelationIds(data.parent)
    : existing?.parent?.documentId
      ? [existing.parent.documentId]
      : [];

  if (level === 1 && parentIds.length > 0) {
    fail('work-category level 1 must not have a parent');
  }

  if (level === 2) {
    if (parentIds.length !== 1) {
      fail('work-category level 2 requires exactly one parent');
    }
    const parent = await findCategory(strapi, parentIds[0]);
    if (!parent) fail('work-category parent not found');
    if (Number(parent.level) !== 1) {
      fail('work-category parent must be level 1');
    }
  }
}

export async function assertCategoryDeletable(strapi: Core.Strapi, documentId: string) {
  const children = await strapi.documents(WORK_UIDS.category).findMany({
    filters: { parent: { documentId } },
    fields: ['documentId'],
    status: 'draft',
    limit: 1,
  });
  if (children.length > 0) {
    throw new ApplicationError('Cannot delete work-category that has child categories; deactivate or migrate first');
  }

  const projects = await strapi.documents(WORK_UIDS.project).findMany({
    filters: { category: { documentId } },
    fields: ['documentId'],
    status: 'draft',
    limit: 1,
  });
  if (projects.length > 0) {
    throw new ApplicationError('Cannot delete work-category that has projects; deactivate or migrate first');
  }
}

export async function assertTagPayload(
  strapi: Core.Strapi,
  data: Record<string, unknown>,
  existing?: { categories?: Array<{ documentId?: string; level?: number }> } | null
) {
  const categoriesTouched = Object.prototype.hasOwnProperty.call(data, 'categories');
  const ids = categoriesTouched
    ? extractRelationIds(data.categories)
    : (existing?.categories || []).map((c) => c.documentId).filter(Boolean) as string[];

  for (const id of ids) {
    const cat = await findCategory(strapi, id);
    if (!cat) fail(`work-tag category not found: ${id}`);
    if (Number(cat.level) !== 2) {
      fail('work-tag.categories must only reference level-2 work categories');
    }
  }
}

export async function assertProjectPayload(
  strapi: Core.Strapi,
  data: Record<string, unknown>,
  existing?: {
    category?: { documentId?: string; level?: number; isActive?: boolean } | null;
    tags?: Array<{ documentId?: string }> | null;
  } | null,
  opts: { requireCategory: boolean } = { requireCategory: true }
) {
  const categoryTouched = Object.prototype.hasOwnProperty.call(data, 'category');
  const categoryIds = categoryTouched
    ? extractRelationIds(data.category)
    : existing?.category?.documentId
      ? [existing.category.documentId]
      : [];

  if (opts.requireCategory && categoryIds.length === 0) {
    fail('work-project.category is required and must be an active level-2 category');
  }

  if (categoryIds.length > 0) {
    if (categoryIds.length !== 1) fail('work-project.category must reference a single category');
    const cat = await findCategory(strapi, categoryIds[0]);
    if (!cat) fail('work-project.category not found');
    if (Number(cat.level) !== 2) fail('work-project.category must be level 2');
    if (cat.isActive === false) fail('work-project.category must be active');
  }

  const tagsTouched = Object.prototype.hasOwnProperty.call(data, 'tags');
  const tagIds = tagsTouched
    ? extractRelationIds(data.tags)
    : (existing?.tags || []).map((t) => t.documentId).filter(Boolean) as string[];

  if (tagIds.length > 0 && categoryIds.length === 1) {
    for (const tagId of tagIds) {
      const tag = await findTag(strapi, tagId);
      if (!tag) fail(`work-project tag not found: ${tagId}`);
      const allowed = (tag.categories || []) as Array<{ documentId?: string }>;
      // If a tag has scoped categories, project category must be one of them.
      if (allowed.length > 0 && !allowed.some((c) => c.documentId === categoryIds[0])) {
        fail(`work-project tag ${tagId} is not applicable to the selected category`);
      }
    }
  }
}

export async function assertProjectDeletable(strapi: Core.Strapi, documentId: string) {
  const related = await strapi.documents(WORK_UIDS.project).findMany({
    filters: { relatedProjects: { documentId } },
    fields: ['documentId'],
    status: 'draft',
    limit: 1,
  });
  if (related.length > 0) {
    throw new ApplicationError('Cannot delete work-project that is referenced by relatedProjects; unlink first');
  }
}

export function assertMediaPayload(data: Record<string, unknown>, existing?: Record<string, unknown> | null) {
  const blockType = String(data.blockType ?? existing?.blockType ?? '');
  const merged = { ...(existing || {}), ...data };

  const has = (key: string) => {
    const v = merged[key];
    return v != null && v !== '';
  };

  switch (blockType) {
    case 'image':
      if (!has('image') && !has('imageUrl')) {
        fail('image block requires image or imageUrl');
      }
      break;
    case 'video':
      if (!has('video') && !has('videoUrl')) {
        fail('video block requires video or videoUrl');
      }
      break;
    case 'text':
      if (!has('body')) fail('text block requires body');
      break;
    case 'embed': {
      if (!has('embedUrl')) fail('embed block requires embedUrl');
      let host = '';
      try {
        host = new URL(String(merged.embedUrl)).hostname.toLowerCase();
      } catch {
        fail('embedUrl must be a valid URL');
      }
      if (EMBED_HOST_ALLOWLIST.length === 0 || !EMBED_HOST_ALLOWLIST.includes(host)) {
        fail('embed blocks are disabled unless WORK_EMBED_HOST_ALLOWLIST includes the host');
      }
      break;
    }
    default:
      fail('work-project-media.blockType must be image|video|text|embed');
  }
}

export function mergeIsActiveFilter(query: Record<string, unknown> = {}) {
  const filters =
    query.filters && typeof query.filters === 'object' && !Array.isArray(query.filters)
      ? { ...(query.filters as Record<string, unknown>) }
      : {};
  filters.isActive = { $eq: true };
  return { ...query, filters };
}

export function mergeActiveCategoryFilter(query: Record<string, unknown> = {}) {
  const filters =
    query.filters && typeof query.filters === 'object' && !Array.isArray(query.filters)
      ? { ...(query.filters as Record<string, unknown>) }
      : {};
  const category =
    filters.category && typeof filters.category === 'object' && !Array.isArray(filters.category)
      ? { ...(filters.category as Record<string, unknown>) }
      : {};
  category.isActive = { $eq: true };
  filters.category = category;
  return { ...query, filters };
}
