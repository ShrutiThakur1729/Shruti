import { useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as T from 'three';
import { GARDEN, random, gardenGround, POND_BRIDGE, pondBridgeHeight } from './terrain';
import { Stones, Lantern, useSurface } from './shared/Props';

function PondWater(){
  const material=useMemo(()=>new T.ShaderMaterial({
    uniforms:{time:{value:0}},
    vertexShader:`varying vec3 worldPos;
      void main(){worldPos=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPos,1.);}`,
    fragmentShader:`uniform float time;varying vec3 worldPos;
      void main(){
        vec2 p=worldPos.xz;float t=time*.45;
        float a=sin(p.x*2.3+p.y*1.7+t*2.0),b=sin(p.y*3.4-p.x*.7-t*1.3);
        vec3 n=normalize(vec3(a*.07,1.,b*.06));
        vec3 v=normalize(cameraPosition-worldPos),r=reflect(-v,n);
        float fresnel=.08+.55*pow(1.-max(dot(n,v),0.),3.);
        vec3 sky=mix(vec3(.62,.37,.20),vec3(.36,.52,.59),smoothstep(0.,.75,r.y));
        float cloud=sin(r.x*16.+r.z*8.)*sin(r.z*19.-r.x*4.);
        sky=mix(sky,vec3(.84,.68,.46),smoothstep(.25,.85,cloud)*.3);
        float shore=length(p-vec2(-162.,-141.))/9.5;
        vec3 water=mix(vec3(.025,.13,.13),vec3(.15,.24,.17),smoothstep(.4,1.,shore));
        vec3 light=normalize(vec3(-.6,.45,-.45));
        float sun=pow(max(dot(r,light),0.),140.);
        vec3 color=mix(water,sky,fresnel)+vec3(1.,.71,.32)*sun*1.6;
        color+=vec3(.24,.28,.19)*pow(max(0.,a*b),16.)*.15;
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }),[]);
  useEffect(()=>()=>material.dispose(),[material]);
  useFrame((_,dt)=>{material.uniforms.time.value+=Math.min(dt,.1);});
  return <mesh position={[GARDEN.pond.x,GARDEN.pond.water,GARDEN.pond.z]} rotation={[-Math.PI/2,0,0]} material={material}><circleGeometry args={[GARDEN.pond.r,96]}/></mesh>;
}

function Lilies(){
  const group=useRef<T.Group>(null);
  const pads=useMemo(()=>{
    const r=random(218);
    return Array.from({length:24},()=>{const a=r()*Math.PI*2,d=2+r()*5.2;return {x:Math.cos(a)*d,z:Math.sin(a)*d,s:.55+r()*.45,rot:r()*6.28};}).filter(p=>Math.abs(p.z)>1.8);
  },[]);
  useFrame(({clock})=>{group.current?.children.forEach((l,i)=>{l.position.y=.035+Math.sin(clock.elapsedTime*.9+i)*.025;l.rotation.z=Math.sin(clock.elapsedTime*.6+i)*.018;});});
  return <group ref={group} position={[GARDEN.pond.x,GARDEN.pond.water,GARDEN.pond.z]}>
    {pads.map((p,i)=><group key={i} position={[p.x,.04,p.z]} rotation={[0,p.rot,0]} scale={p.s}>
      <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.55,24,.12,Math.PI*2-.32]}/><meshStandardMaterial color={i%2?'#537644':'#68834a'} roughness={.4} side={T.DoubleSide}/></mesh>
      {i%3===0 && <group position={[0,.06,0]}>{Array.from({length:9},(_,j)=><mesh key={j} position={[Math.sin(j*6.28/9)*.12,.07,Math.cos(j*6.28/9)*.12]} rotation={[.5,j*6.28/9,0]} scale={[.075,.065,.23]}><sphereGeometry args={[1,8,5]}/><meshStandardMaterial color={i%2?'#f3d9df':'#e7a3bb'} roughness={.5}/></mesh>)}<mesh position={[0,.15,0]}><sphereGeometry args={[.075,8,6]}/><meshStandardMaterial color="#e3b154"/></mesh></group>}
    </group>)}
  </group>;
}

function Bridge(){
  const wood=useSurface('bark_brown_02',2);
  const parts=useMemo(()=>{
    const {x0,x1,z,halfWidth}=POND_BRIDGE;
    const items:{p:T.Vector3;s:T.Vector3;r:number}[]=[];
    const n=40,step=(x1-x0)/n;
    for(let i=0;i<=n;i++){
      const x=x0+i*step,y=pondBridgeHeight(x);
      items.push({p:new T.Vector3(x,y-.08,z),s:new T.Vector3(step-.025,.16,halfWidth*2+.12),r:0});
      for(const side of [-1,1]){
        if(i%4===0)items.push({p:new T.Vector3(x,y+.46,z+side*(halfWidth+.06)),s:new T.Vector3(.13,1.15,.13),r:0});
        items.push({p:new T.Vector3(x,y+1,z+side*(halfWidth+.06)),s:new T.Vector3(step+.04,.1,.12),r:0});
      }
    }
    return items;
  },[]);
  return <><Stones items={parts} material={wood}/>{[-173,-151].map((x,i)=><Lantern key={x} position={[x,pondBridgeHeight(x),-142.7]} light={i===0}/>)}</>;
}

function FallingWater(){
  const ref=useRef<T.Mesh>(null);
  const texture=useMemo(()=>{
    const c=document.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d')!;const r=random(601);
    for(let i=0;i<90;i++){const x=r()*128;g.strokeStyle=`rgba(225,243,235,${.08+r()*.35})`;g.lineWidth=1+r()*2;g.beginPath();g.moveTo(x,r()*256);g.lineTo(x-3,r()*256);g.stroke();}
    const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t;
  },[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  useFrame((_,dt)=>{texture.offset.y+=dt*.4;});
  const w=GARDEN.waterfall;
  return <group position={[w.x,GARDEN.pond.water,w.z]}>
    {[0,1,2].map(i=><mesh key={i} position={[0,1.5+i*.15,.12*i]} rotation={[-.12,Math.PI*.75,0]} ref={i===0?ref:undefined}><planeGeometry args={[1.5,3,1,12]}/><meshStandardMaterial map={texture} transparent opacity={.55} depthWrite={false} side={T.DoubleSide} roughness={.2} color="#b9d9ca"/></mesh>)}
  </group>;
}

function ShoreReeds(){
  const ref=useRef<T.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const r=random(28),o=new T.Object3D();
    for(let i=0;i<90;i++){
      const a=r()*6.28,d=8.5+r()*.7,x=GARDEN.pond.x+Math.cos(a)*d,z=GARDEN.pond.z+Math.sin(a)*d;
      o.position.set(x,GARDEN.pond.water+.3,z);o.rotation.set((r()-.5)*.2,a,(r()-.5)*.2);o.scale.set(.045,.7+r()*.7,.045);o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);
      ref.current!.setColorAt(i,new T.Color(i%3?'#6b7945':'#7c6846'));
    }
    ref.current!.instanceMatrix.needsUpdate=true;
  },[]);
  return <instancedMesh ref={ref} args={[undefined,undefined,90]}><cylinderGeometry args={[.5,1,1,5]}/><meshStandardMaterial roughness={.8}/></instancedMesh>;
}

export default function GardenPond(){
  const stone=useSurface('cobblestone_floor_08',2);
  const banks=useMemo(()=>{
    const r=random(217);return Array.from({length:74},(_,i)=>{
      const a=i/74*Math.PI*2,d=GARDEN.pond.r+.2+r()*.5;
      const x=GARDEN.pond.x+Math.cos(a)*d,z=GARDEN.pond.z+Math.sin(a)*d;
      return {p:new T.Vector3(x,gardenGround(x,z)-.1,z),s:new T.Vector3(.5+r()*.55,.22+r()*.22,.35+r()*.4),r:a};
    }).filter(p=>Math.abs(p.p.z-POND_BRIDGE.z)>1.5);
  },[]);
  return <group><PondWater/><Lilies/><Bridge/><Stones items={banks} material={stone}/><ShoreReeds/><FallingWater/>
    {[0,1,2].map(i=><mesh key={i} position={[GARDEN.waterfall.x+.4,GARDEN.pond.water+.4+i*.7,GARDEN.waterfall.z-i*.3]} rotation={[.12,i*.7,.2]} castShadow material={stone}><dodecahedronGeometry args={[1.3-i*.15,1]}/></mesh>)}
  </group>;
}
