/**
 * Website Management — hub + in-place section browser (no jump to Content Manager).
 * Nested under /ops/website/* to keep modular boundaries with build-*.mjs.
 */
import React from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { WEBSITE_LINKS, type ContentLink } from '../routes';
import { ContentPanel } from '../content-panel';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const tabRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  margin: '0 0 18px',
};

const tabBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid #dcdce4',
  textDecoration: 'none',
  color: '#32324d',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
};

function SectionTabs({ current }: { current: string }) {
  return (
    <nav style={tabRow} aria-label="Website sections">
      {WEBSITE_LINKS.map((link) => {
        const active = link.slug === current;
        return (
          <Link
            key={link.slug}
            to={`/ops/website/${link.slug}`}
            style={{
              ...tabBase,
              borderColor: active ? '#4945ff' : '#dcdce4',
              background: active ? '#f0f0ff' : '#fff',
              color: active ? '#271fe0' : '#32324d',
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function WebsiteHub() {
  return (
    <OpsPage
      title="Website Management"
      lead="官网前台模块内容。点击卡片后在本页浏览条目；点「编辑 / 打开编辑器」进入 Content Manager 修改字段。每个入口对齐 build-hero / about / services / contact。"
    >
      <LinkGrid>
        {WEBSITE_LINKS.map((link) => (
          <OpsLinkCard
            key={link.slug}
            to={`/ops/website/${link.slug}`}
            label={link.label}
            hint={link.hint}
            module={link.module}
          />
        ))}
      </LinkGrid>
    </OpsPage>
  );
}

function WebsiteSection() {
  const { section } = useParams<{ section: string }>();
  const link: ContentLink | undefined = WEBSITE_LINKS.find((item) => item.slug === section);

  if (!link) {
    return <Navigate to="/ops/website" replace />;
  }

  return (
    <OpsPage title={`Website Management · ${link.label}`} lead={link.hint}>
      <div style={{ marginBottom: 14 }}>
        <Link to="/ops/website" style={{ fontSize: 13, color: '#4945ff', textDecoration: 'none' }}>
          ← 返回模块列表
        </Link>
      </div>
      <SectionTabs current={link.slug} />
      <ContentPanel uid={link.uid} kind={link.kind} />
    </OpsPage>
  );
}

const WebsitePage = () => (
  <Routes>
    <Route index element={<WebsiteHub />} />
    <Route path=":section" element={<WebsiteSection />} />
  </Routes>
);

export default WebsitePage;
