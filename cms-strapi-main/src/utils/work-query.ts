import { errors } from '@strapi/utils';

const { ValidationError } = errors;

export const WORK_PAGE_SIZE_DEFAULT = 12;
export const WORK_PAGE_SIZE_MAX = 48;
export const WORK_LOCALES = new Set(['zh-CN', 'en']);

export type WorkSort = 'featured' | 'latest' | 'oldest' | 'manual';

export type WorkListQuery = {
  locale: string;
  page: number;
  pageSize: number;
  q?: string;
  category?: string;
  subcategory?: string;
  tags: string[];
  year?: number;
  projectType?: 'image' | 'video' | 'mixed';
  sort: WorkSort;
};

export function apiError(code: string, message: string, status = 400) {
  const err = new ValidationError(message);
  (err as any).code = code;
  (err as any).status = status;
  return err;
}

export function resolveLocale(raw: unknown): string {
  const value = String(raw || 'zh-CN').trim();
  if (value === 'zh' || value === 'zh-Hans') return 'zh-CN';
  if (!WORK_LOCALES.has(value)) {
    throw apiError('INVALID_LOCALE', `locale must be one of: zh-CN, en (got ${value})`);
  }
  return value;
}

export function resolvePagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1);
  const sizeNum = Number.parseInt(String(query.pageSize ?? WORK_PAGE_SIZE_DEFAULT), 10);
  if (!Number.isFinite(sizeNum) || sizeNum < 1) {
    throw apiError('INVALID_FILTER', 'pageSize must be a positive integer');
  }
  if (sizeNum > WORK_PAGE_SIZE_MAX) {
    throw apiError('INVALID_FILTER', `pageSize must be <= ${WORK_PAGE_SIZE_MAX}`);
  }
  return { page, pageSize: sizeNum, start: (page - 1) * sizeNum };
}

export function parseTags(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((v) => String(v).split(',')).map((s) => s.trim()).filter(Boolean);
  }
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseWorkListQuery(query: Record<string, unknown>): WorkListQuery & { start: number } {
  const locale = resolveLocale(query.locale);
  const { page, pageSize, start } = resolvePagination(query);
  const sortRaw = String(query.sort || 'manual');
  const allowed: WorkSort[] = ['featured', 'latest', 'oldest', 'manual'];
  if (!allowed.includes(sortRaw as WorkSort)) {
    throw apiError('INVALID_FILTER', `sort must be one of: ${allowed.join(', ')}`);
  }

  let year: number | undefined;
  if (query.year != null && query.year !== '') {
    year = Number.parseInt(String(query.year), 10);
    if (!Number.isFinite(year)) throw apiError('INVALID_FILTER', 'year must be an integer');
  }

  let projectType: WorkListQuery['projectType'];
  if (query.projectType != null && query.projectType !== '') {
    const pt = String(query.projectType);
    if (!['image', 'video', 'mixed'].includes(pt)) {
      throw apiError('INVALID_FILTER', 'projectType must be image|video|mixed');
    }
    projectType = pt as WorkListQuery['projectType'];
  }

  const q = query.q != null && String(query.q).trim() ? String(query.q).trim() : undefined;

  return {
    locale,
    page,
    pageSize,
    start,
    q,
    category: query.category ? String(query.category).trim() : undefined,
    subcategory: query.subcategory ? String(query.subcategory).trim() : undefined,
    tags: parseTags(query.tags),
    year,
    projectType,
    sort: sortRaw as WorkSort,
  };
}

export function sortParams(sort: WorkSort): any {
  switch (sort) {
    case 'featured':
      return ['isFeatured:desc', 'sortOrder:asc', 'publishedAt:desc'];
    case 'latest':
      return ['publishedAt:desc', 'sortOrder:asc'];
    case 'oldest':
      return ['publishedAt:asc', 'sortOrder:asc'];
    case 'manual':
    default:
      return ['sortOrder:asc', 'publishedAt:desc'];
  }
}

export function mediaPopulate(): any {
  return {
    fields: ['url', 'alternativeText', 'caption', 'width', 'height', 'mime', 'name'],
  };
}

/** Populate trees cast as any — Strapi Document Service field unions reject plain string[]. */
export function projectListPopulate(): any {
  return {
    category: {
      fields: ['documentId', 'name', 'slug', 'level', 'isActive'],
      populate: {
        parent: { fields: ['documentId', 'name', 'slug', 'level'] },
      },
    },
    tags: { fields: ['documentId', 'name', 'slug', 'isActive'] },
    cover: mediaPopulate(),
    thumbnail: mediaPopulate(),
    heroMedia: mediaPopulate(),
    video: mediaPopulate(),
    poster: mediaPopulate(),
    previewVideo: mediaPopulate(),
    homePreviewVideo: mediaPopulate(),
  };
}

export function projectDetailPopulate(): any {
  return {
    ...projectListPopulate(),
    mediaItems: {
      fields: [
        'documentId',
        'blockType',
        'title',
        'body',
        'imageUrl',
        'videoUrl',
        'posterUrl',
        'embedUrl',
        'altText',
        'caption',
        'displayMode',
        'aspectRatio',
        'sortOrder',
        'legacyId',
      ],
      populate: {
        image: mediaPopulate(),
        video: mediaPopulate(),
        poster: mediaPopulate(),
      },
      sort: ['sortOrder:asc'],
    },
    relatedProjects: {
      fields: [
        'documentId',
        'title',
        'slug',
        'subtitle',
        'summary',
        'projectType',
        'projectYear',
        'coverUrl',
        'sortOrder',
        'legacyId',
      ],
      populate: {
        cover: mediaPopulate(),
        category: {
          fields: ['slug', 'name'],
          populate: { parent: { fields: ['slug'] } },
        },
        tags: { fields: ['slug', 'name'] },
      },
    },
    seo: {
      fields: ['metaTitle', 'metaDescription'],
      populate: { shareImage: mediaPopulate() },
    },
  };
}
