/**
 * Work list UX:
 * - Replace locale switcher slot with Chinese category <select>
 * - Switching category updates the table via CM API (no full page refresh)
 */
const WORK_UID = 'api::work-project.work-project';
const STYLE_ID = 'marvlore-work-category-list-style';
const ROOT_ID = 'marvlore-work-category-switch';
const SELECT_ID = 'marvlore-work-category-select';

type CategoryChip = { documentId: string; label: string; slug?: string };
type ProjectRow = {
  id: number | string;
  documentId: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  categoryNameCn?: string | null;
  status?: string;
};

let cachedCategories: CategoryChip[] | null = null;
let cachedProjects: ProjectRow[] | null = null;
let rowTemplateHtml: string | null = null;
let headerIndexes: { id: number; title: number; slug: number; subtitle: number; category: number; status: number } | null =
  null;
let ticking = false;
let paused = false;
let softFilterLabel: string | null | undefined = undefined; // undefined = follow URL; null = 全部

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
    body[data-marvlore-work-list="1"] [data-marvlore-locale-original="1"] {
      display: none !important;
    }
    body[data-marvlore-work-list="1"] [data-marvlore-locale-portal="1"] {
      display: none !important;
    }
    body[data-marvlore-work-list="1"] [data-marvlore-hide-filter-chip="1"] {
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
    #${SELECT_ID}:disabled {
      opacity: 0.6;
      cursor: wait;
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

async function fetchAllProjects(): Promise<ProjectRow[]> {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(
    `/content-manager/collection-types/${WORK_UID}?locale=zh-CN&pageSize=100&page=1&sort=title:ASC`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  const rows = (json.results || []) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: (r.id as number) ?? '',
    documentId: String(r.documentId || ''),
    title: String(r.title || ''),
    slug: String(r.slug || ''),
    subtitle: (r.subtitle as string) || '',
    categoryNameCn: (r.categoryNameCn as string) || '',
    status: r.status ? String(r.status) : r.publishedAt ? 'published' : 'draft',
  }));
}

function activeCategoryLabel(): string | null {
  if (softFilterLabel !== undefined) return softFilterLabel;
  const params = new URLSearchParams(window.location.search);
  const label = params.get('marvloreCategoryLabel');
  if (label) return label;
  for (const [key, value] of params.entries()) {
    if (key.includes('categoryNameCn') && key.includes('$eq')) return value;
  }
  return null;
}

function syncUrlWithoutReload(label: string | null) {
  const url = new URL(window.location.href);
  // Drop Strapi filter query keys so CM chips don't reappear / force reload semantics
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('filters') || key === 'marvloreCategoryLabel' || key === 'marvloreCategory') {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.set('page', '1');
  url.searchParams.set('plugins[i18n][locale]', 'zh-CN');
  if (label) url.searchParams.set('marvloreCategoryLabel', label);
  window.history.replaceState(window.history.state, '', url.toString());
}

function hideStrapiCategoryFilterChips() {
  // Hide CM filter tags like "所属分类 等于 影视动画"
  document.querySelectorAll('main button, main [class*="Tag"], main [class*="chip"]').forEach((el) => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (/所属分类/.test(text) && /等于|=/.test(text) && text.length < 40) {
      (el as HTMLElement).setAttribute('data-marvlore-hide-filter-chip', '1');
      const wrap = el.parentElement;
      if (wrap && (wrap.childElementCount <= 2 || /所属分类/.test(wrap.textContent || ''))) {
        wrap.setAttribute('data-marvlore-hide-filter-chip', '1');
      }
    }
  });
}

function captureRowTemplate() {
  const table = document.querySelector('main table');
  const tbody = table?.querySelector('tbody');
  const first = tbody?.querySelector('tr');
  if (!table || !first) return false;

  const ths = [...table.querySelectorAll('thead th')];
  const find = (re: RegExp) => ths.findIndex((th) => re.test(th.textContent || ''));
  headerIndexes = {
    id: find(/^id$/i),
    title: find(/标题|title/i),
    slug: find(/slug/i),
    subtitle: find(/副标题|subtitle/i),
    category: find(/所属分类|categoryNameCn/i),
    status: find(/status|状态/i),
  };
  rowTemplateHtml = first.outerHTML;
  return true;
}

function editHref(documentId: string) {
  return `/admin/content-manager/collection-types/${WORK_UID}/${documentId}?plugins[i18n][locale]=zh-CN`;
}

