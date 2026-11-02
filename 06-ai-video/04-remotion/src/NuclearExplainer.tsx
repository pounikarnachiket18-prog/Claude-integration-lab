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

// "How does a nuclear bomb explode?": a 45-second faceless explainer Short
// (1080x1920, 30 fps, 1350 frames). Textbook-level physics only.
//
//   0.0-3.5s   Hook
//   3.5-9.5s   The atom: Uranium-235's big, unstable nucleus
//   9.5-17.5s  Fission: a neutron hits, the nucleus splits, more neutrons fly out
//   17.5-26.5s Chain reaction: 1 → 2 → 4 → 8 … in under a microsecond
//   26.5-32.5s Where the energy comes from: E = mc²
//   32.5-40.5s The explosion: flash, fireball, shockwave, mushroom cloud
//   40.5-45s   Ending: Hiroshima & Nagasaki, 1945

// ---- Style kit -------------------------------------------------------------------
const BG = "#05070D";
const CYAN = "#5CE1E6"; // neutrons
const PROTON = "#FF6B4A";
const NEUTRON_IN_NUCLEUS = "#8FA6C1";
const ENERGY = "#FFE08A";
const TEXT = "#F4F2EE";
const SANS = "'Liberation Sans', sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const NUCLEAR_DURATION = 1350;
const CX = 540; // centre of the diagram area
const CY = 760;

