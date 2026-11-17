import { getCmsConfig } from './config.js';
import { cacheClear } from './work-cache.js';

/**
 * Poll CMS work-cache-version; clear browser CMS cache when editors publish/unpublish.
 */
export function mountWorkCacheSync({ onInvalidate } = {}) {
  const config = getCmsConfig();
  if (!config.enabled) return { destroy() {} };

  let lastVersion = null;
  let timer = 0;
  let stopped = false;

  async function tick() {
    if (stopped) return;
    try {
      const url = `${config.baseUrl}/api/work-cache-version`;
      const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'omit' });
      if (!res.ok) return;
      const json = await res.json();
      const version = json?.data?.version;
      if (version == null) return;
      if (lastVersion == null) {
        lastVersion = version;
        return;
      }
      if (String(version) !== String(lastVersion)) {
        lastVersion = version;
        cacheClear();
        onInvalidate?.(version);
      }
    } catch {
      // offline / CORS — ignore
    }
  }

  const onFocus = () => tick();
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick();
  });
  tick();
  timer = setInterval(tick, 30_000);

  return {
    destroy() {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    },
  };
}
