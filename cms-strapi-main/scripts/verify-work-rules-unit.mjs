/**
 * Lightweight unit checks for pure work-rules helpers.
 * Requires prior `pnpm build` (reads dist/src/utils/work-rules.js).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { extractRelationIds, assertMediaPayload } = require('../dist/src/utils/work-rules.js');

assert.deepEqual(extractRelationIds('abc'), ['abc']);
assert.deepEqual(extractRelationIds({ documentId: 'd1' }), ['d1']);
assert.deepEqual(extractRelationIds({ connect: [{ documentId: 'a' }, 'b'] }), ['a', 'b']);
assert.deepEqual(extractRelationIds({ set: ['x'] }), ['x']);
assert.deepEqual(extractRelationIds(null), []);

assert.throws(() => assertMediaPayload({ blockType: 'image' }), /image or imageUrl/);
assert.doesNotThrow(() => assertMediaPayload({ blockType: 'image', imageUrl: '/assets/a.webp' }));
assert.throws(() => assertMediaPayload({ blockType: 'video' }), /video or videoUrl/);
assert.doesNotThrow(() =>
  assertMediaPayload({ blockType: 'video', videoUrl: '/assets/hero-video/a.mp4' })
);
assert.throws(() => assertMediaPayload({ blockType: 'text' }), /body/);
assert.throws(
  () => assertMediaPayload({ blockType: 'embed', embedUrl: 'https://youtube.com/watch?v=1' }),
  /WORK_EMBED_HOST_ALLOWLIST/
);

console.log('verify-work-rules-unit: OK');
