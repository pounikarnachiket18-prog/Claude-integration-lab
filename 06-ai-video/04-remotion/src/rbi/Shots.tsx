import React from "react";
import { Scribble } from "./Motion";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Building blocks for the RBI documentary: photos with slow camera moves,
// low-resolution clips on a blurred backdrop, chapter cards, on-screen narration,
// a reserves chart, a gold counter, and the shared film look (grade + grain).

const SANS = "'Liberation Sans', Arial, sans-serif";
const SERIF = "'Liberation Serif', 'Times New Roman', serif";
const GOLD = "#F2C14E";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- Film look: dark grade, vignette, grain -------------------------------------
export const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.72) 100%)" }} />
      <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="docgrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 24} />
          </filter>
          <rect width="100%" height="100%" filter="url(#docgrain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

// ---- A photo with a slow "Ken Burns" camera move ---------------------------------
export const Photo: React.FC<{
  src: string;
  move?: "in" | "out" | "left" | "right";
  dim?: number;
  bw?: boolean;
  fit?: "cover" | "contain";
  caption?: string;
}> = ({ src, move = "in", dim = 0.25, bw = false, fit = "cover", caption }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1]);
  const scale = move === "in" ? 1.04 + 0.12 * t : move === "out" ? 1.16 - 0.12 * t : 1.12;
  const x = move === "left" ? 40 - 80 * t : move === "right" ? -40 + 80 * t : 0;
  const filter = `${bw ? "grayscale(1) " : ""}contrast(1.05) saturate(0.85)`;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {fit === "contain" && (
        <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: `blur(40px) brightness(0.4) ${filter}`, transform: "scale(1.2)" }} />
      )}
      <Img
        src={staticFile(src)}
        style={{ position: "absolute", width: "100%", height: "100%", objectFit: fit, transform: `translateX(${x}px) scale(${scale})`, filter }}
      />
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />
      {caption && <SmallCaption text={caption} />}
    </AbsoluteFill>
  );
};

// ---- A low-resolution or vertical clip, placed on a blurred copy of itself ---------
export const Clip: React.FC<{ src: string; vertical?: boolean; dim?: number; caption?: string; cropBottom?: boolean; trimBefore?: number; grade?: string }> = ({
  src,
  vertical = false,
  dim = 0.2,
  caption,
  trimBefore,
  grade = "contrast(1.08) saturate(0.85) blur(0.4px)",
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.06, 1.14]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {vertical && (
        <OffthreadVideo src={staticFile(src)} muted style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "blur(36px) brightness(0.35)", transform: "scale(1.3)" }} />
      )}
      <OffthreadVideo
        src={staticFile(src)}
        muted
        trimBefore={trimBefore}
        style={{
          position: "absolute",
          left: vertical ? (1920 - 1080 * (360 / 640)) / 2 : 0,
          width: vertical ? 1080 * (360 / 640) : "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: grade,
        }}
      />
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />
      {caption && <SmallCaption text={caption} />}
    </AbsoluteFill>
  );
};

export const SmallCaption: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 40, top: 34, fontFamily: SANS, fontSize: 20, letterSpacing: 1, color: "rgba(255,255,255,0.7)", textShadow: "0 1px 4px #000" }}>
    {text}
  </div>
);

