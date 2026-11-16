# React Bits source archives

The upstream license is retained in `LICENSE.md` and copied into the static build.

## CircularCarousel JS-CSS (current card component)

- Registry: https://reactbits.dev/r/CircularCarousel-JS-CSS.json
- Docs: https://reactbits.dev/components/circular-carousel
- `CircularCarousel-JS-CSS.json`, `CircularCarousel.jsx` and `CircularCarousel.css` preserve the exact registry response and both source files. Registry dependencies: none.
- The mounted JSX copy in `src/hero/CircularCarousel.jsx` adds an explicit paused prop, active-time intro accumulation and a project-specific `fly` intro: one-side staggered flight, face-on circular assembly, then a continuous morph into the native cylinder. The same card nodes interpolate their positions, yaw, scale and camera depth; source dimensions and image aspect ratios are retained. Cylinder geometry, momentum interaction, captions and keyboard navigation derive from the official source.
- `src/hero/CircularCarousel.css` is an unchanged copy. Hero-only overrides retain native landscape images with contain, a 16:9 aspect ratio and responsive desktop sizing.
- The hero uses cylinder, fly, flat cards (`curve=0`), speed 14, captions, no hover slowdown, no pointer parallax or velocity stretch. The user's original green/blue halo is retained behind it. Card corners use 18% of the untransformed short edge. First presentation and returning to the hero restart the title and cards together.

## SplitText JS-CSS (current title component)

Registry: https://reactbits.dev/r/SplitText-JS-CSS.json

`SplitText.jsx` and `SplitText-JS-CSS.json` are exact upstream archives. `src/hero/SplitText.jsx` is an identical mounted copy. Dependencies `gsap@^3.13.0` and `@gsap/react@^2.1.2` are installed and locked. The registry has no additional CSS file.

The H1 hosts a SplitText span through a portal: rise, chars, 50ms stagger, 1.25-second duration, lift on hover, no loop or mask. A shared asset/font and visibility gate starts the title and carousel together. A shared replay key restarts both entrances. Reduced-motion behavior is retained.

## OrbitImages JS-CSS (archived, not mounted)

- Registry: https://reactbits.dev/r/OrbitImages-JS-CSS.json
- Docs: https://reactbits.dev/animations/orbit-images
- Author: Dominik Koch — https://x.com/dominikkoch
- Registry dependencies: none.

The original files and previous adapted OrbitImages implementation are retained for reverting, but the current hero bundle uses CircularCarousel.
