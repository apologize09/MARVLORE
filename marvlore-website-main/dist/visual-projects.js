// Each supplied image is the cover of a separate visual-design project.
export const visualProjects=[
 {slug:'lophthy-visual',title:'LOPHTY · 品牌主视觉',subtitle:'品牌主视觉',focusX:56},
 {slug:'vapes-bars',title:'Vapes Bars · 品牌视觉',subtitle:'品牌视觉',focusX:50},
 {slug:'vapx',title:'VapX · 品牌视觉系统',subtitle:'品牌视觉系统',focusX:46},
 {slug:'volantique',coverFile:'volantique-logo',thumbnailFile:'volantique-logo-orange',title:'Volantique · 品牌视觉系统',subtitle:'品牌视觉系统',focusX:40},
 {slug:'creative-ip',title:'Creative IP · 创意角色视觉',subtitle:'创意角色视觉',focusX:54},
 {slug:'daily',title:'DAILY · 品牌视觉',subtitle:'品牌视觉',focusX:75},
 {slug:'summo',title:'SUMMO · 品牌策划与视觉',subtitle:'品牌策划与视觉',focusX:45},
 {slug:'lophthy-graphic',thumbnailFile:'lophthy-graphic-blue',title:'LOPHTY · 视觉图形',subtitle:'视觉图形',focusX:50},
].map(project=>({
 ...project,id:'reel-visual-'+project.slug,category:'visual',
 src:'./assets/work-visual/'+(project.coverFile||project.slug)+'.webp',alt:project.title+'项目封面',
 thumbnailSrc:project.thumbnailFile?'./assets/work-visual/'+project.thumbnailFile+'.webp':null,
 width:1920,height:1080,aspect:1920/1080,
}));
