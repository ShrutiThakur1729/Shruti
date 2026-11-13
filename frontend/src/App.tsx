import IdleGuide from './ui/IdleGuide';
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useStore, isTouch } from "./state/store";
import { audio } from "./audio/AudioEngine";
import { initNarrator, narrator } from "./audio/narrator";
import WorldRoot from "./scenes/WorldRoot";
import CameraRig from "./systems/CameraRig";
import Performance from "./systems/Performance";
import Landing from "./ui/Landing";
import { HUD, useInteractKey } from "./ui/HUD";
import NarrationBar from "./ui/NarrationBar";
import Atlas from "./ui/Atlas";
import MeetShruti from "./ui/MeetShruti";
import ControlsHelp from "./ui/ControlsHelp";
import CastleGuide from './ui/CastleGuide';
import {
  ExhibitPanel,
  PoemsPanel,
  ReadingPanel,
  NotePanel,
  WelcomePanel,
} from "./ui/panels";
import OpenDoor from "./ui/OpenDoor";
import SoundtrackPlayer from './ui/SoundtrackPlayer';
import GuestbookPanel from "./ui/GuestbookPanel";
import GestureControl from "./ui/GestureControl";
import BookPanel from './ui/LibraryBook';
import { books,projects } from "./data/content";
import { narrationScripts } from "./data/narration";

class SceneError extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-error">
        The 3D world could not start on this device. You can still meet Shruti
        through the panels.
        <button onClick={() => location.reload()}>Try again</button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function Dialog({
  children,
  wide = false,
  testid = "dialog",
}: {
  children: React.ReactNode;
  wide?: boolean;
  testid?: string;
}) {
  const closePanel = useStore((s) => s.closePanel);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLElement>("button, a")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePanel();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = ref.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),a[href],input,textarea,select,[tabindex="0"]'
      );
      if (!nodes?.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [closePanel]);
  return (
    <div className="scrim">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        data-testid={testid}
        className={`dialog ${wide ? "wide" : ""}`}
      >
        <button className="dialog-close" data-testid="dialog-close" onClick={closePanel} aria-label="Close">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function Panels() {
  const panel = useStore((s) => s.panel);
  const refId = useStore((s) => s.refId);
  const zone=useStore(s=>s.zone);
  if (!panel) return null;
  let body: React.ReactNode = null;
  if (panel === "welcome") body = <WelcomePanel />;
  else if (panel === 'castle-guide') body = <CastleGuide />;
  else if (panel === "atlas") body = <Atlas />;
  else if (panel === "controls") body = <ControlsHelp />;
  else if (panel === "story") body = <MeetShruti />;
  else if (panel === "exhibit") body = <ExhibitPanel id={refId || ""} />;
  else if (panel === "book") body = <BookPanel key={refId} id={refId || ""} />;
  else if (panel === "poems") body = <PoemsPanel />;
  else if (panel === "reading") body = <ReadingPanel />;
  else if (panel === "soundtrack") body = <SoundtrackPlayer />;
  else if (panel === "note") body = <NotePanel id={refId || ""} />;
  else if (panel === "guestbook") body = <GuestbookPanel />;
  else if(panel==='catalogue')body=<article className="panel-body"><span className="chapter-mark">{zone==='library'?'THE LIVING ARCHIVES':'GALLERY OF CREATIONS'}</span><h2>{zone==='library'?'Choose a book':'Explore the exhibits'}</h2><div className="destination-list">{zone==='library'?books.map(b=><button key={b.id} onClick={()=>useStore.getState().openPanel('book',b.id)}>{b.title} <span>Open →</span></button>):projects.map(p=><button key={p.id} onClick={()=>useStore.getState().openPanel('exhibit',p.id)}>{p.name} <span>View →</span></button>)}</div></article>;
  if (!body) return null;
  return (
    <Dialog wide={panel === "atlas"}>
      {body}
    </Dialog>
  );
}

export default function App() {
  const phase = useStore((s) => s.phase);
  const audio_ = useStore((s) => s.audio);
  const world = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
  const guided = useStore((s) => s.guided);
  const panel = useStore((s) => s.panel);
  const fading = useStore((s) => s.fading);
  const gestures = useStore((s) => s.gestures);
  const journey = useStore(s=>s.journey);

  useInteractKey();

  // narrator singleton → store
  useEffect(() => {
    initNarrator({
      onLine: (line) => useStore.setState({ caption: line }),
      onDone: () => useStore.setState({ narrating: false }),
      onState: (playing) => useStore.setState({ narrating: playing }),
    });
  }, []);

  // voice availability
  useEffect(() => {
    const backend = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
    if (!backend) {
      useStore.setState({ voiceAvailable: false });
      return;
    }
    fetch(`${backend}/api/voice-status`)
      .then((r) => r.json())
      .then((d) => useStore.setState({ voiceAvailable: !!d.available }))
      .catch(() => useStore.setState({ voiceAvailable: false }));
  }, []);

  // audio settings → engine
  useEffect(() => {
    audio.setSettings(audio_);
  }, [audio_]);

  // world ambience
  useEffect(() => {
    if (phase === "world") audio.setWorld(world);
  }, [world, phase]);

  // guided narration scripts
  const lastSeq = useRef("");
  useEffect(() => {
    if (phase !== "world" || journey) { narrator.stop(); lastSeq.current=""; return; }
    if (!guided) {
      narrator.stop();
      useStore.setState({ caption: "" });
      lastSeq.current = "";
      return;
    }
    if (panel) {
      narrator.pause();
      return;
    }
    const key = world === "hello" ? "hello" : world === "castle" ? zone ?? "castle" : "garden";
    if (narrator.playing && narrator.paused && key === lastSeq.current) {
      narrator.resume();
      return;
    }
    if (key !== lastSeq.current) {
      lastSeq.current = key;
      const lines=narrationScripts[key]||[];
      if(lines.length)narrator.play(key,lines);
    }
  }, [guided, panel, world, zone, phase, journey]);

  // keyboard: M / Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "KeyM" && !e.repeat && phase === "world") {
        if ((e.target as HTMLElement)?.closest?.("input, textarea")) return;
        e.preventDefault();
        const st = useStore.getState();
        if (st.journey) return;
        if (st.panel === "atlas") st.closePanel();
        else st.openPanel("atlas");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase]);

  // start audio on entering (user gesture)
  useEffect(() => {
    if (phase !== "landing") {
      audio.init();
    }
  }, [phase]);

  return (
    <main className={phase === "opendoor" ? "opendoor-mode" : ""}>
      {phase !== "opendoor" && (
        <SceneError>
          <Canvas
            frameloop={phase==='landing'||panel?'demand':'always'}
            shadows
            dpr={[1, 1.5]}
            camera={{ fov: 55, near: 0.1, far: 1200 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            data-testid="world-canvas"
          >
            <Suspense fallback={null}>
              <Performance active={phase==='world'&&!panel} />
              {phase === "world" && <WorldRoot />}
              <CameraRig />
            </Suspense>
          </Canvas>
        </SceneError>
      )}
      <output id="performance-report" className="performance-report" aria-label="Rendering performance">
        Measuring scene…
      </output>
      <div className="vignette" aria-hidden />
      <div className={`fade-layer ${fading ? "on" : ""}`} aria-hidden />

      <IdleGuide />
      {gestures && <GestureControl />}
      {phase === "landing" && <Landing />}
      {phase === "world" && (
        <>
          {panel !== "book" && <HUD />}
          {panel !== "book" && <NarrationBar />}
          <Panels />
        </>
      )}
      {phase === "opendoor" && <OpenDoor />}
    </main>
  );
}
