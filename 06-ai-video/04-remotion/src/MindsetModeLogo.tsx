import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// 5-second YouTube logo reveal for MINDSET MODE INDIA (1920x1080, 30 fps, 150 frames).
// Same animation recipe as LogoReveal.tsx, with a new icon: a sun rising over a mountain peak.
//
//   0.0-0.8s  a gold line draws across the dark screen       (sound: rising "riser")
//   0.4-1.2s  mountains, sun outline and summit flag DRAW themselves
//   1.0s      the sun RISES into place (spring with overshoot) (sound: deep bass hit)
//   1.1-1.8s  sun rays flash out, sparks fly
//   1.2-1.9s  channel name drops in from behind the line, letter by letter
//   2.2-3.1s  a light SWEEP glides across the name           (sound: "shing")
//   2.6s      tagline fades in
//   4.2-5.0s  everything pushes in and fades to black

// ---- Settings you can change ---------------------------------------------------
export const CHANNEL_NAME = "MINDSET MODE INDIA";
const TAGLINE = "Think Big  ·  Grow Daily";
const GOLD = "#FF9F43"; // saffron
const GOLD_LIGHT = "#FFDDB0"; // light saffron
const BG = "#07080C";
const FONT = "'Liberation Sans', sans-serif";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const MINDSET_LOGO_DURATION = 150;

// ---- The icon: a sun rising behind a mountain peak with a summit flag (SVG) ----------
export const MindsetIcon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Line drawing": each stroke is revealed from 0% to 100% of its length.
  // pathLength={1} lets us treat every path as length 1, whatever its real size.
  const draw = (start: number, len: number) =>
    interpolate(frame, [start, start + len], [1, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });

  // The sun rises with a little overshoot (spring), like it's eager to start the day
  const rise = spring({ frame: frame - 30, fps, config: { damping: 9, stiffness: 120 } });
  const sunY = interpolate(rise, [0, 1], [34, 0]);
  const rays = interpolate(frame, [32, 40, 60], [0, 1, 0.75], clamp);
  const turn = interpolate(frame, [32, 150], [-6, 6]); // rays slowly turn

  const stroke = {
    fill: "none",
    stroke: GOLD,
    strokeWidth: 3.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
    strokeDasharray: 1,
  };

  // 9 sun rays fanned across the top half of the sun
  const rayLines = new Array(9).fill(0).map((_, i) => {
    const a = ((200 + i * 17.5) * Math.PI) / 180;
    return { x1: 80 + Math.cos(a) * 34, y1: 100 + Math.sin(a) * 34, x2: 80 + Math.cos(a) * 45, y2: 100 + Math.sin(a) * 45 };
  });

  return (
    <svg width={400} height={400} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      {/* Sun rays (behind everything) */}
      <g opacity={rays} transform={`rotate(${turn} 80 100) translate(80 100) scale(${0.6 + 0.4 * rays}) translate(-80 -100)`}>
        {rayLines.map((r, i) => (
          <line key={i} {...r} stroke={GOLD_LIGHT} strokeWidth={3} strokeLinecap="round" />
        ))}
      </g>

      {/* Sun: outline draws first, then the filled sun rises into it */}
      <circle cx={80} cy={100} r={26} {...stroke} strokeDashoffset={draw(14, 16)} />
      <circle
        cx={80}
        cy={100 + sunY}
        r={20}
        fill={GOLD_LIGHT}
        opacity={Math.min(1, rise * 2)}
        style={{ filter: `drop-shadow(0 0 ${12 * rise}px ${GOLD})` }}
      />

      {/* Mountains: a dark filled shape hides the bottom of the sun... */}
      <path d="M18,172 L58,124 L84,142 L132,84 L184,172 Z" fill={BG} />
      {/* ...and its outline draws itself */}
      <path d="M18,172 L58,124 L84,142 L132,84 L184,172" {...stroke} strokeDashoffset={draw(16, 18)} />
      <path d="M10,172 L190,172" {...stroke} strokeDashoffset={draw(12, 14)} />

      {/* Summit flag: you made it to the top */}
      <path d="M132,84 L132,64" {...stroke} strokeDashoffset={draw(30, 8)} />
      <path d="M132,64 L147,69.5 L132,75" {...stroke} strokeDashoffset={draw(34, 8)} />
    </svg>
  );
};

