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
    system: '系统设置',
  },
  dashboard: {
    title: '工作台',
    lead: '内容概览：按官网模块统计已发布条目与媒体库用量。编辑请从「官网内容管理 / 作品案例管理」进入，保持与前端 build-*.mjs 相同的模块边界。',
    stats: '内容统计',
    shortcuts: '快捷入口',
    mediaFiles: '媒体库文件',
  },
  website: {
    title: '官网内容管理',
    lead: '官网前台模块内容。点击卡片直接进入对应 Content Manager 编辑。每个入口对齐 build-hero / about / services / contact。',
  },
  work: {
    title: '作品案例管理',
    lead: '作品内容生命周期。点击卡片直接进入对应 Content Manager 编辑。对齐 build-work.mjs。',
  },
  media: {
    title: '媒体资源管理',
    lead: '统一素材库：上传、预览、替换图片与视频。内容条目里的媒体字段会打开同一套库；同步站点静态资源后可用 caption 匹配到 ./assets 路径。',
  },
  system: {
    title: '系统设置',
    lead: '账号、角色、语言与 API 权限。日常内容运营请优先使用「官网内容管理 / 作品案例管理」，系统项留给管理员。',
  },
};
