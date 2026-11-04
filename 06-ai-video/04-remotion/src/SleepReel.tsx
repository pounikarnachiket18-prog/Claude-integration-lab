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

// "5 Sleep Tips": a 20-second vertical Instagram Reel (1080x1920, 30 fps).
//
//   0.0-2.5s   Hook: "Can't sleep?" + "5 tips for tonight"
//   2.5-17.5s  5 tips, 3 seconds each
//   17.5-20s   Call to action: "Save this for tonight"
//
// Style kit: night sky navy, soft moon yellow, calm springs (no bounce).

// ---- Style kit -------------------------------------------------------------------
const NAVY_TOP = "#070B1F";
const NAVY_BOTTOM = "#1A2452";
const MOON = "#F6D98B";
const TEXT = "#F3F1EA";
const SOFT = "#AEB6D6";
const SERIF = "'Liberation Serif', serif";
const SANS = "'Liberation Sans', sans-serif";
const CALM = { damping: 200 } as const; // calm spring: smooth, no bounce
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- Timeline (in frames) ---------------------------------------------------------
export const HOOK_LEN = 75; // 2.5s
export const TIP_LEN = 90; // 3s each
export const CTA_LEN = 75; // 2.5s
export const SLEEP_REEL_DURATION = HOOK_LEN + 5 * TIP_LEN + CTA_LEN; // 600 = 20s

const TIPS = [
  { title: "Same bedtime, every day", detail: "Your body loves a rhythm. Weekends too." },
  { title: "Screens off 1\u00A0hour before bed" /* \u00A0 = non-breaking space */, detail: "Bright screens keep your brain awake." },
  { title: "Keep your room cool and dark", detail: "Around 18°C / 65°F feels best for most people." },
  { title: "No caffeine after 2 PM", detail: "It stays in your body for hours." },
  { title: "Breathe: 4 · 7 · 8", detail: "In for 4. Hold for 7. Out for 8." },
];

