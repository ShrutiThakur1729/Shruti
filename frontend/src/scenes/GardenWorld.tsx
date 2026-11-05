import { useMemo, useRef, useEffect, useLayoutEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as T from "three";
import { GARDEN, gardenGround, random, noise } from "./terrain";
import {
  blockGeometry,
  useSurface,
  InstancedModel,
  Stones,
  Lantern,
  DustMotes,
  Fireflies,
  SimpleWater,
  TerrainMesh,
} from "./shared/Props";
import { plaqueTexture } from "./shared/textures";
import { useStore } from "../state/store";
import { gardenNotes } from "../data/content";
import GuestbookNotes from "./GuestbookNotes";

function GardenTerrain() {
  return (
    <TerrainMesh
      width={130}
      depth={130}
      center={[GARDEN.cx, GARDEN.cz]}
      heightFn={gardenGround}
      segments={110}
      colorFn={(x, z) => {
        const l = 0.5 + noise(x * 0.09, z * 0.09) * 0.2;
        const c = new T.Color().setHSL(0.24, 0.32, l);
        return `#${c.getHexString()}`;
      }}
    />
  );
}

function HedgeWall() {
  const hedgeItems = useMemo(() => {
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    const n = 56;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = GARDEN.cx + Math.cos(a) * GARDEN.radius;
      const z = GARDEN.cz + Math.sin(a) * GARDEN.radius;
      list.push({
        p: new T.Vector3(x, gardenGround(x, z) + 1.4, z),
        s: new T.Vector3(4.6, 3.2, 2.2),
        r: -a,
      });
    }
    return list;
  }, []);
  const material = useMemo(
    () => new T.MeshStandardMaterial({ color: "#2e4a30", roughness: 1 }),
    []
  );
  return <Stones items={hedgeItems} material={material} shadows={false} />;
}

