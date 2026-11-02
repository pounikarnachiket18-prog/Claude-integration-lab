#!/usr/bin/env bash
# make_title_card_cinematic.sh: version 2 of the title card, with movie tricks.
#
# Adds to version 1:
#   0. A moody background (dark blue with darker corners), so the bars are visible
#   1. Letterbox bars    : black bars top and bottom, like a cinema screen
#   2. Slow push-in      : the "camera" slowly moves toward the title
#   3. Film grain        : the soft, flickering texture of real film
#
# Cost: free. Uses only FFmpeg.
#
# How to run it (from the repo's top folder):
#   bash 06-ai-video/01-title-card/make_title_card_cinematic.sh

set -e

# ---- Settings you can change -------------------------------------------------
TITLE="THE LIGHTHOUSE"
SUBTITLE="a story told with code"
SECONDS_LONG=5
FONT="/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
BACKGROUND="0x0E1C26"   # dark blue-grey, written as a color code
ZOOM_AMOUNT=0.06        # 0.06 = push in by 6% over the whole video
GRAIN=10                # 0 = no grain, 20 = very grainy
BAR_HEIGHT=138          # 138 px top + bottom = the 2.39:1 "widescreen movie" shape

FRAMES=$((SECONDS_LONG * 30))   # 30 frames per second
OUT_FILE="$(dirname "$0")/title_card_cinematic.mp4"

ffmpeg -y \
  -f lavfi -i "color=c=${BACKGROUND}:s=1920x1080:r=30:d=${SECONDS_LONG}" \
  -vf "\
vignette=angle=PI/4,\
drawtext=fontfile=${FONT}:text='${TITLE}':fontsize=130:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40,\
drawtext=fontfile=${FONT}:text='${SUBTITLE}':fontsize=42:fontcolor=0xBBBBBB:x=(w-text_w)/2:y=(h/2)+80,\
scale=7680:-1,\
zoompan=z='1+${ZOOM_AMOUNT}*on/${FRAMES}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,\
noise=alls=${GRAIN}:allf=t,\
drawbox=x=0:y=0:w=iw:h=${BAR_HEIGHT}:color=black:t=fill,\
drawbox=x=0:y=ih-${BAR_HEIGHT}:w=iw:h=${BAR_HEIGHT}:color=black:t=fill,\
fade=t=in:st=0:d=1.5,\
fade=t=out:st=3.5:d=1.5" \
  -frames:v ${FRAMES} \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
  "$OUT_FILE"

echo "Done! Your video is at: $OUT_FILE"
