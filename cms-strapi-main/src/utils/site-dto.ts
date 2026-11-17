/** Public DTOs for V1.0 Contact / Awards / Hero / About / Services. */

type MediaLike = {
  url?: string | null;
  caption?: string | null;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
  mime?: string | null;
  name?: string | null;
} | null | undefined;

/**
 * Prefer Media Library relation for admin upload/preview.
 * When sync-site-media set caption to `/assets/...`, return `./assets/...`
 * so the static site keeps same-origin asset paths. URL strings remain fallback.
 */
export function resolveSiteMediaUrl(
  media: MediaLike,
  fallbackUrl?: string | null,
): string | null {
  if (media && typeof media === 'object') {
    const caption = typeof media.caption === 'string' ? media.caption.trim() : '';
    if (caption) {
      let path = caption.replace(/^\.\//, '');
      if (path.startsWith('assets/')) path = `/${path}`;
      if (path.startsWith('/assets/')) return `.${path}`;
    }
  }
  if (fallbackUrl != null && String(fallbackUrl).trim()) {
    return String(fallbackUrl);
  }
  if (media && media.url) {
    return String(media.url);
  }
  return null;
}

function awardImageName(media: MediaLike, imageUrl: unknown) {
  const raw = resolveSiteMediaUrl(media, imageUrl == null ? null : String(imageUrl)) || '';
  return raw.replace(/^\.\//, '').replace(/^\/?assets\//, '');
}

export function toAwardDto(row: Record<string, unknown>) {
  // Frontend carousel expects bare asset filenames (e.g. award-aigc.webp).
  const image = awardImageName(row.image as MediaLike, row.imageUrl);
  return {
    documentId: row.documentId,
    legacyId: row.legacyId ?? null,
    image,
    alt: row.alt ?? '',
    name: row.name ?? null,
    organization: row.organization ?? null,
    description: row.description ?? null,
    awardYear: row.awardYear ?? null,
    externalUrl: row.externalUrl ?? null,
    sortOrder: row.sortOrder ?? 0,
  };
}

export function toHeroItemDto(row: Record<string, unknown>) {
  const role = String(row.role || 'project');
  const mediaType = String(row.mediaType || 'image');
  const legacyId = (row.legacyId as string) || (row.slug as string);
  const src = resolveSiteMediaUrl(row.image as MediaLike, row.imageUrl as string | null) || '';
  const base: Record<string, unknown> = {
    documentId: row.documentId,
    legacyId,
    id: legacyId,
    slug: row.slug,
    role,
    mediaType,
    title: row.title ?? '',
    alt: row.alt ?? row.title ?? '',
    src,
    width: row.width ?? (row.image as MediaLike)?.width ?? null,
    height: row.height ?? (row.image as MediaLike)?.height ?? null,
    sortOrder: row.sortOrder ?? 0,
  };
  if (role === 'project') {
    const videoSrc = resolveSiteMediaUrl(row.video as MediaLike, row.videoUrl as string | null);
    const videoSrcHd = resolveSiteMediaUrl(row.videoHd as MediaLike, row.videoUrlHd as string | null);
    const previewSrc = resolveSiteMediaUrl(row.preview as MediaLike, row.previewUrl as string | null);
    const homePreviewSrc = resolveSiteMediaUrl(
      row.homePreview as MediaLike,
      row.homePreviewUrl as string | null,
    );
    if (videoSrc) base.videoSrc = videoSrc;
    if (videoSrcHd) base.videoSrcHd = videoSrcHd;
    if (previewSrc) base.previewSrc = previewSrc;
    if (homePreviewSrc) base.homePreviewSrc = homePreviewSrc;
    if (Array.isArray(row.slides) && row.slides.length) base.slides = row.slides;
  }
  return base;
}

export function toAboutPageDto(row: Record<string, unknown> | null) {
  if (!row) return null;
  const stats = Array.isArray(row.stats)
    ? [...row.stats]
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((stat: any) => ({
          number: String(stat.number ?? ''),
          lines: Array.isArray(stat.lines) ? stat.lines.map(String) : [],
        }))
    : [];
  const collage = Array.isArray(row.collageImages)
    ? row.collageImages.map((item: any) => ({
        slotIndex: Number(item.slotIndex),
        src: resolveSiteMediaUrl(item.image, item.imageUrl) || '',
        alt: String(item.alt || ''),
        focus: item.focus ? String(item.focus) : undefined,
      }))
    : [];
  return {
    copy: {
      name: row.brandName ?? 'Marvlore',
      chineseName: row.brandNameCn ?? '（迈络）',
      partner: row.partnerLine ?? '',
      partnerChinese: row.partnerLineCn ?? '',
      stats,
    },
    collage,
    seo: row.seo ?? null,
  };
}

export function toServiceItemDto(row: Record<string, unknown>) {
  return {
    documentId: row.documentId,
    id: row.legacyId || row.slug,
    legacyId: row.legacyId ?? null,
    slug: row.slug,
    en: row.titleEn ?? '',
    cn: row.titleCn ?? '',
    description: row.description ?? '',
    image: resolveSiteMediaUrl(row.image as MediaLike, row.imageUrl as string | null) || '',
    typeScale: row.typeScale == null || row.typeScale === '' ? undefined : Number(row.typeScale),
    sortOrder: row.sortOrder ?? 0,
  };
}

export function toGlobalSettingDto(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    siteName: row.siteName ?? 'MARVLORE',
    siteNameCn: row.siteNameCn ?? '迈络',
    tagline: row.tagline ?? 'Ideas Make Brands POP',
    email: row.email ?? null,
    phone: row.phone ?? null,
    phoneDisplay: row.phoneDisplay ?? null,
    wechat: row.wechat ?? null,
    addressEn: row.addressEn ?? null,
    addressCn: row.addressCn ?? null,
    studioNoteEn: row.studioNoteEn ?? null,
    studioNoteCn: row.studioNoteCn ?? null,
    welcomeCn: row.welcomeCn ?? null,
    copyrightText: row.copyrightText ?? null,
    socialLinks: Array.isArray(row.socialLinks) ? row.socialLinks : [],
    defaultSeo: row.defaultSeo ?? null,
  };
}
