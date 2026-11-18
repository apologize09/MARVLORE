/**
 * Work list UX:
 * - Hide i18n "Available In" column (replaced by 所属分类 / categoryNameCn)
 * - Replace the locale switcher affordance with Chinese category filter chips
 */
const WORK_UID = 'api::work-project.work-project';
const STYLE_ID = 'marvlore-work-category-list-style';
const ROOT_ID = 'marvlore-work-category-switch';

type CategoryChip = { documentId: string; label: string; slug?: string };

function isWorkListPath(pathname: string) {
  return pathname.includes(`/content-manager/collection-types/${WORK_UID}`);
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Hide Available In on Work list — replaced by 所属分类 */
    body[data-marvlore-work-list="1"] thead th,
    body[data-marvlore-work-list="1"] tbody td {
      /* JS also blanks matching cells; this catches slow paints */
    }
    body[data-marvlore-work-list="1"] [data-marvlore-hide-available="1"] {
      display: none !important;
    }
    /* Soft-hide locale select on Work list; category chips take its place */
    body[data-marvlore-work-list="1"] [data-marvlore-locale-slot] select,
    body[data-marvlore-work-list="1"] [data-marvlore-locale-slot] button[aria-haspopup="listbox"] {
      visibility: hidden;
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
    #${ROOT_ID} {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin: 0 0 12px;
    }
    #${ROOT_ID} .marvlore-cat-label {
      font-size: 12px;
      opacity: 0.7;
      margin-right: 4px;
      white-space: nowrap;
    }
    #${ROOT_ID} button {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.04);
      color: inherit;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      line-height: 1.2;
    }
    #${ROOT_ID} button[data-active="1"] {
      background: rgba(174, 255, 0, 0.16);
      border-color: rgba(174, 255, 0, 0.55);
      color: #d9ff66;
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
    // fall through to cookie
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
  // Support both flat and nested filter encodings used by CM
  for (const [key, value] of params.entries()) {
    if (
      key.includes('category') &&
      (key.includes('documentId') || key.includes('categoryNameCn')) &&
      key.includes('$eq')
    ) {
      return value;
    }
  }
  // Also accept our compact query flag
  return params.get('marvloreCategory') || null;
}

function navigateCategory(documentId: string | null, label: string | null) {
  const url = new URL(window.location.href);
  // Drop previous category filters / our flag
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
  url.searchParams.set('page', '1');
  if (documentId && label) {
    url.searchParams.set('marvloreCategory', documentId);
    url.searchParams.set('marvloreCategoryLabel', label);
    // Strapi 5 CM filter query (array form)
    url.searchParams.set('filters[$and][0][category][documentId][$eq]', documentId);
  }
  window.location.assign(url.toString());
}

function mountChips(categories: CategoryChip[]) {
  const headers = document.querySelectorAll('main header, main [class*="Header"], main form');
  let anchor: Element | null = null;
  for (const el of headers) {
    if (el.querySelector('button') || el.textContent?.includes('Create') || el.textContent?.includes('创建')) {
      anchor = el;
      break;
    }
  }
  if (!anchor) {
    anchor = document.querySelector('main') || document.body;
  }

  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('data-marvlore-category-switch', '1');
    // Insert just below the page header actions
    if (anchor.parentElement) {
      anchor.parentElement.insertBefore(root, anchor.nextSibling);
    } else {
      anchor.prepend(root);
    }
  }

  const active = currentCategoryFilter();
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
    btn.dataset.active = active === cat.documentId || active === cat.label ? '1' : '0';
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

function markLocaleSlot() {
  // Heuristic: the locale combobox near Create new entry
  const candidates = document.querySelectorAll('main button, main select');
  for (const el of candidates) {
    const text = (el.textContent || '').trim();
    if (/zh-CN|Chinese|English|en\b|中文|locale/i.test(text)) {
      const slot = el.closest('div') || el.parentElement;
      slot?.setAttribute('data-marvlore-locale-slot', '1');
    }
  }
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
  markLocaleSlot();
  if (!cachedCategories) {
    cachedCategories = await fetchLevel2Categories();
  }
  if (cachedCategories.length) mountChips(cachedCategories);
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
