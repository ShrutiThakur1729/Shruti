import { useEffect } from 'react';
import { useStore } from '../state/store';
import { bindCastleWalk, startCastleWalk, stopCastleWalk, useCastleLanding, useCastleWalk } from '../systems/castleWalk';

export function CastleWalkStatus() {
  const zone = useStore(s => s.zone);
  const landing = useCastleLanding();
  const walking = useCastleWalk();
  useEffect(bindCastleWalk, []);
  if (walking) {
    return <button onClick={stopCastleWalk} aria-label="Stop guided walk">Walking… · Stop</button>;
  }
  if (!zone) return <button className="route-pick" onClick={() => startCastleWalk('gate')}>Walk through the gates →</button>;
  if (zone === 'hall' && !landing) return <button className="route-pick" onClick={() => startCastleWalk('stairs')}>Climb the grand staircase ↑</button>;
  if (landing) return <button className="route-pick" onClick={() => useStore.getState().openPanel('castle-guide')}>Choose a wing →</button>;
  return <button onClick={() => startCastleWalk('return')}>Return to the landing</button>;
}

export default function CastleGuide() {
  const zone = useStore(s => s.zone);
  const landing = useCastleLanding();
  return <article className="panel-body castle-guide" data-testid="castle-guide">
    <span className="chapter-mark">THE CASTLE</span>
    <h2>{landing ? 'Choose a wing' : 'Visit the Gallery and Library'}</h2>
    <p className="lead">{landing ? 'Turn left for projects or right for books. Select a wing to walk there.' : 'The bridge leads through the gates into the Great Hall. Both wings open from the landing at the top of the staircase.'}</p>
    <div className="castle-routes">
      {!zone && <button onClick={() => startCastleWalk('gate')}><strong>Walk through the gates →</strong><small>Cross the bridge into the Great Hall.</small></button>}
      {zone === 'hall' && !landing && <button onClick={() => startCastleWalk('stairs')}><strong>Climb the grand staircase ↑</strong><small>Follow the carpet to the upper landing.</small></button>}
      {landing && <>
        <button onClick={() => startCastleWalk('gallery')}><span>WEST WING</span><strong>← Gallery of Creations</strong><small>Explore five of Shruti’s projects.</small></button>
        <button onClick={() => startCastleWalk('library')}><span>EAST WING</span><strong>Living Archives →</strong><small>Read about Shruti’s education, skills and experience.</small></button>
      </>}
      {(zone === 'gallery' || zone === 'library') && <>
        <button onClick={() => useStore.getState().openPanel('catalogue')}><strong>{zone === 'gallery' ? 'Explore the exhibits' : 'Browse the shelves'}</strong></button>
        <button onClick={() => startCastleWalk('return')}><strong>Return to the landing</strong><small>Walk back and choose the other wing.</small></button>
      </>}
    </div>
    {zone && <button className="btn-secondary" onClick={() => useStore.getState().setZone(null,{position:[150,4.2,-191],lookAt:[150,7,-207]})}>Return to the Castle grounds</button>}
  </article>;
}
