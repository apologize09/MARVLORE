import {heroProjects} from './hero/images.js?v=hero-video-123';

// Share the supplied films with home, keeping each case independently addressable.
export const filmProjects=heroProjects.filter(project=>project.videoSrc).map(project=>({
 ...project,id:'reel-film-'+project.id.replace('hero-video-',''),category:'film',
 title:project.title+' · 品牌影片',subtitle:'影视动画',aspect:project.width/project.height,focusX:50,
}));
