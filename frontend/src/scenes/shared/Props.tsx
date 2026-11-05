import { memo, useMemo, useLayoutEffect, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture, useGLTF } from "@react-three/drei";
import * as T from "three";

export type Placement = { x: number; y: number; z: number; s: number; r: number };

export const blockGeometry = (() => {
  const shape = new T.Shape();
  shape.moveTo(-0.42, -0.42);
  shape.lineTo(0.42, -0.42);
  shape.lineTo(0.42, 0.42);
  shape.lineTo(-0.42, 0.42);
  shape.closePath();
  const g = new T.ExtrudeGeometry(shape, {
    depth: 0.84,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 1,
    steps: 1,
  });
  g.translate(0, 0, -0.42);
  return g;
})();

export function useSurface(name: string, repeat = 1) {
  const maps = useTexture([
    `/assets/${name}_diff.jpg`,
    `/assets/${name}_nor_gl.jpg`,
    `/assets/${name}_rough.jpg`,
  ]);
  return useMemo(() => {
    const copies = maps.map((m, i) => {
      const t = m.clone();
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(repeat, repeat);
      t.anisotropy = 4;
      if (i === 0) t.colorSpace = T.SRGBColorSpace;
      return t;
    });
    return new T.MeshStandardMaterial({
      map: copies[0],
      normalMap: copies[1],
      roughnessMap: copies[2],
      roughness: 1,
      normalScale: new T.Vector2(0.7, 0.7),
    });
  }, [maps[0], maps[1], maps[2], repeat]);
}

export function InstancedModel({
  url,
  placements,
  height,
  wind = false,
  minDistance = 0,
  maxDistance = Infinity,
  shadows = true,
}: {
  url: string;
  placements: Placement[];
  height: number;
  wind?: boolean;
  minDistance?: number;
  maxDistance?: number;
  shadows?: boolean;
}) {
  const { scene } = useGLTF(url);
  const { scene: original } = useGLTF(url.replace("-lod", ""));
  const shared = useMemo(() => {
    const materials = new Map<string, T.Material>();
    original.traverse((o) => {
      if (o instanceof T.Mesh)
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          materials.set(m.name, m);
    });
    return materials;
  }, [original]);
  const root = useRef<T.Group>(null);
  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new T.Box3().setFromObject(scene),
      size = box.getSize(new T.Vector3()),
      center = box.getCenter(new T.Vector3());
    const normalize = new T.Matrix4()
      .makeScale(height / size.y, height / size.y, height / size.y)
      .multiply(new T.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z));
    const list: { geometry: T.BufferGeometry; material: T.Material | T.Material[] }[] = [];
    scene.traverse((obj) => {
      if (obj instanceof T.Mesh) {
        const geometry = obj.geometry
          .clone()
          .applyMatrix4(normalize.clone().multiply(obj.matrixWorld));
        list.push({
          geometry,
          material: Array.isArray(obj.material)
            ? obj.material.map((m) => shared.get(m.name) || m)
            : shared.get(obj.material.name) || obj.material,
        });
      }
    });
    return list;
  }, [scene, height, shared]);
  const { camera } = useThree();
  const lastCamera = useRef(new T.Vector3(999, 999, 999));
  const update = () => {
    root.current?.children.forEach((child) => {
      const mesh = child as T.InstancedMesh;
      const obj = new T.Object3D();
      let count = 0;
      for (const p of placements) {
        const d = Math.hypot(p.x - camera.position.x, p.z - camera.position.z);
        if (d < minDistance || d >= maxDistance) continue;
        obj.position.set(p.x, p.y, p.z);
        obj.scale.setScalar(p.s);
        obj.rotation.set(0, p.r, 0);
        obj.updateMatrix();
        mesh.setMatrixAt(count++, obj.matrix);
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (count) mesh.computeBoundingSphere();
    });
    lastCamera.current.copy(camera.position);
  };
  useLayoutEffect(update, [placements, parts]);
  useFrame(() => {
    if (camera.position.distanceToSquared(lastCamera.current) > 25) update();
  });
  useFrame(({ clock }) => {
    if (wind && root.current)
      root.current.rotation.z = Math.sin(clock.elapsedTime * 0.35) * 0.0009;
  });
  return (
    <group ref={root}>
      {parts.map((p, i) => (
        <instancedMesh
          key={i}
          args={[p.geometry, p.material, placements.length]}
          castShadow={shadows}
          receiveShadow={shadows}
        />
      ))}
    </group>
  );
}

