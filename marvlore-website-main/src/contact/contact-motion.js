import {servicesListFrame,SERVICES_LIST_START,SERVICES_LIST_DURATION} from '../services/title-motion.js';

// Use the service directory's exact reveal, fitting each line to a non-pinned footer.
// Late rows finish at the page end, and reverse scrolling samples the same frame.
export function contactEntryFrame(sectionTop,entryOffset,viewportHeight){
 const height=Math.max(1,viewportHeight);
 const start=Math.max(48,height*.96-entryOffset);
 const end=Math.max(0,start-height*.25);
 const amount=Math.max(0,Math.min(1,(start-sectionTop)/Math.max(1,start-end)));
 return servicesListFrame(SERVICES_LIST_START+amount*SERVICES_LIST_DURATION,0,height);
}
