import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as T from "three";
import { CASTLE, castleGround, random, noise } from "./terrain";
import {
  blockGeometry,
  useSurface,
  InstancedModel,
  Stones,
  Lantern,
  Banner,
  DustMotes,
  SimpleWater,
  TerrainMesh,
} from "./shared/Props";
import { plaqueTexture } from "./shared/textures";
import { useStore } from "../state/store";
import { GrassField, Bushes, Torch, type Bush } from "./shared/Nature";

const rectDist = (x: number, z: number) => {
  const dx = Math.max(105 - x, 0, x - 195);
  const dz = Math.max(-297 - z, 0, z + 207);
  return Math.hypot(dx, dz);
};

const castleSample = (r: () => number): [number, number] | null => {
  const x = 62 + r() * 176;
  const z = -326 + r() * 160;
  const d = rectDist(x, z);
  if (d > 4.5 && d < 16.5) return null;
  if (d > 0 && d <= 4.5) return null;
  if (Math.abs(x - 150) < 6.5 && z > -212) return null;
  if (d === 0) {
    if (x < 108.5 || x > 191.5 || z < -293.5 || z > -210.5) return null;
    if (Math.abs(x - 150) < 3.6 && z > -252) return null;
    if (Math.hypot(x - CASTLE.keep.x, z - CASTLE.keep.z) < 14.5) return null;
    if (Math.hypot(x - CASTLE.fountain.x, z - CASTLE.fountain.z) < 6) return null;
    if (Math.hypot(x - CASTLE.statue.x, z - CASTLE.statue.z) < 2.4) return null;
  }
  return [x, z];
};

const castleColor = (x: number, z: number, h: number) => {
  const d = rectDist(x, z);
  const road = Math.abs(x - 150) < 4.5 && z > -212;
  const n = noise(x * 0.08, z * 0.08);
  if (road) return `#${new T.Color().setHSL(0.09, 0.22, 0.6 + n * 0.08).getHexString()}`;
  if (h < 0.6) return `#${new T.Color().setHSL(0.12, 0.2, 0.42).getHexString()}`;
  const lush = d === 0 ? 0.7 : 0.64;
  return `#${new T.Color().setHSL(0.24 + n * 0.02, 0.45, lush + n * 0.1).getHexString()}`;
};

function CastleNature() {
  const forest = useMemo(() => {
    const r = random(57);
    const list = [];
    for (let i = 0; i < 260 && list.length < 70; i++) {
      const x = 40 + r() * 220;
      const z = -340 + r() * 190;
      if (rectDist(x, z) < 24 || (Math.abs(x - 150) < 16 && z > -215)) continue;
      list.push({ x, y: castleGround(x, z) - 0.2, z, s: 0.7 + r() * 0.7, r: r() * 6.28 });
    }
    return list;
  }, []);
  const rocks = useMemo(() => {
    const r = random(61);
    return Array.from({ length: 40 }, () => {
      const x = 70 + r() * 160;
      const z = -190 + r() * 26;
      return { x, y: castleGround(x, z) - 0.3, z, s: 0.4 + r() * 0.9, r: r() * 6 };
    }).filter((p) => Math.abs(p.x - 150) > 8);
  }, []);
  const ferns = useMemo(() => {
    const r = random(62);
    const list = [];
    for (let i = 0; i < 200; i++) {
      const x = 108 + r() * 84;
      const z = -294 + r() * 84;
      if (x > 112 && x < 188 && z > -290 && z < -213) continue;
      list.push({ x, y: 2, z, s: 0.5 + r() * 0.6, r: r() * 6.28 });
    }
    return list;
  }, []);
  return (
    <>
      <GrassField seed={44} sample={castleSample} heightFn={castleGround} density={2.2} hue={0.21} flowerColors={["#e8d9a3", "#ffffff", "#c6b8d5", "#d8a35c"]} flowerRatio={0.035} />
      <InstancedModel url="/assets/tree.glb" height={14} placements={forest} maxDistance={40} wind />
      <InstancedModel url="/assets/tree-lod.glb" height={14} placements={forest} minDistance={40} shadows={false} />
      <InstancedModel url="/assets/rocks.glb" height={2} placements={rocks} maxDistance={30} />
      <InstancedModel url="/assets/rocks-lod.glb" height={2} placements={rocks} minDistance={30} shadows={false} />
      <InstancedModel url="/assets/fern-lod.glb" height={0.3} placements={ferns} wind shadows={false} />
      {[
        [143.2, 4.2, -205.2],
        [156.8, 4.2, -205.2],
        [146.5, 4.2, -209.2],
        [153.5, 4.2, -209.2],
        [141, 4.6, -251.6],
        [159, 4.6, -251.6],
        [132, 5, -208.8],
        [168, 5, -208.8],
      ].map((p, i) => (
        <Torch key={i} position={p as [number, number, number]} light={i < 6} />
      ))}
    </>
  );
}