// ---- Captions: words pop in quickly, like subtitles for a voice-over.
//      Words wrapped in *stars* are highlighted. ------------------------------------
const Caption: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [dur - 6, dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: out }}>
      <div
        style={
          {
            position: "absolute",
            top: 1250, // safe zone: above Instagram/YouTube's caption area
            left: 90,
            right: 150, // clear of the like/comment buttons on the right
            textAlign: "center",
            textWrap: "balance",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 60,
            lineHeight: 1.2,
          } as React.CSSProperties
        }
      >
        {(() => {
          // Work out which words are highlighted: everything from a word starting with *
          // up to (and including) the word ending with *, so phrases can be highlighted.
          let inside = false;
          return text.split(" ").map((raw) => {
            const starts = raw.startsWith("*");
            const ends = raw.endsWith("*") && (raw.length > 1 || starts);
            const accent = inside || starts;
            if (starts) inside = true;
            if (ends) inside = false;
            return { w: raw.replace(/\*/g, ""), accent };
          });
        })().map(({ w, accent }, i) => {
          const p = spring({ frame: frame - i * 2.5, fps, config: { damping: 16, stiffness: 200 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 0.13em",
                color: accent ? ENERGY : TEXT,
                textShadow: "0 4px 18px rgba(0,0,0,0.8)",
                opacity: p,
                transform: `scale(${interpolate(p, [0, 1], [1.3, 1])})`,
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

// ---- A nucleus: a tight cluster of protons (orange) and neutrons (blue-grey) ----------
const BALLS = new Array(38).fill(0).map((_, i) => {
  const r = 10.5 * Math.sqrt(i); // "sunflower" packing: even spacing in a circle
  const a = i * 2.39996;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, proton: random(`p${i}`) < 0.45 };
});

const Ball: React.FC<{ x: number; y: number; r: number; color: string; glow?: number }> = ({
  x,
  y,
  r,
  color,
  glow = 0,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle at 35% 30%, white -40%, ${color} 55%, rgba(0,0,0,0.6) 130%)`,
      boxShadow: glow ? `0 0 ${glow}px ${color}` : "none",
    }}
  />
);

// Draws the nucleus. "split" moves the left and right halves apart.
const Nucleus: React.FC<{ scale?: number; stretch?: number; split?: number; jiggle?: number }> = ({
  scale = 1,
  stretch = 0,
  split = 0,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {BALLS.map((b, i) => {
        const side = b.x < 0 ? -1 : 1;
        const jx = Math.sin(frame / 4 + i) * 1.5; // tiny constant jiggle: it's unstable
        const jy = Math.cos(frame / 5 + i * 1.7) * 1.5;
        const x = CX + (b.x * (1 + stretch) + jx) * scale * 2 + side * split * 300;
        const y = CY + (b.y * (1 - stretch * 0.35) + jy) * scale * 2 + split * (side < 0 ? -40 : 40);
        return (
          <Ball key={i} x={x} y={y} r={13 * scale * 2 * 0.62} color={b.proton ? PROTON : NEUTRON_IN_NUCLEUS} />
        );
      })}
    </>
  );
};

// ---- Scene 1: hook ------------------------------------------------------------------
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const flash = interpolate(frame, [0, 3, 14], [0.9, 0.5, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill style={{ backgroundColor: ENERGY, opacity: flash }} />
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 104,
          color: TEXT,
          textAlign: "center",
          lineHeight: 1.1,
          padding: "0 100px",
          transform: `scale(${interpolate(p, [0, 1], [1.4, 1])})`,
          opacity: p,
          marginTop: -200,
        }}
      >
        How does a <span style={{ color: ENERGY }}>nuclear bomb</span> explode?
      </div>
    </AbsoluteFill>
  );
};

// ---- Scene 2: the atom ----------------------------------------------------------------
const AtomScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Nucleus scale={grow} />
      <div
        style={{
          position: "absolute",
          top: CY - 300,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 46,
          letterSpacing: 4,
          color: "#9AA6B8",
          opacity: interpolate(frame, [20, 40], [0, 1], clamp),
        }}
      >
        URANIUM-235 NUCLEUS
      </div>
    </AbsoluteFill>
  );
};

// ---- Scene 3: fission ------------------------------------------------------------------
const FissionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const HIT = 60;
  const SPLIT = 90;
  const inX = interpolate(frame, [0, HIT], [-60, CX - 70], { ...clamp, easing: Easing.in(Easing.quad) });
  const stretch = interpolate(frame, [HIT, SPLIT], [0, 0.35], { ...clamp, easing: Easing.in(Easing.cubic) });
  const split = interpolate(frame, [SPLIT, SPLIT + 45], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const flash = interpolate(frame, [SPLIT, SPLIT + 4, SPLIT + 30], [0, 1, 0], clamp);
  const outNeutrons = [-55, 15, 145].map((deg) => (deg * Math.PI) / 180);
  const fly = interpolate(frame, [SPLIT, SPLIT + 60], [0, 700], { ...clamp, easing: Easing.out(Easing.quad) });

  return (
    <AbsoluteFill>
      <Nucleus scale={1} stretch={frame < SPLIT ? stretch : 0.35 * (1 - split)} split={split} />
      {/* Incoming neutron with a trail */}
      {frame < HIT && (
        <>
          <div
            style={{
              position: "absolute",
              left: inX - 160,
              top: CY - 3,
              width: 160,
              height: 6,
              background: `linear-gradient(90deg, transparent, ${CYAN})`,
              opacity: 0.7,
            }}
          />
          <Ball x={inX} y={CY} r={18} color={CYAN} glow={25} />
        </>
      )}
      {/* Energy flash at the split */}
      <div
        style={{
          position: "absolute",
          left: CX - 350,
          top: CY - 350,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, white 0%, ${ENERGY} 25%, rgba(255,224,138,0) 65%)`,
          opacity: flash,
        }}
      />
      {/* 3 new neutrons shoot out */}
      {frame >= SPLIT &&
        outNeutrons.map((a, i) => (
          <Ball key={i} x={CX + Math.cos(a) * fly} y={CY + Math.sin(a) * fly} r={18} color={CYAN} glow={25} />
        ))}
      {frame >= SPLIT + 20 && (
        <div
          style={{
            position: "absolute",
            top: CY - 420,
            width: "100%",
            textAlign: "center",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 70,
            letterSpacing: 8,
            color: ENERGY,
            opacity: interpolate(frame, [SPLIT + 20, SPLIT + 35], [0, 1], clamp),
          }}
        >
          FISSION
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- Scene 4: chain reaction (a branching tree that doubles each step) ------------------
const GEN_TIMES = [0, 30, 55, 75, 90, 102, 112]; // each generation comes faster
const ChainScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes: { g: number; x: number; y: number; parent?: { x: number; y: number } }[] = [];
  GEN_TIMES.forEach((_, g) => {
    const count = 2 ** g;
    for (let k = 0; k < count; k++) {
      const x = 90 + ((k + 0.5) / count) * 900;
      const y = 400 + g * 115;
      const parentCount = 2 ** (g - 1);
      const parent = g === 0 ? undefined : { x: 90 + ((Math.floor(k / 2) + 0.5) / parentCount) * 900, y: 400 + (g - 1) * 115 };
      nodes.push({ g, x, y, parent });
    }
  });
  const currentGen = GEN_TIMES.filter((t) => frame >= t).length - 1;
  const showHuge = frame >= 160;
  const shake = frame > 130 && frame < 260 ? Math.sin(frame * 2.3) * interpolate(frame, [130, 260], [3, 8]) : 0;

  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {nodes.map((n, i) => {
          if (!n.parent) return null;
          const t0 = GEN_TIMES[n.g] - 8;
          const p = interpolate(frame, [t0, t0 + 8], [0, 1], clamp);
          return (
            <line
              key={i}
              x1={n.parent.x}
              y1={n.parent.y}
              x2={n.parent.x + (n.x - n.parent.x) * p}
              y2={n.parent.y + (n.y - n.parent.y) * p}
              stroke={CYAN}
              strokeWidth={2.5}
              opacity={0.7}
            />
          );
        })}
      </svg>
      {nodes.map((n, i) => {
        const pop = spring({ frame: frame - GEN_TIMES[n.g], fps, config: { damping: 12, stiffness: 200 } });
        const r = Math.max(5, 22 - n.g * 2.6);
        const glow = interpolate(frame - GEN_TIMES[n.g], [0, 12], [40, 8], clamp);
        return pop > 0.01 ? <Ball key={i} x={n.x} y={n.y} r={r * pop} color={ENERGY} glow={glow} /> : null;
      })}
      {/* The counter */}
      <div
        style={{
          position: "absolute",
          top: 210,
          width: "100%",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: showHuge ? 110 : 120,
          color: ENERGY,
          textShadow: `0 0 30px rgba(255,224,138,0.5)`,
        }}
      >
        {showHuge ? (
          <>
            ~10<sup style={{ fontSize: 64 }}>24</sup>
          </>
        ) : (
          (2 ** Math.max(0, currentGen)).toString()
        )}
        <div style={{ fontSize: 40, fontWeight: 400, color: "#9AA6B8", letterSpacing: 3 }}>
          {showHuge ? "ATOMS SPLIT" : "ATOMS SPLITTING"}
        </div>
      </div>
      {/* The screen fills with light as it runs away */}
      <AbsoluteFill style={{ backgroundColor: ENERGY, opacity: interpolate(frame, [150, 270], [0, 0.25], clamp) }} />
    </AbsoluteFill>
  );
};

// ---- Scene 5: E = mc² ------------------------------------------------------------------
const MassScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bar1 = spring({ frame: frame - 5, fps, config: { damping: 200 } });
  const bar2 = spring({ frame: frame - 25, fps, config: { damping: 200 } });
  const gapGlow = interpolate(frame, [45, 60], [0, 1], clamp);
  const eq = spring({ frame: frame - 92, fps, config: { damping: 11, stiffness: 160 } });
  const label: React.CSSProperties = { fontFamily: SANS, fontSize: 40, color: "#9AA6B8", marginBottom: 14 };
  const W = 780;
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 420, left: 150, width: W }}>
        <div style={label}>Mass BEFORE: 1 uranium atom</div>
        <div style={{ height: 70, width: W * bar1, borderRadius: 12, backgroundColor: PROTON }} />
        <div style={{ ...label, marginTop: 50 }}>Mass AFTER: the pieces</div>
        <div style={{ display: "flex", height: 70 }}>
          <div style={{ width: (W - 90) * bar2, borderRadius: "12px 0 0 12px", backgroundColor: NEUTRON_IN_NUCLEUS }} />
          <div
            style={{
              width: 90,
              border: `3px dashed ${ENERGY}`,
              borderRadius: "0 12px 12px 0",
              opacity: gapGlow,
              boxShadow: `0 0 ${40 * gapGlow}px ${ENERGY}`,
              backgroundColor: `rgba(255,224,138,${0.25 * gapGlow})`,
            }}
          />
        </div>
        <div style={{ ...label, fontSize: 30, marginTop: 14, opacity: gapGlow }}>missing mass (exaggerated so you can see it)</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 860,
          width: "100%",
          textAlign: "center",
          fontFamily: "'Liberation Serif', serif",
          fontStyle: "italic",
          fontSize: 170,
          color: ENERGY,
          textShadow: `0 0 50px rgba(255,224,138,0.6)`,
          opacity: Math.min(1, eq * 1.5),
          transform: `scale(${eq})`,
        }}
      >
        E = mc²
      </div>
    </AbsoluteFill>
  );
};

