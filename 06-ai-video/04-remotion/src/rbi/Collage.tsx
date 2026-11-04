import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import landTopo from "world-atlas/land-110m.json";

// Paper-collage scenes in the style of explainer documentaries:
// aged paper, torn photos taped down, typewriter labels on torn strips,
// red marker circles, red string between pins, rubber stamps, map scraps,
// a dropping location pin — all moving in stop-motion steps ("on twos").

const TYPE = "'Courier 10 Pitch', 'Liberation Mono', monospace";
const BOLD = "'Inter Display', 'Liberation Sans', Arial, sans-serif";
const RED = "#D23A2E";
const PAPER = "#EFE6D2";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
const land = feature(topo, topo.objects.land);

export type CollageItem =
  | { t: "photo"; src: string; x: number; y: number; w: number; h: number; rot?: number; at: number; outline?: boolean; color?: boolean; from?: Dir }
  | { t: "label"; text: string; x: number; y: number; rot?: number; at: number; size?: number; bold?: boolean; circle?: boolean; red?: boolean; from?: Dir }
  | { t: "string"; from: [number, number]; to: [number, number]; at: number }
  | { t: "stamp"; text: string; x: number; y: number; rot?: number; at: number; size?: number }
  | { t: "pin"; x: number; y: number; at: number }
  | { t: "map"; x: number; y: number; w: number; h: number; rot?: number; at: number; center: [number, number]; scale: number; mark?: [number, number][]; from?: Dir }
  | { t: "scrap"; x: number; y: number; w: number; h: number; rot?: number; at: number; color?: string; lines?: boolean; grid?: boolean; from?: Dir }
  | { t: "doc"; src: string; x: number; y: number; w: number; h: number; rot?: number; at: number; offsetY?: number; from?: Dir };
type Dir = "left" | "right" | "top" | "bottom" | "drop";

// Stop-motion: hold each pose for 2 frames, with a tiny jitter per pose
const useStep = () => {
  const frame = useCurrentFrame();
  return Math.floor(frame / 2) * 2;
};
const jitter = (seed: string, step: number, amt = 1.2) => ({
  x: (random(`${seed}jx${step}`) - 0.5) * amt,
  y: (random(`${seed}jy${step}`) - 0.5) * amt,
  r: (random(`${seed}jr${step}`) - 0.5) * amt * 0.25,
});

