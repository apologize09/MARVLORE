import { en } from './en';
import { zhCN } from './zh-CN';
import { strapiNativeZhHans } from './strapi-native-zh-Hans';
import type { OpsDict, OpsKey } from './types';

export type { OpsDict, OpsKey };
export { en, zhCN, strapiNativeZhHans };

const STORAGE_KEY = 'strapi-admin-language';

function readAdminLocale(): string {
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(STORAGE_KEY) || 'zh-Hans';
    }
  } catch {
    // ignore
  }
  return 'zh-Hans';
}

function resolveDict(locale: string): OpsDict {
  if (locale === 'en' || locale.startsWith('en')) return en;
  return zhCN;
}

/** Typed lookup for custom ops pages. Falls back to key string in development. */
export function t(key: OpsKey): string {
  const dict = resolveDict(readAdminLocale());
  const [ns, leaf] = key.split('.') as [keyof OpsDict, string];
  const group = dict[ns] as Record<string, string> | undefined;
  const value = group?.[leaf];
  if (value == null) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[marvlore-i18n] missing key: ${key}`);
    }
    return key;
  }
  return value;
}

/** Flat Strapi `config.translations` payload for app.tsx */
export function nativeAdminTranslations() {
  return {
    'zh-Hans': { ...strapiNativeZhHans },
  } as Record<string, Record<string, string>>;
}
