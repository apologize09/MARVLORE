import { getCmsConfig } from './config.js?v=1e182ce0a2';
import { createWorkApi } from './work-api.js?v=ae2aac4d08';
import { normalizeProjectToReelItem } from './work-normalize.js?v=2ccfb94979';
import {
  emptyWorkFilters,
  filtersEqual,
  hasActiveFilters,
  readWorkFilters,
  toSearchQuery,
  writeWorkFilters,
} from './work-filter-state.js?v=118870d81b';

const DEBOUNCE_MS = 300;

function debounce(fn, ms) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function emitFilter(detail) {
  window.dispatchEvent(new CustomEvent('marvlore:work-filter', { detail }));
}

function ensureEmptyNode(root) {
  let empty = root.querySelector('[data-work-filter-empty]');
  if (empty) return empty;
  empty = document.createElement('div');
  empty.className = 'work-filter-empty';
  empty.hidden = true;
  empty.setAttribute('data-work-filter-empty', '');
  empty.setAttribute('role', 'status');
  empty.innerHTML =
    '<p>没有符合条件的作品</p><button type="button" data-work-filter-clear>清空筛选</button>';
  const overview = root.querySelector('#work-overview');
  const reel = root.querySelector('.elastic-reel');
  (reel || overview || root).after(empty);
  return empty;
}

function ensureFilterBar(root) {
  let bar = root.querySelector('[data-work-filter-bar]');
  if (bar) return bar;
  bar = document.createElement('div');
  bar.className = 'work-filter-bar';
  bar.setAttribute('data-work-filter-bar', '');
  bar.innerHTML = `
    <label class="work-filter-search">
      <span class="sr-only">搜索作品</span>
      <input type="search" name="q" placeholder="搜索作品、客户、标签…" autocomplete="off" enterkeyhint="search">
    </label>
    <div class="work-filter-tags" data-work-filter-tags role="group" aria-label="标签筛选"></div>
    <label class="work-filter-sort">
      <span class="sr-only">排序</span>
      <select name="sort" aria-label="排序">
        <option value="manual">默认排序</option>
        <option value="latest">最新</option>
        <option value="oldest">最早</option>
        <option value="featured">精选优先</option>
      </select>
    </label>
    <button type="button" class="work-filter-clear" data-work-filter-clear hidden>清空筛选</button>
  `;
  const cats = root.querySelector('.work-categories');
  if (cats) cats.after(bar);
  else root.prepend(bar);
  return bar;
}

function renderTags(container, tags, selected) {
  const selectedSet = new Set(selected || []);
  container.innerHTML = (tags || [])
    .slice(0, 16)
    .map((tag) => {
      const slug = tag.slug || tag.id;
      const name = tag.name || slug;
      const pressed = selectedSet.has(slug);
      return `<button type="button" data-work-tag="${slug}" aria-pressed="${pressed}">${name}</button>`;
    })
    .join('');
}

function syncBar(bar, state) {
  const input = bar.querySelector('input[name="q"]');
  const sort = bar.querySelector('select[name="sort"]');
  const clear = bar.querySelector('[data-work-filter-clear]');
  if (input && input.value !== (state.q || '')) input.value = state.q || '';
  if (sort) sort.value = state.sort || 'manual';
  if (clear) clear.hidden = !hasActiveFilters(state);
  const tagButtons = bar.querySelectorAll('[data-work-tag]');
  tagButtons.forEach((btn) => {
    btn.setAttribute('aria-pressed', String((state.tags || []).includes(btn.dataset.workTag)));
  });
}

function syncCategoryButtons(root, state) {
  const active = state.subcategory || state.category || 'all';
  root.querySelectorAll('[data-work-category]').forEach((btn) => {
    const id = btn.dataset.workCategory;
    btn.setAttribute('aria-pressed', String(id === active || (active === 'all' && id === 'all')));
  });
}

/**
 * Progressive Work filters: URL query sync + CMS search (OR tags) + empty clear.
 * Existing category toolbar / reel physics stay intact.
 *
 * Homepage: bar is off by default (getCmsConfig().useFilter). Re-enable with
 * ?cmsFilter=on when mounting on a dedicated Work page later.
 */
