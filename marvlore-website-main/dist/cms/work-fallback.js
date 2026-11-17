import { projects as staticProjects, awards } from '../data.js?v=work-covers-153';
import { workReelItems as staticReelItems, workReelOptions } from '../work-reel-data.js?v=cover-crops-125';
import { workDetailCases as staticDetailCases } from '../work-detail-data.js?v=cover-crops-125';
import { serviceItems as staticServiceItems } from '../services/items.js';
import { heroProjects as staticHeroProjects, heroImages as staticHeroImages } from '../hero/images.js';

export const STATIC_CONTACT = {
  siteName: 'MARVLORE',
  siteNameCn: '迈络',
  tagline: 'Ideas Make Brands POP',
  email: 'contact@marvlore.com',
  phone: '+8619832866221',
  phoneDisplay: '198 3286 6221',
  wechat: 'marvloreM',
  addressEn: 'Shenzhen,\nChina',
  addressCn: '中国深圳',
  studioNoteEn: 'Brand Visuals & Creative Content',
  studioNoteCn: '品牌视觉与创意内容',
  welcomeCn: '欢迎联络',
  copyrightText: 'MARVLORE 迈络',
};

export function buildStaticBundle() {
  const workDetailCases = staticDetailCases.slice();
  const detailById = new Map(workDetailCases.map((item) => [item.id, item]));
  return {
    source: 'static',
    projects: staticProjects.slice(),
    workReelItems: staticReelItems.slice(),
    workReelOptions,
    workDetailCases,
    detailById,
    awards: awards.slice(),
    contact: { ...STATIC_CONTACT },
    services: staticServiceItems.slice(),
    about: null,
    heroProjects: staticHeroProjects.slice(),
    heroImages: staticHeroImages.slice(),
    workPage: null,
    locale: 'zh-CN',
  };
}

export function getStaticOverviewById() {
  const map = {};
  for (const p of staticProjects) map[p.id] = p;
  return map;
}
