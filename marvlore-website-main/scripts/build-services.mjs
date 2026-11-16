import {build} from 'esbuild';
await build({entryPoints:['src/services/experience.jsx'],outfile:'dist/services/experience.js',bundle:true,format:'esm',minify:true,target:['chrome110','edge110','safari16.4'],jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked'});
console.log('Built service scroll and interactive directory');
