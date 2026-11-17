/** System hub — users, roles, locales, API permissions, app settings. */
import React from 'react';
import { SYSTEM_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const SystemPage = () => (
  <OpsPage
    title="System"
    lead="账号、角色、语言与 API 权限。日常内容运营请优先使用 Website Management / Work Studio，系统项留给管理员。"
  >
    <LinkGrid>
      {SYSTEM_LINKS.map((link) => (
        <OpsLinkCard key={link.to} to={link.to} label={link.label} hint={link.hint} />
      ))}
    </LinkGrid>
  </OpsPage>
);

export default SystemPage;