// ---- Scene 6: the explosion -------------------------------------------------------------
const ExplosionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const GROUND = 1150;
  const flash = interpolate(frame, [0, 2, 20], [1, 1, 0], clamp);
  const fireR = interpolate(frame, [0, 45], [10, 260], { ...clamp, easing: Easing.out(Easing.cubic) });
  const shockR = interpolate(frame, [8, 70], [0, 1500], { ...clamp, easing: Easing.out(Easing.quad) });
  const shockO = interpolate(frame, [8, 70], [0.9, 0], clamp);
  const rise = interpolate(frame, [60, 240], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const capY = interpolate(rise, [0, 1], [GROUND - 200, 520]);
  const capW = interpolate(rise, [0, 1], [1, 1.9]);
  const cool = interpolate(frame, [40, 220], [0, 1], clamp); // white-hot → orange → smoky grey
  const shake = frame < 50 ? Math.sin(frame * 3.1) * (50 - frame) * 0.5 : 0;

  const fireColor = (c: number) =>
    c < 0.5
      ? `rgb(255, ${Math.round(230 - 140 * c * 2)}, ${Math.round(150 - 120 * c * 2)})`
      : `rgb(${Math.round(255 - 135 * (c - 0.5) * 2)}, ${Math.round(90 + 20 * (c - 0.5) * 2)}, ${Math.round(30 + 70 * (c - 0.5) * 2)})`;

  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.7}px)` }}>
      {/* Sky glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% ${(capY / 1920) * 100}%, rgba(255,140,60,${0.35 * (1 - cool * 0.6)}) 0%, transparent 70%)`,
        }}
      />
      {/* Ground */}
      <div style={{ position: "absolute", top: GROUND, left: 0, right: 0, bottom: 0, background: "linear-gradient(#1a1410, #050505)" }} />
      {/* Stem of the mushroom cloud */}
      <div
        style={{
          position: "absolute",
          left: CX - interpolate(rise, [0, 1], [60, 90]),
          width: interpolate(rise, [0, 1], [120, 180]),
          top: capY,
          height: Math.max(0, GROUND - capY),
          background: `linear-gradient(${fireColor(Math.min(1, cool + 0.2))}, rgba(90,70,60,0.9))`,
          opacity: rise > 0 ? 1 : 0,
          filter: "blur(6px)",
          borderRadius: "40% 40% 10% 10%",
        }}
      />
      {/* Cap: the fireball rises and spreads into a billowing cloud */}
      {new Array(9).fill(0).map((_, i) => {
        const a = (i / 9) * Math.PI * 2;
        const billow = 1 + 0.06 * Math.sin(frame / 9 + i);
        const ox = Math.cos(a) * fireR * 0.55 * capW;
        const oy = Math.sin(a) * fireR * 0.28;
        const rr = fireR * 0.62 * billow;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: CX + ox - rr,
              top: capY + oy - rr,
              width: rr * 2,
              height: rr * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle at 45% 40%, ${fireColor(Math.max(0, cool - 0.25))} 0%, ${fireColor(cool)} 55%, rgba(60,45,40,0) 72%)`,
              filter: "blur(3px)",
            }}
          />
        );
      })}
      {/* Hot core */}
      <div
        style={{
          position: "absolute",
          left: CX - fireR * 0.8,
          top: capY - fireR * 0.8,
          width: fireR * 1.6,
          height: fireR * 1.6,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,255,240,${1 - cool}) 0%, rgba(255,200,100,${0.8 * (1 - cool)}) 40%, transparent 70%)`,
        }}
      />
      {/* Shockwave ring */}
      <div
        style={{
          position: "absolute",
          left: CX - shockR,
          top: GROUND - 200 - shockR,
          width: shockR * 2,
          height: shockR * 2,
          borderRadius: "50%",
          border: "10px solid rgba(255,255,255,0.8)",
          opacity: shockO,
          filter: "blur(4px)",
        }}
      />
      {/* Flash */}
      <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} />
    </AbsoluteFill>
  );
};

