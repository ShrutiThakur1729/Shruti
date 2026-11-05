import * as THREE from "three";
import { interiorFloor, interiorWalkable } from '../systems/castleLayout';

/* ————— shared noise ————— */
export function noise(x: number, z: number) {
  const hash = (a: number, b: number) => {
    const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const ix = Math.floor(x),
    iz = Math.floor(z),
    fx = x - ix,
    fz = z - iz,
    u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(hash(ix, iz), hash(ix + 1, iz), u),
    THREE.MathUtils.lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), u),
    v
  );
}

export function random(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/* ————— The First Hello ————— */
export const pathX = (z: number) => -4 + 4 * Math.sin((z + 10) * 0.045);
export const riverX = (z: number) => 23 + 9 * Math.sin((z + 35) * 0.023);

export function groundHeight(x: number, z: number) {
  const hills =
    1.5 + noise(x * 0.035, z * 0.035) * 5 + noise(x * 0.14, z * 0.14) * 0.8;
  const road = THREE.MathUtils.smoothstep(Math.abs(x - pathX(z)), 3.4, 8);
  let h = THREE.MathUtils.lerp(2.2 + Math.sin(z * 0.045) * 0.5, hills, road);
  const bank = THREE.MathUtils.smoothstep(Math.abs(x - riverX(z)), 5, 12);
  h = THREE.MathUtils.lerp(-2, h, bank);
  return h;
}

export const bridgeHeight = (x: number) =>
  3 + Math.sin(THREE.MathUtils.clamp((x - 10) / 34, 0, 1) * Math.PI) * 3;

export function walkHeight(x: number, z: number) {
  return Math.abs(z + 29) < 2.7 && x > 10 && x < 44
    ? bridgeHeight(x)
    : groundHeight(x, z);
}

export function canWalk(x: number, z: number) {
  if (x < -48 || x > 65 || z < -85 || z > 52) return false;
  if (Math.abs(x - riverX(z)) < 6 && !(Math.abs(z + 29) < 2.5 && x > 10 && x < 44))
    return false;
  const archCenter = pathX(-12);
  if (
    Math.abs(z + 12) < 1.6 &&
    Math.abs(x - archCenter) > 3.2 &&
    Math.abs(x - archCenter) < 5.4
  )
    return false;
  if (
    Math.hypot(x + 19, z - 19) < 2.3 ||
    Math.hypot(x + 5, z - 4) < 1.5 ||
    Math.hypot(x - 4, z + 6) < 1.4
  )
    return false;
  return true;
}

/* ————— The Castle ————— */
export const CASTLE = {
  cx: 150,
  cz: -252,
  half: 45, // wall ring: 90 x 90
  wallH: 9,
  gateZ: -207,
  gateHalf: 6,
  moatInner: 8,
  moatOuter: 14,
  bridgeX: 150,
  bridgeHalf: 4.2,
  keep: { x: 150, z: -262, r: 10.5 },
  fountain: { x: 150, z: -234, r: 3.4 },
  statue: { x: 138, z: -250, r: 1.6 },
};

function distToRect(x: number, z: number, x0: number, x1: number, z0: number, z1: number) {
  const dx = Math.max(x0 - x, 0, x - x1);
  const dz = Math.max(z0 - z, 0, z - z1);
  return Math.hypot(dx, dz);
}

export function castleGround(x: number, z: number) {
  const rolling = 1.2 + noise(x * 0.03, z * 0.03) * 3 + noise(x * 0.11, z * 0.11) * 0.5;
  const plateau = THREE.MathUtils.smoothstep(
    CASTLE.half + CASTLE.moatOuter + 4 - Math.abs(x - CASTLE.cx) * 0.6 -
      Math.abs(z - (CASTLE.cz + 45)) * 0.6,
    -20,
    20
  );
  const nearWalls = THREE.MathUtils.smoothstep(
    26 - distToRect(x, z, 105, 195, -297, -207),
    0,
    26
  );
  const flat = THREE.MathUtils.lerp(rolling, 2.0, Math.max(plateau, nearWalls));
  const approach = THREE.MathUtils.smoothstep(
    10 - Math.abs(x - 150),
    0,
    10
  );
  const roadFlat = THREE.MathUtils.lerp(flat, Math.min(flat, 2.2), approach * THREE.MathUtils.smoothstep(z + 165, -60, 40));
  const dMoat = distToRect(x, z, 105, 195, -297, -207);
  const inMoat = THREE.MathUtils.smoothstep(dMoat, CASTLE.moatOuter, CASTLE.moatInner);
  return THREE.MathUtils.lerp(roadFlat, -1.2, inMoat);
}

export function castleCanStand(x: number, z: number) {
  if (x < 60 || x > 245 || z < -320 || z > -160) return false;
  const dRect = distToRect(x, z, 105, 195, -297, -207);
  const inWalls = dRect === 0;
  // keep + towers
  if (Math.hypot(x - CASTLE.keep.x, z - CASTLE.keep.z) < CASTLE.keep.r) return false;
  if (Math.hypot(x - CASTLE.fountain.x, z - CASTLE.fountain.z) < CASTLE.fountain.r) return false;
  if (Math.hypot(x - CASTLE.statue.x, z - CASTLE.statue.z) < CASTLE.statue.r) return false;
  for (const tx of [105, 195]) for (const tz of [-297, -207, -252]) {
    if (Math.hypot(x - tx, z - tz) < 4) return false;
  }
  for (const tx of [140, 160]) {
    if (Math.hypot(x - tx, z + 207) < 4.4) return false;
  }
  const gateCorridor =
    Math.abs(x - 150) < CASTLE.gateHalf && z > -209 && z < -203;
  // wall band
  if (dRect < 3.2 && !gateCorridor && Math.abs(z + 207) < 26) return false;
  if (dRect < 3.2 && !gateCorridor && z >= -209 && z <= -203) return false;
  // moat
  const inMoat = dRect > CASTLE.moatInner && dRect < CASTLE.moatOuter;
  const onBridge =
    Math.abs(x - CASTLE.bridgeX) < CASTLE.bridgeHalf && z > -210 && z < -196;
  if (inMoat && !onBridge) return false;
  if (!inWalls && !inMoat && z < -203 && z > -209 && !gateCorridor) return false;
  return true;
}

export function castleWalkHeight(x: number, z: number) {
  const onBridge =
    Math.abs(x - CASTLE.bridgeX) < CASTLE.bridgeHalf && z > -210 && z < -196;
  if (onBridge) return 2.1;
  return Math.max(castleGround(x, z), 2.0);
}

/* ————— Castle interior (each zone is its own coordinates) ————— */
export const HALL = { x0: -15, x1: 15, z0: -30, z1: 30 };
export const WING = { x0: -14, x1: 14, z0: -22, z1: 10 };

export function interiorCanStand(zone: Zone_, x: number, z: number) {
  if (zone === "hall") {
    if (x < HALL.x0 + 1 || x > HALL.x1 - 1 || z < HALL.z0 || z > HALL.z1) return false;
    for (const px of [-10, 10])
      for (const pz of [-24, -16, -8, 0, 8, 16]) {
        if (Math.hypot(x - px, z - pz) < 1.6) return false;
      }
    // grand staircase (climbable ramp, center back)
    if (Math.abs(x) < 4.5 && z > -30 && z < -18) return true;
    return true;
  }
  if (x < WING.x0 + 1 || x > WING.x1 - 1 || z < WING.z0 || z > WING.z1) return false;
  if (zone === "gallery") {
    for (const ex of [-10, 10]) for (const ez of [-16, -6, -11, 1, 4]) {
      if (Math.hypot(x - ex, z - ez) < 1.8) return false;
    }
  }
  if (zone === "library") {
    for (const bx of [-8.2, -3.4, 3.4, 8.2]) {
      if (Math.hypot(x - bx, z + 14) < 1.6) return false;
    }
    for (const bx of [-5.8, 5.8]) {
      if (Math.hypot(x - bx, z - 2) < 1.6) return false;
    }
  }
  return true;
}

type Zone_ = "hall" | "gallery" | "library";
export const interiorHeight = (zone: Zone_) => (zone === "hall" ? 0.2 : 0.2);

/* ————— The Memory Garden ————— */
export const GARDEN = {
  cx: -170,
  cz: -145,
  radius: 40,
  gateZ: -118,
  tree: { x: -178, z: -150, r: 2.2 },
  pond: { x: -162, z: -141, r: 9.5, water: 0.55 },
  gazebo: { x: -182, z: -128 },
  conservatory: { x: -157, z: -160, w: 5.5, d: 4.2 },
  waterfall: { x: -155, z: -134 },
};

export function gardenGround(x: number, z: number) {
  const base = 0.6 + noise(x * 0.05, z * 0.05) * 1.1 + noise(x * 0.16, z * 0.16) * 0.3;
  const p = GARDEN.pond;
  const d = Math.hypot(x - p.x, z - p.z);
  const pond = THREE.MathUtils.smoothstep(d, p.r * 0.35, p.r);
  const gazD = Math.hypot(x - GARDEN.gazebo.x, z - GARDEN.gazebo.z);
  const mound = THREE.MathUtils.smoothstep(gazD, 8, 2) * 0.8;
  const h = THREE.MathUtils.lerp(p.water - 1.1, base, pond) + mound;
  return h;
}

export function gardenCanStand(x: number, z: number) {
  const dx = x - GARDEN.cx,
    dz = z - GARDEN.cz;
  if (Math.hypot(dx, dz) > GARDEN.radius - 1.6) return false;
  const p = GARDEN.pond;
  const dPond = Math.hypot(x - p.x, z - p.z);
  const onBridge = x > -166 && x < -157 && z > -146 && z < -136;
  if (dPond < p.r - 1 && !onBridge) return false;
  if (Math.hypot(x - GARDEN.tree.x, z - GARDEN.tree.z) < GARDEN.tree.r) return false;
  if (Math.hypot(x - GARDEN.waterfall.x, z - GARDEN.waterfall.z) < 2.4) return false;
  const c = GARDEN.conservatory;
  if (Math.abs(x - c.x) < c.w && Math.abs(z - c.z) < c.d) {
    // inside conservatory: only walk the central aisle
    if (Math.abs(x - c.x) < 1.6 || Math.abs(z - c.z) < 1.2) return true;
    return false;
  }
  return true;
}

export function gardenWalkHeight(x: number, z: number) {
  const p = GARDEN.pond;
  const onBridge = x > -166 && x < -157 && z > -146 && z < -136;
  if (onBridge) return 1.35;
  const gazD = Math.hypot(x - GARDEN.gazebo.x, z - GARDEN.gazebo.z);
  if (gazD < 3.4) return gardenGround(GARDEN.gazebo.x, GARDEN.gazebo.z) + 0.3;
  return Math.max(gardenGround(x, z), p.water + 0.15);
}

/* ————— unified API for the camera rig ————— */
import type { WorldId } from "../data/worlds";
import type { Zone } from "../state/store";

export function getGround(world: WorldId, zone: Zone | null, x: number, z: number) {
  if (world === "hello") return walkHeight(x, z);
  if (world === "castle") return zone ? interiorFloor(x,z) : castleWalkHeight(x, z);
  return gardenWalkHeight(x, z);
}

export function canStand(world: WorldId, zone: Zone | null, x: number, z: number) {
  if (world === "hello") return canWalk(x, z);
  if (world === "castle")
    return zone ? interiorWalkable(x,z) : castleCanStand(x, z);
  return gardenCanStand(x, z);
}

export function footstepMaterial(world: WorldId, zone: Zone | null): "stone" | "grass" | "wood" {
  if (world === "hello") return "grass";
  if (world === "castle") return zone ? "stone" : "stone";
  return "grass";
}
