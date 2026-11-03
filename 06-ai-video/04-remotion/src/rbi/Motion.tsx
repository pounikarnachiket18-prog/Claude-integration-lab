import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";

// High-energy motion graphics for the RBI documentary.
// Techniques: letters that fly together into words, icons that pop in over an
// ink-burst shape, typewriter text with a cursor, hand-drawn circles and underlines,
// whip transitions with motion blur, and speed lines.

const SANS = "'Liberation Sans', Arial, sans-serif";
const SERIF = "'Liberation Serif', 'Times New Roman', serif";
const GOLD = "#F2C14E";
const RED = "#E8443A";
const INK = "#15171C";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- Letters scattered across the frame fly together into a word ----------------
export const AssembleText: React.FC<{
  text: string;
  size: number;
  color?: string;
  font?: string;
  delay?: number;
  seed?: string;
  spread?: number;
  weight?: number;
  spacing?: number;
}> = ({ text, size, color = "#F2F0EA", font = SANS, delay = 0, seed = "a", spread = 700, weight = 700, spacing = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", justifyContent: "center", fontFamily: font, fontWeight: weight, fontSize: size, color, lineHeight: 1, letterSpacing: spacing, whiteSpace: "pre" }}>
      {text.split("").map((ch, i) => {
        const p = spring({ frame: frame - delay - i * 1.6, fps, config: { damping: 16, mass: 0.8 } });
        const dx = (random(`${seed}x${i}`) - 0.5) * spread * 2;
        const dy = (random(`${seed}y${i}`) - 0.5) * spread;
        const rot = (random(`${seed}r${i}`) - 0.5) * 140;
        const blur = Math.max(0, (1 - p) * 14);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p)}px) rotate(${rot * (1 - p)}deg) scale(${0.4 + 0.6 * p})`,
              opacity: Math.min(1, p * 2),
              filter: `blur(${blur}px)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// ---- Typewriter text with a blinking cursor; *words* in the accent colour --------------
export const TypeText: React.FC<{ text: string; size: number; start?: number; cps?: number; color?: string; accent?: string; circle?: boolean }> = ({
  text,
  size,
  start = 0,
  cps = 26,
  color = INK,
  accent = RED,
  circle = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clean = text.replace(/\*/g, "");
  const shown = Math.floor(Math.max(0, frame - start) * (cps / fps));
  const done = shown >= clean.length;
  // split into plain/accent runs
  const runs: { t: string; a: boolean }[] = [];
  text.split(/(\*[^*]+\*)/).forEach((r) => r && runs.push({ t: r.replace(/\*/g, ""), a: r.startsWith("*") }));
  let used = 0;
  const doneAt = start + Math.ceil((clean.length * fps) / cps);
  const ring = interpolate(frame, [doneAt + 4, doneAt + 22], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: size, color, lineHeight: 1.2 }}>
      {runs.map((r, i) => {
        const take = Math.max(0, Math.min(r.t.length, shown - used));
        used += r.t.length;
        if (!r.a) return <span key={i}>{r.t.slice(0, take)}</span>;
        return (
          <span key={i} style={{ position: "relative", color: accent, display: "inline-block" }}>
            {r.t.slice(0, take)}
            {circle && take === r.t.length && (
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: "absolute", left: "-12%", top: "-28%", width: "124%", height: "156%", overflow: "visible" }}>
                <path
                  d="M 8 22 C 6 6, 70 0, 92 12 C 104 22, 80 38, 46 37 C 16 36, 2 28, 14 14"
                  fill="none"
                  stroke={accent}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset={1 - ring}
                  style={{ strokeWidth: 5 }}
                />
              </svg>
            )}
          </span>
        );
      })}
      <span style={{ display: "inline-block", width: size * 0.08, height: size * 0.95, marginLeft: 8, backgroundColor: color, verticalAlign: "-0.12em", opacity: done ? (Math.floor(frame / 10) % 2 ? 0 : 1) : 1 }} />
    </div>
  );
};

