import { Suspense,lazy } from "react";
import LoadingCourt from './LoadingCourt';
import FirstHello from "./FirstHello";
const CastleWorld=lazy(()=>import("./CastleWorld"));
const CastleInterior=lazy(()=>import("./CastleInterior"));
const GardenWorld=lazy(()=>import("./GardenWorld"));
import { useStore } from "../state/store";

export default function WorldRoot() {
  const world = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
  return (
    <Suspense key={world} fallback={<LoadingCourt/>}>
      {world === "hello" && <FirstHello />}
      {world === "castle" && (zone ? <CastleInterior zone={zone} /> : <CastleWorld />)}
      {world === "garden" && <GardenWorld />}
    </Suspense>
  );
}
