import { buildStaticBundle } from './work-fallback.js?v=efa3d94e78';
import { resolveWorkBundle } from './work-loader.js?v=9bb7286e3d';

let bundle = buildStaticBundle();

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
  return bundle.detailById.get(id) || bundle.workDetailCases.find((item) => item.id === id);
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