function CastleMountains() {
  const geometry = useMemo(() => {
    const g = new T.PlaneGeometry(900, 500, 120, 80);
    g.rotateX(-Math.PI / 2);
    g.translate(150, -4, -560);
    const p = g.attributes.position,
      colors = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      const ridge = Math.pow(Math.max(0, Math.sin(((z + 810) / 500) * Math.PI)), 1.5);
      const h =
        ridge * (24 + Math.pow(Math.abs(noise(x * 0.011, z * 0.012)), 1.6) * 190 + noise(x * 0.06, z * 0.06) * 22);
      p.setY(i, h - 2);
      const c = new T.Color(h > 76 ? "#c9c4bd" : h > 56 ? "#7d7d74" : "#5a6a5d");
      c.multiplyScalar(0.8 + noise(x * 0.15, z * 0.13) * 0.28);
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  );
}

function Walls() {
  const stone = useSurface("cobblestone_floor_08", 6);
  const { cx, cz, half, wallH, gateHalf, gateZ } = CASTLE;
  const wallBand = { x0: cx - half, x1: cx + half, z0: cz - half, z1: cz + half };
  const x0 = wallBand.x0,
    x1 = wallBand.x1,
    z0 = wallBand.z0,
    z1 = gateZ; // south wall ends at gate line
  const merlons = useMemo(() => {
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    const add = (x: number, z: number) =>
      list.push({ p: new T.Vector3(x, CASTLE.wallH + 0.55, z), s: new T.Vector3(0.5, 1.1, 0.5), r: 0 });
    for (let x = x0 + 1; x <= x1; x += 2.2) {
      add(x, z0 + 1.5);
      add(x, CASTLE.gateZ - 1.5);
      if (Math.abs(x - CASTLE.cx) > CASTLE.gateHalf) add(x, CASTLE.gateZ + 1.5);
    }
    for (let z = z0 + 1; z <= CASTLE.gateZ; z += 2.2) {
      add(x0 + 1.5, z);
      add(x1 - 1.5, z);
    }
    return list;
  }, []);
  return (
    <group>
      {/* north wall */}
      <mesh position={[cx, wallH / 2, z0 + 1.5]} castShadow receiveShadow>
        <boxGeometry args={[half * 2, wallH, 3]} />
        {material(stone)}
      </mesh>
      {/* east & west walls */}
      <mesh position={[x0 + 1.5, wallH / 2, (z0 + CASTLE.gateZ) / 2]} castShadow receiveShadow>
        <boxGeometry args={[3, wallH, CASTLE.gateZ - z0]} />
        {material(stone)}
      </mesh>
      <mesh position={[x1 - 1.5, wallH / 2, (z0 + CASTLE.gateZ) / 2]} castShadow receiveShadow>
        <boxGeometry args={[3, wallH, CASTLE.gateZ - z0]} />
        {material(stone)}
      </mesh>
      {/* south wall segments (gate gap) */}
      <mesh position={[(x0 + CASTLE.cx - gateHalf) / 2, wallH / 2, CASTLE.gateZ]} castShadow receiveShadow>
        <boxGeometry args={[CASTLE.cx - gateHalf - x0, wallH, 3]} />
        {material(stone)}
      </mesh>
      <mesh position={[(CASTLE.cx + gateHalf + x1) / 2, wallH / 2, CASTLE.gateZ]} castShadow receiveShadow>
        <boxGeometry args={[x1 - CASTLE.cx - gateHalf, wallH, 3]} />
        {material(stone)}
      </mesh>
      <Stones items={merlons} material={stone} shadows={false} />
    </group>
  );
}

function material(m: T.Material) {
  return <primitive object={m} attach="material" />;
}

function Tower({
  position,
  r = 4,
  h = 16,
  roofColor = "#4a3b4a",
}: {
  position: [number, number, number];
  r?: number;
  h?: number;
  roofColor?: string;
}) {
  const stone = useSurface("cobblestone_floor_08", 5);
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 1.08, h, 24]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[0, h + 0.4, 0]} castShadow>
        <cylinderGeometry args={[r * 1.12, r * 1.02, 0.8, 24]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[0, h + 3.6, 0]} castShadow>
        <coneGeometry args={[r * 1.25, 6.4, 24]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh position={[0, h + 6.6, 0]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial color="#c9a75c" metalness={0.85} roughness={0.3} />
      </mesh>
      {[h * 0.35, h * 0.68].map((y, i) => (
        <mesh key={i} position={[0, y, r * 0.98]}>
          <boxGeometry args={[1.1, 2, 0.3]} />
          <meshStandardMaterial color="#ffca6e" emissive="#e89a3a" emissiveIntensity={1.4} />
        </mesh>
      ))}
    </group>
  );
}

