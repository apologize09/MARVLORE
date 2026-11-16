#!/usr/bin/env bash
# Rebuild hero video tiers from design/videos/hero-source masters.
# Outputs into dist/assets/hero-video/:
#   {slug}-home-360p.mp4  — muted 360p card loop (5s)
#   {slug}-preview.mp4    — muted 540p teaser (5s)
#   {slug}.mp4            — default detail 720p
#   {slug}-1080p.mp4      — optional HD
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/design/videos/hero-source"
OUT="$ROOT/dist/assets/hero-video"
TMP="$ROOT/.tmp/video-encode"
mkdir -p "$TMP" "$OUT"

encode_one() {
  local slug="$1"
  local master="$SRC/${slug}.mp4"
  [[ -f "$master" ]] || { echo "missing $master"; return 1; }
  echo "=== $slug ==="

  ffmpeg -y -hide_banner -loglevel error -i "$master" \
    -vf "scale=-2:720:flags=lanczos" -c:v libx264 -preset medium -crf 27 \
    -maxrate 2200k -bufsize 4400k -profile:v high -pix_fmt yuv420p -movflags +faststart \
    -c:a aac -b:a 96k -ac 2 \
    "$TMP/${slug}.mp4"

  ffmpeg -y -hide_banner -loglevel error -i "$master" \
    -vf "scale=-2:1080:flags=lanczos" -c:v libx264 -preset medium -crf 29 \
    -maxrate 3500k -bufsize 7000k -profile:v high -pix_fmt yuv420p -movflags +faststart \
    -c:a aac -b:a 96k -ac 2 \
    "$TMP/${slug}-1080p.mp4"

  ffmpeg -y -hide_banner -loglevel error -i "$master" -t 5 \
    -vf "scale=-2:540:flags=lanczos" -c:v libx264 -preset medium -crf 30 \
    -an -pix_fmt yuv420p -movflags +faststart \
    "$TMP/${slug}-preview.mp4"

  ffmpeg -y -hide_banner -loglevel error -i "$master" -t 5 \
    -vf "scale=-2:360:flags=lanczos" -c:v libx264 -preset medium -crf 32 \
    -an -pix_fmt yuv420p -movflags +faststart \
    "$TMP/${slug}-home-360p.mp4"

  mv -f "$TMP/${slug}.mp4" "$OUT/${slug}.mp4"
  mv -f "$TMP/${slug}-1080p.mp4" "$OUT/${slug}-1080p.mp4"
  mv -f "$TMP/${slug}-preview.mp4" "$OUT/${slug}-preview.mp4"
  mv -f "$TMP/${slug}-home-360p.mp4" "$OUT/${slug}-home-360p.mp4"
  ls -lh "$OUT/${slug}.mp4" "$OUT/${slug}-1080p.mp4" "$OUT/${slug}-preview.mp4" "$OUT/${slug}-home-360p.mp4"
}

for slug in puff pop-palm flum-mi flum-pebble-x swft-icon; do
  encode_one "$slug"
done
echo "DONE → $OUT"
du -sh "$OUT"
