import { useStore } from "../state/store";
import { views } from "../data/views";
import { toggleFlight, useFlight } from '../systems/freeFlight';

export default function ControlsHelp() {
  const world = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
  const flying = useFlight(s => s.active);
  const openPanel = useStore((s) => s.openPanel);
  const setZone = useStore((s) => s.setZone);
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const worldViews = views.filter((v) => v.world === world && v.zone === zone);

  const flyTo = (id: string) => {
    const v = views.find((x) => x.id === id)!;
    if (v.zone !== zone) setZone(v.zone, { position: v.position, lookAt: v.lookAt });
    else window.dispatchEvent(new CustomEvent("twi-teleport", { detail: { position: v.position, lookAt: v.lookAt } }));
    useStore.getState().closePanel();
  };

  return (
    <article className="panel-body controls-help" data-testid="controls-help">
      <h2>Find your way</h2>
      <p>Choose a destination on the World Atlas to travel directly. In the Castle, follow the signs to the Gallery for projects or the Library for books. The Open Door has my résumé and contact form.</p>
      <div className="panel-actions">
        <button className="btn-primary" onClick={() => openPanel("atlas")}>Open World Atlas ↗</button>
        <button className="btn-secondary" onClick={() => useStore.getState().set({ phase: "opendoor", panel: null })}>Contact &amp; résumé ↗</button>
      </div>
      <h3>Explore on foot</h3>
      {isTouch ? (
        <p>
          Use the joystick to walk, drag the landscape to look around, and tap a discovery to explore it.
        </p>
      ) : (
        <p>
          Drag the landscape to look around, or double-click for free mouse look. Use W, A, S and D to walk. When an action appears, press E or select its button. Press Esc to free your mouse.
        </p>
      )}
      {!zone && <button className="btn-secondary" onClick={() => { toggleFlight(!flying); useStore.getState().closePanel(); }}>{flying ? 'Return to walking' : 'Try flying'}</button>}
      {worldViews.length > 0 && <h3>Visit a viewpoint here</h3>}
      {worldViews.length > 0 && (
        <div className="view-controls" aria-label="Scenic viewpoints">
          {worldViews.map((v) => (
            <button key={v.id} data-testid={`view-${v.id}`} onClick={() => flyTo(v.id)}>
              {v.name} ↗
            </button>
          ))}
        </div>
      )}
      <div className="control-grid">
        {[
          ...(isTouch
            ? [
                ["Joystick", "Walk through the world"],
                ["Drag right side", "Look around"],
                ["✦ Button", "Interact with discoveries"],
                ["M / Atlas", "Open the world atlas"],
              ]
            : [
                ["W A S D", "Move through the world"],
                ["Mouse", "Drag the landscape to look around"],
                ["Shift", "Walk faster"],
                ["E / Click", "Interact with a nearby discovery"],
                ["M", "Open or close the world atlas"],
                ["Esc", "Release mouse / close panels"],
                ["Space / Ctrl", "Adjust altitude during flights"],
              ]),
          ["Hand gestures", "Move gently to look. Brisk swipe left: next world; right: previous world. Pinch to select; hold to walk. Atlas: pan and two-hand zoom. Books: swipe to turn pages."],
        ].map(([key, label]) => (
          <div key={key}>
            <kbd>{key}</kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="panel-actions">
        <button className="btn-primary" data-testid="help-close" onClick={() => useStore.getState().closePanel()}>
          Let me wander <span aria-hidden>→</span>
        </button>
        <button className="btn-secondary" data-testid="replay-welcome" onClick={() => openPanel("welcome")}>
          Choose narration or independent exploration
        </button>
      </div>
    </article>
  );
}
