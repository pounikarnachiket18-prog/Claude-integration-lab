#!/usr/bin/env bash
# sound.sh: synthesizes the whole soundtrack from the film's timeline (no samples).
# Every sound lands ONE FRAME (1/60 s ≈ 17 ms) after its picture event, so it reads as caused by it.
# Master: -14 LUFS, true peak ≤ -2 dBTP. Output: out/sound.wav, exactly 14.000 s.
#
# How to run it (from this folder):  bash sound.sh

set -e
cd "$(dirname "$0")"
mkdir -p out
F=0.0167   # one frame at 60 fps

# ---- building blocks (each prints a piece of a math formula; max(0,…) keeps exp() safe) ----
at () { echo "scale=4; $1 + $F" | bc; }                                   # event time + 1 frame
tone () { echo "between(t,$1,$1+$2)*$4*sin(2*PI*$3*t)*min(1,(t-$1)/0.005)*min(1,($1+$2-t)/0.02)"; }   # start dur freq amp
tick () { echo "gte(t,$1)*$2*sin(2*PI*$3*t)*exp(-$4*max(0,t-$1))"; }      # time amp freq decay
bump () { echo "gte(t,$1)*$2*sin(2*PI*(70*max(0,t-$1)+8*(1-exp(-10*max(0,t-$1)))))*exp(-9*max(0,t-$1))"; }
twang () { echo "gte(t,$1)*0.45*sin(2*PI*(110*max(0,t-$1)+0.6*sin(2*PI*7*max(0,t-$1))))*exp(-3.2*max(0,t-$1))"; }
creak () { echo "between(t,$1,$1+$2)*$3*sin(2*PI*(170*(t-$1)+35*(t-$1)*(t-$1)/$2))*(0.6+0.4*sin(2*PI*31*t))*sin(PI*(t-$1)/$2)"; }

FX="0"
add () { FX="$FX+$1"; }

# 0.00 low-battery double beep (frame 0)
add "$(tone $(at 0) 0.09 1000 0.32)"; add "$(tone $(at 0.18) 0.09 1000 0.32)"
# 0.62-1.76 scurry footsteps (fast) + drag steps
for i in $(seq 0 14); do add "$(tick $(at $(echo "0.62 + $i*0.076" | bc)) 0.16 520 70)"; done
for i in $(seq 0 9); do add "$(tick $(at $(echo "2.12 + $i*0.26" | bc)) 0.12 430 60)"; done
# 2.9-3.2 creak as the cable stretches, twang on the first yank (3.2), creak + twang + bump on the second (4.86)
add "$(creak $(at 2.9) 0.3 0.12)"; add "$(twang $(at 3.2))"; add "$(bump $(at 3.44) 0.3)"
add "$(creak $(at 4.5) 0.36 0.15)"; add "$(twang $(at 4.86))"; add "$(bump $(at 4.98) 0.4)"
# 6.62-9.45 a creak per push, growing with the stretch
for i in 0 1 2 3 4 5; do
  T=$(echo "6.62 + $i*0.472" | bc); A=$(echo "0.08 + $i*0.025" | bc)
  add "$(creak $(at $T) 0.3 $A)"; add "$(tick $(at $T) 0.1 380 60)"
done
# 9.60 CLICK + charging chime (C6 E6 G6)
add "$(tick $(at 9.6) 0.6 2900 220)"; add "$(tick $(at 9.6) 0.3 240 60)"
add "$(tick $(at 9.65) 0.22 1046.5 4)"; add "$(tick $(at 9.73) 0.2 1318.5 4)"; add "$(tick $(at 9.81) 0.2 1568 3.5)"
# 10.15-10.62 relieved sigh-whistle (falling), soft bump as he lands on his back
W=$(at 10.17)
add "between(t,$W,$W+0.45)*0.16*sin(2*PI*(1800*(t-$W)-1000*(t-$W)*(t-$W)))*sin(PI*(t-$W)/0.45)"
add "$(bump $(at 10.62) 0.35)"
# 11.30 tiny blip as 1% becomes 2%
add "$(tick $(at 11.3) 0.2 1320 25)"
# 12.12 + 12.38 a tiny tick per eye twitch
add "$(tick $(at 12.12) 0.18 3400 160)"; add "$(tick $(at 12.38) 0.18 3400 160)"
# 13.25 unplug pop + sad descending beep, 13.62 the plug lands
add "$(tick $(at 13.25) 0.5 420 45)"; add "$(tick $(at 13.25) 0.3 2200 150)"
add "$(tone $(at 13.3) 0.14 880 0.22)"; add "$(tone $(at 13.46) 0.14 740 0.22)"; add "$(tone $(at 13.62) 0.2 587.3 0.22)"
add "$(tick $(at 13.62) 0.18 500 70)"

# ---- music: a tense staccato loop on a 0.2 s grid, resolving into a major chord on the click ----
NOTES=(220 220 261.63 220 329.63 220 311.13 246.94)
MUSIC="0"
for k in 0 1 2 3 4 5 6 7; do
  MUSIC="$MUSIC+eq(mod(floor(t/0.2),8),$k)*0.11*sin(2*PI*${NOTES[$k]}*t)*exp(-22*mod(t,0.2))"
done
MUSIC="($MUSIC)*(lt(t,9.6)+gte(t,12.6)*clip((t-12.6)/0.6,0,1))"      # pauses for the relief, then returns
CHORD="between(t,9.62,12.6)*clip((t-9.62)/0.08,0,1)*clip((12.6-t)/1.0,0,1)*(0.07*sin(2*PI*220*t)+0.06*sin(2*PI*277.18*t)+0.05*sin(2*PI*329.63*t)+0.04*sin(2*PI*440*t))"

ffmpeg -y -v error \
  -f lavfi -i "aevalsrc='${FX}':s=48000:d=14" \
  -f lavfi -i "aevalsrc='${MUSIC}+${CHORD}':s=48000:d=14" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=14:amplitude=1" \
  -filter_complex "\
[0:a]volume=1.0[fx];\
[1:a]lowpass=f=3000,volume=0.8[music];\
[2:a]bandpass=f=900:width_type=o:w=2,volume='0.12*between(t,13.62,14)*clip((14-t)/0.38,0,1)+0.02*between(t,12.45,13.2)':eval=frame[noise];\
[fx][music][noise]amix=inputs=3:normalize=0,acompressor=threshold=0.08:ratio=3:attack=3:release=120:makeup=2,\
alimiter=limit=0.89,loudnorm=I=-14:TP=-2.4:LRA=11,aresample=48000,atrim=end=14" \
  -c:a pcm_s24le out/sound.wav

echo "Done! out/sound.wav"
