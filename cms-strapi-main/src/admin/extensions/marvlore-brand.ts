/** Replace visible Strapi product branding with MARVLORE in the admin UI. */
export const BRAND = 'MARVLORE';

/** Shared overrides for admin + plugin translation keys (zh-Hans + en). */
export const marvloreBrandTranslations = {
  'zh-Hans': {
    'Auth.form.button.login.strapi': `通过${BRAND}登录`,
    'Auth.form.register.subtitle': `凭证仅用于在${BRAND}中进行身份验证。所有保存的数据都将存储在您的数据库中。`,
    'Auth.form.welcome.subtitle': `登录您的${BRAND}账户`,
    'Auth.form.welcome.title': `欢迎使用${BRAND}!`,
    'HomePage.welcome.congrats.content': `您已登录为第一个管理员。为了发现${BRAND}提供的强大功能,`,
    'Settings.application.strapi-version': `${BRAND}版本`,
    'Settings.application.strapiVersion': `${BRAND}版本`,
    'Settings.permissions.users.listview.header.subtitle': `所有能够访问${BRAND}管理面板的用户`,
    'app.components.BlockLink.blog.content': `阅读关于${BRAND}和生态系统的最新新闻。`,
    'app.components.BlockLink.cloud': `${BRAND}云`,
    'app.components.BlockLink.tutorial.content': `按照步骤说明使用和自定义${BRAND}。`,
    'app.components.HomePage.welcomeBlock.content': `恭喜您!您已登录为第一个管理员。为了发现${BRAND}提供的强大功能,我们建议您创建您的第一个内容类型!`,
    'app.components.HomePage.welcomeBlock.content.again': `我们希望您在项目上取得进展!请随时阅读关于${BRAND}的最新新闻。我们正根据您的反馈尽最大努力改进产品。`,
    'app.components.LeftMenu.navbrand.title': BRAND,
    'app.components.LeftMenu.navbrand.workplace': '工作区',
    'components.AutoReloadBlocker.description': `使用以下命令之一运行${BRAND}:`,
    'global.plugins.sentry.description': `将 ${BRAND} 错误事件发送到 Sentry。`,
    'notification.ee.warning.over-.message':
      '添加座位以 {licenseLimitStatus, select, OVER_LIMIT {邀请} AT_LIMIT {重新启用}} 用户。如果您已经这样做,但系统尚未反映出来,请确保重新启动您的应用程序。',
    'notification.version.update.message': `有新版本的${BRAND}可用!`,
    // Content-Type Builder AI chat
    'chat.input.defaults.strapi': `告诉我关于 ${BRAND}`,
    'chat.input.thinking': `${BRAND} AI 正在思考...`,
    'chat.input.placeholder': `询问 ${BRAND} AI...`,
    'chat.input.strapi-ai-can-make-errors': `${BRAND} AI 可能会出错。`,
    'notification.info.autoreaload-disable':
      '启用这个扩展模块需要重新启动，请使用开发模式命令重新启动',
    // i18n plugin
    'Settings.list.empty.description': `这不是一个常规的动作，您动手修改了数据库。为了能正确使用${BRAND}，请确保至少保存一种语言在您的数据库中`,
  },
  en: {
    'Auth.form.button.login.strapi': `Log in via ${BRAND}`,
    'Auth.form.register.subtitle': `Credentials are only used to authenticate in ${BRAND}. All saved data will be stored in your database.`,
    'Auth.form.welcome.subtitle': `Log in to your ${BRAND} account`,
    'Auth.form.welcome.title': `Welcome to ${BRAND}!`,
    'Settings.application.strapi-version': `${BRAND} version`,
    'Settings.application.strapiVersion': `${BRAND} version`,
    'Settings.permissions.users.listview.header.subtitle': `All the users who have access to the ${BRAND} admin panel`,
    'app.components.BlockLink.blog.content': `Read the latest news about ${BRAND} and the ecosystem.`,
    'app.components.BlockLink.cloud': `${BRAND} Cloud`,
    'app.components.BlockLink.cloud.content': `Fully-managed cloud hosting for your ${BRAND} project.`,
    'app.components.BlockLink.tutorial.content': `Follow step-by-step instructions to use and customize ${BRAND}.`,
    'app.components.FreeTrialWelcomeModal.description1': `For the next 30 days, you will have full access to advanced features like Content History, Releases and Single Sign-On (SSO) – everything you need to explore the power of ${BRAND} CMS.`,
    'app.components.LeftMenu.navbrand.title': BRAND,
    'app.components.LeftMenu.navbrand.workplace': 'Workspace',
    'app.components.NpsSurvey.banner-title': `How likely are you to recommend ${BRAND} to a friend or colleague?`,
    'components.AutoReloadBlocker.description': `Run ${BRAND} with one of the following commands:`,
    'global.plugins.sentry.description': `Send ${BRAND} error events to Sentry.`,
    'notification.ee.warning.over-.message':
      "Add seats to {licenseLimitStatus, select, OVER_LIMIT {invite} AT_LIMIT {re-enable}} Users. If you already did it but it's not reflected yet, make sure to restart your app.",
    'notification.version.update.message': `A new version of ${BRAND} is available!`,
    'tours.contentTypeBuilder.AIChat.content': `<p>If you have any questions about the Content-Type Builder or ${BRAND} ask them here.</p><p>${BRAND} AI can generate schemas tailored to your needs. Ask for exactly what you want, for example:<ul><li>Date picker</li><li>Email and password fields</li><li>Media of any type</li><li>UIDs</li></ul></p><p>Don’t be shy, try it out !</p>`,
    'tours.overview.subtitle': `Follow the guided tour to get the most out of ${BRAND}.`,
    'tours.overview.strapiCloud.label': `Deploy your application to ${BRAND} Cloud`,
    'HomePage.widget.deploy-now.description': `Deploy with ${BRAND} Cloud`,
    'chat.input.defaults.strapi': `Tell me about ${BRAND}`,
    'chat.input.thinking': `${BRAND} AI is thinking...`,
    'chat.input.placeholder': `Ask ${BRAND} AI...`,
    'chat.input.strapi-ai-can-make-errors': `${BRAND} AI can make mistakes.`,
    'notification.info.autoreaload-disable':
      `${BRAND} is in production mode, editing content types is disabled. Please switch to development mode.`,
    'Settings.list.empty.description': `This is not a usual action, you have modified the database. To use ${BRAND} correctly, please make sure to keep at least one locale in your database.`,
  },
} as const;

/** Rewrite browser tab titles that hardcode "| Strapi" / "Strapi Admin". */
export function installMarvloreDocumentTitle() {
  if (typeof document === 'undefined') return;

  const rewrite = (value: string) =>
    String(value)
      .replace(/\bStrapi Admin\b/g, `${BRAND} Admin`)
      .replace(/\|\s*Strapi\b/g, `| ${BRAND}`)
      .replace(/\bStrapi\b/g, BRAND);

  try {
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
    if (desc?.set && desc?.get) {
      Object.defineProperty(document, 'title', {
        configurable: true,
        enumerable: true,
        get() {
          return desc.get!.call(this);
        },
        set(value: string) {
          desc.set!.call(this, rewrite(value));
        },
      });
    }
  } catch {
    // ignore
  }

  document.title = rewrite(document.title || `${BRAND} Admin`);
}
