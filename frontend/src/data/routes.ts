import type { WorldId } from './worlds';

// The same destinations drive the roadside gates, touch navigation and hand picks.
export const worldRoutes: { id: string; world: WorldId; to: WorldId; pos: [number, number] }[] = [
  {id:'hello-castle',world:'hello',to:'castle',pos:[3,17]},
  {id:'hello-garden',world:'hello',to:'garden',pos:[-10,17]},
  {id:'castle-hello',world:'castle',to:'hello',pos:[143,-176]},
  {id:'castle-garden',world:'castle',to:'garden',pos:[157,-176]},
  {id:'garden-hello',world:'garden',to:'hello',pos:[-176,-121]},
  {id:'garden-castle',world:'garden',to:'castle',pos:[-164,-115]},
];
