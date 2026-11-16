import type { Core } from '@strapi/strapi';
import {
  buildCategoryTree,
  paginationMeta,
  toCategoryDto,
  toProjectCardDto,
  toProjectDetailDto,
  toTagDto,
  toWorkPageDto,
} from '../utils/work-dto';
import {
  parseWorkListQuery,
  projectDetailPopulate,
  projectListPopulate,
  resolveLocale,
  sortParams,
  type WorkListQuery,
} from '../utils/work-query';
import { WORK_UIDS } from '../utils/work-rules';

function sendError(strapi: Core.Strapi, ctx: any, err: any) {
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  const code = err.code || (status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_FILTER' : 'SERVER_ERROR');
  if (status >= 500) strapi.log.error(err);
  else strapi.log.info(`[work-api] ${code}: ${err.message}`);
  ctx.status = status;
  ctx.body = {
    error: {
      code,
      message: err.message || 'Unexpected error',
    },
  };
}

async function buildProjectFilters(strapi: Core.Strapi, q: WorkListQuery) {
  const filters: Record<string, any> = {
    category: { isActive: { $eq: true } },
  };

  if (q.subcategory) {
    filters.category = {
      ...filters.category,
      slug: { $eq: q.subcategory },
      level: { $eq: 2 },
    };
  } else if (q.category) {
    filters.category = {
      ...filters.category,
      level: { $eq: 2 },
      parent: { slug: { $eq: q.category } },
    };
  }

  if (q.year != null) filters.projectYear = { $eq: q.year };
  if (q.projectType) filters.projectType = { $eq: q.projectType };

  if (q.tags.length > 0) {
    // OR semantics across selected tag slugs
    filters.tags = {
      slug: { $in: q.tags },
      isActive: { $eq: true },
    };
  }

  if (q.q) {
    const term = q.q;
    filters.$or = [
      { title: { $containsi: term } },
      { subtitle: { $containsi: term } },
      { summary: { $containsi: term } },
      { clientName: { $containsi: term } },
      { category: { name: { $containsi: term } } },
      { tags: { name: { $containsi: term } } },
    ];
  }

  return filters;
}

export function createWorkPublicService(strapi: Core.Strapi) {
  return {
    sendError,

    async getWorkPage(ctx: any) {
      try {
        const locale = resolveLocale(ctx.query.locale);
        const page = await strapi.documents(WORK_UIDS.page).findFirst({
          locale,
          status: 'published',
          populate: {
            featuredProjects: {
              populate: projectListPopulate(),
            },
            displayCategories: {
              populate: {
                parent: { fields: ['documentId', 'name', 'slug', 'level'] },
                cover: { fields: ['url', 'alternativeText', 'width', 'height', 'mime', 'name'] },
              },
            },
            seo: {
              populate: { shareImage: { fields: ['url', 'alternativeText', 'width', 'height', 'mime', 'name'] } },
            },
          },
        });
        if (!page) {
          ctx.status = 404;
          ctx.body = { error: { code: 'NOT_FOUND', message: 'Work page not found' } };
          return;
        }
        ctx.body = { data: toWorkPageDto(page as any), meta: { locale } };
      } catch (err) {
        sendError(strapi, ctx, err);
      }
    },

    async getCategoryTree(ctx: any) {
      try {
        const locale = resolveLocale(ctx.query.locale);
        const categories = await strapi.documents(WORK_UIDS.category).findMany({
          locale,
          status: 'published',
          filters: { isActive: { $eq: true } },
          sort: ['sortOrder:asc'],
          populate: {
            parent: { fields: ['documentId', 'name', 'slug', 'level'] },
            cover: { fields: ['url', 'alternativeText', 'width', 'height', 'mime', 'name'] },
          },
          limit: 200,
        });
        ctx.body = {
          data: buildCategoryTree(categories as any[]),
          meta: { locale, total: categories.length },
        };
      } catch (err) {
        sendError(strapi, ctx, err);
      }
    },

    async getCategoryBySlug(ctx: any) {
      try {
        const locale = resolveLocale(ctx.query.locale);
        const slug = String(ctx.params.slug || '');
        const category = await strapi.documents(WORK_UIDS.category).findFirst({
          locale,
          status: 'published',
          filters: { slug: { $eq: slug }, isActive: { $eq: true } },
          populate: {
            parent: { fields: ['documentId', 'name', 'slug', 'level'] },
            children: {
              filters: { isActive: { $eq: true } },
              fields: ['documentId', 'name', 'slug', 'level', 'sortOrder', 'isActive', 'coverUrl', 'legacyId'],
              sort: ['sortOrder:asc'],
            },
            cover: { fields: ['url', 'alternativeText', 'width', 'height', 'mime', 'name'] },
            seo: true,
          },
        });
        if (!category) {
          ctx.status = 404;
          ctx.body = { error: { code: 'NOT_FOUND', message: 'Category not found' } };
          return;
        }
        const dto = toCategoryDto(category as any) as any;
        dto.children = Array.isArray((category as any).children)
          ? (category as any).children.map(toCategoryDto)
          : [];
        ctx.body = { data: dto, meta: { locale } };
      } catch (err) {
        sendError(strapi, ctx, err);
      }
    },

    async getTags(ctx: any) {
      try {
        const locale = resolveLocale(ctx.query.locale);
        const tags = await strapi.documents(WORK_UIDS.tag).findMany({
          locale,
          status: 'published',
          filters: { isActive: { $eq: true } },
          sort: ['sortOrder:asc'],
          populate: {
            categories: { fields: ['documentId', 'name', 'slug', 'level'] },
          },
          limit: 200,
        });
        ctx.body = {
          data: (tags as any[]).map(toTagDto),
          meta: { locale, total: tags.length },
        };
      } catch (err) {
        sendError(strapi, ctx, err);
      }
    },

    async listProjects(ctx: any) {
      try {
        const parsed = parseWorkListQuery(ctx.query as Record<string, unknown>);
        const filters = await buildProjectFilters(strapi, parsed);
        const [rows, total] = await Promise.all([
          strapi.documents(WORK_UIDS.project).findMany({
            locale: parsed.locale,
            status: 'published',
            filters,
            sort: sortParams(parsed.sort),
            populate: projectListPopulate(),
            limit: parsed.pageSize,
            start: parsed.start,
          }),
          strapi.documents(WORK_UIDS.project).count({
            locale: parsed.locale,
            status: 'published',
            filters,
          }),
        ]);
        ctx.body = {
          data: (rows as any[]).map(toProjectCardDto),
          meta: {
            locale: parsed.locale,
            ...paginationMeta(parsed.page, parsed.pageSize, total),
          },
        };
      } catch (err) {
        sendError(strapi, ctx, err);
      }
    },

    async getProjectBySlug(ctx: any) {
      try {
        const locale = resolveLocale(ctx.query.locale);
        const slug = String(ctx.params.slug || '');
        const project = await strapi.documents(WORK_UIDS.project).findFirst({
          locale,
          status: 'published',
          filters: {
            slug: { $eq: slug },
            category: { isActive: { $eq: true } },
          },
          populate: projectDetailPopulate(),
        });
        if (!project) {
          ctx.status = 404;
          ctx.body = { error: { code: 'NOT_FOUND', message: 'Project not found' } };
          return;
        }
        ctx.body = { data: toProjectDetailDto(project as any), meta: { locale } };
      } catch (err) {
        sendError(strapi, ctx, err);
      }
    },

    async getFeatured(ctx: any) {
      try {
        const parsed = parseWorkListQuery({
          ...(ctx.query as object),
          sort: 'featured',
        } as Record<string, unknown>);
        const rows = await strapi.documents(WORK_UIDS.project).findMany({
          locale: parsed.locale,
          status: 'published',
          filters: {
            isFeatured: { $eq: true },
            category: { isActive: { $eq: true } },
          },
          sort: sortParams('featured'),
          populate: projectListPopulate(),
          limit: parsed.pageSize,
          start: parsed.start,
        });
        ctx.body = {
          data: (rows as any[]).map(toProjectCardDto),
          meta: {
            locale: parsed.locale,
            ...paginationMeta(parsed.page, parsed.pageSize, rows.length),
          },
        };
      } catch (err) {
        sendError(strapi, ctx, err);
      }
    },

    async getRelated(ctx: any) {
      try {
        const locale = resolveLocale(ctx.query.locale);
        const documentId = String(ctx.params.documentId || '');
        const { pageSize } = parseWorkListQuery({
          ...(ctx.query as object),
          page: '1',
        } as Record<string, unknown>);

        const project = await strapi.documents(WORK_UIDS.project).findOne({
          documentId,
          locale,
          status: 'published',
          populate: {
            relatedProjects: { populate: projectListPopulate() },
            category: { fields: ['documentId', 'slug'] },
            tags: { fields: ['documentId', 'slug'] },
          },
        });
        if (!project) {
          ctx.status = 404;
          ctx.body = { error: { code: 'NOT_FOUND', message: 'Project not found' } };
          return;
        }

        let related = Array.isArray((project as any).relatedProjects)
          ? (project as any).relatedProjects
          : [];

        if (related.length === 0) {
          const tagSlugs = Array.isArray((project as any).tags)
            ? (project as any).tags.map((t: any) => t.slug).filter(Boolean)
            : [];
          related = await strapi.documents(WORK_UIDS.project).findMany({
            locale,
            status: 'published',
            filters: {
              documentId: { $ne: documentId },
              category: {
                isActive: { $eq: true },
                ...(project as any).category?.documentId
                  ? { documentId: { $eq: (project as any).category.documentId } }
                  : {},
              },
              ...(tagSlugs.length ? { tags: { slug: { $in: tagSlugs } } } : {}),
            },
            populate: projectListPopulate(),
            sort: ['sortOrder:asc'],
            limit: pageSize,
          });
        }

        ctx.body = {
          data: related.slice(0, pageSize).map(toProjectCardDto),
          meta: { locale, sourceDocumentId: documentId },
        };
      } catch (err) {
        sendError(strapi, ctx, err);
      }
    },

    async search(ctx: any) {
      // Same list pipeline with explicit search logging
      try {
        const parsed = parseWorkListQuery(ctx.query as Record<string, unknown>);
        strapi.log.info(
          `[work-search] locale=${parsed.locale} q=${parsed.q || ''} category=${parsed.category || ''} subcategory=${parsed.subcategory || ''} tags=${parsed.tags.join(',')} page=${parsed.page}`
        );
        const filters = await buildProjectFilters(strapi, parsed);
        const [rows, total] = await Promise.all([
          strapi.documents(WORK_UIDS.project).findMany({
            locale: parsed.locale,
            status: 'published',
            filters,
            sort: sortParams(parsed.sort),
            populate: projectListPopulate(),
            limit: parsed.pageSize,
            start: parsed.start,
          }),
          strapi.documents(WORK_UIDS.project).count({
            locale: parsed.locale,
            status: 'published',
            filters,
          }),
        ]);
        ctx.body = {
          data: (rows as any[]).map(toProjectCardDto),
          meta: {
            locale: parsed.locale,
            ...paginationMeta(parsed.page, parsed.pageSize, total),
            query: {
              q: parsed.q || null,
              category: parsed.category || null,
              subcategory: parsed.subcategory || null,
              tags: parsed.tags,
              year: parsed.year ?? null,
              projectType: parsed.projectType || null,
              sort: parsed.sort,
            },
          },
        };
      } catch (err) {
        sendError(strapi, ctx, err);
      }
    },
  };
}
