// Screenshot-derived covers include a thin white source border.
// Inset only these artworks, inside the existing card clipping boundary.
const borderedCovers=new Set(['film-blue-152.webp','culture-lophty-152.webp']);
export function coverImageScale(src){
 const file=String(src).split(/[?#]/,1)[0].split('/').pop();
 return borderedCovers.has(file)?1.025:1;
}
