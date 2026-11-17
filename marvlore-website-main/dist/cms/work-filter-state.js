/**
 * Work filter query state — keeps hash (#work / #case/…) intact.
 * Params: q, category, subcategory, tags, year, projectType, sort, page, pageSize
 */

const FILTER_KEYS = [
  'q',
  'category',
  'subcategory',
  'tags',
  'year',
  'projectType',
  'sort',
  'page',
  'pageSize',
];

export function emptyWorkFilters() {
  return {
    q: '',
    category: '',
    subcategory: '',
    tags: [],
    year: '',
    projectType: '',
    sort: 'manual',
    page: 1,
    pageSize: 12,
  };
}

export function parseTags(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((v) => String(v).split(',')).map((s) => s.trim()).filter(Boolean);
  }
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function readWorkFilters(search = typeof location !== 'undefined' ? location.search : '') {
  const params = new URLSearchParams(
    String(search || '').startsWith('?') ? String(search).slice(1) : String(search || ''),
  );
  const base = emptyWorkFilters();
  const q = (params.get('q') || '').trim();
  const category = (params.get('category') || '').trim();
  const subcategory = (params.get('subcategory') || '').trim();
  const tags = parseTags(params.get('tags'));
  const yearRaw = params.get('year');
  const year = yearRaw && /^\d{4}$/.test(yearRaw) ? yearRaw : '';
  const projectType = (params.get('projectType') || '').trim();
  const sortRaw = (params.get('sort') || 'manual').trim();
  const sort = ['manual', 'latest', 'oldest', 'featured'].includes(sortRaw) ? sortRaw : 'manual';
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  let pageSize = Number.parseInt(params.get('pageSize') || '12', 10) || 12;
  if (pageSize < 1) pageSize = 12;
  if (pageSize > 48) pageSize = 48;
  return {
    ...base,
    q,
    category,
    subcategory,
    tags,
    year,
    projectType: ['image', 'video', 'mixed'].includes(projectType) ? projectType : '',
    sort,
    page,
    pageSize,
  };
}

export function hasActiveFilters(state) {
  if (!state) return false;
  return Boolean(
    state.q ||
      state.category ||
      state.subcategory ||
      (state.tags && state.tags.length) ||
      state.year ||
      state.projectType ||
      (state.sort && state.sort !== 'manual') ||
      (state.page && state.page > 1),
  );
}

export function filtersEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.q === b.q &&
    a.category === b.category &&
    a.subcategory === b.subcategory &&
    a.year === b.year &&
    a.projectType === b.projectType &&
    a.sort === b.sort &&
    a.page === b.page &&
    a.pageSize === b.pageSize &&
    String(a.tags || []) === String(b.tags || [])
  );
}

/** Apply filter fields onto URLSearchParams; preserve unrelated keys (cmsWork, cmsBase…). */
export function applyFiltersToParams(params, state, { clearInactive = true } = {}) {
  const next = new URLSearchParams(params);
  const setOrDelete = (key, value) => {
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) {
      if (clearInactive) next.delete(key);
      return;
    }
    next.set(key, Array.isArray(value) ? value.join(',') : String(value));
  };

  setOrDelete('q', state.q);
  setOrDelete('category', state.category);
  setOrDelete('subcategory', state.subcategory);
  setOrDelete('tags', state.tags);
  setOrDelete('year', state.year);
  setOrDelete('projectType', state.projectType);
  if (!state.sort || state.sort === 'manual') {
    if (clearInactive) next.delete('sort');
  } else {
    next.set('sort', state.sort);
  }
  if (!state.page || state.page <= 1) {
    if (clearInactive) next.delete('page');
  } else {
    next.set('page', String(state.page));
  }
  if (!state.pageSize || state.pageSize === 12) {
    if (clearInactive) next.delete('pageSize');
  } else {
    next.set('pageSize', String(state.pageSize));
  }
  return next;
}

export function writeWorkFilters(state, { replace = true, hash } = {}) {
  if (typeof location === 'undefined' || typeof history === 'undefined') return state;
  const params = applyFiltersToParams(new URLSearchParams(location.search), state);
  const search = params.toString();
  const nextHash = hash != null ? hash : location.hash;
  const url = `${location.pathname}${search ? `?${search}` : ''}${nextHash || ''}`;
  if (replace) history.replaceState(history.state, '', url);
  else history.pushState(history.state, '', url);
  return state;
}

export function toSearchQuery(state, locale = 'zh-CN') {
  const query = {
    locale,
    page: state.page || 1,
    pageSize: state.pageSize || 12,
    sort: state.sort || 'manual',
  };
  if (state.q) query.q = state.q;
  if (state.category) query.category = state.category;
  if (state.subcategory) query.subcategory = state.subcategory;
  if (state.tags?.length) query.tags = state.tags.join(',');
  if (state.year) query.year = state.year;
  if (state.projectType) query.projectType = state.projectType;
  return query;
}

export { FILTER_KEYS };
