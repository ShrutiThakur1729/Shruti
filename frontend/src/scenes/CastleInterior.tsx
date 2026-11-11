import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as T from "three";
import { blockGeometry, useSurface, Stones, Banner } from "./shared/Props";
import { plaqueTexture, stainedGlassTexture, bannerTexture } from "./shared/textures";
import { useStore, type Zone } from "../state/store";
import { Gallery, Library } from "./CastleWings";
import { WING_ORIGIN } from '../systems/castleLayout';

export default function CastleInterior({ zone }: { zone: Zone }) {
  const quality = useStore((s) => s.quality);
  return (
    <>
      <color attach="background" args={["#100d0a"]} />
      <fog attach="fog" args={["#100d0a", 40, 120]} />
      <ambientLight intensity={1.1} color="#d8c5a4" />
      <hemisphereLight args={['#ffe4ba','#584331',1.6]} />
      {[-39,39].map(x=><pointLight key={x} position={[x,12.5,-30]} intensity={90} distance={34} decay={2} color="#ffd49a" />)}
      <directionalLight position={[-8, 22, 10]} intensity={0.7} color="#ffe2ae" />
      {quality === "high" && (
        <>
          <pointLight position={[0, 9.5, -9]} intensity={36} distance={30} decay={2} color="#ffbf74" />
          <pointLight position={[0, 9.5, 9]} intensity={30} distance={28} decay={2} color="#ffbf74" />
        </>
      )}
      <Hall />
      <CommonRoomShell zone="hall" />
      <group position={[...WING_ORIGIN.gallery]}><Gallery /><CommonRoomShell zone="gallery" /></group>
      <group position={[...WING_ORIGIN.library]}><Library /><CommonRoomShell zone="library" /></group>
      <LandingCorridors />
    </>
  );
}

/* shared floor / walls used by all three rooms */
function CommonRoomShell({ zone }: { zone: Zone }) {
  const stone = useSurface("cobblestone_floor_08", 9);
  const size = zone === "hall" ? { w: 30, d: 66 } : { w: 28, d: 32 };
  const centerZ=zone==='hall'?-3:-6;
  return (
    <group position={[0,0,centerZ]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size.w, size.d]} />
        <primitive object={stone} attach="material" />
      </mesh>
      <mesh position={[0, 7, -size.d / 2 - 0.5]} receiveShadow>
        <boxGeometry args={[size.w + 2, 14, 1]} />
        <meshStandardMaterial color="#2b241d" roughness={1} />
      </mesh>
      <mesh position={[0, 7, size.d / 2 + 0.5]} receiveShadow>
        <boxGeometry args={[size.w + 2, 14, 1]} />
        <meshStandardMaterial color="#2b241d" roughness={1} />
      </mesh>
      {[-1,1].map(side=>{
        const passage=zone==='hall'||(zone==='gallery'?side===1:side===-1);
        const gap=zone==='hall'?-29.5:-3.5;
        const segments=passage?[[-size.d/2,gap-2.5],[gap+2.5,size.d/2]]:[[-size.d/2,size.d/2]];
        return segments.filter(([a,b])=>b>a).map(([a,b],i)=><mesh key={`${side}-${i}`} position={[side*(size.w/2+.5),7,(a+b)/2]}><boxGeometry args={[1,14,b-a]}/><meshStandardMaterial color="#2b241d" roughness={1}/></mesh>);
      })}
      <mesh position={[0, 13.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size.w, size.d]} />
        <meshStandardMaterial color="#241c15" roughness={1} />
      </mesh>
    </group>
  );
}

