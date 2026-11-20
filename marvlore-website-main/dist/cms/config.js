/**
 * Public CMS config only — never put admin tokens here.
 *
 * Defaults: cmsWork=all + cmsSite=all (Marvlore CMS wired). Override with:
 *   ?cmsWork=off|categories|list|detail|all
 *   ?cmsSite=off|contact|awards|services|about|hero|all
 *   ?cmsFilter=on|off   (Work search/tag/sort bar; default off on homepage)
 *   ?cmsBase=https://admin.marvlore.com
 *   localStorage.marvlore.cmsWork / cmsSite / cmsBase / cmsFilter
 *   window.__MARVLORE_CMS_BASE__
 * Static fallback still applies when the API is unreachable.
 *
 * Default cmsBase: localhost/127.0.0.1 → http://127.0.0.1:1337
 * otherwise → https://admin.marvlore.com (never ship 127.0.0.1 to www).
 */
const STAGES = new Set(['off', 'categories', 'list', 'detail', 'all']);
const SITE_STAGES = new Set(['off', 'contact', 'awards', 'services', 'about', 'hero', 'all']);
const PROD_CMS_BASE = 'https://admin.marvlore.com';
const LOCAL_CMS_BASE = 'http://127.0.0.1:1337';

function readParam(name) {
  try {
    return new URLSearchParams(location.search).get(name);
  } catch {
    return null;
  }
}

function readStorage(name) {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

function defaultCmsBase() {
  try {
    const host = String(location?.hostname || '');
    if (host === 'localhost' || host === '127.0.0.1') return LOCAL_CMS_BASE;
  } catch {
    /* ignore */
  }
  return PROD_CMS_BASE;
}

export function getCmsConfig() {
  const stageRaw = (readParam('cmsWork') || readStorage('marvlore.cmsWork') || 'all').toLowerCase();
  const stage = STAGES.has(stageRaw) ? stageRaw : 'all';
  const siteRaw = (readParam('cmsSite') || readStorage('marvlore.cmsSite') || 'all').toLowerCase();
  // cmsWork=all also unlocks site modules for convenience
  const siteStage = SITE_STAGES.has(siteRaw)
    ? siteRaw
    : stage === 'all'
      ? 'all'
      : 'off';
  let base = (
    readParam('cmsBase') ||
    readStorage('marvlore.cmsBase') ||
    (typeof window !== 'undefined' && window.__MARVLORE_CMS_BASE__) ||
    defaultCmsBase()
  ).replace(/\/$/, '');
  // Guard: never call the visitor's own loopback from a public host (CORS + dead requests).
  try {
    const host = String(location?.hostname || '');
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (!isLocalHost && /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?$/i.test(base)) {
      base = PROD_CMS_BASE;
    }
  } catch {
    /* ignore */
  }
  const locale = readParam('cmsLocale') || readStorage('marvlore.cmsLocale') || 'zh-CN';
  const timeoutMs = Number(readParam('cmsTimeout') || readStorage('marvlore.cmsTimeout') || 6000);
  // Work search/tag/sort bar: off on homepage by default. Keep module for later pages;
  // opt in with ?cmsFilter=on (or localStorage marvlore.cmsFilter=on).
  const filterRaw = (readParam('cmsFilter') || readStorage('marvlore.cmsFilter') || 'off').toLowerCase();
  const useList = stage === 'list' || stage === 'detail' || stage === 'all';
  const useFilter =
    filterRaw === '1' ||
    filterRaw === 'true' ||
    filterRaw === 'on';
  const useContact = siteStage === 'contact' || siteStage === 'all';
  const useAwards = siteStage === 'awards' || siteStage === 'all';
  const useServices = siteStage === 'services' || siteStage === 'all';
  const useAbout = siteStage === 'about' || siteStage === 'all';
  const useHero = siteStage === 'hero' || siteStage === 'all';

  return {
    stage,
    siteStage,
    baseUrl: base,
    locale: locale === 'zh' ? 'zh-CN' : locale,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 6000,
    enabled: stage !== 'off' || siteStage !== 'off',
    useCategories: stage === 'categories' || stage === 'list' || stage === 'detail' || stage === 'all',
    useList,
    useDetail: stage === 'detail' || stage === 'all',
    useFilter,
    useContact,
    useAwards,
    useServices,
    useAbout,
    useHero,
  };
}
