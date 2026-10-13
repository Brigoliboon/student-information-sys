#!/usr/bin/env bash
# End-to-end demo pipeline: dev server -> Playwright role scenes -> ffmpeg final cut.
# Usage: DEMO_PASSWORD='...' [BASE_URL=http://localhost:3000] [PORT=3000] [SCENES=admin,student] bash demo/run.sh
# Output: demo/sims-demo.mp4 (1080p) + per-scene clips in demo/out/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-3000}"
BASE_URL="${BASE_URL:-http://localhost:$PORT}"
OUT="${OUT_DIR:-demo/out}"
export BASE_URL OUT_DIR="$OUT"

command -v ffmpeg >/dev/null || { echo "ffmpeg not found (apt install ffmpeg)"; exit 1; }
command -v node >/dev/null || { echo "node not found"; exit 1; }
[[ -n "${DEMO_PASSWORD:-}" ]] || { echo "Set DEMO_PASSWORD to the seeded account password."; exit 1; }

if ! node -e "require.resolve('playwright')" 2>/dev/null; then
  echo "-> installing playwright (devDependency, needed for browser automation)"
  npm i -D playwright
fi
echo "-> ensuring chromium"
npx playwright install chromium

mkdir -p "$OUT/raw" "$OUT/seg"

echo "-> starting dev server on :$PORT"
npm run dev -- --port "$PORT" >"$OUT/server.log" 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

echo "-> waiting for $BASE_URL/login"
for i in $(seq 1 90); do
  if curl -sf -o /dev/null "$BASE_URL/login"; then break; fi
  sleep 2
  if (( i == 90 )); then echo "server never came up (see $OUT/server.log)"; exit 1; fi
done

echo "-> recording scenes ${SCENES:-all}"
DEMO_PASSWORD="$DEMO_PASSWORD" node demo/record.mjs

mapfile -t SCENES_DONE < "$OUT/manifest.txt"
[[ ${#SCENES_DONE[@]} -gt 0 ]] || { echo "no scenes recorded"; exit 1; }

# Title cards need a TTF; DejaVu ships with most distros.
FONT="$(fc-list 2>/dev/null | grep -ioE '/[^:]*/DejaVuSans-Bold\.ttf' | head -1 || true)"
if [[ -z "$FONT" ]]; then
  FONT="$(find /usr/share/fonts -iname 'DejaVuSans-Bold.ttf' 2>/dev/null | head -1 || true)"
fi
[[ -n "$FONT" ]] && echo "-> title font: $FONT" || echo "-> no title font found, skipping title cards"

LIST="$OUT/concat.txt"
: > "$LIST"
norm() { # norm <in> <out>
  ffmpeg -y -v error -i "$1" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1,fps=30" -c:v libx264 -preset veryfast -pix_fmt yuv420p -an "$2"
}
for s in "${SCENES_DONE[@]}"; do
  s="$(echo "$s" | tr -d '\r')"
  [[ -f "$OUT/raw/$s.webm" ]] || { echo "missing clip for $s"; exit 1; }
  if [[ -n "$FONT" ]]; then
    ffmpeg -y -v error -f lavfi -i "color=white:s=1920x1080:d=2.5:r=30" \
      -vf "drawtext=fontfile=$FONT:text='${s^} — SIMS demo':fontcolor=#18181b:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2" \
      -c:v libx264 -preset veryfast -pix_fmt yuv420p -an "$OUT/seg/$s-title.mp4"
    echo "file '$PWD/$OUT/seg/$s-title.mp4'" >> "$LIST"
  fi
  norm "$OUT/raw/$s.webm" "$OUT/seg/$s.mp4"
  echo "file '$PWD/$OUT/seg/$s.mp4'" >> "$LIST"
done

ffmpeg -y -v error -f concat -safe 0 -i "$LIST" -c copy demo/sims-demo.mp4
echo "done: demo/sims-demo.mp4"
ffprobe -v error -show_entries format=duration -of csv=p=0 demo/sims-demo.mp4 | xargs -I{} echo "duration: {}s"
