const order = ['hello', 'castle', 'garden'] as const;
export function swipeDestination(current: typeof order[number], dx: number, dy: number) {
  if (Math.abs(dx) < .23 || Math.abs(dx) < Math.abs(dy) * 1.6) return null;
  return order[order.indexOf(current) + (dx < 0 ? 1 : -1)] ?? null;
}
