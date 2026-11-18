/**
 * Register six operator hubs (pack menu groups).
 * Flat sidebar links only — Strapi 5.52 has no nested menu API.
 */
import type { StrapiApp } from '@strapi/strapi/admin';
import {
  Briefcase,
  ChartBubble,
  CloudUpload,
  Earth,
  Feather,
  SlidersHorizontal,
} from '@strapi/icons';

export function registerOpsMenu(app: StrapiApp) {
  app.addMenuLink({
    to: '/ops/dashboard',
    icon: ChartBubble,
    intlLabel: {
      id: 'marvlore.ops.dashboard',
      defaultMessage: '工作台',
    },
    Component: () => import('./modules/dashboard'),
    permissions: [],
    position: 1,
  });

  app.addMenuLink({
    to: '/ops/website',
    icon: Earth,
    intlLabel: {
      id: 'marvlore.ops.website',
      defaultMessage: '官网内容管理',
    },
    Component: () => import('./modules/website'),
    permissions: [],
    position: 2,
  });

  app.addMenuLink({
    to: '/ops/work',
    icon: Briefcase,
    intlLabel: {
      id: 'marvlore.ops.work',
      defaultMessage: '作品案例管理',
    },
    Component: () => import('./modules/work-studio'),
    permissions: [],
    position: 3,
  });

  app.addMenuLink({
    to: '/ops/media',
    icon: CloudUpload,
    intlLabel: {
      id: 'marvlore.ops.media',
      defaultMessage: '媒体资源管理',
    },
    Component: () => import('./modules/media'),
    permissions: [],
    position: 4,
  });

  app.addMenuLink({
    to: '/ops/seo',
    icon: Feather,
    intlLabel: {
      id: 'marvlore.ops.seo',
      defaultMessage: '内容与 SEO',
    },
    Component: () => import('./modules/seo'),
    permissions: [],
    position: 5,
  });

  app.addMenuLink({
    to: '/ops/system',
    icon: SlidersHorizontal,
    intlLabel: {
      id: 'marvlore.ops.system',
      defaultMessage: '系统设置',
    },
    Component: () => import('./modules/system'),
    permissions: [],
    position: 7,
  });
}
