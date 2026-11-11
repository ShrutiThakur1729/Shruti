// Local browser replay fixture; excluded from the normal Vite production entry.
import { createRoot } from 'react-dom/client';
import { useState, useEffect, useRef } from 'react';
import { input } from '../src/systems/input';
import App from '../src/App';
import { useStore } from '../src/state/store';
import { GestureRecognizer } from '../src/systems/gestureRecognizer';
import { dispatchGesture } from '../src/systems/gestureDispatch';
function Replay() {
  const world=useStore(s=>s.world), journey=useStore(s=>s.journey);
  const [result,setResult]=useState('No trace replayed');
  const route=useRef<[number,number][]>([]), deadline=useRef(0);
  useEffect(()=>{
    const track=(e:Event)=>{
      if(!route.current.length)return;
      const p=(e as CustomEvent).detail,target=route.current[0];
      const dx=target[0]-p.x,dz=target[1]-p.z,d=Math.hypot(dx,dz);
      if(d<.55)route.current.shift();
      if(!route.current.length||performance.now()>deadline.current){
        input.joy.active=false;input.joy.x=input.joy.y=0;
        setResult(`${route.current.length?'Blocked':'Route complete'} at ${p.x.toFixed(1)}, ${p.y.toFixed(2)}, ${p.z.toFixed(1)}`);route.current=[];return;
      }
      input.joy.active=true;input.joy.x=(dx*Math.cos(p.yaw)-dz*Math.sin(p.yaw))/d;input.joy.y=(dx*Math.sin(p.yaw)+dz*Math.cos(p.yaw))/d;
      const yaw=Math.atan2(-dx,-dz), turn=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw));input.look.dx+=Math.max(-.3,Math.min(.3,turn));
    };window.addEventListener('twi-position',track);return()=>{window.removeEventListener('twi-position',track);input.joy.active=false;};
  },[]);
  const walk=(side:number)=>{useStore.getState().set({world:'castle'});useStore.getState().setZone('hall',{position:[0,2.3,-16],lookAt:[0,8,-34]});route.current=[[0,-32.5],[side*39,-32.5]];deadline.current=performance.now()+40000;setResult('Walking the real stair and corridor collision route');};
  const replay=(dx:number,slow=false)=>{
    const r=new GestureRecognizer();const labels:string[]=[];
    for(let i=0;i<10;i++)for(const action of r.update({x:.5+dx*i/9,y:.5,pinch:1,confidence:.99},i*(slow?180:30))){
      const label=dispatchGesture(action);labels.push(label||action.type);
    }
    setResult(labels.join(', ')||'No gesture recognised');
  };
  return <><App/><aside style={{position:'fixed',top:0,left:'35%',zIndex:10000,background:'#11291f',color:'#fff',padding:8,border:'1px solid gold'}} aria-label="Browser replay fixture">
    <button onClick={()=>replay(-.4)}>Replay next-world swipe</button>
    <button onClick={()=>replay(.4)}>Replay previous-world swipe</button>
    <button onClick={()=>replay(.15,true)}>Replay gentle look trace</button>
    <button onClick={()=>walk(-1)}>Walk staircase to gallery</button>
    <button onClick={()=>walk(1)}>Walk staircase to library</button>
    <button onClick={()=>{route.current=[];input.joy.active=false;useStore.getState().set({world:'castle',phase:'world',panel:null});useStore.getState().setZone('hall',{position:[0,2.3,24],lookAt:[0,6,-24]});}}>Open Castle test scene</button>
    <output data-testid="replay-result">{world} · {journey?`travelling to ${journey.to}`:'arrived'} · {result}</output>
  </aside></>;
}
createRoot(document.getElementById('root')!).render(<Replay/>);
