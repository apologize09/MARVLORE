import {build} from 'esbuild';
import {copyFile} from 'node:fs/promises';
await build({entryPoints:['src/navigation/menu-entry.jsx'],outfile:'dist/navigation/menu.js',bundle:true,format:'esm',minify:true,target:['chrome110','edge110','safari16.4'],jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked'});
await copyFile('src/navigation/REACT-BITS-LICENSE.md','dist/vendor/REACT-BITS-STAGGERED-MENU-LICENSE.md');
console.log('Built MARVLORE React Bits staggered menu');
