import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CHANNEL_NAME, MindsetIcon, MindsetModeLogo } from "./MindsetModeLogo";

// MINDSET MODE INDIA: 20-second channel intro (1920x1080, 30 fps, 600 frames).
//
//   0-5s    Part 1: the logo reveal (MindsetModeLogo)
//   5-15s   Part 2: 4 motivational lines, 2.5s each. Words slam in ON THE BEAT
//           (music is 120 beats per minute = one beat every 15 frames)
//   15-20s  Part 3: end card: logo draws again, Subscribe gets clicked, bell rings

// ---- Style kit (same as the logo) -------------------------------------------------
const SAFFRON = "#FF9F43";
const SAFFRON_LIGHT = "#FFDDB0";
const BG = "#07080C";
const SANS = "'Liberation Sans', sans-serif";
const SERIF = "'Liberation Serif', serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const INTRO20_DURATION = 600;
const LINE_LEN = 75; // 2.5 seconds per line = 5 beats

// ---- The 4 lines (the "accent" words are shown in saffron) ---------------------
const LINES = [
  { text: "Every morning is a", accent: "new start." },
  { text: "Discipline beats", accent: "motivation." },
  { text: "Small steps.", accent: "Every day." },
  { text: "Your mindset is your", accent: "superpower." },
];

