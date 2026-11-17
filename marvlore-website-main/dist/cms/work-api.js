import { cmsGet } from './http.js';
import { cacheGet, cacheSet } from './work-cache.js';

function url(base, path, query) {
  const root = base.endsWith('/') ? base : `${base}/`;
  const apiPath = path.startsWith('/api/')
    ? path
    : `/api/${String(path).replace(/^\//, '')}`;
  const u = new URL(apiPath.replace(/^\//, ''), root);
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v != null && v !== '') u.searchParams.set(k, String(v));
  });
  return u.toString();
}

export function createWorkApi(config) {
  const { baseUrl, locale, timeoutMs } = config;

  async function get(path, query = {}, cacheParts = []) {
    const full = url(baseUrl, path, { locale, ...query });
    const cached = cacheGet(['cms', full, ...cacheParts]);
    if (cached) return cached;
    const json = await cmsGet(full, { timeoutMs });
    return cacheSet(['cms', full, ...cacheParts], json);
  }

  return {
    getCategories: () => get('/work-categories', {}, ['categories']),
    getWorkPage: () => get('/work-page', {}, ['page']),
    getProjects: (query = {}) => get('/work-projects', { pageSize: 48, sort: 'manual', ...query }, ['projects']),
    getFeatured: () => get('/work-projects/featured', { pageSize: 24 }, ['featured']),
    getProjectBySlug: (slug) => get(`/work-projects/slug/${encodeURIComponent(slug)}`, {}, ['project', slug]),
    getTags: () => get('/work-tags', {}, ['tags']),
    search: (query = {}) =>
      get('/work-search', { pageSize: 12, sort: 'manual', ...query }, [
        'search',
        query.q,
        query.category,
        query.subcategory,
        query.tags,
        query.year,
        query.projectType,
        query.sort,
        query.page,
        query.pageSize,
      ]),
    getCacheVersion: () => get('/work-cache-version', {}, ['cache-version']),
    getAwards: () => get('/awards', { sort: 'sortOrder:asc' }, ['awards']),
    // single type — not localized; avoid forcing locale query
    getGlobalSetting: async () => {
      const full = url(baseUrl, '/global-setting', {});
      const cached = cacheGet(['cms', full, 'global-setting']);
      if (cached) return cached;
      const json = await cmsGet(full, { timeoutMs });
      return cacheSet(['cms', full, 'global-setting'], json);
    },
  };
}
