/**
 * Work locale helpers — zh-CN (default) + en.
 * Syncs ?cmsLocale= / localStorage without admin tokens.
 */

export const WORK_LOCALES = [
  { code: 'zh-CN', label: '中文', htmlLang: 'zh-CN' },
  { code: 'en', label: 'EN', htmlLang: 'en' },
];

export function normalizeLocale(raw) {
  const value = String(raw || 'zh-CN').trim();
  if (value === 'zh' || value === 'zh-Hans') return 'zh-CN';
  if (value === 'en' || value === 'en-US' || value === 'en-GB') return 'en';
  return WORK_LOCALES.some((l) => l.code === value) ? value : 'zh-CN';
}

export function readStoredLocale() {
  try {
    const param = new URLSearchParams(location.search).get('cmsLocale');
    if (param) return normalizeLocale(param);
  } catch {
    // ignore
  }
  try {
    return normalizeLocale(localStorage.getItem('marvlore.cmsLocale') || 'zh-CN');
  } catch {
    return 'zh-CN';
  }
}

export function writeLocale(locale, { replace = true } = {}) {
  const next = normalizeLocale(locale);
  try {
    localStorage.setItem('marvlore.cmsLocale', next);
  } catch {
    // ignore
  }
  if (typeof location === 'undefined' || typeof history === 'undefined') return next;
  const params = new URLSearchParams(location.search);
  if (next === 'zh-CN') params.delete('cmsLocale');
  else params.set('cmsLocale', next);
  const search = params.toString();
  const url = `${location.pathname}${search ? `?${search}` : ''}${location.hash || ''}`;
  if (replace) history.replaceState(history.state, '', url);
  else history.pushState(history.state, '', url);
  return next;
}

export function applyDocumentLang(locale) {
  const meta = WORK_LOCALES.find((l) => l.code === normalizeLocale(locale)) || WORK_LOCALES[0];
  try {
    document.documentElement.lang = meta.htmlLang;
    document.documentElement.dataset.cmsLocale = meta.code;
  } catch {
    // non-DOM
  }
  return meta;
}

/**
 * Compact locale switch control (CMS mode only).
 */
export function mountLocaleSwitch({ onChange } = {}) {
  let current = readStoredLocale();
  applyDocumentLang(current);

  let root = document.querySelector('[data-cms-locale-switch]');
  if (!root) {
    root = document.createElement('div');
    root.className = 'cms-locale-switch';
    root.setAttribute('data-cms-locale-switch', '');
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Language');
    document.body.append(root);
  }

  function render() {
    root.innerHTML = WORK_LOCALES.map(
      (locale) =>
        `<button type="button" data-cms-locale="${locale.code}" aria-pressed="${locale.code === current}">${locale.label}</button>`,
    ).join('');
  }

  render();
  root.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-cms-locale]');
    if (!btn) return;
    const next = normalizeLocale(btn.dataset.cmsLocale);
    if (next === current) return;
    current = writeLocale(next, { replace: false });
    applyDocumentLang(current);
    render();
    onChange?.(current);
  });

  return {
    getLocale: () => current,
    destroy() {
      root.remove();
    },
  };
}
