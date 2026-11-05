import type { Point, WorldId } from "./worlds";
import type { Zone } from "../state/store";

export type InteractKind =
  | "story"
  | "atlas"
  | "gate"
  | "galleryDoor"
  | "archivesDoor"
  | "hallDoor"
  | "exitCastle"
  | "exhibit"
  | "book"
  | "poems"
  | "reading"
  | "soundtrack"
  | "note"
  | "guestbook";

export type Interaction = {
  id: string;
  world: WorldId;
  zone: Zone | null;
  kind: InteractKind;
  label: string;
  hint: string;
  pos: [number, number];
  refId?: string;
  radius?: number;
};

export const interactions: Interaction[] = [
  // — The First Hello —
  {
    id: "hello-story",
    world: "hello",
    zone: null,
    kind: "story",
    label: "Meet Shruti",
    hint: "Read the welcome journal",
    pos: [-5, 4],
    radius: 5,
  },
  {
    id: "hello-atlas",
    world: "hello",
    zone: null,
    kind: "atlas",
    label: "World Atlas",
    hint: "Discover the world atlas",
    pos: [4, -6],
    radius: 5,
  },
  // — Castle exterior —
  {
    id: "castle-gate",
    world: "castle",
    zone: null,
    kind: "gate",
    label: "The Great Doors",
    hint: "Enter the castle",
    pos: [150, -205],
    radius: 6,
  },
  {
    id: "castle-fountain",
    world: "castle",
    zone: null,
    kind: "note",
    refId: "fountain",
    label: "The Courtyard Fountain",
    hint: "Read the inscription",
    pos: [150, -234],
    radius: 4.5,
  },
  // — Castle hall —
  {
    id: "hall-gallery",
    world: "castle",
    zone: "hall",
    kind: "galleryDoor",
    label: "Gallery of Creations",
    hint: "Enter the gallery wing",
    pos: [-13, 0],
    radius: 4.5,
  },
  {
    id: "hall-archives",
    world: "castle",
    zone: "hall",
    kind: "archivesDoor",
    label: "The Living Archives",
    hint: "Enter the library wing",
    pos: [13, 0],
    radius: 4.5,
  },
  {
    id: "hall-exit",
    world: "castle",
    zone: "hall",
    kind: "exitCastle",
    label: "The Great Doors",
    hint: "Return to the castle grounds",
    pos: [0, 27],
    radius: 4.5,
  },
  // — Gallery —
  ...["argus", "accessbridge", "samhita", "urban-ecology", "cosmic"].map(
    (refId, i) => ({
      id: `exhibit-${refId}`,
      world: "castle" as WorldId,
      zone: "gallery" as Zone | null,
      kind: "exhibit" as InteractKind,
      label: refId,
      hint: "View this exhibit",
      pos: [
        i < 3 ? -10 : 10,
        i === 0 ? -16 : i === 1 ? -6 : i === 2 ? 4 : i === 3 ? -11 : 1,
      ] as [number, number],
      refId,
      radius: 4,
    }),
  ),
  {
    id: "gallery-exit",
    world: "castle",
    zone: "gallery",
    kind: "hallDoor",
    label: "Back to the Hall",
    hint: "Return to the great hall",
    pos: [0, 8],
    radius: 4,
  },
  // — Library —
  ...[
    { refId: "story", pos: [-8.2, -14] },
    { refId: "academic", pos: [-3.4, -14] },
    { refId: "workshop", pos: [3.4, -14] },
    { refId: "experience", pos: [8.2, -14] },
    { refId: "achievements", pos: [-5.8, 2] },
    { refId: "people", pos: [5.8, 2] },
  ].map((b) => ({
    id: `book-${b.refId}`,
    world: "castle" as WorldId,
    zone: "library" as Zone | null,
    kind: "book" as InteractKind,
    label: b.refId,
    hint: "Take this book from the shelf",
    pos: b.pos as [number, number],
    refId: b.refId,
    radius: 3.2,
  })),
  {
    id: "library-exit",
    world: "castle",
    zone: "library",
    kind: "hallDoor",
    label: "Back to the Hall",
    hint: "Return to the great hall",
    pos: [0, 8],
    radius: 4,
  },
  // — Memory Garden —
  {
    id: "garden-guestbook",
    world: "garden",
    zone: null,
    kind: "guestbook",
    label: "The Guestbook Wall",
    hint: "Leave a glowing note",
    pos: [-163, -120],
    radius: 4,
  },
  {
    id: "garden-reading",
    world: "garden",
    zone: null,
    kind: "reading",
    label: "The Reading Nook",
    hint: "See what she is reading",
    pos: [-175, -146],
    radius: 4.5,
  },
  {
    id: "garden-poems",
    world: "garden",
    zone: null,
    kind: "poems",
    label: "The Poetry Nook",
    hint: "Read her poems",
    pos: [-165, -153],
    radius: 4.5,
  },
  {
    id: "garden-soundtrack",
    world: "garden",
    zone: null,
    kind: "soundtrack",
    label: "The Gramophone",
    hint: "Play her personal soundtrack",
    pos: [-179, -137],
    radius: 4.5,
  },
  {
    id: "garden-imagination",
    world: "garden",
    zone: null,
    kind: "note",
    refId: "imagination",
    label: "Imagination",
    hint: "A small discovery",
    pos: [-172, -124],
    radius: 3.5,
  },
  {
    id: "garden-creative",
    world: "garden",
    zone: null,
    kind: "note",
    refId: "creative",
    label: "Creative Corner",
    hint: "A small discovery",
    pos: [-166, -128],
    radius: 3.5,
  },
  {
    id: "garden-memories",
    world: "garden",
    zone: null,
    kind: "note",
    refId: "memories",
    label: "Memories & Moments",
    hint: "A small discovery",
    pos: [-176, -157],
    radius: 3.5,
  },
  {
    id: "garden-inspiration",
    world: "garden",
    zone: null,
    kind: "note",
    refId: "inspiration",
    label: "Inspiration",
    hint: "A small discovery",
    pos: [-162, -150],
    radius: 3.5,
  },
];

export function nearbyInteraction(
  world: WorldId,
  zone: Zone | null,
  x: number,
  z: number
): Nearby2 {
  let best: Nearby2 = null;
  let bestD = Infinity;
  for (const it of interactions) {
    if (it.world !== world || it.zone !== zone) continue;
    const r = it.radius ?? 4.5;
    const d = Math.hypot(x - it.pos[0], z - it.pos[1]);
    if (d < r && d < bestD) {
      bestD = d;
      best = {
        id: it.id,
        kind: it.kind,
        label: it.label,
        hint: it.hint,
        refId: it.refId,
      };
    }
  }
  return best;
}

type Nearby2 = {
  id: string;
  kind: string;
  label: string;
  hint: string;
  refId?: string;
} | null;

export function findInteraction(id: string): Interaction | undefined {
  return interactions.find((it) => it.id === id);
}

export function interactionPoint(id: string): Point | null {
  const it = findInteraction(id);
  if (!it) return null;
  return [it.pos[0], 0, it.pos[1]];
}
