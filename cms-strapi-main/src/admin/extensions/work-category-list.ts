/**
 * Work list UX:
 * - Hide i18n "Available In" column
 * - Reuse the locale switcher DOM slot (do not restyle page ancestors)
 * - Category <select> filters via categoryNameCn
 */
const WORK_UID = 'api::work-project.work-project';
const STYLE_ID = 'marvlore-work-category-list-style';
const ROOT_ID = 'marvlore-work-category-switch';
const SELECT_ID = 'marvlore-work-category-select';

type CategoryChip = { documentId: string; label: string; slug?: string };

let cachedCategories: CategoryChip[] | null = null;
let ticking = false;
let paused = false;

function isWorkListPath(pathname: string) {
  return (
    pathname.includes(`/content-manager/collection-types/${WORK_UID}`) &&
    !/\/api::work-project\.work-project\/[^/?#]+/.test(pathname)
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
    /* Hide original locale control children, keep the slot box for layout */
    body[data-marvlore-work-list="1"] [data-marvlore-locale-original="1"] {
      display: none !important;
    }
    body[data-marvlore-work-list="1"] [data-marvlore-locale-portal="1"] {
      display: none !important;
    }
    #${ROOT_ID} {
      display: inline-flex;
      align-items: center;
      margin: 0;
      padding: 0;
      vertical-align: middle;
    }
    #${SELECT_ID} {
      min-width: 148px;
      max-width: 200px;
      height: 32px;
      border-radius: 4px;
      border: 1px solid #dcdce4;
      background-color: #fff;
      color: #32324d;
      padding: 0 28px 0 12px;
      font-size: 14px;
      line-height: 32px;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238e8ea9' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      pointer-events: auto;
      box-sizing: border-box;
    }
    #${SELECT_ID}:focus {
      outline: 2px solid #4945ff;
      outline-offset: 1px;
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
    // ignore
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
  const res = await fetch(
    '/content-manager/collection-types/api::work-category.work-category?pageSize=50&locale=zh-CN&sort=sortOrder:ASC',
    { headers: { Authorization: `Bearer ${token}` } }
  );
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

function currentCategoryLabel(): string | null {
  const params = new URLSearchParams(window.location.search);
  const label = params.get('marvloreCategoryLabel');
  if (label) return label;
  for (const [key, value] of params.entries()) {
    if (key.includes('categoryNameCn') && key.includes('$eq')) return value;
  }
  return null;
}

function applyCategoryFilter(label: string | null) {
  const path = `/admin/content-manager/collection-types/${WORK_UID}`;
  const params = new URLSearchParams();
  params.set('page', '1');
  params.set('pageSize', '50');
  params.set('sort', 'title:ASC');
  params.set('plugins[i18n][locale]', 'zh-CN');
  if (label) {
    params.set('marvloreCategoryLabel', label);
    params.set('filters[$and][0][categoryNameCn][$eq]', label);
  }
  paused = true;
  window.location.href = `${path}?${params.toString()}`;
}

function isLocaleText(text: string) {
  return /Chinese\s*\(zh-CN\)|English\s*\(en\)|\bzh-CN\b/.test(text);
}

function findCreateButton(): HTMLElement | null {
  return (
    ([...document.querySelectorAll('main button, main a')].find((el) =>
      /Create new entry|创建新|创建条目/i.test(el.textContent || '')
    ) as HTMLElement | undefined) || null
  );
}

/**
 * Find the compact locale field wrapper (globe + combobox).
 * Do NOT climb to page layout ancestors.
 */
function findLocaleSlot(): HTMLElement | null {
  const createBtn = findCreateButton();
  const nodes = [
    ...document.querySelectorAll(
      'main button, main [role="combobox"], main select, main [aria-haspopup="listbox"]'
    ),
  ] as HTMLElement[];

  let localeControl: HTMLElement | null = null;
  for (const el of nodes) {
    if (el.id === SELECT_ID || el.closest(`#${ROOT_ID}`)) continue;
    const text = (el.textContent || el.getAttribute('aria-label') || '').trim();
    if (isLocaleText(text)) {
      localeControl = el;
      break;
    }
  }
  if (!localeControl) return null;

  let slot: HTMLElement = localeControl;
  for (let i = 0; i < 4; i += 1) {
    const parent = slot.parentElement as HTMLElement | null;
    if (!parent || parent === document.body || parent.tagName === 'MAIN' || parent.tagName === 'HEADER') {
      break;
    }
    // Never take a parent that also wraps Create — that is page chrome
    if (createBtn && parent.contains(createBtn)) break;
    // Stay on a tight field wrapper (globe + control)
    if (parent.childElementCount <= 3 && parent.offsetWidth < 360) {
      slot = parent;
      continue;
    }
    break;
  }
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

function ensureSelectBuilt(categories: CategoryChip[]) {
  let root = document.getElementById(ROOT_ID) as HTMLElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.setAttribute('data-marvlore-category-switch', '1');
  }

  let select = document.getElementById(SELECT_ID) as HTMLSelectElement | null;
  if (!select) {
    select = document.createElement('select');
    select.id = SELECT_ID;
    select.setAttribute('aria-label', '所属分类');
    root.appendChild(select);

    select.addEventListener('mousedown', () => {
      paused = true;
    });
    select.addEventListener('focus', () => {
      paused = true;
    });
    select.addEventListener('blur', () => {
      window.setTimeout(() => {
        paused = false;
      }, 300);
    });
    select.addEventListener('change', () => {
      const opt = select!.selectedOptions[0];
      applyCategoryFilter(opt?.value || null);
    });
  }

  const optionKey = categories.map((c) => c.label).join('|');
  if (select.dataset.optionKey !== optionKey) {
    select.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = '全部';
    select.appendChild(allOpt);
    for (const cat of categories) {
      const opt = document.createElement('option');
      opt.value = cat.label;
      opt.textContent = cat.label;
      select.appendChild(opt);
    }
    select.dataset.optionKey = optionKey;
  }

  select.value = currentCategoryLabel() || '';
  return root;
}

/**
 * Put the select inside the original locale slot (same layout box).
 * Never change flex/display on page ancestors — that broke the list layout.
 */
function placeSelectInLocaleSlot(root: HTMLElement, localeSlot: HTMLElement | null, createBtn: HTMLElement | null) {
  if (localeSlot) {
    // Hide original locale UI children, keep slot for spacing/alignment
    [...localeSlot.children].forEach((child) => {
      if ((child as HTMLElement).id === ROOT_ID) return;
      (child as HTMLElement).setAttribute('data-marvlore-locale-original', '1');
    });
    if (root.parentElement !== localeSlot) {
      localeSlot.appendChild(root);
    }
    return;
  }

  // Fallback: sit immediately before Create, without restyling parents
  if (createBtn?.parentElement) {
    if (root.parentElement !== createBtn.parentElement || root.nextElementSibling !== createBtn) {
      createBtn.parentElement.insertBefore(root, createBtn);
    }
  }
}

function hideAvailableInColumn() {
  document.querySelectorAll('main table').forEach((table) => {
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

function filterTableClientSide() {
  const label = currentCategoryLabel();
  const table = document.querySelector('main table');
  if (!table) return;
  const ths = [...table.querySelectorAll('thead th')];
  const catIdx = ths.findIndex((th) => /所属分类|categoryNameCn/i.test(th.textContent || ''));
  if (catIdx < 0) return;
  table.querySelectorAll('tbody tr').forEach((tr) => {
    const cell = tr.children[catIdx] as HTMLElement | undefined;
    const text = (cell?.textContent || '').trim();
    (tr as HTMLElement).style.display = !label || text === label ? '' : 'none';
  });
}

async function refresh() {
  if (paused) return;
  const onList = isWorkListPath(window.location.pathname);
  document.body.dataset.marvloreWorkList = onList ? '1' : '0';
  if (!onList) {
    document.getElementById(ROOT_ID)?.remove();
    return;
  }

  ensureStyle();
  hideAvailableInColumn();
  hideLocalePortals();

  const localeSlot = findLocaleSlot();
  const createBtn = findCreateButton();

  if (!cachedCategories) {
    cachedCategories = await fetchLevel2Categories();
  }
  if (!cachedCategories.length) return;

  const root = ensureSelectBuilt(cachedCategories);
  placeSelectInLocaleSlot(root, localeSlot, createBtn);
  hideLocalePortals();
  filterTableClientSide();
  hideAvailableInColumn();
}

function scheduleRefresh() {
  if (paused || ticking) return;
  ticking = true;
  window.setTimeout(() => {
    ticking = false;
    void refresh();
  }, 80);
}

export function installWorkCategoryListUx() {
  if (typeof window === 'undefined') return;
  ensureStyle();
  scheduleRefresh();
  const obs = new MutationObserver(() => scheduleRefresh());
  obs.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleRefresh);
}
