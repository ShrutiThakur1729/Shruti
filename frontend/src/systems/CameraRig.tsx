import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore, type WorldId } from "../state/store";
import { getGround, canStand, footstepMaterial } from "../scenes/terrain";
import { getWorld, type Point } from "../data/worlds";
import { flightPoint, flightDuration } from "./travel";
import { nearbyInteraction } from "../data/interactions";
import { input, bindInput } from "./input";
import { audio } from "../audio/AudioEngine";

export type Journey = { to: WorldId; serial: number };

const ZONE_ENTRY: Record<string, { position: Point; lookAt: Point }> = {
  hall: { position: [0, 2.2, 25], lookAt: [0, 5, -18] },
  gallery: { position: [0, 2.2, 7], lookAt: [0, 3, -18] },
  library: { position: [0, 2.2, 7], lookAt: [0, 3, -18] },
};

const CASTLE_DOORSTEP: { position: Point; lookAt: Point } = { position: [150, 6, -198], lookAt: [150, 10, -214] };

export default function CameraRig() {
  const { camera, gl } = useThree();
  const angles = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const velocity = useRef(new THREE.Vector3());
  const travel = useRef<{
    start: Point;
    time: number;
    duration: number;
    end: Point;
    lookAt: Point;
  } | null>(null);
  const landing = useRef<{ position: Point; lookAt: Point } | null>(null);
  const moving = useRef(false);
  const quat = useRef(new THREE.Quaternion());

  // place camera at the current world arrival on mount
  useEffect(() => {
    bindInput();
    const w = getWorld(useStore.getState().world);
    camera.position.fromArray(w.arrival);
    camera.lookAt(...w.lookAt);
    angles.current.setFromQuaternion(camera.quaternion, "YXZ");
  }, [camera]);

  // arrive at new world
  const world = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
  const journey = useStore((s) => s.journey);
  useEffect(() => {
    if (zone) return;
    const w = getWorld(world);
    const at = landing.current ?? { position: w.arrival, lookAt: w.lookAt };
    landing.current = null;
    camera.position.fromArray(at.position);
    camera.lookAt(...at.lookAt);
    angles.current.setFromQuaternion(camera.quaternion, "YXZ");
    quat.current.copy(camera.quaternion);
  }, [world, camera]);

  // interior teleports
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        position: Point;
        lookAt: Point;
      };
      camera.position.fromArray(detail.position);
      camera.lookAt(...detail.lookAt);
      angles.current.setFromQuaternion(camera.quaternion, "YXZ");
      quat.current.copy(camera.quaternion);
    };
    window.addEventListener("twi-teleport", handler);
    return () => window.removeEventListener("twi-teleport", handler);
  }, [camera]);

  // journey start
  useEffect(() => {
    if (!journey) return;
    const dest = getWorld(journey.to);
    const v = journey.view;
    const target = !v
      ? { position: dest.arrival, lookAt: dest.lookAt }
      : v.zone
        ? CASTLE_DOORSTEP
        : { position: v.position, lookAt: v.lookAt };
    travel.current = {
      start: camera.position.toArray() as Point,
      time: 0,
      duration: flightDuration(camera.position.toArray() as Point, target.position),
      end: target.position,
      lookAt: target.lookAt,
    };
    velocity.current.set(0, 0, 0);
    audio.playSfx("travel");
  }, [journey, camera]);

  // pointer lock (desktop)
  const blocked = useStore((s) => !!s.panel || !!s.journey || s.phase !== "world");
  useEffect(() => {
    if (blocked) {
      input.keys.clear();
      velocity.current.set(0, 0, 0);
      audio.stopFootsteps();
      moving.current = false;
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }, [blocked]);

  useEffect(() => {
    const lock = () => {
      const st = useStore.getState();
      if (st.phase === "world" && !st.panel && !st.journey && !isTouch())
        gl.domElement.requestPointerLock()?.catch(() => {});
    };
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return;
      input.look.dx -= e.movementX * 0.0021;
      input.look.dy -= e.movementY * 0.0021;
    };
    gl.domElement.addEventListener("click", lock);
    document.addEventListener("mousemove", onMove);
    return () => {
      gl.domElement.removeEventListener("click", lock);
      document.removeEventListener("mousemove", onMove);
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const st = useStore.getState();
    const flight = travel.current;

    if (flight && st.journey) {
      flight.time += dt;
      const t = Math.min(1, flight.time / flight.duration);
      const p = flightPoint(flight.start, flight.end, t);
      const k = input.keys;
      const vertical =
        ((k.has("Space") ? 1 : 0) - (k.has("ControlLeft") ? 1 : 0)) * dt * 10;
      p[1] += THREE.MathUtils.clamp(
        vertical * Math.sin(Math.PI * t) * 4,
        -12,
        12
      );
      camera.position.fromArray(p);
      const ahead = flightPoint(flight.start, flight.end, Math.min(1, t + 0.03));
      camera.lookAt(...ahead);
      camera.rotateZ(Math.sin(t * Math.PI * 2) * 0.03);
      const target = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          new THREE.Vector3(...flight.end),
          new THREE.Vector3(...flight.lookAt),
          new THREE.Vector3(0, 1, 0)
        )
      );
      camera.quaternion.slerp(target, Math.max(0, (t - 0.8) / 0.2));
      if (t >= 1) {
        camera.position.fromArray(flight.end);
        camera.lookAt(...flight.lookAt);
        angles.current.setFromQuaternion(camera.quaternion, "YXZ");
        quat.current.copy(camera.quaternion);
        landing.current = { position: flight.end, lookAt: flight.lookAt };
        travel.current = null;
        st.arrive();
        if (st.journey && (st.journey.to === st.world || st.journey.view?.zone)) landing.current = null;
      }
      return;
    }

    if (st.phase !== "world" || st.panel || st.journey) return;

    // look (mouse via input.look, touch look writes deltas too)
    angles.current.y += input.look.dx;
    angles.current.x = THREE.MathUtils.clamp(
      angles.current.x + input.look.dy,
      -1.35,
      1.35
    );
    input.look.dx = 0;
    input.look.dy = 0;

    const k = input.keys;
    let fx = 0;
    let fz = 0;
    if (k.has("KeyW") || k.has("ArrowUp")) fz -= 1;
    if (k.has("KeyS") || k.has("ArrowDown")) fz += 1;
    if (k.has("KeyA") || k.has("ArrowLeft")) fx -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) fx += 1;
    if (input.joy.active) {
      fx += input.joy.x;
      fz += input.joy.y;
    }
    const speed = (k.has("ShiftLeft") || k.has("ShiftRight") ? 12 : 6) * (st.world === "castle" && !st.zone ? 1.15 : 1);
    const direction = new THREE.Vector3(fx, 0, fz);
    if (direction.lengthSq() > 0)
      direction.normalize().multiplyScalar(speed).applyAxisAngle(new THREE.Vector3(0, 1, 0), angles.current.y);
    velocity.current.lerp(direction, 1 - Math.exp(-dt * 8));
    const next = camera.position.clone().addScaledVector(velocity.current, dt);
    const zone = st.zone;
    if (canStand(st.world, zone, next.x, next.z)) {
      camera.position.x = next.x;
      camera.position.z = next.z;
    }
    const targetY = getGround(st.world, zone, camera.position.x, camera.position.z) + 2.1;
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 8, dt);
    camera.quaternion.slerp(
      new THREE.Quaternion().setFromEuler(angles.current),
      1 - Math.exp(-dt * 20)
    );

    // footsteps
    const isMoving = velocity.current.lengthSq() > 1.2;
    if (isMoving !== moving.current) {
      moving.current = isMoving;
      if (isMoving) audio.startFootsteps(footstepMaterial(st.world, zone));
      else audio.stopFootsteps();
    }

    // nearby interaction
    const near = nearbyInteraction(st.world, zone, camera.position.x, camera.position.z);
    const current = st.nearby;
    if ((near?.id ?? null) !== (current?.id ?? null)) st.set({ nearby: near });
  });
  return null;
}

function isTouch() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
