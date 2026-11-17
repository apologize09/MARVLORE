/**
 * Work Studio — hub + in-place section browser (aligned with Website Management UX).
 */
import React from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { WORK_LINKS, type ContentLink } from '../routes';
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
    <nav style={tabRow} aria-label="Work Studio sections">
      {WORK_LINKS.map((link) => {
        const active = link.slug === current;
        return (
          <Link
            key={link.slug}
            to={`/ops/work/${link.slug}`}
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

function WorkHub() {
  return (
    <OpsPage
      title="Work Studio"
      lead="作品内容生命周期。点击卡片后在本页查看对应内容（不跳转 Content Manager），对齐 build-work.mjs。"
    >
      <LinkGrid>
        {WORK_LINKS.map((link) => (
          <OpsLinkCard
            key={link.slug}
            to={`/ops/work/${link.slug}`}
            label={link.label}
            hint={link.hint}
            module={link.module}
          />
        ))}
      </LinkGrid>
    </OpsPage>
  );
}

function WorkSection() {
  const { section } = useParams<{ section: string }>();
  const link: ContentLink | undefined = WORK_LINKS.find((item) => item.slug === section);

  if (!link) {
    return <Navigate to="/ops/work" replace />;
  }

  return (
    <OpsPage title={`Work Studio · ${link.label}`} lead={link.hint}>
      <div style={{ marginBottom: 14 }}>
        <Link to="/ops/work" style={{ fontSize: 13, color: '#4945ff', textDecoration: 'none' }}>
          ← 返回模块列表
        </Link>
      </div>
      <SectionTabs current={link.slug} />
      <ContentPanel uid={link.uid} kind={link.kind} />
    </OpsPage>
  );
}

const WorkStudioPage = () => (
  <Routes>
    <Route index element={<WorkHub />} />
    <Route path=":section" element={<WorkSection />} />
  </Routes>
);

export default WorkStudioPage;