// ---- Background: night sky with twinkling stars and a glowing moon -----------------
const NightSky: React.FC = () => {
  const frame = useCurrentFrame();
  const stars = new Array(70).fill(0).map((_, i) => ({
    x: random(`x${i}`) * 1080,
    y: random(`y${i}`) * 1300,
    size: 1.5 + random(`s${i}`) * 2.5,
    speed: 12 + random(`v${i}`) * 25,
    phase: random(`p${i}`) * Math.PI * 2,
  }));
  const drift = interpolate(frame, [0, SLEEP_REEL_DURATION], [0, -40]); // very slow drift up

  return (
    <AbsoluteFill
      style={{ background: `linear-gradient(180deg, ${NAVY_TOP} 0%, ${NAVY_BOTTOM} 100%)` }}
    >
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y + drift,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: "white",
            opacity: 0.25 + 0.6 * Math.abs(Math.sin(frame / s.speed + s.phase)),
          }}
        />
      ))}
      {/* Moon: a yellow circle with a navy circle on top makes a crescent */}
      <div
        style={{
          position: "absolute",
          left: 760,
          top: 300 + drift * 0.5,
          width: 150,
          height: 150,
          borderRadius: "50%",
          backgroundColor: MOON,
          boxShadow: `0 0 80px 20px rgba(246,217,139,${0.25 + 0.08 * Math.sin(frame / 25)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 800,
          top: 280 + drift * 0.5,
          width: 150,
          height: 150,
          borderRadius: "50%",
          backgroundColor: "#0C1230",
        }}
      />
    </AbsoluteFill>
  );
};

// ---- Words that rise in one by one (stagger) -------------------------------------
const Words: React.FC<{
  text: string;
  startFrame: number;
  style: React.CSSProperties;
  stagger?: number;
}> = ({ text, startFrame, style, stagger = 3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    // textWrap "balance" splits long lines evenly, so no single word is left alone on a line
    <div style={{ textAlign: "center", textWrap: "balance", ...style } as React.CSSProperties}>
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: frame - startFrame - i * stagger, fps, config: CALM });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 0.16em",
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px)`,
              filter: `blur(${interpolate(p, [0, 1], [6, 0])}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---- Scene wrapper: enters (ease-out) and leaves (ease-in) -------------------------
const Scene: React.FC<{ duration: number; children: React.ReactNode }> = ({
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [duration - 10, duration], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{
        // text area: clear of Instagram's top bar, bottom caption and right-side buttons
        padding: "0 140px 0 100px",
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 260,
        opacity: 1 - out,
        transform: `translateY(${-40 * out}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ---- Progress bar: 5 segments showing which tip we're on ---------------------------
const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        top: 240,
        left: 100,
        right: 140,
        display: "flex",
        gap: 12,
      }}
    >
      {TIPS.map((_, i) => {
        const start = HOOK_LEN + i * TIP_LEN;
        const fill = interpolate(frame, [start, start + TIP_LEN], [0, 1], clamp);
        return (
          <div
            key={i}
            style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            <div
              style={{
                width: `${fill * 100}%`,
                height: "100%",
                borderRadius: 3,
                backgroundColor: MOON,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ---- One tip ---------------------------------------------------------------------
const Tip: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tip = TIPS[index];
  const num = spring({ frame, fps, config: CALM });
  const isBreathing = index === 4;
  // Breathing circle: grows and shrinks slowly, like a calm breath
  const breath = 0.75 + 0.25 * Math.sin((frame / 30) * Math.PI * 0.6 - Math.PI / 2);

  return (
    <Scene duration={TIP_LEN}>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 190,
          color: MOON,
          opacity: num * 0.9,
          transform: `scale(${interpolate(num, [0, 1], [0.8, 1])})`,
          textShadow: "0 0 40px rgba(246,217,139,0.35)",
          lineHeight: 1,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      {isBreathing && (
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            border: `3px solid rgba(246,217,139,0.35)`,
            transform: `translateY(-210px) scale(${breath})`,
          }}
        />
      )}
      <Words
        text={tip.title}
        startFrame={6}
        style={{ fontFamily: SERIF, fontSize: 82, color: TEXT, textAlign: "center", marginTop: 40, lineHeight: 1.15 }}
      />
      <Words
        text={tip.detail}
        startFrame={24}
        stagger={2}
        style={{ fontFamily: SANS, fontSize: 40, color: SOFT, textAlign: "center", marginTop: 36, lineHeight: 1.35 }}
      />
    </Scene>
  );
};

// ---- The whole Reel ----------------------------------------------------------------
export const SleepReel: React.FC = () => {
  return (
    <AbsoluteFill>
      <NightSky />

      {/* Hook: starts moving on the very first frame */}
      <Sequence durationInFrames={HOOK_LEN}>
        <Scene duration={HOOK_LEN}>
          <Words
            text="Can't sleep?"
            startFrame={0}
            stagger={5}
            style={{ fontFamily: SERIF, fontSize: 140, color: TEXT, lineHeight: 1.1 }}
          />
          <Words
            text="5 tips for tonight"
            startFrame={22}
            style={{ fontFamily: SANS, fontSize: 52, color: MOON, letterSpacing: 2, marginTop: 30 }}
          />
        </Scene>
      </Sequence>

      {TIPS.map((_, i) => (
        <Sequence key={i} from={HOOK_LEN + i * TIP_LEN} durationInFrames={TIP_LEN}>
          <Tip index={i} />
        </Sequence>
      ))}

      {/* Progress bar during the tips */}
      <Sequence from={HOOK_LEN} durationInFrames={5 * TIP_LEN}>
        <Progress />
      </Sequence>

      {/* Call to action */}
      <Sequence from={HOOK_LEN + 5 * TIP_LEN} durationInFrames={CTA_LEN}>
        <Scene duration={CTA_LEN + 30 /* stays until the end, no exit */}>
          <Words
            text="Save this for tonight"
            startFrame={0}
            stagger={4}
            style={{ fontFamily: SERIF, fontSize: 100, color: TEXT, textAlign: "center", lineHeight: 1.15 }}
          />
          <Words
            text="Sweet dreams"
            startFrame={20}
            style={{ fontFamily: SANS, fontSize: 48, color: MOON, letterSpacing: 3, marginTop: 34 }}
          />
        </Scene>
      </Sequence>
    </AbsoluteFill>
  );
};
