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
import { MindsetIcon } from "./MindsetModeLogo";

// MINDSET MODE INDIA: 20-second motivational Reel where every scene FLOWS into the next.
// 1080x1920, 30 fps, 600 frames. Each scene is 3.5s (= 7 beats at 120 BPM).
//
//   S1 0.0-3.5s   Alarm clock rings at 5:00      "Everyone wants success."
//      T1 ─ SHAPE MATCH CUT: the round clock zooms into the round sun
//   S2 3.5-7.0s   Sun rises over the mountains    "Few want to wake up for it."
//      T2 ─ TEXT MASK REVEAL: the next scene appears through the letters of DISCIPLINE
//   S3 7.0-10.5s  A ball climbs a staircase       "One step. Every day."
//      T3 ─ WHIP PAN: fast sideways swipe with motion blur
//   S4 10.5-14s   Growth curve: 1.01^365 = 37.8×  "1% better every day…"
//      T4 ─ ZOOM-THROUGH: the camera dives into the top of the curve
//   S5 14-17.5s   Light and rays                  "Your future self is watching."
//      T5 ─ LIGHT FLASH
//   S6 17.5-20s   Logo end card                   "Follow for daily motivation"

// ---- Style kit (same as the channel logo) ----------------------------------------
const SAFFRON = "#FF9F43";
const SAFFRON_LIGHT = "#FFDDB0";
const NAVY = "#0A0F1E";
const TEXT = "#F5F2EC";
const SANS = "'Liberation Sans', sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const MOTIVATION_DURATION = 600;
const SCENE = 105; // 3.5 seconds
const PRE = 15; // each scene starts rendering 15 frames early, so transitions can overlap
const starts = [0, 105, 210, 315, 420, 525];

// ---- Shared: words rising in one by one ---------------------------------------
const Words: React.FC<{ text: string; f: number; top: number; size?: number; accent?: string[] }> = ({
  text,
  f,
  top,
  size = 74,
  accent = [],
}) => {
  const { fps } = useVideoConfig();
  return (
    <div
      style={
        {
          position: "absolute",
          top,
          left: 90,
          right: 150, // keep clear of Instagram's buttons on the right
          textAlign: "center",
          textWrap: "balance",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.15,
        } as React.CSSProperties
      }
    >
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: f - 8 - i * 4, fps, config: { damping: 15, stiffness: 170 } });
        const isAccent = accent.includes(w.replace(/[.,]/g, ""));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 0.13em",
              color: isAccent ? SAFFRON : TEXT,
              textShadow: "0 6px 24px rgba(0,0,0,0.7)",
              opacity: Math.min(1, p * 1.4),
              transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [1.25, 1])})`,
              filter: `blur(${interpolate(p, [0, 1], [8, 0], clamp)}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---- S1: alarm clock ringing at 5:00 ----------------------------------------------
const CLOCK_X = 540;
const CLOCK_Y = 800;
const ClockScene: React.FC = () => {
  const f = useCurrentFrame() - PRE;
  const ringing = f >= 30;
  const shake = ringing ? Math.sin(f * 2.4) * 4 : 0;
  const minute = interpolate(f, [-PRE, 30], [348, 360], clamp); // ticks to exactly 5:00
  const glow = ringing ? 0.5 + 0.5 * Math.abs(Math.sin(f / 3)) : 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, #18213A 0%, ${NAVY} 70%)` }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g transform={`rotate(${shake} ${CLOCK_X} ${CLOCK_Y})`}>
          {/* bells */}
          {[-1, 1].map((s) => (
            <circle key={s} cx={CLOCK_X + s * 190} cy={CLOCK_Y - 230} r={62} fill={SAFFRON} />
          ))}
          {/* face */}
          <circle
            cx={CLOCK_X}
            cy={CLOCK_Y}
            r={260}
            fill="#0D1325"
            stroke={SAFFRON}
            strokeWidth={16}
            style={{ filter: `drop-shadow(0 0 ${40 * glow}px ${SAFFRON})` }}
          />
          {new Array(12).fill(0).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={CLOCK_X + Math.sin(a) * 215}
                y1={CLOCK_Y - Math.cos(a) * 215}
                x2={CLOCK_X + Math.sin(a) * 238}
                y2={CLOCK_Y - Math.cos(a) * 238}
                stroke={SAFFRON_LIGHT}
                strokeWidth={i % 3 === 0 ? 10 : 5}
                strokeLinecap="round"
              />
            );
          })}
          {/* hour hand at 5, minute hand ticking to 12 */}
          <line x1={CLOCK_X} y1={CLOCK_Y} x2={CLOCK_X + Math.sin((150 * Math.PI) / 180) * 120} y2={CLOCK_Y - Math.cos((150 * Math.PI) / 180) * 120} stroke={TEXT} strokeWidth={16} strokeLinecap="round" />
          <line x1={CLOCK_X} y1={CLOCK_Y} x2={CLOCK_X + Math.sin((minute * Math.PI) / 180) * 190} y2={CLOCK_Y - Math.cos((minute * Math.PI) / 180) * 190} stroke={TEXT} strokeWidth={10} strokeLinecap="round" />
          <circle cx={CLOCK_X} cy={CLOCK_Y} r={16} fill={SAFFRON} />
        </g>
      </svg>
      <div style={{ position: "absolute", top: 340, width: "100%", textAlign: "center", fontFamily: SANS, fontSize: 52, letterSpacing: 8, color: ringing ? SAFFRON : "#7C86A0" }}>
        5:00 AM
      </div>
      <Words text="Everyone wants success." f={f} top={1250} accent={["success"]} />
    </AbsoluteFill>
  );
};

