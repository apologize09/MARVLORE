const store = new Map();

function keyOf(parts) {
  return parts.map((p) => String(p ?? '')).join('|');
}

export function cacheGet(parts) {
  const key = keyOf(parts);
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expiresAt && Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function cacheSet(parts, value, ttlMs = 60_000) {
  store.set(keyOf(parts), { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function cacheClear() {
  store.clear();
}
