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

    if (config.useCategories || config.useList || config.useDetail) {
      try {
        const pageRes = await api.getWorkPage();
        next.workPage = pageRes?.data || null;
      } catch {
        next.workPage = null;
      }
    }

    if (config.useCategories) {
      const categoriesRes = await api.getCategories();
      next.projects = mergeOverview(
        fallback,
        categoriesRes?.data || [],
        next.workPage?.displayCategories || [],
      );
    }

    let listRows = null;
    let homeRows = null;
    if (config.useList || config.useDetail) {
      const listRes = await api.getProjects({ pageSize: 48, sort: 'manual' });
      listRows = listRes?.data || [];
    }

    if (config.useList) {
      try {
        const homeRes = await api.getProjects({
          pageSize: 48,
          sort: 'manual',
          showOnHome: true,
        });
        homeRows = homeRes?.data || [];
      } catch (err) {
        console.warn('[cms] showOnHome reel query failed:', err?.message || err);
      }
      const source = pickReelRows(homeRows, listRows);
      if (source.length) {
        next.workReelItems = source.map(normalizeProjectToReelItem);
      }
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

    if (config.useAwards) {
      try {
        const awardsRes = await api.getAwards();
        const rows = awardsRes?.data || [];
        if (rows.length) {
          next.awards = rows.map((row) => ({
            image: row.image,
            alt: row.alt || '',
          }));
        }
      } catch (err) {
        console.warn('[cms] awards fallback:', err?.message || err);
      }
    }

    if (config.useContact) {
      try {
        const contactRes = await api.getGlobalSetting();
        if (contactRes?.data) {
          next.contact = { ...fallback.contact, ...contactRes.data };
        }
      } catch (err) {
        console.warn('[cms] contact fallback:', err?.message || err);
      }
    }

    if (config.useServices) {
      try {
        const servicesRes = await api.getServices();
        const rows = servicesRes?.data || [];
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
      } catch (err) {
        console.warn('[cms] services fallback:', err?.message || err);
      }
    }

    if (config.useAbout) {
      try {
        const aboutRes = await api.getAboutPage();
        if (aboutRes?.data) next.about = aboutRes.data;
      } catch (err) {
        console.warn('[cms] about fallback:', err?.message || err);
      }
    }

    if (config.useHero) {
      try {
        const heroRes = await api.getHeroItems();
        const rows = heroRes?.data || [];
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
      } catch (err) {
        console.warn('[cms] hero fallback:', err?.message || err);
      }
    }

    return next;
  } catch (err) {
    console.warn('[cms] falling back to static Work data:', err?.message || err);
    return { ...fallback, source: 'static-fallback', error: String(err?.message || err) };
  }
}
