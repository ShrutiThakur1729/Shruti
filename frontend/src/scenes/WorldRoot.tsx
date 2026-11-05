import { Suspense } from "react";
import FirstHello from "./FirstHello";
import CastleWorld from "./CastleWorld";
import CastleInterior from "./CastleInterior";
import GardenWorld from "./GardenWorld";
import { useStore } from "../state/store";

export default function WorldRoot() {
  const world = useStore((s) => s.world);
  const zone = useStore((s) => s.zone);
  return (
    <Suspense fallback={null}>
      {world === "hello" && <FirstHello />}
      {world === "castle" && (zone ? <CastleInterior zone={zone} /> : <CastleWorld />)}
      {world === "garden" && <GardenWorld />}
    </Suspense>
  );
}
