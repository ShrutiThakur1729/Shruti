import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { GARDEN, gardenGround } from "./terrain";
import { wrapText, plaqueTexture } from "./shared/textures";
import { Lantern } from "./shared/Props";

type Note = { id: string; name: string; message: string };
export const GUESTBOOK_SPOT: [number, number] = [-163, -120];
const backend = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

function glowTexture(note: Note) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.font = "italic 600 38px 'Cormorant Garamond', Georgia, serif";
  const lines = wrapText(ctx, `“${note.message}”`, 560).slice(0, 4);
  const top = 160 - lines.length * 22;
  const glow = ctx.createRadialGradient(320, 320, 20, 320, 320, 310);
  glow.addColorStop(0, "rgba(20, 32, 24, 0.82)");
  glow.addColorStop(0.6, "rgba(20, 32, 24, 0.55)");
  glow.addColorStop(1, "rgba(20, 32, 24, 0)");
  ctx.save();
  ctx.scale(1, 0.5);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 640, 640);
  ctx.restore();
  for (const pass of [26, 8]) {
    ctx.shadowColor = "#ffc45e";
    ctx.shadowBlur = pass;
    ctx.fillStyle = "#fff4cf";
    ctx.font = "italic 600 38px 'Cormorant Garamond', Georgia, serif";
    lines.forEach((l, i) => ctx.fillText(l, 320, top + i * 44));
    ctx.font = "500 24px Cinzel, Georgia, serif";
    ctx.fillStyle = "#ffd98a";
    ctx.fillText(`— ${note.name}`, 320, top + lines.length * 44 + 16);
  }
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

function FloatingNote({ note, index, total }: { note: Note; index: number; total: number }) {
  const ref = useRef<T.Sprite>(null);
  const fade = useRef(0);
  const tex = useMemo(() => glowTexture(note), [note]);
  useEffect(() => () => tex.dispose(), [tex]);
  const a = (index / Math.max(total, 1)) * Math.PI * 2 + 0.4;
  const r = 10 + (index % 3) * 3;
  const x = GARDEN.cx + Math.cos(a) * r;
  const z = GARDEN.cz + Math.sin(a) * r;
  const base = gardenGround(x, z) + 4.2 + (index % 3) * 1.1;
  useFrame(({ clock }, delta) => {
    const s = ref.current;
    if (!s) return;
    const t = clock.elapsedTime + index * 1.7;
    s.position.y = base + Math.sin(t * 0.6) * 0.35;
    const m = s.material as T.SpriteMaterial;
    fade.current = Math.min(1, fade.current + delta * 0.8);
    m.opacity = fade.current * (0.85 + Math.sin(t * 1.3) * 0.15);
  });
  return (
    <sprite ref={ref} position={[x, base, z]} scale={[5, 2.5, 1]}>
      <spriteMaterial map={tex} transparent opacity={0} depthWrite={false} toneMapped={false} fog={false} />
    </sprite>
  );
}

function GuestbookStand() {
  const [x, z] = GUESTBOOK_SPOT;
  const tex = useMemo(() => plaqueTexture("Guestbook", "Leave a note", ""), []);
  return (
    <group position={[x, gardenGround(x, z), z]} rotation={[0, -0.5, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 1.2, 8]} />
        <meshStandardMaterial color="#5a4230" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.3, 0]} rotation={[-0.5, 0, 0]} castShadow>
        <boxGeometry args={[1.1, 0.06, 0.7]} />
        <meshStandardMaterial color="#6b5335" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.34, 0.02]} rotation={[-Math.PI / 2 - 0.5, 0, 0]}>
        <planeGeometry args={[1, 0.5]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
      <Lantern position={[0.9, 0, 0.3]} light />
    </group>
  );
}

export default function GuestbookNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => {
    if (!backend) return;
    const load = () =>
      fetch(`${backend}/api/guestbook`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d: Note[]) => setNotes(d))
        .catch(() => {});
    load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <group>
      <GuestbookStand />
      {notes.map((n, i) => (
        <FloatingNote key={n.id} note={n} index={i} total={notes.length} />
      ))}
    </group>
  );
}
