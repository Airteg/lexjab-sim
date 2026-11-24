import { SIM_VERSION } from '@lexjab/sim';

/**
 * Site build number: the 4th digit of the version shown in the header (e.g. 0.2.1.1).
 * Bump it in every PR that changes apps/web; reset it to 0 when SIM_VERSION changes.
 */
export const SITE_BUILD = 1;

export const SITE_VERSION = `${SIM_VERSION}.${SITE_BUILD}`;

/** Build stamp set by the Pages workflow (.github/workflows/pages.yml); empty in local builds. */
const env = import.meta.env as Record<string, string | undefined>;
export const BUILD_SHA = (env.VITE_BUILD_SHA ?? '').slice(0, 7);
export const BUILD_TIME = env.VITE_BUILD_TIME ?? '';

export function buildStamp(): string {
  if (!BUILD_TIME) return 'локально';
  const t = new Date(BUILD_TIME);
  const when = Number.isNaN(t.getTime())
    ? ''
    : t.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return [when, BUILD_SHA].filter(Boolean).join(' · ');
}
