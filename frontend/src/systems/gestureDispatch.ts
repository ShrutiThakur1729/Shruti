import { useStore } from '../state/store';
import { input } from './input';
import type { GestureAction } from './gestureRecognizer';
import { swipeDestination } from './worldNavigation';
let navigationCooldown = 0;

export function dispatchGesture(action: GestureAction) {
  const s=useStore.getState();
  if(action.type==='release') { input.gestureWalk=false; }
  if(s.phase!=='world' || s.journey) { input.gestureWalk=false; return; }
  if(s.panel) {
    input.gestureWalk=false;
    window.dispatchEvent(new CustomEvent('twi-gesture',{detail:action}));
    return;
  }
  if(action.type==='swipe') {
    const destination = swipeDestination(s.world, action.dx, action.dy);
    if (destination && performance.now() >= navigationCooldown) {
      navigationCooldown = performance.now() + 4500;
      input.gestureWalk = false;
      input.look.dx = input.look.dy = 0;
      s.travelTo(destination);
      return destination === 'hello' ? 'To The First Hello' : destination === 'castle' ? 'To The Castle' : 'To The Memory Garden';
    }
  }
  if(action.type==='tap' && s.nearby) s.interactNow(s.nearby.id);
  if(action.type==='hold') input.gestureWalk=true;
  if(action.type==='drag') { input.look.dx-=action.dx*2; input.look.dy-=action.dy*1.4; }
}
