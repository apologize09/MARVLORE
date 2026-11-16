/**
 * Public Work category routes
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/work-categories/tree',
      handler: 'work-category.tree',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/work-categories/slug/:slug',
      handler: 'work-category.findBySlug',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
