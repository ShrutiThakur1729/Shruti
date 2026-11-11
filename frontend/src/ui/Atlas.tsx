import { useEffect, useRef, useState } from 'react';
import { worlds, getWorld, type WorldId } from '../data/worlds';
import { views } from '../data/views';
import { useStore } from '../state/store';
import type { GestureAction } from '../systems/gestureRecognizer';
export const mapLocations: Record<WorldId,[number,number]>={hello:[250,355],castle:[580,510],garden:[800,260]};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export default function Atlas(){
 const current=useStore(s=>s.world),travelTo=useStore(s=>s.travelTo);
 const [selected,select]=useState<WorldId>(current),[zoom,setZoom]=useState(1),[pan,setPan]=useState<[number,number]>([0,0]);
 const svg=useRef<SVGSVGElement>(null),pointers=useRef(new Map<number,{x:number;y:number}>()),lastDistance=useRef(0);
 const destination=getWorld(selected);
 const move=(dx:number,dy:number)=>setPan(([x,y])=>[clamp(x+dx,-650,650),clamp(y+dy,-430,430)]);
 useEffect(()=>{
  const handler=(event:Event)=>{
   const a=(event as CustomEvent<GestureAction>).detail;
   if(a.type==='swipe'||a.type==='drag')move(a.dx*900,a.dy*600);
   if(a.type==='zoom')setZoom(z=>clamp(z*(a.scale??1),1,2.8));
   if(a.type==='tap'){
    const r=svg.current?.getBoundingClientRect();if(!r)return;
    const x=((a.x*window.innerWidth-r.left)/r.width*1000-500-pan[0])/zoom+500;
    const y=((a.y*window.innerHeight-r.top)/r.height*667-333.5-pan[1])/zoom+333.5;
    const nearest=worlds.map(w=>({id:w.id,d:Math.hypot(x-mapLocations[w.id][0],y-mapLocations[w.id][1])})).sort((a,b)=>a.d-b.d)[0];
    if(nearest.d<100)select(nearest.id);
   }
  };window.addEventListener('twi-gesture',handler);return()=>window.removeEventListener('twi-gesture',handler);
 },[zoom,pan]);
 return <div className="atlas-layout illustrated-atlas" data-testid="atlas-panel">
  <div className="atlas-heading"><h2>The World Atlas</h2><p>Choose a world, then select Visit to travel there.</p></div>
  <nav className="atlas-approaches" aria-label="Scenic approaches"><span className="eyebrow">THE SCENIC ROUTE</span>{views.filter(v=>v.world===selected&&!v.zone).map(v=><button key={v.id} onClick={()=>travelTo(selected,v)}>{v.name} ↗</button>)}<p>Choose a star on the map, or fly to an approach.</p></nav><div className="map-wrap">
   <svg ref={svg} viewBox="0 0 1000 667" aria-label="World atlas — drag to pan, pinch or scroll to zoom" onPointerDown={e=>{pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{
    const old=pointers.current.get(e.pointerId);if(!old)return;
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const points=[...pointers.current.values()];
    if(points.length===2){const d=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);if(lastDistance.current)setZoom(z=>clamp(z*d/lastDistance.current,1,2.8));lastDistance.current=d;}
    else move((e.clientX-old.x)*1000/(svg.current?.clientWidth||1000),(e.clientY-old.y)*1000/(svg.current?.clientWidth||1000));
   }} onPointerUp={e=>{pointers.current.delete(e.pointerId);lastDistance.current=0;}} onPointerCancel={()=>{pointers.current.clear();lastDistance.current=0;}} onWheel={e=>setZoom(z=>clamp(z-e.deltaY*.001,1,2.8))}>
    <defs><filter id="route-glow"><feGaussianBlur stdDeviation="3"/></filter></defs>
    <rect width="1000" height="667" fill="#e7cd96"/>
    <g transform={`translate(${pan[0]+500} ${pan[1]+333.5}) scale(${zoom}) translate(-500 -333.5)`}>
     <image href="/assets/atlas-landscape.png" width="1000" height="667" preserveAspectRatio="xMidYMid slice"/>
     <path d="M250 355 C390 320 350 455 580 510 M250 355 C490 410 540 190 800 260" fill="none" stroke="#a26420" strokeWidth="10" opacity=".65"/>
     <path d="M250 355 C390 320 350 455 580 510 M250 355 C490 410 540 190 800 260" fill="none" stroke="#ffda72" strokeWidth="8" filter="url(#route-glow)"/>
     <path className="atlas-golden-route" d="M250 355 C390 320 350 455 580 510 M250 355 C490 410 540 190 800 260" fill="none" stroke="#fff6c8" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round"/>
     <text x="425" y="420" fill="#fff1bb" fontSize="22" aria-hidden>➤</text><text x="560" y="275" fill="#fff1bb" fontSize="22" aria-hidden>➤</text>
     {worlds.map(w=>{const[x,y]=mapLocations[w.id];return <g key={w.id} transform={`translate(${x} ${y})`} role="button" tabIndex={0} aria-label={w.name} aria-pressed={w.id===selected} data-testid={`atlas-marker-${w.id}`} className={`atlas-landmark ${selected===w.id?'selected':''}`} onPointerDown={e=>e.stopPropagation()} onClick={()=>select(w.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(w.id);}}}>
      <circle r="26" fill="#805824" fillOpacity=".35"/><circle r="19" fill="#a87936" stroke="#fff1bd" strokeWidth="2"/><path d="M0 -16 L4 -4 16 0 4 4 0 16 -4 4 -16 0 -4 -4 Z" fill="#fff1bd"/>
      <rect x="-102" y="29" width="204" height="33" rx="3" fill="#102b21" stroke="#d4b26b"/><text y="51" textAnchor="middle" fill="#fff0c3" fontSize="17">{w.name}</text>
      {current===w.id&&<text y="-35" textAnchor="middle" fill="#fff9df" stroke="#3f341f" strokeWidth="3" paintOrder="stroke" fontSize="13">✧ YOU ARE HERE</text>}
     </g>;})}
    </g>
    <g transform="translate(76 80)" aria-hidden className="atlas-compass"><circle r="37" fill="#ead4a4" fillOpacity=".85" stroke="#80602c"/>{[0,45,90,135].map(a=><path key={a} transform={`rotate(${a})`} d="M0 -48 L7 0 0 48 -7 0 Z" fill={a%90?'#c19850':'#765427'} stroke="#f6dfac"/>)}<circle r="5" fill="#ead4a4"/><text y="-53" textAnchor="middle" fontSize="14" fill="#583f20">N</text></g>
    <rect x="7" y="7" width="986" height="653" rx="12" fill="none" stroke="#9d7839" strokeWidth="3" pointerEvents="none"/>
   </svg>
   <div className="map-tools"><button aria-label="Zoom in" data-testid="atlas-zoom-in" onClick={()=>setZoom(z=>clamp(z+.2,1,2.8))}>+</button><button aria-label="Zoom out" data-testid="atlas-zoom-out" onClick={()=>setZoom(z=>clamp(z-.2,1,2.8))}>−</button><button data-testid="atlas-reset" onClick={()=>{setZoom(1);setPan([0,0]);}}>Reset map</button></div>
   <span className="map-caption">Drag to explore · pinch or scroll to zoom · choose a golden star</span>
  </div>
  <aside className="atlas-detail" data-testid="atlas-detail">
    <span className="eyebrow">CHOOSE A WORLD</span>
    <div className="destination-list atlas-world-picker">
      {worlds.map(w => (
        <button key={w.id} data-testid={`atlas-select-${w.id}`} aria-pressed={selected===w.id} onClick={()=>select(w.id)}>
          <strong>{w.name}</strong>
          <small>{w.id === 'hello' ? 'About Shruti' : w.id === 'castle' ? 'Projects & experience' : 'Poetry, books & music'}</small>
        </button>
      ))}
    </div>
    <h2>{destination.name}</h2>
    <div className={`atlas-thumbnail ${selected}`} role="img" aria-label={`${destination.name} illustration`}/>
    <p>{selected==='castle' ? 'Enter the gates and climb the stairs to the project gallery and library.' : selected==='garden' ? 'Visit the Poetry Nook, the Reading Nook and the personal soundtrack.' : 'Meet Shruti and read her introduction in the valley.'}</p>
    <button className="btn-primary" data-testid="atlas-travel-button" onClick={()=>travelTo(selected)}>Visit {destination.name} ↗</button>
    <button className="atlas-contact" onClick={()=>useStore.getState().set({phase:'opendoor',panel:null})}>The Open Door · Contact &amp; résumé ↗</button>
  </aside>
 </div>;
}
