/**
 * Work Studio hub — cards deep-link into Content Manager for editing.
 */
import React from 'react';
import { WORK_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const WorkStudioPage = () => (
  <OpsPage
    title="Work Studio"
    lead="作品内容生命周期。点击卡片直接进入对应 Content Manager 编辑。对齐 build-work.mjs。"
  >
    <LinkGrid>
      {WORK_LINKS.map((link) => (
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

export default WorkStudioPage;
