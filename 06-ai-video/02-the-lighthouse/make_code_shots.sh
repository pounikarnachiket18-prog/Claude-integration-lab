#!/usr/bin/env bash
# make_code_shots.sh: draws Shot 4 and Shot 6 of "The Lighthouse" with pure math.
#
#   Shot 4 (4s): a lighthouse beam sweeps slowly across a dark, empty sea
#   Shot 6 (4s): far on the horizon, a tiny light blinks back, twice
#
# Both are silent (sound gets added in the final edit) and match the
# title card's look: cold blue, film grain, letterbox bars.
# Cost: free (FFmpeg only).
#
# How to run it (from the repo's top folder):
#   bash 06-ai-video/02-the-lighthouse/make_code_shots.sh

set -e
OUT="$(dirname "$0")/shots"
mkdir -p "$OUT"

# We draw at half size (960x540) because drawing every pixel with math is slow,
# then enlarge to Full HD. Soft edges suit a misty night anyway.
SIZE="960x540"
SECONDS_LONG=4
FRAMES=$((SECONDS_LONG * 30))

# ---- Shared pieces of the picture (math "recipes" for each pixel) ------------
# In these formulas: X,Y = pixel position, W,H = picture width/height, T = time in seconds.
HZ="(H*0.56)"                                                     # where the horizon is
SKY="(10+22*Y/${HZ})"                                             # sky: darker at top, lighter near horizon
SEA="(6+3*sin(Y*0.9-T*3+3*sin(X*0.015+T*0.5)))"                   # sea: dark with gently moving ripples
BASE="if(lt(Y,${HZ}),${SKY},${SEA})"

# Finishing touches shared by both shots: enlarge, grain, letterbox bars, save.
FINISH="noise=alls=10:allf=t,\
drawbox=x=0:y=0:w=iw:h=138:color=black:t=fill,\
drawbox=x=0:y=ih-138:w=iw:h=138:color=black:t=fill"
ENCODE=(-frames:v "$FRAMES" -c:v libx264 -pix_fmt yuv420p -movflags +faststart)

# ==== SHOT 4: the sweeping beam ==============================================
SX="(W*0.16)"; SY="(H*0.40)"                                      # where the lamp is
ANGLE="atan2(Y-${SY},X-${SX})"                                    # direction from lamp to this pixel
AIM="(-0.22+0.5*T/${SECONDS_LONG})"                               # where the beam points (moves over time)
DIST="hypot(X-${SX},Y-${SY})"                                     # distance from the lamp
BEAM="if(gt(X,${SX}),exp(-pow((${ANGLE}-${AIM})/0.035,2))*exp(-${DIST}/(W*0.55))*if(lt(Y,${HZ}),1,0.25),0)"
GLOW="exp(-(pow(X-${SX},2)+pow(Y-${SY},2))/40)"                   # bright spot at the lamp
LIGHT="(${BEAM}+${GLOW})"
LAND="lt(X,W*0.27)*gt(Y,${HZ}-8-6*sin(X*0.02))"                   # dark cliff on the left
TOWER="between(X,${SX}-4,${SX}+4)*between(Y,${SY},${HZ})"         # the lighthouse tower
SHADOW="max(${LAND},${TOWER})"

echo "Drawing Shot 4 (beam)..."
ffmpeg -y -v error -stats \
  -f lavfi -i "color=c=black:s=${SIZE}:r=30:d=${SECONDS_LONG},format=gbrp" \
  -vf "geq=\
r='min(255,if(${SHADOW},3,${BASE}*0.55)+255*${LIGHT})':\
g='min(255,if(${SHADOW},4,${BASE}*0.80)+225*${LIGHT})':\
b='min(255,if(${SHADOW},6,${BASE}*1.15)+170*${LIGHT})',\
scale=1920:1080:flags=bicubic,${FINISH}" \
  "${ENCODE[@]}" "$OUT/shot04_beam.mp4"

# ==== SHOT 6: the answering light ============================================
DX="(X-W*0.63)"; DY="(Y-${HZ}+1)"                                 # distance from the far-away light
BLINK="(exp(-pow((T-1.3)/0.12,2))+exp(-pow((T-2.1)/0.12,2)))"    # two quick blinks, at 1.3s and 2.1s
DOT="${BLINK}*(exp(-(${DX}*${DX}+${DY}*${DY})/3)+0.35*exp(-(${DX}*${DX}+${DY}*${DY})/60))"
DARKBASE="(${BASE}*0.6)"                                          # darker night than Shot 4
ZOOM=0.15                                                         # push in 15% toward the light

echo "Drawing Shot 6 (answering light)..."
ffmpeg -y -v error -stats \
  -f lavfi -i "color=c=black:s=${SIZE}:r=30:d=${SECONDS_LONG},format=gbrp" \
  -vf "geq=\
r='min(255,${DARKBASE}*0.55+255*${DOT})':\
g='min(255,${DARKBASE}*0.80+215*${DOT})':\
b='min(255,${DARKBASE}*1.15+150*${DOT})',\
scale=7680:4320:flags=bicubic,\
zoompan=z='1+${ZOOM}*on/${FRAMES}':x='0.63*iw*(1-1/zoom)':y='0.56*ih*(1-1/zoom)':d=1:s=1920x1080:fps=30,\
${FINISH}" \
  "${ENCODE[@]}" "$OUT/shot06_answer.mp4"

echo "Done! Shots saved in: $OUT"
