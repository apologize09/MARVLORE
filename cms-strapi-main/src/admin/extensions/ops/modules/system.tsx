/** System hub — users, roles, locales, API permissions, app settings. */
import React from 'react';
import { t } from '../../i18n';
import { SYSTEM_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const SystemPage = () => (
  <OpsPage title={t('system.title')} lead={t('system.lead')}>
    <LinkGrid>
      {SYSTEM_LINKS.map((link) => (
        <OpsLinkCard key={link.to} to={link.to} label={link.label} hint={link.hint} />
      ))}
    </LinkGrid>
  </OpsPage>
);

export default SystemPage;
