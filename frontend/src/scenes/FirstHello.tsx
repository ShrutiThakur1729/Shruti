import { memo, useMemo, useRef, useEffect, useLayoutEffect, Suspense } from "react";
import LoadingCourt from './LoadingCourt';
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as T from "three";
import {
  groundHeight,
  pathX,
  riverX,
  bridgeHeight,
  random,
} from "./terrain";
import {
  blockGeometry,
  useSurface,
  InstancedModel,
  Stones,
  Lantern,
  Banner,
  DustMotes,
} from "./shared/Props";
import { useStore } from "../state/store";

function Mountains() {
  const geometry = useMemo(() => {
    const g = new T.PlaneGeometry(950, 480, 160, 100);
    g.rotateX(-Math.PI / 2);
    g.translate(0, -6, -330);
    const p = g.attributes.position,
      colors = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      const ridge = Math.pow(Math.max(0, Math.sin(((z + 580) / 480) * Math.PI)), 1.4);
      const h =
        ridge *
        (28 +
          Math.pow(noiseRidge(x, z), 2) * 210 +
          Math.abs(Math.sin(x * 0.03) + Math.cos(z * 0.027)) * 24 +
          groundHeight(x * 0.2, z * 0.2) * 1.4);
      p.setY(i, h - 3);
      const c = new T.Color(
        h > 83 + groundHeight(x * 0.04, z * 0.04) * 18
          ? "#c4c9c3"
          : h > 70
            ? "#697879"
            : "#465d56"
      );
      c.multiplyScalar(0.75 + groundHeight(x * 0.17, z * 0.15) * 0.06);
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

// stable ridge noise for mountains
function noiseRidge(x: number, z: number) {
  const v = Math.sin(x * 0.012) * Math.cos(z * 0.013) + Math.sin(x * 0.031 + 1.7) * 0.5;
  return Math.abs(v) * 0.62;
}

function Terrain() {
  const material = useSurface("forest_ground_04", 65);
  const geometry = useMemo(() => {
    const g = new T.PlaneGeometry(400, 460, 100, 110);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -90);
    const p = g.attributes.position,
      colors = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      p.setY(i, groundHeight(x, z));
      const c = new T.Color().setHSL(
        0.2,
        0.23,
        0.65 + Math.abs(Math.sin(x * 0.08 + z * 0.06)) * 0.22
      );
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => {
    material.vertexColors = true;
  }, [material]);
  return <mesh geometry={geometry} material={material} receiveShadow />;
}

function Path() {
  const stone = useSurface("cobblestone_floor_08");
  const items = useMemo(() => {
    const rand = random(52),
      list = [];
    for (let z = -84; z < 53; z += 0.76) {
      for (let column = -4; column <= 4; column++) {
        const x = pathX(z) + column * 0.72 + (Math.round(z / 0.76) % 2) * 0.28;
        list.push({
          p: new T.Vector3(x, groundHeight(x, z) + 0.045, z),
          s: new T.Vector3(0.61 + rand() * 0.1, 0.13 + rand() * 0.08, 0.65 + rand() * 0.08),
          r: (rand() - 0.5) * 0.16,
        });
      }
    }
    return list;
  }, []);
  return <Stones items={items} material={stone} />;
}

function Arch() {
  const stone = useSurface("cobblestone_floor_08");
  const x = pathX(-12),
    y = groundHeight(x, -12);
  const parts = useMemo(() => {
    const p = [];
    for (const side of [-1, 1]) {
      for (let row = 0; row < 11; row++)
        for (let col = 0; col < 2; col++)
          p.push({
            p: new T.Vector3(side * 4 + (col - 0.5) * 0.86, row * 0.57 + 0.3, 0),
            s: new T.Vector3(0.83, 0.54, 1.7),
            r: 0,
          });
      for (let row = 0; row < 4; row++)
        p.push({
          p: new T.Vector3(side * 4, 8 + row * 0.5, 0),
          s: new T.Vector3(1.8 - row * 0.3, 0.45, 1.8 - row * 0.3),
          r: 0,
        });
      p.push({ p: new T.Vector3(side * 4, 6.6, 0), s: new T.Vector3(2.4, 0.4, 2.2), r: 0 });
    }
    return p;
  }, []);
  const ring = useMemo(() => {
    const shape = new T.Shape();
    shape.absarc(0, 6, 4.8, 0, Math.PI, false);
    shape.lineTo(-3.2, 6);
    shape.absarc(0, 6, 3.2, Math.PI, 0, true);
    shape.closePath();
    return new T.ExtrudeGeometry(shape, {
      depth: 1.8,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.045,
      bevelThickness: 0.04,
      curveSegments: 48,
    });
  }, []);
  return (
    <group position={[x, y, -12]}>
      <Stones items={parts} material={stone} />
      <mesh geometry={ring} material={stone} position={[0, 0, -0.9]} castShadow receiveShadow />
      {Array.from({ length: 23 }, (_, i) => {
        const a = (i / 22) * Math.PI;
        return (
          <mesh
            key={i}
            geometry={blockGeometry}
            position={[Math.cos(a) * 4.1, 6 + Math.sin(a) * 4.1, 0.02]}
            rotation={[0, 0, a - Math.PI / 2]}
            scale={[0.48, 1.56, 1.94]}
            material={stone}
            castShadow
            receiveShadow
          />
        );
      })}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 5.8, 5, 0.1]}>
            <cylinderGeometry args={[0.065, 0.065, 5, 10]} />
            <meshStandardMaterial color="#3e3024" />
          </mesh>
          <mesh position={[side * 5.1, 6.5, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 1.8, 8]} />
            <meshStandardMaterial color="#3e3024" />
          </mesh>
          <Banner position={[side * 5.1, 3.9, 0.25]} label="S" bg="#763d35" />
          <Lantern position={[side * 3.9, 0.2, 1.35]} />
        </group>
      ))}
    </group>
  );
}

