import { create } from 'zustand';

type PreviewArea = { x: number; floor: number; z: number; note?:string };
export const useFlight = create<{
  active: boolean; speed: number; lift: number; preview: PreviewArea | null;
  pending:number; previewChoice:'auto'|'stay'|'skip';
}>(() => ({ active: false, speed: 10, lift: 0, preview: null, pending:0,previewChoice:'auto' }));

export function toggleFlight(active: boolean) {
  useFlight.setState({ active, lift: active ? 3 : 0 });
}
export const flightLimits = {
  hello: {left:-110,right:110,near:55,far:-160,ceiling:75},
  castle: {left:80,right:220,near:-165,far:-300,ceiling:78},
  garden: {left:-199,right:-141,near:-115,far:-174,ceiling:36},
};
