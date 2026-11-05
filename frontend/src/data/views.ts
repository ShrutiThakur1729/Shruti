import type { Point, WorldId } from "./worlds";
import type { Zone } from "../state/store";

export type View = {
  id: string;
  world: WorldId;
  zone: Zone | null;
  name: string;
  position: Point;
  lookAt: Point;
};

export const views: View[] = [
  {
    id: "arrival",
    world: "hello",
    zone: null,
    name: "Valley arrival",
    position: [4, 5.4, 30],
    lookAt: [-1, 6, -22],
  },
  {
    id: "path",
    world: "hello",
    zone: null,
    name: "The winding path",
    position: [-3, 5.1, 8],
    lookAt: [-5, 7, -16],
  },
  {
    id: "arch",
    world: "hello",
    zone: null,
    name: "The ancient gateway",
    position: [-10, 5, -1],
    lookAt: [-3.6, 8, -13],
  },
  {
    id: "river",
    world: "hello",
    zone: null,
    name: "River & bridge",
    position: [13, 6.8, 0],
    lookAt: [27, 4.8, -31],
  },
  {
    id: "valley",
    world: "hello",
    zone: null,
    name: "Mountain overlook",
    position: [-3, 15, -41],
    lookAt: [23, 26, -140],
  },
  {
    id: "approach",
    world: "castle",
    zone: null,
    name: "The approach road",
    position: [150, 8, -180],
    lookAt: [150, 18, -250],
  },
  {
    id: "moat",
    world: "castle",
    zone: null,
    name: "The moat bridge",
    position: [150, 6.5, -196],
    lookAt: [150, 12, -214],
  },
  {
    id: "courtyard",
    world: "castle",
    zone: null,
    name: "The courtyard",
    position: [150, 5, -226],
    lookAt: [150, 14, -262],
  },
  {
    id: "hall",
    world: "castle",
    zone: "hall",
    name: "The great hall",
    position: [0, 2.2, 24],
    lookAt: [0, 6, -20],
  },
  {
    id: "gallery",
    world: "castle",
    zone: "gallery",
    name: "Gallery of Creations",
    position: [0, 2.2, 6],
    lookAt: [0, 3, -20],
  },
  {
    id: "library",
    world: "castle",
    zone: "library",
    name: "The Living Archives",
    position: [0, 2.2, 6],
    lookAt: [0, 3, -20],
  },
  {
    id: "gate",
    world: "garden",
    zone: null,
    name: "The garden gate",
    position: [-170, 6, -118],
    lookAt: [-170, 3, -152],
  },
  {
    id: "tree",
    world: "garden",
    zone: null,
    name: "Beneath the old tree",
    position: [-172, 3, -143],
    lookAt: [-178, 8, -150],
  },
  {
    id: "pond",
    world: "garden",
    zone: null,
    name: "The pond",
    position: [-156, 3, -136],
    lookAt: [-164, 1, -142],
  },
  {
    id: "gazebo",
    world: "garden",
    zone: null,
    name: "The gazebo",
    position: [-178, 4, -124],
    lookAt: [-166, 1, -140],
  },
];
