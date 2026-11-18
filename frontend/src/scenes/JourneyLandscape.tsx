import { useMemo, useEffect } from 'react';
import { Sky } from '@react-three/drei';
import * as T from 'three';
import { noise } from './terrain';
import { worlds } from '../data/worlds';

// A lightweight landscape keeps the valley visible throughout travel without
// mounting three asset-heavy worlds and their lighting at the same time.
export default function JourneyLandscape(){
  const ground=useMemo(()=>{
    const g=new T.PlaneGeometry(1100,1000,70,65);g.rotateX(-Math.PI/2);g.translate(0,-9,-130);
    const p=g.attributes.position,colors=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i),n=noise(x*.018,z*.018);
      const river=Math.abs(x-30-Math.sin(z*.014)*35);
      p.setY(i,river<12?-12:-8+n*5);
      const c=new T.Color().setHSL(.24,.26,.22+n*.13);colors.push(c.r,c.g,c.b);
    }
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
  },[]);
  const roads=useMemo(()=>worlds.map((w,i)=>{
    const to=worlds[(i+1)%3],a=new T.Vector3(w.arrival[0],-2.8,w.arrival[2]),b=new T.Vector3(to.arrival[0],-2.8,to.arrival[2]);
    return new T.TubeGeometry(new T.CatmullRomCurve3([a,a.clone().lerp(b,.45).add(new T.Vector3(18,0,24)),b]),60,1.5,5,false);
  }),[]);
  useEffect(()=>()=>{ground.dispose();roads.forEach(g=>g.dispose());},[ground,roads]);
  return <>
    <Sky sunPosition={[-80,30,-90]} turbidity={3.8} rayleigh={2}/>
    <hemisphereLight args={['#e8d9c4','#354732',1.6]}/><directionalLight position={[-80,100,-40]} color="#ffe0b0" intensity={2.6}/>
    <mesh geometry={ground}><meshStandardMaterial vertexColors roughness={1}/></mesh>
    <mesh position={[0,-10,-130]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1100,1000]}/><meshStandardMaterial color="#658f91" metalness={.35} roughness={.25}/></mesh>
    {roads.map((g,i)=><mesh key={i} geometry={g}><meshStandardMaterial color="#c5b088" roughness={.95}/></mesh>)}
    {Array.from({length:26},(_,i)=>{
      const a=i/26*Math.PI*2,x=Math.cos(a)*470,z=-130+Math.sin(a)*410,h=45+(i%5)*19;
      return <group key={i} position={[x,-10,z]}><mesh position={[0,h/2,0]}><coneGeometry args={[70,h,7]}/><meshStandardMaterial color={i%2?'#778781':'#929e97'} roughness={1}/></mesh><mesh position={[0,h*.81,0]}><coneGeometry args={[26,h*.38,7]}/><meshStandardMaterial color="#dce2d9" roughness={1}/></mesh></group>;
    })}
    {worlds.map(w=><group key={w.id} position={[w.arrival[0],-2,w.arrival[2]-40]}>
      {w.id==='castle'?[-9,0,9].map((x,i)=><group key={x} position={[x,0,0]}><mesh position={[0,8+i%2*3,0]}><cylinderGeometry args={[3,3.5,20,10]}/><meshStandardMaterial color="#a59985"/></mesh><mesh position={[0,21+i%2*3,0]}><coneGeometry args={[4,9,10]}/><meshStandardMaterial color="#4b6370"/></mesh></group>):<mesh position={[0,4,0]}><sphereGeometry args={[w.id==='garden'?12:7,12,8]}/><meshStandardMaterial color={w.id==='garden'?'#57724a':'#748258'}/></mesh>}
    </group>)}
  </>;
}
