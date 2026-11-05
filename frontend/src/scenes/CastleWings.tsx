import { useMemo, useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as T from "three";
import { blockGeometry, useSurface, Stones, Banner, DustMotes } from "./shared/Props";
import { plaqueTexture, bookSpreads, bannerTexture } from "./shared/textures";
import { projects, books } from "../data/content";
import { useStore } from "../state/store";
import { interactionPoint } from "../data/interactions";
import { audio } from "../audio/AudioEngine";

export const bookBus: { next: () => void; prev: () => void } = { next: () => {}, prev: () => {} };

/* ————————————————————— GALLERY ————————————————————— */
export function Gallery() {
  const stone = useSurface("cobblestone_floor_08", 7);
  const rug = useMemo(
    () => new T.MeshStandardMaterial({ color: "#4c3a4a", roughness: 1 }),
    []
  );
  return (
    <group>
      <mesh position={[0, 0.22, -6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 26]} />
        <primitive object={rug} attach="material" />
      </mesh>
      {projects.map((p, i) => (
        <Exhibit key={p.id} project={p} index={i} stone={stone} />
      ))}
      {[-4.5, 4.5].map((x) => (
        <Banner key={x} position={[x, 6.4, -21.4]} label="S" bg="#3a3148" />
      ))}
      <DustMotes count={40} area={[22, 8, 26]} center={[0, 5, -6]} color="#f5deb0" size={0.03} />
    </group>
  );
}

function Exhibit({
  project,
  index,
  stone,
}: {
  project: (typeof projects)[number];
  index: number;
  stone: T.Material;
}) {
  const x = index < 3 ? -10 : 10;
  const z = [-16, -6, 4, -11, 1][index];
  const open = useStore((s) => s.openPanel);
  const nearby = useStore((s) => s.nearby);
  const spin = useRef<T.Group>(null);
  useFrame(({ clock }, dt) => {
    if (spin.current) {
      spin.current.rotation.y += dt * 0.5;
      spin.current.position.y = 2.05 + Math.sin(clock.elapsedTime * 1.2 + index) * 0.07;
    }
  });
  const plaque = useMemo(
    () => plaqueTexture(project.name, project.subtitle, "Press E to read"),
    [project.name, project.subtitle]
  );
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.78, 0.88, 1.1, 14]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[0, 1.13, 0]} castShadow>
        <cylinderGeometry args={[0.88, 0.78, 0.1, 14]} />
        <meshStandardMaterial color="#6b5335" metalness={0.5} roughness={0.5} />
      </mesh>
      <group ref={spin} position={[0, 2.05, 0]} onClick={(e) => {
        e.stopPropagation();
        open("exhibit", project.id);
      }}>
        <Artefact kind={project.art} />
      </group>
      <mesh position={[0, 0.02, 1.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 24]} />
        <meshStandardMaterial color="#e8c88a" emissive="#c9954a" emissiveIntensity={0.35} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 1.6, 1.1]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[1.7, 0.85]} />
        <meshStandardMaterial map={plaque} roughness={0.8} />
      </mesh>
      {nearby?.id === `exhibit-${project.id}` && (
        <pointLight position={[0, 3.2, 0.6]} intensity={7} distance={5} decay={2} color="#ffd98a" />
      )}
    </group>
  );
}

function Artefact({ kind }: { kind: string }) {
  if (kind === "shield") return <ShieldArt />;
  if (kind === "speech") return <SpeechArt />;
  if (kind === "market") return <MarketArt />;
  if (kind === "ecology") return <EcologyArt />;
  return <CosmicArt />;
}

function ShieldArt() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.72, 0.1, 24]} />
        <meshStandardMaterial color="#39424e" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.05, 8, 32]} />
        <meshStandardMaterial color="#63d8e8" emissive="#3ec3d8" emissiveIntensity={2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.2, 14, 14]} />
        <meshStandardMaterial color="#8ae8ff" emissive="#4ecbe8" emissiveIntensity={2.4} />
      </mesh>
      {[-0.3, 0, 0.3].map((dx, i) => (
        <mesh key={dx} position={[dx, -0.5 + i * 0.12, 0.1]}>
          <boxGeometry args={[0.12, 0.3 + i * 0.22, 0.05]} />
          <meshStandardMaterial color="#6ee8c8" emissive="#3ec3a0" emissiveIntensity={1.6} />
        </mesh>
      ))}
    </group>
  );
}

