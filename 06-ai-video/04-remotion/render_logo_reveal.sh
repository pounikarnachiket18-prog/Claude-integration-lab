#!/usr/bin/env bash
# render_logo_reveal.sh: renders the 5-second YouTube logo reveal with sound design.
#
# Sound (all made from math, so there are no copyright problems):
#   0.0-1.0s  RISER: rushing noise that gets louder, building tension
#   1.0s      BASS HIT: a deep "boom" that drops in pitch, exactly when the lamp pops
#   1.0s      SPARKLE: a short bright crackle for the sparks
#   2.25s     SHING: a bright metallic shimmer as the light sweeps across the name
#   1.0-5.0s  a low hum underneath, fading out with the picture
#
# Cost: free.
# How to run it (from the repo's top folder):
#   bash 06-ai-video/04-remotion/render_logo_reveal.sh                                          (Lighthouse Studio)
#   bash 06-ai-video/04-remotion/render_logo_reveal.sh MindsetModeLogo mindset_mode_india_logo  (Mindset Mode India)

set -e
cd "$(dirname "$0")"
mkdir -p out
COMP="${1:-LogoReveal}"      # which composition to render
NAME="${2:-logo_reveal}"     # output file name (without .mp4)

echo "Rendering the picture..."
npx remotion render "$COMP" "out/${NAME}_picture.mp4" --crf=18

HIT=1.0     # frame 30 / 30 fps: the lamp pop
SHING=2.25  # just after frame 66 / 30 fps: the light sweep reaches the first letter
D="max(0,t-${HIT})"     # time since the hit (never negative, so exp() can't overflow)
S="max(0,t-${SHING})"   # time since the shing

echo "Designing the sound..."
ffmpeg -y -v error \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=5:amplitude=1" \
  -f lavfi -i "aevalsrc='gte(t,${HIT})*0.9*sin(2*PI*(40*${D}+10*(1-exp(-8*${D}))))*exp(-2.5*${D})':s=48000:d=5" \
  -f lavfi -i "anoisesrc=color=white:sample_rate=48000:duration=5:amplitude=1" \
  -f lavfi -i "aevalsrc='gte(t,${SHING})*(0.25*sin(2*PI*2637*t)+0.18*sin(2*PI*3520*t))*(1-exp(-30*${S}))*exp(-4*${S})':s=48000:d=5" \
  -f lavfi -i "aevalsrc='gte(t,${HIT})*(0.22*sin(2*PI*55*t)+0.12*sin(2*PI*82.5*t))':s=48000:d=5" \
  -filter_complex "\
[0:a]bandpass=f=1200:width_type=o:w=2,volume='0.9*pow(min(1,t/${HIT}),3)*lt(t,${HIT})':eval=frame[riser];\
[1:a]volume=1.0[hit];\
[2:a]highpass=f=5000,volume='0.35*gte(t,${HIT})*exp(-12*${D})':eval=frame[sparkle];\
[3:a]volume=1.0[shing];\
[4:a]lowpass=f=200,afade=t=out:st=3.6:d=1.4,volume=0.8[hum];\
[riser][hit][sparkle][shing][hum]amix=inputs=5:normalize=0,\
alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" \
  -c:a pcm_s16le "out/${NAME}_sound.wav"

ffmpeg -y -v error -i "out/${NAME}_picture.mp4" -i "out/${NAME}_sound.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart \
  "out/${NAME}.mp4"

echo "Done! out/${NAME}.mp4"