// ---- Scene 7: ending -------------------------------------------------------------------
const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: frame - 5, fps, config: { damping: 200 } });
  const b = spring({ frame: frame - 45, fps, config: { damping: 200 } });
  const c = spring({ frame: frame - 85, fps, config: { damping: 200 } });
  const fade = interpolate(frame, [120, 135], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: fade, padding: "0 140px 300px 100px" }}>
      <div style={{ fontFamily: SANS, fontSize: 56, color: "#9AA6B8", textAlign: "center", opacity: a, lineHeight: 1.3 }}>
        Used in war only twice:
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 84, color: TEXT, textAlign: "center", opacity: a, marginTop: 16, lineHeight: 1.15 }}>
        Hiroshima &amp; Nagasaki, 1945
      </div>
      <div style={{ fontFamily: "'Liberation Serif', serif", fontStyle: "italic", fontSize: 52, color: ENERGY, textAlign: "center", opacity: b, marginTop: 60, lineHeight: 1.3 }}>
        Understanding its power is why the world works to never use it again.
      </div>
      <div style={{ fontFamily: SANS, fontSize: 40, letterSpacing: 4, color: "#9AA6B8", textAlign: "center", opacity: c, marginTop: 80 }}>
        FOLLOW FOR MORE EXPLAINED
      </div>
    </AbsoluteFill>
  );
};

