#!/usr/bin/env python3
"""Scan site copy, subset OPPO Sans, and emit WOFF2 for dist/.

Requires: pip install 'fonttools[woff]' brotli
Source font (not published): design/fonts/OPPOSans4.0.ttf
Output: dist/assets/fonts/OPPOSans4.0-subset.woff2
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "design" / "fonts" / "OPPOSans4.0.ttf"
LEGACY_DIST = ROOT / "dist" / "assets" / "fonts" / "OPPOSans4.0.ttf"
OUT_WOFF2 = ROOT / "dist" / "assets" / "fonts" / "OPPOSans4.0-subset.woff2"
META_DIR = ROOT / "scripts" / "font-subset"
CHARSET = META_DIR / "charset.txt"
META = META_DIR / "charset-meta.json"

EXTS = {".js", ".jsx", ".css", ".html", ".md", ".json", ".mjs", ".txt"}
CJK_RE = re.compile(
    r"[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]"
)
EXTRA = "…—–·•『』「」【】（）％℃°±×÷≤≥≠≈"
ALWAYS = '0123456789+-/%@&#.,:;!?()[]{}《》""\'\'、。，．：；？！—…·• \u00a0'


def iter_text_files():
    roots = [ROOT / "dist", ROOT / "src", ROOT / "AGENTS.md", ROOT / "README.md", ROOT / "docs"]
    for root in roots:
        if root.is_file():
            yield root
            continue
        if not root.is_dir():
            continue
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in EXTS:
                continue
            if "node_modules" in path.parts or "vendor" in path.parts:
                continue
            # Skip generated binary-adjacent and the huge original font notice paths only
            yield path


def collect_charset() -> str:
    chars = set(ALWAYS)
    files = 0
    for path in iter_text_files():
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        files += 1
        chars.update(CJK_RE.findall(text))
        chars.update(ch for ch in EXTRA if ch in text)
    ordered = "".join(sorted(chars, key=lambda c: (ord(c), c)))
    META_DIR.mkdir(parents=True, exist_ok=True)
    CHARSET.write_text(ordered, encoding="utf-8")
    META.write_text(
        json.dumps(
            {
                "filesScanned": files,
                "uniqueChars": len(chars),
                "hanCount": sum(1 for c in chars if "\u4e00" <= c <= "\u9fff"),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return ordered


def resolve_source() -> Path:
    if SOURCE.exists():
        return SOURCE
    if LEGACY_DIST.exists():
        SOURCE.parent.mkdir(parents=True, exist_ok=True)
        SOURCE.write_bytes(LEGACY_DIST.read_bytes())
        return SOURCE
    raise SystemExit(
        "Missing OPPO Sans source. Place the official file at:\n"
        f"  {SOURCE}\n"
        "Download: https://www.coloros.com/article/A00000074/"
    )


def main() -> None:
    charset = collect_charset()
    source = resolve_source()
    OUT_WOFF2.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(source),
        f"--text-file={CHARSET}",
        f"--output-file={OUT_WOFF2}",
        "--flavor=woff2",
        "--layout-features=*",
        "--glyph-names",
        "--symbol-cmap",
        "--legacy-cmap",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
        "--name-IDs=*",
        "--name-legacy",
        "--name-languages=*",
    ]
    subprocess.run(cmd, check=True)
    size = OUT_WOFF2.stat().st_size
    print(f"charset={len(charset)} chars → {OUT_WOFF2.relative_to(ROOT)} ({size/1024:.1f} KiB)")


if __name__ == "__main__":
    main()
