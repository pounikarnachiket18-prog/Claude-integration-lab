#!/usr/bin/env bash
# make_rough_cut.sh: puts the whole 30-second film together: all 7 shots,
# narration captions and the soundtrack.
#
# Steps:
#   1. Make the end card (Shot 7)
#   2. (Placeholder cards: none needed any more, but the tool is kept for future films)
#   3. Make a 30-second soundtrack (drone, waves, key click, lamp, rain, whoosh, chimes)
#   4. Join all 7 shots in order, add narration as on-screen captions, add sound
#
# Cost: free (FFmpeg only).
# Needs: ../01-title-card/title_card_cinematic.mp4 and shots 2-6
#        (the script makes any missing ones for you).
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
ENCODE=(-c:v libx264 -crf 20 -maxrate 12M -bufsize 24M -pix_fmt yuv420p -r 30)

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
if [ ! -f "$SHOTS/shot02_cliff.mp4" ] || [ ! -f "$SHOTS/shot05_window.mp4" ]; then
  echo "Making Shots 2 and 5 first..."
  bash "$DIR/make_code_shots_2_and_5.sh"
fi
if [ ! -f "$SHOTS/shot03_lamp.mp4" ]; then
  echo "Making Shot 3 first..."
  bash "$DIR/make_code_shot_3.sh"
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

# ---- 2. Placeholder cards (not used now; handy for future films) ---------------
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
# Example: make_placeholder 3 "Old hands turn a brass key, lamp glows" "to make → film on iPad or AI"

# ---- 3. The 30-second soundtrack --------------------------------------------------
# drone : deep tone the whole time; quieter in Shot 6 (21-25s), swells at the end
# waves : soft rolling sea from 5s to 21s
# rain  : rain against the window during Shot 5 (17-21s)
# click : the key clicks (10.5s), then the lamp catches with a soft rush and warm hum (10.65s)
# whoosh: as the title appears
# chimes: two tiny bells, exactly when the far light blinks (22.3s and 23.1s)
echo "Making the soundtrack..."
ffmpeg -y -v error \
  -f lavfi -i "aevalsrc='0.5*sin(2*PI*55*t)+0.3*sin(2*PI*82.5*t)+0.15*sin(2*PI*110.55*t)':s=48000:d=30" \
  -f lavfi -i "anoisesrc=color=brown:sample_rate=48000:duration=30:amplitude=1" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=1.6:amplitude=1" \
  -f lavfi -i "anoisesrc=color=white:sample_rate=48000:duration=30:amplitude=1" \
  -f lavfi -i "aevalsrc='gte(t,10.5)*(0.5*sin(2*PI*2600*t)*exp(-140*max(0,t-10.5))+0.5*sin(2*PI*170*t)*exp(-45*max(0,t-10.5)))+0.06*sin(2*PI*120*t)*between(t,10.7,13)*min(1,(t-10.7)*3)*min(1,(13-t)*3)':s=48000:d=30" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=30:amplitude=1" \
  -f lavfi -i "aevalsrc='0.4*sin(2*PI*880*t)*(gte(t,22.3)*exp(-5*(t-22.3))+gte(t,23.1)*exp(-5*(t-23.1)))+0.2*sin(2*PI*1320*t)*(gte(t,22.3)*exp(-7*(t-22.3))+gte(t,23.1)*exp(-7*(t-23.1)))':s=48000:d=30" \
  -filter_complex "\
[0:a]tremolo=f=0.4:d=0.3,lowpass=f=300,\
volume='if(between(t,21,25),0.25,if(between(t,25,28),0.25+0.9*(t-25)/3,1))':eval=frame,\
afade=t=in:st=0:d=1.5,afade=t=out:st=28:d=2,volume=0.55[drone];\
[1:a]lowpass=f=500,tremolo=f=0.12:d=0.7,\
volume='between(t,5,21)':eval=frame,afade=t=in:st=5:d=1.5,afade=t=out:st=19.5:d=1.5,volume=0.9[waves];\
[2:a]highpass=f=200,lowpass=f=3000,afade=t=in:st=0:d=1.0,afade=t=out:st=1.0:d=0.6,adelay=200:all=1,volume=0.5[whoosh];\
[3:a]highpass=f=1500,lowpass=f=7000,tremolo=f=7:d=0.4,\
volume='between(t,16.8,21.2)':eval=frame,afade=t=in:st=16.8:d=0.6,afade=t=out:st=20.6:d=0.6,volume=0.12[rain];\
[4:a]volume=0.9[click];\
[5:a]lowpass=f=2500,volume='0.35*gte(t,10.65)*exp(-4*max(0,t-10.65))':eval=frame[ignite];\
[6:a]volume=0.8[chimes];\
[drone][waves][whoosh][rain][click][ignite][chimes]amix=inputs=7:normalize=0:duration=first,alimiter=limit=0.9" \
  -c:a pcm_s16le "$RENDERS/soundtrack.wav"

# ---- 4. Join everything, add captions + sound -------------------------------------
# Captions sit inside the bottom black bar, like subtitles in a cinema.
caption () {  # caption <text> <start second> <end second>
  echo "drawtext=fontfile=${FONT_ITALIC}:text='$1':fontsize=40:fontcolor=0xDDDDDD:x=(w-text_w)/2:y=h-138+(138-text_h)/2:enable='between(t,$2,$3)'"
}

echo "Joining all 7 shots..."
ffmpeg -y -v error -stats \
  -i "$SHOT1" \
  -i "$SHOTS/shot02_cliff.mp4" \
  -i "$SHOTS/shot03_lamp.mp4" \
  -i "$SHOTS/shot04_beam.mp4" \
  -i "$SHOTS/shot05_window.mp4" \
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
