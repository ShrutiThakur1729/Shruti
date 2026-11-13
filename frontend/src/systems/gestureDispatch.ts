import { useStore } from '../state/store';
import { input } from './input';
import type { GestureAction } from './gestureRecognizer';
import { swipeDestination } from './worldNavigation';
let navigationCooldown = 0;
const controls='button:not(:disabled),summary,a[href],input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[role="button"],[data-hand-action]';
export function handTarget(x:number,y:number) {
  return document.elementFromPoint(x*innerWidth,y*innerHeight);
}
function activate(target:Element|null,x:number,y:number) {
  const control=target?.closest(controls);
  if(!control || control.closest('[inert],[aria-disabled="true"]')) return false;
  if(control instanceof HTMLSelectElement) {
    window.dispatchEvent(new CustomEvent('twi-hand-select',{detail:control}));
  } else if(control instanceof HTMLInputElement && control.type==='range') {
    const bounds=control.getBoundingClientRect();
    const min=Number(control.min||0),max=Number(control.max||100);
    const step=Number(control.step)||1;
    const ratio=Math.max(0,Math.min(1,(x*innerWidth-bounds.left)/bounds.width));
    const value=min+Math.round(ratio*(max-min)/step)*step;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set?.call(control,String(value));
    control.dispatchEvent(new Event('input',{bubbles:true}));
  } else if (control instanceof HTMLTextAreaElement || (control instanceof HTMLInputElement && !['checkbox','radio','button','submit'].includes(control.type))) {
    control.focus();
  } else {
    control.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:x*innerWidth,clientY:y*innerHeight}));
  }
  return true;
}

export function dispatchGesture(action: GestureAction) {
  const s=useStore.getState();
  if(action.type==='release') { input.gestureWalk=false; }
  const target=handTarget(action.x,action.y);
  if(action.type==='tap' && activate(target,action.x,action.y))return 'Selected';
  if(action.type==='drag' && (s.panel || s.phase!=='world' || target?.closest('.hand-options'))) {
    if(s.panel==='atlas' && target?.closest('.map-wrap svg')) {
      window.dispatchEvent(new CustomEvent('twi-gesture',{detail:action}));return;
    }
    let node:HTMLElement|null=target instanceof HTMLElement?target:target?.parentElement??null;
    while(node && node!==document.body){
      if(node.scrollHeight>node.clientHeight+2 && /auto|scroll/.test(getComputedStyle(node).overflowY)){
        node.scrollBy(0,-action.dy*innerHeight*1.8);return;
      }
      node=node.parentElement;
    }
    if(s.phase==='opendoor')window.scrollBy(0,-action.dy*innerHeight*1.8);
  }
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
  if(action.type==='tap' && target instanceof HTMLCanvasElement) {
    const picked=new CustomEvent('twi-hand-pick',{detail:action,cancelable:true});
    if(window.dispatchEvent(picked) && s.nearby)s.interactNow(s.nearby.id);
  }
  if(action.type==='hold') input.gestureWalk=true;
  if(action.type==='drag') { input.look.dx-=action.dx*2; input.look.dy-=action.dy*1.4; }
}
