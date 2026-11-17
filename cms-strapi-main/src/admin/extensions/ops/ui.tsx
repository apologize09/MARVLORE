import React from 'react';
import { Link } from 'react-router-dom';

const pageStyle: React.CSSProperties = {
  padding: '32px 40px 48px',
  maxWidth: 1080,
  margin: '0 auto',
  color: '#212134',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: '-0.02em',
};

const leadStyle: React.CSSProperties = {
  margin: '0 0 28px',
  fontSize: 15,
  lineHeight: 1.55,
  color: '#666687',
  maxWidth: 640,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 14,
};

const cardStyle: React.CSSProperties = {
  display: 'block',
  padding: '18px 18px 16px',
  borderRadius: 12,
  border: '1px solid #dcdce4',
  background: '#fff',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
};

const cardLabelStyle: React.CSSProperties = {
  margin: '0 0 6px',
  fontSize: 16,
  fontWeight: 600,
};

const cardHintStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.45,
  color: '#666687',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: '#f0f0ff',
  color: '#4945ff',
};

const hoverHandlers = {
  onMouseEnter: (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.borderColor = '#4945ff';
    event.currentTarget.style.boxShadow = '0 4px 16px rgba(33, 33, 52, 0.08)';
  },
  onMouseLeave: (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.borderColor = '#dcdce4';
    event.currentTarget.style.boxShadow = 'none';
  },
};

export function OpsPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>{title}</h1>
      <p style={leadStyle}>{lead}</p>
      {children}
    </main>
  );
}

export function LinkGrid({ children }: { children: React.ReactNode }) {
  return <div style={gridStyle}>{children}</div>;
}

export function OpsLinkCard({
  to,
  label,
  hint,
  module,
}: {
  to: string;
  label: string;
  hint: string;
  module?: string;
}) {
  return (
    <Link to={to} style={cardStyle} {...hoverHandlers}>
      <p style={cardLabelStyle}>{label}</p>
      <p style={cardHintStyle}>{hint}</p>
      {module ? <span style={badgeStyle}>build-{module}</span> : null}
    </Link>
  );
}

export function StatCard({
  label,
  value,
  to,
}: {
  label: string;
  value: string | number;
  to?: string;
}) {
  const inner = (
    <>
      <p style={{ ...cardHintStyle, marginBottom: 8 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em' }}>{value}</p>
    </>
  );
  if (!to) {
    return <div style={cardStyle}>{inner}</div>;
  }
  return (
    <Link to={to} style={cardStyle} {...hoverHandlers}>
      {inner}
    </Link>
  );
}
