import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { geoInterpolate, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import landTopo from "world-atlas/land-110m.json";

// An animated map: dark land, glowing places, and routes that draw themselves.
// Map data: Natural Earth (public domain) via the world-atlas package.

export type Place = { name: string; lon: number; lat: number; label?: "left" | "right" };
export type Route = { from: string; to: string; start: number; color?: string; label?: string };

const W = 1920;
const H = 1080;
const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
const land = feature(topo, topo.objects.land);

export const RouteMap: React.FC<{
  places: Place[];
  routes: Route[];
  title?: string;
  center?: [number, number]; // lon, lat
  scale?: number;
  zoomTo?: number; // camera push-in at the end
}> = ({ places, routes, title, center = [60, 30], scale = 900, zoomTo = 1.08 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const projection = geoNaturalEarth1().center(center).scale(scale).translate([W / 2, H / 2]);
  const path = geoPath(projection);
  const byName = Object.fromEntries(places.map((p) => [p.name, p]));
  const zoom = interpolate(frame, [0, durationInFrames], [1, zoomTo], { easing: Easing.inOut(Easing.sin) });
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#06090F", opacity: fadeIn }}>
      <svg width={W} height={H} style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}>
        <defs>
          <radialGradient id="ocean" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#0E1A2B" />
            <stop offset="100%" stopColor="#05080D" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#ocean)" />
        {/* graticule-like faint lines */}
        {new Array(13).fill(0).map((_, i) => (
          <path key={`g${i}`} d={path({ type: "LineString", coordinates: [[-60 + i * 20, -60], [-60 + i * 20, 80]] }) ?? ""} stroke="rgba(120,150,190,0.08)" fill="none" />
        ))}
        {new Array(8).fill(0).map((_, i) => (
          <path key={`h${i}`} d={path({ type: "LineString", coordinates: [[-60, -40 + i * 15], [200, -40 + i * 15]] }) ?? ""} stroke="rgba(120,150,190,0.08)" fill="none" />
        ))}
        <path d={path(land) ?? ""} fill="#1A2433" stroke="#3B4C66" strokeWidth={1.2} />

        {/* routes */}
        {routes.map((r, i) => {
          const a = byName[r.from];
          const b = byName[r.to];
          const interp = geoInterpolate([a.lon, a.lat], [b.lon, b.lat]);
          const pts = new Array(65).fill(0).map((_, k) => interp(k / 64));
          const d = path({ type: "LineString", coordinates: pts }) ?? "";
          const p = interpolate(frame, [r.start, r.start + 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
          const head = projection(interp(Math.max(0.001, p))) ?? [0, 0];
          const color = r.color ?? "#F2C14E";
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={color} strokeWidth={4} strokeDasharray="1" pathLength={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
              {p > 0 && p < 1 && <circle cx={head[0]} cy={head[1]} r={9} fill="#FFF3C4" style={{ filter: `drop-shadow(0 0 12px ${color})` }} />}
              {r.label && p >= 1 && (() => {
                const mid = projection(interp(0.5)) ?? [0, 0];
                return (
                  <text x={mid[0] + 20} y={mid[1] - 26} textAnchor="start" fill={color} style={{ paintOrder: "stroke", stroke: "#06090F", strokeWidth: 7 }} fontFamily="'Liberation Sans', Arial" fontWeight={700} fontSize={30}
                    opacity={interpolate(frame, [r.start + 45, r.start + 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
                    {r.label}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* places */}
        {places.map((pl, i) => {
          const [x, y] = projection([pl.lon, pl.lat]) ?? [0, 0];
          const pulse = 1 + 0.25 * Math.sin(frame / 8 + i);
          const right = pl.label !== "left";
          return (
            <g key={pl.name}>
              <circle cx={x} cy={y} r={18 * pulse} fill="rgba(242,193,78,0.15)" />
              <circle cx={x} cy={y} r={7} fill="#F2C14E" />
              <text x={x + (right ? 18 : -18)} y={y + 9} textAnchor={right ? "start" : "end"} fill="#E8EDF5" fontFamily="'Liberation Sans', Arial" fontWeight={700} fontSize={30}
                style={{ paintOrder: "stroke", stroke: "#06090F", strokeWidth: 6 }}>
                {pl.name}
              </text>
            </g>
          );
        })}
      </svg>
      {title && (
        <div style={{ position: "absolute", top: 60, left: 80, fontFamily: "'Liberation Sans', Arial", fontWeight: 700, fontSize: 28, letterSpacing: 6, color: "#9FB0C8" }}>
          {title}
        </div>
      )}
    </AbsoluteFill>
  );
};
