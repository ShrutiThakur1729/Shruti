import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureRecognizer } from '../src/systems/gestureRecognizer.ts';
const sample=(x=.5,y=.5,pinch=1)=>({x,y,pinch,confidence:.99});
test('horizontal and vertical swipes work both ways and repeat after cooldown',()=>{
 for(const [dx,dy] of [[.4,0],[-.4,0],[0,.4],[0,-.4]]) {
  const r=new GestureRecognizer(); let events=[];
  for(let cycle=0;cycle<2;cycle++) for(let i=0;i<10;i++) events.push(...r.update(sample(.5+dx*i/9,.5+dy*i/9),cycle*1000+i*30));
  const swipes=events.filter(e=>e.type==='swipe'); assert.equal(swipes.length,2); assert.equal(Math.sign(dx||dy),Math.sign(swipes[0].dx||swipes[0].dy));
 }
});
test('jitter, low confidence and slow movement do not swipe',()=>{
 const r=new GestureRecognizer(); let events=[];
 for(let i=0;i<100;i++) events.push(...r.update(sample(.5+i*.001,.5+Math.sin(i)*.006),i*33));
 assert.equal(events.length,0); assert.equal(r.update({...sample(.9),confidence:.2},3400).length,0);
});
test('tap selects once; held pinch drags and release/loss cancel without selection',()=>{
 const r=new GestureRecognizer(); r.update(sample(.5,.5,.2),0);
 assert.equal(r.update(sample(.5,.5,.6),140).filter(e=>e.type==='tap').length,1);
 assert.equal(r.update(sample(),180).length,0);
 let actions=[]; for(let i=0;i<20;i++) actions.push(...r.update(sample(.5+i*.002,.5,.2),600+i*33));
 assert.equal(actions.filter(e=>e.type==='hold').length,1); assert.ok(actions.some(e=>e.type==='drag'));
 assert.deepEqual(r.update(null,1300).map(e=>e.type),['release']); assert.equal(r.update(sample(),1340).length,0);
});
test('two hands zoom without swipe or selection',()=>{
 const r=new GestureRecognizer(); r.update({...sample(),span:.3},0);
 const actions=r.update({...sample(),span:.33},33); assert.equal(actions[0].type,'zoom'); assert.ok(actions[0].scale!>1);
});
