// 接近本段顶部才开始；离开足够远后允许下次重新入场。
export function shouldShowEntry({top,bottom},height,wasEntered){
 if(wasEntered)return top<height*.9&&bottom>0;
 return top<=height*.12&&bottom>height*.6;
}
