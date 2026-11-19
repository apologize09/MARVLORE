/**
 * Work channel route adapter — single owner for path /work and /work/:slug.
 * Hash (#work / #case/:id) stays compatible via callers; this module owns pathname.
 */

/**
 * @typedef {{ q:string, category:string, subcategory:string, tags:string[], year:string, projectType:string, sort:string, page:number, pageSize:number }} WorkFilters
 * @typedef {{ type:'home' } | { type:'work-list', filters?: WorkFilters|null } | { type:'work-detail', slug:string, filters?: WorkFilters|null } | { type:'not-found' }} WorkRoute
 */

const LISTENERS = new Set();

function normalizePathname(pathname) {
  const raw = String(pathname || '/');
  if (raw === '/') return '/';
  return raw.replace(/\/+$/, '') || '/';
}

/**
 * Parse pathname only (no search). Search filters are attached by the owner.
 * @param {string} [pathname]
 * @returns {WorkRoute}
 */
export function parseWorkPath(pathname) {
  const path = normalizePathname(
    pathname ?? (typeof location !== 'undefined' ? location.pathname : '/'),
  );
  if (path === '/') return { type: 'home' };
  if (path === '/work') return { type: 'work-list' };
  const match = /^\/work\/([^/]+)$/.exec(path);
  if (match) {
    let slug = match[1];
    try {
      slug = decodeURIComponent(slug);
    } catch {
      /* keep raw */
    }
    if (!slug || slug.includes('.')) return { type: 'not-found' };
    return { type: 'work-detail', slug };
  }
  return { type: 'not-found' };
}

/**
 * @param {{ pathname?: string, search?: string, filters?: WorkFilters|null }} [input]
 * @returns {WorkRoute}
 */
export function parseWorkRoute(input = {}) {
  const route = parseWorkPath(input.pathname);
  if (route.type === 'work-list' || route.type === 'work-detail') {
    return { ...route, filters: input.filters ?? null };
  }
  return route;
}

/**
 * @param {WorkRoute} route
 * @param {{ search?: string, hash?: string }} [opts]
 */
export function workRouteToUrl(route, opts = {}) {
  const search = opts.search ?? '';
  const hash = opts.hash ?? '';
  const q = search && !String(search).startsWith('?') ? `?${search}` : search || '';
  const h = hash && !String(hash).startsWith('#') ? `#${hash}` : hash || '';
  if (!route || route.type === 'home') return `/${q}${h}`;
  if (route.type === 'work-list') return `/work${q}${h}`;
  if (route.type === 'work-detail') {
    return `/work/${encodeURIComponent(route.slug)}${q}${h}`;
  }
  return `/${q}${h}`;
}

/**
 * @param {WorkRoute} route
 * @param {{ mode?: 'push'|'replace', search?: string, hash?: string, state?: object }} [opts]
 */
export function navigateWork(route, opts = {}) {
  if (typeof history === 'undefined') return;
  const mode = opts.mode === 'replace' ? 'replaceState' : 'pushState';
  const url = workRouteToUrl(route, { search: opts.search, hash: opts.hash });
  const state = { ...(opts.state || {}), workRoute: route };
  history[mode](state, '', url);
  notify(route);
}

export function getWorkRoute(filters = null) {
  if (typeof location === 'undefined') return { type: 'home' };
  return parseWorkRoute({ pathname: location.pathname, filters });
}

function notify(route) {
  LISTENERS.forEach((fn) => {
    try {
      fn(route);
    } catch (err) {
      console.error('[work-route] listener failed', err);
    }
  });
}

/**
 * Subscribe to route changes from navigateWork / popstate.
 * @param {(route: WorkRoute) => void} listener
 * @returns {() => void}
 */
export function subscribeWorkRoute(listener) {
  LISTENERS.add(listener);
  return () => LISTENERS.delete(listener);
}

/**
 * Install the single popstate owner for Work paths. Call once from app boot.
 * @param {(route: WorkRoute) => void} onChange
 * @returns {{ destroy: () => void, sync: () => WorkRoute }}
 */
export function mountWorkRouteOwner(onChange) {
  const emit = () => {
    const route = getWorkRoute();
    onChange(route);
    return route;
  };
  const onPop = () => {
    const route = getWorkRoute();
    notify(route);
  };
  const unsub = subscribeWorkRoute(onChange);
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', onPop);
  }
  emit();
  return {
    sync: emit,
    destroy() {
      unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', onPop);
      }
    },
  };
}

/**
 * Intercept in-document links to /work and /work/:slug (same origin).
 * @param {ParentNode} [root]
 * @returns {() => void}
 */
export function bindWorkPathLinks(root = typeof document !== 'undefined' ? document : null) {
  if (!root) return () => {};
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target?.closest?.('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    let url;
    try {
      url = new URL(href, typeof location !== 'undefined' ? location.href : 'http://localhost/');
    } catch {
      return;
    }
    if (typeof location !== 'undefined' && url.origin !== location.origin) return;
    const route = parseWorkPath(url.pathname);
    if (route.type !== 'work-list' && route.type !== 'work-detail') return;
    // Allow explicit full document navigation when requested
    if (link.target && link.target !== '_self') return;
    event.preventDefault();
    navigateWork(route, {
      mode: 'push',
      search: url.search,
      hash: url.hash,
    });
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
