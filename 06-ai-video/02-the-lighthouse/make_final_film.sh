#!/usr/bin/env bash
# make_final_film.sh: exports the FINAL version of "The Lighthouse" (35 seconds).
#
# Differences from the rough cut:
#   - Shot 2 fades up from black after the title (softer than a hard cut)
#   - Closing title without "coming soon"
#   - A 5-second credits card at the end, with its own quiet sound
#   - Loudness levelled to the streaming standard (-14 LUFS)
#   - Higher-quality export + a thumbnail image
#
# Cost: free (FFmpeg only).
# Uses the shots and soundtrack from make_rough_cut.sh (it runs that first if needed).
#
# How to run it (from the repo's top folder):
#   bash 06-ai-video/02-the-lighthouse/make_final_film.sh

set -e
DIR="$(dirname "$0")"
SHOTS="$DIR/shots"
RENDERS="$DIR/renders"
mkdir -p "$SHOTS" "$RENDERS"

# ---- Settings you can change -------------------------------------------------
FILMMAKER=""   # put your name here, e.g. FILMMAKER="Alex", to add "A film by Alex" to the credits

FONT="/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
FONT_ITALIC="/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
BARS="drawbox=x=0:y=0:w=iw:h=138:color=black:t=fill,drawbox=x=0:y=ih-138:w=iw:h=138:color=black:t=fill"
ENCODE=(-c:v libx264 -crf 20 -maxrate 12M -bufsize 24M -pix_fmt yuv420p -r 30)

# ---- 0. Make sure all shots + the soundtrack exist ------------------------------
SHOT1="$DIR/../01-title-card/title_card_cinematic.mp4"
NEEDED=("$SHOT1" "$SHOTS/shot02_cliff.mp4" "$SHOTS/shot03_lamp.mp4" "$SHOTS/shot04_beam.mp4" \
        "$SHOTS/shot05_window.mp4" "$SHOTS/shot06_answer.mp4" "$RENDERS/soundtrack.wav")
for f in "${NEEDED[@]}"; do
  if [ ! -f "$f" ]; then
    echo "Missing $f, so building the rough cut first..."
    bash "$DIR/make_rough_cut.sh"
    break
  fi
done

# ---- 1. Closing title (Shot 7, final version) ------------------------------------
echo "Making the closing title..."
ffmpeg -y -v error \
  -f lavfi -i "color=c=0x0E1C26:s=1920x1080:r=30:d=5" \
  -vf "vignette=angle=PI/4,\
drawtext=fontfile=${FONT}:text='THE LIGHTHOUSE':fontsize=130:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2,\
noise=alls=10:allf=t,${BARS},\
fade=t=in:st=0:d=1.5,fade=t=out:st=3.5:d=1.5" \
  "${ENCODE[@]}" "$SHOTS/shot07_final.mp4"

# ---- 2. Credits card (5s) ---------------------------------------------------------
echo "Making the credits..."
BYLINE=""
if [ -n "$FILMMAKER" ]; then
  BYLINE="drawtext=fontfile=${FONT_ITALIC}:text='A film by ${FILMMAKER}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=330,"
fi
ffmpeg -y -v error \
  -f lavfi -i "color=c=black:s=1920x1080:r=30:d=5" \
  -vf "${BYLINE}\
drawtext=fontfile=${FONT_ITALIC}:text='Every frame drawn with math.':fontsize=44:fontcolor=0xCCCCCC:x=(w-text_w)/2:y=440,\
drawtext=fontfile=${FONT_ITALIC}:text='Every sound made from numbers.':fontsize=44:fontcolor=0xCCCCCC:x=(w-text_w)/2:y=510,\
drawtext=fontfile=${FONT}:text='Made with FFmpeg + Claude Code  ·  2026':fontsize=32:fontcolor=0x8899AA:x=(w-text_w)/2:y=620,\
fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" \
  "${ENCODE[@]}" "$SHOTS/credits.mp4"

# ---- 3. Credits sound: a soft low tone and one last distant chime -----------------
ffmpeg -y -v error \
  -f lavfi -i "aevalsrc='0.12*sin(2*PI*55*t)+0.06*sin(2*PI*82.5*t)+0.25*sin(2*PI*880*t)*gte(t,0.8)*exp(-3*max(0,t-0.8))':s=48000:d=5" \
  -af "afade=t=in:st=0:d=1,afade=t=out:st=3.5:d=1.5" \
  -c:a pcm_s16le "$RENDERS/credits_sound.wav"

# ---- 4. Put it all together ---------------------------------------------------------
caption () {  # caption <text> <start> <end>, shown in the bottom black bar
  echo "drawtext=fontfile=${FONT_ITALIC}:text='$1':fontsize=40:fontcolor=0xDDDDDD:x=(w-text_w)/2:y=h-138+(138-text_h)/2:enable='between(t,$2,$3)'"
}

echo "Exporting the final film..."
ffmpeg -y -v error -stats \
  -i "$SHOT1" \
  -i "$SHOTS/shot02_cliff.mp4" \
  -i "$SHOTS/shot03_lamp.mp4" \
  -i "$SHOTS/shot04_beam.mp4" \
  -i "$SHOTS/shot05_window.mp4" \
  -i "$SHOTS/shot06_answer.mp4" \
  -i "$SHOTS/shot07_final.mp4" \
  -i "$SHOTS/credits.mp4" \
  -i "$RENDERS/soundtrack.wav" \
  -i "$RENDERS/credits_sound.wav" \
  -filter_complex "\
[1:v]fade=t=in:st=0:d=0.6[s2];\
[0:v][s2][2:v][3:v][4:v][5:v][6:v][7:v]concat=n=8:v=1:a=0,\
$(caption 'For forty years, she kept the light.' 5.3 8.8),\
$(caption 'Every night, the same stairs. The same lamp.' 9.3 12.8),\
$(caption 'Every night, the beam crossed empty water.' 13.3 16.8),\
$(caption 'No ship had come in a very long time.' 17.3 20.8),\
$(caption 'Until tonight.' 23.4 25)[video];\
[8:a][9:a]concat=n=2:v=0:a=1,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[audio]" \
  -map "[video]" -map "[audio]" \
  -c:v libx264 -crf 18 -maxrate 16M -bufsize 32M -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 256k -movflags +faststart \
  "$RENDERS/the_lighthouse_FINAL.mp4"

# Thumbnail: the lamp glowing in Shot 3 (a striking, warm image)
ffmpeg -y -v error -ss 12.0 -i "$RENDERS/the_lighthouse_FINAL.mp4" -frames:v 1 -q:v 2 "$RENDERS/the_lighthouse_thumbnail.jpg"

echo "Done! Final film: $RENDERS/the_lighthouse_FINAL.mp4"
echo "      Thumbnail:  $RENDERS/the_lighthouse_thumbnail.jpg"