// ---- Timeline ----------------------------------------------------------------------------
const CAPTIONS: { text: string; from: number; to: number }[] = [
  { text: "It all happens in about a *millionth* of a second.", from: 40, to: 105 },
  { text: "It starts with one atom: *Uranium-235.*", from: 112, to: 195 },
  { text: "Its nucleus is huge… and *unstable.*", from: 198, to: 282 },
  { text: "A single *neutron* hits it…", from: 288, to: 372 },
  { text: "…and the nucleus *splits* in two.", from: 376, to: 450 },
  { text: "That releases *energy* and 2–3 new *neutrons.*", from: 452, to: 522 },
  { text: "Each new neutron splits *another* atom.", from: 528, to: 612 },
  { text: "1 → 2 → 4 → 8… a *chain reaction.*", from: 615, to: 702 },
  { text: "In under a microsecond, *trillions of trillions* of atoms split.", from: 705, to: 792 },
  { text: "The pieces weigh a *tiny* bit less than the atom did.", from: 798, to: 882 },
  { text: "That missing mass becomes *pure energy.*", from: 885, to: 972 },
  { text: "All that energy is released *at once:*", from: 990, to: 1062 },
  { text: "a fireball *hotter than the Sun's surface,*", from: 1065, to: 1138 },
  { text: "a crushing *shockwave,* and a *mushroom cloud.*", from: 1140, to: 1212 },
];

export const NuclearExplainer: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #101827 0%, ${BG} 70%)` }}>
      <Sequence durationInFrames={105}>
        <Hook />
      </Sequence>
      <Sequence from={105} durationInFrames={180}>
        <AtomScene />
      </Sequence>
      <Sequence from={285} durationInFrames={240}>
        <FissionScene />
      </Sequence>
      <Sequence from={525} durationInFrames={270}>
        <ChainScene />
      </Sequence>
      <Sequence from={795} durationInFrames={180}>
        <MassScene />
      </Sequence>
      <Sequence from={975} durationInFrames={240}>
        <ExplosionScene />
      </Sequence>
      <Sequence from={1215} durationInFrames={135}>
        <EndingScene />
      </Sequence>

      {CAPTIONS.map((c) => (
        <Sequence key={c.from} from={c.from} durationInFrames={c.to - c.from}>
          <Caption text={c.text} dur={c.to - c.from} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