function buildRow(project: ProjectRow): HTMLTableRowElement {
  const wrap = document.createElement('tbody');
  wrap.innerHTML = rowTemplateHtml || '<tr></tr>';
  const tr = wrap.querySelector('tr') as HTMLTableRowElement;

  const setCell = (idx: number, value: string) => {
    if (idx < 0) return;
    const cell = tr.children[idx] as HTMLElement | undefined;
    if (!cell) return;
    const link = cell.querySelector('a');
    if (link) {
      link.textContent = value;
      link.setAttribute('href', editHref(project.documentId));
    } else {
      // Prefer updating innermost text node container
      const textEl =
        cell.querySelector('span, p, div') ||
        ([...cell.querySelectorAll('*')].find((n) => (n.textContent || '').trim().length > 0) as
          | HTMLElement
          | undefined);
      if (textEl && textEl.children.length === 0) textEl.textContent = value;
      else cell.childNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim()) n.textContent = value;
      });
      if (!textEl && !cell.querySelector('*')) cell.textContent = value;
    }
  };

  if (headerIndexes) {
    setCell(headerIndexes.id, String(project.id));
    setCell(headerIndexes.title, project.title);
    setCell(headerIndexes.slug, project.slug);
    setCell(headerIndexes.subtitle, project.subtitle || '');
    setCell(headerIndexes.category, project.categoryNameCn || '');
    if (headerIndexes.status >= 0) {
      const cell = tr.children[headerIndexes.status] as HTMLElement | undefined;
      const label = cell?.querySelector('span, div, button') as HTMLElement | null;
      if (label) {
        const published = String(project.status).toLowerCase() === 'published' || !!project.status;
        // Keep badge chrome; only tweak text when clearly draft/published
        if (/publish|draft|发布|草稿/i.test(label.textContent || '')) {
          label.textContent = published ? 'Published' : 'Draft';
        }
      }
    }
  }

  tr.querySelectorAll('a').forEach((a) => {
    a.setAttribute('href', editHref(project.documentId));
  });

  return tr;
}

function updateEntriesFound(count: number) {
  const nodes = document.querySelectorAll('main *');
  for (const el of nodes) {
    if (el.children.length > 0) continue;
    const text = (el.textContent || '').trim();
    if (/^\d+\s+entr(y|ies)\s+found$/i.test(text) || /^\d+\s*条/.test(text)) {
      el.textContent = `${count} ${count === 1 ? 'entry' : 'entries'} found`;
      return;
    }
  }
}

function renderSoftTable(label: string | null) {
  if (!cachedProjects || !rowTemplateHtml) return;
  const table = document.querySelector('main table');
  const tbody = table?.querySelector('tbody');
  if (!tbody) return;

  const rows = label
    ? cachedProjects.filter((p) => (p.categoryNameCn || '') === label)
    : cachedProjects;

  const frag = document.createDocumentFragment();
  for (const project of rows) {
    frag.appendChild(buildRow(project));
  }
  tbody.replaceChildren(frag);
  updateEntriesFound(rows.length);

  // Soft filter shows all matches on one page — hide pagination noise
  document.querySelectorAll('main nav, main [aria-label*="pagination" i], main [class*="Pagination"]').forEach((el) => {
    if (label) (el as HTMLElement).style.visibility = 'hidden';
    else (el as HTMLElement).style.visibility = '';
  });
}

async function applyCategoryFilterSoft(label: string | null) {
  const select = document.getElementById(SELECT_ID) as HTMLSelectElement | null;
  if (select) select.disabled = true;
  paused = true;
  try {
    if (!cachedProjects) cachedProjects = await fetchAllProjects();
    if (!rowTemplateHtml) captureRowTemplate();
    softFilterLabel = label;
    syncUrlWithoutReload(label);
    hideStrapiCategoryFilterChips();
    renderSoftTable(label);
    if (select) select.value = label || '';
  } finally {
    if (select) select.disabled = false;
    window.setTimeout(() => {
      paused = false;
    }, 200);
  }
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
    if (!parent || parent === document.body || parent.tagName === 'MAIN' || parent.tagName === 'HEADER') break;
    if (createBtn && parent.contains(createBtn)) break;
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
      void applyCategoryFilterSoft(opt?.value || null);
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

  select.value = activeCategoryLabel() || '';
  return root;
}

function placeSelectInLocaleSlot(root: HTMLElement, localeSlot: HTMLElement | null, createBtn: HTMLElement | null) {
  if (localeSlot) {
    [...localeSlot.children].forEach((child) => {
      if ((child as HTMLElement).id === ROOT_ID) return;
      (child as HTMLElement).setAttribute('data-marvlore-locale-original', '1');
    });
    if (root.parentElement !== localeSlot) localeSlot.appendChild(root);
    return;
  }
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

async function refresh() {
  if (paused) return;
  const onList = isWorkListPath(window.location.pathname);
  document.body.dataset.marvloreWorkList = onList ? '1' : '0';
  if (!onList) {
    document.getElementById(ROOT_ID)?.remove();
    cachedProjects = null;
    rowTemplateHtml = null;
    softFilterLabel = undefined;
    return;
  }

  ensureStyle();
  hideAvailableInColumn();
  hideLocalePortals();
  hideStrapiCategoryFilterChips();

  if (!cachedCategories) cachedCategories = await fetchLevel2Categories();
  if (!cachedCategories.length) return;

  const root = ensureSelectBuilt(cachedCategories);
  placeSelectInLocaleSlot(root, findLocaleSlot(), findCreateButton());
  hideLocalePortals();

  // Prefetch full list once so category switches stay soft
  if (!cachedProjects) {
    cachedProjects = await fetchAllProjects();
  }
  if (!rowTemplateHtml) captureRowTemplate();

  // If URL/soft label is set, keep table in sync without navigation
  const label = activeCategoryLabel();
  if (label !== null && rowTemplateHtml && cachedProjects) {
    // Only re-render when we are actively soft-filtering (or URL has label)
    if (softFilterLabel !== undefined || new URLSearchParams(window.location.search).has('marvloreCategoryLabel')) {
      renderSoftTable(label);
    }
  }

  hideAvailableInColumn();
  hideStrapiCategoryFilterChips();
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
