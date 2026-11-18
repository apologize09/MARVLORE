import { getCmsConfig } from './config.js?v=1e182ce0a2';
import { createWorkApi } from './work-api.js?v=32753a3ef8';
import { buildStaticBundle, getStaticOverviewById } from './work-fallback.js?v=efa3d94e78';
import {
  buildDetailList,
  normalizeCategoryToOverview,
  normalizeProjectToReelItem,
} from './work-normalize.js?v=5cce48ed19';

const DIRECTION_SHELL_IDS = new Set(['film', 'visual', 'web', 'culture']);

function collectLevel2(categoryTree) {
  const level2 = [];
  for (const parent of categoryTree || []) {
    if (Array.isArray(parent.children) && parent.children.length) {
      level2.push(...parent.children);
    } else if (parent.level === 2) {
      level2.push(parent);
    }
  }
  return level2;
}

function mergeOverview(staticBundle, categoryTree, displayCategories) {
  const fallbackById = getStaticOverviewById();
  const fromDisplay = Array.isArray(displayCategories)
    ? displayCategories.filter((c) => c && c.slug)
    : [];
  const level2 = fromDisplay.length ? fromDisplay : collectLevel2(categoryTree);

  // Prefer work-page.displayCategories order; else known static direction order
  const order = fromDisplay.length
    ? fromDisplay.map((c) => c.slug)
    : staticBundle.projects.map((p) => p.id);
  const bySlug = new Map(level2.map((c) => [c.slug, c]));
  const projects = order
    .map((id) => {
      const cms = bySlug.get(id);
      return cms ? normalizeCategoryToOverview(cms, fallbackById) : fallbackById[id];
    })
    .filter(Boolean);

  // Append any extra CMS L2 not already listed
  for (const cat of level2) {
    if (!order.includes(cat.slug)) {
      projects.push(normalizeCategoryToOverview(cat, fallbackById));
    }
  }
  return projects;
}

function isDirectionShell(projectDto) {
  const id = projectDto?.legacyId || projectDto?.slug;
  return Boolean(id && DIRECTION_SHELL_IDS.has(id));
}

function pickReelRows(homeRows, listRows) {
  const fromHome = (homeRows || []).filter((p) => p && !isDirectionShell(p));
  if (fromHome.length) return fromHome;
  // Preserve current site content when showOnHome is unset: non-shell list items
  return (listRows || []).filter((p) => p && !isDirectionShell(p));
}

function settledData(result) {
  if (result.status !== 'fulfilled') return null;
  return result.value?.data ?? result.value ?? null;
}

/**
 * Homepage boot path: parallelize CMS reads and skip per-slug detail hydration.
 * Full project media is loaded lazily via ensureWorkDetail() when a case opens.
 */
