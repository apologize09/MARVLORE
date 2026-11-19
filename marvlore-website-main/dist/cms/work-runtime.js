import { buildStaticBundle } from './work-fallback.js?v=efa3d94e78';
import { resolveWorkBundle } from './work-loader.js?v=387ba4e255';
import { getCmsConfig } from './config.js?v=1e182ce0a2';
import { createWorkApi } from './work-api.js?v=ae2aac4d08';
import { normalizeProjectToDetail } from './work-normalize.js?v=2ccfb94979';

let bundle = buildStaticBundle();
const hydrateInflight = new Map();

export function getWorkBundle() {
  return bundle;
}

export function getProjects() {
  return bundle.projects;
}

export function getWorkReelItems() {
  return bundle.workReelItems;
}

export function getWorkReelOptions() {
  return bundle.workReelOptions;
}

export function getWorkDetail(id) {
  if (!id) return null;
  return (
    bundle.detailById?.get(id) ||
    bundle.workDetailCases?.find((item) => item.id === id || item.slug === id)
  );
}

/**
 * Lazy-load full CMS project detail (media blocks) when a case study opens.
 * Boot only builds a light index from list DTOs to keep first paint fast.
 */
export async function ensureWorkDetail(id) {
  const existing = getWorkDetail(id);
  if (existing?._cmsFull) return existing;

  const config = getCmsConfig();
  if (!config.enabled || !config.useDetail) return existing;

  if (hydrateInflight.has(id)) return hydrateInflight.get(id);

  const job = (async () => {
    try {
      const row = bundle.projectById?.get(id);
      const slug = row?.slug || existing?.slug || id;
      if (!slug) return existing;
      const api = createWorkApi(config);
      const full = await api.getProjectBySlug(slug);
      if (!full?.data) return existing;
      const hydrated = normalizeProjectToDetail(full.data, {
        index: existing?.index || 1,
        total: existing?.total || bundle.workDetailCases?.length || 1,
        nextId: existing?.nextId || null,
      });
      hydrated._cmsFull = true;
      // Prefer related (same category / shared tags) for next when API provides it.
      try {
        const documentId = full.data.documentId || hydrated.documentId;
        if (documentId) {
          const related = await api.getRelated(documentId, { pageSize: 4 });
          const next = (related?.data || []).find(
            (row) => (row.legacyId || row.slug) && (row.legacyId || row.slug) !== hydrated.id,
          );
          if (next) hydrated.nextId = next.legacyId || next.slug;
        }
      } catch {
        /* keep list-order nextId */
      }
      if (!Array.isArray(bundle.workDetailCases)) bundle.workDetailCases = [];
      const idx = bundle.workDetailCases.findIndex((c) => c.id === hydrated.id || c.slug === hydrated.slug);
      if (idx >= 0) bundle.workDetailCases[idx] = hydrated;
      else bundle.workDetailCases.push(hydrated);
      if (!(bundle.detailById instanceof Map)) bundle.detailById = new Map();
      bundle.detailById.set(hydrated.id, hydrated);
      if (hydrated.slug) bundle.detailById.set(hydrated.slug, hydrated);
      return hydrated;
    } catch (err) {
      console.warn('[cms] ensureWorkDetail failed:', err?.message || err);
      return existing;
    } finally {
      hydrateInflight.delete(id);
    }
  })();

  hydrateInflight.set(id, job);
  return job;
}

export function getAwards() {
  return bundle.awards;
}

export function getContact() {
  return bundle.contact || null;
}

export function getServices() {
  return bundle.services || [];
}

export function getAbout() {
  return bundle.about || null;
}

export function getHeroProjects() {
  return bundle.heroProjects || [];
}

export function getHeroImages() {
  return bundle.heroImages || [];
}

export function getWorkPage() {
  return bundle.workPage || null;
}

export function getBundleLocale() {
  return bundle.locale || 'zh-CN';
}

export function installWorkBundle(next) {
  bundle = next;
  try {
    const source = next.source || 'unknown';
    document.documentElement.dataset.cmsWorkSource = source;
    document.documentElement.setAttribute('data-cms-work-source', source);
    let meta = document.querySelector('meta[name="marvlore-cms-source"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'marvlore-cms-source');
      document.head?.append(meta);
    }
    meta.setAttribute('content', source);
    if (typeof window !== 'undefined') {
      window.__MARVLORE_CMS_SOURCE__ = source;
      window.__MARVLORE_CMS_STAGE__ = next.source?.startsWith('cms:')
        ? next.source.slice(4)
        : next.source;
      window.__MARVLORE_SERVICE_ITEMS__ = Array.isArray(next.services) ? next.services : [];
      window.__MARVLORE_ABOUT__ = next.about || null;
      window.__MARVLORE_HERO_PROJECTS__ = Array.isArray(next.heroProjects) ? next.heroProjects : [];
      window.__MARVLORE_HERO_IMAGES__ = Array.isArray(next.heroImages) ? next.heroImages : [];
    }
  } catch {
    // non-DOM test env
  }
  return bundle;
}

export async function bootWorkBundle() {
  const next = await resolveWorkBundle();
  return installWorkBundle(next);
}
