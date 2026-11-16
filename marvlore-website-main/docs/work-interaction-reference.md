# Creative Work card interactions

## Layout correction

References researched on 2026-11-01:

- [Magic UI Bento Grid source](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/bento-grid.tsx): separates card content, media and action into clear zones.
- [shadcn/ui Aspect Ratio](https://ui.shadcn.com/docs/components/aspect-ratio): media reserves a predictable ratio instead of stretching into a remaining-height row.

Original CSS adaptation, with no upstream code copied or new dependencies: retain two columns, use the existing images' approximately 835:347 ratio, and center single filtered cards at a maximum width of 960px, also capped relative to desktop viewport height. Remove duplicate per-line blur inside cards; retain heading reveal, whole-card entrance, hover and gallery transitions. Existing 8% circular corner calculation remains shared.

Reference researched on 2026-11-01: [React Bits](https://github.com/DavidHDev/react-bits), approximately 50.8k GitHub stars at research time.

- [SpotlightCard](https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/SpotlightCard): pointer-following light helps indicate the active card.
- [TiltedCard](https://github.com/DavidHDev/react-bits/tree/main/src/content/Components/TiltedCard): restrained perspective and image parallax add depth.
- [AnimatedContent](https://github.com/DavidHDev/react-bits/tree/main/src/content/Animations/AnimatedContent): scroll-triggered entrance. The original native implementation in `dist/work-entrance.js` reveals each card from 56px below at 98% scale over 700ms, staggering the right card by 100ms. Each row waits until it enters view. Reveals play once; keyboard focus and category filtering finish pending entrances immediately.

This page uses an original implementation in `dist/work-interactions.js` and `dist/work-interactions.css`, driven by the site's existing spring. No React Bits source was copied and no dependencies were added. Tilt is limited to three degrees; gallery activation resets geometry before the existing shared-image transition. Keyboard focus remains visible; reduced motion disables tilt and parallax.

React Bits lists an MIT + Commons Clause license allowing use in websites; see the [upstream license](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md).
