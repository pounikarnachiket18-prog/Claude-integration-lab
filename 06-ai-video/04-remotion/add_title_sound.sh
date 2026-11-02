#!/usr/bin/env bash
# add_title_sound.sh: adds sound effects timed to the Remotion title animation.
#
#   - a soft "tick" each time a letter lands (12 letters, staggered like the animation)
#   - a rising shimmer while the gold line draws
#   - a low drone underneath, fading in and out with the picture
#
# Pro workflow: animate in Remotion, design sound separately, combine with FFmpeg.
# Cost: free.
#
# How to run it (from this folder, after rendering the title):
#   npx remotion render LighthouseTitle out/lighthouse_title.mp4
#   bash add_title_sound.sh

set -e
cd "$(dirname "$0")"

# These must match the settings at the top of src/LighthouseTitle.tsx
TITLE="THE LIGHTHOUSE"
FIRST_LETTER_AT=10
STAGGER=3
LINE_STARTS_AT=55
FPS=30
LAND=4   # a letter "lands" about 4 frames after it starts moving

# Build one tick per letter (spaces are skipped).
TICKS="0"
for (( i=0; i<${#TITLE}; i++ )); do
  [ "${TITLE:$i:1}" = " " ] && continue
  T=$(echo "scale=4; ($FIRST_LETTER_AT + $i*$STAGGER + $LAND) / $FPS" | bc)
  # max(0, ...) stops exp() from blowing up to infinity before the tick happens
  TICKS="$TICKS+gte(t,$T)*(0.22*sin(2*PI*1900*t)*exp(-90*max(0,t-$T))+0.25*sin(2*PI*150*t)*exp(-35*max(0,t-$T)))"
done

LINE_START=$(echo "scale=4; $LINE_STARTS_AT / $FPS" | bc)

ffmpeg -y -v error \
  -i out/lighthouse_title.mp4 \
  -f lavfi -i "aevalsrc='${TICKS}':s=48000:d=5" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=5:amplitude=1" \
  -f lavfi -i "aevalsrc='0.4*sin(2*PI*55*t)+0.25*sin(2*PI*82.5*t)':s=48000:d=5" \
  -filter_complex "\
[1:a]volume=0.9[ticks];\
[2:a]bandpass=f=4000:width_type=o:w=1.5,\
volume='1.5*between(t,${LINE_START},${LINE_START}+0.9)*sin(PI*min(1,max(0,(t-${LINE_START})/0.9)))':eval=frame[shimmer];\
[3:a]lowpass=f=250,afade=t=in:st=0:d=1,afade=t=out:st=4:d=1,volume=0.35[drone];\
[ticks][shimmer][drone]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.9" \
  -map 0:v -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart \
  out/lighthouse_title_with_sound.mp4

echo "Done! out/lighthouse_title_with_sound.mp4"