// ---- S2: the sun rises over the mountains -------------------------------------------
const SunScene: React.FC = () => {
  const f = useCurrentFrame() - PRE;
  const rise = interpolate(f, [0, 90], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const sunY = interpolate(rise, [0, 1], [CLOCK_Y, 640]);
  const sky = interpolate(rise, [0, 1], [0.35, 1]);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #0B1230 0%, #3A2340 ${40 + 10 * (1 - sky)}%, rgba(255,159,67,${0.85 * sky}) 75%)`,
        backgroundColor: NAVY,
      }}
    >
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {/* sun: same position and roundness as the clock face, so the cut "matches" */}
        <circle cx={540} cy={sunY} r={240} fill={SAFFRON_LIGHT} style={{ filter: `drop-shadow(0 0 90px ${SAFFRON})` }} />
        {/* mountains in front */}
        <polygon points="0,1180 230,920 400,1080 640,800 860,1040 1080,880 1080,1920 0,1920" fill="#120B16" />
        <polygon points="0,1320 300,1110 560,1280 820,1060 1080,1240 1080,1920 0,1920" fill="#07050A" />
      </svg>
      <Words text="Few want to wake up for it." f={f} top={1380} accent={["wake", "up"]} />
    </AbsoluteFill>
  );
};

// ---- S3: a ball climbing a staircase, one hop per beat --------------------------------
const StepsScene: React.FC = () => {
  const f = useCurrentFrame() - PRE;
  const HOP = 15; // one hop every beat (0.5s)
  const stepX = (i: number) => 140 + i * 170;
  const stepY = (i: number) => 1500 - i * 150;
  const k = Math.max(0, Math.floor(f / HOP));
  const t = f < 0 ? 0 : (f % HOP) / HOP;
  const e = Easing.inOut(Easing.quad)(t);
  const ballX = stepX(k) + (stepX(k + 1) - stepX(k)) * e;
  const ballY = stepY(k) + (stepY(k + 1) - stepY(k)) * e - Math.sin(Math.PI * t) * 130 - 34;
  const squash = t < 0.12 ? 1 - 0.25 * (1 - t / 0.12) : 1;
  // Camera follows the ball (gently), keeping it near the middle of the screen
  const camX = interpolate(f, [-PRE, 120], [0, -420], clamp);
  const camY = interpolate(f, [-PRE, 120], [0, 560], clamp);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #10172E 0%, ${NAVY} 60%, #1C1208 100%)` }}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${camX}px, ${camY}px)` }}>
        {new Array(12).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: stepX(i) - 85,
              top: stepY(i),
              width: 170,
              height: 2400,
              background: `linear-gradient(180deg, #1F2A4A 0%, #0E1428 40%)`,
              borderTop: `6px solid ${i <= k ? SAFFRON : "#3A4668"}`,
              boxShadow: i <= k ? `0 -6px 24px rgba(255,159,67,0.5)` : "none",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: ballX - 34,
            top: ballY - 34 + 34 * (1 - squash),
            width: 68,
            height: 68 * squash,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, white, ${SAFFRON} 60%)`,
            boxShadow: `0 0 30px ${SAFFRON}`,
          }}
        />
      </div>
      <Words text="One step. Every day." f={f} top={360} accent={["Every", "day"]} />
    </AbsoluteFill>
  );
};

// ---- S4: the growth curve 1.01^365 --------------------------------------------------------
const GRAPH = { x0: 140, x1: 940, y0: 1180, y1: 520 };
export const PEAK = { x: GRAPH.x1, y: GRAPH.y1 };
const GraphScene: React.FC = () => {
  const f = useCurrentFrame() - PRE;
  const p = interpolate(f, [5, 80], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const days = Math.round(365 * p);
  const value = Math.pow(1.01, days);
  const pts: string[] = [];
  for (let d = 0; d <= days; d += 5) {
    const x = GRAPH.x0 + (d / 365) * (GRAPH.x1 - GRAPH.x0);
    const y = GRAPH.y0 - ((Math.pow(1.01, d) - 1) / (Math.pow(1.01, 365) - 1)) * (GRAPH.y0 - GRAPH.y1);
    pts.push(`${x},${y}`);
  }
  const tipX = GRAPH.x0 + p * (GRAPH.x1 - GRAPH.x0);
  const tipY = GRAPH.y0 - ((value - 1) / (Math.pow(1.01, 365) - 1)) * (GRAPH.y0 - GRAPH.y1);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 80% 30%, #2A1A10 0%, ${NAVY} 65%)` }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {/* grid */}
        {new Array(7).fill(0).map((_, i) => (
          <line key={i} x1={GRAPH.x0} x2={GRAPH.x1} y1={GRAPH.y0 - i * 110} y2={GRAPH.y0 - i * 110} stroke="#1E2742" strokeWidth={2} />
        ))}
        {/* "staying the same" line */}
        <line x1={GRAPH.x0} y1={GRAPH.y0} x2={GRAPH.x0 + p * (GRAPH.x1 - GRAPH.x0)} y2={GRAPH.y0} stroke="#5A6480" strokeWidth={5} strokeDasharray="14 12" />
        <polyline points={pts.join(" ")} fill="none" stroke={SAFFRON} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 16px ${SAFFRON})` }} />
        <circle cx={tipX} cy={tipY} r={18} fill={SAFFRON_LIGHT} style={{ filter: `drop-shadow(0 0 20px ${SAFFRON})` }} />
      </svg>
      <div style={{ position: "absolute", top: 1200, left: GRAPH.x0, fontFamily: SANS, fontSize: 30, color: "#7C86A0" }}>day 0</div>
      <div style={{ position: "absolute", top: 1200, left: GRAPH.x1 - 110, fontFamily: SANS, fontSize: 30, color: "#7C86A0" }}>day 365</div>
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 150, color: SAFFRON, textShadow: `0 0 40px rgba(255,159,67,0.5)` }}>
        {value.toFixed(1)}×
      </div>
      <Words text="1% better every day = 37× better in a year." f={f} top={1330} size={64} accent={["1%", "37×"]} />
    </AbsoluteFill>
  );
};

// ---- S5: light ----------------------------------------------------------------------
const LightScene: React.FC = () => {
  const f = useCurrentFrame() - PRE;
  const turn = interpolate(f, [-PRE, 120], [0, 12]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #FFE3B8 0%, ${SAFFRON} 18%, #6B3410 48%, #120804 80%)` }}>
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${turn}deg at 50% 45%, rgba(255,240,210,0.16) 0deg 5deg, transparent 5deg 15deg)`,
        }}
      />
      {new Array(30).fill(0).map((_, i) => {
        const y = 1920 - ((f * (2 + random(`s${i}`) * 3) + random(`y${i}`) * 1920) % 1920);
        return (
          <div key={i} style={{ position: "absolute", left: random(`x${i}`) * 1080, top: y, width: 5, height: 5, borderRadius: "50%", backgroundColor: "white", opacity: 0.6 }} />
        );
      })}
      <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.25)" }} />
      <Words text="Your future self is watching." f={f} top={760} size={104} accent={["future", "self"]} />
    </AbsoluteFill>
  );
};

// ---- S6: end card -------------------------------------------------------------------
const EndScene: React.FC = () => {
  const f = useCurrentFrame() - PRE;
  const { fps } = useVideoConfig();
  const name = spring({ frame: f - 30, fps, config: { damping: 200 } });
  const cta = spring({ frame: f - 44, fps, config: { damping: 11, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #1A1410 0%, #07080C 70%)` }}>
      <div style={{ position: "absolute", left: 540 - 200, top: 470 }}>
        <MindsetIcon />
      </div>
      <div style={{ position: "absolute", top: 930, width: "100%", textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 70, letterSpacing: 10, color: SAFFRON, opacity: name, transform: `translateY(${interpolate(name, [0, 1], [24, 0])}px)` }}>
        MINDSET MODE
        <br />
        INDIA
      </div>
      <div style={{ position: "absolute", top: 1170, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, cta * 2), transform: `scale(${cta})` }}>
        <div style={{ padding: "22px 54px", borderRadius: 60, border: `4px solid ${SAFFRON}`, fontFamily: SANS, fontWeight: 700, fontSize: 44, color: TEXT, letterSpacing: 2 }}>
          Follow for daily motivation
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- T2 helper: an SVG "stencil" with the word DISCIPLINE cut out of it ------------------
const disciplineSvg = (scale: number, mode: "text" | "hole") => {
  const text = `<text x="540" y="1010" text-anchor="middle" font-family="Liberation Sans" font-weight="700" font-size="190" textLength="900" lengthAdjust="spacingAndGlyphs" transform="translate(540 960) scale(${scale}) translate(-540 -960)"`;
  if (mode === "text") return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><defs><mask id="m"><rect width="1080" height="1920" fill="white"/>${text} fill="black">DISCIPLINE</text></mask></defs><rect width="1080" height="1920" fill="white" mask="url(#m)"/></svg>`;
};

// ---- The timeline with all transitions --------------------------------------------------
export const MotivationTransitions: React.FC = () => {
  const frame = useCurrentFrame();

  // T1: shape match cut (clock → sun) with a zoom-through, around frame 105
  const t1Out = interpolate(frame, [93, 105], [1, 3.2], { ...clamp, easing: Easing.in(Easing.cubic) });
  const t1OutOpacity = interpolate(frame, [101, 106], [1, 0], clamp);
  const t1In = interpolate(frame, [105, 120], [1.7, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  // T2: DISCIPLINE appears (184-196), then becomes a window into S3 and flies at the camera (196-222)
  const t2TextIn = spring({ frame: frame - 184, fps: 30, config: { damping: 14, stiffness: 160 } });
  const t2Scale = interpolate(frame, [196, 222], [1, 28], { ...clamp, easing: Easing.in(Easing.cubic) });
  const t2Fade = interpolate(frame, [212, 222], [1, 0], clamp);
  const maskOn = frame >= 196;
  const maskUrl = maskOn ? `url("data:image/svg+xml;utf8,${encodeURIComponent(disciplineSvg(t2Scale, "hole") as string)}")` : undefined;

  // T3: whip pan (S3 → S4), around frame 315
  const whip = interpolate(frame, [300, 330], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const whipBlur = 28 * Math.sin(Math.PI * whip);

  // T4: zoom-through into the top of the growth curve, around frame 420
  const t4Zoom = interpolate(frame, [404, 420], [1, 14], { ...clamp, easing: Easing.in(Easing.cubic) });
  const t4Fade = interpolate(frame, [414, 421], [1, 0], clamp);
  const t4In = interpolate(frame, [414, 432], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });

  // T5: light flash, around frame 525
  const flash = interpolate(frame, [515, 525, 540], [0, 1, 0], clamp);

  const seq = (i: number) => ({ from: Math.max(0, starts[i] - PRE), durationInFrames: SCENE + 2 * PRE });

  return (
    <AbsoluteFill style={{ backgroundColor: "#07080C" }}>
      {/* S6 under S5 */}
      <Sequence {...seq(5)}>
        <EndScene />
      </Sequence>
      <Sequence {...seq(4)}>
        <AbsoluteFill style={{ opacity: frame < 420 ? t4In : frame > 520 ? interpolate(frame, [520, 527], [1, 0], clamp) : 1, transform: `scale(${interpolate(t4In, [0, 1], [1.5, 1])})` }}>
          <LightScene />
        </AbsoluteFill>
      </Sequence>
      {/* S4 on top of S5 until it zooms away */}
      <Sequence {...seq(3)}>
        <AbsoluteFill
          style={{
            opacity: t4Fade,
            transform: `translateX(${(1 - whip) * 1080}px) scale(${t4Zoom})`,
            transformOrigin: `${PEAK.x}px ${PEAK.y}px`,
            filter: `blur(${frame < 340 ? whipBlur : interpolate(frame, [404, 420], [0, 10], clamp)}px)`,
          }}
        >
          <GraphScene />
        </AbsoluteFill>
      </Sequence>
      <Sequence {...seq(2)}>
        <AbsoluteFill style={{ transform: `translateX(${-whip * 1080}px)`, filter: `blur(${whipBlur}px)` }}>
          <StepsScene />
        </AbsoluteFill>
      </Sequence>
      {/* S2 on top of S3, with DISCIPLINE cut out of it */}
      <Sequence {...seq(1)}>
        <AbsoluteFill
          style={{
            transform: `scale(${t1In})`,
            transformOrigin: `${CLOCK_X}px ${CLOCK_Y}px`,
            opacity: maskOn ? t2Fade : 1,
            WebkitMaskImage: maskUrl,
            maskImage: maskUrl,
          }}
        >
          <SunScene />
        </AbsoluteFill>
        {/* the word DISCIPLINE appears in solid saffron first */}
        {frame >= 180 && frame < 196 && (
          <AbsoluteFill style={{ opacity: Math.min(1, t2TextIn * 1.5) }}>
            <svg width={1080} height={1920}>
              <text
                x={540}
                y={1010}
                textAnchor="middle"
                fontFamily="Liberation Sans"
                fontWeight={700}
                fontSize={190}
                textLength={900}
                lengthAdjust="spacingAndGlyphs"
                fill={SAFFRON}
                transform={`translate(540 960) scale(${interpolate(t2TextIn, [0, 1], [0.7, 1])}) translate(-540 -960)`}
                style={{ filter: `drop-shadow(0 0 30px ${SAFFRON})` }}
              >
                DISCIPLINE
              </text>
            </svg>
          </AbsoluteFill>
        )}
      </Sequence>
      {/* S1 on top, zooming into the clock face */}
      <Sequence durationInFrames={SCENE + 2}>
        <AbsoluteFill style={{ transform: `scale(${t1Out})`, transformOrigin: `${CLOCK_X}px ${CLOCK_Y}px`, opacity: t1OutOpacity }}>
          <ClockScene />
        </AbsoluteFill>
      </Sequence>
      {/* T5 flash */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, white 0%, ${SAFFRON_LIGHT} 40%, ${SAFFRON} 100%)`, opacity: flash, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
