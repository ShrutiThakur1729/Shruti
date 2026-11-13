import { Suspense,lazy,useEffect } from "react";
import LoadingCourt, { LoadingSignal } from './LoadingCourt';
import { useFlight } from '../systems/freeFlight';
import FirstHello from "./FirstHello";
const CastleWorld=lazy(()=>import("./CastleWorld"));
const CastleInterior=lazy(()=>import("./CastleInterior"));
const GardenWorld=lazy(()=>import("./GardenWorld"));
import { useStore } from "../state/store";

export default function WorldRoot() {
  const world = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
  const journey=useStore(s=>s.journey);
  const pending=useFlight(s=>s.pending);
  const choice=useFlight(s=>s.previewChoice);
  const courtyard=!journey && (choice==='stay' || (pending>0 && choice==='auto'));
  useEffect(()=>{
    if(journey || (!pending && choice==='skip'))useFlight.setState({previewChoice:'auto'});
  },[journey,pending,choice]);
  useEffect(()=>()=>{useFlight.setState({previewChoice:'auto'});},[]);
  const atmosphere = world === 'castle' ? (zone ? '#100d0a' : '#d3c2a4') : world === 'garden' ? '#d9b48a' : '#b9c7c4';
  const near = world === 'castle' ? (zone ? 40 : 80) : world === 'garden' ? 45 : 100;
  const far = world === 'castle' ? (zone ? 120 : 420) : world === 'garden' ? 200 : 450;
  return <>
    <color attach="background" args={[atmosphere]}/>
    {!courtyard && <fog attach="fog" args={[atmosphere,near,far]}/>}
    <Suspense key={world} fallback={<LoadingSignal/>}><group visible={!courtyard}>
      {world === "hello" && <FirstHello />}
      {world === "castle" && (zone ? <CastleInterior zone={zone} /> : <CastleWorld />)}
      {world === "garden" && <GardenWorld />}
    </group></Suspense>
    {courtyard && <LoadingCourt key={'courtyard-'+world}/>}
  </>;
}
