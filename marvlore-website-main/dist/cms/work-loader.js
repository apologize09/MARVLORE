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
