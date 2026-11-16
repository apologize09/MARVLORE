import {build} from 'esbuild';
await build({entryPoints:['src/about/reference-entry.jsx'],outfile:'dist/about/reference.js',bundle:true,format:'esm',minify:true,target:['chrome110','edge110','safari16.4'],jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked'});
console.log('Built reference Creative AI collage');
