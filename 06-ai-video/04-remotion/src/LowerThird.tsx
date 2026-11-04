import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// A "lower third": the name banner that slides in near the bottom of the
// screen in documentaries, news and interviews.

// ---- Settings you can change ---------------------------------------------------
export const LOWER_THIRD_IN_AT = 10; // frame when the animation starts
export const LOWER_THIRD_OUT_AT = 92; // frame when it starts leaving

const GOLD = "#E8B865";
const FONT = "'Liberation Sans', sans-serif";

// Shorthand: interpolate with clamping on both ends (the value stops at the ends)
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---- Just the banner (can be placed over any video) ---------------------------------
export const LowerThirdGraphic: React.FC<{ name: string; role: string }> = ({
  name,
  role,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const IN_AT = LOWER_THIRD_IN_AT;
  const OUT_AT = LOWER_THIRD_OUT_AT;

  // A spring with high damping = smooth, no bounce. Good for calm, serious pieces.
  const smooth = (startFrame: number) =>
    spring({ frame: frame - startFrame, fps, config: { damping: 200 } });

  // ---- IN: four parts arrive one after another (stagger) ----
  const bar = smooth(IN_AT); // 1. gold bar grows upward
  const panel = interpolate(frame, [IN_AT + 6, IN_AT + 22], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  }); // 2. dark panel wipes open to the right
  const nameIn = smooth(IN_AT + 12); // 3. name slides in
  const roleIn = smooth(IN_AT + 18); // 4. role slides in

  // ---- OUT: everything wipes away to the left, speeding up (ease-in) ----
  const out = interpolate(frame, [OUT_AT, OUT_AT + 14], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        bottom: 138 + 70,
        display: "flex",
        alignItems: "stretch",
        transform: `translateX(${-30 * out}px)`,
        // "inset" hides part of the element: here, the right side grows as it leaves
        clipPath: `inset(0 ${out * 100}% 0 0)`,
      }}
    >
      {/* 1. Gold accent bar */}
      <div
        style={{
          width: 6,
          backgroundColor: GOLD,
          boxShadow: `0 0 12px ${GOLD}`,
          transform: `scaleY(${bar})`,
          transformOrigin: "bottom",
        }}
      />

      {/* 2. Dark panel, revealed from left to right */}
      <div
        style={{
          padding: "22px 44px 24px 30px",
          backgroundColor: "rgba(6, 12, 18, 0.78)",
          clipPath: `inset(0 ${100 - panel * 100}% 0 0)`,
        }}
      >
        {/* 3. Name: slides in from the left inside a "mask" (overflow hidden) */}
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 54,
              letterSpacing: 5,
              color: "white",
              transform: `translateX(${interpolate(nameIn, [0, 1], [-60, 0])}px)`,
              opacity: nameIn,
            }}
          >
            {name}
          </div>
        </div>

        {/* 4. Role: same move, a few frames later */}
        <div style={{ overflow: "hidden", marginTop: 6 }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 30,
              letterSpacing: 2,
              color: GOLD,
              transform: `translateX(${interpolate(roleIn, [0, 1], [-60, 0])}px)`,
              opacity: roleIn,
            }}
          >
            {role}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Lesson 17 composition: the banner over Shot 5 ------------------------------------
export const LowerThird: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <OffthreadVideo src={staticFile("shot05_window.mp4")} />
      <LowerThirdGraphic
        name="ELEANOR MARSH"
        role="Lighthouse keeper  ·  40 years"
      />
    </AbsoluteFill>
  );
};