// ---- Part 2 background: a sunrise glow that grows brighter, rays, rising particles --
const SunriseBackground: React.FC = () => {
  const frame = useCurrentFrame(); // 0-300 inside Part 2
  const dawn = interpolate(frame, [0, 300], [0.35, 1], clamp); // slowly gets brighter
  const rayTurn = interpolate(frame, [0, 300], [-4, 4]);

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      {/* Soft rays fanning up from the horizon */}
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${-90 + rayTurn}deg at 50% 105%, rgba(255,159,67,${0.06 * dawn}) 0deg 4deg, transparent 4deg 12deg)`,
          maskImage: "radial-gradient(ellipse 70% 90% at 50% 100%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 90% at 50% 100%, black 20%, transparent 75%)",
        }}
      />
      {/* Glow at the horizon */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 45% at 50% 100%, rgba(255,159,67,${0.35 * dawn}) 0%, rgba(255,159,67,0) 70%)`,
        }}
      />
      {/* Horizon line */}
      <div
        style={{
          position: "absolute",
          top: 930,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${SAFFRON} 30%, ${SAFFRON} 70%, transparent)`,
          opacity: 0.6 * dawn,
          boxShadow: `0 0 16px ${SAFFRON}`,
        }}
      />
      {/* Particles drifting upward, like embers */}
      {new Array(40).fill(0).map((_, i) => {
        const x = random(`px${i}`) * 1920;
        const speed = 0.8 + random(`ps${i}`) * 1.8;
        const y = 1080 - ((frame * speed + random(`py${i}`) * 1080) % 1080);
        const size = 2 + random(`pz${i}`) * 3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + Math.sin(frame / 20 + i) * 10,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: SAFFRON_LIGHT,
              opacity: (0.2 + 0.5 * random(`po${i}`)) * (y / 1080),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---- One line: each word SLAMS in on a beat ----------------------------------------
const PunchLine: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = [
    ...text.split(" ").map((w) => ({ w, isAccent: false })),
    ...accent.split(" ").map((w) => ({ w, isAccent: true })),
  ];
  // Spread the words over the first 3 beats (frames 0-30), so they land in rhythm
  const step = Math.min(7.5, 30 / Math.max(1, words.length - 1));

  const out = interpolate(frame, [LINE_LEN - 8, LINE_LEN], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 80,
        opacity: 1 - out,
        transform: `scale(${1 - 0.05 * out})`,
      }}
    >
      <div
        style={
          {
            maxWidth: 1500,
            textAlign: "center",
            textWrap: "balance",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 112,
            lineHeight: 1.15,
            letterSpacing: 1,
          } as React.CSSProperties
        }
      >
        {words.map(({ w, isAccent }, i) => {
          // A firm spring: arrives fast, tiny settle. Starts BIG and blurry, slams down sharp.
          const p = spring({ frame: frame - i * step, fps, config: { damping: 14, stiffness: 220 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 0.14em",
                color: isAccent ? SAFFRON : "#F5F2EC",
                textShadow: isAccent ? `0 0 30px rgba(255,159,67,0.45)` : "none",
                opacity: Math.min(1, p * 1.5),
                transform: `scale(${interpolate(p, [0, 1], [1.6, 1])})`,
                filter: `blur(${interpolate(p, [0, 1], [10, 0], clamp)}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---- Part 3: end card with Subscribe button, cursor click and bell --------------------
const BellIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width={46} height={46} viewBox="0 0 24 24">
    <path
      d="M12 2a1.2 1.2 0 0 1 1.2 1.2v.9A6 6 0 0 1 18 10v4.2l1.8 2.6c.3.4 0 .9-.5.9H4.7c-.5 0-.8-.5-.5-.9L6 14.2V10a6 6 0 0 1 4.8-5.9v-.9A1.2 1.2 0 0 1 12 2zm-2.2 17h4.4a2.2 2.2 0 0 1-4.4 0z"
      fill={color}
    />
  </svg>
);

const CursorIcon: React.FC = () => (
  <svg width={44} height={44} viewBox="0 0 24 24">
    <path d="M4 2l15 11.5-6.6.9 3.8 7.3-2.6 1.3-3.8-7.4L4 20z" fill="white" stroke="black" strokeWidth={1.2} />
  </svg>
);

const EndCard: React.FC = () => {
  const frame = useCurrentFrame(); // 0-150 inside Part 3
  const { fps } = useVideoConfig();

  const nameIn = spring({ frame: frame - 36, fps, config: { damping: 200 } });
  const tagIn = spring({ frame: frame - 46, fps, config: { damping: 200 } });
  const buttonIn = spring({ frame: frame - 52, fps, config: { damping: 10, stiffness: 160 } }); // bouncy pop

  const PRESS = 92; // the click
  // Cursor glides in (ease in-out) and stops on the button
  const cursorMove = interpolate(frame, [62, 88], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const press = interpolate(frame, [PRESS, PRESS + 3, PRESS + 8], [1, 0.9, 1], clamp);
  const subscribed = frame >= PRESS + 2;
  // Bell wiggles after the click, wiggling less and less (decaying)
  const bellT = Math.max(0, frame - (PRESS + 10));
  const bellAngle = frame > PRESS + 10 ? 22 * Math.sin(bellT * 1.1) * Math.exp(-bellT / 9) : 0;

  const fadeOut = interpolate(frame, [134, 150], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BG, opacity: fadeOut }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 45% 40% at 48% 31%, rgba(255,159,67,0.14) 0%, rgba(255,159,67,0) 70%)`,
        }}
      />

      {/* The icon draws itself again (smaller) */}
      <div style={{ position: "absolute", left: 960 - 200, top: 100, transform: "scale(0.62)", transformOrigin: "50% 50%" }}>
        <MindsetIcon />
      </div>

      {/* Channel name */}
      <div
        style={{
          position: "absolute",
          top: 500,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 76,
          letterSpacing: 14,
          color: SAFFRON,
          opacity: nameIn,
          transform: `translateY(${interpolate(nameIn, [0, 1], [24, 0])}px)`,
        }}
      >
        {CHANNEL_NAME}
      </div>
      <div
        style={{
          position: "absolute",
          top: 605,
          width: "100%",
          textAlign: "center",
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: 40,
          color: "#B9C0CA",
          opacity: tagIn,
        }}
      >
        New videos every week on motivation, discipline and growth
      </div>

      {/* Subscribe button + bell */}
      <div
        style={{
          position: "absolute",
          top: 740,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 28,
          opacity: Math.min(1, buttonIn * 2),
          transform: `scale(${buttonIn})`,
        }}
      >
        <div
          style={{
            padding: "26px 64px",
            borderRadius: 60,
            backgroundColor: subscribed ? "#2E3138" : "#E62117",
            color: subscribed ? "#C9CDD3" : "white",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: 3,
            transform: `scale(${press})`,
            boxShadow: subscribed ? "none" : "0 10px 30px rgba(230,33,23,0.35)",
          }}
        >
          {subscribed ? "SUBSCRIBED" : "SUBSCRIBE"}
        </div>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            border: `3px solid ${subscribed ? SAFFRON : "#5A606B"}`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `rotate(${bellAngle}deg)`,
            transformOrigin: "50% 20%",
          }}
        >
          <BellIcon color={subscribed ? SAFFRON : "#9AA1AC"} />
        </div>
      </div>

      {/* Cursor: glides from bottom-right onto the button, then clicks */}
      <div
        style={{
          position: "absolute",
          left: interpolate(cursorMove, [0, 1], [1500, 1000]),
          top: interpolate(cursorMove, [0, 1], [1060, 788]),
          opacity: interpolate(frame, [60, 66, 120, 128], [0, 1, 1, 0], clamp),
          transform: `scale(${press})`,
        }}
      >
        <CursorIcon />
      </div>
    </AbsoluteFill>
  );
};

// ---- The whole 20 seconds -----------------------------------------------------------
export const MindsetIntro20: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* Part 1: logo reveal */}
      <Sequence durationInFrames={150}>
        <MindsetModeLogo />
      </Sequence>

      {/* Part 2: four lines on the beat */}
      <Sequence from={150} durationInFrames={300}>
        <SunriseBackground />
        {LINES.map((l, i) => (
          <Sequence key={i} from={i * LINE_LEN} durationInFrames={LINE_LEN}>
            <PunchLine text={l.text} accent={l.accent} />
          </Sequence>
        ))}
      </Sequence>

      {/* Part 3: end card */}
      <Sequence from={450} durationInFrames={150}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
