# Natural depth blur — 2026-11-02

The large-radius spiral sampling used previously exposed discrete copies of card edges. Replace that ring-stage kernel with actual horizontal/vertical Gaussian texture prefiltering.

References inspected:

- [pmndrs GaussianBlurPass](https://github.com/pmndrs/postprocessing/blob/main/src/passes/GaussianBlurPass.js): separate horizontal and vertical render passes.
- [Experience-Monks glsl-fast-gaussian-blur](https://github.com/Experience-Monks/glsl-fast-gaussian-blur): pair adjacent Gaussian taps through linear texture filtering. The project was previously published under Jam3.

The native implementation is independently written. Kernel coefficients are generated from a normalized Gaussian rather than copied from upstream. Each distinct artwork gets five progressively blurred textures once at load; repeated artwork reuses them. Variance interpolation blends between levels as depth changes. Premultiplied alpha prevents dark fringes, and a Gaussian edge profile softens the rounded silhouette continuously.

The card shader uses these prefiltered textures directly for static depth blur. A short, weighted shutter integration handles motion; color dispersion is limited to the motion direction. Card geometry, images, 8% short-edge corner radius and the final wall transition remain configurable through their existing modules.

Soft fringes are composited back-to-front without writing opaque depth occlusion. Nearly edge-on sheets fade continuously by view angle during the ring phase, preventing thin dark silhouettes from cutting across the blurred rear cards. Full face-on opacity and the final wall presentation are retained.

`dist/explore-gaussian.js` owns filtering and its kernel model. `dist/explore-optics.js` owns depth/exposure strength. `tests/explore-gaussian.test.mjs` checks normalization, symmetry, reconstruction of paired taps and continuity across blur levels.

Colour continuity: free flight, gathering and the settled wall now share one premultiplied Gaussian path. The earlier per-channel vertical offsets in the free-flight shader are removed. Chromatic separation is restricted to the moving translucent silhouette; opaque artwork retains the unsplit colour sample.

Manual GPU regression: run `node tests/serve-explore-check.mjs`, then open `http://127.0.0.1:5173/__colour-check` with the supported browser tool. The fixture compiles the actual production shaders and reads GPU pixels, checking constant-colour/premultiplied-alpha preservation, phase-boundary colour continuity, and zero interior colour shift when dispersion is enabled. Desktop validation on 2026-11-02 returned 0/255 error for all three checks.
