import { audio } from "./AudioEngine";

type Callbacks = {
  onLine: (line: string, index: number) => void;
  onDone: () => void;
  onState: (playing: boolean) => void;
};

const LINE_FALLBACK_MS = 3400;

class Narrator {
  private queue: string[] = [];
  private index = 0;
  private seq = "";
  private token = 0;
  playing = false;
  paused = false;
  private cb: Callbacks;

  constructor(cb: Callbacks) {
    this.cb = cb;
  }

  play(seqId: string, lines: string[]) {
    this.stop();
    this.seq = seqId;
    this.queue = lines;
    this.index = 0;
    this.playing = true;
    this.paused = false;
    this.playLine(++this.token);
  }

  private async playLine(token: number) {
    if (token !== this.token || !this.playing) return;
    const line = this.queue[this.index];
    if (line === undefined) {
      this.finish();
      return;
    }
    this.cb.onLine(line, this.index);
    this.cb.onState(true);
    if (this.paused) return;
    const ok = await audio.narrate(line);
    if (token !== this.token || !this.playing) return;
    if (!ok) {
      // text-only fallback: hold each line briefly
      await new Promise((r) => window.setTimeout(r, Math.max(2600, line.length * 62)));
      if (token !== this.token || !this.playing) return;
    }
    while(this.paused && token===this.token) await new Promise(r=>window.setTimeout(r,80));
    if(token!==this.token||!this.playing)return;
    this.index++;
    this.playLine(token);
  }

  pause() {
    if (!this.playing) return;
    this.paused = true;
    audio.pauseNarration();
    this.cb.onState(false);
  }

  resume() {
    if (!this.playing || !this.paused) return;
    this.paused = false;
    audio.resumeNarration();
    this.cb.onState(true);
    if (!audio.narrationEl) {
      // was in a text-only hold — restart the current line
      this.playLine(++this.token);
    }
  }

  skip() {
    if (!this.playing) return;
    audio.stopNarration();
    this.index++;
    this.playLine(++this.token);
  }

  stop() {
    this.token++;
    this.playing = false;
    this.paused = false;
    audio.stopNarration();
    this.cb.onState(false);
    this.cb.onLine('',0);
  }

  private finish() {
    this.playing = false;
    audio.duck(false);
    this.cb.onLine('',0);
    this.cb.onState(false);
    this.cb.onDone();
  }
}

export let narrator: Narrator;
export function initNarrator(cb: Callbacks) {
  if (!narrator) narrator = new Narrator(cb);
  return narrator;
}
