import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ---- Settings you can change ---------------------------------------------------
const TITLE = "THE LIGHTHOUSE";
const SUBTITLE = "a story told with code";
const FIRST_LETTER_AT = 10; // frame when the first letter starts
const STAGGER = 3; // frames between each letter (stagger)
const LINE_STARTS_AT = 55; // frame when the gold line starts drawing
const SUBTITLE_AT = 75; // frame when the subtitle appears
const FADE_OUT_AT = 125; // frame when everything starts fading out

// Colors from the film
const NAVY = "#0E1C26";
const GOLD = "#E8B865";
const WHITE = "#F4F1EA";

// ---- One letter that pops in with a spring ----------------------------------------
const Letter: React.FC<{ char: string; index: number }> = ({ char, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // spring() goes from 0 to 1 like a real spring: fast, a tiny overshoot, then settles.
  const pop = spring({
    frame: frame - (FIRST_LETTER_AT + index * STAGGER),
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const y = interpolate(pop, [0, 1], [40, 0]); // rises 40px into place
  const scale = interpolate(pop, [0, 1], [0.6, 1]); // grows from 60% to full size
  const blur = interpolate(pop, [0, 1], [8, 0]); // starts blurry, ends sharp
  const opacity = interpolate(pop, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        display: "inline-block",
        // keep spaces as spaces (an empty inline-block would collapse)
        whiteSpace: "pre",
        transform: `translateY(${y}px) scale(${scale})`,
        filter: `blur(${blur}px)`,
        opacity,
      }}
    >
      {char}
    </span>
  );
};

// ---- Film grain: random speckle that changes every frame ---------------------------
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            seed={frame}
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---- The whole title -------------------------------------------------------------
export const LighthouseTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Gold line draws from the middle outward, with smooth ease-in-out.
  const lineWidth = interpolate(
    frame,
    [LINE_STARTS_AT, LINE_STARTS_AT + 25],
    [0, 560],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // A soft warm glow behind the title, arriving with the line and gently "breathing".
  const glowIn = interpolate(
    frame,
    [LINE_STARTS_AT, LINE_STARTS_AT + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const glow = glowIn * (0.85 + 0.15 * Math.sin(frame / 12));

  // Subtitle fades in and rises slightly, easing out.
  const subtitleProgress = interpolate(
    frame,
    [SUBTITLE_AT, SUBTITLE_AT + 20],
    [0, 1],
    {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Very slow push-in on everything (like the film's camera).
  const pushIn = interpolate(frame, [0, durationInFrames], [1, 1.04]);

  // Fade everything out at the end.
  const fadeOut = interpolate(
    frame,
    [FADE_OUT_AT, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        {/* Background: navy, darker toward the corners (vignette) */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, #16293A 0%, ${NAVY} 45%, #05090C 100%)`,
          }}
        />

        {/* Warm glow */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 45% 30% at 50% 50%, rgba(232,184,101,0.18) 0%, rgba(232,184,101,0) 70%)`,
            opacity: glow,
          }}
        />

        {/* Title, line and subtitle */}
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            transform: `scale(${pushIn})`,
          }}
        >
          <div
            style={{
              fontFamily: "'Liberation Serif', serif",
              fontSize: 140,
              letterSpacing: 14,
              color: WHITE,
              textShadow: `0 0 ${30 * glow}px rgba(232,184,101,${0.35 * glow})`,
            }}
          >
            {TITLE.split("").map((char, i) => (
              <Letter key={i} char={char} index={i} />
            ))}
          </div>

          <div
            style={{
              width: lineWidth,
              height: 3,
              marginTop: 28,
              backgroundColor: GOLD,
              boxShadow: `0 0 14px ${GOLD}`,
              borderRadius: 2,
            }}
          />

          <div
            style={{
              fontFamily: "'Liberation Serif', serif",
              fontStyle: "italic",
              fontSize: 46,
              color: "#BFC6CC",
              marginTop: 30,
              opacity: subtitleProgress,
              transform: `translateY(${interpolate(subtitleProgress, [0, 1], [16, 0])}px)`,
            }}
          >
            {SUBTITLE}
          </div>
        </AbsoluteFill>

        <Grain />
      </AbsoluteFill>

      {/* Letterbox bars (2.39:1 widescreen look) */}
      <AbsoluteFill style={{ justifyContent: "space-between" }}>
        <div style={{ height: 138, backgroundColor: "black" }} />
        <div style={{ height: 138, backgroundColor: "black" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
