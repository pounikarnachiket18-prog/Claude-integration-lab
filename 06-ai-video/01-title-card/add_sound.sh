#!/usr/bin/env bash
# add_sound.sh: makes two sounds from pure math and adds them to the cinematic title card.
#
#   1. Drone : a deep, low rumbling tone (the "movie trailer" feeling)
#   2. Whoosh: a soft rush of air as the title appears
#
# No recordings, no music files, so no copyright problems. Cost: free (FFmpeg only).
#
# Needs: title_card_cinematic.mp4 (run make_title_card_cinematic.sh first).
# How to run it (from the repo's top folder):
#   bash 06-ai-video/01-title-card/add_sound.sh

set -e

DIR="$(dirname "$0")"
VIDEO_IN="$DIR/title_card_cinematic.mp4"
VIDEO_OUT="$DIR/title_card_with_sound.mp4"
SECONDS_LONG=5

# ---- Settings you can change -------------------------------------------------
DRONE_NOTE=55        # pitch of the drone in Hz (vibrations per second). Lower = deeper.
DRONE_VOLUME=0.6
WHOOSH_START_MS=200  # when the whoosh begins, in milliseconds (1000 ms = 1 second)
WHOOSH_VOLUME=0.5

if [ ! -f "$VIDEO_IN" ]; then
  echo "Can't find $VIDEO_IN. Run make_title_card_cinematic.sh first."
  exit 1
fi

ffmpeg -y \
  -i "$VIDEO_IN" \
  -f lavfi -i "aevalsrc='0.5*sin(2*PI*${DRONE_NOTE}*t)+0.3*sin(2*PI*${DRONE_NOTE}*1.5*t)+0.15*sin(2*PI*${DRONE_NOTE}*2.01*t)':s=48000:d=${SECONDS_LONG}" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=1.6:amplitude=1" \
  -filter_complex "\
[1:a]tremolo=f=0.4:d=0.3,lowpass=f=300,afade=t=in:st=0:d=1.5,afade=t=out:st=3.5:d=1.5,volume=${DRONE_VOLUME}[drone];\
[2:a]highpass=f=200,lowpass=f=3000,afade=t=in:st=0:d=1.0,afade=t=out:st=1.0:d=0.6,adelay=${WHOOSH_START_MS}:all=1,volume=${WHOOSH_VOLUME}[whoosh];\
[drone][whoosh]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.9[sound]" \
  -map 0:v -map "[sound]" \
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart \
  "$VIDEO_OUT"

echo "Done! Your video with sound is at: $VIDEO_OUT"
