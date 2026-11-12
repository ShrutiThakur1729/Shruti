import { useState } from 'react';
import { interactions } from '../data/interactions';
import { gardenCanStand, gardenWalkHeight } from '../scenes/terrain';
import { useStore } from '../state/store';

const places = interactions.filter(place => place.world === 'garden');
export default function GardenGuide() {
  const [visited, setVisited] = useState('');
  const place = places.find(item => item.id === visited);
  const visit = (id: string) => {
    const place = places.find(item => item.id === id);
    if (!place) return;
    const [x,z] = place.pos;
    // Stand in front of the selected marker. Check the pond, buildings and tree
    // before choosing a camera position inside the interaction radius.
    for (const distance of [2.6, 2, 1.2, 3.5, 5, 7]) {
      for (let side = 0; side < 16; side++) {
        const angle = side * Math.PI / 8;
        const px = x + distance * Math.sin(angle), pz = z + distance * Math.cos(angle);
        if (!gardenCanStand(px,pz)) continue;
        useStore.getState().setZone(null, {
          position: [px, gardenWalkHeight(px,pz) + 2.1, pz],
          lookAt: [x, gardenWalkHeight(x,z) + 1.55, z],
        });
        setVisited(place.id);
        return;
      }
    }
  };
  return <div className="garden-guide">
    <label htmlFor="garden-discovery">Visit a Garden place</label>
    <select id="garden-discovery" value="" onChange={event => visit(event.target.value)}>
      <option value="" disabled>{place ? 'Choose another place…' : 'Choose a place…'}</option>
      {places.map(item => <option key={item.id} value={item.id}>{item.label === 'The Gramophone' ? 'Personal Soundtrack' : item.label}</option>)}
    </select>
    {place && <button className="btn-primary" onClick={() => useStore.getState().interactNow(place.id)}>{place.hint} →</button>}
  </div>;
}
