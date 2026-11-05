import { useRef, useState } from "react";
import { worlds, getWorld, atlasPoint, openDoorMapPoint, type WorldId } from "../data/worlds";
import { useStore } from "../state/store";
import { audio } from "../audio/AudioEngine";

export default function Atlas() {
  const current = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
  const travelTo = useStore((s) => s.travelTo);
  const [selected, select] = useState<WorldId>(current);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const destination = getWorld(selected);
  const dest2 = atlasPoint(destination.position);
  const cur = atlasPoint(getWorld(current).position);

  return (
    <div className="atlas-layout" data-testid="atlas-panel">
      <div className="map-wrap">
        <svg
          ref={svg}
          viewBox="0 0 500 580"
          aria-label="World atlas — drag to pan, scroll to zoom"
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY, px: pan[0], py: pan[1] };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const scale = 500 / (svg.current?.getBoundingClientRect().width || 500);
            setPan([
              drag.current.px + (e.clientX - drag.current.x) * scale,
              drag.current.py + (e.clientY - drag.current.y) * scale,
            ]);
          }}
          onPointerUp={() => (drag.current = null)}
          onWheel={(e) => setZoom((z) => Math.max(0.75, Math.min(2.4, z - e.deltaY * 0.001)))}
        >
          <defs>
            <radialGradient id="parch" cx="50%" cy="42%" r="75%">
              <stop offset="0%" stopColor="#efe3c2" />
              <stop offset="78%" stopColor="#e3d2a8" />
              <stop offset="100%" stopColor="#d4bf8e" />
            </radialGradient>
            <pattern id="forest" width="26" height="26" patternUnits="userSpaceOnUse">
              <path d="M6 18 l4 -9 4 9 m-4 -3 v6 M16 20 l3 -7 3 7 m-3 -2 v5" stroke="#7a8a5e" strokeWidth="1.4" fill="none" opacity="0.75" />
            </pattern>
            <pattern id="water" width="20" height="14" patternUnits="userSpaceOnUse">
              <path d="M0 7 q5 -4 10 0 t10 0" stroke="#5e7a78" strokeWidth="1.2" fill="none" opacity="0.7" />
            </pattern>
          </defs>
          <rect width="500" height="580" fill="url(#parch)" />
          <g transform={`translate(${pan[0] + 250} ${pan[1] + 290}) scale(${zoom}) translate(-250 -290)`}>
            {/* terrain art */}
            <path d="M20 340 Q60 300 55 250 Q75 210 60 160 L120 175 Q150 230 135 300 Q160 340 150 420 L60 430 Q35 380 20 340 Z" fill="url(#forest)" opacity="0.5" />
            <path d="M330 460 Q380 430 420 450 L430 540 Q370 560 320 540 Z" fill="url(#forest)" opacity="0.45" />
            {/* the wandering river */}
            <path d="M60 -30 C110 60 60 120 110 190 S170 320 120 400 S150 520 130 600" stroke="#8fb0a8" strokeWidth="13" fill="none" opacity="0.8" />
            <path d="M60 -30 C110 60 60 120 110 190 S170 320 120 400 S150 520 130 600" stroke="url(#water)" strokeWidth="9" fill="none" opacity="0.5" />
            {/* northern heights */}
            <g opacity="0.8">
              {Array.from({ length: 9 }, (_, i) => (
                <path key={i} d={`M${300 + i * 18} 14 l11 -22 11 22 m-15 -9 l4 -6 4 6`} stroke="#8e7f5e" fill="none" strokeWidth="2" />
              ))}
              <text x="352" y="52" textAnchor="middle" className="map-region">THE NORTHERN HEIGHTS</text>
            </g>
            {/* castle glyph */}
            <g transform={`translate(400 68)`} opacity="0.9">
              <path d="M-16 12 v-16 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v16 z M-6 12 v-8 h4 v8" fill="none" stroke="#6e5a35" strokeWidth="2" />
            </g>
            {/* garden glyph */}
            <g transform={`translate(80 148)`} opacity="0.9">
              <circle r="13" fill="none" stroke="#6e7a4e" strokeWidth="2" strokeDasharray="3 3" />
              <path d="M0 -6 q4 6 0 12 q-4 -6 0 -12" fill="none" stroke="#6e7a4e" strokeWidth="1.6" />
            </g>
            {/* village dots */}
            {[210, 224, 238].map((x, i) => (
              <circle key={x} cx={x} cy={252 + i * 10} r="2.6" fill="#8a6d33" opacity="0.8" />
            ))}
            <text x="224" y="288" className="map-region" textAnchor="middle">VILLAGE</text>
            {/* bridge glyph over river */}
            <g transform="translate(116 192)">
              <path d="M-10 4 q10 -10 20 0 m-16 -2 v-4 m12 0 v4" stroke="#6e5a35" strokeWidth="2" fill="none" />
            </g>
            <text x="172" y="330" className="map-region" transform="rotate(74 172 330)">THE WANDERING RIVER</text>
            <text x="88" y="392" className="map-region" transform="rotate(64 88 392)">THE VALLEY ROAD</text>

            {/* travel route */}
            <polyline
              points={routePoints(cur, dest2)}
              fill="none"
              stroke="#a3803c"
              strokeWidth="2.4"
              strokeDasharray="7 6"
              className="map-route"
            />
            {/* direction arrow at route end */}
            <Arrow at={dest2} from={cur} />

            {/* markers */}
            {worlds.map((w) => {
              const [x, y] = atlasPoint(w.position);
              const isSel = selected === w.id;
              const isCur = current === w.id;
              return (
                <g
                  key={w.id}
                  transform={`translate(${x} ${y})`}
                  className="map-marker"
                  role="button"
                  tabIndex={0}
                  aria-label={w.name}
                  data-testid={`atlas-marker-${w.id}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    select(w.id);
                    audio.playSfx("hover");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") select(w.id);
                  }}
                >
                  {isSel && <circle r="30" fill="none" stroke="#a3803c" strokeWidth="1.4" className="pulse-ring" />}
                  <circle r={isSel ? 22 : 18} fill={isSel ? "#6e5a35" : "#d8cbab"} stroke="#6e5a35" strokeWidth="2.4" />
                  <text textAnchor="middle" y="6" fontSize="15" fill={isSel ? "#f4e4b7" : "#51452f"} className="marker-num">
                    {w.number}
                  </text>
                  <text textAnchor="middle" y="44" className="map-name">{w.name}</text>
                  {isCur && <text textAnchor="middle" y="-26" className="map-here">◈ YOU ARE HERE</text>}
                </g>
              );
            })}

            {/* you-are-here dot */}
            <circle cx={cur[0]} cy={cur[1]} r="5" fill="#2c5a52" stroke="#f4e4b7" strokeWidth="2" />

            {/* open door glyph (static destination — not an active world) */}
            <g
              transform={`translate(${openDoorMapPoint[0]} ${openDoorMapPoint[1]})`}
              className="map-marker open-door"
              role="button"
              tabIndex={0}
              aria-label="The Open Door — contact page"
              data-testid="atlas-open-door"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => useStore.getState().set({ phase: "opendoor" })}
              onKeyDown={(e) => {
                if (e.key === "Enter") useStore.getState().set({ phase: "opendoor" });
              }}
            >
              <path d="M-9 16 v-26 h18 v26" fill="none" stroke="#6e5a35" strokeWidth="2.2" />
              <path d="M-5 16 v-22 h10 v22" fill="#efe3c2" stroke="#6e5a35" strokeWidth="1.6" />
              <circle cx="3" cy="5" r="1.4" fill="#6e5a35" />
              <text textAnchor="middle" y="34" className="map-name">The Open Door</text>
            </g>
          </g>

          {/* compass rose */}
          <g transform="translate(446 62)" className="compass" opacity="0.85">
            <circle r="24" fill="none" stroke="#8a6d33" strokeWidth="1.6" />
            <circle r="2.6" fill="#8a6d33" />
            <path d="M0 -22 L5 0 L0 22 L-5 0 Z" fill="#a3803c" opacity="0.85" />
            <text x="0" y="-30" textAnchor="middle" className="map-north">N</text>
          </g>
          {/* frame */}
          <rect x="6" y="6" width="488" height="568" fill="none" stroke="#8a6d33" strokeWidth="3" />
          <rect x="14" y="14" width="472" height="552" fill="none" stroke="#8a6d33" strokeWidth="1" opacity="0.6" />
        </svg>
        <div className="map-tools">
          <button aria-label="Zoom in" data-testid="atlas-zoom-in" onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))}>+</button>
          <button aria-label="Zoom out" data-testid="atlas-zoom-out" onClick={() => setZoom((z) => Math.max(0.75, z - 0.2))}>−</button>
          <button data-testid="atlas-reset" onClick={() => { setZoom(1); setPan([0, 0]); }}>Reset map</button>
        </div>
        <span className="map-caption">● Your position · drag to explore · scroll to zoom</span>
      </div>

      <div className="atlas-detail" data-testid="atlas-detail">
        <p className="eyebrow">DESTINATION {destination.number}</p>
        <h2>{destination.name}</h2>
        <p className="italic">{destination.subtitle}</p>
        <p>{destination.description}</p>
        <button
          className="btn-primary"
          data-testid="atlas-travel-button"
          disabled={selected === current && !zone}
          onClick={() => travelTo(selected)}
        >
          {selected === current ? (zone ? "Step outside first" : "You are here") : "Travel Here"} <span aria-hidden>↗</span>
        </button>
        <div className="destination-list">
          {worlds.map((w) => (
            <button
              key={w.id}
              data-testid={`atlas-select-${w.id}`}
              aria-pressed={selected === w.id}
              onClick={() => select(w.id)}
            >
              <small>{w.number}</small>
              {w.name}
              <span>{selected === w.id ? "◈" : "◇"}</span>
            </button>
          ))}
          <div className="od-row">
            <span>Where the journey ends</span>
            <button data-testid="atlas-open-door-row" onClick={() => useStore.getState().set({ phase: "opendoor" })}>
              The Open Door ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function routePoints(a: [number, number], b: [number, number]) {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = a[0] + (b[0] - a[0]) * t + Math.sin(t * Math.PI * 3) * 8;
    const y = a[1] + (b[1] - a[1]) * t + Math.cos(t * Math.PI * 2.5) * 7;
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

function Arrow({ at, from }: { at: [number, number]; from: [number, number] }) {
  const ang = Math.atan2(at[1] - from[1], at[0] - from[0]);
  const x = at[0] - Math.cos(ang) * 34;
  const y = at[1] - Math.sin(ang) * 34;
  return (
    <g transform={`translate(${x} ${y}) rotate(${(ang * 180) / Math.PI})`} className="route-arrow">
      <path d="M-6 -5 L6 0 L-6 5 L-2 0 Z" fill="#a3803c" />
    </g>
  );
}
