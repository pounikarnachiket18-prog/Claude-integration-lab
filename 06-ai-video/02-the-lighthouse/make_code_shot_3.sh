#!/usr/bin/env bash
# make_code_shot_3.sh: draws Shot 3 of "The Lighthouse" with math.
#
#   Shot 3 (4s): close-up in a dark room. A hand turns a brass key on an old
#                oil lamp. Click. The lamp flickers, then glows warm, and the
#                warm light slowly reveals the hand.
#
#   0.0-0.9s  dark, still            (only faint cold light from a window)
#   0.9-1.5s  the key turns a quarter turn
#   1.65s     the lamp catches: it flickers...
#   2.4-4.0s  ...then glows steadily, with a gentle flame flicker
#
# Same look as the other shots: film grain, letterbox bars. Silent.
# Cost: free (FFmpeg only).
#
# How to run it (from the repo's top folder):
#   bash 06-ai-video/02-the-lighthouse/make_code_shot_3.sh

set -e
OUT="$(dirname "$0")/shots"
mkdir -p "$OUT"

SECONDS_LONG=4
FRAMES=$((SECONDS_LONG * 30))

# ---- Timing ---------------------------------------------------------------------
TURN="clip((T-0.9)/0.6,0,1)"                                     # 0 → 1 while the key turns
TURN_SMOOTH="(${TURN}*${TURN}*(3-2*${TURN}))"                    # eases in and out, like a real hand
# How bright the lamp is: 0 = off, then flickering, then steady with a gentle wobble
LAMP="if(lt(T,1.65),0,if(lt(T,2.4),0.55+0.45*abs(sin(T*41)*sin(T*17)),0.92+0.08*sin(T*13)*sin(T*7.3)))"

# ---- Shapes (picture is 960x540; each "lt(..., 1)" means "inside this oval") ----
oval () { echo "(pow((X-($1))/($3),2)+pow((Y-($2))/($4),2))"; }   # oval centered at ($1,$2), size ($3,$4)
# tilted oval: same as oval, but turned by angle $5 (in radians; negative = tilts up to the right)
toval () { echo "(pow(((X-($1))*cos($5)+(Y-($2))*sin($5))/($3),2)+pow((-(X-($1))*sin($5)+(Y-($2))*cos($5))/($4),2))"; }

CHIM="$(oval 600 235 52 80)"                                      # the glass chimney of the lamp
FLAME="lt($(oval 600 252 9 "20+4*sin(T*19)"),1)*gt(${LAMP},0)"   # the flame (its height flickers)
METAL="max(max(lt($(oval 600 352 72 32),1),between(X,545,655)*between(Y,378,392)),max(between(X,578,622)*between(Y,312,322),between(X,570,630)*between(Y,148,158)))"  # round fuel tank, foot, neck, cap
# The key: a short shaft going into the lamp base, and a "bow" you hold.
# As it turns, the bow is seen more and more edge-on, so it looks thinner.
KEY="max(between(X,505,530)*between(Y,349,355),lt($(oval 497 352 11 "3+17*abs(cos(1.5708*${TURN_SMOOTH}))"),1))"
# The hand: forearm, palm, thumb and index finger pinching the key bow.
# Thumb and finger move a little as they twist the key.
HAND="max(max(lt($(toval 320 478 120 40 -0.62),1),lt($(toval 428 378 56 36 -0.35),1)),max(lt($(toval 474 "340+4*${TURN_SMOOTH}" 34 9 0.12),1),lt($(toval 474 "368-5*${TURN_SMOOTH}" 28 10 -0.28),1)))"  # forearm, palm, index finger, thumb

# ---- Light ---------------------------------------------------------------------
AMBIENT="(8+24*exp(-pow(X-120,2)/150000))"                         # faint cold light from a window on the left
WARMGLOW="(${LAMP}*exp(-(pow(X-600,2)+pow(Y-240,2))/57800))"      # warm lamplight, strongest at the lamp
HIGHLIGHT="(0.5+0.5*exp(-pow(X-600,2)/2500))"                     # shine in the middle of the brass

# channel <cool multiplier> <warm multiplier> <flame value>
# Builds the full color recipe for one color channel (red, green or blue).
channel () {
  local C=$1 W=$2 F=$3
  echo "min(255,\
if(${HAND},3*${C}+60*${WARMGLOW}*${W},\
if(${KEY},45*${C}+150*${LAMP}*${W},\
if(${METAL},7*${C}+110*${LAMP}*${W}*${HIGHLIGHT},\
if(lt(${CHIM},1),if(${FLAME},${F},if(gt(${CHIM},0.86),20*${C}+120*${LAMP}*${W},8*${C}+${LAMP}*${W}*(110+140*(1-${CHIM})))),\
${AMBIENT}*${C}+150*${WARMGLOW}*${W})))))"
}

echo "Drawing Shot 3 (hand, key and lamp)..."
ffmpeg -y -v error \
  -f lavfi -i "color=c=black:s=960x540:r=30:d=${SECONDS_LONG},format=gbrp" \
  -vf "geq=r='$(channel 0.55 1.00 255)':g='$(channel 0.80 0.66 235)':b='$(channel 1.15 0.32 190)',\
scale=1920:1080:flags=bicubic,\
noise=alls=10:allf=t,\
drawbox=x=0:y=0:w=iw:h=138:color=black:t=fill,\
drawbox=x=0:y=ih-138:w=iw:h=138:color=black:t=fill" \
  -frames:v "$FRAMES" -c:v libx264 -crf 20 -maxrate 12M -bufsize 24M -pix_fmt yuv420p -movflags +faststart \
  "$OUT/shot03_lamp.mp4"

echo "Done! Shot saved at: $OUT/shot03_lamp.mp4"
