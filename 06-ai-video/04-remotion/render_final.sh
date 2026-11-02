#!/usr/bin/env bash
# render_final.sh: renders the FINAL cut of "The Lighthouse" (35 seconds).
#
#   1. Makes sure every film shot exists (builds them with FFmpeg if not)
#   2. Copies them into public/ for Remotion
#   3. Renders the picture in Remotion (title, transitions, captions, lower third)
#   4. Builds the final sound: film soundtrack + credits + title ticks + lower-third
#      whooshes, levelled to -14 LUFS (the streaming standard)
#   5. Combines picture + sound, and saves a thumbnail
#
# Cost: free.
# How to run it (from the repo's top folder):
#   bash 06-ai-video/04-remotion/render_final.sh

set -e
cd "$(dirname "$0")"
FILM="../02-the-lighthouse"

# ---- 1. Film shots + sound pieces (make_final_film.sh builds anything missing) ----
NEED=(shot02_cliff shot03_lamp shot04_beam shot05_window shot06_answer shot07_final credits)
MISSING=0
for n in "${NEED[@]}"; do [ -f "$FILM/shots/$n.mp4" ] || MISSING=1; done
[ -f "$FILM/renders/soundtrack.wav" ] || MISSING=1
[ -f "$FILM/renders/credits_sound.wav" ] || MISSING=1
if [ "$MISSING" = 1 ]; then
  echo "Building the film shots first (takes a few minutes)..."
  bash "$FILM/make_final_film.sh"
fi

# ---- 2. Copy into public/ -----------------------------------------------------------
mkdir -p public out
for n in "${NEED[@]}"; do cp "$FILM/shots/$n.mp4" public/; done

# ---- 3. Render the picture ------------------------------------------------------------
echo "Rendering the picture in Remotion..."
npx remotion render LighthouseFinal out/final_picture.mp4 --crf=18

# ---- 4. Sound ---------------------------------------------------------------------------
# Title ticks: must match src/LighthouseTitle.tsx (FIRST_LETTER_AT=10, STAGGER=3, LINE_STARTS_AT=55)
TITLE="THE LIGHTHOUSE"; TICKS="0"
for (( i=0; i<${#TITLE}; i++ )); do
  [ "${TITLE:$i:1}" = " " ] && continue
  T=$(echo "scale=4; (10 + $i*3 + 4) / 30" | bc)
  TICKS="$TICKS+gte(t,$T)*(0.22*sin(2*PI*1900*t)*exp(-90*max(0,t-$T))+0.25*sin(2*PI*150*t)*exp(-35*max(0,t-$T)))"
done
LINE=$(echo "scale=4; 55 / 30" | bc)
# Lower third: in Shot 5 (starts at 17s), IN at frame 10 → 17.33s, OUT at frame 92 → 20.07s

echo "Mixing the sound..."
ffmpeg -y -v error \
  -i "$FILM/renders/soundtrack.wav" \
  -i "$FILM/renders/credits_sound.wav" \
  -f lavfi -i "aevalsrc='${TICKS}':s=48000:d=35" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=35:amplitude=1" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=35:amplitude=1" \
  -filter_complex "\
[0:a][1:a]concat=n=2:v=0:a=1,aresample=48000[film];\
[2:a]volume=0.8[ticks];\
[3:a]bandpass=f=4000:width_type=o:w=1.5,\
volume='1.3*between(t,${LINE},${LINE}+0.9)*sin(PI*min(1,max(0,(t-${LINE})/0.9)))':eval=frame[shimmer];\
[4:a]highpass=f=300,lowpass=f=2500,\
volume='0.4*(between(t,17.30,17.85)*sin(PI*(t-17.30)/0.55)+between(t,20.05,20.45)*sin(PI*(t-20.05)/0.40))':eval=frame[whoosh];\
[film][ticks][shimmer][whoosh]amix=inputs=4:normalize=0:duration=first,\
alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" \
  -c:a pcm_s16le out/final_sound.wav

# ---- 5. Combine + thumbnail -------------------------------------------------------------
ffmpeg -y -v error -i out/final_picture.mp4 -i out/final_sound.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart \
  out/THE_LIGHTHOUSE_final.mp4
ffmpeg -y -v error -ss 12.0 -i out/THE_LIGHTHOUSE_final.mp4 -frames:v 1 -q:v 2 out/THE_LIGHTHOUSE_thumbnail.jpg

echo "Done! out/THE_LIGHTHOUSE_final.mp4  +  out/THE_LIGHTHOUSE_thumbnail.jpg"
