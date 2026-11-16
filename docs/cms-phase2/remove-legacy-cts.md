# Remove legacy content types

User-requested removal from CMS data/admin of template leftovers unrelated to Work:

- `process-step`（流程步骤）
- `product-line`（产品线）
- `quote-request`（报价请求）
- `service-model`（服务模式）

Actions:
- Deleted `src/api/{process-step,product-line,quote-request,service-model}`
- Dropped SQLite tables + public permission rows
- Updated `src/index.ts` and `scripts/seed.js`
- Kept: article/author/category/faq/certification/page-seo/about/global + work-*

Local backup: `cms-strapi-main/.backups/remove-legacy-cts-20261116/data.db` (gitignored)
