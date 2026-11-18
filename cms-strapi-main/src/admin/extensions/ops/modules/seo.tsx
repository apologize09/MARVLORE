/**
 * 内容与 SEO hub — archived article models + page SEO.
 */
import React from 'react';
import { t } from '../../i18n';
import { SEO_LINKS } from '../routes';
import { LinkGrid, OpsLinkCard, OpsPage } from '../ui';

const SeoPage = () => (
  <OpsPage title={t('seo.title')} lead={t('seo.lead')}>
    <LinkGrid>
      {SEO_LINKS.map((link) => (
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

export default SeoPage;
