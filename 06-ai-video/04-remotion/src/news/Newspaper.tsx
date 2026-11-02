import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// An old newspaper front page, recreated (made-up masthead, real checked facts).
// Aged paper, three columns, a slow camera move onto the headline,
// then a highlighter sweeps across the key fact.

export type NewspaperProps = {
  date: string;        // e.g. "BOMBAY  ·  JULY 1991"
  price: string;       // e.g. "Rs. 2.00"
  headline: string;
  deck: string;        // the line under the headline
  highlight: string;   // the key fact that gets highlighted
  columns: { title: string; body: string }[]; // 3 short stories
};

const SERIF = "'Liberation Serif', 'Times New Roman', serif";
const SANS = "'Liberation Sans', Arial, sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Newspaper: React.FC<NewspaperProps> = ({ date, price, headline, deck, highlight, columns }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Camera: starts on the whole page, tilted, then pushes in to the headline
  const move = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.cubic) });
  const scale = interpolate(move, [0, 1], [0.78, 1.18]);
  const rotate = interpolate(move, [0, 1], [-4, -1]);
  const y = interpolate(move, [0, 1], [40, 210]);
  const hl = interpolate(frame, [Math.round(durationInFrames * 0.55), Math.round(durationInFrames * 0.75)], [0, 100], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: "#141210", overflow: "hidden", opacity: fadeIn * fadeOut }}>
      {/* desk-lamp light on a dark table */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #3A2E22 0%, #141210 70%)" }} />
      <div
        style={{
          position: "absolute",
          left: 960 - 620,
          top: 0,
          width: 1240,
          height: 1600,
          transform: `translateY(${y}px) scale(${scale}) rotate(${rotate}deg)`,
          transformOrigin: "50% 22%",
          // aged paper: warm base, darker edges, faint stains
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(120,90,40,0.10) 0%, transparent 40%)," +
            "radial-gradient(ellipse at 80% 70%, rgba(120,90,40,0.12) 0%, transparent 45%)," +
            "radial-gradient(ellipse at center, #EDE3CB 0%, #E2D3B0 70%, #C9B488 100%)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
          padding: "50px 64px",
          color: "#1E1A14",
        }}
      >
        {/* paper grain */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.22, mixBlendMode: "multiply" }}>
          <filter id="paper">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={3} seed={7} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#paper)" />
        </svg>

        {/* masthead (made-up name) */}
        <div style={{ position: "relative", textAlign: "center", borderBottom: "4px double #1E1A14", paddingBottom: 12 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 108, letterSpacing: 4, lineHeight: 1 }}>The National Ledger</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 20, letterSpacing: 2, marginTop: 14, borderTop: "1px solid #1E1A14", paddingTop: 8 }}>
            <span>{date}</span>
            <span>RECREATION</span>
            <span>{price}</span>
          </div>
        </div>

        {/* headline */}
        <div style={{ position: "relative", textAlign: "center", marginTop: 26 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 96, lineHeight: 0.98, textTransform: "uppercase", letterSpacing: -1 }}>
            {headline}
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 38, marginTop: 18 }}>
            {deck.split(highlight).map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span
                    style={{
                      backgroundImage: "linear-gradient(transparent 20%, rgba(242,193,78,0.85) 20%, rgba(242,193,78,0.85) 90%, transparent 90%)",
                      backgroundSize: `${hl}% 100%`,
                      backgroundRepeat: "no-repeat",
                      fontStyle: "normal",
                      fontWeight: 700,
                    }}
                  >
                    {highlight}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* three columns of short stories */}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 30, marginTop: 34, borderTop: "2px solid #1E1A14", paddingTop: 18 }}>
          {columns.map((c, i) => (
            <div key={i} style={{ borderLeft: i ? "1px solid rgba(30,26,20,0.5)" : "none", paddingLeft: i ? 26 : 0 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 32, lineHeight: 1.1, marginBottom: 10 }}>{c.title}</div>
              <div style={{ fontFamily: SERIF, fontSize: 22, lineHeight: 1.45, textAlign: "justify", hyphens: "auto" }}>{c.body}</div>
            </div>
          ))}
        </div>

        {/* lower half: a halftone "photo" (illustration) and an INSIDE panel, like a real front page */}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 30, marginTop: 30, borderTop: "2px solid #1E1A14", paddingTop: 20 }}>
          <div>
            <div
              style={{
                height: 360,
                background: "radial-gradient(circle, rgba(30,26,20,0.85) 1.6px, transparent 2px) 0 0 / 7px 7px, linear-gradient(160deg, #B9A57E, #8C7650)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 700 360" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.85 }}>
                {[[130, 250], [290, 250], [450, 250], [210, 190], [370, 190], [290, 130]].map(([x, y], i) => (
                  <g key={i} transform={`translate(${x} ${y})`}>
                    <polygon points="0,52 26,0 134,0 160,52" fill="#3A2F1E" />
                    <polygon points="26,0 134,0 124,12 36,12" fill="#6B5A3A" />
                  </g>
                ))}
              </svg>
            </div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, marginTop: 8 }}>
              Gold bars (illustration). India's gold reserves have become central to the crisis.
            </div>
          </div>
          <div style={{ borderLeft: "1px solid rgba(30,26,20,0.5)", paddingLeft: 26 }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 3, borderBottom: "2px solid #1E1A14", paddingBottom: 6 }}>INSIDE</div>
            {["Economy", "Parliament", "World", "Markets", "Editorial", "Sport"].map((t, i) => (
              <div key={t} style={{ display: "flex", justifyContent: "space-between", fontFamily: SERIF, fontSize: 24, padding: "9px 0", borderBottom: "1px dotted rgba(30,26,20,0.5)" }}>
                <span>{t}</span>
                <span>{[5, 7, 9, 11, 8, 16][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* lamp vignette on top */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(0,0,0,0.6) 100%)" }} />
    </AbsoluteFill>
  );
};