function SpeechArt() {
  const bars = [-0.42, -0.21, 0, 0.21, 0.42];
  const cols = ["#7ea8e8", "#8ad8c8", "#e8d98a", "#8ad8c8", "#7ea8e8"];
  return (
    <group>
      {bars.map((x, i) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.12, 0.28 + Math.abs(0.55 - Math.abs(x) * 2.2) * 0.8, 0.12]} />
          <meshStandardMaterial color={cols[i]} emissive={cols[i]} emissiveIntensity={1.5} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2.2, 0, 0.3]}>
        <torusGeometry args={[0.78, 0.035, 8, 40]} />
        <meshStandardMaterial color="#c9a75c" metalness={0.8} roughness={0.3} emissive="#8a6d33" emissiveIntensity={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2.2, 0, -0.5]}>
        <torusGeometry args={[0.95, 0.02, 8, 40]} />
        <meshStandardMaterial color="#8ad8c8" emissive="#4ec3a8" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function MarketArt() {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.62, 0.44, 0.5, 12]} />
        <meshStandardMaterial color="#8a6d33" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.07, 8, 20]} />
        <meshStandardMaterial color="#b08d4f" roughness={0.6} />
      </mesh>
      {[
        ["#d8b25f", -0.25],
        ["#b8552e", 0.05],
        ["#e8d9a3", 0.3],
      ].map(([c, dx], i) => (
        <mesh key={i} position={[Number(dx), 0.42, i * 0.14 - 0.1]} castShadow>
          <sphereGeometry args={[0.17, 12, 12]} />
          <meshStandardMaterial color={String(c)} roughness={0.5} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.5 - i * 0.45, -0.62, 0.2]} rotation={[Math.PI / 2, 0, i]}>
          <cylinderGeometry args={[0.09, 0.09, 0.03, 12]} />
          <meshStandardMaterial color="#e8c85f" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function EcologyArt() {
  const river = useMemo(() => {
    const c = new T.CatmullRomCurve3([
      new T.Vector3(-0.75, 0.16, 0.3),
      new T.Vector3(-0.2, 0.16, -0.1),
      new T.Vector3(0.25, 0.16, 0.15),
      new T.Vector3(0.75, 0.16, -0.2),
    ]);
    return new T.TubeGeometry(c, 24, 0.055, 6, false);
  }, []);
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.92, 0.98, 0.24, 20]} />
        <meshStandardMaterial color="#4a5a3a" roughness={0.9} />
      </mesh>
      <mesh geometry={river}>
        <meshStandardMaterial color="#5ec3d8" emissive="#2e9ab0" emissiveIntensity={1.2} />
      </mesh>
      {[
        [-0.45, 0.34],
        [-0.1, 0.42],
        [0.5, 0.36],
      ].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 0.4, dz]} castShadow>
          <coneGeometry args={[0.14, 0.34, 8]} />
          <meshStandardMaterial color={i === 1 ? "#6e8a3a" : "#3a6e46"} roughness={0.8} />
        </mesh>
      ))}
      {[0.55, 0.8].map((r, i) => (
        <mesh key={i} position={[0, -0.06 + i * 0.02, 0]} scale={[1, 0.12, 1]}>
          <torusGeometry args={[r, 0.04, 6, 40]} />
          <meshStandardMaterial color="#c9b87f" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0.35, 0.55, -0.3]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.09, 0.26, 10]} />
        <meshStandardMaterial color="#c85a4a" emissive="#a83a2e" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function CosmicArt() {
  const ring1 = useRef<T.Mesh>(null);
  const moon = useRef<T.Group>(null);
  const stars = useMemo(() => {
    const v: number[] = [];
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2,
        b = Math.acos(Math.random() * 2 - 1);
      v.push(
        0.58 * Math.sin(b) * Math.cos(a),
        0.58 * Math.cos(b),
        0.58 * Math.sin(b) * Math.sin(a)
      );
    }
    return new Float32Array(v);
  }, []);
  useFrame((_, dt) => {
    if (ring1.current) ring1.current.rotation.z += dt * 0.4;
    if (moon.current) moon.current.rotation.y += dt * 0.9;
  });
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 20, 20]} />
        <meshStandardMaterial color="#1c2438" metalness={0.6} roughness={0.35} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#cfe0ff" transparent opacity={0.9} depthWrite={false} />
      </points>
      <mesh ref={ring1} rotation={[Math.PI / 2.4, 0.3, 0]}>
        <torusGeometry args={[0.82, 0.025, 8, 48]} />
        <meshStandardMaterial color="#c9a75c" metalness={0.8} roughness={0.3} emissive="#8a6d33" emissiveIntensity={0.5} />
      </mesh>
      <group ref={moon}>
        <mesh position={[0.95, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial color="#e8d9a3" emissive="#b09a5e" emissiveIntensity={0.6} />
        </mesh>
      </group>
      <mesh rotation={[Math.PI / 1.8, 0, 0.2]}>
        <torusGeometry args={[0.68, 0.015, 8, 48]} />
        <meshStandardMaterial color="#8ab0e8" emissive="#5a80c0" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function ExitDoor({ title }: { title: string }) {
  const tex = useMemo(() => plaqueTexture(title, "Press E", ""), [title]);
  return (
    <group position={[0, 0, 9.4]}>
      <mesh position={[0, 4.4, 0.4]}>
        <planeGeometry args={[5.4, 8.6]} />
        <meshStandardMaterial color="#e8c88a" emissive="#c9954a" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0, 7.9, 0.4]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.6, 1]}>
        <torusGeometry args={[2.7, 0.3, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#54422c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.4, 0.85]} rotation={[0, 0, 0]}>
        <planeGeometry args={[3.6, 1.8]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ————————————————————— LIBRARY ————————————————————— */
const LEATHER = ["#6b3a2a", "#4a3c5a", "#2e4a3a", "#7a5a2e", "#8a6d33", "#54422c", "#3a4a5a", "#6e2e2e"];

export function Library() {
  const wood = useSurface("bark_brown_02", 2);
  const shelfBooks = useMemo(() => {
    const rand = booksRandom(1234);
    const list: { p: T.Vector3; s: T.Vector3; r: number; c: T.Color }[] = [];
    const addRow = (x0: number, x1: number, z: number, y: number, flip = 1) => {
      let x = x0;
      while (x < x1) {
        const w = 0.13 + rand() * 0.09;
        if (rand() > 0.88) {
          x += 0.22;
          continue;
        }
        const h = 0.5 + rand() * 0.16;
        list.push({
          p: new T.Vector3(x + w / 2, y + h / 2, z),
          s: new T.Vector3(w * 0.92, h, 0.26),
          r: 0,
          c: new T.Color(LEATHER[Math.floor(rand() * LEATHER.length)]),
        });
        x += w + 0.012 * flip;
      }
    };
    // north wall shelves (behind z=-20)
    for (const z of [-20.2, -19.4]) {
      for (let seg = -13.4; seg < 13; seg += 6.8) {
        for (const y of [0.9, 1.85, 2.8, 3.75, 4.7]) addRow(seg, seg + 6.2, z, y);
      }
    }
    // side shelves
    for (const x of [-13.4, 13.05]) {
      for (const z of [-18, -12, -6, 0, 6]) {
        for (const y of [0.9, 1.85, 2.8, 3.75]) addRowZ(list, x, z, z + 5.4, y);
      }
    }
    return list;
  }, []);
  const boards = useMemo(() => {
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    for (const z of [-20.2, -19.4])
      for (let seg = -13.6; seg < 13.6; seg += 6.8)
        for (const y of [0.62, 1.57, 2.52, 3.47, 4.42, 5.3])
          list.push({ p: new T.Vector3(seg + 3.2, y, z), s: new T.Vector3(6.6, 0.1, 0.85), r: 0 });
    for (const x of [-13.4, 13.05])
      for (const z of [-18.2, -6.2, 5.8])
        for (const y of [0.62, 1.57, 2.52, 3.47, 4.42])
          list.push({ p: new T.Vector3(x, y, z + 2.7), s: new T.Vector3(0.85, 0.1, 6.6), r: 0 });
    return list;
  }, []);
  return (
    <group>
      <mesh position={[0, 0.22, -6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.5, 36]} />
        <meshStandardMaterial color="#4c3a4a" roughness={1} />
      </mesh>
      <Stones items={shelfBooks} material={shelfBooksMaterial()} shadows={false} />
      <Stones items={boards} material={wood} />
      {books.map((b, i) => (
        <FeaturedBook key={b.id} book={b} index={i} />
      ))}
      <Globe position={[12, 0, -19.6]} />
      <Ladder position={[-12.2, 0, -18.6]} />
      <Banner position={[-6, 6.4, -21.4]} label="A" bg="#2e4a3a" />
      <Banner position={[6, 6.4, -21.4]} label="S" bg="#2e4a3a" />
      <DustMotes count={36} area={[22, 7, 26]} center={[0, 4.5, -6]} color="#f5deb0" size={0.028} />
    </group>
  );
}

function booksRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function addRowZ(
  list: { p: T.Vector3; s: T.Vector3; r: number; c: T.Color }[],
  x: number,
  z0: number,
  z1: number,
  y: number
) {
  let z = z0;
  while (z < z1) {
    const d = 0.13 + Math.random() * 0.09;
    if (Math.random() > 0.9) {
      z += 0.24;
      continue;
    }
    const h = 0.5 + Math.random() * 0.16;
    list.push({
      p: new T.Vector3(x + 0.18, y + h / 2, z + d / 2),
      s: new T.Vector3(0.26, h, d * 0.92),
      r: 0,
      c: new T.Color(LEATHER[Math.floor(Math.random() * LEATHER.length)]),
    });
    z += d + 0.012;
  }
}

let _matCache: T.MeshStandardMaterial | null = null;
function shelfBooksMaterial() {
  if (!_matCache)
    _matCache = new T.MeshStandardMaterial({ roughness: 0.82, vertexColors: false });
  return _matCache;
}

function FeaturedBook({ book, index }: { book: (typeof books)[number]; index: number }) {
  const pos = [
    [-8.2, -14],
    [-3.4, -14],
    [3.4, -14],
    [8.2, -14],
    [-5.8, 2],
    [5.8, 2],
  ][index];
  const open = useStore((s) => s.openPanel);
  const nearby = useStore((s) => s.nearby);
  const ref = useRef<T.Group>(null);
  const selected=useStore(s=>s.panel==='book'&&s.refId===book.id&&!s.bookReader);
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.position.z =
        pos[1] + (nearby?.id === `book-${book.id}` ? 0.42 : 0.18) + Math.sin(clock.elapsedTime + index) * 0.015;
  });
  return (
    <group
      ref={ref}
      visible={!selected}
      position={[pos[0], 1.5, pos[1]]}
      onClick={(e) => {
        e.stopPropagation();
        open("book", book.id);
      }}
      data-testid={`scene-book-${book.id}`}
    >
      <mesh castShadow>
        <boxGeometry args={[0.34, 0.62, 0.16]} />
        <meshStandardMaterial
          color={LEATHER[index % LEATHER.length]}
          roughness={0.6}
          emissive="#8a6d33"
          emissiveIntensity={nearby?.id === `book-${book.id}` ? 0.5 : 0.18}
        />
      </mesh>
      <mesh position={[0, 0, 0.085]}>
        <planeGeometry args={[0.24, 0.5]} />
        <meshStandardMaterial color="#e8d9a3" emissive="#c9a75c" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#ffe9b0" emissive="#ffca6e" emissiveIntensity={2.6} />
      </mesh>
    </group>
  );
}

function Globe({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.08, 0.16, 1.8, 8]} />
        <meshStandardMaterial color="#4a3423" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.9, 0]} rotation={[0.3, 0, 0]} castShadow>
        <sphereGeometry args={[0.52, 18, 18]} />
        <meshStandardMaterial color="#2e4a5a" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.9, 0]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.54, 0.02, 6, 30]} />
        <meshStandardMaterial color="#c9a75c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Ladder({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0.22, 0, 0]}>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 2.6, 0]} castShadow>
          <boxGeometry args={[0.08, 5.2, 0.08]} />
          <meshStandardMaterial color="#6b5335" roughness={0.8} />
        </mesh>
      ))}
      {[0.6, 1.4, 2.2, 3, 3.8].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[0.56, 0.07, 0.07]} />
          <meshStandardMaterial color="#6b5335" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ————————————————————— 3D BOOK EXPERIENCE ————————————————————— */