// ---- A jagged ink burst that explodes behind an icon -------------------------------------
const Burst: React.FC<{ color: string; seed: string; size: number }> = ({ color, seed, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 2, fps, config: { damping: 9, mass: 0.6 } });
  const pts: string[] = [];
  const n = 14;
  for (let i = 0; i < n * 2; i++) {
    const ang = (i / (n * 2)) * Math.PI * 2 + frame * 0.004;
    const r = i % 2 ? 0.42 + 0.1 * random(`${seed}i${i}`) : 0.78 + 0.22 * random(`${seed}o${i}`);
    pts.push(`${50 + Math.cos(ang) * r * 50},${50 + Math.sin(ang) * r * 50}`);
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", transform: `scale(${p}) rotate(${frame * 0.3}deg)`, overflow: "visible" }}>
      <polygon points={pts.join(" ")} fill={color} />
      {/* thin speed scratches */}
      {new Array(6).fill(0).map((_, i) => {
        const a = random(`${seed}s${i}`) * Math.PI * 2;
        const d = interpolate(frame, [4, 20], [40, 70], clamp);
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * d}
            y1={50 + Math.sin(a) * d}
            x2={50 + Math.cos(a) * (d + 14)}
            y2={50 + Math.sin(a) * (d + 14)}
            stroke={color}
            strokeWidth={0.8}
            opacity={interpolate(frame, [4, 24], [1, 0], clamp)}
          />
        );
      })}
    </svg>
  );
};

// ---- Chunky "3D" icons: flat front face, darker side face, thick outline --------------
type IconName = "barrel" | "hourglass" | "rupee" | "bank" | "gold" | "plane";
const Icon: React.FC<{ name: IconName; size: number }> = ({ name, size }) => {
  const o = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const };
  const body = (() => {
    switch (name) {
      case "barrel":
        return (
          <>
            <rect x={34} y={18} width={52} height={86} rx={8} fill="#1E2430" {...o} />
            <rect x={28} y={14} width={52} height={86} rx={8} fill="#3A4558" {...o} />
            <rect x={28} y={36} width={52} height={7} fill="#F2C14E" {...o} />
            <rect x={28} y={72} width={52} height={7} fill="#F2C14E" {...o} />
            <ellipse cx={54} cy={16} rx={26} ry={6} fill="#56637A" {...o} />
            <path d="M 50 52 q 4 -8 8 0 q 0 6 -4 6 q -4 0 -4 -6 z" fill="#111" />
          </>
        );
      case "hourglass":
        return (
          <>
            <rect x={22} y={10} width={70} height={10} rx={3} fill="#8A6516" {...o} />
            <rect x={22} y={100} width={70} height={10} rx={3} fill="#8A6516" {...o} />
            <path d="M 30 20 L 84 20 L 62 60 L 84 100 L 30 100 L 52 60 Z" fill="#DDE6F2" {...o} />
            <path d="M 40 92 L 74 92 L 57 74 Z" fill={GOLD} />
            <path d="M 46 32 L 68 32 L 57 50 Z" fill={GOLD} />
          </>
        );
      case "rupee":
        return (
          <>
            <circle cx={62} cy={62} r={46} fill="#8A6516" {...o} />
            <circle cx={56} cy={56} r={46} fill={GOLD} {...o} />
            <circle cx={56} cy={56} r={36} fill="none" stroke="#B8862A" strokeWidth={3} />
            <text x={56} y={76} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={56} fill={INK}>₹</text>
          </>
        );
      case "bank":
        return (
          <>
            <path d="M 14 40 L 60 12 L 106 40 Z" fill="#C9CFD8" {...o} />
            {[24, 46, 68, 90].map((x) => (
              <rect key={x} x={x - 4} y={44} width={12} height={48} fill="#E9EDF2" {...o} />
            ))}
            <rect x={12} y={92} width={96} height={12} fill="#9AA4B2" {...o} />
            <rect x={18} y={40} width={84} height={6} fill="#9AA4B2" {...o} />
          </>
        );
      case "gold":
        return (
          <>
            {[[14, 70], [62, 70], [38, 40]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <polygon points="0,34 12,0 44,0 56,34" fill="#D9A83A" {...o} />
                <polygon points="12,0 44,0 40,8 16,8" fill="#FFE7A3" />
              </g>
            ))}
          </>
        );
      case "plane":
        return (
          <>
            <path d="M 10 62 L 100 30 Q 114 26 108 40 L 40 78 Z" fill="#E9EDF2" {...o} />
            <path d="M 56 54 L 40 96 L 54 92 L 76 50 Z" fill="#C9CFD8" {...o} />
            <path d="M 30 70 L 18 86 L 28 84 L 42 70 Z" fill="#C9CFD8" {...o} />
          </>
        );
    }
  })();
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} style={{ overflow: "visible", filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.35))" }}>
      {body}
    </svg>
  );
};

