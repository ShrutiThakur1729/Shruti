import { useLayoutEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { BackSide, Vector3 } from 'three';
import { useStore } from '../state/store';
import { useFlight } from '../systems/freeFlight';

const discoveries = {
  hello: ['The river passes under the old bridge.', 'The valley journal introduces Shruti.'],
  castle: ['The west wing holds five project exhibits.', 'The east wing holds six readable books.'],
  garden: ['The Poetry Nook holds Shruti’s poems.', 'Choose a garden place to visit it immediately.'],
};

export default function LoadingCourt() {
  const camera = useThree(s => s.camera);
  const world = useStore(s => s.world);
  const [origin] = useState(() => camera.position.clone());
  const [look] = useState(() => camera.getWorldDirection(new Vector3()));
  const floor = origin.y - 2.1;
  useLayoutEffect(() => {
    const initialZone = useStore.getState().zone;
    useFlight.setState({preview:{x:origin.x, floor, z:origin.z, paused:false}});
    return () => {
      useFlight.setState({preview:null,active:false,lift:0});
      const state = useStore.getState();
      if (state.world === world && state.zone === initialZone && !state.journey && state.phase === 'world') {
        window.dispatchEvent(new CustomEvent('twi-teleport',{detail:{
          position:origin.toArray(),lookAt:origin.clone().add(look).toArray()
        }}));
      }
    };
  }, [origin,look,floor,world]);
  return <group position={[origin.x,floor,origin.z]}>
      <mesh><sphereGeometry args={[28,24,12]}/><meshBasicMaterial side={BackSide} color="#5b746d" fog={false}/></mesh>
      <hemisphereLight args={['#ffe8bd','#526750',2.4]} />
      <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[14,40]}/><meshStandardMaterial color={world==='garden'?'#63815c':'#b7a083'}/></mesh>
      {Array.from({length:6},(_,i)=>{
        const angle=i*Math.PI/3;
        return <group key={i} position={[8*Math.sin(angle),0,-8*Math.cos(angle)]} rotation={[0,-angle,0]}>
          {[-1.25,1.25].map(x=><mesh key={x} position={[x,1.5,0]}><cylinderGeometry args={[.2,.32,3,8]}/><meshStandardMaterial color="#d6bc91"/></mesh>)}
          <mesh position={[0,3,0]}><torusGeometry args={[1.25,.2,8,18,Math.PI]}/><meshStandardMaterial color="#e1c69a"/></mesh>
          <mesh position={[0,2,0]} onClick={e=>{
            e.stopPropagation();
            useFlight.setState(s=>({preview:s.preview && {...s.preview,note:discoveries[world][i%2]}}));
          }}><octahedronGeometry args={[.55]}/><meshBasicMaterial color="#ffd579"/></mesh>
        </group>;
      })}
    </group>;
}
