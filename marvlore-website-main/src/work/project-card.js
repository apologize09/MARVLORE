/**
 * Work listing card markup (lightweight fields only).
 */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toWebPath(url) {
  if (!url) return null;
  const s = String(url);
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  if (s.startsWith('./')) return s;
  if (s.startsWith('/')) return `.${s}`;
  if (s.startsWith('assets/')) return `./${s}`;
  return `./assets/${s}`;
}

/**
 * Map search/list DTO → card view model.
 * @param {object} dto
 */
export function projectDtoToCard(dto) {
  if (!dto) return null;
  const slug = dto.slug || dto.legacyId;
  if (!slug) return null;
  const coverUrl = dto.coverUrl || dto.cover?.url || null;
  const width = dto.cover?.width || 1600;
  const height = dto.cover?.height || 1000;
  return {
    slug: String(slug),
    legacyId: dto.legacyId || null,
    title: dto.title || slug,
    subtitle: dto.subtitle || dto.summary || '',
    categoryLabel: dto.category?.nameCn || dto.category?.name || dto.category?.slug || '',
    categorySlug: dto.category?.slug || '',
    coverUrl: toWebPath(coverUrl),
    year: dto.projectYear || '',
    projectType: dto.projectType || '',
    focusX: dto.focusX ?? 50,
    width,
    height,
  };
}

/**
 * Map reel ViewModel → card (static / CMS fallback).
 * @param {object} item
 */
export function reelItemToCard(item) {
  if (!item) return null;
  const slug = item.slug || item.id;
  if (!slug) return null;
  return {
    slug: String(slug),
    legacyId: item.id || null,
    title: item.title || slug,
    subtitle: item.subtitle || '',
    categoryLabel: item.category || '',
    categorySlug: item.category || '',
    coverUrl: item.thumbnailSrc || item.src || null,
    year: item.year || '',
    projectType: '',
    focusX: item.focusX ?? 50,
    width: item.width || 1600,
    height: item.height || 1000,
  };
}

/**
 * @param {ReturnType<typeof projectDtoToCard>} card
 */
export function renderProjectCard(card) {
  if (!card) return '';
  const href = `/work/${encodeURIComponent(card.slug)}`;
  const title = escapeHtml(card.title);
  const subtitle = escapeHtml(card.subtitle);
  const category = escapeHtml(card.categoryLabel);
  const year = escapeHtml(card.year);
  const focus = Number.isFinite(Number(card.focusX)) ? Number(card.focusX) : 50;
  const w = card.width || 1600;
  const h = card.height || 1000;
  const media = card.coverUrl
    ? `<img src="${escapeHtml(card.coverUrl)}" alt="${title}" width="${w}" height="${h}" loading="lazy" decoding="async" style="object-position:${focus}% 50%">`
    : `<span class="work-project-card-ph" aria-hidden="true"></span>`;

  return `<a class="work-project-card" href="${href}" data-work-card data-work-slug="${escapeHtml(card.slug)}" aria-label="${title}">
    <div class="work-project-card-media" style="aspect-ratio:${w} / ${h}">${media}</div>
    <div class="work-project-card-meta">
      ${category || year ? `<p class="work-project-card-eyebrow">${[category, year].filter(Boolean).join(' · ')}</p>` : ''}
      <h3>${title}</h3>
      ${subtitle ? `<p class="work-project-card-sub">${subtitle}</p>` : ''}
    </div>
  </a>`;
}

export function renderProjectCardGrid(cards) {
  return (cards || []).map(renderProjectCard).join('');
}
