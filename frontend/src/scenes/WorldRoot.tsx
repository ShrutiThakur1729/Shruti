import { Suspense,lazy } from "react";
import { Html } from "@react-three/drei";
import FirstHello from "./FirstHello";
const CastleWorld=lazy(()=>import("./CastleWorld"));
const CastleInterior=lazy(()=>import("./CastleInterior"));
const GardenWorld=lazy(()=>import("./GardenWorld"));
import { useStore } from "../state/store";

export default function WorldRoot() {
  const world = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
  return (
    <Suspense fallback={<Html center><div className="world-loading" role="status">Lighting the lanterns…<small>Preparing your path into the world</small></div></Html>}>
      {world === "hello" && <FirstHello />}
      {world === "castle" && (zone ? <CastleInterior zone={zone} /> : <CastleWorld />)}
      {world === "garden" && <GardenWorld />}
    </Suspense>
  );
}
