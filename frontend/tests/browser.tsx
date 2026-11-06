// Local browser replay fixture; excluded from the normal Vite production entry.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import App from '../src/App';
import { useStore } from '../src/state/store';
import { GestureRecognizer } from '../src/systems/gestureRecognizer';
import { dispatchGesture } from '../src/systems/gestureDispatch';
function Replay() {
  const world=useStore(s=>s.world), journey=useStore(s=>s.journey);
  const [result,setResult]=useState('No trace replayed');
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
    <output data-testid="replay-result">{world} · {journey?`travelling to ${journey.to}`:'arrived'} · {result}</output>
  </aside></>;
}
createRoot(document.getElementById('root')!).render(<Replay/>);