function OldTree() {
  const bark = useSurface("bark_brown_02", 3);
  const trunk = useMemo(() => {
    const lines = [
      [[0, 0, 0], [0.5, 5, -0.3], [1.6, 11, -0.9], [3.6, 18, -1.2], [5.6, 24, -2]],
      [[1.4, 8, 0.2], [-2.4, 13, 1], [-8, 16, 2], [-13, 18, 3]],
      [[2.2, 12, -0.6], [5.6, 16, -1.2], [10.4, 19, -2.4], [16, 20, -3.6]],
      [[1.2, 7, 0.4], [3.6, 12, 4.6], [7, 16, 8], [9.4, 20, 10]],
      [[0, 0.2, 0], [-3.6, 0, 2.4], [-6, -0.3, 6]],
      [[0, 0.2, 0], [2.4, 0.1, 2.4], [6, -0.3, 3.6]],
    ];
    return lines.map((line, i) => {
      const c = new T.CatmullRomCurve3(line.map((p) => new T.Vector3(...p)));
      const g = new T.TubeGeometry(c, 40, i === 0 ? 1.5 : i < 4 ? 0.6 : 0.42, 10, false);
      const a = g.attributes.position;
      for (let j = 0; j < a.count; j++) {
        const t = Math.floor(j / 11) / 40,
          center = c.getPointAt(Math.min(1, t));
        const v = new T.Vector3()
          .fromBufferAttribute(a, j)
          .sub(center)
          .multiplyScalar(1 - t * 0.7)
          .add(center);
        a.setXYZ(j, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      return g;
    });
  }, []);
  const canopies = useMemo(() => {
    const r = random(5);
    return Array.from({ length: 7 }, (_, i) => ({
      p: new T.Vector3(
        GARDEN.tree.x + (r() - 0.5) * 22,
        gardenGround(GARDEN.tree.x, GARDEN.tree.z) + 21 + r() * 8,
        GARDEN.tree.z + (r() - 0.5) * 20
      ),
      s: 4.5 + r() * 3.5,
    }));
  }, []);
  return (
    <group>
      <group position={[GARDEN.tree.x, gardenGround(GARDEN.tree.x, GARDEN.tree.z), GARDEN.tree.z]}>
        {trunk.map((g, i) => (
          <mesh key={i} geometry={g} material={bark} castShadow receiveShadow />
        ))}
      </group>
      {canopies.map((c, i) => (
        <mesh key={i} position={c.p} scale={[c.s, c.s * 0.72, c.s]} castShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={i % 2 ? "#3a5a2e" : "#31492a"} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Pond() {
  const { pond } = GARDEN;
  const lilies = useMemo(() => {
    const r = random(21);
    return Array.from({ length: 14 }, () => {
      const a = r() * Math.PI * 2,
        d = 2 + r() * (pond.r - 3.4);
      return { x: pond.x + Math.cos(a) * d, z: pond.z + Math.sin(a) * d, s: 0.5 + r() * 0.7, lotus: r() > 0.6 };
    });
  }, [pond]);
  const reeds = useMemo(() => {
    const r = random(66);
    return Array.from({ length: 90 }, () => {
      const a = r() * Math.PI * 2,
        d = pond.r - 0.5 - r() * 2;
      return { x: pond.x + Math.cos(a) * d, z: pond.z + Math.sin(a) * d, s: 0.5 + r() * 0.9, r: r() * 6.28 };
    });
  }, [pond]);
  return (
    <group>
      <SimpleWater
        width={pond.r * 2}
        depth={pond.r * 2}
        position={[pond.x, pond.water, pond.z]}
        circle
        color="#3d5c56"
      />
      {lilies.map((l, i) => (
        <group key={i} position={[l.x, pond.water + 0.04, l.z]} scale={l.s}>
          <mesh rotation={[-Math.PI / 2, 0, r2(i)]}>
            <cylinderGeometry args={[0.42, 0.42, 0.04, 10]} />
            <meshStandardMaterial color="#4a6e3a" roughness={0.8} />
          </mesh>
          {l.lotus && (
            <mesh position={[0, 0.14, 0]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshStandardMaterial color="#d8a0b0" roughness={0.6} emissive="#a86878" emissiveIntensity={0.25} />
            </mesh>
          )}
        </group>
      ))}
      <Reeds items={reeds} />
      <Waterfall />
      <PondBridge />
    </group>
  );
}

const r2 = (i: number) => (i * 2.399) % Math.PI;

function Reeds({ items }: { items: { x: number; z: number; s: number; r: number }[] }) {
  const ref = useRef<T.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = new T.PlaneGeometry(0.09, 1.5, 1, 3);
    g.translate(0, 0.75, 0);
    return g;
  }, []);
  useLayoutEffect(() => {
    const o = new T.Object3D();
    items.forEach((it, i) => {
      o.position.set(it.x, GARDEN.pond.water - 0.3, it.z);
      o.rotation.set(0, it.r, (Math.random() - 0.5) * 0.2);
      o.scale.setScalar(it.s);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
      ref.current!.setColorAt(i, new T.Color().setHSL(0.22, 0.4, 0.28 + (i % 5) * 0.05));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]}>
      <meshStandardMaterial side={T.DoubleSide} roughness={1} />
    </instancedMesh>
  );
}

function Waterfall() {
  const ref = useRef<T.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current)
      (ref.current.material as T.MeshStandardMaterial).opacity =
        0.5 + Math.sin(clock.elapsedTime * 3.2) * 0.08;
  });
  const w = GARDEN.waterfall;
  return (
    <group position={[w.x, gardenGround(w.x, w.z), w.z]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 1.2 - 1.2, 1.1 + i * 0.4, -i * 0.6]} scale={[2.4 - i * 0.4, 2, 2 - i * 0.3]} castShadow>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#5c6a5e" roughness={1} flatShading />
        </mesh>
      ))}
      <mesh ref={ref} position={[0, 1.4, 0.8]}>
        <planeGeometry args={[1.6, 3.4, 6, 14]} />
        <meshStandardMaterial color="#d7e8db" transparent opacity={0.6} roughness={0.3} side={T.DoubleSide} />
      </mesh>
    </group>
  );
}