export function mountWorkFilters() {
  const config = getCmsConfig();
  if (!config.useFilter) return { destroy() {} };

  const root = document.querySelector('#work');
  if (!root) return { destroy() {} };

  const api = createWorkApi(config);
  const bar = ensureFilterBar(root);
  const empty = ensureEmptyNode(root);
  let state = readWorkFilters();
  let destroyed = false;
  let requestId = 0;
  let tagCatalog = [];

  const applyLocalCategory = (subcategory) => {
    // Keep existing in-page category UX; URL uses subcategory for L2 (film/visual/…)
    const next = {
      ...state,
      subcategory: subcategory && subcategory !== 'all' ? subcategory : '',
      category: '',
      page: 1,
    };
    commit(next, { replace: true, localOnly: false });
  };

  async function runSearch(nextState) {
    const id = ++requestId;
    try {
      const res = await api.search(toSearchQuery(nextState, config.locale));
      if (destroyed || id !== requestId) return;
      const rows = res?.data || [];
      const ids = rows.map((row) => row.legacyId || row.slug).filter(Boolean);
      const reelItems = rows.map(normalizeProjectToReelItem);
      const isEmpty = hasActiveFilters(nextState) && ids.length === 0;
      empty.hidden = !isEmpty;
      emitFilter({
        state: nextState,
        ids,
        items: reelItems,
        empty: isEmpty,
        meta: res?.meta || null,
        source: 'cms-search',
      });
    } catch (err) {
      if (destroyed || id !== requestId) return;
      console.warn('[cms] work-search failed:', err?.message || err);
      // Fall back to local category pool signal
      emitFilter({
        state: nextState,
        ids: null,
        items: null,
        empty: false,
        error: String(err?.message || err),
        source: 'search-error',
      });
    }
  }

  function commit(next, { replace = true, localOnly = false } = {}) {
    if (filtersEqual(state, next) && !localOnly) {
      // still refresh search when first mount
    }
    state = next;
    writeWorkFilters(state, { replace });
    syncBar(bar, state);
    syncCategoryButtons(root, state);
    runSearch(state);
  }

  const debouncedQuery = debounce((q) => {
    commit({ ...state, q, page: 1 }, { replace: true });
  }, DEBOUNCE_MS);

  // Load tags for chip row
  api
    .getTags()
    .then((res) => {
      if (destroyed) return;
      tagCatalog = res?.data || [];
      renderTags(bar.querySelector('[data-work-filter-tags]'), tagCatalog, state.tags);
      syncBar(bar, state);
    })
    .catch(() => {});

  bar.querySelector('input[name="q"]')?.addEventListener('input', (event) => {
    debouncedQuery(event.target.value.trim());
  });
  bar.querySelector('select[name="sort"]')?.addEventListener('change', (event) => {
    commit({ ...state, sort: event.target.value || 'manual', page: 1 }, { replace: false });
  });
  bar.addEventListener('click', (event) => {
    const tagBtn = event.target.closest('[data-work-tag]');
    if (tagBtn) {
      const slug = tagBtn.dataset.workTag;
      const set = new Set(state.tags || []);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      commit({ ...state, tags: [...set], page: 1 }, { replace: false });
      renderTags(bar.querySelector('[data-work-filter-tags]'), tagCatalog, state.tags);
      syncBar(bar, state);
      return;
    }
    if (event.target.closest('[data-work-filter-clear]')) {
      commit(emptyWorkFilters(), { replace: false });
      renderTags(bar.querySelector('[data-work-filter-tags]'), tagCatalog, []);
    }
  });
  empty.addEventListener('click', (event) => {
    if (event.target.closest('[data-work-filter-clear]')) {
      commit(emptyWorkFilters(), { replace: false });
      renderTags(bar.querySelector('[data-work-filter-tags]'), tagCatalog, []);
    }
  });

  // Mirror existing category toolbar into URL (subcategory = L2 slug)
  root.querySelector('.work-categories')?.addEventListener(
    'click',
    (event) => {
      const btn = event.target.closest('[data-work-category]');
      if (!btn) return;
      applyLocalCategory(btn.dataset.workCategory);
    },
    true,
  );

  const onPopState = () => {
    const next = readWorkFilters();
    if (filtersEqual(state, next)) return;
    state = next;
    syncBar(bar, state);
    syncCategoryButtons(root, state);
    renderTags(bar.querySelector('[data-work-filter-tags]'), tagCatalog, state.tags);
    runSearch(state);
  };
  window.addEventListener('popstate', onPopState);

  // Initial hydrate from URL
  syncBar(bar, state);
  syncCategoryButtons(root, state);
  runSearch(state);

  return {
    getState: () => ({ ...state, tags: [...(state.tags || [])] }),
    setState: (partial) => commit({ ...state, ...partial }, { replace: false }),
    clear: () => commit(emptyWorkFilters(), { replace: false }),
    destroy() {
      destroyed = true;
      window.removeEventListener('popstate', onPopState);
    },
  };
}
