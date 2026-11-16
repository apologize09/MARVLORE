import { projects as staticProjects, awards } from '../data.js?v=work-covers-153';
import { workReelItems as staticReelItems, workReelOptions } from '../work-reel-data.js?v=cover-crops-125';
import { workDetailCases as staticDetailCases } from '../work-detail-data.js?v=cover-crops-125';

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
    awards,
  };
}

export function getStaticOverviewById() {
  const map = {};
  for (const p of staticProjects) map[p.id] = p;
  return map;
}
