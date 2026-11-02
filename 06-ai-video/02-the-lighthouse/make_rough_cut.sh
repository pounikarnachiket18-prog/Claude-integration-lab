#!/usr/bin/env bash
# make_rough_cut.sh: puts the whole 30-second film together, using simple
# placeholder cards for the shots we don't have yet.
#
# Steps:
#   1. Make the end card (Shot 7)
#   2. Make placeholder cards for Shots 2, 3 and 5
#   3. Make a 30-second soundtrack (drone, waves, whoosh, two soft chimes)
#   4. Join all 7 shots in order, add narration as on-screen captions, add sound
#
# Cost: free (FFmpeg only).
# Needs: ../01-title-card/title_card_cinematic.mp4 and shots 4 + 6
#        (the script makes shots 4 + 6 for you if they're missing).
#
# How to run it (from the repo's top folder):
#   bash 06-ai-video/02-the-lighthouse/make_rough_cut.sh

set -e
DIR="$(dirname "$0")"
SHOTS="$DIR/shots"
RENDERS="$DIR/renders"
mkdir -p "$SHOTS" "$RENDERS"

FONT="/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
FONT_ITALIC="/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf"
FONT_PLAIN="/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
BARS="drawbox=x=0:y=0:w=iw:h=138:color=black:t=fill,drawbox=x=0:y=ih-138:w=iw:h=138:color=black:t=fill"
ENCODE=(-c:v libx264 -pix_fmt yuv420p -r 30)

# ---- Check the shots we already have ------------------------------------------
SHOT1="$DIR/../01-title-card/title_card_cinematic.mp4"
if [ ! -f "$SHOT1" ]; then
  echo "Making Shot 1 (title card) first..."
  bash "$DIR/../01-title-card/make_title_card_cinematic.sh"
fi
if [ ! -f "$SHOTS/shot04_beam.mp4" ] || [ ! -f "$SHOTS/shot06_answer.mp4" ]; then
  echo "Making Shots 4 and 6 first..."
  bash "$DIR/make_code_shots.sh"
fi

# ---- 1. End card (Shot 7): same style as the title, with "coming soon" -------
echo "Making Shot 7 (end card)..."
ffmpeg -y -v error \
  -f lavfi -i "color=c=0x0E1C26:s=1920x1080:r=30:d=5" \
  -vf "vignette=angle=PI/4,\
drawtext=fontfile=${FONT}:text='THE LIGHTHOUSE':fontsize=130:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40,\
drawtext=fontfile=${FONT_ITALIC}:text='coming soon':fontsize=46:fontcolor=0xBBBBBB:x=(w-text_w)/2:y=(h/2)+80,\
noise=alls=10:allf=t,${BARS},\
fade=t=in:st=0:d=1.5,fade=t=out:st=3.5:d=1.5" \
  "${ENCODE[@]}" "$SHOTS/shot07_end.mp4"

# ---- 2. Placeholder cards for missing shots -------------------------------------
# make_placeholder <shot number> <description> <how we'll make it>
make_placeholder () {
  echo "Making placeholder for Shot $1..."
  ffmpeg -y -v error \
    -f lavfi -i "color=c=0x1E252B:s=1920x1080:r=30:d=4" \
    -vf "\
drawtext=fontfile=${FONT_PLAIN}:text='SHOT $1  ·  PLACEHOLDER':fontsize=34:fontcolor=0xE0A040:x=(w-text_w)/2:y=200,\
drawtext=fontfile=${FONT}:text='$2':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-20,\
drawtext=fontfile=${FONT_PLAIN}:text='$3':fontsize=32:fontcolor=0x8899AA:x=(w-text_w)/2:y=(h/2)+70,\
${BARS}" \
    "${ENCODE[@]}" "$SHOTS/shot0$1_placeholder.mp4"
}
make_placeholder 2 "Lighthouse on a cliff, storm at dusk" "to make → stock clip or AI"
make_placeholder 3 "Old hands turn a brass key, lamp glows" "to make → film on iPad or AI"
make_placeholder 5 "Keeper at a rainy window, looking out" "to make → stock clip or AI"

