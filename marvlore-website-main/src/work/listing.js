/**
 * Independent /work listing page (P2).
 * Reuses CMS api + filter-state; does not touch homepage Reel DOM.
 */

import { getCmsConfig } from '@marvlore/cms/config';
import { createWorkApi } from '@marvlore/cms/work-api';
import {
  emptyWorkFilters,
  filtersEqual,
  hasActiveFilters,
  readWorkFilters,
  toSearchQuery,
  writeWorkFilters,
} from '@marvlore/cms/work-filter-state';
import { projectDtoToCard, reelItemToCard, renderProjectCardGrid } from './project-card.js';

const DEBOUNCE_MS = 300;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, ms) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function level2Categories(categories) {
  return (categories || [])
    .filter((c) => c && (c.id || c.slug))
    .map((c) => ({
      id: c.id || c.slug,
      label: c.cn || c.nameCn || c.name || c.title || c.id || c.slug,
    }));
}

function renderShell({ title, intro, categories }) {
  const cats = level2Categories(categories);
  const catButtons = [
    `<button type="button" data-work-listing-category="all" aria-pressed="true">全部</button>`,
    ...cats.map(
      (c) =>
        `<button type="button" data-work-listing-category="${escapeHtml(c.id)}" aria-pressed="false">${escapeHtml(c.label)}</button>`,
    ),
  ].join('');

  return `<section class="work-listing screen wrap" data-work-listing aria-labelledby="work-listing-title">
    <header class="work-listing-header">
      <a class="work-listing-back" href="/" data-work-listing-back>
        <span aria-hidden="true">←</span> 返回首页
      </a>
      <h1 id="work-listing-title">${escapeHtml(title)}</h1>
      <p class="work-listing-intro">${escapeHtml(intro)}</p>
    </header>
    <div class="work-listing-toolbar" data-work-listing-toolbar>
      <div class="work-listing-categories" role="toolbar" aria-label="作品分类">${catButtons}</div>
      <div class="work-listing-filters" data-work-listing-filters>
        <div class="work-listing-controls">
          <label class="work-listing-search">
            <span class="sr-only">搜索作品</span>
            <input type="search" name="q" placeholder="搜索作品、客户、标签…" autocomplete="off" enterkeyhint="search">
          </label>
          <div class="work-listing-sort" data-work-listing-sort>
            <button type="button" class="work-listing-sort-trigger" data-work-listing-sort-trigger aria-haspopup="listbox" aria-expanded="false" aria-label="排序">
              <span data-work-listing-sort-label>默认排序</span>
            </button>
            <ul class="work-listing-sort-menu" data-work-listing-sort-menu role="listbox" aria-label="排序" hidden>
              <li role="option" data-sort="manual" aria-selected="true">默认排序</li>
              <li role="option" data-sort="latest" aria-selected="false">最新</li>
              <li role="option" data-sort="oldest" aria-selected="false">最早</li>
              <li role="option" data-sort="featured" aria-selected="false">精选优先</li>
            </ul>
          </div>
          <button type="button" class="work-listing-clear" data-work-listing-clear hidden>清空筛选</button>
        </div>
        <div class="work-listing-tags" data-work-listing-tags role="group" aria-label="标签筛选"></div>
      </div>
    </div>
    <div class="work-listing-status" data-work-listing-status role="status" aria-live="polite"></div>
    <div class="work-listing-grid" data-work-listing-grid></div>
    <div class="work-listing-empty" data-work-listing-empty hidden>
      <p>没有符合条件的作品</p>
      <button type="button" data-work-listing-clear>清空筛选</button>
    </div>
    <div class="work-listing-error" data-work-listing-error hidden>
      <p>作品加载失败，已尝试使用本地内容。</p>
      <button type="button" data-work-listing-retry>重试</button>
    </div>
    <div class="work-listing-more-wrap">
      <button type="button" class="work-listing-more" data-work-listing-more hidden>Load more</button>
    </div>
    <footer class="work-listing-contact">
      <a href="/#contact" data-work-listing-contact>Contact MARVLORE <span aria-hidden="true">↗</span></a>
    </footer>
  </section>`;
}

