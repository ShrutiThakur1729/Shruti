import { useStore } from '../state/store';
import { input } from './input';
import type { GestureAction } from './gestureRecognizer';

export function dispatchGesture(action: GestureAction) {
  const s=useStore.getState();
  if(action.type==='release') { input.gestureWalk=false; }
  if(s.phase!=='world' || s.journey) { input.gestureWalk=false; return; }
  if(s.panel) {
    input.gestureWalk=false;
    window.dispatchEvent(new CustomEvent('twi-gesture',{detail:action}));
    return;
  }
  if(action.type==='swipe') { input.look.dx-=action.dx*3; input.look.dy-=action.dy*2; }
  if(action.type==='tap' && s.nearby) s.interactNow(s.nearby.id);
  if(action.type==='hold') input.gestureWalk=true;
  if(action.type==='drag') { input.look.dx-=action.dx*2; input.look.dy-=action.dy*1.4; }
}
