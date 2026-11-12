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
import { interiorZone } from './castleLayout';
import { flightLimits, useFlight } from './freeFlight';

export type Journey = { to: WorldId; serial: number };

const ZONE_ENTRY: Record<string, { position: Point; lookAt: Point }> = {
  hall: { position: [0, 2.2, 25], lookAt: [0, 5, -18] },
  gallery: { position: [0, 2.2, 7], lookAt: [0, 3, -18] },
  library: { position: [0, 2.2, 7], lookAt: [0, 3, -18] },
};

const CASTLE_DOORSTEP: { position: Point; lookAt: Point } = { position: [150, 6, -198], lookAt: [150, 10, -214] };

export default function CameraRig() {
  const { camera, gl, size } = useThree();
  const galleryView = useStore(s => s.zone === "gallery");
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / Math.max(1, size.height);
      const defaultFov = aspect < 1 ? 75 : 55;
      const galleryFov = THREE.MathUtils.radToDeg(2 * Math.atan(10.8 / (25 * aspect)));
      camera.fov = galleryView ? Math.min(110, Math.max(defaultFov, galleryFov)) : defaultFov;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height, galleryView]);
  const angles = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  const velocity = useRef(new THREE.Vector3());
  const takeoff = useRef<THREE.Vector3 | null>(null);
  const pendingLift = useRef(0);
  function resetFlight() {
    takeoff.current = null;
    pendingLift.current = 0;
    velocity.current.set(0, 0, 0);
    useFlight.setState({active:false, lift:0});
  }
  const travel = useRef<{
    start: Point;
    time: number;
    duration: number;
    end: Point;
    lookAt: Point;
  } | null>(null);
  const landing = useRef<{ position: Point; lookAt: Point } | null>(null);
  const moving = useRef(false);
  const reportClock=useRef(0);
  const quat = useRef(new THREE.Quaternion());

  // place camera at the current world arrival on mount
  useEffect(() => {
    bindInput();
    const w = getWorld(useStore.getState().world);
    camera.position.fromArray(w.arrival);
    camera.lookAt(...w.lookAt);
    angles.current.setFromQuaternion(camera.quaternion, "YXZ");
    return resetFlight;
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
      resetFlight();
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
    resetFlight();
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
      input.gestureWalk = false;
      input.look.dx = 0; input.look.dy = 0;
      velocity.current.set(0, 0, 0);
      audio.stopFootsteps();
      moving.current = false;
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }, [blocked]);

  useEffect(() => {
    const canvas = gl.domElement;
    let drag: {id:number; x:number; y:number; moved:number} | null = null;
    let suppressClick = false;
    const down = (e: PointerEvent) => {
      const s = useStore.getState();
      if (e.button !== 0 || drag || s.phase !== 'world' || s.panel || s.journey) return;
      if (document.pointerLockElement === canvas) return;
      drag = {id:e.pointerId,x:e.clientX,y:e.clientY,moved:0};
      suppressClick = false;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.hypot(dx,dy);
      if (drag.moved > 4) {
        input.look.dx -= dx * .004;
        input.look.dy -= dy * .004;
        suppressClick = true;
      }
    };
    const up = (e: PointerEvent) => { if (drag?.id === e.pointerId) drag = null; };
    const click = (e: MouseEvent) => {
      if (suppressClick) { e.stopImmediatePropagation(); suppressClick = false; }
    };
    const lockedMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        input.look.dx -= e.movementX * .0021;
        input.look.dy -= e.movementY * .0021;
      }
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('lostpointercapture', up);
    canvas.addEventListener('click', click, true);
    canvas.addEventListener('dblclick', lock);
    function lock() {
      const s=useStore.getState();
      if (!isTouch() && s.phase==='world' && !s.panel && !s.journey) canvas.requestPointerLock?.()?.catch(()=>{});
    }
    document.addEventListener('mousemove', lockedMove);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('lostpointercapture', up);
      canvas.removeEventListener('click', click, true);
      canvas.removeEventListener('dblclick', lock);
      document.removeEventListener('mousemove', lockedMove);
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const st = useStore.getState();
    reportClock.current+=dt;
    if(reportClock.current>.2){reportClock.current=0;window.dispatchEvent(new CustomEvent('twi-position',{detail:{x:camera.position.x,y:camera.position.y,z:camera.position.z,yaw:angles.current.y}}));}
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
    if (input.gestureWalk) fz -= 1;
    if (k.has("KeyW") || k.has("ArrowUp")) fz -= 1;
    if (k.has("KeyS") || k.has("ArrowDown")) fz += 1;
    if (k.has("KeyA") || k.has("ArrowLeft")) fx -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) fx += 1;
    if (input.joy.active) {
      fx += input.joy.x;
      fz += input.joy.y;
    }
    const flightMode = useFlight.getState();
    const preview = flightMode.preview;
    if (preview?.paused) return;
    if (flightMode.active || preview || takeoff.current) {
      if (moving.current) { moving.current = false; audio.stopFootsteps(); }
      if (st.nearby) st.set({nearby:null});
      camera.quaternion.slerp(quat.current.setFromEuler(angles.current), 1 - Math.exp(-dt * 20));
      if (!flightMode.active && takeoff.current) {
        camera.position.lerp(takeoff.current, 1 - Math.exp(-dt * 7));
        if (camera.position.distanceTo(takeoff.current) < .08) {
          camera.position.copy(takeoff.current);
          resetFlight();
        }
        return;
      }
      if (flightMode.active && !takeoff.current) takeoff.current = camera.position.clone();
      const direction = new THREE.Vector3(fx, 0, fz);
      if (direction.lengthSq() > 1) direction.normalize();
      const speed = flightMode.active ? flightMode.speed : 5;
      if (flightMode.active) {
        direction.applyEuler(angles.current);
        direction.y += Number(k.has('Space')) - Number(k.has('ControlLeft') || k.has('ControlRight'));
      } else direction.applyAxisAngle(new THREE.Vector3(0,1,0), angles.current.y);
      velocity.current.lerp(direction.multiplyScalar(speed), 1 - Math.exp(-dt * 6));
      camera.position.addScaledVector(velocity.current, dt);
      if (flightMode.lift) {
        pendingLift.current += flightMode.lift;
        useFlight.setState({lift:0});
      }
      const step = THREE.MathUtils.clamp(pendingLift.current,-speed * dt,speed * dt);
      pendingLift.current -= step;
      const bounds = preview ? {left:preview.x-9,right:preview.x+9,far:preview.z-9,near:preview.z+9,ceiling:10} : flightLimits[st.world];
      const p = camera.position;
      p.x = THREE.MathUtils.clamp(p.x,bounds.left,bounds.right);
      p.z = THREE.MathUtils.clamp(p.z,bounds.far,bounds.near);
      const floor = preview?.floor ?? getGround(st.world, null, p.x, p.z);
      p.y = flightMode.active ? THREE.MathUtils.clamp(p.y+step,floor+2.1,floor+bounds.ceiling) : floor+2.1;
      return;
    }
    const speed = (k.has("ShiftLeft") || k.has("ShiftRight") ? 12 : 6) * (st.world === "castle" && !st.zone ? 1.15 : 1);
    const direction = new THREE.Vector3(fx, 0, fz);
    if (direction.lengthSq() > 0)
      direction.normalize().multiplyScalar(speed).applyAxisAngle(new THREE.Vector3(0, 1, 0), angles.current.y);
    velocity.current.lerp(direction, 1 - Math.exp(-dt * 8));
    const next = camera.position.clone().addScaledVector(velocity.current, dt);
    const zone = st.zone;
    if(st.world==='castle'&&zone){const nextZone=interiorZone(camera.position.x);if(nextZone!==zone)st.set({zone:nextZone});}
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