# ---- 3. The 30-second soundtrack --------------------------------------------------
# drone : deep tone the whole time; quieter in Shot 6 (21-25s), swells at the end
# waves : soft rolling sea from 5s to 21s
# whoosh: as the title appears
# chimes: two tiny bells, exactly when the far light blinks (22.3s and 23.1s)
echo "Making the soundtrack..."
ffmpeg -y -v error \
  -f lavfi -i "aevalsrc='0.5*sin(2*PI*55*t)+0.3*sin(2*PI*82.5*t)+0.15*sin(2*PI*110.55*t)':s=48000:d=30" \
  -f lavfi -i "anoisesrc=color=brown:sample_rate=48000:duration=30:amplitude=1" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=1.6:amplitude=1" \
  -f lavfi -i "aevalsrc='0.4*sin(2*PI*880*t)*(gte(t,22.3)*exp(-5*(t-22.3))+gte(t,23.1)*exp(-5*(t-23.1)))+0.2*sin(2*PI*1320*t)*(gte(t,22.3)*exp(-7*(t-22.3))+gte(t,23.1)*exp(-7*(t-23.1)))':s=48000:d=30" \
  -filter_complex "\
[0:a]tremolo=f=0.4:d=0.3,lowpass=f=300,\
volume='if(between(t,21,25),0.25,if(between(t,25,28),0.25+0.9*(t-25)/3,1))':eval=frame,\
afade=t=in:st=0:d=1.5,afade=t=out:st=28:d=2,volume=0.55[drone];\
[1:a]lowpass=f=500,tremolo=f=0.12:d=0.7,\
volume='between(t,5,21)':eval=frame,afade=t=in:st=5:d=1.5,afade=t=out:st=19.5:d=1.5,volume=0.9[waves];\
[2:a]highpass=f=200,lowpass=f=3000,afade=t=in:st=0:d=1.0,afade=t=out:st=1.0:d=0.6,adelay=200:all=1,volume=0.5[whoosh];\
[3:a]volume=0.8[chimes];\
[drone][waves][whoosh][chimes]amix=inputs=4:normalize=0:duration=first,alimiter=limit=0.9" \
  -c:a pcm_s16le "$RENDERS/soundtrack.wav"

# ---- 4. Join everything, add captions + sound -------------------------------------
# Captions sit inside the bottom black bar, like subtitles in a cinema.
caption () {  # caption <text> <start second> <end second>
  echo "drawtext=fontfile=${FONT_ITALIC}:text='$1':fontsize=40:fontcolor=0xDDDDDD:x=(w-text_w)/2:y=h-138+(138-text_h)/2:enable='between(t,$2,$3)'"
}

echo "Joining all 7 shots..."
ffmpeg -y -v error -stats \
  -i "$SHOT1" \
  -i "$SHOTS/shot02_placeholder.mp4" \
  -i "$SHOTS/shot03_placeholder.mp4" \
  -i "$SHOTS/shot04_beam.mp4" \
  -i "$SHOTS/shot05_placeholder.mp4" \
  -i "$SHOTS/shot06_answer.mp4" \
  -i "$SHOTS/shot07_end.mp4" \
  -i "$RENDERS/soundtrack.wav" \
  -filter_complex "\
[0:v][1:v][2:v][3:v][4:v][5:v][6:v]concat=n=7:v=1:a=0,\
$(caption 'For forty years, she kept the light.' 5.3 8.8),\
$(caption 'Every night, the same stairs. The same lamp.' 9.3 12.8),\
$(caption 'Every night, the beam crossed empty water.' 13.3 16.8),\
$(caption 'No ship had come in a very long time.' 17.3 20.8),\
$(caption 'Until tonight.' 23.4 25)[video]" \
  -map "[video]" -map 7:a \
  "${ENCODE[@]}" -c:a aac -b:a 192k -shortest -movflags +faststart \
  "$RENDERS/rough_cut.mp4"

echo "Done! Your rough cut is at: $RENDERS/rough_cut.mp4"