function Gatehouse() {
  const stone = useSurface("cobblestone_floor_08", 4);
  const wood = useSurface("bark_brown_02", 2);
  const z = CASTLE.gateZ;
  return (
    <group>
      <Tower position={[140, 0, z]} r={4.2} h={17} />
      <Tower position={[160, 0, z]} r={4.2} h={17} />
      {/* arch wall above gate */}
      <mesh position={[150, 11.4, z]} castShadow receiveShadow>
        <boxGeometry args={[20, 5.2, 3.4]} />
        {material(stone)}
      </mesh>
      <mesh position={[150, 16.6, z]} castShadow>
        <boxGeometry args={[22, 1, 4]} />
        {material(stone)}
      </mesh>
      <Banner position={[144.2, 9.6, z + 1.9]} label="S" bg="#5d2a26" />
      <Banner position={[155.8, 9.6, z + 1.9]} label="S" bg="#5d2a26" />
      {/* wooden doors opened inward */}
      <mesh position={[146.2, 2.2, z - 2.6]} rotation={[0, -1.15, 0]} castShadow>
        <boxGeometry args={[5.4, 4.6, 0.34]} />
        <primitive object={wood} attach="material" />
      </mesh>
      <mesh position={[153.8, 2.2, z - 2.6]} rotation={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[5.4, 4.6, 0.34]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* raised portcullis */}
      {[-2.2, -1.1, 0, 1.1, 2.2].map((dx) => (
        <mesh key={dx} position={[150 + dx, 9.4, z]}>
          <cylinderGeometry args={[0.09, 0.09, 4.4, 6]} />
          <meshStandardMaterial color="#2e2a22" metalness={0.75} roughness={0.4} />
        </mesh>
      ))}
      <Lantern position={[143.4, 2.6, z + 2.6]} light />
      <Lantern position={[156.6, 2.6, z + 2.6]} />
      <GoldShimmer position={[150, 4, z - 3]} />
    </group>
  );
}

function GoldShimmer({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <DustMotes count={26} area={[7, 6, 7]} center={[0, 0, 0]} color="#ffd98a" size={0.06} />
    </group>
  );
}

function Keep() {
  const stone = useSurface("cobblestone_floor_08", 8);
  const { keep } = CASTLE;
  const windows = useMemo(() => {
    const list: [number, number, number, number][] = [];
    for (let ring = 0; ring < 3; ring++)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + ring * 0.5;
        list.push([
          keep.x + Math.cos(a) * 9.1,
          6 + ring * 5.4,
          keep.z + Math.sin(a) * 9.1,
          a,
        ]);
      }
    return list;
  }, [keep]);
  return (
    <group>
      <mesh position={[keep.x, 12, keep.z]} castShadow receiveShadow>
        <cylinderGeometry args={[9, 9.8, 24, 18]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[keep.x, 27.5, keep.z]} castShadow>
        <coneGeometry args={[11.4, 9.5, 18]} />
        <meshStandardMaterial color="#4a3b4a" roughness={0.8} />
      </mesh>
      <mesh position={[keep.x, 33.2, keep.z]}>
        <sphereGeometry args={[0.6, 10, 10]} />
        <meshStandardMaterial color="#c9a75c" metalness={0.85} roughness={0.3} />
      </mesh>
      {windows.map(([x, y, z, a], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, -a + Math.PI / 2, 0]}>
          <boxGeometry args={[1.2, 2.4, 0.3]} />
          <meshStandardMaterial color="#ffca6e" emissive="#e89a3a" emissiveIntensity={1.6} />
        </mesh>
      ))}
      {[
        [8, 8],
        [-8, 8],
        [8, -8],
        [-8, -8],
      ].map(([dx, dz], i) => (
        <group key={i} position={[keep.x + dx, 0, keep.z + dz]}>
          <mesh position={[0, 8.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3.6, 3.9, 17, 12]} />
            <primitive object={stone} attach="material" />
          </mesh>
          <mesh position={[0, 19.6, 0]} castShadow>
            <coneGeometry args={[4.7, 6, 12]} />
            <meshStandardMaterial color="#4a3b4a" roughness={0.8} />
          </mesh>
        </group>
      ))}
      <Banner position={[keep.x - 3.4, 14, keep.z + 9.9]} label="S" bg="#5d2a26" />
      <Banner position={[keep.x + 3.4, 14, keep.z + 9.9]} label="S" bg="#5d2a26" />
    </group>
  );
}