// A torn-edge clip path (rough on all four sides)
const torn = (seed: string, rough = 1.2) => {
  const pts: string[] = [];
  const n = 18;
  const j = (k: string) => (random(`${seed}${k}`) * rough).toFixed(2);
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${j(`t${i}`)}%`);
  for (let i = 0; i <= n; i++) pts.push(`${100 - +j(`r${i}`)}% ${(i / n) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - +j(`b${i}`)}%`);
  for (let i = n; i >= 0; i--) pts.push(`${j(`l${i}`)}% ${(i / n) * 100}%`);
  return `polygon(${pts.join(",")})`;
};

// Entrance: slides/drops in with a little overshoot, quantised to stop-motion steps
const useEnter = (at: number, from: Dir = "drop", seed = "") => {
  const step = useStep();
  const { fps } = useVideoConfig();
  const p = spring({ frame: step - at, fps, config: { damping: 13, mass: 0.7 } });
  const off = 1 - p;
  const d = { left: [-1300, 0], right: [1300, 0], top: [0, -900], bottom: [0, 900], drop: [0, 0] }[from];
  const scale = from === "drop" ? 1 + off * 0.35 : 1;
  const j = jitter(seed, step);
  return {
    visible: step >= at,
    style: {
      transform: `translate(${d[0] * off + j.x}px, ${d[1] * off + j.y}px) scale(${scale}) rotate(${off * (from === "drop" ? 8 : -12) + j.r}deg)`,
      opacity: from === "drop" ? Math.min(1, p * 3) : 1,
    } as React.CSSProperties,
  };
};

const Tape: React.FC<{ x: number; y: number; rot: number; w?: number }> = ({ x, y, rot, w = 120 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - 18, width: w, height: 36, transform: `rotate(${rot}deg)`, background: "rgba(232,210,140,0.72)", clipPath: "polygon(2% 0,98% 4%,100% 50%,97% 100%,3% 96%,0 50%)", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
);

const Item: React.FC<{ it: CollageItem; i: number }> = ({ it, i }) => {
  const step = useStep();
  const { fps } = useVideoConfig();
  const seed = `c${i}${"text" in it ? it.text : ""}${"src" in it ? it.src : ""}`;
  const enter = useEnter(it.at, "from" in it && typeof it.from === "string" ? (it.from as Dir) : "drop", seed);
  if (!enter.visible) return null;
  const shadow = "drop-shadow(0 10px 14px rgba(60,40,10,0.35))";

  switch (it.t) {
    case "scrap":
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, width: it.w, height: it.h, rotate: `${it.rot ?? 0}deg`, ...enter.style, filter: shadow }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              clipPath: torn(seed, 1.5),
              backgroundColor: it.color ?? "#E4D6B8",
              backgroundImage: it.grid
                ? "linear-gradient(rgba(90,120,160,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(90,120,160,0.25) 1px, transparent 1px)"
                : it.lines
                  ? "repeating-linear-gradient(transparent 0 26px, rgba(60,50,40,0.35) 26px 27px)"
                  : "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.35), transparent 60%)",
              backgroundSize: it.grid ? "28px 28px" : undefined,
            }}
          />
        </div>
      );

    case "photo":
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, width: it.w, height: it.h, rotate: `${it.rot ?? 0}deg`, ...enter.style, filter: shadow }}>
          <div style={{ position: "absolute", inset: it.outline ? -14 : -12, backgroundColor: it.outline ? RED : "#F7F2E6", clipPath: torn(seed + "b", 1.4) }} />
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: torn(seed, 0.8) }}>
            <Img src={staticFile(it.src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: it.color ? "sepia(0.35) contrast(1.05)" : "grayscale(1) contrast(1.35) brightness(1.05)" }} />
            {/* halftone dots */}
            {!it.color && <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(0,0,0,0.35) 1px, transparent 1.6px)", backgroundSize: "5px 5px", mixBlendMode: "multiply" }} />}
          </div>
          <Tape x={it.w * 0.15} y={0} rot={-28} />
          <Tape x={it.w * 0.88} y={it.h} rot={-22} />
        </div>
      );

    case "doc":
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, width: it.w, height: it.h, rotate: `${it.rot ?? 0}deg`, ...enter.style, filter: shadow }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: torn(seed, 1), backgroundColor: "#F4EEDF" }}>
            <Img src={staticFile(it.src)} style={{ width: "100%", marginTop: -(it.offsetY ?? 0), filter: "sepia(0.4) contrast(1.15)", mixBlendMode: "multiply" }} />
          </div>
          <Tape x={it.w * 0.5} y={0} rot={3} w={160} />
        </div>
      );

    case "map": {
      const proj = geoNaturalEarth1().center(it.center).scale(it.scale).translate([it.w / 2, it.h / 2]);
      const path = geoPath(proj);
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, width: it.w, height: it.h, rotate: `${it.rot ?? 0}deg`, ...enter.style, filter: shadow }}>
          <div style={{ position: "absolute", inset: 0, clipPath: torn(seed, 1.2), backgroundColor: "#E9DDBF" }}>
            <svg width={it.w} height={it.h}>
              <path d={path(land) ?? ""} fill="#D4BF8E" stroke="#8C7148" strokeWidth={1.4} />
              {(it.mark ?? []).map(([lon, lat], k) => {
                const [mx, my] = proj([lon, lat]) ?? [0, 0];
                return <circle key={k} cx={mx} cy={my} r={7} fill={RED} stroke="#5A1A12" strokeWidth={2} />;
              })}
            </svg>
          </div>
        </div>
      );
    }

    case "label": {
      const size = it.size ?? (it.bold ? 84 : 44);
      const ring = interpolate(step, [it.at + 14, it.at + 30], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y, rotate: `${it.rot ?? 0}deg`, ...enter.style, filter: shadow }}>
          <div style={{ position: "relative", transform: "translate(-50%, -50%)" }}>
            {it.bold && <div style={{ position: "absolute", inset: -14, backgroundColor: RED, clipPath: torn(seed + "r", 2.5) }} />}
            <div
              style={{
                position: "relative",
                padding: it.bold ? "10px 28px" : "8px 22px",
                backgroundColor: "#F8F4EA",
                clipPath: torn(seed, 2.5),
                fontFamily: it.bold ? BOLD : TYPE,
                fontWeight: it.bold ? 900 : 700,
                fontSize: size,
                letterSpacing: it.bold ? -1 : 1,
                color: it.red ? RED : "#1B1A17",
                whiteSpace: "nowrap",
                lineHeight: 1.05,
              }}
            >
              {it.text}
            </div>
            {it.circle && (
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: "absolute", left: "-10%", top: "-30%", width: "120%", height: "160%", overflow: "visible" }}>
                <path d="M 10 24 C 4 6, 74 -2, 94 14 C 106 26, 78 40, 44 38 C 14 36, 0 26, 16 10" fill="none" stroke={RED} strokeWidth={5} vectorEffect="non-scaling-stroke" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - ring} />
              </svg>
            )}
          </div>
        </div>
      );
    }

    case "string": {
      const p = interpolate(step, [it.at, it.at + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      const [x1, y1] = it.from;
      const [x2, y2] = it.to;
      const sag = Math.hypot(x2 - x1, y2 - y1) * 0.08;
      const d = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag} ${x2} ${y2}`;
      return (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", filter: "drop-shadow(0 4px 3px rgba(0,0,0,0.3))" }}>
          <path d={d} fill="none" stroke={RED} strokeWidth={4} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
          {[it.from, ...(p >= 1 ? [it.to] : [])].map(([x, y], k) => (
            <g key={k}>
              <circle cx={x} cy={y} r={11} fill="#C9302C" stroke="#6E1612" strokeWidth={2} />
              <circle cx={x - 3} cy={y - 3} r={3} fill="#FFB0A8" />
            </g>
          ))}
        </svg>
      );
    }

    case "stamp": {
      const s = interpolate(step, [it.at, it.at + 4], [1.8, 1], { ...clamp, easing: Easing.in(Easing.quad) });
      const o = interpolate(step, [it.at, it.at + 2], [0, 0.85], clamp);
      return (
        <div
          style={{
            position: "absolute",
            left: it.x,
            top: it.y,
            transform: `translate(-50%, -50%) rotate(${it.rot ?? -8}deg) scale(${s})`,
            opacity: o,
            border: `5px solid ${RED}`,
            borderRadius: 8,
            padding: "6px 20px",
            fontFamily: TYPE,
            fontWeight: 700,
            fontSize: it.size ?? 40,
            letterSpacing: 4,
            color: RED,
            whiteSpace: "nowrap",
            mixBlendMode: "multiply",
            maskImage: "radial-gradient(circle at 30% 40%, #000 55%, rgba(0,0,0,0.55) 100%)",
          }}
        >
          {it.text}
        </div>
      );
    }

    case "pin": {
      const p = spring({ frame: step - it.at, fps, config: { damping: 9, mass: 0.6 } });
      const lift = (1 - p) * 260;
      return (
        <div style={{ position: "absolute", left: it.x, top: it.y }}>
          <div style={{ position: "absolute", left: -46 + lift * 0.25, top: 2, width: 92 - lift * 0.1, height: 24, borderRadius: "50%", background: "rgba(60,40,10,0.35)", filter: "blur(4px)", transform: "skewX(-40deg)" }} />
          <svg width={110} height={140} viewBox="0 0 110 140" style={{ position: "absolute", left: -55, top: -140 - lift }}>
            <path d="M 55 136 C 30 96, 8 74, 8 50 A 47 47 0 1 1 102 50 C 102 74, 80 96, 55 136 Z" fill="#E0A83A" stroke="#8A6516" strokeWidth={3} />
            <circle cx={55} cy={50} r={17} fill="#F6EBD0" />
          </svg>
        </div>
      );
    }
  }
};

