// Format display titles before text splitting, preserving Chinese and animation markup.
export function titleCase(value){
 return String(value??'').replace(/[A-Za-z]+(?:['’][A-Za-z]+)*/g,word=>word[0].toUpperCase()+word.slice(1).toLowerCase());
}