function renderTags(container, tags, selected) {
  if (!container) return;
  const selectedSet = new Set(selected || []);
  container.innerHTML = (tags || [])
    .slice(0, 16)
    .map((tag) => {
      const slug = tag.slug || tag.id;
      const name = tag.name || slug;
      const pressed = selectedSet.has(slug);
      return `<button type="button" data-work-listing-tag="${escapeHtml(slug)}" aria-pressed="${pressed}">${escapeHtml(name)}</button>`;
    })
    .join('');
}

/**
 * Apply listing SEO title (CSR minimum).
 */
export function applyWorkListingSeo(opts = {}) {
  if (typeof document === 'undefined') return;
  const base =
    (opts.seoTitle && String(opts.seoTitle).trim()) ||
    (opts.title && String(opts.title).trim()) ||
    'Creative Work';
  document.title = /marvlore/i.test(base) ? base : `${base} · MARVLORE`;
}

export function hideWorkListingShell(root) {
  if (!root) return;
  root.hidden = true;
  root.removeAttribute('data-work-channel');
  root.innerHTML = '';
}

/** @deprecated P1 shell — use mountWorkListingPage */
export function renderWorkListingShell(root, opts = {}) {
  if (!root) return null;
  const title = (opts.title && String(opts.title).trim()) || 'Creative Work';
  const introPlain = String(opts.intro || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  root.innerHTML = renderShell({
    title,
    intro: introPlain || '从品牌视觉到动态影像与数字体验，浏览全部已发布作品。',
    categories: [],
  });
  root.hidden = false;
  root.setAttribute('data-work-channel', opts.mode === 'detail-placeholder' ? 'detail-placeholder' : 'list');
  if (opts.mode === 'detail-placeholder') {
    const grid = root.querySelector('[data-work-listing-grid]');
    if (grid) {
      grid.innerHTML = `<div class="work-listing-placeholder" data-work-listing-body>
        <p>作品详情路由已就绪。</p>
        <p class="work-listing-slug">/${escapeHtml(opts.slug || '')}</p>
        <p class="work-listing-note">完整详情视图将在下一阶段接入。</p>
      </div>`;
    }
  }
  return root;
}

/**
 * Mount full listing page into #work-channel.
 * @param {HTMLElement} root
 * @param {{ workPage?: object, categories?: object[], fallbackItems?: object[] }} [opts]
 */
export function mountWorkListingPage(root, opts = {}) {
  if (!root) return { destroy() {} };

  const workPage = opts.workPage || null;
  const title = (workPage?.title && String(workPage.title).trim()) || 'Creative Work';
  const introPlain = String(workPage?.intro || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const intro = introPlain || '从品牌视觉到动态影像与数字体验，浏览全部已发布作品。';
  const categories = opts.categories || [];

  root.innerHTML = renderShell({ title, intro, categories });
  root.hidden = false;
  root.setAttribute('data-work-channel', 'list');
  applyWorkListingSeo({ title, seoTitle: workPage?.seo?.metaTitle });

  const config = getCmsConfig();
  const api = createWorkApi(config);
  const filtersEl = root.querySelector('[data-work-listing-filters]');
  const grid = root.querySelector('[data-work-listing-grid]');
  const emptyEl = root.querySelector('[data-work-listing-empty]');
  const errorEl = root.querySelector('[data-work-listing-error]');
  const statusEl = root.querySelector('[data-work-listing-status]');
  const moreBtn = root.querySelector('[data-work-listing-more]');
  const tagsEl = root.querySelector('[data-work-listing-tags]');

  let state = { ...readWorkFilters(), pageSize: 12 };
  let destroyed = false;
  let requestId = 0;
  let tagCatalog = [];
  /** @type {ReturnType<typeof projectDtoToCard>[]} */
  let accumulated = [];
  let pageCount = 1;
  let total = null;

  const SORT_LABELS = {
    manual: '默认排序',
    latest: '最新',
    oldest: '最早',
    featured: '精选优先',
  };

  const syncSortChrome = () => {
    const sortValue = state.sort || 'manual';
    const label = filtersEl?.querySelector('[data-work-listing-sort-label]');
    const trigger = filtersEl?.querySelector('[data-work-listing-sort-trigger]');
    const menu = filtersEl?.querySelector('[data-work-listing-sort-menu]');
    if (label) label.textContent = SORT_LABELS[sortValue] || SORT_LABELS.manual;
    menu?.querySelectorAll('[data-sort]').forEach((opt) => {
      const selected = opt.getAttribute('data-sort') === sortValue;
      opt.setAttribute('aria-selected', String(selected));
    });
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
  };

  const closeSortMenu = () => {
    const trigger = filtersEl?.querySelector('[data-work-listing-sort-trigger]');
    const menu = filtersEl?.querySelector('[data-work-listing-sort-menu]');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
  };

  const syncChrome = () => {
    const input = filtersEl?.querySelector('input[name="q"]');
    const clearBtns = root.querySelectorAll('[data-work-listing-clear]');
    if (input && input.value !== (state.q || '')) input.value = state.q || '';
    syncSortChrome();
    clearBtns.forEach((btn) => {
      btn.hidden = !hasActiveFilters(state);
    });
    const active = state.subcategory || state.category || 'all';
    root.querySelectorAll('[data-work-listing-category]').forEach((btn) => {
      const id = btn.getAttribute('data-work-listing-category');
      btn.setAttribute('aria-pressed', String(id === active || (active === 'all' && id === 'all')));
    });
    renderTags(tagsEl, tagCatalog, state.tags);
  };

  const paintGrid = ({ append = false } = {}) => {
    if (!grid) return;
    const html = renderProjectCardGrid(accumulated);
    if (append) {
      /* full repaint keeps markup simple and avoids dup keys */
    }
    grid.innerHTML = html;
    const isEmpty = accumulated.length === 0;
    if (emptyEl) emptyEl.hidden = !isEmpty || Boolean(errorEl && !errorEl.hidden);
    if (statusEl) {
      statusEl.textContent = isEmpty
        ? ''
        : total != null
          ? `显示 ${accumulated.length} / ${total}`
          : `显示 ${accumulated.length} 个作品`;
    }
    const canMore =
      total != null ? accumulated.length < total : accumulated.length >= (state.pageSize || 12) * pageCount;
    if (moreBtn) moreBtn.hidden = !canMore || isEmpty;
  };

  const useFallback = (message) => {
    const cards = (opts.fallbackItems || [])
      .map(reelItemToCard)
      .filter(Boolean)
      .filter((card) => {
        const cat = state.subcategory || state.category;
        if (cat && card.categorySlug && card.categorySlug !== cat) return false;
        if (state.q) {
          const q = state.q.toLowerCase();
          const hay = `${card.title} ${card.subtitle} ${card.categoryLabel}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    accumulated = cards;
    pageCount = 1;
    total = cards.length;
    if (errorEl) {
      errorEl.hidden = !message;
      if (message) {
        const p = errorEl.querySelector('p');
        if (p) p.textContent = message;
      }
    }
    paintGrid();
  };

  async function runSearch({ append = false } = {}) {
    const id = ++requestId;
    if (!append) {
      accumulated = [];
      pageCount = state.page || 1;
    }
    if (statusEl) statusEl.textContent = append ? '加载更多…' : '加载中…';
    if (errorEl) errorEl.hidden = true;

    if (!config.enabled || !config.useList) {
      useFallback('');
      return;
    }

    try {
      const query = toSearchQuery(
        { ...state, page: append ? pageCount : state.page || 1, pageSize: state.pageSize || 12 },
        config.locale,
      );
      const res = await api.search(query);
      if (destroyed || id !== requestId) return;
      const rows = res?.data || [];
      const cards = rows.map(projectDtoToCard).filter(Boolean);
      const meta = res?.meta || {};
      total = meta.total ?? meta.pagination?.total ?? null;
      if (append) accumulated = accumulated.concat(cards);
      else accumulated = cards;
      if (!append) pageCount = state.page || 1;
      paintGrid({ append });
      if (!accumulated.length && hasActiveFilters(state)) {
        if (emptyEl) emptyEl.hidden = false;
      }
    } catch (err) {
      if (destroyed || id !== requestId) return;
      console.warn('[work-listing] search failed:', err?.message || err);
      useFallback('作品加载失败，已显示本地内容。');
    }
  }

  function commit(next, { replace = true, append = false } = {}) {
    state = { ...next, pageSize: next.pageSize || 12 };
    writeWorkFilters(state, { replace });
    syncChrome();
    if (!append) runSearch({ append: false });
  }

  const debouncedQuery = debounce((q) => {
    commit({ ...state, q, page: 1 }, { replace: true });
  }, DEBOUNCE_MS);

  // Hide tags that merely echo level-2 category names/slugs (already in the category row).
  const categoryEcho = new Set(
    level2Categories(categories).flatMap((c) =>
      [c.id, c.label].filter(Boolean).map((v) => String(v).trim().toLowerCase()),
    ),
  );

  api
    .getTags()
    .then((res) => {
      if (destroyed) return;
      tagCatalog = (res?.data || []).filter((tag) => {
        const slug = String(tag.slug || tag.id || '')
          .trim()
          .toLowerCase();
        const name = String(tag.name || '')
          .trim()
          .toLowerCase();
        if (!slug && !name) return false;
        if (categoryEcho.has(slug) || categoryEcho.has(name)) return false;
        return true;
      });
      renderTags(tagsEl, tagCatalog, state.tags);
    })
    .catch(() => {});

  filtersEl?.querySelector('input[name="q"]')?.addEventListener('input', (event) => {
    debouncedQuery(event.target.value.trim());
  });

  const onDocClickCloseSort = (event) => {
    if (!filtersEl?.querySelector('[data-work-listing-sort]')?.contains(event.target)) {
      closeSortMenu();
    }
  };
  document.addEventListener('click', onDocClickCloseSort);

  root.addEventListener('click', (event) => {
    const sortTrigger = event.target.closest('[data-work-listing-sort-trigger]');
    if (sortTrigger) {
      event.stopPropagation();
      const menu = filtersEl?.querySelector('[data-work-listing-sort-menu]');
      const nextOpen = Boolean(menu?.hidden);
      sortTrigger.setAttribute('aria-expanded', String(nextOpen));
      if (menu) menu.hidden = !nextOpen;
      return;
    }
    const sortOpt = event.target.closest('[data-work-listing-sort-menu] [data-sort]');
    if (sortOpt) {
      event.stopPropagation();
      const value = sortOpt.getAttribute('data-sort') || 'manual';
      closeSortMenu();
      commit({ ...state, sort: value, page: 1 }, { replace: false });
      return;
    }
    const catBtn = event.target.closest('[data-work-listing-category]');
    if (catBtn) {
      const id = catBtn.getAttribute('data-work-listing-category');
      commit(
        {
          ...state,
          subcategory: id && id !== 'all' ? id : '',
          category: '',
          page: 1,
        },
        { replace: true },
      );
      return;
    }
    const tagBtn = event.target.closest('[data-work-listing-tag]');
    if (tagBtn) {
      const slug = tagBtn.getAttribute('data-work-listing-tag');
      const set = new Set(state.tags || []);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      commit({ ...state, tags: [...set], page: 1 }, { replace: false });
      return;
    }
    if (event.target.closest('[data-work-listing-clear]')) {
      commit(emptyWorkFilters(), { replace: false });
      return;
    }
    if (event.target.closest('[data-work-listing-retry]')) {
      runSearch({ append: false });
      return;
    }
    if (event.target.closest('[data-work-listing-more]')) {
      pageCount += 1;
      const next = { ...state, page: pageCount };
      state = next;
      writeWorkFilters(state, { replace: true });
      runSearch({ append: true });
    }
  });

  const onPopState = () => {
    const next = { ...readWorkFilters(), pageSize: 12 };
    if (filtersEqual(state, next)) return;
    state = next;
    syncChrome();
    runSearch({ append: false });
  };
  window.addEventListener('popstate', onPopState);

  syncChrome();
  runSearch({ append: false });

  return {
    getState: () => ({ ...state, tags: [...(state.tags || [])] }),
    reload: () => runSearch({ append: false }),
    destroy() {
      destroyed = true;
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('click', onDocClickCloseSort);
    },
  };
}
