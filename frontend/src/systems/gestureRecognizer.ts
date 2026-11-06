export type HandSample = { x: number; y: number; pinch: number; confidence: number; span?: number };
export type GestureAction = { type: 'swipe' | 'tap' | 'hold' | 'drag' | 'release' | 'zoom'; x: number; y: number; dx: number; dy: number; scale?: number };
export class GestureRecognizer {
  private previous: { x: number; y: number; t: number } | null = null;
  private history: { x: number; y: number; t: number }[] = [];
  private down: { t: number; x: number; y: number } | null = null;
  private held = false;
  private cooldown = 0;
  private span = 0;
  reset(): GestureAction[] {
    const released = this.down ? [{ type: 'release' as const, x: this.down.x, y: this.down.y, dx: 0, dy: 0 }] : [];
    this.previous = null; this.history = []; this.down = null; this.held = false; this.span = 0;
    return released;
  }
  update(raw: HandSample | null, now: number): GestureAction[] {
    if (!raw || raw.confidence < 0.65 || ![raw.x, raw.y, raw.pinch].every(Number.isFinite)) return this.reset();
    if (this.previous && now - this.previous.t > 250) this.reset();
    const prev = this.previous;
    const a = prev ? 1 - Math.exp(-(now-prev.t)/45) : 1;
    const p = { x: (prev?.x ?? raw.x) + (raw.x-(prev?.x ?? raw.x))*a, y: (prev?.y ?? raw.y)+(raw.y-(prev?.y ?? raw.y))*a, t: now };
    this.previous = p;
    const out: GestureAction[] = [];
    const action = (type: GestureAction['type'], dx = 0, dy = 0, scale?: number) => out.push({ type, x: p.x, y: p.y, dx, dy, scale });
    if (raw.span && raw.span > 0.08) {
      if (this.down) { action('release'); this.down = null; this.held = false; }
      if (this.span) action('zoom', 0, 0, Math.max(0.9, Math.min(1.1, raw.span / this.span)));
      this.span = raw.span; this.history = []; return out;
    }
    this.span = 0;
    const pinched = raw.pinch < (this.down ? 0.5 : 0.3);
    if (pinched && !this.down) { this.down = { t: now, x: p.x, y: p.y }; this.history = []; }
    if (pinched && this.down) {
      if (!this.held && now-this.down.t >= 420) { this.held = true; action('hold'); }
      if (this.held && prev) action('drag', p.x-prev.x, p.y-prev.y);
    } else if (this.down) {
      if (!this.held && now-this.down.t >= 60 && Math.hypot(p.x-this.down.x,p.y-this.down.y)<0.08 && now>=this.cooldown) { action('tap'); this.cooldown=now+280; }
      action('release'); this.down=null; this.held=false; this.history=[];
    } else {
      this.history.push(p); this.history=this.history.filter(h=>now-h.t<=320);
      const first=this.history[0], dx=p.x-first.x, dy=p.y-first.y, seconds=(now-first.t)/1000;
      const distance=Math.max(Math.abs(dx),Math.abs(dy));
      if(now>=this.cooldown && distance>0.23 && seconds>0.07 && distance/seconds>1) {
        action('swipe', Math.abs(dx)>Math.abs(dy)*1.2?dx:0, Math.abs(dy)>Math.abs(dx)*1.2?dy:0);
        this.cooldown=now+800; this.history=[];
      }
    }
    return out;
  }
}
