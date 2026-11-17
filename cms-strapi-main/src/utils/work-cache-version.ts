/**
 * In-process Work public cache generation. Bumped on Work document writes so
 * clients / CDN can invalidate without storing secrets in the browser.
 */
let version = Date.now();

export function getWorkCacheVersion() {
  return version;
}

export function bumpWorkCacheVersion(reason?: string) {
  version = Date.now();
  return { version, reason: reason || null };
}