// ---- A motion "beat": icon pops in over a burst, text types on beside it ---------------
export const MotionBeat: React.FC<{
  icon: IconName;
  text: string;
  sub?: string;
  theme?: "light" | "dark";
  burst?: string;
  seed?: string;
}> = ({ icon, text, sub, theme = "light", burst = RED, seed = "beat" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const light = theme === "light";
  const pop = spring({ frame: frame - 4, fps, config: { damping: 8, mass: 0.7 } });
  const tilt = Math.sin(frame / 14) * 14; // slow 3D wobble
  const float = Math.sin(frame / 18) * 10;
  const exitP = interpolate(frame, [durationInFrames - 8, durationInFrames], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill
      style={{
        background: light ? "radial-gradient(ellipse at 40% 45%, #FFFFFF 0%, #E4E4E6 60%, #C9CACD 100%)" : "radial-gradient(ellipse at 40% 45%, #1A1C22 0%, #08090C 75%)",
        overflow: "hidden",
      }}
    >
      {/* floating confetti squares */}
      {new Array(18).fill(0).map((_, i) => {
        const x = random(`${seed}cx${i}`) * 1920;
        const y = ((random(`${seed}cy${i}`) * 1200 - frame * (1 + random(`${seed}cv${i}`) * 2)) % 1200 + 1200) % 1200 - 60;
        const c = [GOLD, RED, "#3B6FE0", "#2BB673"][i % 4];
        const s = 10 + random(`${seed}cs${i}`) * 16;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, backgroundColor: c, opacity: 0.75, transform: `rotate(${frame * 2 + i * 30}deg)`, filter: i % 3 === 0 ? "blur(3px)" : undefined }} />;
      })}
      <div style={{ position: "absolute", left: 300, top: 540, width: 0, height: 0, transform: `translateX(${-exitP * 900}px)` }}>
        <div style={{ position: "absolute", left: -260, top: -260, width: 520, height: 520, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Burst color={burst} seed={seed} size={520} />
          <div style={{ transform: `perspective(900px) rotateY(${tilt}deg) rotateZ(${(1 - pop) * -50}deg) scale(${pop}) translateY(${float}px)` }}>
            <Icon name={icon} size={300} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 700, top: 0, bottom: 0, right: 120, display: "flex", flexDirection: "column", justifyContent: "center", transform: `translateX(${exitP * 900}px)`, filter: exitP > 0 ? `blur(${exitP * 12}px)` : undefined }}>
        <TypeText text={text} size={92} start={12} color={light ? INK : "#F2F0EA"} accent={light ? RED : GOLD} />
        {sub && (
          <div style={{ fontFamily: SANS, fontSize: 34, letterSpacing: 5, marginTop: 30, color: light ? "#6B6F78" : "#8D97A8", opacity: interpolate(frame, [40, 55], [0, 1], clamp) }}>{sub}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---- Chapter card: number slams in, title letters fly together, speed lines --------------
export const KineticChapter: React.FC<{ number: string; title: string; date: string }> = ({ number, title, date }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const slam = spring({ frame, fps, config: { damping: 12 } });
  const line = interpolate(frame, [8, 26], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#07080B", overflow: "hidden" }}>
      {/* giant outlined number in the background */}
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 40,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 760,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: `3px rgba(242,193,78,0.25)`,
          transform: `scale(${interpolate(slam, [0, 1], [2.2, 1])}) translateX(${interpolate(frame, [0, durationInFrames], [0, -60])}px)`,
          opacity: slam,
        }}
      >
        {number}
      </div>
      {/* speed lines */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            top: 400 + i * (i < 2 ? 22 : 0) + (i >= 2 ? 300 + (i - 2) * 22 : 0),
            height: 2,
            width: `${line * 100}%`,
            backgroundColor: i % 2 ? RED : GOLD,
            opacity: 0.6,
            transformOrigin: i % 2 ? "left" : "right",
          }}
        />
      ))}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translateX(${-out * 1400}px)`, filter: out > 0 ? `blur(${out * 20}px)` : undefined }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 28, letterSpacing: 14, color: GOLD, opacity: slam, marginBottom: 26 }}>CHAPTER {number}</div>
        <AssembleText text={title} size={title.length > 18 ? 92 : 118} font={SERIF} delay={6} seed={title} />
        <div style={{ marginTop: 30 }}>
          <AssembleText text={date} size={30} color="#8D97A8" delay={24} seed={date} spread={200} weight={400} spacing={8} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---- Title card: "1991" assembles, gold shine, then the subtitle types on -----------------
export const KineticTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const shine = interpolate(frame, [40, 85], [-30, 130], clamp);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506", justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ transform: `scale(${zoom})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <AssembleText text="1991" size={300} font={SERIF} color="#C9982E" seed="title" spread={900} />
          {/* shine sweep across the numbers */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(110deg, transparent ${shine - 12}%, rgba(255,241,184,0.85) ${shine}%, transparent ${shine + 12}%)`,
              mixBlendMode: "overlay",
            }}
          />
        </div>
        <div style={{ marginTop: 30, display: "flex", justifyContent: "center" }}>
          <TypeText text="THE YEAR INDIA PAWNED ITS *GOLD*" size={56} start={34} cps={30} color="#F2F0EA" accent={GOLD} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- Whip transition wrapper: slides in/out sideways with motion blur ----------------------
export const Whip: React.FC<{ children: React.ReactNode; frames?: number }> = ({ children, frames = 9 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inP = interpolate(frame, [0, frames], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(frame, [durationInFrames - frames, durationInFrames], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const x = inP * 1920 - outP * 1920;
  const blur = (inP + outP) * 60;
  return (
    <AbsoluteFill style={{ transform: `translateX(${x}px)`, filter: blur > 0.5 ? `url(#whipblur${Math.round(blur / 10)})` : undefined }}>{children}</AbsoluteFill>
  );
};

// Horizontal-only blur filters used by Whip (an SVG blur can be directional; CSS blur cannot)
export const WhipFilters: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
      <filter key={i} id={`whipblur${i}`} x="-20%" y="0" width="140%" height="100%">
        <feGaussianBlur stdDeviation={`${i * 10} 0`} />
      </filter>
    ))}
  </svg>
);

// ---- Hand-drawn underline that draws itself (for narration accent words) -------------------
export const Scribble: React.FC<{ progress: number; color?: string }> = ({ progress, color = GOLD }) => (
  <svg viewBox="0 0 100 10" preserveAspectRatio="none" style={{ position: "absolute", left: "-3%", bottom: "-0.28em", width: "106%", height: "0.32em", overflow: "visible" }}>
    <path d="M 2 6 C 25 2, 50 9, 75 4 S 96 5, 98 3" fill="none" stroke={color} strokeWidth={4} vectorEffect="non-scaling-stroke" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} />
  </svg>
);