type Turn = { dir: 1 | -1; t: number } | null;

export function BookExperience({ bookId }: { bookId: string }) {
  const { camera } = useThree();
  const book = books.find((b) => b.id === bookId)!;
  const spreads = useMemo(() => bookSpreads(book), [book]);
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [, force] = useState(0);
  const turn = useRef<Turn>(null);
  const pivot = useRef<T.Group>(null);
  const group = useRef<T.Group>(null);
  const coverL = useRef<T.Group>(null);
  const coverR = useRef<T.Group>(null);
  const intro = useRef(0);
  const shelfPos = useMemo(() => interactionPoint(`book-${bookId}`), [bookId]);
  const closePanel = useStore((s) => s.closePanel);
  const closing=useStore(s=>s.bookClosing);

  useEffect(() => {
    audio.playSfx("bookOpen");
    bookBus.next = () => {
      if (turn.current || spreadIdx >= spreads.length - 1) return;
      audio.playSfx("page");
      turn.current = { dir: 1, t: 0 };
    };
    bookBus.prev = () => {
      if (turn.current || spreadIdx <= 0) return;
      audio.playSfx("page");
      turn.current = { dir: -1, t: 0 };
    };
    return () => {
      bookBus.next = () => {};
      bookBus.prev = () => {};
    };
  }, [spreadIdx, spreads.length]);

  useFrame((_, dt) => {
    // intro: fly from the shelf into reading position
    if (closing) {
      intro.current=Math.max(0,intro.current-dt/0.8);
      if(intro.current===0){useStore.setState({panel:null,refId:null,bookClosing:false});return;}
    } else if (intro.current < 1) intro.current = Math.min(1, intro.current + dt / 1.2);
    const e = intro.current * intro.current * (3 - 2 * intro.current);
    const forward = new T.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const anchor = camera.position
      .clone()
      .addScaledVector(forward, 1.55)
      .add(new T.Vector3(0, -0.22, 0));
    if (group.current) {
      const from = shelfPos
        ? new T.Vector3(shelfPos[0], shelfPos[1] + 1.5, shelfPos[2])
        : anchor.clone().add(new T.Vector3(0, -1.2, -0.6));
      group.current.position.lerpVectors(from, anchor, e);
      group.current.quaternion.copy(camera.quaternion);
      group.current.rotateX(-0.22);
      const s = 0.55 + 0.45 * e;
      group.current.scale.setScalar(s);
    }
    if (coverL.current)
      coverL.current.rotation.y = T.MathUtils.lerp(Math.PI * 0.96, 0.045, Math.max(0, (e - 0.35) / 0.65));
    if (coverR.current)
      coverR.current.rotation.y = T.MathUtils.lerp(-Math.PI * 0.96, -0.045, Math.max(0, (e - 0.35) / 0.65));
    // page turn
    const t = turn.current;
    if (t && pivot.current) {
      t.t = Math.min(1, t.t + dt / 0.65);
      const p = t.t * t.t * (3 - 2 * t.t);
      pivot.current.rotation.y = t.dir === 1 ? -Math.PI * p : -Math.PI * (1 - p);
      pivot.current.visible = true;
      if (t.t >= 1) {
        const next = spreadIdx + t.dir;
        turn.current = null;
        setSpreadIdx(next);
        force((v) => v + 1);
      }
    } else if (pivot.current) {
      pivot.current.visible = false;
    }
  });

  const spread = spreads[spreadIdx];
  const moving = turn.current;
  const rightUnder = moving?.dir === 1 && spreads[spreadIdx + 1] ? spreads[spreadIdx + 1].right : spread.right;
  const leftUnder = moving?.dir === -1 && spreads[spreadIdx - 1] ? spreads[spreadIdx - 1].left : spread.left;

  return (
    <group ref={group} data-testid="book3d">
      <mesh position={[0, -0.56, -0.03]}>
        <boxGeometry args={[1.58, 1.12, 0.06]} />
        <meshStandardMaterial color="#3a2418" roughness={0.6} />
      </mesh>
      <group ref={coverL}>
        <mesh position={[-0.755, -0.56, -0.045]} castShadow>
          <boxGeometry args={[0.78, 1.06, 0.035]} />
          <meshStandardMaterial color="#5a2e28" roughness={0.55} />
        </mesh>
        <mesh position={[-0.755, -0.56, -0.026]}>
          <boxGeometry args={[0.62, 0.8, 0.005]} />
          <meshStandardMaterial color="#c9a75c" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      <group ref={coverR}>
        <mesh position={[0.755, -0.56, -0.045]} castShadow>
          <boxGeometry args={[0.78, 1.06, 0.035]} />
          <meshStandardMaterial color="#5a2e28" roughness={0.55} />
        </mesh>
        <mesh position={[0.755, -0.56, -0.026]}>
          <boxGeometry args={[0.62, 0.8, 0.005]} />
          <meshStandardMaterial color="#c9a75c" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      {/* static pages */}
      <mesh position={[-0.375, -0.555, 0.01]}>
        <planeGeometry args={[0.72, 0.98]} />
        <meshStandardMaterial map={leftUnder} roughness={0.9} />
      </mesh>
      <mesh position={[0.375, -0.555, 0.01]}>
        <planeGeometry args={[0.72, 0.98]} />
        <meshStandardMaterial map={rightUnder} roughness={0.9} />
      </mesh>
      {/* turning page */}
      <group ref={pivot} position={[0, -0.555, 0.015]} visible={false}>
        <mesh position={[0.375, 0, 0]}>
          <planeGeometry args={[0.72, 0.98]} />
          <meshStandardMaterial
            map={moving?.dir === 1 ? spread.right : spread.left}
            roughness={0.9}
            side={T.DoubleSide}
          />
        </mesh>
      </group>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          closePanel();
        }}
        position={[0, -0.56, -0.01]}
        visible={false}
      >
        <boxGeometry args={[1.6, 1.2, 0.1]} />
      </mesh>
    </group>
  );
}
