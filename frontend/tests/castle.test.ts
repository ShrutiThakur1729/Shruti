import test from 'node:test';
import assert from 'node:assert/strict';
import { interiorFloor, interiorWalkable, interiorZone } from '../src/systems/castleLayout.ts';
test('continuous climb to landing and walkable paths to both wings',()=>{
 let last=interiorFloor(0,-18);
 for(let z=-18;z>=-32.5;z-=.1){assert.ok(interiorWalkable(0,z));let y=interiorFloor(0,z);assert.ok(y>=last-.0001&&y-last<.1);last=y;}
 assert.equal(last,6.45);
 for(const side of [-1,1])for(let x=0;x<=39;x+=.1){assert.ok(interiorWalkable(side*x,-32.5),`blocked at ${side*x}`);assert.equal(interiorFloor(side*x,-32.5),6.45);}
 assert.equal(interiorZone(-39),'gallery');assert.equal(interiorZone(39),'library');
 assert.equal(interiorWalkable(20,-25),false);assert.equal(interiorWalkable(6,-24),false);
});
