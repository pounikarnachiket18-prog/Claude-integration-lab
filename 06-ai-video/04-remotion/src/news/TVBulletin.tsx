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

// A 1990s TV news bulletin, recreated (no real broadcaster's branding).
// 4:3 picture inside a 16:9 frame, with CRT scanlines, VHS noise, colour fringing,
// a tracking band, a "BREAKING NEWS" bar, a headline and a scrolling ticker.

export type TVBulletinProps = {
  date: string;          // VHS date stamp, e.g. "JUL. 1991"
  dateline: string;      // e.g. "BOMBAY  ·  JULY 1991"
  headline: string;      // the big headline (keep it short)
  subline: string;       // one supporting line
  ticker: string[];      // facts that scroll along the bottom
  bigNumber?: string;    // optional large figure, e.g. "46.91 TONNES"
  icon?: "gold" | "rupee" | "chart" | "parliament";
};

const SANS = "'Liberation Sans', Arial, sans-serif";
const MONO = "'Liberation Mono', 'Courier New', monospace";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SCREEN_W = 1440; // 4:3 inside 1920x1080

// Simple period-style icons drawn with SVG (no external images needed)
const Icon: React.FC<{ kind: TVBulletinProps["icon"]; glow: number }> = ({ kind, glow }) => {
  const gold = "#F2C14E";
  if (kind === "gold") {
    const bar = (x: number, y: number) => (
      <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
        <polygon points="0,40 20,0 120,0 140,40" fill={gold} stroke="#9A7420" strokeWidth={3} />
        <polygon points="20,0 120,0 112,10 28,10" fill="#FFE29A" />
      </g>
    );
    return (
      <svg width={360} height={220} viewBox="0 0 360 220" style={{ filter: `drop-shadow(0 0 ${18 * glow}px ${gold})` }}>
        {bar(30, 160)}{bar(190, 160)}{bar(110, 112)}{bar(30, 64)}{bar(190, 64)}{bar(110, 16)}
      </svg>
    );
  }
  if (kind === "rupee") {
    return (
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 210, color: gold, lineHeight: 1, textShadow: `0 0 ${30 * glow}px ${gold}` }}>₹</div>
    );
  }
  if (kind === "parliament") {
    return (
      <svg width={360} height={200} viewBox="0 0 360 200">
        <ellipse cx={180} cy={150} rx={160} ry={34} fill="#C9B79A" />
        <rect x={30} y={90} width={300} height={60} fill="#D8C7A8" />
        {new Array(14).fill(0).map((_, i) => (
          <rect key={i} x={40 + i * 21} y={96} width={8} height={52} fill="#A8946F" />
        ))}
        <ellipse cx={180} cy={90} rx={150} ry={14} fill="#B8A584" />
      </svg>
    );
  }
  // chart: a falling line (reserves)
  return (
    <svg width={360} height={220} viewBox="0 0 360 220">
      <polyline points="10,30 80,50 140,48 200,110 260,150 340,200" fill="none" stroke="#FF5A4E" strokeWidth={10} strokeLinejoin="round" />
      <polygon points="340,200 312,176 330,170" fill="#FF5A4E" />
      {[60, 110, 160].map((y) => <line key={y} x1={0} x2={360} y1={y} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth={2} />)}
    </svg>
  );
};

