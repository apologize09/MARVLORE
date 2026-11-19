/**
 * Minimal /work channel shell (P1). Full grid/filters arrive in P2.
 */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {HTMLElement} root
 * @param {{ title?: string, intro?: string, slug?: string|null, mode?: 'list'|'detail-placeholder' }} [opts]
 */
export function renderWorkListingShell(root, opts = {}) {
  if (!root) return null;
  const title = escapeHtml((opts.title && String(opts.title).trim()) || 'Creative Work');
  const introPlain = String(opts.intro || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const intro = escapeHtml(
    introPlain || '从品牌视觉到动态影像与数字体验，浏览全部已发布作品。',
  );
  const mode = opts.mode === 'detail-placeholder' ? 'detail-placeholder' : 'list';
  const slug = opts.slug ? escapeHtml(opts.slug) : '';

  const body =
    mode === 'detail-placeholder'
      ? `<div class="work-listing-placeholder" data-work-listing-body>
          <p>作品详情路由已就绪。</p>
          <p class="work-listing-slug">/${slug}</p>
          <p class="work-listing-note">完整详情视图将在下一阶段接入。</p>
        </div>`
      : `<div class="work-listing-placeholder" data-work-listing-body>
          <p>作品总览即将呈现全部案例、分类与搜索。</p>
          <p class="work-listing-note">此为路由壳 — 卡片网格与筛选将在下一阶段接入。</p>
        </div>`;

  root.innerHTML = `<section class="work-listing screen wrap" data-work-listing aria-labelledby="work-listing-title">
    <header class="work-listing-header">
      <a class="work-listing-back" href="/" data-work-listing-back>
        <span aria-hidden="true">←</span> 返回首页
      </a>
      <h1 id="work-listing-title">${title}</h1>
      <p class="work-listing-intro">${intro}</p>
    </header>
    ${body}
  </section>`;
  root.hidden = false;
  root.setAttribute('data-work-channel', mode);
  return root;
}

/**
 * Apply listing SEO title (CSR minimum).
 * @param {{ title?: string, seoTitle?: string }} [opts]
 */
export function applyWorkListingSeo(opts = {}) {
  if (typeof document === 'undefined') return;
  const base = (opts.seoTitle && String(opts.seoTitle).trim())
    || (opts.title && String(opts.title).trim())
    || 'Creative Work';
  document.title = /marvlore/i.test(base) ? base : `${base} · MARVLORE`;
}

/**
 * @param {HTMLElement} root
 */
export function hideWorkListingShell(root) {
  if (!root) return;
  root.hidden = true;
  root.removeAttribute('data-work-channel');
  root.innerHTML = '';
}
