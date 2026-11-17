import {projects} from './data.js?v=178a4e2f6c';
import {visualProjects} from './visual-projects.js?v=af6a11505e';
import {filmProjects} from './film-projects.js?v=ea4af0b2ae';

// Each slice is independently editable. Keep the source image's own proportions
// when opened; focusX chooses the crop shown while it is a narrow slice.
const direction=id=>{
 const p=projects.find(item=>item.id===id);
 return {id:'reel-'+id,category:id,src:'./assets/'+p.image,title:p.title,subtitle:p.cn,alt:p.label,aspect:(['film','web'].includes(id)?835:834)/347,focusX:50};
};
export const workReelItems=[
 ...filmProjects,
 ...visualProjects,
 direction('web'),
 direction('culture')
];
export const workReelOptions={
 maxVisible:8,
 barWidth:180,
 magnify:2.4,
 influence:300,
 gap:12,
 response:.46,
 damping:.88
};
