/** Media Library hub — upload / preview / replace workflow for operators. */
import React from 'react';
import { t } from '../../i18n';
import { MEDIA_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const MediaPage = () => (
  <OpsPage title={t('media.title')} lead={t('media.lead')}>
    <LinkGrid>
      {MEDIA_LINKS.map((link) => (
        <OpsLinkCard key={link.to} to={link.to} label={link.label} hint={link.hint} />
      ))}
      <OpsLinkCard
        to="/plugins/upload?sort=createdAt:DESC"
        label="图片与视频"
        hint="按时间浏览全部上传文件"
      />
      <OpsLinkCard
        to="/plugins/upload"
        label="文件夹"
        hint="在媒体库中按文件夹整理（如 marvlore-site）"
      />
    </LinkGrid>
  </OpsPage>
);

export default MediaPage;