// ---- On-screen narration: words appear one by one, then the line fades -----------
export const Narration: React.FC<{ text: string; position?: "bottom" | "center"; size?: number; delay?: number }> = ({
  text,
  position = "bottom",
  size = 50,
  delay = 6,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  let inside = false;
  const words = text.split(" ").map((raw) => {
    const starts = raw.startsWith("*");
    const ends = raw.endsWith("*") && (raw.length > 1 || starts);
    const accent = inside || starts;
    if (starts) inside = true;
    if (ends) inside = false;
    return { w: raw.replace(/\*/g, ""), accent };
  });
  return (
    <AbsoluteFill style={{ justifyContent: position === "bottom" ? "flex-end" : "center", alignItems: "center", opacity: out, paddingBottom: position === "bottom" ? 110 : 0 }}>
      <div style={{ maxWidth: 1500, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: size, lineHeight: 1.25, color: "#F2F0EA", textShadow: "0 3px 18px rgba(0,0,0,0.95), 0 0 2px #000", textWrap: "balance" } as React.CSSProperties}>
        {words.map(({ w, accent }, i) => {
          const p = spring({ frame: frame - delay - i * 2.2, fps, config: { damping: 200 } });
          return (
            <span key={i} style={{ position: "relative", display: "inline-block", margin: "0 0.13em", color: accent ? GOLD : undefined, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)` }}>
              {w}
              {accent && <Scribble progress={interpolate(frame, [delay + i * 2.2 + 10, delay + i * 2.2 + 26], [0, 1], clamp)} />}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---- Chapter card ----------------------------------------------------------------
export const ChapterCard: React.FC<{ number: string; title: string; date: string }> = ({ number, title, date }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const a = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const b = spring({ frame: frame - 14, fps, config: { damping: 200 } });
  const line = interpolate(frame, [10, 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#07080B", justifyContent: "center", alignItems: "center", opacity: out }}>
      <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: 10, color: GOLD, opacity: a }}>CHAPTER {number}</div>
      <div style={{ width: 520 * line, height: 2, backgroundColor: GOLD, margin: "26px 0", boxShadow: `0 0 12px ${GOLD}` }} />
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 104, color: "#F2F0EA", opacity: b, transform: `translateY(${interpolate(b, [0, 1], [20, 0])}px)` }}>{title}</div>
      <div style={{ fontFamily: SANS, fontSize: 30, letterSpacing: 6, color: "#8D97A8", marginTop: 22, opacity: b }}>{date}</div>
    </AbsoluteFill>
  );
};

// ---- Title card -------------------------------------------------------------------
export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const year = spring({ frame: frame - 4, fps, config: { damping: 14 } });
  const rest = spring({ frame: frame - 22, fps, config: { damping: 200 } });
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], clamp);
  const shine = interpolate(frame, [30, 70], [-20, 120], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506", justifyContent: "center", alignItems: "center", opacity: out }}>
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 260,
          lineHeight: 1,
          backgroundImage: `linear-gradient(110deg, #9C7A2A ${shine - 15}%, #FFF1B8 ${shine}%, #C9982E ${shine + 15}%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          transform: `scale(${interpolate(year, [0, 1], [1.3, 1])})`,
          opacity: Math.min(1, year * 1.5),
        }}
      >
        1991
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 58, letterSpacing: 12, color: "#F2F0EA", marginTop: 24, opacity: rest }}>
        THE YEAR INDIA PAWNED ITS GOLD
      </div>
    </AbsoluteFill>
  );
};

// ---- Reserves chart: $3.1 billion (Aug 1990) → $896 million (Jan 1991) --------------
export const ReservesChart: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [15, 105], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const value = 3100 - (3100 - 896) * p; // millions of dollars
  const x0 = 260, x1 = 1660, y0 = 860, y1 = 260; // chart box
  const yOf = (v: number) => y0 - (v / 3500) * (y0 - y1);
  const xNow = x0 + (x1 - x0) * p;
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  const label = value >= 1000 ? `$${(value / 1000).toFixed(1)} billion` : `$${Math.round(value)} million`;
  return (
    <AbsoluteFill style={{ backgroundColor: "#07090E", opacity: out }}>
      <svg width={1920} height={1080}>
        {[0, 1000, 2000, 3000].map((v) => (
          <g key={v}>
            <line x1={x0} x2={x1} y1={yOf(v)} y2={yOf(v)} stroke="rgba(255,255,255,0.08)" />
            <text x={x0 - 20} y={yOf(v) + 8} textAnchor="end" fill="#6E7A8F" fontFamily={SANS} fontSize={24}>{v === 0 ? "$0" : `$${v / 1000}B`}</text>
          </g>
        ))}
        <line x1={x0} x2={xNow} y1={yOf(3100)} y2={yOf(value)} stroke="#FF5A4E" strokeWidth={8} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 10px #FF5A4E)" }} />
        <circle cx={xNow} cy={yOf(value)} r={14} fill="#FFD3CF" />
        <text x={x0} y={y0 + 54} fill="#8D97A8" fontFamily={SANS} fontSize={28}>AUG 1990</text>
        <text x={x1} y={y0 + 54} textAnchor="end" fill="#8D97A8" fontFamily={SANS} fontSize={28}>JAN 1991</text>
      </svg>
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontFamily: SANS, fontSize: 28, letterSpacing: 8, color: "#8D97A8" }}>
        INDIA'S FOREIGN EXCHANGE RESERVES
      </div>
      <div style={{ position: "absolute", top: 140, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 92, color: value < 1000 ? "#FF5A4E" : "#F2F0EA", fontVariantNumeric: "tabular-nums" }}>
        {label}
      </div>
    </AbsoluteFill>
  );
};

