import { useSyncExternalStore } from 'react';
import { useStore } from '../state/store';
import { input } from './input';
import { audio } from '../audio/AudioEngine';

type Destination = 'gate' | 'stairs' | 'gallery' | 'library' | 'return';
type Point = readonly [number, number];
type Position = { x: number; y: number; z: number; yaw: number };
type Walk = { destination: Destination; points: Point[]; bestDistance: number; lastProgress: number };

const landing: Point = [0, -32.5];
const gateZ = -207;
let walk: Walk | null = null;
let lastPosition: Position | null = null;
let onLanding = false;
const listeners = new Set<() => void>();
const publish = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export function useCastleWalk() {
  return useSyncExternalStore(subscribe, () => walk?.destination ?? null);
}
export function useCastleLanding() {
  return useSyncExternalStore(subscribe, () => onLanding);
}

export function stopCastleWalk() {
  if (!walk) return;
  walk = null;
  input.joy.active = false;
  input.joy.x = 0;
  input.joy.y = 0;
  publish();
}

function arrive(destination: Destination) {
  stopCastleWalk();
  const state = useStore.getState();
  if (destination === 'gate') {
    audio.playSfx('door');
    state.setZone('hall', { position: [0, 2.3, 24], lookAt: [0, 5, -20] });
  } else if (destination === 'stairs' || destination === 'return') {
    state.setZone('hall', { position: [0, 8.55, -32.5], lookAt: [0, 9.5, -40] });
    onLanding = true;
    publish();
    state.openPanel('castle-guide');
  } else {
    const x = destination === 'gallery' ? -39 : 39;
    state.setZone(destination, { position: [x, 8.55, -15.5], lookAt: [x, 9, -39] });
  }
}

export function startCastleWalk(destination: Destination) {
  const state = useStore.getState();
  if (state.world !== 'castle' || state.phase !== 'world' || state.journey) return;
  stopCastleWalk();
  state.closePanel();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    arrive(destination);
    return;
  }
  let points: Point[];
  const p = lastPosition;
  if (destination === 'gate') {
    if (!p || Math.abs(p.x - 150) > 3 || p.z <= gateZ || p.z > -165)
      state.setZone(null, { position: [150, 4.2, -190], lookAt: [150, 7, gateZ] });
    points = [[150, gateZ - 1]];
  } else if (destination === 'stairs') {
    if (!p || state.zone !== 'hall' || Math.abs(p.x) > 3 || p.z < -18)
      state.setZone('hall', { position: [0, 2.3, -15], lookAt: [0, 8, -34] });
    points = [landing];
  } else if (destination === 'return') {
    const x = state.zone === 'gallery' ? -39 : 39;
    points = [[x, p?.z ?? -15.5], [x, -32.5], landing];
  } else {
    const x = destination === 'gallery' ? -39 : 39;
    if (!onLanding || state.zone !== 'hall')
      state.setZone('hall', { position: [0, 8.55, -32.5], lookAt: [x, 9, -32.5] });
    points = [[x, -32.5], [x, -15.5]];
  }
  walk = { destination, points, bestDistance: Infinity, lastProgress: performance.now() };
  publish();
}

export function trackCastlePosition(position: Position) {
  const state = useStore.getState();
  const previous = lastPosition;
  lastPosition = position;
  const atLanding = state.zone === 'hall' && position.z <= -30 && Math.abs(position.x) < 15;
  if (onLanding !== atLanding) {
    onLanding = atLanding;
    publish();
  }
  if (!state.zone && previous && previous.z > gateZ && position.z <= gateZ && Math.abs(position.x - 150) < 4) {
    arrive('gate');
    return;
  }
  if (!walk) return;
  const target = walk.points[0];
  const dx = target[0] - position.x, dz = target[1] - position.z;
  const distance = Math.hypot(dx, dz);
  if (distance < .65) {
    walk.points.shift();
    if (!walk.points.length) arrive(walk.destination);
    else {
      walk.bestDistance = Infinity;
      walk.lastProgress = performance.now();
    }
    return;
  }
  // A visitor can start a route beside a plinth. Recover at its safe destination if blocked.
  if (distance < walk.bestDistance - .08) {
    walk.bestDistance = distance;
    walk.lastProgress = performance.now();
  } else if (performance.now() - walk.lastProgress > 3500) {
    arrive(walk.destination);
    return;
  }
  const cosine = Math.cos(position.yaw), sine = Math.sin(position.yaw);
  input.joy.x = (dx * cosine - dz * sine) / distance;
  input.joy.y = (dx * sine + dz * cosine) / distance;
  input.joy.active = true;
  const targetYaw = Math.atan2(-dx, -dz);
  const turn = Math.atan2(Math.sin(targetYaw - position.yaw), Math.cos(targetYaw - position.yaw));
  input.look.dx += Math.max(-.3, Math.min(.3, turn));
}

export function bindCastleWalk() {
  const track = (event: Event) => trackCastlePosition((event as CustomEvent<Position>).detail);
  const key = (event: KeyboardEvent) => {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code))
      stopCastleWalk();
  };
  const pointer = (event: PointerEvent) => {
    if (event.target instanceof Element && event.target.closest('canvas,.joystick')) stopCastleWalk();
  };
  window.addEventListener('twi-position', track);
  window.addEventListener('keydown', key);
  window.addEventListener('pointerdown', pointer);
  window.addEventListener('blur', stopCastleWalk);
  return () => {
    window.removeEventListener('twi-position', track);
    window.removeEventListener('keydown', key);
    window.removeEventListener('pointerdown', pointer);
    window.removeEventListener('blur', stopCastleWalk);
    stopCastleWalk();
  };
}
