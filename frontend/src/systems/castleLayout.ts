export const WING_ORIGIN = { gallery: [-39,6.25,-23], library: [39,6.25,-23] } as const;
export type InteriorZone='hall'|'gallery'|'library';
export function interiorZone(x:number):InteriorZone {return x < -24 ? 'gallery' : x > 24 ? 'library' : 'hall';}
export function interiorFloor(x:number,z:number){
 if(Math.abs(x)>14||z<=-30)return 6.45;
 if(Math.abs(x)<=4.2&&z<-18)return .2+Math.min(1,(-z-18)/12)*6.25;
 return .2;
}
export function interiorWalkable(x:number,z:number){
 const ax=Math.abs(x);
 // Hall, stair and landing; side rails keep the visitor on the stair ramp.
 if(ax<14&&z>=-35&&z<=29){
  if(z < -18 && z > -30 && ax>4.2)return false;
  for(const px of [-10,10])for(const pz of [-24,-16,-8,0,8,16])if(Math.hypot(x-px,z-pz)<1.65)return false;
  return true;
 }
 if(ax>=14&&ax<=25.8&&z>=-34.6&&z<=-30.4)return true;
 if(ax>25&&ax<52&&z>=-44&&z<=-14){
  const zone=interiorZone(x), origin=WING_ORIGIN[zone as 'gallery'|'library'];
  const lx=x-origin[0],lz=z-origin[2];
  if(zone==='gallery')for(const [px,pz] of [[-10,-16],[-10,-6],[-10,4],[10,-11],[10,1]])if(Math.hypot(lx-px,lz-pz)<1.5)return false;
  if(zone==='library')for(const [px,pz] of [[-8.2,-14],[-3.4,-14],[3.4,-14],[8.2,-14],[-5.8,2],[5.8,2]])if(Math.hypot(lx-px,lz-pz)<.8)return false;
  return true;
 }
 return false;
}
