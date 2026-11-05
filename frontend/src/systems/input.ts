export const input = {
  keys: new Set<string>(),
  look: { dx: 0, dy: 0 },
  joy: { x: 0, y: 0, active: false },
};

let bound = false;

export function bindInput() {
  if (bound) return;
  bound = true;
  window.addEventListener("keydown", (e) => {
    input.keys.add(e.code);
  });
  window.addEventListener("keyup", (e) => input.keys.delete(e.code));
  window.addEventListener("blur", () => input.keys.clear());
}
