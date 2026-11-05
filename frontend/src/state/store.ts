import { create } from "zustand";
import { audio } from "../audio/AudioEngine";
import { findInteraction } from "../data/interactions";
import { getWorld } from "../data/worlds";
import type { View } from "../data/views";

export type WorldId = "hello" | "castle" | "garden";
export type Zone = "hall" | "gallery" | "library";
export type PanelId =
  | "welcome"
  | "atlas"
  | "controls"
  | "story"
  | "exhibit"
  | "book"
  | "poems"
  | "reading"
  | "soundtrack"
  | "note"
  | "guestbook"
  | "catalogue"
  | null;

export type AudioSettings = {
  master: number;
  music: number;
  sfx: number;
  voice: number;
  muted: boolean;
  captions: boolean;
};

export type Nearby = {
  id: string;
  kind: string;
  label: string;
  hint: string;
  refId?: string;
} | null;

const AUDIO_KEY = "twi-audio";

function loadAudio(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_KEY);
    if (raw) return { ...defaultAudio(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultAudio();
}

function defaultAudio(): AudioSettings {
  return {
    master: 0.8,
    music: 0.55,
    sfx: 0.8,
    voice: 1,
    muted: false,
    captions: true,
  };
}

export const isTouch =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

type Quality = "high" | "medium" | "low";

function initialQuality(): Quality {
  if (!isTouch) return "high";
  const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;
  return mem <= 2 ? "low" : "medium";
}

interface WorldState {
  phase: "landing" | "world" | "opendoor";
  entered: boolean;
  guided: boolean;
  world: WorldId;
  zone: Zone | null;
  journey: { to: WorldId; serial: number; view?: View } | null;
  panel: PanelId;
  refId: string | null;
  nearby: Nearby;
  audio: AudioSettings;
  narrating: boolean;
  caption: string;
  voiceAvailable: boolean;
  quality: Quality;
  fps: number;
  fading: boolean;
  themeReady: boolean;
  gestures: boolean;
  bookReader: boolean;
  bookClosing: boolean;

  set: (partial: Partial<WorldState>) => void;
  openPanel: (panel: PanelId, refId?: string | null) => void;
  closePanel: () => void;
  enter: (guided: boolean) => void;
  travelTo: (world: WorldId, view?: View) => void;
  arrive: () => void;
  setZone: (zone: Zone | null, at: { position: [number, number, number]; lookAt: [number, number, number] }) => void;
  setAudio: (partial: Partial<AudioSettings>) => void;
  interactNow: (id: string) => void;
}

export const useStore = create<WorldState>((set, get) => ({

  phase: "landing",
  entered: false,
  guided: false,
  world: "hello",
  zone: null,
  journey: null,
  panel: null,
  refId: null,
  nearby: null,
  audio: loadAudio(),
  narrating: false,
  caption: "",
  voiceAvailable: true,
  quality: initialQuality(),
  fps: 0,
  fading: false,
  themeReady: false,
  gestures: false,
  bookReader: isTouch,
  bookClosing: false,

  set: (partial) => set(partial),

  openPanel: (panel, refId = null) => {
    document.exitPointerLock?.();
    set({ panel, refId, bookReader: isTouch, bookClosing: false });
  },

  closePanel: () => {
    const s=get();
    if(s.panel==='book'&&!s.bookReader){set({bookClosing:true});return;}
    set({ panel: null, refId: null, bookClosing:false });
  },

  enter: (guided) => set({ phase: "world", entered: true, guided, panel: "welcome", caption: "Hello World. Welcome to a little universe called Shruti." }),

  travelTo: (world, view) =>
    set(() => ({
      panel: null,
      refId: null,
      zone: null,
      journey: { to: world, serial: Date.now(), view },
      narrating: false,
      caption: "",
    })),

  arrive: () => {
    const j = get().journey;
    set(j ? { world: j.to, journey: null } : { journey: null });
    if (j?.view?.zone) get().setZone(j.view.zone, { position: j.view.position, lookAt: j.view.lookAt });
  },

  setZone: (zone, at) => {
    if(zone==='gallery')at={position:[-39,8.55,-32.5],lookAt:[-39,9,-43]};
    if(zone==='library')at={position:[39,8.55,-32.5],lookAt:[39,9,-43]};
    set({ zone, panel: null, refId: null, fading: true });
    window.dispatchEvent(
      new CustomEvent("twi-teleport", { detail: at })
    );
    window.setTimeout(() => set({ fading: false }), 700);
  },

  setAudio: (partial) => {
    const audio_ = { ...get().audio, ...partial };
    try {
      localStorage.setItem(AUDIO_KEY, JSON.stringify(audio_));
    } catch {
      /* ignore */
    }
    set({ audio: audio_ });
  },

  interactNow: (id) => {
    const it = findInteraction(id);
    if (!it) return;
    const s = get();
    audio.playSfx("select");
    switch (it.kind) {
      case "story":
        s.openPanel("story");
        break;
      case "atlas":
        s.openPanel("atlas");
        break;
      case "gate":
        audio.playSfx("door");
        s.setZone("hall", { position: [0, 2.2, 25], lookAt: [0, 5, -18] });
        break;
      case "galleryDoor":
        audio.playSfx("door");
        s.setZone("gallery", { position: [0, 2.2, 7], lookAt: [0, 3, -18] });
        break;
      case "archivesDoor":
        audio.playSfx("door");
        s.setZone("library", { position: [0, 2.2, 7], lookAt: [0, 3, -18] });
        break;
      case "hallDoor":
        audio.playSfx("door");
        s.setZone("hall", { position: [0, 2.2, 25], lookAt: [0, 5, -18] });
        break;
      case "exitCastle": {
        audio.playSfx("door");
        const w = getWorld("castle");
        s.setZone(null, { position: w.arrival, lookAt: w.lookAt });
        break;
      }
      case "exhibit":
        s.openPanel("exhibit", it.refId);
        break;
      case "book":
        s.openPanel("book", it.refId);
        break;
      case "poems":
        s.openPanel("poems");
        break;
      case "reading":
        s.openPanel("reading");
        break;
      case "soundtrack":
        s.openPanel("soundtrack");
        break;
      case "note":
        s.openPanel("note", it.refId);
        break;
      case "guestbook":
        s.openPanel("guestbook");
        break;
    }
  },
}));

if (typeof window !== "undefined") {
  (window as unknown as { __twi: typeof useStore }).__twi = useStore;
}
