import React from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LighthouseTitle } from "./LighthouseTitle";
import { LowerThirdGraphic } from "./LowerThird";

// The FINAL cut of "The Lighthouse" (35 seconds, 1050 frames at 30 fps).
//
// Shots made with FFmpeg are placed on a timeline here, with Remotion adding:
//   - the animated title (Lesson 16)
//   - transitions (fade from black, match dissolve)
//   - animated word-by-word captions
//   - the lower third (Lesson 17)
//
// Shot timing matches the film's soundtrack, so picture and sound stay in sync.

const s = (seconds: number) => Math.round(seconds * 30); // seconds → frames
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const FINAL_DURATION = s(35);

// ---- A film shot that can fade in (opacity) and be slowed down slightly ----------
const Shot: React.FC<{
  file: string;
  fadeInFrames?: number;
  playbackRate?: number;
}> = ({ file, fadeInFrames = 0, playbackRate = 1 }) => {
  const frame = useCurrentFrame();
  const opacity =
    fadeInFrames > 0
      ? interpolate(frame, [0, fadeInFrames], [0, 1], clamp)
      : 1;
  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo src={staticFile(file)} playbackRate={playbackRate} />
    </AbsoluteFill>
  );
};

// ---- Animated caption: words rise in one by one, then the line fades out ----------
const Caption: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    clamp,
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Sits inside the bottom letterbox bar, like cinema subtitles */}
      <div
        style={{
          height: 138,
          display: "flex",
          alignItems: "center",
          fontFamily: "'Liberation Serif', serif",
          fontStyle: "italic",
          fontSize: 42,
          color: "#E6E2DA",
        }}
      >
        {words.map((word, i) => {
          const p = spring({
            frame: frame - i * 4, // stagger: a new word every 4 frames
            fps,
            config: { damping: 200 },
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: 12,
                opacity: p,
                transform: `translateY(${interpolate(p, [0, 1], [14, 0])}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const CAPTIONS: { text: string; from: number; to: number }[] = [
  { text: "For forty years, she kept the light.", from: 5.3, to: 8.8 },
  { text: "Every night, the same stairs. The same lamp.", from: 9.3, to: 12.8 },
  { text: "Every night, the beam crossed empty water.", from: 13.3, to: 16.8 },
  { text: "No ship had come in a very long time.", from: 17.3, to: 20.8 },
  { text: "Until tonight.", from: 23.4, to: 25.0 },
];

// ---- The timeline ---------------------------------------------------------------
export const LighthouseFinal: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* 0-5s: animated title (fades to black at its end) */}
      <Sequence durationInFrames={s(5)}>
        <LighthouseTitle />
      </Sequence>

      {/* 5-9s: Shot 2, fading up from black */}
      <Sequence from={s(5)} durationInFrames={s(4)}>
        <Shot file="shot02_cliff.mp4" fadeInFrames={18} />
      </Sequence>

      {/* 9-13s: Shot 3, hand turns the key, lamp lights */}
      <Sequence from={s(9)} durationInFrames={s(4)}>
        <Shot file="shot03_lamp.mp4" />
      </Sequence>

      {/* 12.6-17s: Shot 4 dissolves in over the lamp: MATCH DISSOLVE
          (the lamp's flame becomes the lighthouse's beam).
          It starts 0.4s early, so it plays 10% slower to still end at 17s. */}
      <Sequence from={s(12.6)} durationInFrames={s(4.4)}>
        <Shot file="shot04_beam.mp4" fadeInFrames={s(0.4)} playbackRate={4 / 4.4} />
      </Sequence>

      {/* 17-21s: Shot 5, the keeper at the window, with her lower third */}
      <Sequence from={s(17)} durationInFrames={s(4)}>
        <Shot file="shot05_window.mp4" />
        <LowerThirdGraphic
          name="ELEANOR MARSH"
          role="Lighthouse keeper  ·  40 years"
        />
      </Sequence>

      {/* 21-25s: Shot 6, the answering light (hard cut into silence) */}
      <Sequence from={s(21)} durationInFrames={s(4)}>
        <Shot file="shot06_answer.mp4" />
      </Sequence>

      {/* 25-30s: closing title */}
      <Sequence from={s(25)} durationInFrames={s(5)}>
        <Shot file="shot07_final.mp4" />
      </Sequence>

      {/* 30-35s: credits */}
      <Sequence from={s(30)} durationInFrames={s(5)}>
        <Shot file="credits.mp4" />
      </Sequence>

      {/* Captions on top of everything */}
      {CAPTIONS.map((c) => (
        <Sequence
          key={c.text}
          from={s(c.from)}
          durationInFrames={s(c.to - c.from)}
        >
          <Caption text={c.text} durationInFrames={s(c.to - c.from)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
