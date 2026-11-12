import { toggleFlight, useFlight } from '../systems/freeFlight';
import { useProgress } from '@react-three/drei';
import { getWorld } from '../data/worlds';
import { useStore } from '../state/store';

export function LoadingStatus() {
  const preview = useFlight(s=>s.preview);
  const active = useFlight(s=>s.active);
  const world = useStore(s=>s.world);
  const loaded = useProgress(s=>s.loaded), total = useProgress(s=>s.total);
  if (!preview) return null;
  return <aside className="preview-info">
    <strong>Preparing {getWorld(world).name}</strong>
    <small role="status">{total > loaded ? `${loaded} of ${total} assets loaded` : 'Lighting the courtyard…'}</small>
    {!preview.paused && <><p>{preview.note ?? 'Explore the courtyard or touch a lantern.'}</p>
      {!active && <button onClick={()=>toggleFlight(true)}>Try flying</button>}
      <button onClick={()=>useFlight.setState({active:false,lift:0,preview:{...preview,paused:true}})}>Skip preview</button>
    </>}
  </aside>;
}

export default function FlightDeck() {
  const active = useFlight(s => s.active);
  const speed = useFlight(s => s.speed);
  if (!active) return null;
  return <div className="flight-deck" aria-label="Flight controls">
    <button onClick={() => useFlight.setState(s => ({lift:s.lift + 4}))}>Rise ↑</button>
    <button onClick={() => useFlight.setState(s => ({lift:s.lift - 4}))}>Descend ↓</button>
    <label>Speed <input type="range" min="4" max="20" value={speed} onChange={e=>useFlight.setState({speed:Number(e.target.value)})}/></label>
    <button onClick={() => toggleFlight(false)}>Return to walking</button>
  </div>;
}