function Bridge() {
  const stone = useSurface("cobblestone_floor_08");
  const pieces = useMemo(() => {
    const p = [];
    for (let x = 10; x <= 44; x += 0.82) {
      const y = bridgeHeight(x);
      for (const z of [-31.7, -26.3])
        for (let row = 0; row < 2; row++)
          p.push({
            p: new T.Vector3(x, y + 0.35 + row * 0.4, z),
            s: new T.Vector3(0.8, 0.38, 0.55),
            r: 0,
          });
      for (let z = -31.2; z < -26.5; z += 0.75)
        p.push({ p: new T.Vector3(x, y, z), s: new T.Vector3(0.8, 0.2, 0.72), r: 0 });
    }
    return p;
  }, []);
  const arc = useMemo(() => {
    const shape = new T.Shape();
    shape.moveTo(-17, 0);
    shape.quadraticCurveTo(0, 9, 17, 0);
    shape.lineTo(17, -2);
    shape.quadraticCurveTo(0, 6, -17, -2);
    shape.closePath();
    return new T.ExtrudeGeometry(shape, { depth: 5.4, bevelEnabled: false, curveSegments: 48 });
  }, []);
  return (
    <>
      <Stones items={pieces} material={stone} />
      <mesh geometry={arc} position={[27, 3, -31.7]} material={stone} castShadow receiveShadow />
      {[12, 22, 32, 42].map((x) => (
        <Lantern key={x} position={[x, bridgeHeight(x) + 0.7, -31.7]} />
      ))}
    </>
  );
}

