/**
 * Public Work project routes (loaded before core router so /featured wins over /:id)
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/work-projects/featured',
      handler: 'work-project.featured',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/work-projects/related/:documentId',
      handler: 'work-project.related',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/work-projects/slug/:slug',
      handler: 'work-project.findBySlug',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/work-search',
      handler: 'work-project.search',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
