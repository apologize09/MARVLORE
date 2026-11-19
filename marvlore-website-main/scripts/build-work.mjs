import {copyFile} from 'node:fs/promises';
import {build} from 'esbuild';

const shared={
  bundle:true,
  format:'esm',
  minify:true,
  target:['chrome110','edge110','safari16.4'],
  legalComments:'linked',
};

await build({
  ...shared,
  entryPoints:['src/work-navigation.js'],
  outfile:'dist/work-navigation.js',
});
await build({
  ...shared,
  entryPoints:['src/work/route.js'],
  outfile:'dist/work-route.js',
});
await build({
  ...shared,
  entryPoints:['src/work/listing.js'],
  outfile:'dist/work-listing.js',
});
await copyFile('src/work/listing.css','dist/work-listing.css');
await copyFile('node_modules/motion/LICENSE.md','dist/vendor/MOTION-LICENSE.txt');
console.log('Built Motion work navigation + work route/listing');
