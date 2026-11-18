/**
 * Lightweight unit checks for pure work-rules helpers.
 * Requires prior `pnpm build` (reads dist/src/utils/work-rules.js).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  extractRelationIds,
  isRelationNoop,
  assertMediaPayload,
  assertCategoryPayload,
} = require('../dist/src/utils/work-rules.js');

assert.deepEqual(extractRelationIds('abc'), ['abc']);
assert.deepEqual(extractRelationIds({ documentId: 'd1' }), ['d1']);
assert.deepEqual(extractRelationIds({ connect: [{ documentId: 'a' }, 'b'] }), ['a', 'b']);
assert.deepEqual(extractRelationIds({ set: ['x'] }), ['x']);
assert.deepEqual(extractRelationIds(null), []);

assert.equal(isRelationNoop(null), true);
assert.equal(isRelationNoop({ connect: [], disconnect: [] }), true);
assert.equal(isRelationNoop({ set: [] }), false);
assert.equal(isRelationNoop({ connect: [{ documentId: 'p1' }], disconnect: [] }), false);

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

// CM partial save: empty parent connect/disconnect must keep existing L2 parent
const fakeStrapi = {
  db: { query: async () => null },
  documents: () => ({
    findOne: async () => ({ documentId: 'parent-l1', level: 1, isActive: true }),
  }),
};
await assert.doesNotReject(() =>
  assertCategoryPayload(
    fakeStrapi,
    { level: 2, parent: { connect: [], disconnect: [] } },
    { level: 2, parent: { documentId: 'parent-l1' } }
  )
);
await assert.rejects(
  () => assertCategoryPayload(fakeStrapi, { level: 2, parent: { connect: [], disconnect: [] } }, { level: 2 }),
  /exactly one parent/
);

console.log('verify-work-rules-unit: OK');