function PondBridge() {
  const wood = useSurface("bark_brown_02", 2);
  const planks = useMemo(() => {
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    let i = 0;
    for (let x = -165.6; x <= -157.4; x += 0.62) {
      const t = (x + 165.6) / 8.2;
      const y = 1.35 + Math.sin(t * Math.PI) * 0.42;
      list.push({ p: new T.Vector3(x, y, -141), s: new T.Vector3(0.6, 0.14, 2.1), r: 0 });
      if (i % 3 === 0) {
        list.push({ p: new T.Vector3(x, y + 0.5, -142.1), s: new T.Vector3(0.12, 1, 0.12), r: 0 });
        list.push({ p: new T.Vector3(x, y + 0.5, -139.9), s: new T.Vector3(0.12, 1, 0.12), r: 0 });
      }
      if (i % 3 === 1) list.push({ p: new T.Vector3(x, y + 1, -142.1), s: new T.Vector3(0.12, 0.12, 2.4), r: 0 });
      if (i % 3 === 1) list.push({ p: new T.Vector3(x, y + 1, -139.9), s: new T.Vector3(0.12, 0.12, 2.4), r: 0 });
      i++;
    }
    return list;
  }, []);
  return <Stones items={planks} material={wood} />;
}

function Gazebo() {
  const g = GARDEN.gazebo;
  const y = gardenGround(g.x, g.z) + 0.3;
  return (
    <group position={[g.x, y, g.z]}>
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[3.1, 3.3, 0.3, 14]} />
        <meshStandardMaterial color="#8d8477" roughness={0.95} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.5, 1.55, Math.sin(a) * 2.5]} castShadow>
            <cylinderGeometry args={[0.14, 0.16, 3.1, 8]} />
            <meshStandardMaterial color="#e8ddc2" roughness={0.8} />
          </mesh>
        );
      })}
      <mesh position={[0, 3.35, 0]} castShadow>
        <sphereGeometry args={[2.9, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.85} side={T.DoubleSide} />
      </mesh>
      <mesh position={[0, 6.3, 0]}>
        <sphereGeometry args={[0.24, 10, 10]} />
        <meshStandardMaterial color="#c9a75c" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.9, 0.14, 8, 20]} />
        <meshStandardMaterial color="#6b5335" roughness={0.8} />
      </mesh>
      <Lantern position={[2.9, 0.2, 1.6]} light />
      <Bench />
    </group>
  );
}

