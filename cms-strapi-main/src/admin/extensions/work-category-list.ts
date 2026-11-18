/**
 * Work list UX:
 * - Hide i18n "Available In" column (replaced by 所属分类 / categoryNameCn)
 * - Replace the top-right locale switcher with a Chinese category filter select
 */
const WORK_UID = 'api::work-project.work-project';
const STYLE_ID = 'marvlore-work-category-list-style';
const ROOT_ID = 'marvlore-work-category-switch';
const SELECT_ID = 'marvlore-work-category-select';

type CategoryChip = { documentId: string; label: string; slug?: string };

function isWorkListPath(pathname: string) {
  return (
    pathname.includes(`/content-manager/collection-types/${WORK_UID}`) &&
    !pathname.includes(`${WORK_UID}/`)
  );
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    body[data-marvlore-work-list="1"] [data-marvlore-hide-available="1"] {
      display: none !important;
    }
    /* Fully hide Strapi i18n locale controls on Work list */
    body[data-marvlore-work-list="1"] [data-marvlore-locale-slot="1"],
    body[data-marvlore-work-list="1"] [data-marvlore-locale-slot="1"] * {
      display: none !important;
    }
    /* Hide open locale listbox portals while on Work list */
    body[data-marvlore-work-list="1"] [data-radix-popper-content-wrapper],
    body[data-marvlore-work-list="1"] [role="listbox"] {
      /* only when they look like locale menus — refined in JS */
    }
    body[data-marvlore-work-list="1"] [data-marvlore-locale-portal="1"] {
      display: none !important;
    }
    #${ROOT_ID} {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-right: 8px;
    }
    #${ROOT_ID} .marvlore-cat-label {
      font-size: 12px;
      opacity: 0.72;
      white-space: nowrap;
    }
    #${SELECT_ID} {
      min-width: 168px;
      height: 32px;
      border-radius: 4px;
      border: 1px solid #dcdce4;
      background: #fff;
      color: #32324d;
      padding: 0 28px 0 12px;
      font-size: 14px;
      line-height: 32px;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238e8ea9' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
    }
    /* Keep the older chip row as a fallback below header if select can't mount */
    #${ROOT_ID}[data-mode="chips"] {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      margin: 0 0 12px;
    }
    #${ROOT_ID}[data-mode="chips"] button {
      appearance: none;
      border: 1px solid #dcdce4;
      background: #fff;
      color: #32324d;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      line-height: 1.2;
    }
    #${ROOT_ID}[data-mode="chips"] button[data-active="1"] {
      background: #f0f0ff;
      border-color: #7b79ff;
      color: #4945ff;
    }
  `;
  document.head.appendChild(style);
}

function getToken(): string | null {
  try {
    const raw = window.localStorage.getItem('jwtToken');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string' && parsed) return parsed;
    }
  } catch {
    // fall through
  }
  try {
    const match = document.cookie.match(/(?:^|; )jwtToken=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

async function fetchLevel2Categories(): Promise<CategoryChip[]> {
  const token = getToken();
  if (!token) return [];
  const url =
    '/content-manager/collection-types/api::work-category.work-category' +
    '?pageSize=50&locale=zh-CN&sort=sortOrder:ASC';
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = await res.json();
  const rows = (json.results || json.data || []) as Array<{
    documentId?: string;
    name?: string;
    nameCn?: string | null;
    level?: number;
    slug?: string;
  }>;
  return rows
    .filter((r) => Number(r.level) === 2 && r.documentId)
    .map((r) => ({
      documentId: r.documentId as string,
      label: (r.nameCn && String(r.nameCn).trim()) || r.name || r.slug || r.documentId!,
      slug: r.slug,
    }));
}

function currentCategoryFilter(): string | null {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of params.entries()) {
    if (
      key.includes('category') &&
      (key.includes('documentId') || key.includes('categoryNameCn')) &&
      key.includes('$eq')
    ) {
      return value;
    }
  }
  return params.get('marvloreCategory') || null;
}

function navigateCategory(documentId: string | null, label: string | null) {
  const url = new URL(window.location.href);
  const keys = [...url.searchParams.keys()];
  for (const key of keys) {
    if (
      key === 'marvloreCategory' ||
      key === 'marvloreCategoryLabel' ||
      (key.includes('filters') && key.includes('category'))
    ) {
      url.searchParams.delete(key);
    }
  }
  // Keep locale locked to zh-CN for this list UX
  if (!url.searchParams.get('plugins[i18n][locale]')) {
    url.searchParams.set('plugins[i18n][locale]', 'zh-CN');
  }
  url.searchParams.set('page', '1');
  if (documentId && label) {
    url.searchParams.set('marvloreCategory', documentId);
    url.searchParams.set('marvloreCategoryLabel', label);
    url.searchParams.set('filters[$and][0][categoryNameCn][$eq]', label);
  }
  window.location.assign(url.toString());
}

function isLocaleText(text: string) {
  return /Chinese\s*\(zh-CN\)|English\s*\(en\)|zh-CN|locale/i.test(text);
}

/** Find and hard-hide the Strapi i18n locale combobox near Create new entry. */
function hideLocaleSwitcher(): HTMLElement | null {
  const createBtn = [...document.querySelectorAll('main button, main a')].find((el) =>
    /Create new entry|创建新|创建条目/i.test(el.textContent || '')
  );
  const scope = (createBtn?.closest('header, [class*="Header"], div') as HTMLElement) ||
    (document.querySelector('main') as HTMLElement | null);
  if (!scope) return null;

  const candidates = [
    ...scope.querySelectorAll('button, [role="combobox"], select, [aria-haspopup="listbox"]'),
  ] as HTMLElement[];

  let localeControl: HTMLElement | null = null;
  for (const el of candidates) {
    const text = (el.textContent || el.getAttribute('aria-label') || '').trim();
    if (isLocaleText(text)) {
      localeControl = el;
      break;
    }
  }
  if (!localeControl) {
    // Broader search in main header area
    for (const el of document.querySelectorAll('main button, main [role="combobox"]')) {
      const text = (el.textContent || '').trim();
      if (isLocaleText(text)) {
        localeControl = el as HTMLElement;
        break;
      }
    }
  }
  if (!localeControl) return null;

  // Climb to a compact wrapper that sits beside Create (avoid hiding whole header)
  let slot: HTMLElement = localeControl;
  for (let i = 0; i < 5; i += 1) {
    const parent = slot.parentElement as HTMLElement | null;
    if (!parent || parent === document.body || parent.tagName === 'MAIN') break;
    const parentText = parent.textContent || '';
    // Stop before wrapping Create new entry
    if (/Create new entry|创建新|创建条目/i.test(parentText) && parent.contains(createBtn || null)) {
      break;
    }
    // Prefer a wrapper that only contains the locale control (+ maybe icon)
    if (parent.childElementCount <= 3) {
      slot = parent;
    } else {
      break;
    }
  }

  slot.setAttribute('data-marvlore-locale-slot', '1');
  return slot;
}

function hideLocalePortals() {
  document.querySelectorAll('[role="listbox"], [data-radix-popper-content-wrapper]').forEach((node) => {
    const text = (node.textContent || '').trim();
    if (/Chinese\s*\(zh-CN\)/.test(text) && /English\s*\(en\)/.test(text)) {
      (node as HTMLElement).setAttribute('data-marvlore-locale-portal', '1');
    }
  });
}

function findHeaderActionsRow(): HTMLElement | null {
  const createBtn = [...document.querySelectorAll('main button, main a')].find((el) =>
    /Create new entry|创建新|创建条目/i.test(el.textContent || '')
  );
  if (!createBtn) return null;
  return (createBtn.parentElement as HTMLElement) || null;
}

function mountCategorySelect(categories: CategoryChip[], localeSlot: HTMLElement | null) {
  const actions = findHeaderActionsRow();
  let root = document.getElementById(ROOT_ID) as HTMLElement | null;

  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('data-marvlore-category-switch', '1');
  }

  // Prefer inserting where the locale switcher was (before Create)
  if (actions && root.parentElement !== actions) {
    if (localeSlot && localeSlot.parentElement === actions) {
      actions.insertBefore(root, localeSlot);
    } else if (localeSlot?.parentElement) {
      localeSlot.parentElement.insertBefore(root, localeSlot);
    } else {
      const createBtn = [...actions.querySelectorAll('button, a')].find((el) =>
        /Create new entry|创建新|创建条目/i.test(el.textContent || '')
      );
      if (createBtn) actions.insertBefore(root, createBtn);
      else actions.appendChild(root);
    }
  } else if (!actions && !root.parentElement) {
    const main = document.querySelector('main');
    main?.prepend(root);
  }

  root.dataset.mode = actions ? 'select' : 'chips';
  const active = currentCategoryFilter();
  const activeLabel = new URLSearchParams(window.location.search).get('marvloreCategoryLabel');

  if (root.dataset.mode === 'select') {
    root.innerHTML = '';
    const label = document.createElement('span');
    label.className = 'marvlore-cat-label';
    label.textContent = '分类中文';
    root.appendChild(label);

    const select = document.createElement('select');
    select.id = SELECT_ID;
    select.setAttribute('aria-label', '所属分类中文筛选');

    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = '全部';
    select.appendChild(allOpt);

    for (const cat of categories) {
      const opt = document.createElement('option');
      opt.value = cat.documentId;
      opt.textContent = cat.label;
      opt.dataset.label = cat.label;
      if (active === cat.documentId || active === cat.label || activeLabel === cat.label) {
        opt.selected = true;
      }
      select.appendChild(opt);
    }
    if (!active) allOpt.selected = true;

    select.addEventListener('change', () => {
      const opt = select.selectedOptions[0];
      if (!opt || !opt.value) navigateCategory(null, null);
      else navigateCategory(opt.value, opt.dataset.label || opt.textContent || '');
    });
    root.appendChild(select);
    return;
  }

  // Fallback chips
  root.innerHTML = '';
  const label = document.createElement('span');
  label.className = 'marvlore-cat-label';
  label.textContent = '所属分类';
  root.appendChild(label);

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.textContent = '全部';
  allBtn.dataset.active = !active ? '1' : '0';
  allBtn.addEventListener('click', () => navigateCategory(null, null));
  root.appendChild(allBtn);

  for (const cat of categories) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = cat.label;
    btn.dataset.active =
      active === cat.documentId || active === cat.label || activeLabel === cat.label ? '1' : '0';
    btn.addEventListener('click', () => navigateCategory(cat.documentId, cat.label));
    root.appendChild(btn);
  }
}

function hideAvailableInColumn() {
  const tables = document.querySelectorAll('main table');
  tables.forEach((table) => {
    const ths = [...table.querySelectorAll('thead th')];
    const idx = ths.findIndex((th) => /available\s*in|可用|语言/i.test(th.textContent || ''));
    if (idx < 0) return;
    ths[idx].setAttribute('data-marvlore-hide-available', '1');
    table.querySelectorAll('tbody tr').forEach((tr) => {
      const cell = tr.children[idx] as HTMLElement | undefined;
      if (cell) cell.setAttribute('data-marvlore-hide-available', '1');
    });
  });
}

let cachedCategories: CategoryChip[] | null = null;
let ticking = false;

async function refresh() {
  const onList = isWorkListPath(window.location.pathname);
  document.body.dataset.marvloreWorkList = onList ? '1' : '0';
  if (!onList) {
    document.getElementById(ROOT_ID)?.remove();
    return;
  }
  ensureStyle();
  hideAvailableInColumn();
  const localeSlot = hideLocaleSwitcher();
  hideLocalePortals();
  if (!cachedCategories) {
    cachedCategories = await fetchLevel2Categories();
  }
  if (cachedCategories.length) {
    mountCategorySelect(cachedCategories, localeSlot);
    // Re-hide after mount in case React re-rendered the locale control
    hideLocaleSwitcher();
    hideLocalePortals();
  }
  hideAvailableInColumn();
}

function scheduleRefresh() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    void refresh();
  });
}

export function installWorkCategoryListUx() {
  if (typeof window === 'undefined') return;
  ensureStyle();
  scheduleRefresh();
  const obs = new MutationObserver(() => scheduleRefresh());
  obs.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleRefresh);
}
