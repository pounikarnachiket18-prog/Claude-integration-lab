#!/usr/bin/env bash
# make_code_shots_2_and_5.sh: draws Shot 2 and Shot 5 of "The Lighthouse" with math.
#
#   Shot 2 (4s): the lighthouse on its cliff at dusk, storm clouds drifting,
#                waves breaking below. The camera drifts slowly right.
#   Shot 5 (4s): the keeper's silhouette at a window, seen from behind,
#                rain running down the glass, the beam passing overhead outside.
#
# Same look as the other shots: cold blue, film grain, letterbox bars. Silent.
# Cost: free (FFmpeg only).
#
# How to run it (from the repo's top folder):
#   bash 06-ai-video/02-the-lighthouse/make_code_shots_2_and_5.sh

set -e
OUT="$(dirname "$0")/shots"
mkdir -p "$OUT"

SECONDS_LONG=4
FRAMES=$((SECONDS_LONG * 30))
FINISH="noise=alls=10:allf=t,\
drawbox=x=0:y=0:w=iw:h=138:color=black:t=fill,\
drawbox=x=0:y=ih-138:w=iw:h=138:color=black:t=fill"
ENCODE=(-frames:v "$FRAMES" -c:v libx264 -crf 20 -maxrate 12M -bufsize 24M -pix_fmt yuv420p -movflags +faststart)

# ==== SHOT 2: lighthouse on the cliff, storm at dusk ==========================
# Drawn a little wider than the screen (1040 instead of 960) so the camera can drift.
HZ="(H*0.56)"
YN="(Y/${HZ})"                                                    # 0 at the top of the sky, 1 at the horizon
# Dusk sky: deep blue at the top, pale grey-blue near the horizon (one formula per color)
SKY_R="(18+55*${YN}*${YN})"; SKY_G="(24+52*${YN}*${YN})"; SKY_B="(40+45*${YN}*${YN})"
# Sea: dark, with moving ripples, little white wave-tops, and waves breaking at the cliff
RIPPLE="(4*sin(Y*0.9-T*3+3*sin(X*0.015+T*0.5)))"
WAVETOPS="gt(sin(X*0.083+T*1.5+2*sin(Y*0.37+X*0.01))*sin(Y*1.1-T*2.5),0.93)*(Y-${HZ})/(H-${HZ})*40"
EDGEX="(W*0.40+sqrt(max(0,Y-${HZ}+40)/0.012))"                       # where the cliff meets the water, row by row
SURF="exp(-pow((X-${EDGEX})/9,2))*gt(Y,${HZ})*(0.55+0.45*sin(T*2.5+Y*0.15))*80"   # waves breaking along the cliff
SEA="(${RIPPLE}+${WAVETOPS}+${SURF})"
# The cliff (dark shape, left side) and the lighthouse on top of it
CLIFFTOP="if(lt(X,W*0.40),${HZ}-40-6*sin(X*0.05),${HZ}-40+pow(X-W*0.40,2)*0.012)"   # flat top, then curves down into the sea
CLIFF="gt(Y,${CLIFFTOP})"
TX="(W*0.28)"; TTOP="(${HZ}-150)"
TOWER="between(Y,${TTOP},${HZ}-38)*lt(abs(X-${TX}),6+4*(Y-${TTOP})/110)"  # gets wider toward the bottom
LAMP="exp(-(pow(X-${TX},2)+pow(Y-${TTOP}+4,2))/50)"               # warm lamp glow at the top
DARK="max(${CLIFF},${TOWER})"

R2="if(lt(Y,${HZ}),${SKY_R},6+${SEA})"
G2="if(lt(Y,${HZ}),${SKY_G},10+${SEA})"
B2="if(lt(Y,${HZ}),${SKY_B},16+${SEA})"

