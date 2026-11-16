import {copyFile} from 'node:fs/promises';
import {build} from 'esbuild';
await build({entryPoints:['src/work-navigation.js'],outfile:'dist/work-navigation.js',bundle:true,format:'esm',minify:true,target:['chrome110','edge110','safari16.4'],legalComments:'linked'});
await copyFile('node_modules/motion/LICENSE.md','dist/vendor/MOTION-LICENSE.txt');
console.log('Built Motion work navigation');
