# OPPO Sans 4.0

Copyright belongs to OPPO Guangdong Mobile Telecommunications Corp., Ltd.

Official font information and usage terms:
https://www.coloros.com/article/A00000074/

This website embeds a **glyph-subset WOFF2** (`OPPOSans4.0-subset.woff2`) built
from the official OPPO Sans 4.0 variable font (weight axis 100–700). The subset
covers characters used by the MARVLORE site copy, plus basic punctuation.

- Published file: `OPPOSans4.0-subset.woff2`
- Rebuild: place the full official TTF at `design/fonts/OPPOSans4.0.ttf`, then run
  `python3 scripts/subset-oppo-font.py` (requires `fonttools[woff]` + `brotli`).
- The full TTF is kept only as a local rebuild source under `design/fonts/` and is
  not referenced by the published `dist/` CSS.

No font download UI is provided. Obtain the full font from the official OPPO /
ColorOS page above when regenerating the subset.

## English preview typography

The user's installed Newsreader6pt-Light.ttf and FKGroteskTrial-Regular.otf
are packaged as WOFF2 for the requested local preview, retaining their original
glyphs and font names. Newsreader uses the SIL Open Font License; see
NEWSREADER-OFL.txt. FK Grotesk Trial is by Florian Karsten Typefaces.
