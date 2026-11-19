/** Collect category slugs declared on a tag DTO. */
export function tagCategorySlugs(tag) {
  const out = new Set();
  for (const c of tag?.categories || []) {
    const slug = String(c?.slug || c?.id || '')
      .trim()
      .toLowerCase();
    if (slug) out.add(slug);
  }
  for (const slug of tag?.categorySlugs || []) {
    const key = String(slug || '')
      .trim()
      .toLowerCase();
    if (key) out.add(key);
  }
  return [...out];
}

/**
 * Tags shown for the active L2 category.
 * "all" / empty → full catalog; otherwise only tags scoped to that category.
 */
export function tagsForActiveCategory(tags, categoryId) {
  const active = String(categoryId || '')
    .trim()
    .toLowerCase();
  if (!active || active === 'all') return tags || [];
  return (tags || []).filter((tag) => tagCategorySlugs(tag).includes(active));
}

/** Drop selected tag slugs that are no longer visible under the active category. */
export function pruneSelectedTags(selected, visibleTags) {
  const allowed = new Set(
    (visibleTags || []).map((t) => t.slug || t.id).filter(Boolean),
  );
  return (selected || []).filter((slug) => allowed.has(slug));
}

/**
 * Infer tag → category links from project list DTOs when tag.categories is empty.
 * @param {object[]} projects
 * @returns {Map<string, Set<string>>}
 */
export function inferTagCategoriesFromProjects(projects) {
  /** @type {Map<string, Set<string>>} */
  const map = new Map();
  for (const project of projects || []) {
    const cat = String(project?.category?.slug || project?.categorySlug || '')
      .trim()
      .toLowerCase();
    if (!cat) continue;
    const tags = project?.tags || [];
    for (const raw of tags) {
      const slug = String(typeof raw === 'string' ? raw : raw?.slug || raw?.id || '')
        .trim()
        .toLowerCase();
      if (!slug) continue;
      if (!map.has(slug)) map.set(slug, new Set());
      map.get(slug).add(cat);
    }
  }
  return map;
}