export const TVBulletin: React.FC<TVBulletinProps> = ({ date, dateline, headline, subline, ticker, bigNumber, icon = "gold" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ---- the graphics animate in like a 90s broadcast package ----
  const breaking = spring({ frame: frame - 8, fps, config: { damping: 200 } });           // red bar slides in
  const headlineWipe = interpolate(frame, [20, 34], [0, 100], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sub = interpolate(frame, [34, 46], [0, 1], clamp);
  const iconIn = spring({ frame: frame - 14, fps, config: { damping: 14 } });
  const numberIn = spring({ frame: frame - 44, fps, config: { damping: 12, stiffness: 140 } });
  const flash = Math.floor(frame / 15) % 2 === 0;                                           // "BREAKING" flashes
  const tickerText = ticker.join("   ◆   ") + "   ◆   ";
  const tickerX = -frame * 4.2;

  // ---- VHS / CRT damage ----
  const jitterX = (random(`jx${Math.floor(frame / 2)}`) - 0.5) * 3;
  const jitterY = random(`jy${frame}`) > 0.97 ? (random(`jyy${frame}`) - 0.5) * 10 : 0;     // occasional jump
  const bandY = ((frame * 9) % 1400) - 200;                                                   // tracking band rolls down
  const fadeIn = interpolate(frame, [0, 6], [0, 1], clamp);
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeIn * fadeOut }}>
      {/* the TV picture: 4:3, slightly rounded like a CRT */}
      <div
        style={{
          position: "absolute",
          left: (1920 - SCREEN_W) / 2,
          top: 0,
          width: SCREEN_W,
          height: 1080,
          overflow: "hidden",
          borderRadius: 40,
          transform: `translate(${jitterX}px, ${jitterY}px)`,
          filter: "saturate(1.25) contrast(1.08) blur(0.6px)",
        }}
      >
        {/* studio background: deep blue with slow-moving light */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at ${30 + frame * 0.15}% 30%, #2C5BB8 0%, #12306E 45%, #07173A 100%)`,
          }}
        />
        {/* faint globe grid, a common 90s news backdrop */}
        <svg width={SCREEN_W} height={1080} style={{ position: "absolute", opacity: 0.18 }}>
          {new Array(9).fill(0).map((_, i) => (
            <ellipse key={i} cx={1060} cy={420} rx={30 + i * 34} ry={300} fill="none" stroke="#9CC3FF" strokeWidth={2}
              transform={`rotate(${frame * 0.2} 1060 420)`} />
          ))}
          {new Array(7).fill(0).map((_, i) => (
            <line key={`l${i}`} x1={760} x2={1360} y1={150 + i * 90} y2={150 + i * 90} stroke="#9CC3FF" strokeWidth={2} />
          ))}
        </svg>

        {/* channel bug (made-up name) */}
        <div style={{ position: "absolute", top: 54, left: 70, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #FFFFFF, #E63B2E 55%)" }} />
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, color: "#FFFFFF", letterSpacing: 2 }}>
            NEWS<span style={{ color: "#F2C14E" }}>LINE</span>
          </div>
        </div>
        <div style={{ position: "absolute", top: 62, right: 70, fontFamily: SANS, fontSize: 24, color: "#CFE0FF", letterSpacing: 3 }}>
          {dateline}
        </div>

        {/* icon panel */}
        <div style={{ position: "absolute", top: 170, right: 150, transform: `scale(${iconIn})`, opacity: Math.min(1, iconIn * 1.5) }}>
          <Icon kind={icon} glow={0.6 + 0.4 * Math.sin(frame / 8)} />
        </div>

        {/* big number */}
        {bigNumber && (
          <div
            style={{
              position: "absolute",
              top: 410,
              right: 120,
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 84,
              color: "#FFFFFF",
              textShadow: "3px 0 0 rgba(255,0,60,0.6), -3px 0 0 rgba(0,180,255,0.6)",
              transform: `scale(${numberIn})`,
              opacity: Math.min(1, numberIn * 1.5),
            }}
          >
            {bigNumber}
          </div>
        )}

        {/* lower-third stack: BREAKING bar, headline strip (grows to 2 lines if needed), subline */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 122, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div
            style={{
              transform: `translateX(${interpolate(breaking, [0, 1], [-620, 0])}px)`,
              background: flash ? "#E63B2E" : "#B5241A",
              padding: "12px 40px 12px 70px",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 40,
              color: "#FFFFFF",
              letterSpacing: 4,
            }}
          >
            BREAKING NEWS
          </div>
          <div
            style={{
              width: "100%",
              background: "linear-gradient(180deg, #F7F2E2 0%, #DCD3B8 100%)",
              padding: "18px 70px",
              clipPath: `inset(0 ${100 - headlineWipe}% 0 0)`,
            }}
          >
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 54, color: "#0B1B3F", lineHeight: 1.08, textTransform: "uppercase" }}>
              {headline}
            </div>
          </div>
          <div
            style={{
              width: "100%",
              background: "#0B1B3F",
              padding: "14px 70px",
              fontFamily: SANS,
              fontSize: 30,
              color: "#E8EEFF",
              opacity: sub,
            }}
          >
            {subline}
          </div>
        </div>

        {/* ticker */}
        <div style={{ position: "absolute", bottom: 46, left: 0, width: "100%", height: 64, background: "#F2C14E", overflow: "hidden", display: "flex", alignItems: "center" }}>
          <div style={{ background: "#0B1B3F", color: "#F2C14E", fontFamily: SANS, fontWeight: 700, fontSize: 28, padding: "0 26px", height: "100%", display: "flex", alignItems: "center", zIndex: 2, letterSpacing: 2 }}>
            LATEST
          </div>
          <div style={{ whiteSpace: "nowrap", fontFamily: SANS, fontWeight: 700, fontSize: 30, color: "#0B1B3F", transform: `translateX(${tickerX % 6000}px)`, paddingLeft: 30 }}>
            {tickerText.repeat(4)}
          </div>
        </div>

        {/* ---- CRT + VHS overlays ---- */}
        <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 4px)", mixBlendMode: "multiply" }} />
        <AbsoluteFill style={{ opacity: 0.16, mixBlendMode: "screen" }}>
          <svg width="100%" height="100%">
            <filter id="vhsnoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={frame} />
            </filter>
            <rect width="100%" height="100%" filter="url(#vhsnoise)" />
          </svg>
        </AbsoluteFill>
        <div style={{ position: "absolute", left: 0, right: 0, top: bandY, height: 70, background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.03), transparent)", filter: "blur(2px)" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />

        {/* VCR on-screen display */}
        <div style={{ position: "absolute", top: 130, left: 74, fontFamily: MONO, fontWeight: 700, fontSize: 30, color: "#FFFFFF", textShadow: "2px 2px 0 #000", opacity: frame < 50 ? 1 : 0 }}>
          PLAY ▶
        </div>
        <div style={{ position: "absolute", bottom: 128, right: 80, fontFamily: MONO, fontWeight: 700, fontSize: 28, color: "#FFFFFF", textShadow: "2px 2px 0 #000" }}>
          {date}
        </div>
        <div style={{ position: "absolute", top: 136, right: 74, fontFamily: SANS, fontSize: 18, letterSpacing: 2, color: "rgba(255,255,255,0.75)" }}>
          RECREATION
        </div>
      </div>
    </AbsoluteFill>
  );
};
