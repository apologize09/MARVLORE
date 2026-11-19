import {build} from 'esbuild';
import {copyFile} from 'node:fs/promises';
import {gsapExternalPlugin} from './gsap-external-plugin.mjs';

const outfile = 'dist/navigation/menu.js';
await build({
  entryPoints: ['src/navigation/menu-entry.jsx'],
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
await copyFile(
  'src/navigation/REACT-BITS-LICENSE.md',
  'dist/vendor/REACT-BITS-STAGGERED-MENU-LICENSE.md',
);
console.log('Built MARVLORE React Bits staggered menu');
