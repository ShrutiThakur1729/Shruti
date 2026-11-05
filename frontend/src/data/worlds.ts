export type Point = [number, number, number];
export type WorldId = "hello" | "castle" | "garden";

export type World = {
  id: WorldId;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  position: Point;
  arrival: Point;
  lookAt: Point;
  color: string;
  music: string;
};

export const worlds: World[] = [
  {
    id: "hello",
    number: "01",
    name: "The First Hello",
    subtitle: "Every story begins somewhere.",
    description:
      "A lantern-lit valley at the edge of a larger world. Meet Shruti, wander the stone path, cross the old river, and let the journey begin.",
    position: [0, 0, 0],
    arrival: [4, 5.4, 30],
    lookAt: [-1, 6, -22],
    color: "#d5b57a",
    music: "Morning in the Valley",
  },
  {
    id: "castle",
    number: "02",
    name: "The Castle",
    subtitle: "Ideas find a home here.",
    description:
      "Approach across the moat and through the great doors into a Gothic hall. Beyond it wait the Gallery of Creations and the Living Archives.",
    position: [150, 0, -220],
    arrival: [150, 8, -180],
    lookAt: [150, 18, -250],
    color: "#b3b6d1",
    music: "Stones & Candlelight",
  },
  {
    id: "garden",
    number: "03",
    name: "The Memory Garden",
    subtitle: "A place for the things that stay.",
    description:
      "A walled evening garden with an old tree, a pond, roses and fireflies — holding poems, a favourite book and a personal soundtrack.",
    position: [-170, 0, -145],
    arrival: [-170, 6, -118],
    lookAt: [-170, 3, -152],
    color: "#a1ba8d",
    music: "Fireflies at Dusk",
  },
];

export const getWorld = (id: WorldId) => worlds.find((w) => w.id === id)!;

export const atlasPoint = (p: Point): [number, number] => [
  p[0] + 250,
  p[2] + 300,
];

export const openDoorMapPoint: [number, number] = [250, 540];