function Fountain() {
  const stone = useSurface("cobblestone_floor_08", 3);
  const { fountain } = CASTLE;
  return (
    <group position={[fountain.x, 2, fountain.z]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3, 3.3, 1, 24]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <SimpleWater width={5.4} depth={5.4} position={[0, 1.05, 0]} circle color="#4a7a74" />
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.55, 2.6, 10]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[1.15, 0.35, 0.5, 14]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[0, 3.6, 0]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial color="#c9a75c" metalness={0.8} roughness={0.25} />
      </mesh>
      <WaterJet />
    </group>
  );
}

function WaterJet() {
  const ref = useRef<T.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current)
      (ref.current.material as T.MeshStandardMaterial).opacity =
        0.5 + Math.sin(clock.elapsedTime * 4.2) * 0.12;
  });
  return (
    <mesh ref={ref} position={[0, 3.4, 0]}>
      <cylinderGeometry args={[0.14, 0.3, 2.2, 8, 1, true]} />
      <meshStandardMaterial color="#cfe6df" transparent opacity={0.55} roughness={0.2} side={T.DoubleSide} />
    </mesh>
  );
}

function Statue() {
  const stone = useSurface("cobblestone_floor_08", 2);
  return (
    <group position={[CASTLE.statue.x, 2, CASTLE.statue.z]}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 2, 1.6]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[0, 3.1, 0]} castShadow>
        <coneGeometry args={[0.62, 2.4, 10]} />
        <meshStandardMaterial color="#b8b2a4" roughness={0.7} />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <sphereGeometry args={[0.34, 14, 14]} />
        <meshStandardMaterial color="#b8b2a4" roughness={0.6} />
      </mesh>
      <mesh position={[0.5, 4.6, 0]} rotation={[0, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
        <meshStandardMaterial color="#8d8477" />
      </mesh>
      <mesh position={[0.72, 5.4, 0]}>
        <sphereGeometry args={[0.17, 10, 10]} />
        <meshStandardMaterial color="#ffca6e" emissive="#e89a3a" emissiveIntensity={2.4} />
      </mesh>
    </group>
  );
}

