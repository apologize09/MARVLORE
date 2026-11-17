/**
 * Apply Work SEO (title / description / OG image) from CMS work-page DTO.
 */

const WORK_HREFLANG = [
  { hreflang: 'zh-CN', code: 'zh-CN' },
  { hreflang: 'en', code: 'en' },
  { hreflang: 'x-default', code: 'zh-CN' },
];

function upsertNamedMeta(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.append(el);
  }
  el.setAttribute('content', content ?? '');
  return el;
}

function upsertOgMeta(property, content) {
  let el = document.head.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.append(el);
  }
  el.setAttribute('content', content ?? '');
  return el;
}

function syncHreflang(locale) {
  document.head.querySelectorAll('link[data-cms-hreflang]').forEach((node) => node.remove());
  WORK_HREFLANG.forEach(({ hreflang, code }) => {
    const url = new URL(location.href);
    if (code === 'zh-CN') url.searchParams.delete('cmsLocale');
    else url.searchParams.set('cmsLocale', code);
    // keep current cmsWork flags; locale is the only switch here
    void locale;
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', url.toString());
    link.setAttribute('data-cms-hreflang', hreflang);
    document.head.append(link);
  });
}

export function applyWorkSeo(seo, { locale = 'zh-CN', fallbackTitle, fallbackDescription } = {}) {
  if (typeof document === 'undefined') return null;
  const title = seo?.metaTitle || fallbackTitle || document.title;
  const description =
    seo?.metaDescription ||
    fallbackDescription ||
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    '';
  const image = seo?.shareImage?.url || null;

  if (title) document.title = title;
  upsertNamedMeta('description', description);
  upsertOgMeta('og:title', title);
  upsertOgMeta('og:description', description);
  upsertOgMeta('og:type', 'website');
  upsertOgMeta('og:locale', locale === 'en' ? 'en_US' : 'zh_CN');
  if (image) {
    const abs = image.startsWith('http') ? image : new URL(image, location.origin).toString();
    upsertOgMeta('og:image', abs);
  }
  syncHreflang(locale);
  return { title, description, image };
}
