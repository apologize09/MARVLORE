// Trim only the invisible lead-in. Keep the first sheet's unfolding and the
// following sheets' staggered release instead of starting with a full field.
export const FLIGHT_PREROLL=1.2;

// Let the background arrive while the section enters the viewport. Keep this
// separate from the title reveal and reversible for upward scrolling.
export function exploreBackgroundVisibility(distance){
 const t=Math.max(0,Math.min(1,(distance+.48)/.54));
 return t*t*(3-2*t);
}
