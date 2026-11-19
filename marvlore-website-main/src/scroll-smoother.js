/**
 * Site-wide ScrollSmoother (feel only). effects:false — no speed/lag parallax.
 * One instance; skipped when prefers-reduced-motion: reduce.
 */
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

/** @type {ReturnType<typeof ScrollSmoother.create> | null} */
let smoother = null;
let listening = false;

function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ensureDom() {
  return Boolean(document.querySelector('#smooth-wrapper') && document.querySelector('#smooth-content'));
}

/**
 * Create the single ScrollSmoother instance (idempotent).
 * @returns {ReturnType<typeof ScrollSmoother.create> | null}
 */
export function mountScrollSmoother() {
  if (typeof window === 'undefined') return null;
  if (!listening) {
    listening = true;
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      if (reducedMotion()) {
        killScrollSmoother();
      } else if (!smoother) {
        mountScrollSmoother();
        refreshScrollSmoother();
      }
    });
  }

  if (reducedMotion()) {
    document.documentElement.classList.remove('has-scroll-smoother');
    return null;
  }
  if (smoother) return smoother;
  if (!ensureDom()) {
    console.warn('[scroll-smoother] missing #smooth-wrapper / #smooth-content');
    return null;
  }

  // ScrollSmoother.create returns the existing instance when content matches.
  smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1,
    effects: false,
    smoothTouch: 0,
    ignoreMobileResize: true,
  });
  document.documentElement.classList.add('has-scroll-smoother');
  return smoother;
}

export function getScrollSmoother() {
  return smoother;
}

export function killScrollSmoother() {
  if (!smoother) return;
  smoother.kill();
  smoother = null;
  document.documentElement.classList.remove('has-scroll-smoother');
}

/** Refresh pin/scrub measurements after DOM or route changes. */
export function refreshScrollSmoother() {
  ScrollTrigger.refresh();
}