function Hall() {
  const stone = useSurface("cobblestone_floor_08", 5);
  const glass = useMemo(() => stainedGlassTexture(), []);
  const wayfinding = useMemo(()=>plaqueTexture('The Upper Wings','← Gallery of Creations · Living Archives →','Follow the grand staircase'),[]);
  const pillars = useMemo(() => {
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    for (const px of [-10, 10])
      for (const pz of [-24, -16, -8, 0, 8, 16])
        list.push({ p: new T.Vector3(px, 6.5, pz), s: new T.Vector3(1.7, 13, 1.7), r: 0 });
    return list;
  }, []);
  const steps = useMemo(() => {
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    for (let i = 0; i < 13; i++)
      list.push({
        p: new T.Vector3(0, .2+(i+1)*6.25/13-.25, -18-(i+.5)*12/13),
        s: new T.Vector3(9, 0.5, 12/13+.02),
        r: 0,
      });
    return list;
  }, []);
  const railPosts = useMemo(() => {
    const list: { p: T.Vector3; s: T.Vector3; r: number }[] = [];
    for (let i = 0; i < 13; i++) {
      list.push({ p: new T.Vector3(-4.4, 1.1 + i * 0.46, -19.2 - i * 0.92), s: new T.Vector3(0.3, 1.3, 0.3), r: 0 });
      list.push({ p: new T.Vector3(4.4, 1.1 + i * 0.46, -19.2 - i * 0.92), s: new T.Vector3(0.3, 1.3, 0.3), r: 0 });
    }
    return list;
  }, []);
  const windows: [number, number, number, number][] = useMemo(() => {
    const list: [number, number, number, number][] = [];
    for (const pz of [-20, -10, 0, 10]) {
      list.push([-14.4, 9.6, pz, Math.PI / 2]);
      list.push([14.4, 9.6, pz, -Math.PI / 2]);
    }
    return list;
  }, []);
  return (
    <group>
      <Stones items={pillars} material={stone} />
      {/* pillar bases & caps */}
      {[-10, 10].flatMap((px) =>
        [-24, -16, -8, 0, 8, 16].flatMap((pz) => [
          <mesh key={`b${px}${pz}`} position={[px, 0.4, pz]} castShadow>
            <boxGeometry args={[2.3, 0.8, 2.3]} />
            <meshStandardMaterial color="#4a4238" roughness={0.95} />
          </mesh>,
          <mesh key={`c${px}${pz}`} position={[px, 12.6, pz]} castShadow>
            <boxGeometry args={[2.3, 0.8, 2.3]} />
            <meshStandardMaterial color="#4a4238" roughness={0.95} />
          </mesh>,
        ]))
      }
      {/* rib vaults */}
      {[-24, -16, -8, 0, 8, 16].map((z) => (
        <mesh key={z} position={[0, 13.2, z]} rotation={[0, 0, 0]} scale={[1, 0.72, 1]}>
          <torusGeometry args={[14.9, 0.22, 6, 24, Math.PI]} />
          <meshStandardMaterial color="#3a2e22" roughness={0.9} />
        </mesh>
      ))}
      {/* stained glass */}
      {windows.map(([x, y, z, ry], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, ry, 0]}>
          <planeGeometry args={[3, 5]} />
          <meshStandardMaterial
            map={glass}
            emissiveMap={glass}
            emissive="#ffffff"
            emissiveIntensity={0.85}
            roughness={0.6}
          />
        </mesh>
      ))}
      <Chandelier position={[0, 10.6, -9]} />
      <Chandelier position={[0, 10.6, 9]} />
      {/* carpet */}
      <mesh position={[0, 0.21, -2]} receiveShadow>
        <boxGeometry args={[4.2, 0.06, 40]} />
        <meshStandardMaterial color="#5d2a26" roughness={1} />
      </mesh>
      {/* grand staircase */}
      <mesh position={[0,10.5,-35.7]}><planeGeometry args={[8,2.2]}/><meshStandardMaterial map={wayfinding} emissive="#e5b96b" emissiveIntensity={.3}/></mesh>
      <Stones items={steps} material={stone} />
      <Stones items={railPosts} material={stone} shadows={false} />
      {[-4.4, 4.4].map((x) => (
        <mesh key={x} position={[x, 4.3, -25.4]} rotation={[0.44, 0, 0]}>
          <boxGeometry args={[0.35, 0.35, 13.4]} />
          <meshStandardMaterial color="#4a3423" roughness={0.85} />
        </mesh>
      ))}
      {/* balcony */}
      <mesh position={[0, 6.2, -32.5]} castShadow receiveShadow>
        <boxGeometry args={[30, 0.5, 5]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.9} />
      </mesh>
      {Array.from({ length: 13 }, (_, i) => -12+i*2).filter(x=>Math.abs(x)>4.5).map((x) => (
        <mesh key={x} position={[x, 7.1, -30]}>
          <boxGeometry args={[0.22, 1.6, 0.22]} />
          <meshStandardMaterial color="#3a2e22" roughness={0.9} />
        </mesh>
      ))}
      {/* wing doors */}
      {/* exit doors */}
      <group position={[0, 0, 29.4]}>
        <mesh position={[0, 3.4, 0.2]} castShadow>
          <boxGeometry args={[7.4, 6.8, 0.5]} />
          <meshStandardMaterial color="#4a3423" roughness={0.88} />
        </mesh>
        {[-1.7, 1.7].map((x) => (
          <mesh key={x} position={[x, 3.2, 0.5]} castShadow>
            <boxGeometry args={[3.1, 6, 0.2]} />
            <meshStandardMaterial color="#5a3d28" roughness={0.85} />
          </mesh>
        ))}
        <mesh position={[0, 7.2, 0.2]}>
          <boxGeometry args={[8.4, 0.7, 0.6]} />
          <meshStandardMaterial color="#6b5335" roughness={0.8} />
        </mesh>
        {[-2.6, 2.6].map((x) => (
          <mesh key={x} position={[x, 4.6, 0.75]}>
            <cylinderGeometry args={[0.09, 0.09, 1.5, 8]} />
            <meshStandardMaterial color="#c9a75c" metalness={0.85} roughness={0.3} />
          </mesh>
        ))}
      </group>
      <Banner position={[-10, 9.4, -3.55]} label="S" bg="#5d2a26" />
      <Banner position={[10, 9.4, 4.55]} label="S" bg="#5d2a26" />
      <Chandelier position={[0, 10.6, 0]} small />
    </group>
  );
}

