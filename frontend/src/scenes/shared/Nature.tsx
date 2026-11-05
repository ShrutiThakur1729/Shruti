import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useStore } from "../../state/store";
import { random, noise } from "../terrain";

type Sampler = (r: () => number) => [number, number] | null;

const bladeGeometry = (() => {
  const g = new T.PlaneGeometry(0.075, 0.7, 1, 3);
  g.translate(0, 0.35, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.pow(p.getY(i), 2) * 0.4);
  g.computeVertexNormals();
  return g;
})();

const swayMaterial = (() => {
  const m = new T.MeshStandardMaterial({ side: T.DoubleSide, roughness: 1 });
  const uniforms = { uTime: { value: 0 } };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float sway = sin(uTime * 1.6 + instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.27) * 0.12;
        transformed.x += sway * position.y * position.y * 2.0;`
      );
  };
  return { m, uniforms };
})();

export function GrassField({
  seed,
  sample,
  heightFn,
  density = 1,
  hue = 0.22,
  flowerColors = ["#e8d9a3", "#c6b8d5"],
  flowerRatio = 0.05,
}: {
  seed: number;
  sample: Sampler;
  heightFn: (x: number, z: number) => number;
  density?: number;
  hue?: number;
  flowerColors?: string[];
  flowerRatio?: number;
}) {
  const quality = useStore((s) => s.quality);
  const count = Math.round((quality === "high" ? 12000 : quality === "medium" ? 6000 : 3000) * density);
  const flowerCount = Math.ceil(count * flowerRatio);
  const grass = useRef<T.InstancedMesh>(null);
  const flowers = useRef<T.InstancedMesh>(null);
  useLayoutEffect(() => {
    const r = random(seed);
    const o = new T.Object3D();
    const colors = flowerColors.map((c) => new T.Color(c));
    let f = 0;
    for (let i = 0; i < count; i++) {
      let pt: [number, number] | null = null;
      for (let tries = 0; tries < 6 && !pt; tries++) pt = sample(r);
      const [x, z] = pt ?? [0, -9999];
      o.position.set(x, heightFn(x, z), z);
      o.rotation.set(0, r() * 7, 0);
      o.scale.setScalar(pt ? 0.45 + r() * 1.1 : 0);
      o.updateMatrix();
      grass.current!.setMatrixAt(i, o.matrix);
      const patch = noise(x * 0.07, z * 0.07);
      grass.current!.setColorAt(i, new T.Color().setHSL(hue + r() * 0.06 - patch * 0.03, 0.38 + patch * 0.1, 0.2 + r() * 0.17));
      if (f < flowerCount && pt && r() < flowerRatio * 1.4) {
        o.position.y += 0.42 * o.scale.x + 0.05;
        o.scale.setScalar(0.045 + r() * 0.04);
        o.updateMatrix();
        flowers.current!.setMatrixAt(f, o.matrix);
        flowers.current!.setColorAt(f, colors[Math.floor(r() * colors.length)]);
        f++;
      }
    }
    flowers.current!.count = f;
    grass.current!.instanceMatrix.needsUpdate = true;
    flowers.current!.instanceMatrix.needsUpdate = true;
  }, [count, seed, sample, heightFn, hue, flowerColors, flowerCount, flowerRatio]);
  useFrame(({ clock }) => {
    swayMaterial.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <>
      <instancedMesh key={`g${count}`} ref={grass} args={[bladeGeometry, swayMaterial.m, count]} receiveShadow />
      <instancedMesh key={`f${count}`} ref={flowers} args={[undefined, undefined, flowerCount]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.7} emissive="#2a1a10" emissiveIntensity={0.15} />
      </instancedMesh>
    </>
  );
}

export type Bush = { x: number; y: number; z: number; s: [number, number, number]; r: number };

export function Bushes({ items, seed = 3, hue = 0.28, lightness = 0.2, shadows = true }: { items: Bush[]; seed?: number; hue?: number; lightness?: number; shadows?: boolean }) {
  const ref = useRef<T.InstancedMesh>(null);
  const geometry = useMemo(() => {
    const base = new T.IcosahedronGeometry(1, 3);
    base.deleteAttribute("normal");
    base.deleteAttribute("uv");
    const g = mergeVertices(base);
    const p = g.attributes.position;
    const v = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = 1 + noise(v.x * 2.4 + 3, v.z * 2.4 + v.y * 1.7) * 0.22 + Math.sin(v.x * 9 + v.y * 7) * 0.05;
      v.multiplyScalar(n);
      if (v.y < -0.3) v.y = -0.3 + (v.y + 0.3) * 0.3;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useLayoutEffect(() => {
    const r = random(seed);
    const o = new T.Object3D();
    items.forEach((b, i) => {
      o.position.set(b.x, b.y, b.z);
      o.rotation.set(0, b.r, 0);
      o.scale.set(...b.s);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
      ref.current!.setColorAt(i, new T.Color().setHSL(hue + (r() - 0.5) * 0.05, 0.42, lightness + r() * 0.08));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [items, seed, hue, lightness]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} castShadow={shadows} receiveShadow>
      <meshStandardMaterial roughness={0.95} />
    </instancedMesh>
  );
}

export function Torch({ position, light = true }: { position: [number, number, number]; light?: boolean }) {
  const flame = useRef<T.Mesh>(null);
  const glow = useRef<T.PointLight>(null);
  const phase = useMemo(() => Math.random() * 10, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 9 + phase;
    const f = 0.85 + Math.sin(t) * 0.08 + Math.sin(t * 2.3) * 0.06 + Math.sin(t * 5.1) * 0.04;
    if (flame.current) flame.current.scale.set(1, f * 1.1, 1);
    if (glow.current) glow.current.intensity = 9 * f;
  });
  return (
    <group position={position}>
      <mesh position={[0, -0.35, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#3b2a1c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.13, 0.08, 0.14, 8]} />
        <meshStandardMaterial color="#2a2620" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh ref={flame} position={[0, 0.25, 0]}>
        <coneGeometry args={[0.12, 0.42, 8]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ff8a2a" emissiveIntensity={3.2} toneMapped={false} transparent opacity={0.92} />
      </mesh>
      {light && <pointLight ref={glow} position={[0, 0.5, 0.3]} color="#ffa04a" distance={11} decay={2} intensity={9} />}
    </group>
  );
}

export function treeRing(seed: number, cx: number, cz: number, inner: number, outer: number, count: number, heightFn: (x: number, z: number) => number) {
  const r = random(seed);
  return Array.from({ length: count }, () => {
    const a = r() * Math.PI * 2;
    const d = inner + r() * (outer - inner);
    const x = cx + Math.cos(a) * d;
    const z = cz + Math.sin(a) * d;
    return { x, y: heightFn(x, z) - 0.2, z, s: 0.7 + r() * 0.7, r: r() * 6.28 };
  });
}
