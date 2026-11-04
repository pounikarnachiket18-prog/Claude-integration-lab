#!/usr/bin/env bash
# render_rbi_documentary.sh: renders "1991: The Year India Pawned Its Gold",
# a 5.5-minute faceless documentary with NO voice (the story is on-screen text).
#
# Sound (no voice):
#   music   two Pixabay tracks (atlasaudio "Tension Documentary", leberch "Dark History"),
#           cross-faded: atlasaudio -> leberch -> atlasaudio again, faded out at the end
#   effects generated from math and noise, placed from the "sfx" cues in src/rbi/timeline.json:
#           boom (chapter cards), pop + typing clicks (motion beats), whip whooshes, hit, whoosh (maps), riser (charts), static (TV), paper (documents)
#   level   -14 LUFS, the YouTube loudness target
#
# The music files live in 06-rbi-documentary/assets/ (kept out of git).
# Cost: free.
# How to run it (from the repo's top folder):
#   bash 06-ai-video/04-remotion/render_rbi_documentary.sh
#   (add --audio-only to reuse an existing picture render)

set -e
cd "$(dirname "$0")"
mkdir -p out
NAME=rbi_1991_documentary
ASSETS=../06-rbi-documentary/assets
M1="$ASSETS/atlasaudio-tension-documentary-519912_1_.mp3"
M2="$ASSETS/leberch-dark-history-262605_1_.mp3"

if [ "$1" != "--audio-only" ]; then
  echo "Rendering the picture (about 5.5 minutes of video)..."
  npx remotion render RBIDocumentary "out/${NAME}_picture.mp4" --crf=18 --concurrency=4
fi

# Read the shot list and turn its "sfx" cues into sound expressions
eval "$(node -e '
const t = require("./src/rbi/timeline.json");
let c = 0; const cue = {};
for (const s of t.shots) {
  if (s.sfx) (cue[s.sfx] ||= []).push((c / t.fps).toFixed(3));
  c += Math.round(s.sec * t.fps) - t.overlap;
}
for (const T of cue.collage || []) {
  (cue.paper ||= []).push(...[0.15, 0.45, 0.8, 1.2].map((k) => (+T + k).toFixed(3)));
  (cue.hit ||= []).push((+T + 1.7).toFixed(3));
}
const dur = ((c + t.overlap) / t.fps).toFixed(3);
const hit = (T, a, f, d) => `gte(t,${T})*${a}*sin(2*PI*((${f}/4)*max(0,t-${T})+(${f}/8)*(1-exp(-6*max(0,t-${T})))))*exp(-${d}*max(0,t-${T}))`;
const tones = [
  ...(cue.boom || []).map((T) => hit(T, 0.9, 110, 2.2)),
  ...(cue.hit || []).map((T) => hit(T, 0.6, 170, 4)),
  ...(cue.pop || []).map((T) => hit((+T + 0.13).toFixed(3), 0.55, 520, 10)),
  ...(cue.pop || []).flatMap((T) => [0.5, 0.8, 1.1, 1.4, 1.7].map((k) => `gte(t,${T}+${k})*0.05*sin(2*PI*2200*t)*exp(-60*max(0,t-${T}-${k}))`)),
].join("+") || "0";
const sum = (list, f) => (list || []).map(f).join("+") || "0";
const whoosh = sum([...(cue.whoosh || []), ...(cue.pop || []), ...(cue.boom || [])], (T) => `0.6*between(t,${T}-0.15,${T}+0.35)*sin(PI*(t-${T}+0.15)/0.5)`) + "+" + sum(cue.whoosh, (T) => `0.6*between(t,${T},${T}+1.4)*sin(PI*(t-${T})/1.4)`) + "+" + sum(cue.boom, (T) => `0.35*between(t,${T}-0.8,${T})*pow((t-${T}+0.8)/0.8,2)`);
const riser = sum(cue.riser, (T) => `0.5*between(t,${T},${T}+2.5)*pow((t-${T})/2.5,2)`);
const stat = sum(cue.static, (T) => `0.35*between(t,${T},${T}+0.45)+0.06*between(t,${T}+0.45,${T}+7.5)`);
const paper = sum(cue.paper, (T) => `0.5*between(t,${T}+0.1,${T}+0.7)*abs(sin(PI*(t-${T})*9))`);
console.log(`DUR=${dur}`);
console.log(`TONES=\x27${tones}\x27`);
console.log(`WHOOSH=\x27${whoosh}\x27`);
console.log(`RISER=\x27${riser}\x27`);
console.log(`STATIC=\x27${stat}\x27`);
console.log(`PAPER=\x27${paper}\x27`);
')"
echo "Length: ${DUR}s"

echo "Designing the sound..."
ffmpeg -y -v error \
  -i "$M1" -i "$M2" -i "$M1" \
  -f lavfi -i "aevalsrc='${TONES}':s=48000:d=${DUR}" \
  -f lavfi -i "anoisesrc=color=pink:sample_rate=48000:duration=${DUR}:amplitude=1" \
  -f lavfi -i "anoisesrc=color=brown:sample_rate=48000:duration=${DUR}:amplitude=1" \
  -f lavfi -i "anoisesrc=color=white:sample_rate=48000:duration=${DUR}:amplitude=1" \
  -f lavfi -i "anoisesrc=color=white:sample_rate=48000:duration=${DUR}:amplitude=1:seed=7" \
  -filter_complex "\
[0:a]aresample=48000,aformat=channel_layouts=stereo[m1];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.7[m2];\
[2:a]aresample=48000,aformat=channel_layouts=stereo[m3];\
[m1][m2]acrossfade=d=4:c1=tri:c2=tri[m12];\
[m12][m3]acrossfade=d=4:c1=tri:c2=tri,atrim=0:${DUR},afade=t=in:d=1.5,afade=t=out:st=$(echo "$DUR-6" | bc):d=6,volume=0.55[music];\
[3:a]volume=0.9,aformat=channel_layouts=stereo[tones];\
[4:a]bandpass=f=1200:width_type=o:w=2,volume='${WHOOSH}':eval=frame,aformat=channel_layouts=stereo[whoosh];\
[5:a]lowpass=f=500,volume='${RISER}':eval=frame,aformat=channel_layouts=stereo[riser];\
[6:a]bandpass=f=3000:width_type=o:w=3,volume='${STATIC}':eval=frame,aformat=channel_layouts=stereo[static];\
[7:a]highpass=f=2500,lowpass=f=7000,volume='${PAPER}':eval=frame,aformat=channel_layouts=stereo[paper];\
[music][tones][whoosh][riser][static][paper]amix=inputs=6:normalize=0,\
alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" \
  -c:a pcm_s16le "out/${NAME}_sound.wav"

echo "Combining..."
ffmpeg -y -v error -i "out/${NAME}_picture.mp4" -i "out/${NAME}_sound.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart \
  "out/${NAME}.mp4"
ffmpeg -y -v error -ss 34 -i "out/${NAME}.mp4" -frames:v 1 -q:v 2 "out/${NAME}_cover.jpg"

echo "Done! out/${NAME}.mp4"
