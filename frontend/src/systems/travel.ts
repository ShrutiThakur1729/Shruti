import type { Point } from "../data/worlds";

export const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function flightPoint(start: Point, end: Point, t: number): Point {
  const s = smooth(Math.max(0, Math.min(1, t)));
  const dx = end[0] - start[0],
    dz = end[2] - start[2];
  const length = Math.hypot(dx, dz) || 1;
  const bend = Math.sin(Math.PI * s) * Math.min(45, length * 0.16);
  const localLoop = length < 30 ? Math.sin(Math.PI * s) : 0;
  const lift = Math.sin(Math.PI * s) * Math.max(16, Math.min(70, length * 0.3)) + 10 * Math.sin(Math.PI * s);
  return [
    start[0] + dx * s - (dz / length) * bend + localLoop * 22,
    start[1] + (end[1] - start[1]) * s + lift,
    start[2] + dz * s + (dx / length) * bend - localLoop * 32,
  ];
}

export function flightDuration(start: Point, end: Point) {
  return Math.max(5, Math.min(10, Math.hypot(end[0] - start[0], end[2] - start[2]) / 34));
}
