#!/usr/bin/env bash
# render_lower_third.sh: renders the lower-third lesson with sound.
#
#   1. Copies Shot 5 from the film into public/ (Remotion reads videos from there)
#   2. Renders the LowerThird composition
#   3. Adds sound: the film's rain/drone for that moment + a soft whoosh in and out
#
# Cost: free.
# How to run it (from the repo's top folder):
#   bash 06-ai-video/04-remotion/render_lower_third.sh

set -e
cd "$(dirname "$0")"
FILM="../02-the-lighthouse"

# 1. Get the film shot (build it if it doesn't exist yet)
if [ ! -f "$FILM/shots/shot05_window.mp4" ]; then
  bash "$FILM/make_code_shots_2_and_5.sh"
fi
mkdir -p public out
cp "$FILM/shots/shot05_window.mp4" public/

# 2. Render the animation
npx remotion render LowerThird out/lower_third.mp4

# 3. Sound. Times must match src/LowerThird.tsx: IN_AT=10 → 0.33s, OUT_AT=92 → 3.07s
if [ ! -f "$FILM/renders/soundtrack.wav" ]; then
  bash "$FILM/make_rough_cut.sh"
fi
ffmpeg -y -v error \
  -i out/lower_third.mp4 \
  -ss 17 -t 4 -i "$FILM/renders/soundtrack.wav" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=4:amplitude=1" \
  -filter_complex "\
[1:a]aresample=48000,volume=0.9[film];\
[2:a]highpass=f=300,lowpass=f=2500,\
volume='0.45*(between(t,0.30,0.85)*sin(PI*(t-0.30)/0.55)+between(t,3.05,3.45)*sin(PI*(t-3.05)/0.40))':eval=frame[whoosh];\
[film][whoosh]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.9" \
  -map 0:v -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart \
  out/lower_third_with_sound.mp4

echo "Done! out/lower_third_with_sound.mp4"
