/**
 * Website Management hub — cards deep-link into Content Manager for editing.
 * Module badges stay aligned with build-hero / about / services / contact.
 */
import React from 'react';
import { WEBSITE_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const WebsitePage = () => (
  <OpsPage
    title="Website Management"
    lead="官网前台模块内容。点击卡片直接进入对应 Content Manager 编辑。每个入口对齐 build-hero / about / services / contact。"
  >
    <LinkGrid>
      {WEBSITE_LINKS.map((link) => (
        <OpsLinkCard
          key={link.slug}
          to={link.cmTo}
          label={link.label}
          hint={link.hint}
          module={link.module}
        />
      ))}
    </LinkGrid>
  </OpsPage>
);

export default WebsitePage;
