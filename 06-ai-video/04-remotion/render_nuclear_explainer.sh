#!/usr/bin/env bash
# render_nuclear_explainer.sh: renders the 45-second faceless explainer
# "How does a nuclear bomb explode?" with sound design.
#
# Sound (all generated from math, so there are no copyright problems):
#   whole video  a dark, low music bed that slowly builds tension, then drops away
#   0.0s         opening hit
#   9.5-11.5s    whoosh as the neutron flies in
#   12.5s        the SPLIT: crack + bright ping + deep hit
#   17.5-21.2s   a rising "ping" for each new generation of the chain reaction
#   21.8-26.5s   rumble building as the chain reaction runs away, then a sudden cut
#   29.6s        shimmer when E = mc² appears
#   32.5s        the EXPLOSION: crack, huge falling-pitch boom, long rumble, shockwave rush
#   40.5-45s     a quiet, sad chord for the ending
#
# Cost: free.
# How to run it (from the repo's top folder):
#   bash 06-ai-video/04-remotion/render_nuclear_explainer.sh

set -e
cd "$(dirname "$0")"
mkdir -p out
NAME=how_a_nuclear_bomb_explodes

echo "Rendering the picture (45 seconds)..."
npx remotion render NuclearExplainer "out/${NAME}_picture.mp4" --crf=18

# hit <time> <loudness> <start-pitch Hz> <decay>: a "boom" that drops in pitch
hit () { echo "gte(t,$1)*$2*sin(2*PI*(($3/4)*max(0,t-$1)+($3/8)*(1-exp(-6*max(0,t-$1)))))*exp(-$4*max(0,t-$1))"; }
# ping <time> <Hz>: a short bright bell tone
ping () { echo "gte(t,$1)*0.22*sin(2*PI*$2*t)*exp(-6*max(0,t-$1))"; }

# Music bed: D + A + F (D minor), louder as tension builds (0-32s), a breath of silence, then quiet
BED="(0.12*sin(2*PI*73.42*t)+0.08*sin(2*PI*110*t)+0.05*sin(2*PI*174.61*t*1.003))*(0.4+0.6*clip(t/32,0,1))*if(lt(t,31.9),1,if(lt(t,32.5),0.03,0.35))"   # near-silence just before the blast
ENDCHORD="clip((t-40.5)/1.5,0,1)*clip((45-t)/1.5,0,1)*(0.08*sin(2*PI*146.83*t)+0.06*sin(2*PI*220*t)+0.05*sin(2*PI*349.23*t)+0.04*sin(2*PI*329.63*t))"

HITS="$(hit 0 0.7 160 3)+$(hit 3.5 0.35 120 5)+$(hit 12.5 0.8 200 3.5)+$(hit 32.5 1.0 120 0.7)"
PINGS="$(ping 12.5 1567.98)"
G=0
for T in 17.5 18.5 19.333 20 20.5 20.9 21.233; do
  F=$(echo "scale=2; 440 * e($G * l(1.26))" | bc -l)   # each generation a step higher
  PINGS="$PINGS+$(ping $T $F)"
  G=$((G+1))
done
SHIMMER="gte(t,29.57)*(0.15*sin(2*PI*2093*t)+0.1*sin(2*PI*2637*t))*(1-exp(-20*max(0,t-29.57)))*exp(-2*max(0,t-29.57))"

echo "Designing the sound..."
ffmpeg -y -v error \
  -f lavfi -i "aevalsrc='${BED}+${ENDCHORD}':s=48000:d=45" \
  -f lavfi -i "aevalsrc='${HITS}+${PINGS}+${SHIMMER}':s=48000:d=45" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=45:amplitude=1" \
  -f lavfi -i "anoisesrc=color=brown:sample_rate=48000:duration=45:amplitude=1" \
  -f lavfi -i "anoisesrc=color=white:sample_rate=48000:duration=45:amplitude=1" \
  -filter_complex "\
[0:a]lowpass=f=900,volume=0.45[bed];\
[1:a]volume=1.0[fx];\
[2:a]bandpass=f=1500:width_type=o:w=2,\
volume='0.5*between(t,9.5,11.5)*pow((t-9.5)/2,2)+0.4*between(t,32.8,35)*sin(PI*clip((t-32.8)/2.2,0,1))':eval=frame[whoosh];\
[3:a]lowpass=f=400,\
volume='1.3*between(t,21.8,26.5)*pow(clip((t-21.8)/4.7,0,1),2)+1.8*gte(t,32.5)*exp(-0.5*max(0,t-32.5))':eval=frame[rumble];\
[4:a]highpass=f=3000,\
volume='0.6*gte(t,12.5)*exp(-30*max(0,t-12.5))+1.3*gte(t,32.5)*exp(-12*max(0,t-32.5))':eval=frame[crack];\
[bed][fx][whoosh][rumble][crack]amix=inputs=5:normalize=0,afade=t=out:st=44:d=1,\
alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" \
  -c:a pcm_s16le "out/${NAME}_sound.wav"

echo "Combining..."
ffmpeg -y -v error -i "out/${NAME}_picture.mp4" -i "out/${NAME}_sound.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart \
  "out/${NAME}.mp4"
ffmpeg -y -v error -ss 37.5 -i "out/${NAME}.mp4" -frames:v 1 -q:v 2 "out/${NAME}_cover.jpg"

echo "Done! out/${NAME}.mp4"
