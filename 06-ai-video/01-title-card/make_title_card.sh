#!/usr/bin/env bash
# make_title_card.sh: makes a 5-second movie-style title card with FFmpeg.
#
# What you get: white text on a black screen that fades in, holds, then fades out.
# Cost: free. Uses only FFmpeg, no AI services.
#
# How to run it (from the repo's top folder):
#   bash 06-ai-video/01-title-card/make_title_card.sh

set -e  # stop immediately if any command fails

# ---- Settings you can change -------------------------------------------------
TITLE="THE LIGHTHOUSE"            # the big words on screen
SUBTITLE="a story told with code" # the small line underneath
SECONDS_LONG=5                    # how long the video is
FONT="/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"  # a classic movie-style font

# Save the video in the same folder as this script.
OUT_DIR="$(dirname "$0")"
OUT_FILE="$OUT_DIR/title_card.mp4"

# ---- Make the video ------------------------------------------------------------
ffmpeg -y \
  -f lavfi -i "color=c=black:s=1920x1080:r=30:d=${SECONDS_LONG}" \
  -vf "\
drawtext=fontfile=${FONT}:text='${TITLE}':fontsize=130:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40,\
drawtext=fontfile=${FONT}:text='${SUBTITLE}':fontsize=42:fontcolor=0xBBBBBB:x=(w-text_w)/2:y=(h/2)+80,\
fade=t=in:st=0:d=1.5,\
fade=t=out:st=3.5:d=1.5" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
  "$OUT_FILE"

echo "Done! Your video is at: $OUT_FILE"
