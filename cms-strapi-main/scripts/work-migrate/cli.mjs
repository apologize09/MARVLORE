#!/usr/bin/env node
/**
 * Work static → CMS migration CLI
 *
 * Usage:
 *   node scripts/work-migrate/cli.mjs                 # dry-run (default)
 *   node scripts/work-migrate/cli.mjs --execute       # write to CMS
 *   node scripts/work-migrate/cli.mjs --execute --update-existing
 *   node scripts/work-migrate/cli.mjs --locale=en
 *   node scripts/work-migrate/cli.mjs --execute --database=.tmp/migrate-exec.db
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMigrationPlan } from './plan.mjs';
import { executeMigration } from './execute.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const opts = {
    execute: false,
    updateExisting: false,
    locale: 'zh-CN',
    databaseFilename: null,
    outDir: null,
  };
  for (const arg of argv) {
    if (arg === '--execute') opts.execute = true;
    else if (arg === '--update-existing') opts.updateExisting = true;
    else if (arg.startsWith('--locale=')) opts.locale = arg.slice('--locale='.length);
    else if (arg.startsWith('--database=')) opts.databaseFilename = arg.slice('--database='.length);
    else if (arg.startsWith('--out=')) opts.outDir = arg.slice('--out='.length);
    else if (arg === '--help' || arg === '-h') opts.help = true;
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  console.log(`Work static migration

Default: dry-run only (writes inventory/plan under docs/cms-phase4/artifacts)

  --execute              Write into Strapi via Document Service
  --update-existing      Update rows that already match legacyId
  --locale=zh-CN|en
  --database=.tmp/x.db   Optional SQLite path relative to cms-strapi-main
  --out=DIR              Artifacts output directory
`);
  process.exit(0);
}

if (!opts.execute) {
  const { plan, outDir, planPath, inventoryPath } = buildMigrationPlan({
    locale: opts.locale,
    outDir: opts.outDir,
  });
  console.log('DRY-RUN complete (no CMS writes)');
  console.log(JSON.stringify(plan.counts, null, 2));
  console.log('missingAssets:', plan.missingAssets.length);
  console.log('warnings:', plan.warnings.length);
  console.log('artifacts:', outDir);
  console.log('inventory:', inventoryPath);
  console.log('plan:', planPath);
  process.exit(0);
}

const { report, reportPath, outDir } = await executeMigration({
  execute: true,
  updateExisting: opts.updateExisting,
  locale: opts.locale,
  databaseFilename: opts.databaseFilename,
  outDir: opts.outDir,
});

console.log('EXECUTE complete');
console.log(JSON.stringify({
  created: report.created,
  skipped: report.skipped,
  updated: report.updated,
  failed: report.failed.length,
}, null, 2));
if (report.failed.length) {
  console.error('failures:', report.failed.slice(0, 20));
}
console.log('report:', reportPath);
console.log('artifacts:', outDir);
process.exit(report.failed.length ? 1 : 0);
