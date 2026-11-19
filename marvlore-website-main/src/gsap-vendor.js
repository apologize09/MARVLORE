/**
 * Single shared GSAP runtime for the static site.
 * Islands import `gsap` / `gsap/*` which esbuild rewrites to this module.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

export { gsap, ScrollTrigger, ScrollSmoother, SplitText };
export default gsap;
