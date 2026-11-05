export const input = {
  keys: new Set<string>(),
  look: { dx: 0, dy: 0 },
  joy: { x: 0, y: 0, active: false },
  gestureWalk: false,
};

let bound = false;

export function bindInput() {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    input.keys.add(e.code);
  });
  window.addEventListener("keyup", (e) => input.keys.delete(e.code));
  window.addEventListener("blur", () => { input.keys.clear(); input.gestureWalk=false; input.look.dx=0; input.look.dy=0; input.joy.active=false; });
}
