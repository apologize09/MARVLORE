/**
 * Public CMS config only — never put admin tokens here.
 *
 * Enable via:
 *   ?cmsWork=categories|list|detail|all
 *   localStorage.marvlore.cmsWork = same
 *   ?cmsFilter=1          (or on with cmsWork=list|detail|all)
 *   ?cmsBase=http://127.0.0.1:1337
 *   localStorage.marvlore.cmsBase
 */
const STAGES = new Set(['off', 'categories', 'list', 'detail', 'all']);

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

export function getCmsConfig() {
  const stageRaw = (readParam('cmsWork') || readStorage('marvlore.cmsWork') || 'off').toLowerCase();
  const stage = STAGES.has(stageRaw) ? stageRaw : 'off';
  const base = (
    readParam('cmsBase') ||
    readStorage('marvlore.cmsBase') ||
    (typeof window !== 'undefined' && window.__MARVLORE_CMS_BASE__) ||
    'http://127.0.0.1:1337'
  ).replace(/\/$/, '');
  const locale = readParam('cmsLocale') || readStorage('marvlore.cmsLocale') || 'zh-CN';
  const timeoutMs = Number(readParam('cmsTimeout') || readStorage('marvlore.cmsTimeout') || 6000);
  const filterRaw = (readParam('cmsFilter') || readStorage('marvlore.cmsFilter') || '').toLowerCase();
  const useList = stage === 'list' || stage === 'detail' || stage === 'all';
  const useFilter =
    filterRaw === '1' ||
    filterRaw === 'true' ||
    filterRaw === 'on' ||
    useList;

  return {
    stage,
    baseUrl: base,
    locale: locale === 'zh' ? 'zh-CN' : locale,
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 6000,
    enabled: stage !== 'off',
    useCategories: stage === 'categories' || stage === 'list' || stage === 'detail' || stage === 'all',
    useList,
    useDetail: stage === 'detail' || stage === 'all',
    useFilter,
  };
}
