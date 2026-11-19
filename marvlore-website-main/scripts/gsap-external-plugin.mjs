import path from 'node:path';

/**
 * Rewrite `gsap` / `gsap/*` imports to the shared dist vendor (external).
 * @param {string} outfile esbuild outfile path (e.g. dist/about/reference.js)
 */
export function gsapExternalPlugin(outfile) {
  const vendorAbs = path.resolve('dist/gsap-vendor.js');
  const outDir = path.dirname(path.resolve(outfile));
  let rel = path.relative(outDir, vendorAbs).split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = `./${rel}`;

  return {
    name: 'gsap-external',
    setup(buildApi) {
      buildApi.onResolve({filter: /^gsap(\/.*)?$/}, () => ({
        path: rel,
        external: true,
      }));
    },
  };
}