export function Stones({
  items,
  material,
  shadows = true,
}: {
  items: { p: T.Vector3; s: T.Vector3; r?: number }[];
  material: T.Material;
  shadows?: boolean;
}) {
  const ref = useRef<T.InstancedMesh>(null);
  useLayoutEffect(() => {
    const obj = new T.Object3D();
    items.forEach((v, i) => {
      obj.position.copy(v.p);
      obj.scale.copy(v.s);
      obj.rotation.set(0, v.r ?? 0, 0);
      obj.updateMatrix();
      ref.current!.setMatrixAt(i, obj.matrix);
      const c = new T.Color().setHSL(0.1, 0.07, 0.65 + (i % 7) * 0.045);
      ref.current!.setColorAt(i, c);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      args={[blockGeometry, material, items.length]}
      castShadow={shadows}
      receiveShadow={shadows}
    />
  );
}

export const Lantern = memo(function Lantern({
  position,
  light = false,
}: {
  position: [number, number, number];
  light?: boolean;
}) {
  const ref = useRef<T.PointLight>(null);
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.intensity = 3.4 + Math.sin(clock.elapsedTime * 8 + position[0]) * 0.3;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} geometry={blockGeometry} scale={[0.85, 1.2, 0.8]} castShadow>
        <meshStandardMaterial color="#797968" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.3, 0]} geometry={blockGeometry} scale={[1.05, 0.18, 0.95]} castShadow>
        <meshStandardMaterial color="#a4a08a" />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[0.42, 0.75, 0.42]} />
        <meshStandardMaterial
          color="#ffdf95"
          emissive="#ffb94e"
          emissiveIntensity={2.5}
          transparent
          opacity={0.88}
        />
      </mesh>
      {[-0.27, 0.27].flatMap((x) =>
        [-0.27, 0.27].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.88, z]}>
            <boxGeometry args={[0.045, 0.95, 0.045]} />
            <meshStandardMaterial color="#3b3224" metalness={0.8} roughness={0.3} />
          </mesh>
        ))
      )}
      <mesh position={[0, 2.48, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.51, 0.5, 4]} />
        <meshStandardMaterial color="#3b3224" metalness={0.8} roughness={0.4} />
      </mesh>
      {light && (
        <pointLight
          ref={ref}
          position={[0, 2, 0]}
          color="#ffbd63"
          intensity={3.4}
          distance={10}
          decay={2}
        />
      )}
    </group>
  );
});

import { bannerTexture } from "./textures";

export function Banner({
  position,
  label,
  bg,
}: {
  position: [number, number, number];
  label: string;
  bg?: string;
}) {
  const tex = useMemo(() => bannerTexture(label, bg), [label, bg]);
  const geometry = useMemo(() => new T.PlaneGeometry(0.95, 2.5, 8, 18), []);
  useFrame(({ clock }) => {
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++)
      p.setZ(
        i,
        Math.sin(p.getX(i) * 3 + clock.elapsedTime * 1.4 + p.getY(i)) *
          Math.max(0, 1.25 - p.getY(i)) *
          0.06
      );
    p.needsUpdate = true;
    geometry.computeVertexNormals();
  });
  return (
    <group position={position}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial map={tex} roughness={1} side={T.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.35, 0.02]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.16, 0.02, 6, 4]} />
        <meshStandardMaterial color="#c5ad70" metalness={0.6} />
      </mesh>
    </group>
  );
}

