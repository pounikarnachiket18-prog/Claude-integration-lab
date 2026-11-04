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

// 5-second YouTube logo reveal (1920x1080, 30 fps, 150 frames).
//
//   0.0-0.8s  a gold line draws across the dark screen       (sound: rising "riser")
//   0.4-1.2s  the lighthouse icon DRAWS itself, stroke by stroke
//   1.0s      the lamp POPS on (spring with overshoot)       (sound: deep bass hit)
//   1.1-1.8s  beams flash out, sparks fly
//   1.2-1.9s  channel name rises from behind the line, letter by letter
//   2.2-3.1s  a light SWEEP glides across the name           (sound: "shing")
//   2.6s      tagline fades in
//   4.2-5.0s  everything pushes in and fades to black

// ---- Settings you can change ---------------------------------------------------
export const CHANNEL_NAME = "LIGHTHOUSE STUDIO";
const TAGLINE = "stories told with code";
const GOLD = "#E8B865";
const GOLD_LIGHT = "#FFE7B0";
const BG = "#05080D";
const FONT = "'Liberation Sans', sans-serif";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const LOGO_DURATION = 150;

// ---- The lighthouse icon, drawn as an SVG (shapes described with numbers) ------------
const Icon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "Line drawing": each stroke is revealed from 0% to 100% of its length.
  // pathLength={1} lets us treat every path as length 1, whatever its real size.
  const draw = (start: number, len: number) =>
    interpolate(frame, [start, start + len], [1, 0], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });

  const lamp = spring({ frame: frame - 30, fps, config: { damping: 8, stiffness: 160 } }); // bouncy pop
  const beams = interpolate(frame, [32, 40, 60], [0, 1, 0.55], clamp);
  const sweep = interpolate(frame, [32, 150], [-8, 8]); // beams slowly rotate

  const stroke = {
    fill: "none",
    stroke: GOLD,
    strokeWidth: 3.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 1,
    strokeDasharray: 1,
  };

  return (
    <svg width={400} height={400} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="beamR" x1="0" x2="1">
          <stop offset="0" stopColor={GOLD_LIGHT} stopOpacity={0.9} />
          <stop offset="1" stopColor={GOLD_LIGHT} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="beamL" x1="1" x2="0">
          <stop offset="0" stopColor={GOLD_LIGHT} stopOpacity={0.9} />
          <stop offset="1" stopColor={GOLD_LIGHT} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Beams (behind the tower) */}
      <g opacity={beams} transform={`rotate(${sweep} 100 71)`}>
        <polygon points="100,71 230,52 230,90" fill="url(#beamR)" />
        <polygon points="100,71 -30,52 -30,90" fill="url(#beamL)" />
      </g>

      {/* Ground line, tower, stripes, lamp room, roof: each draws itself in turn */}
      <path d="M55,172 L145,172" {...stroke} strokeDashoffset={draw(12, 14)} />
      <path d="M80,172 L90,82 L110,82 L120,172 Z" {...stroke} strokeDashoffset={draw(16, 16)} />
      <path d="M85.5,125 L114.5,125" {...stroke} strokeDashoffset={draw(24, 8)} />
      <path d="M83,150 L117,150" {...stroke} strokeDashoffset={draw(26, 8)} />
      <path d="M88,82 L88,62 L112,62 L112,82" {...stroke} strokeDashoffset={draw(22, 10)} />
      <path d="M84,62 L100,46 L116,62 Z" {...stroke} strokeDashoffset={draw(26, 10)} />

      {/* The lamp pops on */}
      <circle
        cx={100}
        cy={71}
        r={6}
        fill={GOLD_LIGHT}
        transform={`translate(100 71) scale(${lamp}) translate(-100 -71)`}
        style={{ filter: `drop-shadow(0 0 ${10 * lamp}px ${GOLD})` }}
      />
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
              left: 960 + Math.cos(angle) * dist,
              top: 300 + Math.sin(angle) * dist,
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
export const LogoReveal: React.FC = () => {
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
            background: `radial-gradient(ellipse 40% 35% at 50% 32%, rgba(232,184,101,${0.16 * glow}) 0%, rgba(232,184,101,0) 70%)`,
          }}
        />

        {/* Icon */}
        <div style={{ position: "absolute", left: 960 - 200, top: 300 - 142 }}>
          <Icon />
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
                fontSize: 84,
                letterSpacing: 18,
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
