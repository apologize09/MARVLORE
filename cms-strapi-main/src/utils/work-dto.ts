type AnyRecord = Record<string, any>;

/** Prefer sync-site-media caption (`/assets/...`) so site keeps static asset paths. */
function siteUrlFromMedia(media: AnyRecord | null | undefined, fallbackUrl?: string | null) {
  if (media && typeof media === 'object') {
    const caption = typeof media.caption === 'string' ? media.caption.trim() : '';
    if (caption) {
      let path = caption.replace(/^\.\//, '');
      if (path.startsWith('assets/')) path = `/${path}`;
      if (path.startsWith('/assets/')) return `.${path}`;
    }
    if (media.url) return String(media.url);
  }
  if (fallbackUrl) return String(fallbackUrl);
  return null;
}

function pickMedia(media: AnyRecord | null | undefined, fallbackUrl?: string | null) {
  const url = siteUrlFromMedia(media, fallbackUrl);
  if (media && typeof media === 'object') {
    return {
      url,
      alternativeText: media.alternativeText || null,
      width: media.width ?? null,
      height: media.height ?? null,
      mime: media.mime || null,
      name: media.name || null,
    };
  }
  if (url) {
    return {
      url,
      alternativeText: null,
      width: null,
      height: null,
      mime: null,
      name: null,
    };
  }
  return null;
}

export function toCategoryDto(cat: AnyRecord | null | undefined) {
  if (!cat) return null;
  return {
    documentId: cat.documentId,
    name: cat.name,
    nameCn: cat.nameCn ?? null,
    eyebrow: cat.eyebrow ?? null,
    slug: cat.slug,
    level: cat.level,
    description: cat.description ?? null,
    cover: pickMedia(cat.cover, cat.coverUrl),
    coverUrl: cat.coverUrl ?? null,
    sortOrder: cat.sortOrder ?? 0,
    isActive: cat.isActive !== false,
    parent: cat.parent
      ? {
          documentId: cat.parent.documentId,
          name: cat.parent.name,
          nameCn: cat.parent.nameCn ?? null,
          slug: cat.parent.slug,
          level: cat.parent.level,
        }
      : null,
    legacyId: cat.legacyId ?? null,
  };
}

export function toTagDto(tag: AnyRecord | null | undefined) {
  if (!tag) return null;
  return {
    documentId: tag.documentId,
    name: tag.name,
    slug: tag.slug,
    description: tag.description ?? null,
    color: tag.color ?? null,
    sortOrder: tag.sortOrder ?? 0,
    isActive: tag.isActive !== false,
    categories: Array.isArray(tag.categories)
      ? tag.categories.map((c: AnyRecord) => ({
          documentId: c.documentId,
          slug: c.slug,
          name: c.name,
          level: c.level,
        }))
      : [],
    legacyId: tag.legacyId ?? null,
  };
}

export function toProjectCardDto(project: AnyRecord | null | undefined) {
  if (!project) return null;
  const category = project.category || null;
  return {
    documentId: project.documentId,
    slug: project.slug,
    title: project.title,
    subtitle: project.subtitle ?? null,
    eyebrow: project.eyebrow ?? null,
    summary: project.summary ?? null,
    projectType: project.projectType,
    projectYear: project.projectYear ?? null,
    clientName: project.clientName ?? null,
    isFeatured: !!project.isFeatured,
    showOnHome: !!project.showOnHome,
    sortOrder: project.sortOrder ?? 0,
    focusX: project.focusX ?? null,
    focusY: project.focusY ?? null,
    cover: pickMedia(project.cover, project.coverUrl),
    coverUrl: siteUrlFromMedia(project.cover, project.coverUrl),
    // Legacy thumbnail/poster slots mirror cover so site adapters never need separate assets.
    thumbnail: pickMedia(project.cover, project.coverUrl),
    thumbnailUrl: siteUrlFromMedia(project.cover, project.coverUrl),
    heroMedia: pickMedia(project.heroMedia, project.heroMediaUrl),
    heroMediaUrl: siteUrlFromMedia(project.heroMedia, project.heroMediaUrl),
    video: pickMedia(project.video, project.videoUrl),
    videoUrl: siteUrlFromMedia(project.video, project.videoUrl),
    poster: pickMedia(project.cover, project.coverUrl),
    posterUrl: siteUrlFromMedia(project.cover, project.coverUrl),
    homePreviewVideo: pickMedia(project.homePreviewVideo, project.homePreviewVideoUrl),
    homePreviewVideoUrl: siteUrlFromMedia(project.homePreviewVideo, project.homePreviewVideoUrl),
    // Legacy previewVideo slots mirror home preview (single preview tier).
    previewVideo: pickMedia(project.homePreviewVideo, project.homePreviewVideoUrl),
    previewVideoUrl: siteUrlFromMedia(project.homePreviewVideo, project.homePreviewVideoUrl),
    category: category
      ? {
          documentId: category.documentId,
          slug: category.slug,
          name: category.name,
          parentSlug: category.parent?.slug ?? null,
        }
      : null,
    tags: Array.isArray(project.tags)
      ? project.tags.map((t: AnyRecord) => t.slug).filter(Boolean)
      : [],
    legacyId: project.legacyId ?? null,
    publishedAt: project.publishedAt ?? null,
  };
}

export function toMediaBlockDto(block: AnyRecord | null | undefined) {
  if (!block) return null;
  return {
    documentId: block.documentId,
    blockType: block.blockType,
    title: block.title ?? null,
    body: block.body ?? null,
    image: pickMedia(block.image, block.imageUrl),
    imageUrl: block.imageUrl ?? null,
    video: pickMedia(block.video, block.videoUrl),
    videoUrl: block.videoUrl ?? null,
    poster: pickMedia(block.poster, block.posterUrl),
    posterUrl: block.posterUrl ?? null,
    embedUrl: block.embedUrl ?? null,
    altText: block.altText ?? null,
    caption: block.caption ?? null,
    displayMode: block.displayMode ?? 'full-width',
    aspectRatio: block.aspectRatio ?? null,
    sortOrder: block.sortOrder ?? 0,
    legacyId: block.legacyId ?? null,
  };
}

export function toProjectDetailDto(project: AnyRecord | null | undefined) {
  if (!project) return null;
  const card = toProjectCardDto(project);
  return {
    ...card,
    description: project.description ?? null,
    mediaItems: Array.isArray(project.mediaItems)
      ? project.mediaItems
          .slice()
          .sort((a: AnyRecord, b: AnyRecord) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map(toMediaBlockDto)
      : [],
    relatedProjects: Array.isArray(project.relatedProjects)
      ? project.relatedProjects.map(toProjectCardDto)
      : [],
    seo: project.seo
      ? {
          metaTitle: project.seo.metaTitle ?? null,
          metaDescription: project.seo.metaDescription ?? null,
          shareImage: pickMedia(project.seo.shareImage),
        }
      : null,
  };
}

export function buildCategoryTree(categories: AnyRecord[]) {
  const level1 = categories
    .filter((c) => Number(c.level) === 1)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const level2 = categories
    .filter((c) => Number(c.level) === 2)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return level1.map((parent) => {
    const children = level2.filter((c) => c.parent?.documentId === parent.documentId);
    return {
      ...toCategoryDto(parent),
      children: children.map((c) => toCategoryDto(c)),
    };
  });
}

export function toWorkPageDto(page: AnyRecord | null | undefined) {
  if (!page) return null;
  return {
    documentId: page.documentId,
    title: page.title,
    intro: page.intro ?? null,
    showFeatured: page.showFeatured !== false,
    featuredProjects: Array.isArray(page.featuredProjects)
      ? page.featuredProjects.map(toProjectCardDto)
      : [],
    displayCategories: Array.isArray(page.displayCategories)
      ? page.displayCategories.map(toCategoryDto)
      : [],
    seo: page.seo
      ? {
          metaTitle: page.seo.metaTitle ?? null,
          metaDescription: page.seo.metaDescription ?? null,
          shareImage: pickMedia(page.seo.shareImage),
        }
      : null,
  };
}

export function paginationMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    pageCount: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    total,
  };
}