echo "Drawing Shot 2 (lighthouse in the storm)..."
ffmpeg -y -v error \
  -f lavfi -i "color=c=black:s=1040x540:r=30:d=${SECONDS_LONG},format=gbrp" \
  -f lavfi -i "color=c=gray:s=40x11:r=30:d=${SECONDS_LONG},noise=c0s=90:c1s=0:c2s=0,scale=2080:540:flags=bicubic,format=gbrp" \
  -f lavfi -i "color=c=gray:s=104x28:r=30:d=${SECONDS_LONG},noise=c0s=60:c1s=0:c2s=0,scale=2080:540:flags=bicubic,format=gbrp" \
  -filter_complex "\
[0:v]geq=\
r='min(255,if(${DARK},4,${R2})+255*${LAMP})':\
g='min(255,if(${DARK},5,${G2})+200*${LAMP})':\
b='min(255,if(${DARK},8,${B2})+120*${LAMP})'[scene];\
[1:v][2:v]blend=all_mode=average,lut=c0='clip((val-128)*2.5+128,0,255)':c1='clip((val-128)*2.5+128,0,255)':c2='clip((val-128)*2.5+128,0,255)',\
crop=1040:540:x='t*25':y=0[clouds];\
[scene][clouds]blend=all_expr='if(lt(Y,H*0.56)*gt(A,10)*lt(A,120),\
A*(1-0.55*clip((B-100)/110,0,1)*(1-0.5*Y/(H*0.56)))+45*clip((B-100)/110,0,1)*(1-0.5*Y/(H*0.56)),A)',\
scale=2080:1080:flags=bicubic,crop=1920:1080:x='t*30':y=0,${FINISH}" \
  "${ENCODE[@]}" "$OUT/shot02_cliff.mp4"

# ==== SHOT 5: the keeper at the rainy window ==================================
# Picture is 960x540. The window fills the middle; she stands in front, seen from behind.
WIN="between(X,250,750)*between(Y,90,470)"                        # inside the window
BARS_WIN="max(lt(abs(X-500),4),lt(abs(Y-270),4))"                 # the cross-shaped window frame
OHZ="300"                                                         # horizon seen through the window
OUT_SKY="(14+26*(Y-90)/(${OHZ}-90))"
OUT_SEA="(13+3*sin(Y*0.9-T*3+3*sin(X*0.015)))"
OUTSIDE="if(lt(Y,${OHZ}),${OUT_SKY},${OUT_SEA})"
# The lighthouse beam passes over the sky outside, once, left to right
SWEEP="exp(-pow((X-(150+T*180)+(Y-90)*0.6)/45,2))*lt(Y,${OHZ})"
# Rain running down the glass: every 7th pixel column may carry a falling drop with a tail
COL="floor(X/7)"
DROPY="mod(T*(60+mod(${COL}*53,90))+${COL}*97,560)-20"
TAIL="(${DROPY}-Y)"
RAIN="between(${TAIL},0,28)*lt(mod(X,7),1.6)*gt(mod(${COL}*31,10),6)*(1-${TAIL}/28)"
# Her silhouette: a head (oval), neck, and shoulders, in black
HEAD="lt(pow((X-420)/42,2)+pow((Y-300)/54,2),1)"
NECK="between(X,400,440)*between(Y,330,380)"
SHOULDERS="lt(pow((X-420)/165,2)+pow((Y-545)/165,2),1)"
BODY="max(max(${HEAD},${NECK}),${SHOULDERS})"
# A thin warm edge on her head from a lamp behind her (a "rim light")
RIM="lt(pow((X-420)/45,2)+pow((Y-298)/57,2),1)*(1-${HEAD})*lt(X,420)"
# The room: almost black, slightly lit near the window, a little brighter when the beam passes
ROOM="(5+10*exp(-(pow(X-500,2)/90000+pow(Y-280,2)/40000))+6*${SWEEP})"

PIC="if(${BODY},2,if(${WIN}*(1-${BARS_WIN}),${OUTSIDE}+120*${SWEEP}+38*${RAIN},${ROOM}))"

echo "Drawing Shot 5 (keeper at the window)..."
ffmpeg -y -v error \
  -f lavfi -i "color=c=black:s=960x540:r=30:d=${SECONDS_LONG},format=gbrp" \
  -vf "geq=\
r='min(255,${PIC}*0.55+110*${RIM})':\
g='min(255,${PIC}*0.80+75*${RIM})':\
b='min(255,${PIC}*1.15+40*${RIM})',\
scale=1920:1080:flags=bicubic,${FINISH}" \
  "${ENCODE[@]}" "$OUT/shot05_window.mp4"

echo "Done! Shots saved in: $OUT"