function River() {
  const water = useMemo(() => {
    const vertices = [],
      uv = [],
      indices = [];
    for (let i = 0; i <= 120; i++) {
      const z = 70 - i * 2;
      for (const side of [-1, 1]) {
        vertices.push(riverX(z) + side * 6.4, 0.15, z);
        uv.push((side + 1) / 2, i / 12);
      }
      if (i < 120) {
        const n = i * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    const data = new Uint8Array(128 * 128 * 4);
    for (let j = 0; j < 128; j++)
      for (let i = 0; i < 128; i++) {
        const n = (j * 128 + i) * 4;
        data[n] = 128 + Math.sin(i * 0.4 + j * 0.2) * 24;
        data[n + 1] = 128 + Math.cos(j * 0.3 - i * 0.3) * 24;
        data[n + 2] = 250;
        data[n + 3] = 255;
      }
    const normal = new T.DataTexture(data, 128, 128);
    normal.wrapS = normal.wrapT = T.RepeatWrapping;
    normal.needsUpdate = true;
    g.rotateX(Math.PI / 2);
    // lightweight animated water (no per-frame reflection pass)
    const material = new T.MeshStandardMaterial({
      color: "#2f5a54",
      normalMap: normal,
      metalness: 0.55,
      roughness: 0.16,
      transparent: true,
      opacity: 0.94,
    });
    const mat = material;
    mat.normalMap!.repeat.set(6, 40);
    const mesh = new T.Mesh(g, mat);
    const update = (dt: number) => {
      mat.normalMap!.offset.x += dt * 0.02;
      mat.normalMap!.offset.y += dt * 0.013;
    };    (mesh as unknown as { tick?: (dt: number) => void }).tick = update;
    return mesh;
  }, []);
  useEffect(() => () => { water.geometry.dispose(); const m=water.material as T.MeshStandardMaterial; m.normalMap?.dispose(); m.dispose(); }, [water]);
  useFrame((_, dt) => {
    (water as unknown as { tick?: (dt: number) => void }).tick?.(dt);
  });
  return <primitive object={water} />;
}

function Foliage() {
  const trees = useMemo(() => {
    const r = random(12),
      p = [];
    for (let i = 0; i < 70; i++) {
      const x = r() * 220 - 110,
        z = r() * 250 - 170;
      if (
        Math.abs(x - pathX(z)) < 9 ||
        Math.abs(x - riverX(z)) < 12 ||
        (Math.abs(z + 29) < 5 && x > 7 && x < 48)
      )
        continue;
      p.push({ x, y: groundHeight(x, z) - 0.1, z, s: 0.6 + r() * 0.85, r: r() * 6.28 });
    }
    return p;
  }, []);
  const rocks = useMemo(() => {
    const r = random(45),
      p = [];
    for (let i = 0; i < 80; i++) {
      const z = 45 - r() * 175,
        x = riverX(z) + (r() > 0.5 ? 1 : -1) * (6 + r() * 6);
      p.push({ x, y: groundHeight(x, z) - 0.4, z, s: 0.35 + r() * 0.9, r: r() * 7 });
    }
    return p;
  }, []);
  const ferns = useMemo(() => {
    const r = random(9),
      p = [];
    for (let i = 0; i < 240; i++) {
      const z = 40 - r() * 110,
        x = pathX(z) + (r() > 0.5 ? 1 : -1) * (4 + r() * 9);
      if (Math.abs(x - riverX(z)) < 8) continue;
      p.push({ x, y: groundHeight(x, z), z, s: 0.4 + r() * 0.8, r: r() * 6.28 });
    }
    return p;
  }, []);
  return (
    <>
      <InstancedModel url="/assets/tree-lod.glb" height={15} placements={trees} maxDistance={28} wind />
      <InstancedModel url="/assets/tree-lod.glb" height={15} placements={trees} minDistance={28} shadows={false} />
      <InstancedModel
        url="/assets/tree-lod.glb"
        height={20}
        placements={[{ x: -19, y: groundHeight(-19, 19) - 0.3, z: 19, s: 1, r: 2.2 }]}
        wind
      />
      <InstancedModel url="/assets/rocks-lod.glb" height={2.2} placements={rocks} maxDistance={16} />
      <InstancedModel url="/assets/rocks-lod.glb" height={2.2} placements={rocks} minDistance={16} shadows={false} />
      <InstancedModel url="/assets/fern-lod.glb" height={0.28} placements={ferns} wind shadows={false} />
      <GroundCover />
    </>
  );
}

function GroundCover() {
  const ref = useRef<T.InstancedMesh>(null),
    flowers = useRef<T.InstancedMesh>(null);
  const quality = useStore((s) => s.quality);
  const count = quality === "high" ? 13000 : quality === "medium" ? 6500 : 3200;
  const geometry = useMemo(() => {
    const g = new T.PlaneGeometry(0.075, 0.7, 1, 3);
    g.translate(0, 0.35, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.pow(p.getY(i), 2) * 0.4);
    g.computeVertexNormals();
    return g;
  }, []);
  useLayoutEffect(() => {
    const r = random(89),
      o = new T.Object3D();
    for (let i = 0; i < count; i++) {
      const z = 48 - r() * 135,
        x = pathX(z) + (r() > 0.5 ? 1 : -1) * (3.7 + r() * 23);
      o.position.set(x, groundHeight(x, z), z);
      o.rotation.set(0, r() * 7, 0);
      o.scale.setScalar(0.45 + r() * 1.1);
      if (Math.abs(x - riverX(z)) < 7) o.scale.setScalar(0);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
      ref.current!.setColorAt(i, new T.Color().setHSL(0.18 + r() * 0.08, 0.35, 0.22 + r() * 0.2));
      if (i < count * 0.058) {
        o.position.y += 0.45;
        o.scale.setScalar(0.08 + r() * 0.08);
        o.updateMatrix();
        flowers.current!.setMatrixAt(i, o.matrix);
        flowers.current!.setColorAt(i, new T.Color(i % 3 ? "#c6b8d5" : "#e8d9a3"));
      }
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    flowers.current!.instanceMatrix.needsUpdate = true;
  }, [count]);
  return (
    <>
      <instancedMesh key={`g${count}`} ref={ref} args={[geometry, undefined, count]} receiveShadow>
        <meshStandardMaterial side={T.DoubleSide} roughness={1} />
      </instancedMesh>
      <instancedMesh key={`f${count}`} ref={flowers} args={[undefined, undefined, Math.ceil(count * 0.058)]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
    </>
  );
}

function Discoveries() {
  const stone = useSurface("cobblestone_floor_08");
  const nearby = useStore((s) => s.nearby);
  return (
    <>
      {[
        { pos: [-5, 4] as const, id: "hello-story" as const, book: true },
        { pos: [4, -6] as const, id: "hello-atlas" as const, book: false },
      ].map(({ pos: [x, z], id, book }) => (
        <group key={id} position={[x, groundHeight(x, z), z]} data-testid={`scene-${id}`}>
          <mesh geometry={blockGeometry} scale={[1.2, 1.5, 1]} position={[0, 0.75, 0]} material={stone} castShadow />
          {book ? (
            <mesh position={[0, 1.6, 0]} rotation={[-0.25, 0, 0]} castShadow>
              <boxGeometry args={[1.3, 0.12, 0.9]} />
              <meshStandardMaterial color="#d8c89c" roughness={0.9} />
            </mesh>
          ) : (
            <group position={[0, 2, 0]}>
              <mesh>
                <sphereGeometry args={[0.45, 32, 24]} />
                <meshStandardMaterial color="#5b8a81" metalness={0.65} roughness={0.26} />
              </mesh>
              <mesh rotation={[0.4, 0, 0.3]}>
                <torusGeometry args={[0.6, 0.035, 10, 48]} />
                <meshStandardMaterial color="#b9a06b" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          )}
          {nearby?.id === id && (
            <mesh position={[0, 2.9, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color="#ffd98a" emissive="#ffca60" emissiveIntensity={3} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}

function Village() {
  return (
    <group position={[55, 9, -115]}>
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i} position={[(i % 3) * 7, 0, Math.floor(i / 3) * 8]} rotation={[0, (i % 2) * 0.3, 0]}>
          <mesh position={[0, 2.5, 0]} castShadow>
            <boxGeometry args={[4.8, 5, 6]} />
            <meshStandardMaterial color="#c7b799" />
          </mesh>
          <mesh position={[0, 6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[4.5, 3.6, 4]} />
            <meshStandardMaterial color="#725044" />
          </mesh>
          {[-1.3, 1.3].map((x) => (
            <mesh key={x} position={[x, 3, 3.02]}>
              <planeGeometry args={[0.6, 1.2]} />
              <meshStandardMaterial color="#efcf83" emissive="#d29a4d" emissiveIntensity={0.4} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Waterfall() {
  const ref = useRef<T.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current)
      (ref.current.material as T.MeshStandardMaterial).opacity =
        0.55 + Math.sin(clock.elapsedTime * 3) * 0.06;
  });
  return (
    <group position={[43, 1, -145]}>
      <mesh position={[-3, 10, -3]} scale={[12, 22, 8]}>
        <dodecahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#667466" roughness={1} />
      </mesh>
      <mesh ref={ref} position={[0, 10, 2]}>
        <planeGeometry args={[2.8, 21, 8, 30]} />
        <meshStandardMaterial color="#d7e8db" transparent opacity={0.6} roughness={0.3} side={T.DoubleSide} />
      </mesh>
    </group>
  );
}

function Ready() {
  const { gl, scene } = useThreeSafe();
  useEffect(() => {
    if (!gl) return;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    scene.userData.assetStatus = "loaded";
    return () => { gl.shadowMap.autoUpdate = true; gl.shadowMap.needsUpdate = true; };
  }, [gl, scene]);
  return null;
}

import { useThree } from "@react-three/fiber";
function useThreeSafe() {
  return useThree();
}

export default memo(function FirstHello() {
  const quality = useStore((s) => s.quality);
  return (
    <>
      <color attach="background" args={["#b9c7c4"]} />
      <fog attach="fog" args={["#b9c7c4", 100, 450]} />
      <Sky sunPosition={[-80, 32, -90]} turbidity={3.4} rayleigh={1.8} />
      <hemisphereLight args={["#d1e1eb", "#45412b", 1.6]} />
      <directionalLight
        position={[-32, 40, -32]}
        intensity={3.6}
        color="#ffdb9b"
        castShadow={quality !== "low"}
        shadow-mapSize={[quality === "high" ? 2048 : 1024, quality === "high" ? 2048 : 1024]}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-camera-far={180}
        shadow-normalBias={0.035}
        shadow-bias={-0.00015}
      />
      <Mountains />
      <River />
      <Suspense fallback={<LoadingCourt/>}>
      <HeroTree />
      <Terrain />
      <Path />
      <Arch />
      <Bridge />
      <Foliage />
      <Village />
      <Waterfall />
      <DustMotes />
      {[-3, 12, 27, -27].map((z) => (
        <Lantern
          key={z}
          light={Math.abs(z - 12) < 1}
          position={[pathX(z) + 4.4, groundHeight(pathX(z) + 4.4, z), z]}
        />
      ))}
      <Discoveries />
      <Ready />
      </Suspense>
    </>
  );
});

function HeroTree() {
  const bark = useSurface("bark_brown_02", 3);
  const curves = useMemo(() => {
    const lines = [
      [[0, 0, 0], [0.4, 4, -0.2], [1.3, 9, -0.7], [3, 15, -1], [5, 20, -2]],
      [[1, 7, 0], [-2, 11, 1], [-7, 13, 2], [-11, 14, 3]],
      [[2, 10, -0.5], [5, 13, -1], [9, 15, -2], [15, 15, -3]],
      [[1, 6, 0], [3, 10, 4], [6, 13, 7], [8, 17, 8]],
      [[0, 0.2, 0], [-3, 0, 2], [-5, -0.3, 5]],
      [[0, 0.2, 0], [2, 0.1, 2], [5, -0.3, 3]],
      [[0, 0.2, 0], [-2, 0.1, -3], [-4, -0.4, -6]],
    ];
    return lines.map((line, i) => {
      const c = new T.CatmullRomCurve3(line.map((p) => new T.Vector3(...p)));
      const g = new T.TubeGeometry(c, 48, i === 0 ? 1.3 : i < 4 ? 0.55 : 0.4, 12, false);
      const a = g.attributes.position;
      for (let j = 0; j < a.count; j++) {
        const t = Math.floor(j / 13) / 48,
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
  return (
    <group position={[-19, groundHeight(-19, 19), 19]}>
      {curves.map((g, i) => (
        <mesh key={i} geometry={g} material={bark} castShadow receiveShadow />
      ))}
    </group>
  );
}