function CourtyardDressing() {
  const stone = useSurface("cobblestone_floor_08");
  const hedgeItems = useMemo(() => {
    const list: Bush[] = [];
    for (let z = -216; z >= -290; z -= 1.9) {
      list.push({ x: 126, y: 2.7, z, s: [1.5, 1.2, 1.6], r: z });
      list.push({ x: 174, y: 2.7, z, s: [1.5, 1.2, 1.6], r: z });
    }
    for (let x = 128; x <= 172; x += 1.9) list.push({ x, y: 2.7, z: -292, s: [1.6, 1.2, 1.5], r: x });
    return list;
  }, []);
  const pathStones = useMemo(() => {
    const rand = random(7);
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    for (let z = -198; z > -250; z -= 0.85)
      for (let c = -2; c <= 2; c++) {
        const x = 150 + c * 0.85 + (Math.round(z / 0.85) % 2) * 0.25;
        list.push({
          p: new T.Vector3(x, 2.06, z),
          s: new T.Vector3(0.66 + rand() * 0.1, 0.12, 0.68 + rand() * 0.09),
          r: (rand() - 0.5) * 0.14,
        });
      }
    return list;
  }, []);
  const trees = useMemo(() => {
    const r = random(31);
    const spots: [number, number][] = [
      [122, -222],
      [128, -240],
      [124, -262],
      [176, -226],
      [172, -248],
      [178, -268],
      [136, -276],
      [164, -280],
    ];
    return spots
      .map(([x, z]) => ({ x, y: 2, z, s: 0.75 + r() * 0.4, r: r() * 6.28 }));
  }, []);
  const plaque = useMemo(() => plaqueTexture("The Courtyard", "Fountain of the Builder", ""), []);
  return (
    <group>
      <Bushes items={hedgeItems} seed={21} hue={0.28} lightness={0.15} />
      <Stones items={pathStones} material={stone} shadows={false} />
      <InstancedModel url="/assets/tree.glb" height={13} placements={trees} maxDistance={60} />
      <mesh position={[150, 2.1, -237.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 1.6]} />
        <meshStandardMaterial map={plaque} roughness={0.9} />
      </mesh>
      {[-186, -191].map((z, i) => (
        <Lantern key={z} light={i === 0} position={[144, 2, z]} />
      ))}
      <Lantern position={[156, 2, -196]} />
      <Lantern position={[144.5, 2, -244]} />
      <Lantern position={[155.5, 2, -244]} />
    </group>
  );
}

function Moat() {
  const y = 1.35;
  return (
    <group>
      <SimpleWater width={90} depth={6} position={[150, y, -303.5]} color="#37524d" />
      <SimpleWater width={90} depth={6} position={[150, y, -199.5]} color="#37524d" />
      <SimpleWater width={6} depth={90} position={[99.5, y, -252]} color="#37524d" />
      <SimpleWater width={6} depth={90} position={[200.5, y, -252]} color="#37524d" />
      <Bridge />
    </group>
  );
}

function Bridge() {
  const stone = useSurface("cobblestone_floor_08", 3);
  const pieces = useMemo(() => {
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    for (let z = -210; z < -196; z += 0.9) {
      list.push({ p: new T.Vector3(146.6, 1.9, z), s: new T.Vector3(0.75, 0.5, 0.8), r: 0 });
      list.push({ p: new T.Vector3(153.4, 1.9, z), s: new T.Vector3(0.75, 0.5, 0.8), r: 0 });
      list.push({ p: new T.Vector3(150, 2.0, z), s: new T.Vector3(6.2, 0.24, 0.85), r: 0 });
    }
    for (const z of [-209.4, -196.6])
      for (const x of [146.6, 153.4])
        list.push({ p: new T.Vector3(x, 2.7, z), s: new T.Vector3(0.5, 1.2, 0.5), r: 0 });
    return list;
  }, []);
  return <Stones items={pieces} material={stone} />;
}

function ApproachTerrain() {
  return <TerrainMesh width={420} depth={340} center={[150, -240]} heightFn={castleGround} colorFn={castleColor} segments={140} />;
}

export default function CastleWorld() {
  const quality = useStore((s) => s.quality);
  return (
    <>
      <color attach="background" args={["#d3c2a4"]} />
      <fog attach="fog" args={["#d3c2a4", 80, 420]} />
      <Sky sunPosition={[-60, 16, -85]} turbidity={5} rayleigh={2.4} mieCoefficient={0.008} mieDirectionalG={0.85} />
      <hemisphereLight args={["#eadbbf", "#38402c", 1.25]} />
      <directionalLight
        position={[-45, 32, -20]}
        intensity={3.3}
        color="#ffd9a0"
        castShadow={quality !== "low"}
        shadow-mapSize={[quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-far={200}
        shadow-normalBias={0.04}
        shadow-bias={-0.00016}
      />
      <CastleMountains />
      <ApproachTerrain />
      <Moat />
      <Walls />
      <Gatehouse />
      <Keep />
      <Fountain />
      <Statue />
      <CourtyardDressing />
      <CastleNature />
      <GateSign />
      <DustMotes count={60} area={[160, 18, 160]} center={[150, 10, -240]} />
    </>
  );
}

function GateSign() {
  const tex = useMemo(() => plaqueTexture("The Castle", "Gallery & Living Archives within", ""), []);
  return (
    <mesh position={[150, 6.2, CASTLE.gateZ + 1.8]}>
      <planeGeometry args={[6.4, 3.2]} />
      <meshStandardMaterial map={tex} roughness={0.85} />
    </mesh>
  );
}
