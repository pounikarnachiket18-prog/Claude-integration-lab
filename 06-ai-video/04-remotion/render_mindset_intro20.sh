#!/usr/bin/env bash
# render_mindset_intro20.sh: renders the 20-second MINDSET MODE INDIA channel intro.
#
# Sound (all generated from math, so there are no copyright problems):
#   0-5s    logo sounds: riser → bass hit (1.0s) + sparkle, "shing" (2.25s), low hum
#   5-15s   music at 120 BPM: kick on every beat, hi-hat between beats,
#           chords Am → F → C → G (one per line), an extra hit when each line starts,
#           and a riser into the end card
#   15-20s  chords F → C (a calm "resolved" ending), soft hit when the sun rises (16.0s),
#           pop when the button appears (16.73s), mouse CLICK (18.07s), bell DING (18.4s)
#
# Cost: free.
# How to run it (from the repo's top folder):
#   bash 06-ai-video/04-remotion/render_mindset_intro20.sh

set -e
cd "$(dirname "$0")"
mkdir -p out
NAME=mindset_mode_india_intro_20s

echo "Rendering the picture (20 seconds)..."
npx remotion render MindsetIntro20 "out/${NAME}_picture.mp4" --crf=18

# ---- helpers: each writes a piece of a math formula ------------------------------
# hit <time> <loudness>: a deep "boom" that drops in pitch (max(0,…) stops exp() overflowing)
hit () { echo "gte(t,$1)*$2*sin(2*PI*(42*max(0,t-$1)+10*(1-exp(-8*max(0,t-$1)))))*exp(-2.5*max(0,t-$1))"; }
# chord <start> <end> <f1> <f2> <f3> <f4>: soft notes that fade in/out over 0.4s at the edges
chord () { echo "clip(min((t-$1+0.4)/0.4,($2+0.4-t)/0.4),0,1)*(0.09*sin(2*PI*$3*t)+0.06*sin(2*PI*$4*t)+0.05*sin(2*PI*$5*t)+0.04*sin(2*PI*$6*t*1.002))"; }

# Kick drum on every beat from 5s to 15s (120 BPM = every 0.5s)
KICK="between(t,5,15)*0.85*sin(2*PI*(45*mod(t-5,0.5)+3*(1-exp(-25*mod(t-5,0.5)))))*exp(-7*mod(t-5,0.5))"
IMPACTS="$(hit 5 0.6)+$(hit 7.5 0.5)+$(hit 10 0.5)+$(hit 12.5 0.5)"
ENDHITS="$(hit 1.0 0.9)+$(hit 16.0 0.6)"
CHORDS="$(chord 5 7.5 110 220 261.63 329.63)+$(chord 7.5 10 87.31 174.61 220 261.63)"     # Am, F
CHORDS="$CHORDS+$(chord 10 12.5 130.81 164.81 196 261.63)+$(chord 12.5 15 98 196 246.94 293.66)"  # C, G
CHORDS="$CHORDS+$(chord 15 17.5 87.31 174.61 220 261.63)+$(chord 17.5 21 130.81 164.81 196 261.63)" # F, C
POP="gte(t,16.73)*0.35*sin(2*PI*660*t)*exp(-25*max(0,t-16.73))"
CLICK="gte(t,18.07)*(0.5*sin(2*PI*2400*t)*exp(-160*max(0,t-18.07))+0.3*sin(2*PI*300*t)*exp(-60*max(0,t-18.07)))"
DING="gte(t,18.4)*(0.30*sin(2*PI*1318.5*t)+0.18*sin(2*PI*1975.5*t))*exp(-2.8*max(0,t-18.4))"
SHING="gte(t,2.25)*(0.25*sin(2*PI*2637*t)+0.18*sin(2*PI*3520*t))*(1-exp(-30*max(0,t-2.25)))*exp(-4*max(0,t-2.25))"
HUM="between(t,1,5)*(0.22*sin(2*PI*55*t)+0.12*sin(2*PI*82.5*t))*clip((5-t)/1.4,0,1)"

echo "Making the music and sound effects..."
ffmpeg -y -v error \
  -f lavfi -i "aevalsrc='${KICK}+${IMPACTS}+${ENDHITS}':s=48000:d=20" \
  -f lavfi -i "aevalsrc='${CHORDS}':s=48000:d=20" \
  -f lavfi -i "aevalsrc='${POP}+${CLICK}+${DING}+${SHING}+${HUM}':s=48000:d=20" \
  -f lavfi -i "anoisesrc=color=white:sample_rate=48000:duration=20:amplitude=1" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=20:amplitude=1" \
  -filter_complex "\
[0:a]volume=1.0[drums];\
[1:a]tremolo=f=2:d=0.15,lowpass=f=2200,aecho=0.8:0.5:120:0.25,volume=1.1[pad];\
[2:a]volume=1.0[fx];\
[3:a]highpass=f=7000,volume='between(t,5,15)*0.22*exp(-40*mod(t-5.25,0.5))+0.35*gte(t,1)*lt(t,1.6)*exp(-12*max(0,t-1))':eval=frame[hats];\
[4:a]bandpass=f=1200:width_type=o:w=2,volume='0.8*pow(clip(t/1.0,0,1),3)*lt(t,1.0)+0.6*pow(clip((t-14)/1.0,0,1),3)*between(t,14,15)':eval=frame[risers];\
[drums][pad][fx][hats][risers]amix=inputs=5:normalize=0,afade=t=out:st=19:d=1,\
alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" \
  -c:a pcm_s16le "out/${NAME}_sound.wav"

echo "Combining..."
ffmpeg -y -v error -i "out/${NAME}_picture.mp4" -i "out/${NAME}_sound.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart \
  "out/${NAME}.mp4"

echo "Done! out/${NAME}.mp4"
