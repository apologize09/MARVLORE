import {build} from 'esbuild';
await build({entryPoints:['src/contact/contact-template.js','src/contact/contact-interactions.js','src/contact/contact-layout.css'],outdir:'dist',bundle:true,format:'esm',minify:true,target:['chrome110','edge110','safari16.4'],define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked'});
console.log('Built editorial contact page');
