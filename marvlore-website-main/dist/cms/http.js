/**
 * Safe GET helper with timeout + single retry for network failures.
 */
export async function cmsGet(url, { timeoutMs = 6000, retries = 1 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      });
      clearTimeout(timer);
      if (!res.ok) {
        const err = new Error(`CMS HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const retryable =
        attempt < retries &&
        (err.name === 'AbortError' || err.name === 'TypeError' || (err.status >= 500 && err.status <= 599));
      if (!retryable) throw err;
    }
  }
  throw lastError;
}
