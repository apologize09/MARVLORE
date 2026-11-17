/** Work Studio hub — maps to build-work.mjs pipeline. */
import React from 'react';
import { WORK_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const WorkStudioPage = () => (
  <OpsPage
    title="Work Studio"
    lead="作品运营台：总览 → 分类 / 标签 → 作品 → 详情媒体。与前端 build-work.mjs 同一边界，请勿把作品详情逻辑塞进通用页面控制器。"
  >
    <LinkGrid>
      {WORK_LINKS.map((link) => (
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

export default WorkStudioPage;
