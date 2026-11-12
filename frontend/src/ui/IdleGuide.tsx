import { useEffect } from 'react';
import { useStore } from '../state/store';

/** Point to the next available action after a pause. Never move keyboard focus. */
export default function IdleGuide() {
  const phase = useStore(s => s.phase);
  const world = useStore(s => s.world);
  const zone = useStore(s => s.zone);
  const panel = useStore(s => s.panel);
  const journey = useStore(s => s.journey);
  useEffect(() => {
    if (journey || phase === 'opendoor' || (panel && !['welcome','atlas','castle-guide','catalogue'].includes(panel))) return;
    const actions = panel === 'atlas' ? '.atlas-world-picker button:not([aria-pressed="true"])'
      : panel === 'castle-guide' ? '.castle-routes button'
      : panel === 'catalogue' ? '.dialog .destination-list button'
      : panel === 'welcome' ? '.welcome-choices button'
      : phase === 'landing' ? '[data-testid="enter-universe-button"]'
      : world === 'garden' ? '.garden-guide:not([open]) summary, .garden-guide[open] select'
      : world === 'castle' ? (zone === 'gallery' || zone === 'library' ? '[data-guide="catalogue"]' : '.quick-actions .route-pick')
      : '[data-testid="quick-meet"]';
    let timer = 0;
    let highlighted: Element | null = null;
    const reset = () => {
      highlighted?.classList.remove('idle-guide-target');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.hidden || document.querySelector('[aria-label="Stop guided walk"]')) return;
        highlighted = document.querySelector(actions);
        highlighted?.classList.add('idle-guide-target');
      }, 4200);
    };
    const events = ['pointermove','pointerdown','keydown','wheel','change','visibilitychange'];
    events.forEach(event => document.addEventListener(event, reset, {passive:true}));
    reset();
    return () => {
      events.forEach(event => document.removeEventListener(event, reset));
      window.clearTimeout(timer);
      highlighted?.classList.remove('idle-guide-target');
    };
  }, [phase, world, zone, panel, journey]);
  return null;
}
