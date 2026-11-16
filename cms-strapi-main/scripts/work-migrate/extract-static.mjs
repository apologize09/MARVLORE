/**
 * Extract Work static records from marvlore-website-main/dist modules.
 * Mirrors dist/work-detail-data.js transforms without browser imports.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const WEBSITE_DIST = path.join(REPO_ROOT, 'marvlore-website-main/dist');

function read(rel) {
  return fs.readFileSync(path.join(WEBSITE_DIST, rel), 'utf8');
}

function evalExport(code, exportName) {
  const cleaned = code
    .replace(/import\s+[^;]+;/g, '')
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+\{[^}]+\};?/g, '');
  // eslint-disable-next-line no-new-func
  const fn = new Function(`${cleaned}\n; return ${exportName};`);
  return fn();
}

function slugify(input) {
  const raw = String(input || '').trim();
  let s = raw
    .toLowerCase()
    .replace(/[·•]/g, ' ')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  if (!s) {
    // CJK / non-ascii labels: deterministic ascii slug (no invented translation)
    const hex = Buffer.from(raw, 'utf8').toString('hex').slice(0, 16);
    s = `t-${hex}`;
  }
  return s;
}

function normalizeAssetPath(src) {
  if (!src) return null;
  let s = String(src).replace(/^\.\//, '');
  if (s.startsWith('assets/')) return `/${s}`;
  if (s.startsWith('/assets/')) return s;
  if (!s.startsWith('/')) return `/assets/${s}`;
  return s;
}

function resolveOnDisk(webPath) {
  if (!webPath) return { exists: false, abs: null, bytes: 0 };
  const rel = webPath.replace(/^\//, '');
  const abs = path.join(WEBSITE_DIST, rel);
  try {
    const st = fs.statSync(abs);
    return { exists: st.isFile(), abs, bytes: st.size };
  } catch {
    return { exists: false, abs, bytes: 0 };
  }
}

export function extractStaticWork() {
  const projects = evalExport(read('data.js'), 'projects');
  const heroMod = read('hero/images.js');
  const heroProjects = evalExport(heroMod, 'heroProjects');
  const heroImages = evalExport(heroMod, 'heroImages');
  const visualProjects = evalExport(read('visual-projects.js'), 'visualProjects');

  const filmProjects = heroProjects
    .filter((p) => p.videoSrc)
    .map((project) => ({
      ...project,
      id: 'reel-film-' + project.id.replace('hero-video-', ''),
      category: 'film',
      title: project.title + ' · 品牌影片',
      subtitle: '影视动画',
      aspect: project.width / project.height,
      focusX: 50,
    }));

  const direction = (id) => {
    const p = projects.find((item) => item.id === id);
    return {
      id: 'reel-' + id,
      category: id,
      src: './assets/' + p.image,
      title: p.title,
      subtitle: p.cn,
      alt: p.label,
      aspect: (['film', 'web'].includes(id) ? 835 : 834) / 347,
      focusX: 50,
    };
  };

  const workReelItems = [...filmProjects, ...visualProjects, direction('web'), direction('culture')];

  const asset = (src, alt, width, height) => ({ type: 'image', src, alt, width, height });
  const orbit = (index) => {
    const p = heroImages[index];
    return asset(p.src, p.alt, p.width, p.height);
  };
  const additions = { film: [], visual: [], web: [orbit(6)], culture: [] };
  const coverFor = (p) =>
    p.image
      ? asset(
          './assets/' + p.image,
          p.label,
          ['visual', 'film'].includes(p.id) ? 1920 : p.id === 'web' ? 835 : 834,
          ['visual', 'film'].includes(p.id) ? 1080 : 347
        )
      : null;

  const directionCases = projects.map((p, index) => ({
    id: p.id,
    category: p.id,
    title: p.title,
    subtitle: p.cn,
    eyebrow: p.eyebrow,
    summary: p.description,
    intro: p.detail,
    tags: p.tags,
    cover: coverFor(p),
    media: additions[p.id] || [],
    index: index + 1,
    total: projects.length,
    nextId: projects[(index + 1) % projects.length].id,
    source: 'direction',
  }));

  const reelCases = workReelItems.map((p, index) => {
    const base = directionCases.find((item) => p.id === 'reel-' + item.id);
    const words = p.title.split(' · ');
    return {
      ...(base ?? {
        category: p.category,
        title: words[0],
        subtitle: words[1] ?? p.subtitle,
        eyebrow: 'Selected Visuals',
        summary: projects.find((item) => item.id === p.category)?.description ?? p.subtitle,
        intro: '围绕品牌表达，探索图形、材质与视觉系统的更多可能。',
        tags: [p.subtitle],
        cover: asset(p.src, p.alt, p.width ?? Math.round(p.aspect * 2250), p.height ?? 2250),
        media: [],
      }),
      id: p.id,
      index: index + 1,
      total: workReelItems.length,
      nextId: workReelItems[(index + 1) % workReelItems.length].id,
      focusX: p.focusX,
      source: 'reel',
    };
  });

  const filmCases = filmProjects.map((p, index) => ({
    id: p.id,
    category: p.category,
    title: p.title.split(' · ')[0],
    subtitle: '品牌影片',
    eyebrow: 'Film & Animation',
    summary: '影视动画',
    intro: p.title,
    tags: ['影视动画'],
    cover: {
      type: 'video',
      src: p.videoSrc,
      poster: p.src,
      alt: p.alt,
      width: p.width,
      height: p.height,
    },
    videoUrl: p.videoSrc,
    previewVideoUrl: p.previewSrc,
    homePreviewVideoUrl: p.homePreviewSrc,
    media: [],
    index: index + 1,
    total: filmProjects.length,
    nextId: filmProjects[(index + 1) % filmProjects.length].id,
    focusX: p.focusX ?? 50,
    source: 'film',
  }));

  const visualCases = visualProjects.map((p, index) => ({
    id: p.id,
    category: p.category,
    title: p.title.split(' · ')[0],
    subtitle: p.subtitle,
    eyebrow: 'Brand Visuals',
    summary: p.subtitle,
    intro: p.title,
    tags: ['视觉设计', p.subtitle],
    cover: asset(p.src, p.alt, p.width, p.height),
    thumbnailUrl: p.thumbnailSrc || null,
    media: [],
    index: index + 1,
    total: visualProjects.length,
    nextId: visualProjects[(index + 1) % visualProjects.length].id,
    focusX: p.focusX,
    source: 'visual',
  }));

  // Same composition as workDetailCases
  const workDetailCases = [
    ...directionCases,
    ...reelCases.filter((item) => !['visual', 'film'].includes(item.category)),
    ...filmCases,
    ...visualCases,
  ];

  // Deduplicate by id (direction + reel may overlap conceptually; keep first)
  const seen = new Set();
  const uniqueCases = [];
  for (const item of workDetailCases) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    uniqueCases.push(item);
  }

  const categoriesL1 = {
    legacyId: 'cat-l1-work',
    slug: 'work',
    name: 'Work',
    level: 1,
  };

  const categoriesL2 = projects.map((p, i) => ({
    legacyId: `cat-l2-${p.id}`,
    slug: p.id,
    name: p.title,
    nameZh: p.cn,
    level: 2,
    parentLegacyId: 'cat-l1-work',
    sortOrder: i,
    description: p.description,
    coverUrl: normalizeAssetPath('assets/' + p.image),
  }));

  const tagNames = new Set();
  for (const c of uniqueCases) {
    for (const t of c.tags || []) tagNames.add(t);
  }
  const tags = [...tagNames].map((name) => ({
    legacyId: `tag-${slugify(name)}`,
    slug: slugify(name),
    name,
  }));

  const projectsOut = uniqueCases.map((c, i) => {
    const coverUrl =
      c.cover?.type === 'video'
        ? normalizeAssetPath(c.cover.poster)
        : normalizeAssetPath(c.cover?.src);
    const videoUrl = normalizeAssetPath(c.videoUrl || (c.cover?.type === 'video' ? c.cover.src : null));
    const posterUrl = normalizeAssetPath(c.cover?.type === 'video' ? c.cover.poster : null);
    const mediaItems = (c.media || []).map((m, mi) => ({
      legacyId: `media-${c.id}-${mi}`,
      blockType: m.type === 'video' ? 'video' : 'image',
      imageUrl: m.type === 'image' ? normalizeAssetPath(m.src) : null,
      videoUrl: m.type === 'video' ? normalizeAssetPath(m.src) : null,
      posterUrl: m.poster ? normalizeAssetPath(m.poster) : null,
      altText: m.alt || null,
      sortOrder: mi,
    }));

    return {
      legacyId: c.id,
      slug: slugify(c.id.startsWith('reel-') ? c.id.replace(/^reel-(film-|visual-)?/, '') : c.id),
      title: c.title,
      subtitle: c.subtitle || null,
      eyebrow: c.eyebrow || null,
      summary: c.summary || null,
      description: c.intro || null,
      categorySlug: c.category,
      tagNames: c.tags || [],
      projectType: videoUrl ? 'video' : mediaItems.length ? 'mixed' : 'image',
      focusX: c.focusX ?? null,
      focusY: null,
      isFeatured: c.source === 'film' || c.source === 'direction',
      showOnHome: c.source === 'film',
      sortOrder: i,
      coverUrl,
      thumbnailUrl: normalizeAssetPath(c.thumbnailUrl),
      videoUrl,
      posterUrl,
      previewVideoUrl: normalizeAssetPath(c.previewVideoUrl),
      homePreviewVideoUrl: normalizeAssetPath(c.homePreviewVideoUrl),
      mediaItems,
      source: c.source,
      // intentionally omit clientName / projectYear — not in source
    };
  });

  const assets = [];
  const pushAsset = (url, kind, owner) => {
    if (!url) return;
    const disk = resolveOnDisk(url);
    assets.push({ url, kind, owner, exists: disk.exists, bytes: disk.bytes, abs: disk.abs });
  };

  for (const cat of categoriesL2) pushAsset(cat.coverUrl, 'category-cover', cat.legacyId);
  for (const p of projectsOut) {
    pushAsset(p.coverUrl, 'cover', p.legacyId);
    pushAsset(p.thumbnailUrl, 'thumbnail', p.legacyId);
    pushAsset(p.videoUrl, 'video', p.legacyId);
    pushAsset(p.posterUrl, 'poster', p.legacyId);
    pushAsset(p.previewVideoUrl, 'preview', p.legacyId);
    pushAsset(p.homePreviewVideoUrl, 'home-preview', p.legacyId);
    for (const m of p.mediaItems) {
      pushAsset(m.imageUrl, 'media-image', m.legacyId);
      pushAsset(m.videoUrl, 'media-video', m.legacyId);
    }
  }

  return {
    websiteDist: WEBSITE_DIST,
    categories: { l1: categoriesL1, l2: categoriesL2 },
    tags,
    projects: projectsOut,
    assets,
    counts: {
      categoriesL1: 1,
      categoriesL2: categoriesL2.length,
      tags: tags.length,
      projects: projectsOut.length,
      mediaItems: projectsOut.reduce((n, p) => n + p.mediaItems.length, 0),
      assets: assets.length,
      missingAssets: assets.filter((a) => !a.exists).length,
    },
  };
}

export { REPO_ROOT, WEBSITE_DIST, slugify, normalizeAssetPath, resolveOnDisk };
