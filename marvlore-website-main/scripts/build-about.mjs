import {build} from 'esbuild';
import {gsapExternalPlugin} from './gsap-external-plugin.mjs';

const outfile = 'dist/about/reference.js';
await build({
  entryPoints: ['src/about/reference-entry.jsx'],
  outfile,
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['chrome110', 'edge110', 'safari16.4'],
  jsx: 'automatic',
  define: {'process.env.NODE_ENV': '"production"'},
  legalComments: 'linked',
  plugins: [gsapExternalPlugin(outfile)],
});
console.log('Built reference Creative AI collage');
