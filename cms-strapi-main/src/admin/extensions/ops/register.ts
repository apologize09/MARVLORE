/**
 * Register operator menu (Dashboard / Website / Work / Media / System).
 * Each section is a separate module page — do not collapse into one mega-controller.
 */
import type { StrapiApp } from '@strapi/strapi/admin';
import {
  Briefcase,
  ChartBubble,
  Cog,
  Earth,
  Images,
} from '@strapi/icons';

export function registerOpsMenu(app: StrapiApp) {
  app.addMenuLink({
    to: '/ops/dashboard',
    icon: ChartBubble,
    intlLabel: {
      id: 'marvlore.ops.dashboard',
      defaultMessage: 'Dashboard',
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
      defaultMessage: 'Website Management',
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
      defaultMessage: 'Work Studio',
    },
    Component: () => import('./modules/work-studio'),
    permissions: [],
    position: 3,
  });

  app.addMenuLink({
    to: '/ops/media',
    icon: Images,
    intlLabel: {
      id: 'marvlore.ops.media',
      defaultMessage: 'Media Library',
    },
    Component: () => import('./modules/media'),
    permissions: [],
    position: 4,
  });

  app.addMenuLink({
    to: '/ops/system',
    icon: Cog,
    intlLabel: {
      id: 'marvlore.ops.system',
      defaultMessage: 'System',
    },
    Component: () => import('./modules/system'),
    permissions: [],
    position: 7,
  });
}
