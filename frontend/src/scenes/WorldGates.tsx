import { useMemo, useEffect } from 'react';
import { Billboard } from '@react-three/drei';
import { worldRoutes } from '../data/routes';
import { getWorld, type WorldId } from '../data/worlds';
import { getGround } from './terrain';
import { useStore } from '../state/store';
import { Lantern, useSurface } from './shared/Props';
import { plaqueTexture } from './shared/textures';

export default function WorldGates({world}:{world:WorldId}){
  const stone=useSurface('cobblestone_floor_08',2);
  return <group>{worldRoutes.filter(r=>r.world===world).map(r=><Gate key={r.id} route={r} stone={stone}/>)}</group>;
}
function Gate({route,stone}:{route:typeof worldRoutes[number];stone:ReturnType<typeof useSurface>}){
  const name=getWorld(route.to).name;
  const label=useMemo(()=>plaqueTexture(name,'Beyond this gateway','Tap to travel'),[name]);
  useEffect(()=>()=>label.dispose(),[label]);
  return <group position={[route.pos[0],getGround(route.world,null,...route.pos),route.pos[1]]}
    userData={{discovery:route.id}} onClick={e=>{e.stopPropagation();useStore.getState().interactNow(route.id);}}>
    {[-1.7,1.7].map(x=><mesh key={x} position={[x,1.5,0]} material={stone} castShadow><boxGeometry args={[.48,3,.65]}/></mesh>)}
    <mesh position={[0,3,0]} material={stone} castShadow><torusGeometry args={[1.7,.24,8,24,Math.PI]}/></mesh>
    <mesh position={[0,.05,0]} rotation={[-Math.PI/2,0,0]} material={stone} receiveShadow><planeGeometry args={[4.3,3.2]}/></mesh>
    <Lantern position={[2.2,0,.3]}/>
    <Billboard position={[0,3.3,.42]} follow lockX lockZ><mesh><planeGeometry args={[3.6,1.8]}/><meshStandardMaterial map={label} emissive="#b5995b" emissiveIntensity={.35}/></mesh></Billboard>
  </group>;
}
