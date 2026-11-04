#!/usr/bin/env bash
# make_reel.sh: a 15-second vertical Instagram Reel teaser for "The Lighthouse".
#
# Format: 1080x1920 (9:16, vertical), 30 fps, H.264 + AAC (what Instagram wants).
#
#   0-7s   Scene A: the lighthouse beam sweeps the sea (+ 2 captions)   ← the "hook"
#   7-11s  Scene B: a tiny far-away light blinks back (+ "Until tonight.")
#   11-15s Scene C: title card "THE LIGHTHOUSE"
#
# Cost: free (FFmpeg only). All sound is generated, so no copyright problems.
#
# How to run it (from the repo's top folder):
#   bash 06-ai-video/03-instagram-reel/make_reel.sh

set -e
DIR="$(dirname "$0")"
OUT="$DIR/renders"
mkdir -p "$OUT"

FONT="/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
FONT_ITALIC="/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
GRAIN="noise=alls=7:allf=t"     # a bit less grain than the film: Instagram re-compresses video
ENCODE=(-c:v libx264 -profile:v high -crf 20 -maxrate 10M -bufsize 20M -pix_fmt yuv420p -r 30)  # max 10 Mbit/s keeps the file small

# Drawn at half size (540x960), then enlarged to 1080x1920.
SIZE="540x960"

# ---- Shared picture recipes (X,Y = pixel, W,H = size, T = time) -------------
HZ="(H*0.55)"
SKY="(10+22*Y/${HZ})"
SEA="(6+3*sin(Y*0.9-T*3+3*sin(X*0.015+T*0.5)))"
BASE="if(lt(Y,${HZ}),${SKY},${SEA})"

# ==== Scene A: the sweeping beam (7s) ========================================
A_LEN=7
SX="(W*0.22)"; SY="(H*0.47)"
ANGLE="atan2(Y-${SY},X-${SX})"
AIM="(-0.6+0.8*T/${A_LEN})"
DIST="hypot(X-${SX},Y-${SY})"
BEAM="if(gt(X,${SX}),exp(-pow((${ANGLE}-${AIM})/0.045,2))*exp(-${DIST}/(W*0.9))*if(lt(Y,${HZ}),1,0.25),0)"
GLOW="exp(-(pow(X-${SX},2)+pow(Y-${SY},2))/30)"
LIGHT="(${BEAM}+${GLOW})"
LAND="lt(X,W*0.40)*gt(Y,${HZ}-6-5*sin(X*0.03))"
TOWER="between(X,${SX}-3,${SX}+3)*between(Y,${SY},${HZ})"
SHADOW="max(${LAND},${TOWER})"

echo "Drawing Scene A (beam)..."
ffmpeg -y -v error \
  -f lavfi -i "color=c=black:s=${SIZE}:r=30:d=${A_LEN},format=gbrp" \
  -vf "geq=\
r='min(255,if(${SHADOW},3,${BASE}*0.55)+255*${LIGHT})':\
g='min(255,if(${SHADOW},4,${BASE}*0.80)+225*${LIGHT})':\
b='min(255,if(${SHADOW},6,${BASE}*1.15)+170*${LIGHT})',\
scale=1080:1920:flags=bicubic,${GRAIN},fade=t=in:st=0:d=0.3" \
  "${ENCODE[@]}" "$OUT/sceneA.mp4"

# ==== Scene B: the answering light (4s) ======================================
B_LEN=4; B_FRAMES=$((B_LEN * 30))
DX="(X-W*0.62)"; DY="(Y-${HZ}+1)"
BLINK="(exp(-pow((T-1.3)/0.12,2))+exp(-pow((T-2.1)/0.12,2)))"
DOT="${BLINK}*(exp(-(${DX}*${DX}+${DY}*${DY})/3)+0.35*exp(-(${DX}*${DX}+${DY}*${DY})/60))"
DARKBASE="(${BASE}*0.6)"

echo "Drawing Scene B (answering light)..."
ffmpeg -y -v error \
  -f lavfi -i "color=c=black:s=${SIZE}:r=30:d=${B_LEN},format=gbrp" \
  -vf "geq=\
r='min(255,${DARKBASE}*0.55+255*${DOT})':\
g='min(255,${DARKBASE}*0.80+215*${DOT})':\
b='min(255,${DARKBASE}*1.15+150*${DOT})',\
scale=4320:7680:flags=bicubic,\
zoompan=z='1+0.18*on/${B_FRAMES}':x='0.62*iw*(1-1/zoom)':y='0.55*ih*(1-1/zoom)':d=1:s=1080x1920:fps=30,\
${GRAIN}" \
  -frames:v ${B_FRAMES} "${ENCODE[@]}" "$OUT/sceneB.mp4"

