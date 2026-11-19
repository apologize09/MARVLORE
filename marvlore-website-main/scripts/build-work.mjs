import {copyFile} from 'node:fs/promises';
import {build} from 'esbuild';

const shared={
  bundle:true,
  format:'esm',
  minify:true,
  target:['chrome110','edge110','safari16.4'],
  legalComments:'linked',
};

/** Map @marvlore/cms/<name> → ./cms/<name>.js (external, resolved from dist/). */
const cmsExternalPlugin={
  name:'marvlore-cms-external',
  setup(buildApi){
    buildApi.onResolve({filter:/^@marvlore\/cms\//},(args)=>{
      const name=args.path.slice('@marvlore/cms/'.length);
      return {path:`./cms/${name}.js`,external:true};
    });
  },
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
  plugins:[cmsExternalPlugin],
});
await copyFile('src/work/listing.css','dist/work-listing.css');
await copyFile('node_modules/motion/LICENSE.md','dist/vendor/MOTION-LICENSE.txt');
console.log('Built Motion work navigation + work route/listing');
