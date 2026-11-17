import { getCmsConfig } from './config.js';
import { createWorkApi } from './work-api.js';
import { buildStaticBundle, getStaticOverviewById } from './work-fallback.js';
import {
  buildDetailList,
  normalizeCategoryToOverview,
  normalizeProjectToReelItem,
} from './work-normalize.js';

function mergeOverview(staticBundle, categoryTree) {
  const fallbackById = getStaticOverviewById();
  const level2 = [];
  for (const parent of categoryTree || []) {
    if (Array.isArray(parent.children) && parent.children.length) {
      level2.push(...parent.children);
    } else if (parent.level === 2) {
      level2.push(parent);
    }
  }
  // Prefer known direction slugs order from static
  const order = staticBundle.projects.map((p) => p.id);
  const bySlug = new Map(level2.map((c) => [c.slug, c]));
  const projects = order
    .map((id) => {
      const cms = bySlug.get(id);
      return cms ? normalizeCategoryToOverview(cms, fallbackById) : fallbackById[id];
    })
    .filter(Boolean);

  // Append any extra CMS L2 not in static directions
  for (const cat of level2) {
    if (!order.includes(cat.slug)) {
      projects.push(normalizeCategoryToOverview(cat, fallbackById));
    }
  }
  return projects;
}

export async function resolveWorkBundle() {
  const config = getCmsConfig();
  const fallback = buildStaticBundle();
  if (!config.enabled) return fallback;

  try {
    const api = createWorkApi(config);
    const next = { ...fallback, source: `cms:${config.stage}`, locale: config.locale };

    try {
      const pageRes = await api.getWorkPage();
      next.workPage = pageRes?.data || null;
    } catch {
      next.workPage = null;
    }

    if (config.useCategories) {
      const categoriesRes = await api.getCategories();
      next.projects = mergeOverview(fallback, categoriesRes?.data || []);
    }

    let listRows = null;
    if (config.useList || config.useDetail) {
      const listRes = await api.getProjects({ pageSize: 48, sort: 'manual' });
      listRows = listRes?.data || [];
    }

    if (config.useList && listRows?.length) {
      // Keep reel-like items: prefer non-direction overview cards when possible
      const reelRows = listRows.filter((p) => {
        const id = p.legacyId || p.slug;
        return id && !['film', 'visual', 'web', 'culture'].includes(id);
      });
      const source = reelRows.length ? reelRows : listRows;
      next.workReelItems = source.map(normalizeProjectToReelItem);
    }

    if (config.useDetail && listRows?.length) {
      // List DTO may omit mediaItems — hydrate each slug for full detail payload
      const details = [];
      for (const row of listRows) {
        try {
          const full = await api.getProjectBySlug(row.slug);
          if (full?.data) details.push(full.data);
          else details.push(row);
        } catch {
          details.push(row);
        }
      }
      if (details.length) {
        next.workDetailCases = buildDetailList(details);
        next.detailById = new Map(next.workDetailCases.map((item) => [item.id, item]));
      }
    }

    return next;
  } catch (err) {
    console.warn('[cms] falling back to static Work data:', err?.message || err);
    return { ...fallback, source: 'static-fallback', error: String(err?.message || err) };
  }
}
