/** Public DTOs for V1.0 Contact / Awards (frontend contracts). */

export function toAwardDto(row: Record<string, unknown>) {
  const imageUrl = String(row.imageUrl || '');
  // Frontend carousel expects bare asset filenames (e.g. award-aigc.webp).
  const image = imageUrl.replace(/^\/?assets\//, '').replace(/^\.\//, '');
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
