/**
 * Website Management hub — cards deep-link into Content Manager for editing.
 * Module badges stay aligned with build-hero / about / services / contact.
 */
import React from 'react';
import { t } from '../../i18n';
import { WEBSITE_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const WebsitePage = () => (
  <OpsPage title={t('website.title')} lead={t('website.lead')}>
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