export function DustMotes({
  count = 90,
  area = [60, 15, 120] as [number, number, number],
  center = [0, 6, 0] as [number, number, number],
  color = "#ffe3a3",
  size = 0.035,
}: {
  count?: number;
  area?: [number, number, number];
  center?: [number, number, number];
  color?: string;
  size?: number;
}) {
  const ref = useRef<T.Points>(null);
  const positions = useMemo(() => {
    const v: number[] = [];
    for (let i = 0; i < count; i++)
      v.push(
        center[0] + (Math.random() - 0.5) * area[0],
        center[1] + (Math.random() - 0.5) * area[1],
        center[2] + (Math.random() - 0.5) * area[2]
      );
    return new Float32Array(v);
  }, [count, area, center]);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.25) * 0.4;
      ref.current.rotation.y = clock.elapsedTime * 0.003;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={size} color={color} transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

export function Fireflies({ count = 60, center = [0, 2, 0] as [number, number, number], radius = 30 }) {
  const ref = useRef<T.Points>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        a: Math.random() * Math.PI * 2,
        r: 4 + Math.random() * radius,
        h: 0.6 + Math.random() * 3.2,
        sp: 0.1 + Math.random() * 0.3,
        ph: (i / count) * Math.PI * 2,
      })),
    [count, radius]
  );
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      const wob = Math.sin(t * s.sp + s.ph);
      positions[i * 3] = center[0] + Math.cos(s.a + t * 0.05) * s.r + wob * 0.6;
      positions[i * 3 + 1] = center[1] + s.h + Math.sin(t * 0.4 + s.ph) * 0.5;
      positions[i * 3 + 2] = center[2] + Math.sin(s.a + t * 0.05) * s.r + Math.cos(t * 0.3 + s.ph) * 0.6;
    });
    ref.current!.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color="#ffe89b"
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={T.AdditiveBlending}
      />
    </points>
  );
}

export function SimpleWater({
  width,
  depth,
  position,
  color = "#3d6a62",
  circle = false,
  segments = 4,
}: {
  width: number;
  depth: number;
  position: [number, number, number];
  color?: string;
  circle?: boolean;
  segments?: number;
}) {
  const normal = useMemo(() => {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    for (let j = 0; j < size; j++)
      for (let i = 0; i < size; i++) {
        const n = (j * size + i) * 4;
        data[n] = 128 + Math.sin(i * 0.4 + j * 0.2) * 24;
        data[n + 1] = 128 + Math.cos(j * 0.3 - i * 0.3) * 24;
        data[n + 2] = 250;
        data[n + 3] = 255;
      }
    const tex = new T.DataTexture(data, size, size);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }, []);
  const matRef = useRef<T.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    if (!matRef.current) return;
    const t = matRef.current.normalMap!.offset;
    t.x += dt * 0.015;
    t.y += dt * 0.011;
  });
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {circle ? (
        <circleGeometry args={[width / 2, 40]} />
      ) : (
        <planeGeometry args={[width, depth, segments, segments]} />
      )}
      <meshStandardMaterial
        ref={matRef}
        color={color}
        normalMap={normal}
        metalness={0.55}
        roughness={0.18}
        transparent
        opacity={0.93}
      />
    </mesh>
  );
}

export function TerrainMesh({
  width,
  depth,
  center,
  heightFn,
  colorFn,
  segments = 130,
}: {
  width: number;
  depth: number;
  center: [number, number];
  heightFn: (x: number, z: number) => number;
  colorFn?: (x: number, z: number, h: number) => string;
  segments?: number;
}) {
  const material = useSurface("forest_ground_04", 55);
  const geometry = useMemo(() => {
    const g = new T.PlaneGeometry(width, depth, segments, segments);
    g.rotateX(-Math.PI / 2);
    g.translate(center[0], 0, center[1]);
    const p = g.attributes.position;
    const colors: number[] = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i);
      const h = heightFn(x, z);
      p.setY(i, h);
      const c = new T.Color(
        colorFn
          ? colorFn(x, z, h)
          : new T.Color().setHSL(0.2, 0.23, 0.62 + noise2(x * 0.08, z * 0.08) * 0.22)
      );
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [width, depth, center, heightFn, colorFn, segments]);
  useEffect(() => {
    material.vertexColors = true;
  }, [material]);
  return <mesh geometry={geometry} material={material} receiveShadow />;
}

import { noise, random } from "../terrain";
function noise2(x: number, z: number) {
  return noise(x, z);
}

export { random, noise };
