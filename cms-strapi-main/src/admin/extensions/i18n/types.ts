export type OpsDict = {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    search: string;
    refresh: string;
    back: string;
    confirm: string;
    loading: string;
    success: string;
    failed: string;
    published: string;
    draft: string;
  };
  navigation: {
    dashboard: string;
    website: string;
    work: string;
    media: string;
    seo: string;
    system: string;
  };
  dashboard: {
    title: string;
    lead: string;
    stats: string;
    shortcuts: string;
    mediaFiles: string;
  };
  website: {
    title: string;
    lead: string;
  };
  work: {
    title: string;
    lead: string;
  };
  media: {
    title: string;
    lead: string;
  };
  seo: {
    title: string;
    lead: string;
  };
  system: {
    title: string;
    lead: string;
  };
};

export type OpsKey =
  | `common.${keyof OpsDict['common']}`
  | `navigation.${keyof OpsDict['navigation']}`
  | `dashboard.${keyof OpsDict['dashboard']}`
  | `website.${keyof OpsDict['website']}`
  | `work.${keyof OpsDict['work']}`
  | `media.${keyof OpsDict['media']}`
  | `seo.${keyof OpsDict['seo']}`
  | `system.${keyof OpsDict['system']}`;
