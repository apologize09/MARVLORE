import type { OpsDict } from './types';

/** Custom ops pages dictionary (admin UI only — not website content). */
export const zhCN: OpsDict = {
  common: {
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    create: '新建',
    search: '搜索',
    refresh: '刷新',
    back: '返回',
    confirm: '确认',
    loading: '加载中…',
    success: '操作成功',
    failed: '操作失败',
    published: '已发布',
    draft: '草稿',
  },
  navigation: {
    dashboard: '工作台',
    website: '官网内容管理',
    work: '作品案例管理',
    media: '媒体资源管理',
    seo: '内容与 SEO',
    system: '系统设置',
  },
  dashboard: {
    title: '工作台',
    lead: '内容概览：按官网模块统计已发布条目与媒体库用量。编辑请从侧栏六组运营入口进入。',
    stats: '内容统计',
    shortcuts: '快捷入口',
    mediaFiles: '媒体库文件',
  },
  website: {
    title: '官网内容管理',
    lead: '首页、关于、服务、联络、FAQ、奖项等前台模块。点击卡片进入 Content Manager。',
  },
  work: {
    title: '作品案例管理',
    lead: '作品列表、分类、标签、频道页与详情素材。对齐 build-work.mjs。',
  },
  media: {
    title: '媒体资源管理',
    lead: '统一素材库。图片 / 视频 / 文件均进入媒体库后在库内筛选；站点同步请用 CLI（后台暂不展示）。',
  },
  seo: {
    title: '内容与 SEO',
    lead: '文章相关归档模型与页面 SEO 配置。',
  },
  system: {
    title: '系统设置',
    lead: '管理员、角色、多语言与 API 权限。日常内容请优先使用内容运营入口。',
  },
};
