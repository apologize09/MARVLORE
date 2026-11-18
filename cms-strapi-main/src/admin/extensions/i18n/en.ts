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
    website: 'Website Management',
    work: 'Work Studio',
    media: 'Media Library',
    system: 'System',
  },
  dashboard: {
    title: 'Dashboard',
    lead: 'Content overview by site module. Edit via Website Management / Work Studio to keep the same boundaries as frontend build-*.mjs.',
    stats: 'Stats',
    shortcuts: 'Shortcuts',
    mediaFiles: 'Media files',
  },
  website: {
    title: 'Website Management',
    lead: 'Homepage module content. Cards open Content Manager editors aligned with build-hero / about / services / contact.',
  },
  work: {
    title: 'Work Studio',
    lead: 'Work content lifecycle. Cards open Content Manager editors aligned with build-work.mjs.',
  },
  media: {
    title: 'Media Library',
    lead: 'Upload, preview, and replace images and videos used by content entries.',
  },
  system: {
    title: 'System',
    lead: 'Users, roles, locales, and API permissions. Prefer Website / Work hubs for day-to-day content work.',
  },
};