// ---- Gold counter: tonnes counting up as bars stack --------------------------------
export const GoldCounter: React.FC<{ tonnes: number; label: string }> = ({ tonnes, label }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [10, 90], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const bars = Math.round(p * 15);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#08070A", justifyContent: "center", alignItems: "center", opacity: out }}>
      <svg width={900} height={420} viewBox="0 0 900 420">
        {new Array(15).fill(0).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          const x = 60 + col * 160 + row * 40;
          const y = 330 - row * 70;
          const show = i < bars;
          const drop = show ? 0 : -40;
          return (
            <g key={i} transform={`translate(${x} ${y + drop})`} opacity={show ? 1 : 0}>
              <polygon points="0,60 26,0 134,0 160,60" fill="#D9A83A" stroke="#8A6516" strokeWidth={3} />
              <polygon points="26,0 134,0 124,12 36,12" fill="#FFE7A3" />
            </g>
          );
        })}
      </svg>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 110, color: GOLD, textShadow: `0 0 30px rgba(242,193,78,0.4)`, fontVariantNumeric: "tabular-nums" }}>
        {(tonnes * p).toFixed(tonnes % 1 ? 2 : 0)} TONNES
      </div>
      <div style={{ fontFamily: SANS, fontSize: 32, letterSpacing: 6, color: "#A9B1BE", marginTop: 10 }}>{label}</div>
    </AbsoluteFill>
  );
};

// ---- A real document page, slowly drifting under a desk light -----------------------
export const DocumentPage: React.FC<{ src: string; focusY?: number }> = ({ src, focusY = 0.3 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#15110D", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #3A2E22 0%, #110E0B 70%)" }} />
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 1100,
          transform: `translate(-50%, ${-focusY * 1100 * 1.3 + 120 - 60 * t}px) rotate(${-2 + t}deg) scale(${1.15 + 0.15 * t})`,
          filter: "sepia(0.35) contrast(1.1) brightness(0.92)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};

// ---- Credits -----------------------------------------------------------------------
export const Credits: React.FC<{ lines: string[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const y = interpolate(frame, [0, durationInFrames], [80, -80]);
  const op = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#050506", justifyContent: "center", alignItems: "center", opacity: op }}>
      <div style={{ transform: `translateY(${y}px)`, textAlign: "center", display: "flex", flexDirection: "column", gap: 14 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: i === 0 ? SERIF : SANS, fontWeight: i === 0 ? 700 : 400, fontSize: i === 0 ? 54 : 26, color: i === 0 ? GOLD : "#B5BDC9", marginBottom: i === 0 ? 20 : 0 }}>
            {l}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// keep the random import used (deterministic sparkle positions in future shots)
export const _seed = random("rbi");
