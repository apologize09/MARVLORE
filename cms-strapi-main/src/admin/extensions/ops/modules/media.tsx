/** 媒体资源管理 — cards deep-link into Media Library. */
import React from 'react';
import { t } from '../../i18n';
import { MEDIA_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const MediaPage = () => (
  <OpsPage title={t('media.title')} lead={t('media.lead')}>
    <LinkGrid>
      {MEDIA_LINKS.map((link) => (
        <OpsLinkCard key={`${link.label}-${link.to}`} to={link.to} label={link.label} hint={link.hint} />
      ))}
    </LinkGrid>
  </OpsPage>
);

export default MediaPage;
