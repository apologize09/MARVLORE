/**
 * In-hub content browser — list/preview in ops modules; edit opens Content Manager.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchClient } from '@strapi/strapi/admin';
import type { ContentKind } from './routes';

type Row = Record<string, unknown> & {
  id?: number | string;
  documentId?: string;
  title?: string;
  name?: string;
  brandName?: string;
  question?: string;
  metaTitle?: string;
  slug?: string;
  locale?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

const TITLE_KEYS = ['title', 'name', 'brandName', 'question', 'metaTitle', 'slug', 'documentId'] as const;

const panelStyle: React.CSSProperties = {
  marginTop: 8,
  border: '1px solid #dcdce4',
  borderRadius: 12,
  background: '#fff',
  overflow: 'hidden',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  borderBottom: '1px solid #eaeaef',
  color: '#666687',
  fontWeight: 600,
  background: '#fafafa',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #f0f0f5',
  verticalAlign: 'top',
};

const muted: React.CSSProperties = { color: '#666687', fontSize: 13 };

const primaryBtn: React.CSSProperties = {
  display: 'inline-block',
  padding: '8px 14px',
  borderRadius: 8,
  background: '#4945ff',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  border: 'none',
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-block',
  padding: '8px 14px',
  borderRadius: 8,
  background: '#fff',
  color: '#271fe0',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  border: '1px solid #d9d8ff',
};

function pickTitle(row: Row): string {
  for (const key of TITLE_KEYS) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return `#${row.id ?? '—'}`;
}

function statusLabel(row: Row): string {
  if (row.publishedAt) return '已发布';
  return '草稿';
}

function formatWhen(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return value;
  }
}

function flattenFields(row: Row): Array<[string, string]> {
  const skip = new Set([
    'id',
    'documentId',
    'createdBy',
    'updatedBy',
    'localizations',
    'createdAt',
    'updatedAt',
    'publishedAt',
    'locale',
  ]);
  return Object.entries(row)
    .filter(([key, value]) => !skip.has(key) && value != null && typeof value !== 'object')
    .slice(0, 24)
    .map(([key, value]) => [key, String(value)]);
}

function editPath(uid: string, kind: ContentKind, row?: Row | null): string {
  if (kind === 'single') {
    return `/content-manager/single-types/${uid}`;
  }
  const documentId = row?.documentId;
  if (documentId) {
    return `/content-manager/collection-types/${uid}/${documentId}`;
  }
  return `/content-manager/collection-types/${uid}`;
}

function createPath(uid: string): string {
  return `/content-manager/collection-types/${uid}/create`;
}

export function ContentPanel({
  uid,
  kind,
}: {
  uid: string;
  kind: ContentKind;
}) {
  const { get } = useFetchClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setSelectedId(null);
      try {
        if (kind === 'collection') {
          const res = await get(`/content-manager/collection-types/${uid}`, {
            params: { page: 1, pageSize: 25, locale: 'zh-CN' },
          });
          const body = (res as { data?: unknown })?.data ?? res;
          const results = ((body as { results?: Row[] })?.results ?? []) as Row[];
          const pagination = (body as { pagination?: { total?: number } })?.pagination;
          if (!cancelled) {
            setRows(results);
            setTotal(Number(pagination?.total ?? results.length));
            if (results[0]?.documentId ?? results[0]?.id) {
              setSelectedId((results[0].documentId ?? results[0].id) as string | number);
            }
          }
        } else {
          const res = await get(`/content-manager/single-types/${uid}`, {
            params: { locale: 'zh-CN' },
          });
          const body = ((res as { data?: unknown })?.data ?? res) as Row;
          const doc = (body?.documentId ? body : (body as { data?: Row })?.data) ?? body;
          if (!cancelled) {
            setRows(doc && (doc.documentId || doc.id) ? [doc as Row] : []);
            setTotal(doc && (doc.documentId || doc.id) ? 1 : 0);
            if (doc?.documentId ?? doc?.id) {
              setSelectedId((doc.documentId ?? doc.id) as string | number);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setTotal(0);
          setError(err instanceof Error ? err.message : '加载失败');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, kind]);

  const selected = useMemo(
    () =>
      rows.find((row) => row.documentId === selectedId || row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const selectedEditTo = editPath(uid, kind, selected);

  return (
    <div style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid #eaeaef',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          {kind === 'collection' ? '条目列表' : '单页内容'}
          <span style={{ ...muted, marginLeft: 10, fontWeight: 400 }}>
            {loading ? '加载中…' : `共 ${total} 条`}
          </span>
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {kind === 'collection' ? (
            <Link to={createPath(uid)} style={secondaryBtn}>
              + 新建
            </Link>
          ) : null}
          <Link to={selectedEditTo} style={primaryBtn}>
            {kind === 'single' ? '编辑此页' : '编辑选中条目'}
          </Link>
        </div>
      </div>

      {error ? (
        <p style={{ ...muted, padding: 16 }}>无法加载：{error}</p>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <div style={{ padding: 16 }}>
          <p style={{ ...muted, marginTop: 0 }}>暂无内容。</p>
          {kind === 'collection' ? (
            <Link to={createPath(uid)} style={primaryBtn}>
              + 创建第一条
            </Link>
          ) : (
            <Link to={editPath(uid, 'single')} style={primaryBtn}>
              打开编辑器创建
            </Link>
          )}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: kind === 'collection' ? 'minmax(280px, 1.1fr) minmax(280px, 1fr)' : '1fr',
            minHeight: 240,
          }}
        >
          {kind === 'collection' ? (
            <div style={{ borderRight: '1px solid #eaeaef', maxHeight: 480, overflow: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>标题</th>
                    <th style={thStyle}>状态</th>
                    <th style={thStyle}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const key = (row.documentId ?? row.id) as string | number;
                    const active = key === selectedId;
                    const rowEdit = editPath(uid, 'collection', row);
                    return (
                      <tr
                        key={String(key)}
                        onClick={() => setSelectedId(key)}
                        style={{
                          cursor: 'pointer',
                          background: active ? '#f0f0ff' : undefined,
                        }}
                      >
                        <td style={tdStyle}>{pickTitle(row)}</td>
                        <td style={tdStyle}>{statusLabel(row)}</td>
                        <td style={tdStyle}>
                          <Link
                            to={rowEdit}
                            onClick={(event) => event.stopPropagation()}
                            style={{ color: '#4945ff', fontWeight: 600, textDecoration: 'none' }}
                          >
                            编辑
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          <div style={{ padding: 16, maxHeight: 480, overflow: 'auto' }}>
            {selected ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'flex-start',
                    marginBottom: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>
                      {pickTitle(selected)}
                    </p>
                    <p style={{ ...muted, margin: 0 }}>
                      {statusLabel(selected)} · {selected.locale || '—'} · 更新于{' '}
                      {formatWhen(selected.updatedAt)}
                    </p>
                  </div>
                  <Link to={selectedEditTo} style={primaryBtn}>
                    打开编辑器
                  </Link>
                </div>
                <p style={{ ...muted, margin: '0 0 12px' }}>
                  下方为只读预览；修改字段请点「打开编辑器 / 编辑」。
                </p>
                <dl style={{ margin: 0, display: 'grid', gap: 10 }}>
                  {flattenFields(selected).map(([key, value]) => (
                    <div key={key}>
                      <dt style={{ ...muted, marginBottom: 2 }}>{key}</dt>
                      <dd style={{ margin: 0, fontSize: 14, wordBreak: 'break-word' }}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <p style={muted}>{loading ? '加载中…' : '选择左侧条目查看详情'}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
