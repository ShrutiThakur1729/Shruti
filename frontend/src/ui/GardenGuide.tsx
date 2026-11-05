import { useEffect,useState } from 'react';
import { interactions } from '../data/interactions';
export default function GardenGuide(){
 const places=interactions.filter(i=>i.world==='garden'&&i.kind!=='guestbook');
 const [selected,setSelected]=useState(places[0].id),[position,setPosition]=useState({x:-170,z:-118,yaw:0});
 useEffect(()=>{const fn=(e:Event)=>setPosition((e as CustomEvent).detail);window.addEventListener('twi-position',fn);return()=>window.removeEventListener('twi-position',fn);},[]);
 const p=places.find(i=>i.id===selected)!;
 const dx=p.pos[0]-position.x,dz=p.pos[1]-position.z;
 const bearing=Math.atan2(-dx,-dz)-position.yaw;
 return <aside className="garden-guide"><label htmlFor="garden-discovery">Find a little wonder</label><select id="garden-discovery" value={selected} onChange={e=>setSelected(e.target.value)}>{places.map(i=><option key={i.id} value={i.id}>{i.label==='The Gramophone'?'Personal Soundtrack':i.label}</option>)}</select><p><span style={{display:'inline-block',transform:`rotate(${-bearing}rad)`}} aria-hidden>↑</span> {Math.round(Math.hypot(dx,dz))} m · Follow the garden paths</p></aside>;
}
