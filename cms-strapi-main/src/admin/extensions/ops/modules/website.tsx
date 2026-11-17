/** Website Management hub — maps to build-hero / about / services / contact. */
import React from 'react';
import { WEBSITE_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const WebsitePage = () => (
  <OpsPage
    title="Website Management"
    lead="官网前台模块内容。每个入口对应独立前端构建脚本（build-hero / build-about / build-services / build-contact），请按模块编辑，避免混写。"
  >
    <LinkGrid>
      {WEBSITE_LINKS.map((link) => (
        <OpsLinkCard
          key={link.to}
          to={link.to}
          label={link.label}
          hint={link.hint}
          module={link.module}
        />
      ))}
    </LinkGrid>
  </OpsPage>
);

export default WebsitePage;