function Bench() {
  return (
    <group position={[0, 0.3, 1.6]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[2.4, 0.12, 0.55]} />
        <meshStandardMaterial color="#7a5a3a" roughness={0.8} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1, 0.12, 0]}>
          <boxGeometry args={[0.14, 0.35, 0.5]} />
          <meshStandardMaterial color="#5a4230" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 0.75, 0.26]} rotation={[-0.2, 0, 0]} castShadow>
        <boxGeometry args={[2.4, 0.7, 0.09]} />
        <meshStandardMaterial color="#7a5a3a" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Conservatory() {
  const c = GARDEN.conservatory;
  const y = gardenGround(c.x, c.z);
  const frameItems = useMemo(() => {
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    const w = c.w,
      d = c.d;
    for (const sx of [-1, 1])
      for (let i = 0; i <= 4; i++)
        list.push({
          p: new T.Vector3(c.x + sx * w, y + i * 1.05, c.z - d + (i / 4) * 2 * d),
          s: new T.Vector3(0.14, 0.14, 0.14),
          r: 0,
        });
    for (let i = 0; i <= 5; i++)
      for (const sx of [-1, 1])
        list.push({
          p: new T.Vector3(c.x + sx * w, y + 2.2, c.z - d + (i / 5) * 2 * d),
          s: new T.Vector3(0.16, 0.16, 0.16),
          r: 0,
        });
    return list;
  }, []);
  const plants = useMemo(() => {
    const r = random(15);
    return Array.from({ length: 26 }, () => {
      const x = c.x + (r() - 0.5) * 8;
      const z = c.z + (r() - 0.5) * 6;
      return { x, y: gardenGround(x, z), z, s: 0.4 + r() * 0.7, r: r() * 6.28 };
    });
  }, []);
  return (
    <group>
      {/* glass walls */}
      {[c.z - c.d, c.z + c.d].map((z) => (
        <mesh key={z} position={[c.x, y + 2.1, z]}>
          <boxGeometry args={[c.w * 2, 4.2, 0.08]} />
          <meshPhysicalMaterial color="#bcd8d0" transparent opacity={0.28} roughness={0.1} metalness={0.1} />
        </mesh>
      ))}
      {[c.x - c.w, c.x + c.w].map((x) => (
        <mesh key={x} position={[x, y + 2.1, c.z]}>
          <boxGeometry args={[0.08, 4.2, c.d * 2]} />
          <meshPhysicalMaterial color="#bcd8d0" transparent opacity={0.28} roughness={0.1} metalness={0.1} />
        </mesh>
      ))}
      {/* arched roof */}
      <mesh position={[c.x, y + 4.2, c.z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[c.d, c.d, c.w * 2, 14, 1, true, 0, Math.PI]} />
        <meshPhysicalMaterial color="#bcd8d0" transparent opacity={0.24} roughness={0.1} side={T.DoubleSide} />
      </mesh>
      <Stones items={frameItems} material={useFrameOnce()} shadows={false} />
      <InstancedModel url="/assets/fern-lod.glb" height={0.32} placements={plants} shadows={false} />
      <pointLight position={[c.x, y + 2.6, c.z]} intensity={10} distance={11} decay={2} color="#ffd9a0" />
      <mesh position={[c.x, y + 0.06, c.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[c.w * 2 - 0.4, c.d * 2 - 0.4]} />
        <meshStandardMaterial color="#cbb89a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function useFrameOnce() {
  return useMemo(() => new T.MeshStandardMaterial({ color: "#6b5335", roughness: 0.7, metalness: 0.3 }), []);
}

function RoseArches() {
  const arches: { x: number; z: number; ry: number }[] = [
    { x: -170, z: -128, ry: 0 },
    { x: -170, z: -136, ry: 0 },
    { x: -172, z: -147, ry: Math.PI / 2 },
    { x: -166, z: -147, ry: Math.PI / 2 },
  ];
  const flowers = useMemo(() => {
    const r = random(41);
    const list: { p: T.Vector3; c: T.Color }[] = [];
    const cols = ["#c86a7a", "#b04a5a", "#d89aa8", "#a86a9a", "#e8d9a3"];
    for (const a of arches) {
      const [gx, gz] = [a.x, a.z];
      const along = a.ry === 0 ? "x" : "z";
      for (let t = 0; t <= 1; t += 0.08) {
        const ang = t * Math.PI;
        const h = Math.sin(ang) * 3.2;
        const off = Math.cos(ang) * 2.4;
        const px = along === "x" ? gx + off : gx + (r() - 0.5) * 0.6;
        const pz = along === "x" ? gz + (r() - 0.5) * 0.6 : gz + off;
        const n = 1 + Math.floor(r() * 3);
        for (let k = 0; k < n; k++)
          list.push({
            p: new T.Vector3(px + (r() - 0.5) * 0.5, h + 0.4 + r() * 0.5, pz + (r() - 0.5) * 0.5),
            c: new T.Color(cols[Math.floor(r() * cols.length)]),
          });
      }
    }
    return list;
  }, []);
  const ref = useRef<T.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new T.Object3D();
    flowers.forEach((f, i) => {
      o.position.copy(f.p);
      o.scale.setScalar(0.16 + (i % 4) * 0.03);
      o.rotation.set(i, i * 2, 0);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
      ref.current!.setColorAt(i, f.c);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [flowers]);
  return (
    <group>
      {arches.map((a, i) => (
        <mesh key={i} position={[a.x, gardenGround(a.x, a.z), a.z]} rotation={[0, a.ry, 0]} scale={[1, 1, 1]} castShadow>
          <torusGeometry args={[2.4, 0.12, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#5a4a3a" roughness={0.85} />
        </mesh>
      ))}
      <instancedMesh ref={ref} args={[undefined, undefined, flowers.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </group>
  );
}

function Nooks() {
  const stone = useSurface("cobblestone_floor_08", 2);
  const notes = Object.entries(gardenNotes);
  return (
    <group>
      {/* reading nook under the tree */}
      <group position={[-175, gardenGround(-175, -146), -146]}>
        <Bench />
        <mesh position={[1.7, 0.55, 0.3]} castShadow>
          <cylinderGeometry args={[0.4, 0.34, 0.7, 10]} />
          <primitive object={stone} attach="material" />
        </mesh>
        <mesh position={[1.7, 0.95, 0.3]} rotation={[-0.4, 0.3, 0]}>
          <boxGeometry args={[0.5, 0.06, 0.36]} />
          <meshStandardMaterial color="#e8ddc2" roughness={0.85} />
        </mesh>
        <Lantern position={[2.6, 0.1, 0.8]} />
      </group>
      {/* poetry nook */}
      <group position={[-165, gardenGround(-165, -153), -153]}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.1, 0.9]} />
          <meshStandardMaterial color="#6b5335" roughness={0.7} />
        </mesh>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} position={[x, 0.24, 0]} castShadow>
            <boxGeometry args={[0.12, 0.5, 0.8]} />
            <meshStandardMaterial color="#54422c" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[-0.3, 0.58, 0.1]} rotation={[-0.35, 0.2, 0]}>
          <planeGeometry args={[0.5, 0.36]} />
          <meshStandardMaterial color="#efe3c2" roughness={0.9} side={T.DoubleSide} />
        </mesh>
        <mesh position={[0.4, 0.62, 0]} rotation={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.02, 0.03, 0.5, 6]} />
          <meshStandardMaterial color="#e8d9a3" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.14, 0.7]} castShadow>
          <cylinderGeometry args={[0.28, 0.22, 0.3, 10]} />
          <meshStandardMaterial color="#6b5335" roughness={0.8} />
        </mesh>
        <Lantern position={[-1.4, 0.1, 0.6]} />
      </group>
      {/* gramophone */}
      <group position={[-179, gardenGround(-179, -137), -137]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1, 0.8, 1]} />
          <primitive object={stone} attach="material" />
        </mesh>
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.7, 0.3, 0.7]} />
          <meshStandardMaterial color="#5a3d28" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.5, 0]} rotation={[0.7, 0, 0]} castShadow>
          <coneGeometry args={[0.42, 0.9, 16, 1, true]} />
          <meshStandardMaterial color="#c9a75c" metalness={0.9} roughness={0.25} side={T.DoubleSide} />
        </mesh>
        <mesh position={[0.3, 1.02, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          <meshStandardMaterial color="#c9a75c" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      {/* discovery stones */}
      {notes.map(([id], i) => {
        const pos = [
          [-172, -124],
          [-166, -128],
          [-176, -157],
          [-162, -150],
        ][i];
        const tex = plaqueTexture(gardenNotes[id].title, "Press E", "");
        return (
          <group key={id} position={[pos[0], gardenGround(pos[0], pos[1]), pos[1]]} data-testid={`scene-note-${id}`}>
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.42, 0.55, 1.1, 8]} />
              <primitive object={stone} attach="material" />
            </mesh>
            <mesh position={[0, 1.45, 0]} rotation={[-0.3, 0, 0]}>
              <planeGeometry args={[1.15, 0.6]} />
              <meshStandardMaterial map={tex} roughness={0.85} />
            </mesh>
            <mesh position={[0, 2.15, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshStandardMaterial color="#ffe9b0" emissive="#ffca6e" emissiveIntensity={2.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GardenDressing() {
  const flowers = useMemo(() => {
    const r = random(77);
    return Array.from({ length: 700 }, () => {
      const a = r() * Math.PI * 2,
        d = r() * (GARDEN.radius - 3);
      const x = GARDEN.cx + Math.cos(a) * d,
        z = GARDEN.cz + Math.sin(a) * d;
      return { x, y: gardenGround(x, z), z, s: 0.06 + r() * 0.1, c: r() };
    });
  }, []);
  const ref = useRef<T.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new T.Object3D();
    flowers.forEach((f, i) => {
      o.position.set(f.x, f.y + 0.12, f.z);
      o.scale.setScalar(f.s);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
      ref.current!.setColorAt(
        i,
        new T.Color().setHSL(f.c > 0.75 ? 0.02 : f.c > 0.5 ? 0.09 : 0.85, 0.55, 0.62)
      );
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [flowers]);
  const lanternSpots: [number, number][] = [
    [-170, -122],
    [-167, -131],
    [-174, -139],
    [-163, -145],
    [-176, -150],
  ];
  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, flowers.length]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      {lanternSpots.map(([x, z], i) => (
        <Lantern key={i} light={i === 1} position={[x, gardenGround(x, z), z]} />
      ))}
      <GateArch />
      <InstancedModel
        url="/assets/tree.glb"
        height={11}
        placements={useMemo(() => {
          const r = random(9);
          return [
            { x: -186, z: -132, y: 0, s: 0.8, r: r() * 6 },
            { x: -158, z: -128, y: 0, s: 0.7, r: r() * 6 },
          ].map((p) => ({ x: p.x, y: gardenGround(p.x, p.z), z: p.z, s: p.s, r: p.r }));
        }, [])}
        maxDistance={70}
      />
    </group>
  );
}

function GateArch() {
  const stone = useSurface("cobblestone_floor_08", 2);
  const x = GARDEN.cx,
    z = GARDEN.gateZ;
  return (
    <group position={[x, gardenGround(x, z), z]}>
      {[-2.4, 2.4].map((side) => (
        <mesh key={side} position={[side, 1.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 3.4, 0.7]} />
          <primitive object={stone} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, 3.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 5.5, 10]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <Lantern position={[2.9, 0.1, 0.4]} light />
    </group>
  );
}

export default function GardenWorld() {
  const quality = useStore((s) => s.quality);
  return (
    <>
      <color attach="background" args={["#d8b98a"]} />
      <fog attach="fog" args={["#d8b98a", 55, 220]} />
      <Sky sunPosition={[70, 8, -60]} turbidity={5} rayleigh={2.6} mieCoefficient={0.012} />
      <hemisphereLight args={["#e8c9a0", "#3a3226", 1.1]} />
      <directionalLight
        position={[50, 24, -30]}
        intensity={2.6}
        color="#ffc98a"
        castShadow={quality !== "low"}
        shadow-mapSize={[quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024]}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-far={160}
        shadow-normalBias={0.04}
      />
      <GardenTerrain />
      <HedgeWall />
      <OldTree />
      <Pond />
      <Gazebo />
      <Conservatory />
      <RoseArches />
      <Nooks />
      <GardenDressing />
      <GuestbookNotes />
      <Fireflies center={[GARDEN.cx, 2, GARDEN.cz]} radius={26} />
      <DustMotes count={40} area={[60, 10, 60]} center={[GARDEN.cx, 6, GARDEN.cz]} color="#ffe9b8" size={0.03} />
    </>
  );
}