# ==== Scene C: title card (4s) ===============================================
echo "Making Scene C (title)..."
ffmpeg -y -v error \
  -f lavfi -i "color=c=0x0E1C26:s=1080x1920:r=30:d=4" \
  -vf "vignette=angle=PI/4,\
drawtext=fontfile=${FONT}:text='THE LIGHTHOUSE':fontsize=104:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-60,\
drawtext=fontfile=${FONT_ITALIC}:text='a story told with code':fontsize=46:fontcolor=0xBBBBBB:x=(w-text_w)/2:y=(h/2)+40,\
${GRAIN},fade=t=in:st=0:d=1,fade=t=out:st=3.2:d=0.8" \
  "${ENCODE[@]}" "$OUT/sceneC.mp4"

# ==== Soundtrack (15s) ========================================================
echo "Making the soundtrack..."
ffmpeg -y -v error \
  -f lavfi -i "aevalsrc='0.5*sin(2*PI*55*t)+0.3*sin(2*PI*82.5*t)+0.15*sin(2*PI*110.55*t)':s=48000:d=15" \
  -f lavfi -i "anoisesrc=color=brown:sample_rate=48000:duration=15:amplitude=1" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=1.6:amplitude=1" \
  -f lavfi -i "aevalsrc='0.4*sin(2*PI*880*t)*(gte(t,8.3)*exp(-5*(t-8.3))+gte(t,9.1)*exp(-5*(t-9.1)))+0.2*sin(2*PI*1320*t)*(gte(t,8.3)*exp(-7*(t-8.3))+gte(t,9.1)*exp(-7*(t-9.1)))':s=48000:d=15" \
  -filter_complex "\
[0:a]tremolo=f=0.4:d=0.3,lowpass=f=300,\
volume='if(between(t,7,11),0.25,if(between(t,11,13),0.25+0.75*(t-11)/2,1))':eval=frame,\
afade=t=in:st=0:d=0.5,afade=t=out:st=13.5:d=1.5,volume=0.55[drone];\
[1:a]lowpass=f=500,tremolo=f=0.12:d=0.7,afade=t=in:st=0:d=0.5,afade=t=out:st=6:d=1.2,volume=0.9[waves];\
[2:a]highpass=f=200,lowpass=f=3000,afade=t=in:st=0:d=1.0,afade=t=out:st=1.0:d=0.6,adelay=10800:all=1,volume=0.5[whoosh];\
[3:a]volume=0.8[chimes];\
[drone][waves][whoosh][chimes]amix=inputs=4:normalize=0:duration=first,alimiter=limit=0.9" \
  -c:a pcm_s16le "$OUT/soundtrack.wav"

# ==== Put it together + captions ==============================================
# Captions sit at about 2/3 down the screen: clear of Instagram's buttons and caption text.
caption () {  # caption <text> <start> <end>
  echo "drawtext=fontfile=${FONT_ITALIC}:text='$1':fontsize=44:fontcolor=0xEEEEEE:shadowcolor=black@0.7:shadowx=2:shadowy=2:x=(w-text_w)/2:y=h*0.66:enable='between(t,$2,$3)'"
}

echo "Joining scenes..."
ffmpeg -y -v error \
  -i "$OUT/sceneA.mp4" -i "$OUT/sceneB.mp4" -i "$OUT/sceneC.mp4" -i "$OUT/soundtrack.wav" \
  -filter_complex "\
[0:v][1:v][2:v]concat=n=3:v=1:a=0,\
$(caption 'For forty years, she kept the light.' 0.3 3.4),\
$(caption 'Every night, the beam crossed empty water.' 3.7 6.8),\
$(caption 'Until tonight.' 9.4 10.9)[video]" \
  -map "[video]" -map 3:a \
  "${ENCODE[@]}" -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart \
  "$OUT/the_lighthouse_reel.mp4"

# A cover image (the picture people see before they tap play).
ffmpeg -y -v error -ss 12.5 -i "$OUT/the_lighthouse_reel.mp4" -frames:v 1 "$OUT/reel_cover.jpg"

echo "Done! Reel: $OUT/the_lighthouse_reel.mp4   Cover: $OUT/reel_cover.jpg"