function Chandelier({ position, small = false }: { position: [number, number, number]; small?: boolean }) {
  const ring = useRef<T.Group>(null);
  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.y = clock.elapsedTime * 0.08;
  });
  return (
    <group position={position}>
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 4.6, 6]} />
        <meshStandardMaterial color="#2e2618" />
      </mesh>
      <group ref={ring}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[small ? 1.2 : 1.7, 0.09, 8, 24]} />
          <meshStandardMaterial color="#6b5335" metalness={0.7} roughness={0.4} />
        </mesh>
        {Array.from({ length: small ? 6 : 8 }, (_, i) => {
          const a = (i / (small ? 6 : 8)) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * (small ? 1.2 : 1.7), 0.18, Math.sin(a) * (small ? 1.2 : 1.7)]}>
              <mesh>
                <cylinderGeometry args={[0.06, 0.06, 0.5, 6]} />
                <meshStandardMaterial color="#e8d9a3" emissive="#ffbe5c" emissiveIntensity={2.6} />
              </mesh>
              <mesh position={[0, 0.38, 0]}>
                <sphereGeometry args={[0.09, 8, 8]} />
                <meshStandardMaterial color="#ffe9b0" emissive="#ffbe5c" emissiveIntensity={3.4} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function WingDoor({ x, ry, title }: { x: number; ry: number; title: string }) {
  const tex = useMemo(() => plaqueTexture(title, "Press E", ""), [title]);
  const open = useStore((s) => s.nearby);
  return (
    <group position={[x, 0, 0]} rotation={[0, ry, 0]}>
      {/* arch opening glow */}
      <mesh position={[0.1, 4.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[6, 8.8]} />
        <meshStandardMaterial color="#2a2018" roughness={1} />
      </mesh>
      <mesh position={[0.3, 4.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[5.2, 8]} />
        <meshStandardMaterial color="#e8c88a" emissive="#c9954a" emissiveIntensity={open?.id === (title.includes("Gallery") ? "hall-gallery" : "hall-archives") ? 1.6 : 0.55} />
      </mesh>
      <mesh position={[0.25, 7.9, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.6, 1]}>
        <torusGeometry args={[2.6, 0.3, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#54422c" roughness={0.9} />
      </mesh>
      <mesh position={[0.75, 2.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.6, 1.8]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
      <pointLight position={[2.4, 5, 0]} intensity={6} distance={9} decay={2} color="#ffca6e" />
    </group>
  );
}

// end of CastleInterior

function LandingCorridors(){
 const west=useMemo(()=>plaqueTexture('West Wing','Gallery of Creations','Walk through the arch'),[]);
 const east=useMemo(()=>plaqueTexture('East Wing','The Living Archives','Walk through the arch'),[]);
 return <group>{[-1,1].map(side=><group key={side}>
  <mesh position={[side*20,6.2,-32.5]} receiveShadow><boxGeometry args={[12,.5,5]}/><meshStandardMaterial color="#65523a" roughness={.9}/></mesh>
  {[-35,-30].map(z=><mesh key={z} position={[side*20,7.05,z]}><boxGeometry args={[12,1.2,.25]}/><meshStandardMaterial color="#4c3928" roughness={.85}/></mesh>)}
  <mesh position={[side*14.5,10.8,-32.5]} rotation={[0,side===-1?Math.PI/2:-Math.PI/2,0]}><planeGeometry args={[4.5,1.8]}/><meshStandardMaterial map={side<0?west:east} emissive="#94713c" emissiveIntensity={.3}/></mesh>
  <mesh position={[side*15,9.3,-32.5]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[2.6,.2,6,24,Math.PI]}/><meshStandardMaterial color="#a58c60" roughness={.8}/></mesh>
  <pointLight position={[side*20,9,-32.5]} intensity={16} distance={17} color="#ffcd83"/>
 </group>)}</group>;
}
