/**
 * Ops Dashboard — content counts for operators.
 * Modular: does not pull Work/Website edit UIs into one controller.
 */
import React, { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
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
  }, [get]);

  return (
    <OpsPage
      title="Dashboard"
      lead="内容概览：按官网模块统计已发布条目与媒体库用量。编辑请从 Website Management / Work Studio 进入，保持与前端 build-*.mjs 相同的模块边界。"
    >
      <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>内容统计</h2>
      <LinkGrid>
        {DASHBOARD_STATS.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={loading ? '…' : (counts[stat.key] ?? '—')}
            to={
              stat.key === 'work'
                ? '/ops/work/projects'
                : `/ops/website/${stat.key === 'services' ? 'services' : stat.key}`
            }
          />
        ))}
        <StatCard label="媒体库文件" value={loading ? '…' : mediaCount} to="/plugins/upload" />
      </LinkGrid>

      <h2 style={{ margin: '28px 0 12px', fontSize: 16 }}>快捷入口</h2>
      <LinkGrid>
        <StatCard label="Website Management" value="→" to="/ops/website" />
        <StatCard label="Work Studio" value="→" to="/ops/work" />
        <StatCard label="Media Library" value="→" to="/ops/media" />
        <StatCard label="System" value="→" to="/ops/system" />
      </LinkGrid>
    </OpsPage>
  );
};

export default DashboardPage;
