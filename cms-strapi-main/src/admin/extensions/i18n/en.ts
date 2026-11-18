import type { OpsDict } from './types';

export const en: OpsDict = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    refresh: 'Refresh',
    back: 'Back',
    confirm: 'Confirm',
    loading: 'Loading…',
    success: 'Success',
    failed: 'Failed',
    published: 'Published',
    draft: 'Draft',
  },
  navigation: {
    dashboard: 'Dashboard',
    website: 'Website',
    work: 'Work Studio',
    media: 'Media',
    seo: 'Content & SEO',
    system: 'System',
  },
  dashboard: {
    title: 'Dashboard',
    lead: 'Content overview by site module. Use the six ops hubs in the sidebar.',
    stats: 'Stats',
    shortcuts: 'Shortcuts',
    mediaFiles: 'Media files',
  },
  website: {
    title: 'Website',
    lead: 'Homepage modules. Cards open Content Manager editors.',
  },
  work: {
    title: 'Work Studio',
    lead: 'Projects, categories, tags, channel page, and detail media.',
  },
  media: {
    title: 'Media',
    lead: 'Media Library hubs. Site sync stays CLI-only (no admin entry).',
  },
  seo: {
    title: 'Content & SEO',
    lead: 'Archived article models and page SEO entries.',
  },
  system: {
    title: 'System',
    lead: 'Users, roles, locales, and API permissions.',
  },
};
