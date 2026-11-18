/**
 * Ops Dashboard — content counts for operators.
 * Modular: does not pull Work/Website edit UIs into one controller.
 */
import React, { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { t } from '../../i18n';
import { DASHBOARD_STATS } from '../routes';
import { LinkGrid, OpsPage, StatCard } from '../ui';

type Counts = Record<string, number | '—'>;

async function fetchCollectionTotal(
  get: (url: string, opts?: object) => Promise<{ data: unknown }>,
  uid: string,
): Promise<number> {
  const res = await get(`/content-manager/collection-types/${uid}`, {
    params: { page: 1, pageSize: 1, locale: 'zh-CN' },
  });
  // Strapi 5 CM list: { results, pagination: { total } } (sometimes nested under data)
  const body = (res as { data?: unknown })?.data ?? res;
  const pagination = (body as { pagination?: { total?: number } })?.pagination;
  return Number(pagination?.total ?? 0);
}

const DashboardPage = () => {
  const { get } = useFetchClient();
  const [counts, setCounts] = useState<Counts>({});
  const [mediaCount, setMediaCount] = useState<number | '—'>('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Counts = {};
      await Promise.all(
        DASHBOARD_STATS.map(async (stat) => {
          try {
            next[stat.key] = await fetchCollectionTotal(get, stat.uid);
          } catch {
            next[stat.key] = '—';
          }
        }),
      );
      try {
        const files = await get('/upload/files', { params: { page: 1, pageSize: 1 } });
        const total =
          (files?.data as { pagination?: { total?: number } })?.pagination?.total ??
          (Array.isArray((files as { data?: unknown })?.data)
            ? ((files as { data: unknown[] }).data.length)
            : null);
        if (!cancelled) setMediaCount(total == null ? '—' : Number(total));
      } catch {
        if (!cancelled) setMediaCount('—');
      }
      if (!cancelled) {
        setCounts(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // intentionally once on mount — `get` identity can change every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OpsPage
      title={t('dashboard.title')}
      lead={t('dashboard.lead')}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>{t('dashboard.stats')}</h2>
      <LinkGrid>
        {DASHBOARD_STATS.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={loading ? '…' : (counts[stat.key] ?? '—')}
            to={`/content-manager/collection-types/${stat.uid}`}
          />
        ))}
        <StatCard label={t('dashboard.mediaFiles')} value={loading ? '…' : mediaCount} to="/plugins/upload" />
      </LinkGrid>

      <h2 style={{ margin: '28px 0 12px', fontSize: 16 }}>{t('dashboard.shortcuts')}</h2>
      <LinkGrid>
        <StatCard label={t('navigation.website')} value="→" to="/ops/website" />
        <StatCard label={t('navigation.work')} value="→" to="/ops/work" />
        <StatCard label={t('navigation.media')} value="→" to="/ops/media" />
        <StatCard label={t('navigation.seo')} value="→" to="/ops/seo" />
        <StatCard label={t('navigation.system')} value="→" to="/ops/system" />
      </LinkGrid>
    </OpsPage>
  );
};

export default DashboardPage;
