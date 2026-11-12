import { useEffect, useRef } from "react";
import { useStore, isTouch } from "../state/store";
import { getWorld } from "../data/worlds";
import { input } from "../systems/input";
import { findInteraction } from "../data/interactions";
import GardenGuide from './GardenGuide';
import { CastleWalkStatus } from './CastleGuide';
import FlightDeck, { LoadingStatus } from './FlightDeck';
import { useFlight } from '../systems/freeFlight';

export function HUD() {
  const world = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
  const journey = useStore((s) => s.journey);
  const nearby = useStore((s) => s.nearby);
  const panel = useStore((s) => s.panel);
  const interact = useStore((s) => s.interactNow);
  const gestures = useStore((s) => s.gestures);
  const flying = useFlight(s => s.active);
  const preview = useFlight(s => s.preview);
  const exploring = !journey && !panel && !preview && !flying;

  const current = getWorld(world);
  const zoneName =
    zone === "hall"
      ? "The Great Hall"
      : zone === "gallery"
        ? "Gallery of Creations"
        : zone === "library"
          ? "The Living Archives"
          : null;

  const directions = zone === "gallery"
    ? "Select an exhibit or open the Exhibition catalogue."
    : zone === "library"
      ? "Select a book or choose Browse the shelves."
      : zone === "hall"
        ? "Climb the stairs. Choose the Gallery on the left or Library on the right."
        : world === "castle"
          ? "Follow the bridge to the gates, or choose Explore the Castle."
          : world === "garden"
            ? "Choose Visit a Garden place to go straight to a discovery."
            : "Choose Meet Shruti to start, or open the World Atlas to travel.";

  const generalActions = <>
    <button data-testid="quick-meet" onClick={() => useStore.getState().openPanel('story')}>Meet Shruti</button>
    <button data-testid="quick-atlas" onClick={() => useStore.getState().openPanel('atlas')}>World Atlas</button>
    {!gestures && <button data-testid="quick-gestures" onClick={() => useStore.setState({gestures:true})}>Use hand gestures</button>}
  </>;
  return (
    <>
      <header className="topbar">
        <span className="wordmark">
          <i className="emblem" aria-hidden>✧</i>
          <span>
            THE WORLD INSIDE
            <small>A little universe called Shruti</small>
          </span>
        </span>
        <div className="topbar-actions">
          {journey ? (
            <span className="journey-note" data-testid="journey-note">
              CINEMATIC FLIGHT · Space / Ctrl adjusts altitude
            </span>
          ) : (
            !panel && (
              <span className="controls-hint" data-testid="controls-hint">
                {isTouch ? "Drag to look · joystick to walk" : (
                  <>Drag to look around · <kbd>W A S D</kbd> wander · <kbd>E</kbd> interact</>
                )}
              </span>
            )
          )}
          <button
            data-testid="help-button"
            onClick={() => useStore.getState().openPanel("controls")}
            aria-label="Help and controls"
          >
            Help
          </button>
        </div>
      </header>

      <section className="location" hidden={!!preview} aria-live="polite" data-testid="location-label">
        <span className="eyebrow">
          {journey
            ? "BETWEEN WORLDS"
            : `CHAPTER ${current.number}${zoneName ? " · " + zoneName.toUpperCase() : ""}`}
        </span>
        <h1>{journey ? `Towards ${getWorld(journey.to).name}` : zoneName || current.name}</h1>
        {!flying && <p className="world-next-step">{journey ? "You’ll arrive in a moment." : directions}</p>}
      </section>

      {!journey && !panel && (
        <div className="crosshair" aria-hidden />
      )}

      {exploring && nearby && (
        <div className="interact-prompt">
          <button data-testid="interact-button" onClick={() => interact(nearby.id)}>
            {isTouch ? (
              <>
                <span className="interact-icon" aria-hidden>✦</span> {nearby.hint} — {nearby.label}
              </>
            ) : (
              <>
                <kbd>E</kbd> {nearby.hint} — {nearby.label}
              </>
            )}
          </button>
        </div>
      )}

      {exploring && (
        <nav className="quick-actions" aria-label="Explore this world">
          {world === 'castle' && <CastleWalkStatus />}
          {(zone==='gallery'||zone==='library')&&<button data-guide="catalogue" onClick={()=>useStore.getState().openPanel('catalogue')}>{zone==='gallery'?'Exhibition catalogue':'Browse the shelves'}</button>}
          {world === 'hello' ? generalActions : <details className="more-routes"><summary>More options</summary><div>
            {world==='castle' && <button data-testid="castle-guide-button" onClick={()=>useStore.getState().openPanel('castle-guide')}>Explore the Castle</button>}
            {generalActions}
          </div></details>}
        </nav>
      )}

      {isTouch && !panel && !journey && <TouchControls />}
      {world==='garden' && exploring && <GardenGuide/>}
      {!!preview && !panel && <LoadingStatus/>}
      {flying && !journey && !panel && <FlightDeck/>}
    </>
  );
}

function TouchControls() {
  const stick = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stick.current!;
    const radius = 52;
    const onMove = (e: PointerEvent) => {
      if (!stick.current?.hasPointerCapture(e.pointerId)) return;
      const r = el.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > radius) {
        dx = (dx / d) * radius;
        dy = (dy / d) * radius;
      }
      input.joy.x = dx / radius;
      input.joy.y = dy / radius;
      input.joy.active = true;
      if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const up = (e: PointerEvent) => {
      if (!stick.current?.hasPointerCapture(e.pointerId)) return;
      input.joy.active = false;
      input.joy.x = 0;
      input.joy.y = 0;
      if (knob.current) knob.current.style.transform = "translate(0px, 0px)";
      el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      input.joy.active = false;
      input.joy.x = input.joy.y = 0;
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);


  return (
    <>
      <div
        ref={stick}
        className="joystick"
        data-testid="touch-joystick"
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      >
        <div ref={knob} className="joystick-knob" />
      </div>
    </>
  );
}

export function useInteractKey() {
  const interact = useStore((s) => s.interactNow);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== "KeyE" || e.repeat) return;
      const st = useStore.getState();
      if (st.phase !== "world" || st.panel || st.journey || !st.nearby) return;
      interact(st.nearby.id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [interact]);
}

export { findInteraction };