// ---- Sparks that burst out when the lamp lights ---------------------------------------
const Sparks: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - 31;
  if (t < 0 || t > 40) return null;
  return (
    <AbsoluteFill>
      {new Array(26).fill(0).map((_, i) => {
        const angle = random(`a${i}`) * Math.PI * 2;
        const speed = 6 + random(`s${i}`) * 10;
        const dist = speed * t * (1 - t / 80); // slows down as it flies
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 920 + Math.cos(angle) * dist,
              top: 358 + Math.sin(angle) * dist,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: GOLD_LIGHT,
              opacity: interpolate(t, [0, 30, 40], [1, 0.6, 0], clamp),
              boxShadow: `0 0 8px ${GOLD}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---- The whole reveal -------------------------------------------------------------
export const MindsetModeLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gold line: draws outward from the middle
  const line = interpolate(frame, [0, 24], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // Light sweep: a bright band glides across the name (frames 66-94).
  // 15% → 85% of the screen width is where the name actually sits.
  const shine = interpolate(frame, [66, 94], [15, 85], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });

  const tagline = interpolate(frame, [78, 98], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  // Slow push-in, then a quicker push + fade at the end
  const push = interpolate(frame, [0, 126, 150], [1, 1.04, 1.12], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  const fadeOut = interpolate(frame, [126, 150], [1, 0], clamp);

  // Background glow appears when the lamp lights
  const glow = interpolate(frame, [30, 45], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill style={{ opacity: fadeOut, transform: `scale(${push})` }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 40% 35% at 48% 33%, rgba(232,184,101,${0.16 * glow}) 0%, rgba(232,184,101,0) 70%)`,
          }}
        />

        {/* Icon */}
        <div style={{ position: "absolute", left: 960 - 200, top: 300 - 142 }}>
          <MindsetIcon />
        </div>
        <Sparks />

        {/* Line */}
        <div
          style={{
            position: "absolute",
            top: 580,
            left: 960 - 420,
            width: 840,
            height: 2,
            backgroundColor: GOLD,
            boxShadow: `0 0 10px ${GOLD}`,
            transform: `scaleX(${line})`,
          }}
        />

        {/* Channel name: each letter drops down from behind the line (mask).
            Two copies on top of each other: gold underneath, and white on top that
            is only visible through a moving gap. The gap sliding across = the shine. */}
        {[false, true].map((isShine) => (
          <div
            key={String(isShine)}
            style={{
              position: "absolute",
              top: 582,
              width: "100%",
              height: 120,
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              ...(isShine
                ? {
                    WebkitMaskImage: `linear-gradient(110deg, transparent ${shine - 10}%, black ${shine}%, transparent ${shine + 10}%)`,
                    maskImage: `linear-gradient(110deg, transparent ${shine - 10}%, black ${shine}%, transparent ${shine + 10}%)`,
                  }
                : {}),
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 80,
                letterSpacing: 14,
                paddingTop: 16,
                color: isShine ? "#FFFFFF" : GOLD,
                textShadow: isShine ? `0 0 18px ${GOLD_LIGHT}` : "none",
              }}
            >
              {CHANNEL_NAME.split("").map((ch, i) => {
                const p = spring({ frame: frame - 36 - i * 1.5, fps, config: { damping: 15, stiffness: 140 } });
                return (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      whiteSpace: "pre",
                      transform: `translateY(${interpolate(p, [0, 1], [-110, 0])}px)`,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>
        ))}

        {/* Tagline */}
        <div
          style={{
            position: "absolute",
            top: 720,
            width: "100%",
            textAlign: "center",
            fontFamily: "'Liberation Serif', serif",
            fontStyle: "italic",
            fontSize: 40,
            letterSpacing: 2,
            color: "#9AA4B2",
            opacity: tagline,
            transform: `translateY(${interpolate(tagline, [0, 1], [14, 0])}px)`,
          }}
        >
          {TAGLINE}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
