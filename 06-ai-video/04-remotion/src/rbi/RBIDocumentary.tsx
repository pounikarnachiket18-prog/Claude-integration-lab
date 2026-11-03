import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import timeline from "./timeline.json";
import { Photo, Clip, Narration, ReservesChart, GoldCounter, DocumentPage, Credits, FilmLook, SmallCaption } from "./Shots";
import { KineticChapter, KineticTitle, MotionBeat, Whip, WhipFilters } from "./Motion";
import { RouteMap, Place, Route } from "./RouteMap";
import { TVBulletin } from "../news/TVBulletin";
import { Newspaper } from "../news/Newspaper";
import { BULLETINS, PAPERS } from "../news/NewsGraphics";

// "1991: The Year India Pawned Its Gold" — a faceless documentary with no voice.
// The story is told in on-screen text. The shot list lives in timeline.json,
// which the audio script (render_rbi_documentary.sh) also reads for sound cues.

type Shot = {
  kind: string;
  sec: number;
  src?: string;
  text?: string;
  caption?: string;
  move?: string;
  fit?: string;
  bw?: boolean;
  vertical?: boolean;
  number?: string;
  title?: string;
  date?: string;
  tonnes?: number;
  label?: string;
  focusY?: number;
  id?: number;
  map?: string;
  sfx?: string;
  icon?: string;
  sub?: string;
  theme?: string;
  burst?: string;
};

// Graphics shots whip in and out sideways; photos and clips cross-dissolve.
const WHIP = new Set(["tv", "paper", "map", "chart", "gold", "beat", "chapter"]);

const FPS = timeline.fps;
const OVERLAP = timeline.overlap;
const SHOTS = timeline.shots as Shot[];

export const RBI_STARTS: number[] = [];
let cursor = 0;
for (const s of SHOTS) {
  RBI_STARTS.push(cursor);
  cursor += Math.round(s.sec * FPS) - OVERLAP;
}
export const RBI_DURATION = cursor + OVERLAP;

const MUMBAI: Place = { name: "Bombay", lon: 72.88, lat: 19.08 };
const MAPS: Record<string, { places: Place[]; routes: Route[]; title: string; center: [number, number]; scale: number }> = {
  gulf: {
    title: "AUGUST 1990  ·  THE GULF WAR",
    center: [62, 24],
    scale: 1500,
    places: [{ name: "Kuwait", lon: 47.98, lat: 29.37, label: "left" }, MUMBAI],
    routes: [{ from: "Kuwait", to: "Bombay", start: 25, color: "#FF5A4E", label: "Remittances fall" }],
  },
  airlift: {
    title: "JULY 1991  ·  THE GOLD AIRLIFT",
    center: [35, 38],
    scale: 700,
    places: [MUMBAI, { name: "London", lon: -0.13, lat: 51.51, label: "left" }],
    routes: [{ from: "Bombay", to: "London", start: 25, label: "46.91 tonnes" }],
  },
  return: {
    title: "2024  ·  GOLD COMES HOME",
    center: [35, 38],
    scale: 700,
    places: [MUMBAI, { name: "London", lon: -0.13, lat: 51.51, label: "left" }],
    routes: [{ from: "London", to: "Bombay", start: 25, label: "≈ 100 tonnes" }],
  },
};

const CREDITS = [
  "1991: The Year India Pawned Its Gold",
  "MINDSET MODE INDIA",
  " ",
  "Sources: Budget speech, 24 July 1991 (indiabudget.gov.in) · Lok Sabha Secretariat",
  "Reserve Bank of India publications · contemporary news reports",
  " ",
  "TV and newspaper graphics are recreations, with made-up channel and paper names",
  "AI-generated images and clips are illustrations, not archive footage",
  "“Representative image” marks photos not taken at the event",
  " ",
  "Music: atlasaudio and leberch (Pixabay)",
  "Map data: Natural Earth",
];

// Fades each shot in and out so neighbouring shots cross-dissolve.
const Fade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [0, OVERLAP, durationInFrames - OVERLAP, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Wrap: React.FC<{ whip: boolean; children: React.ReactNode }> = ({ whip, children }) =>
  whip ? <Whip>{children}</Whip> : <Fade>{children}</Fade>;

const Visual: React.FC<{ s: Shot }> = ({ s }) => {
  switch (s.kind) {
    case "photo":
      return <Photo src={s.src!} move={(s.move ?? "in") as "in"} fit={(s.fit ?? "cover") as "cover"} bw={s.bw} caption={s.caption} dim={0.3} />;
    case "clip":
      return <Clip src={s.src!} vertical={s.vertical} caption={s.caption} dim={0.25} />;
    case "title":
      return <KineticTitle />;
    case "chapter":
      return <KineticChapter number={s.number!} title={s.title!} date={s.date!} />;
    case "beat":
      return <MotionBeat icon={s.icon as "gold"} text={s.text!} sub={s.sub} theme={s.theme as "light"} burst={s.burst} seed={s.text} />;
    case "chart":
      return <ReservesChart />;
    case "gold":
      return <GoldCounter tonnes={s.tonnes!} label={s.label!} />;
    case "doc":
      return (
        <>
          <DocumentPage src={s.src!} focusY={s.focusY} />
          {s.caption && <SmallCaption text={s.caption} />}
        </>
      );
    case "tv":
      return <TVBulletin {...BULLETINS[s.id!].props} />;
    case "paper":
      return <Newspaper {...PAPERS[s.id!].props} />;
    case "map": {
      const m = MAPS[s.map!];
      return <RouteMap places={m.places} routes={m.routes} title={m.title} center={m.center} scale={m.scale} />;
    }
    case "quote":
      return (
        <AbsoluteFill style={{ backgroundColor: "#050506" }}>
          {s.caption && (
            <div style={{ position: "absolute", bottom: 300, width: "100%", textAlign: "center", fontFamily: "'Liberation Sans', Arial", fontSize: 28, letterSpacing: 4, color: "#8D97A8" }}>
              — {s.caption}
            </div>
          )}
        </AbsoluteFill>
      );
    case "credits":
      return <Credits lines={CREDITS} />;
    default:
      return null;
  }
};

export const RBIDocumentary: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {SHOTS.map((s, i) => (
        <Sequence key={i} from={RBI_STARTS[i]} durationInFrames={Math.round(s.sec * FPS)}>
          <Wrap whip={WHIP.has(s.kind)}>
            <Visual s={s} />
            {s.text && s.kind !== "quote" && s.kind !== "beat" && (
              <AbsoluteFill style={{ background: `linear-gradient(to top, rgba(0,0,0,${s.kind === "doc" ? 0.92 : 0.6}) 0%, rgba(0,0,0,${s.kind === "doc" ? 0.8 : 0.25}) 30%, transparent 50%)` }} />
            )}
            {s.text && s.kind !== "beat" && <Narration text={s.text} position={s.kind === "quote" ? "center" : "bottom"} size={s.kind === "quote" ? 72 : 50} delay={8} />}
          </Wrap>
        </Sequence>
      ))}
      <FilmLook />
      <WhipFilters />
    </AbsoluteFill>
  );
};