export const CollageScene: React.FC<{ items: CollageItem[]; push?: number }> = ({ items, push = 1.07 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const step = Math.floor(frame / 2) * 2;
  const zoom = interpolate(step, [0, durationInFrames], [1, push]);
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {/* aged paper desk: warm base, stains, fibres */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 20% 25%, rgba(160,120,60,0.18), transparent 45%)," +
              "radial-gradient(ellipse at 85% 80%, rgba(150,110,50,0.22), transparent 50%)," +
              "radial-gradient(ellipse at 50% 50%, #F2EAD6 0%, #E3D4B3 100%)",
          }}
        />
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35, mixBlendMode: "multiply" }}>
          <filter id="fibre">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={(step / 2) % 3} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#fibre)" />
        </svg>
        {items.map((it, i) => (
          <Item key={i} it={it} i={i} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(70,45,15,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};

// ---- The collage scenes used in the documentary --------------------------------------
export const COLLAGES: Record<string, CollageItem[]> = {
  // Hook: the secret
  secret: [
    { t: "scrap", x: 120, y: 90, w: 700, h: 880, rot: -4, at: 0, lines: true },
    { t: "scrap", x: 1240, y: 520, w: 560, h: 460, rot: 6, at: 2, grid: true },
    { t: "map", x: 1180, y: 80, w: 640, h: 440, rot: 4, at: 6, center: [78, 22], scale: 900, mark: [[72.88, 19.08]], from: "right" },
    { t: "photo", src: "rbi/rbi_building.png", x: 260, y: 200, w: 760, h: 500, rot: -5, at: 10, from: "left" },
    { t: "label", text: "RESERVE BANK OF INDIA", x: 640, y: 800, rot: -2, at: 22, size: 46 },
    { t: "label", text: "GOLD", x: 1470, y: 760, rot: 5, at: 32, bold: true, size: 120, circle: true },
    { t: "stamp", text: "CONFIDENTIAL", x: 900, y: 190, rot: -9, at: 48, size: 44 },
  ],
  // Chapter 1: the storm, linked with red string
  storm: [
    { t: "scrap", x: 80, y: 120, w: 820, h: 820, rot: -3, at: 0 },
    { t: "scrap", x: 1060, y: 60, w: 760, h: 960, rot: 3, at: 2, lines: true },
    { t: "photo", src: "rbi/oil_fire.png", x: 160, y: 210, w: 640, h: 420, rot: -6, at: 6, from: "left" },
    { t: "photo", src: "rbi/chandrashekhar.png", x: 1220, y: 170, w: 420, h: 520, rot: 5, at: 14, from: "right", outline: true },
    { t: "label", text: "GULF WAR · AUG 1990", x: 480, y: 720, rot: -3, at: 22, size: 40 },
    { t: "label", text: "MINORITY GOVT · NOV 1990", x: 1430, y: 800, rot: 2, at: 30, size: 38 },
    { t: "string", from: [700, 300], to: [1300, 260], at: 40 },
    { t: "label", text: "CRISIS", x: 980, y: 560, rot: -6, at: 52, bold: true, size: 130, circle: true },
  ],
  // Chapter 3: the first gold
  firstgold: [
    { t: "scrap", x: 200, y: 100, w: 1500, h: 880, rot: 1, at: 0, color: "#E8DCC0" },
    { t: "photo", src: "rbi/ai_vault.png", x: 300, y: 180, w: 760, h: 520, rot: -4, at: 4, from: "left" },
    { t: "label", text: "20 TONNES", x: 1380, y: 360, rot: 4, at: 16, bold: true, size: 120, circle: true },
    { t: "label", text: "SBI  →  UNION BANK OF SWITZERLAND", x: 1300, y: 600, rot: -2, at: 28, size: 36 },
    { t: "label", text: "MAY 1991", x: 620, y: 820, rot: -3, at: 36, size: 44 },
    { t: "stamp", text: "SOLD · WITH BUYBACK OPTION", x: 1300, y: 790, rot: -8, at: 50, size: 34 },
  ],
  // Chapter 4: the pledge — two banks tied to one number
  pledge: [
    { t: "scrap", x: 60, y: 80, w: 720, h: 900, rot: -3, at: 0, grid: true },
    { t: "scrap", x: 1140, y: 80, w: 720, h: 900, rot: 3, at: 2, grid: true },
    { t: "photo", src: "rbi/boe.png", x: 130, y: 170, w: 580, h: 400, rot: -5, at: 6, from: "left" },
    { t: "photo", src: "rbi/boj.png", x: 1210, y: 170, w: 580, h: 400, rot: 5, at: 12, from: "right" },
    { t: "label", text: "BANK OF ENGLAND", x: 420, y: 650, rot: -3, at: 20, size: 38 },
    { t: "label", text: "BANK OF JAPAN", x: 1500, y: 650, rot: 3, at: 24, size: 38 },
    { t: "label", text: "46.91 TONNES", x: 960, y: 770, rot: -2, at: 32, bold: true, size: 110, circle: true },
    { t: "string", from: [600, 300], to: [820, 700], at: 46 },
    { t: "string", from: [1320, 300], to: [1100, 700], at: 50 },
    { t: "stamp", text: "PLEDGED · JULY 1991", x: 960, y: 560, rot: -6, at: 60, size: 46 },
  ],
  // Chapter 5: the speech
  speech: [
    { t: "doc", src: "rbi/doc_official_quote-31.png", x: 140, y: 60, w: 820, h: 960, rot: -3, at: 0, offsetY: 280, from: "bottom" },
    { t: "photo", src: "rbi/manmohan.png", x: 1100, y: 140, w: 560, h: 620, rot: 4, at: 10, from: "right", outline: true },
    { t: "label", text: "24 JULY 1991", x: 1380, y: 840, rot: 3, at: 22, size: 48 },
    { t: "label", text: "AN IDEA", x: 560, y: 520, rot: -5, at: 34, bold: true, size: 120, circle: true, red: true },
    { t: "stamp", text: "LOK SABHA", x: 760, y: 170, rot: 8, at: 48, size: 38 },
  ],
  // Chapter 6: the gold comes home
  home: [
    { t: "map", x: 140, y: 100, w: 1640, h: 880, rot: -1, at: 0, center: [40, 35], scale: 950, mark: [[-0.13, 51.51]], from: "bottom" },
    { t: "pin", x: 1451, y: 808, at: 14 },
    { t: "label", text: "MUMBAI", x: 1600, y: 880, rot: 3, at: 26, size: 46 },
    { t: "label", text: "LONDON", x: 430, y: 200, rot: -3, at: 30, size: 40 },
    { t: "string", from: [415, 267], to: [1451, 790], at: 38 },
    { t: "label", text: "100 TONNES", x: 700, y: 620, rot: -4, at: 52, bold: true, size: 110, circle: true },
    { t: "stamp", text: "RETURNED · 2024", x: 1560, y: 200, rot: 7, at: 66, size: 44 },
  ],
};
