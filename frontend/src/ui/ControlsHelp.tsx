import { useStore } from "../state/store";
import { views } from "../data/views";

export default function ControlsHelp() {
  const world = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
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
      <h2>Take the scenic route.</h2>
      {isTouch ? (
        <p>
          Use the joystick to walk, drag anywhere on the right to look around,
          and the ✦ button to interact with what's in front of you.
        </p>
      ) : (
        <p>
          Click the world to capture your mouse. Follow the path, find the
          discoveries, or open the atlas whenever curiosity calls.
        </p>
      )}
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
        {(isTouch
          ? ([
              ["Joystick", "Walk through the world"],
              ["Drag right side", "Look around"],
              ["✦ Button", "Interact with discoveries"],
              ["M / Atlas", "Open the world atlas"],
            ] as const)
          : ([
              ["W A S D", "Move through the world"],
              ["Mouse", "Look around after clicking the world"],
              ["Shift", "Walk faster"],
              ["E / Click", "Interact with a nearby discovery"],
              ["M", "Open or close the world atlas"],
              ["Esc", "Release mouse / close panels"],
              ["Space / Ctrl", "Adjust altitude during flights"],
            ] as const)
        ).map(([key, label]) => (
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
          Replay the welcome
        </button>
      </div>
    </article>
  );
}
