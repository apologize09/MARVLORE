// 所有文案、素材和分类入口集中于此；替换素材不会影响分屏结构。
export const projects = [
 { id:'film',eyebrow:'Creative Visuals',title:'Film & Animation',cn:'影视动画',description:'AI 时代下技术赋能与视觉表达的融合实践探索',image:'hero-video/swft-icon-poster.webp',tags:['影视动画','3D Animation','视频 & 广告','CGI'],detail:'从品牌叙事到动态视觉，让创意在每一帧中发生。',label:'SWFT ICON 品牌影片' },
 { id:'visual',eyebrow:'Brand Visuals',title:'Visual Design',cn:'视觉设计',description:'极简形态下的试验语言与多元视觉的研究',image:'work-visual/lophthy-visual.webp',tags:['视觉设计'],detail:'围绕品牌表达，探索字体、图形、材质和视觉系统的更多可能。',label:'LOPHTY 品牌主视觉' },
 { id:'web',eyebrow:'Digital Experiences',title:'Web Development',cn:'网站设计',description:'以品牌为起点，连接内容、界面与交互体验',image:'work-web.webp',tags:['网站设计'],detail:'把品牌视觉延伸到数字体验，让内容、界面与交互保持一致。',label:'数字界面与网站设计' },
 { id:'culture',eyebrow:'Marvlore Culture',title:'Marvlore',cn:'迈络文化',description:'迈络的创作、实验与持续发生的新想法',image:'work-culture.webp',tags:['迈络文化'],detail:'关于迈络的创作、实验，以及持续发生的新想法。',label:'迈络创作与文化' },
].map(project=>({
  ...(project.id==='film'?{overviewImage:'work-covers/film-blue-152.webp',overviewLabel:'蓝色产品动画画面'}:project.id==='culture'?{overviewImage:'work-covers/culture-lophty-152.webp',overviewLabel:'LOPHTY 品牌空间视觉'}:{}),
  // 卡片填充入口：image 留空显示占位；cover 铺满 / contain 完整显示。
  imageFit:'cover',
  imagePosition:'50% 50%',
  mediaPlaceholder:'待填充作品图片',
  ...project,
}));
export const awards = [
 {image:'award-aigc.webp',alt:'全球 AIGC 艾菲奖，GLOBAL AIGC EFFIE AWARD'},
 {image:'award-reddot.webp',alt:'设计红点奖，RED DOT AWARD'},
 {image:'award-partner.webp',alt:'新片场官方合作伙伴，OFFICIAL PARTNER OF NEW STUDIOS MEDIA'},
];
