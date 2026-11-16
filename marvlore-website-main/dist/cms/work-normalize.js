/**
 * Map Phase 3 CMS DTOs → existing Work ViewModels used by components / detail / reel.
 */

function stripAssetsPrefix(url) {
  if (!url) return null;
  let s = String(url).replace(/^\.\//, '');
  if (s.startsWith('/')) s = s.slice(1);
  if (s.startsWith('assets/')) s = s.slice('assets/'.length);
  return s;
}

function toWebPath(url) {
  if (!url) return null;
  const s = String(url);
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  if (s.startsWith('./')) return s;
  if (s.startsWith('/')) return '.' + s;
  if (s.startsWith('assets/')) return './' + s;
  return './assets/' + s;
}

export function normalizeCategoryToOverview(categoryDto, fallbackById = {}) {
  const slug = categoryDto.slug;
  const fb = fallbackById[slug] || {};
  const coverPath = stripAssetsPrefix(categoryDto.coverUrl || categoryDto.cover?.url) || fb.image || null;
  return {
    id: slug,
    eyebrow: fb.eyebrow || categoryDto.name || '',
    title: categoryDto.name || fb.title || slug,
    cn: fb.cn || categoryDto.name || slug,
    description: categoryDto.description || fb.description || '',
    image: coverPath,
    overviewImage: fb.overviewImage,
    overviewLabel: fb.overviewLabel,
    tags: fb.tags || [],
    detail: fb.detail || categoryDto.description || '',
    label: fb.label || categoryDto.name || '',
    imageFit: fb.imageFit || 'cover',
    imagePosition: fb.imagePosition || '50% 50%',
    mediaPlaceholder: fb.mediaPlaceholder || '待填充作品图片',
  };
}

export function normalizeProjectToReelItem(projectDto) {
  const coverUrl = projectDto.coverUrl || projectDto.cover?.url;
  const thumb = projectDto.thumbnailUrl || projectDto.thumbnail?.url || coverUrl;
  const poster = projectDto.posterUrl || coverUrl;
  const src = toWebPath(coverUrl || poster);
  return {
    id: projectDto.legacyId || projectDto.slug,
    category: projectDto.category?.slug || projectDto.categorySlug || 'visual',
    title: projectDto.title,
    subtitle: projectDto.subtitle || projectDto.summary || '',
    alt: projectDto.cover?.alternativeText || `${projectDto.title}项目封面`,
    src,
    thumbnailSrc: thumb ? toWebPath(thumb) : null,
    previewSrc: projectDto.previewVideoUrl ? toWebPath(projectDto.previewVideoUrl) : null,
    videoSrc: projectDto.videoUrl ? toWebPath(projectDto.videoUrl) : null,
    homePreviewSrc: projectDto.homePreviewVideoUrl
      ? toWebPath(projectDto.homePreviewVideoUrl)
      : null,
    width: projectDto.cover?.width || 1920,
    height: projectDto.cover?.height || 1080,
    aspect: (projectDto.cover?.width || 1920) / (projectDto.cover?.height || 1080),
    focusX: projectDto.focusX ?? 50,
  };
}

export function normalizeMediaBlock(block) {
  if (!block) return null;
  if (block.blockType === 'video') {
    return {
      type: 'video',
      src: toWebPath(block.videoUrl || block.video?.url),
      poster: toWebPath(block.posterUrl || block.poster?.url),
      alt: block.altText || block.caption || '项目视频',
      width: block.video?.width || 1920,
      height: block.video?.height || 1080,
    };
  }
  if (block.blockType === 'image') {
    return {
      type: 'image',
      src: toWebPath(block.imageUrl || block.image?.url),
      alt: block.altText || block.caption || '项目视觉',
      width: block.image?.width || 1920,
      height: block.image?.height || 1080,
    };
  }
  return null;
}

export function normalizeProjectToDetail(projectDto, { index = 1, total = 1, nextId = null } = {}) {
  const reel = normalizeProjectToReelItem(projectDto);
  const isVideo = Boolean(projectDto.videoUrl) || projectDto.projectType === 'video';
  const cover = isVideo
    ? {
        type: 'video',
        src: toWebPath(projectDto.videoUrl),
        poster: toWebPath(projectDto.posterUrl || projectDto.coverUrl || projectDto.cover?.url),
        alt: projectDto.cover?.alternativeText || projectDto.title,
        width: projectDto.cover?.width || 1920,
        height: projectDto.cover?.height || 1080,
      }
    : {
        type: 'image',
        src: toWebPath(projectDto.coverUrl || projectDto.cover?.url),
        alt: projectDto.cover?.alternativeText || projectDto.title,
        width: projectDto.cover?.width || 1920,
        height: projectDto.cover?.height || 1080,
      };

  const media = Array.isArray(projectDto.mediaItems)
    ? projectDto.mediaItems.map(normalizeMediaBlock).filter(Boolean)
    : [];

  return {
    id: projectDto.legacyId || projectDto.slug,
    category: projectDto.category?.slug || 'visual',
    title: projectDto.title,
    subtitle: projectDto.subtitle || '',
    eyebrow: projectDto.eyebrow || '',
    summary: projectDto.summary || '',
    intro: projectDto.description || projectDto.summary || projectDto.title,
    tags: Array.isArray(projectDto.tags)
      ? projectDto.tags.map((t) => (typeof t === 'string' ? t : t.name || t.slug)).filter(Boolean)
      : [],
    cover,
    media,
    index,
    total,
    nextId,
    focusX: projectDto.focusX ?? 50,
    videoUrl: projectDto.videoUrl ? toWebPath(projectDto.videoUrl) : null,
    previewVideoUrl: projectDto.previewVideoUrl ? toWebPath(projectDto.previewVideoUrl) : null,
    homePreviewVideoUrl: projectDto.homePreviewVideoUrl
      ? toWebPath(projectDto.homePreviewVideoUrl)
      : null,
  };
}

export function buildDetailList(projectDtos) {
  const list = projectDtos.map((p, i) =>
    normalizeProjectToDetail(p, {
      index: i + 1,
      total: projectDtos.length,
      nextId: null,
    })
  );
  list.forEach((item, i) => {
    item.nextId = list[(i + 1) % list.length]?.id ?? null;
    item.total = list.length;
  });
  return list;
}
