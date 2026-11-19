import {build} from 'esbuild';
import {copyFile, mkdir} from 'node:fs/promises';
import {gsapExternalPlugin} from './gsap-external-plugin.mjs';

await mkdir('dist/vendor', {recursive: true});

await build({
  entryPoints: ['src/gsap-vendor.js'],
  outfile: 'dist/gsap-vendor.js',
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['chrome110', 'edge110', 'safari16.4'],
  legalComments: 'linked',
});

await build({
  entryPoints: ['src/scroll-smoother.js'],
  outfile: 'dist/scroll-smoother.js',
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['chrome110', 'edge110', 'safari16.4'],
  legalComments: 'linked',
  plugins: [gsapExternalPlugin('dist/scroll-smoother.js')],
});

try {
  await copyFile('node_modules/gsap/LICENSE', 'dist/vendor/GSAP-LICENSE.txt');
} catch {
  /* license file optional across gsap package layouts */
}

console.log('Built shared gsap-vendor + scroll-smoother');
