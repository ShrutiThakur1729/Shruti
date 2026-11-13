import { toggleFlight, useFlight } from '../systems/freeFlight';
import { useProgress } from '@react-three/drei';
import { getWorld } from '../data/worlds';
import { useStore } from '../state/store';

export function LoadingStatus() {
  const preview = useFlight(s=>s.preview);
  const active = useFlight(s=>s.active);
  const world = useStore(s=>s.world);
  const pending=useFlight(s=>s.pending);
  const loaded = useProgress(s=>s.loaded), total = useProgress(s=>s.total);
  if (!preview) return pending ? <aside className="preview-info" role="status">Loading {getWorld(world).name}…</aside> : null;
  return <aside className="preview-info">
    <strong>{pending ? 'Preparing '+getWorld(world).name : 'Flight courtyard'}</strong>
    {pending>0 && <small role="status">{total > loaded ? `${loaded} of ${total} assets loaded` : 'Preparing the world…'}</small>}
    <p>{preview.note ?? 'Explore the courtyard or touch a lantern.'}</p>
    {!active && <button onClick={()=>{useFlight.setState({previewChoice:'stay'});toggleFlight(true);}}>Try flying</button>}
    <button onClick={()=>useFlight.setState({active:false,lift:0,previewChoice:'skip'})}>Skip preview</button>
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