export async function resolveWorkBundle() {
  const config = getCmsConfig();
  const fallback = buildStaticBundle();
  if (!config.enabled) return fallback;

  try {
    const api = createWorkApi(config);
    const sourceLabel =
      config.stage !== 'off'
        ? `cms:${config.stage}`
        : `cms:site:${config.siteStage || 'on'}`;
    const next = { ...fallback, source: sourceLabel, locale: config.locale };

    const needWork = config.useCategories || config.useList || config.useDetail;
    const tasks = {
      page: needWork ? api.getWorkPage().catch(() => null) : Promise.resolve(null),
      categories: config.useCategories ? api.getCategories().catch(() => null) : Promise.resolve(null),
      list:
        config.useList || config.useDetail
          ? api.getProjects({ pageSize: 48, sort: 'manual' }).catch(() => null)
          : Promise.resolve(null),
      home: config.useList
        ? api.getProjects({ pageSize: 48, sort: 'manual', showOnHome: true }).catch(() => null)
        : Promise.resolve(null),
      awards: config.useAwards ? api.getAwards().catch(() => null) : Promise.resolve(null),
      contact: config.useContact ? api.getGlobalSetting().catch(() => null) : Promise.resolve(null),
      services: config.useServices ? api.getServices().catch(() => null) : Promise.resolve(null),
      about: config.useAbout ? api.getAboutPage().catch(() => null) : Promise.resolve(null),
      hero: config.useHero ? api.getHeroItems().catch(() => null) : Promise.resolve(null),
    };

    const results = await Promise.allSettled([
      tasks.page,
      tasks.categories,
      tasks.list,
      tasks.home,
      tasks.awards,
      tasks.contact,
      tasks.services,
      tasks.about,
      tasks.hero,
    ]);

    const [
      pageRes,
      categoriesRes,
      listRes,
      homeRes,
      awardsRes,
      contactRes,
      servicesRes,
      aboutRes,
      heroRes,
    ] = results;

    next.workPage = settledData(pageRes);

    if (config.useCategories) {
      next.projects = mergeOverview(
        fallback,
        settledData(categoriesRes) || [],
        next.workPage?.displayCategories || [],
      );
    }

    const listRows = settledData(listRes) || [];
    const homeRows = settledData(homeRes) || [];

    if (config.useList) {
      const source = pickReelRows(homeRows, listRows);
      if (source.length) {
        next.workReelItems = source.map(normalizeProjectToReelItem);
      }
    }

    // Light detail index from list DTOs (no N+1 slug fetches on boot).
    // Media-rich payloads hydrate on demand in ensureWorkDetail().
    if (config.useDetail && listRows.length) {
      const projectById = new Map();
      for (const row of listRows) {
        if (!row) continue;
        if (row.slug) projectById.set(row.slug, row);
        const id = row.legacyId || row.slug;
        if (id) projectById.set(id, row);
      }
      next.projectById = projectById;
      next.workDetailCases = buildDetailList(listRows);
      next.detailById = new Map(next.workDetailCases.map((item) => [item.id, item]));
    }

    if (config.useAwards) {
      const rows = settledData(awardsRes) || [];
      if (rows.length) {
        next.awards = rows.map((row) => ({
          image: row.image,
          alt: row.alt || '',
        }));
      }
    }

    if (config.useContact) {
      const contact = settledData(contactRes);
      if (contact) next.contact = { ...fallback.contact, ...contact };
    }

    if (config.useServices) {
      const rows = settledData(servicesRes) || [];
      if (rows.length) {
        next.services = rows.map((row) => {
          const item = {
            id: row.id || row.slug,
            en: row.en,
            cn: row.cn,
            image: row.image,
            description: row.description || '',
          };
          if (row.typeScale != null && Number.isFinite(Number(row.typeScale))) {
            item.typeScale = Number(row.typeScale);
          }
          return item;
        });
      }
    }

    if (config.useAbout) {
      const about = settledData(aboutRes);
      if (about) next.about = about;
    }

    if (config.useHero) {
      const rows = settledData(heroRes) || [];
      const projects = rows.filter((row) => row.role === 'project');
      const orbit = rows.filter((row) => row.role === 'orbit');
      if (projects.length) {
        next.heroProjects = projects.map((row) => {
          const item = {
            id: row.id,
            slug: row.slug,
            title: row.title,
            alt: row.alt,
            src: row.src,
            width: row.width,
            height: row.height,
          };
          if (row.videoSrc) item.videoSrc = row.videoSrc;
          if (row.videoSrcHd) item.videoSrcHd = row.videoSrcHd;
          if (row.previewSrc) item.previewSrc = row.previewSrc;
          if (row.homePreviewSrc) item.homePreviewSrc = row.homePreviewSrc;
          if (Array.isArray(row.slides)) item.slides = row.slides;
          return item;
        });
      }
      if (orbit.length) {
        next.heroImages = orbit.map((row) => ({
          id: String(row.id).replace(/^orbit-/, ''),
          src: row.src,
          alt: row.alt,
          width: row.width,
          height: row.height,
        }));
      }
    }

    return next;
  } catch (err) {
    console.warn('[cms] falling back to static Work data:', err?.message || err);
    return { ...fallback, source: 'static-fallback', error: String(err?.message || err) };
  }
}
