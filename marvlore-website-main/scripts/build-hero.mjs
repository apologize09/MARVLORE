import { build } from 'esbuild';
import { copyFile } from 'node:fs/promises';
await build({
 entryPoints:['src/hero/hero-entry.jsx'],
 outfile:'dist/hero/orbit.js',
 bundle:true,format:'esm',minify:true,target:['chrome110','edge110','safari16.4'],
 jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},
 legalComments:'linked',
});
await copyFile('src/vendor/react-bits/LICENSE.md','dist/hero/REACT-BITS-LICENSE.txt');
await copyFile('src/hero/images.js','dist/hero/images.js');
console.log('Built isolated React Bits hero → dist/hero/orbit.js + orbit.css');
