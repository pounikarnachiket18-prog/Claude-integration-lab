#!/usr/bin/env bash
# render_sleep_reel.sh: renders the "5 Sleep Tips" Instagram Reel with sound.
#
#   1. Renders the picture in Remotion (1080x1920, 20 seconds)
#   2. Makes calm music from math: 4 soft chords (5s each) that blend into each other,
#      a quiet bass note, and a gentle echo for a sense of space
#   3. Adds a soft chime each time a new tip appears
#   4. Levels loudness to -14 LUFS, combines everything, and saves a cover image
#
# Cost: free. All sound is generated, so there are no copyright problems.
# How to run it (from the repo's top folder):
#   bash 06-ai-video/04-remotion/render_sleep_reel.sh

set -e
cd "$(dirname "$0")"
mkdir -p out

echo "Rendering the picture..."
npx remotion render SleepReel out/sleep_reel_picture.mp4 --crf=18

# ---- Music: chord k plays from start to start+5s, fading 0.8s in and out (crossfade) ----
# window <start> <end>: 0 → 1 → 0, so neighbouring chords overlap smoothly
window () { echo "max(0,min(1,min(($1+0.8-t)/0.8+0*t,min((t-($1)+0.8)/0.8,(($2)+0.8-t)/0.8))))"; }
chord () {  # chord <start> <end> <bass> <f1> <f2> <f3> <f4>
  echo "$(window $1 $2)*(0.10*sin(2*PI*$3*t)+0.07*sin(2*PI*$4*t)+0.06*sin(2*PI*$5*t)+0.05*sin(2*PI*$6*t)+0.04*sin(2*PI*$7*t*1.002))"
}
MUSIC="$(chord 0 5 87.31 174.61 220.00 261.63 329.63)"            # Fmaj7
MUSIC="$MUSIC+$(chord 5 10 110.00 220.00 261.63 329.63 392.00)"   # Am7
MUSIC="$MUSIC+$(chord 10 15 65.41 130.81 164.81 196.00 246.94)"   # Cmaj7
MUSIC="$MUSIC+$(chord 15 20 98.00 196.00 246.94 293.66 329.63)"   # G6

# ---- Chimes when each tip (and the final message) appears ----
CHIMES="0"
for T in 2.5 5.5 8.5 11.5 14.5 17.5; do
  # max(0, ...) keeps exp() from overflowing before the chime happens
  CHIMES="$CHIMES+gte(t,$T)*(0.18*sin(2*PI*1046.5*t)+0.08*sin(2*PI*1568*t))*exp(-3.5*max(0,t-$T))"
done

echo "Making the music..."
ffmpeg -y -v error \
  -f lavfi -i "aevalsrc='${MUSIC}':s=48000:d=20" \
  -f lavfi -i "aevalsrc='${CHIMES}':s=48000:d=20" \
  -filter_complex "\
[0:a]tremolo=f=0.25:d=0.25,lowpass=f=1800,afade=t=in:st=0:d=0.4,afade=t=out:st=18:d=2[music];\
[1:a]volume=0.9[chimes];\
[music][chimes]amix=inputs=2:normalize=0,aecho=0.8:0.6:90|170:0.30|0.18,\
alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" \
  -c:a pcm_s16le out/sleep_reel_sound.wav

echo "Combining..."
ffmpeg -y -v error -i out/sleep_reel_picture.mp4 -i out/sleep_reel_sound.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart \
  out/sleep_tips_reel.mp4

# Cover image: the hook, fully on screen
ffmpeg -y -v error -ss 1.8 -i out/sleep_tips_reel.mp4 -frames:v 1 -q:v 2 out/sleep_tips_cover.jpg

echo "Done! out/sleep_tips_reel.mp4  +  out/sleep_tips_cover.jpg"
