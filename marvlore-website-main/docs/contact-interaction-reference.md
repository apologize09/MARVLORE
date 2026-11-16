# Contact and awards polish — 2026-11-02

Continues saved Site version 113, retaining its wide 3:2 contact layout, award artwork and existing medal sheen.

- Pointer-light reference: [React Bits SpotlightCard](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/SpotlightCard/SpotlightCard.jsx). The contact adaptation is independently written in native JavaScript and CSS; no upstream source or dependencies were added.
- Large contact panels stay level. A soft lime light follows the pointer, with arrow travel limited to 5px on either axis. Links have keyboard focus and pressed feedback. Reduced motion skips pointer movement and entry animation.
- The message tile explicitly says “复制邮箱”. Clipboard success shows a check, a temporary label and a live status message. Failure reports the email for manual copying. The email cards retain mailto actions and the telephone retains its tel action.
- Contact elements enter once when visible, over 620ms with 65ms staggering. Pointer or keyboard interaction immediately completes an active entrance for that element.
- Desktop award spacing lives in `dist/award-effects.css`: heading-to-carousel gap is `clamp(88px,11svh,132px)`. Card dimensions, artwork and carousel controls are retained.
- Contact dimensions and appearance remain in `dist/contact-layout.css`; behavior is isolated in `dist/contact-interactions.js`. Shared short-edge × 8% card corners remain under `dist/card-shape.js`.
