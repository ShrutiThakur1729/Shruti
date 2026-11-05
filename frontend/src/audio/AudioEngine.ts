import type { WorldId } from "../data/worlds";
import type { AudioSettings } from "../state/store";

const BACKEND = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

type SfxName =
  | "chime"
  | "select"
  | "hover"
  | "page"
  | "bookOpen"
  | "bookClose"
  | "door"
  | "travel";

type WorldMusic = {
  root: number;
  chords: number[][];
  tempo: number;
  melody: number[];
  bell: boolean;
  low: boolean;
};

const MUSIC: Record<WorldId, WorldMusic> = {
  hello: {
    root: 62,
    chords: [
      [0, 4, 7, 11],
      [-3, 2, 5, 9],
      [-5, 0, 4, 7],
      [2, 5, 9, 12],
    ],
    tempo: 4.2,
    melody: [0, 2, 4, 7, 9, 12, 14],
    bell: false,
    low: false,
  },
  castle: {
    root: 57,
    chords: [
      [0, 3, 7, 10],
      [-2, 3, 5, 8],
      [-4, 0, 3, 7],
      [-5, -1, 2, 5],
    ],
    tempo: 5.6,
    melody: [0, 3, 5, 7, 10, 12],
    bell: true,
    low: true,
  },
  garden: {
    root: 65,
    chords: [
      [0, 4, 7, 9],
      [-3, 0, 4, 7],
      [2, 5, 7, 11],
      [-1, 2, 6, 9],
    ],
    tempo: 3.6,
    melody: [0, 2, 4, 6, 7, 9, 11, 12],
    bell: true,
    low: false,
  },
};

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  musicBus: GainNode | null = null;
  sfxBus: GainNode | null = null;
  settings: AudioSettings = {
    master: 0.8,
    music: 0.55,
    sfx: 0.8,
    voice: 1,
    muted: false,
    captions: true,
  };
  world: WorldId = "hello";
  private musicTimer: number | null = null;
  private chordIndex = 0;
  private musicGainTarget = 1;
  private ambientTimers: number[] = [];
  private ambientSources: AudioScheduledSourceNode[] = [];
  private noiseBuffer: AudioBuffer | null = null;
  private themeEl: HTMLAudioElement | null = null;
  themeAvailable = false;
  themePlaying = false;
  narrationEl: HTMLAudioElement | null = null;
  private ducked = false;
  magicShopActive = false;
  private footTimer: number | null = null;

  get supported() {
    return typeof window !== "undefined" && "AudioContext" in window;
  }

  init() {
    if (this.ctx || !this.supported) return;
    const Ctx = window.AudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.connect(this.master);
    const len = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.applyVolumes();
    this.detectTheme();
  }

  private async detectTheme() {
    try {
      const res = await fetch("audio/website-theme.m4a", { method: "HEAD" });
      this.themeAvailable = res.ok;
    } catch {
      this.themeAvailable = false;
    }
  }

  applyVolumes() {
    if (!this.ctx || !this.master) return;
    const { master, music, sfx, muted } = this.settings;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : master, now, 0.08);
    if (this.musicBus) {
      this.musicBus.gain.setTargetAtTime(
        music * this.musicGainTarget * (this.ducked ? 0.22 : 1),
        now,
        0.2
      );
    }
    if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(sfx, now, 0.08);
    if (this.narrationEl) this.narrationEl.volume = Math.min(1, this.settings.voice * (muted ? 0 : master));
    if (this.themeEl) this.themeEl.volume = Math.min(1, music * (muted ? 0 : master) * 1.2);
  }

  setSettings(s: AudioSettings) {
    this.settings = s;
    this.applyVolumes();
  }

  /* ————— music ————— */
  setWorld(world: WorldId) {
    if (this.world === world && this.musicTimer) return;
    this.world = world;
    this.stopProceduralMusic();
    this.stopAmbient();
    if (this.themePlaying) {
      // website theme keeps playing; only ambience changes
      this.startAmbient(world);
      return;
    }
    if (!this.ctx || !this.musicBus) return;
    const fadeOut = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(0, fadeOut, 0.4);
    window.setTimeout(() => {
      this.startProceduralMusic();
      this.startAmbient(world);
    }, 900);
  }

  startTheme() {
    if (!this.themeAvailable || this.themePlaying) return;
    this.themeEl = new Audio("audio/website-theme.m4a");
    this.themeEl.loop = true;
    this.themeEl.addEventListener("ended", () => (this.themePlaying = false));
    this.themeEl.play().then(() => {
      this.themePlaying = true;
      this.applyVolumes();
    }).catch(() => {});
  }

  pauseTheme() {
    this.themeEl?.pause();
    this.themePlaying = false;
  }

  resumeTheme() {
    if (this.themeEl && !this.magicShopActive) {
      this.themeEl.play().then(() => {
        this.themePlaying = true;
        this.applyVolumes();
      }).catch(() => {});
    }
  }

  private startProceduralMusic() {
    if (!this.ctx || !this.musicBus) return;
    this.chordIndex = 0;
    const fade = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(
      this.settings.music * this.musicGainTarget * (this.ducked ? 0.22 : 1),
      fade + 0.05,
      0.8
    );
    this.scheduleChord();
    this.musicTimer = window.setInterval(
      () => this.scheduleChord(),
      MUSIC[this.world].tempo * 1000
    );
  }

  private stopProceduralMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private scheduleChord() {
    if (!this.ctx || !this.musicBus) return;
    const cfg = MUSIC[this.world];
    const t = this.ctx.currentTime + 0.05;
    const chord = cfg.chords[this.chordIndex % cfg.chords.length];
    this.chordIndex++;
    const dur = cfg.tempo;
    // pad — one gentle voice per chord tone
    chord.slice(0, 3).forEach((semi, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cfg.low ? 520 : 820;
      osc.type = cfg.bell ? "sine" : "triangle";
      osc.frequency.value = midi(cfg.root + semi + (cfg.low && i === 0 ? -12 : 0));
      osc.detune.value = (i - 1) * 4;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + dur * 0.35);
      gain.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
      osc.connect(filter).connect(gain).connect(this.musicBus!);
      osc.start(t);
      osc.stop(t + dur * 1.1);
    });
    // sparse melody plucks
    for (let n = 0; n < 2; n++) {
      if (Math.random() > 0.72) continue;
      const note = cfg.melody[Math.floor(Math.random() * cfg.melody.length)];
      const start = t + dur * (0.3 + Math.random() * 0.6);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = cfg.bell ? "sine" : "triangle";
      osc.frequency.value = midi(cfg.root + 12 + note);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(cfg.bell ? 0.055 : 0.07, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (cfg.bell ? 2.4 : 1.4));
      osc.connect(gain).connect(this.musicBus!);
      osc.start(start);
      osc.stop(start + (cfg.bell ? 2.5 : 1.5));
    }
  }

  /* ————— ambient layers ————— */
  private startAmbient(world: WorldId) {
    if (!this.ctx || !this.noiseBuffer || !this.master) return;
    const mkNoise = (
      filterType: BiquadFilterType,
      freq: number,
      gainVal: number,
      lfoFreq: number,
      lfoDepth: number
    ) => {
      const src = this.ctx!.createBufferSource();
      src.buffer = this.noiseBuffer!;
      src.loop = true;
      const filter = this.ctx!.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = freq;
      const gain = this.ctx!.createGain();
      gain.gain.value = gainVal;
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.value = lfoFreq;
      lfoGain.gain.value = lfoDepth;
      lfo.connect(lfoGain).connect(gain.gain);
      src.connect(filter).connect(gain).connect(this.master!);
      src.start();
      lfo.start();
      this.ambientSources.push(src, lfo);
    };
    if (world === "hello") {
      mkNoise("lowpass", 380, 0.045, 0.07, 0.02); // wind through trees
      mkNoise("bandpass", 950, 0.012, 0.23, 0.006); // distant stream
      this.scheduleChirps(7000);
    } else if (world === "castle") {
      mkNoise("lowpass", 240, 0.05, 0.05, 0.022); // deep wind around stone
    } else {
      mkNoise("lowpass", 320, 0.035, 0.06, 0.015); // evening breeze
      mkNoise("bandpass", 1100, 0.02, 0.31, 0.008); // stream & waterfall
      this.scheduleChirps(9000);
      this.scheduleCrickets();
    }
  }

  private stopAmbient() {
    this.ambientTimers.forEach((t) => window.clearTimeout(t));
    this.ambientTimers = [];
    this.ambientSources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    this.ambientSources = [];
  }

  private scheduleChirps(gap: number) {
    const tick = window.setTimeout(() => {
      if (this.ctx && this.master && !document.hidden) {
        const t = this.ctx.currentTime;
        const chirps = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < chirps; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const start = t + i * 0.22;
          osc.type = "sine";
          osc.frequency.setValueAtTime(2300 + Math.random() * 900, start);
          osc.frequency.exponentialRampToValueAtTime(3100, start + 0.09);
          osc.frequency.exponentialRampToValueAtTime(2100, start + 0.18);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.016, start + 0.03);
          gain.gain.linearRampToValueAtTime(0, start + 0.2);
          osc.connect(gain).connect(this.master);
          osc.start(start);
          osc.stop(start + 0.25);
        }
      }
      this.scheduleChirps(5000 + Math.random() * 9000);
    }, gap);
    this.ambientTimers.push(tick);
  }

  private scheduleCrickets() {
    const tick = window.setTimeout(() => {
      if (this.ctx && this.master && !document.hidden) {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 4200;
        gain.gain.value = 0;
        for (let i = 0; i < 6; i++) {
          const s = t + i * 0.12;
          gain.gain.setValueAtTime(0.006, s);
          gain.gain.setValueAtTime(0, s + 0.06);
        }
        osc.connect(gain).connect(this.master);
        osc.start(t);
        osc.stop(t + 0.9);
      }
      this.scheduleCrickets();
    }, 6500 + Math.random() * 7000);
    this.ambientTimers.push(tick);
  }

  /* ————— sfx ————— */
  playSfx(name: SfxName) {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const tone = (
      freq: number,
      dur: number,
      vol: number,
      type: OscillatorType = "sine",
      slideTo?: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(this.sfxBus!);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    };
    const noiseBurst = (
      dur: number,
      vol: number,
      type: BiquadFilterType,
      from: number,
      to?: number
    ) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer!;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.setValueAtTime(from, t);
      if (to) filter.frequency.exponentialRampToValueAtTime(to, t + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filter).connect(gain).connect(this.sfxBus!);
      src.start(t);
      src.stop(t + dur + 0.05);
    };
    switch (name) {
      case "chime":
        tone(1046, 1.4, 0.1);
        tone(1568, 1.8, 0.06);
        tone(2093, 1.2, 0.03);
        break;
      case "select":
        tone(660, 0.3, 0.06, "triangle");
        tone(880, 0.5, 0.04, "sine");
        break;
      case "hover":
        tone(1900, 0.04, 0.015);
        break;
      case "page":
        noiseBurst(0.22, 0.05, "bandpass", 1200, 3200);
        break;
      case "bookOpen":
        tone(96, 0.16, 0.1, "sine", 70);
        window.setTimeout(() => this.playSfx("page"), 140);
        break;
      case "bookClose":
        tone(84, 0.2, 0.12, "sine", 60);
        noiseBurst(0.1, 0.03, "lowpass", 900);
        break;
      case "door":
        noiseBurst(1.3, 0.09, "lowpass", 130);
        tone(150, 0.9, 0.03, "sawtooth", 88);
        break;
      case "travel":
        noiseBurst(1.2, 0.05, "highpass", 300, 2400);
        window.setTimeout(() => this.playSfx("chime"), 700);
        break;
    }
  }

  /* ————— footsteps ————— */
  startFootsteps(material: "stone" | "grass" | "wood") {
    this.stopFootsteps();
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const step = () => {
      if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.playbackRate.value = 0.9 + Math.random() * 0.3;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value =
        material === "stone" ? 900 : material === "wood" ? 620 : 420;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(material === "stone" ? 0.05 : 0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      src.connect(filter).connect(gain).connect(this.sfxBus);
      src.start(t, Math.random());
      src.stop(t + 0.13);
    };
    step();
    this.footTimer = window.setInterval(step, 520);
  }

  stopFootsteps() {
    if (this.footTimer) window.clearInterval(this.footTimer);
    this.footTimer = null;
  }

  /* ————— narration & ducking ————— */
  duck(on: boolean) {
    this.ducked = on;
    if (!this.ctx || !this.musicBus) return;
    this.musicBus.gain.setTargetAtTime(
      this.settings.music *
        this.musicGainTarget *
        (on ? 0.22 : 1) *
        (this.themePlaying ? 1 : 1),
      this.ctx.currentTime,
      0.3
    );
    if (this.themeEl) {
      const target = this.settings.music * (this.settings.muted ? 0 : this.settings.master) * (on ? 0.25 : 1.2);
      this.themeEl.volume = Math.min(1, target);
    }
  }

  pauseForTrack() {
    this.magicShopActive = true;
    this.pauseTheme();
    if (this.ctx && this.musicBus) {
      this.musicBus.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.5);
    }
    this.stopAmbient();
  }

  resumeFromTrack() {
    this.magicShopActive = false;
    this.resumeTheme();
    if (this.ctx && this.musicBus) {
      this.musicBus.gain.setTargetAtTime(
        this.settings.music * this.musicGainTarget,
        this.ctx.currentTime,
        0.8
      );
    }
    this.startAmbient(this.world);
  }

  async narrate(text: string): Promise<boolean> {
    this.stopNarration();
    if (!BACKEND) return false;
    try {
      const res = await fetch(`${BACKEND}/api/narrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return false;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const el = new Audio(url);
      el.volume = Math.min(1, this.settings.voice * (this.settings.muted ? 0 : this.settings.master));
      this.narrationEl = el;
      this.duck(true);
      await new Promise<void>((resolve) => {
        el.onended = () => resolve();
        el.onerror = () => resolve();
        el.play().catch(() => resolve());
      });
      URL.revokeObjectURL(url);
      this.narrationEl = null;
      return true;
    } catch {
      this.narrationEl = null;
      return false;
    }
  }

  pauseNarration() {
    this.narrationEl?.pause();
  }

  resumeNarration() {
    this.narrationEl?.play().catch(() => {});
  }

  stopNarration() {
    if (this.narrationEl) {
      this.narrationEl.onended = null;
      this.narrationEl.pause();
      this.narrationEl = null;
    }
    this.duck(false);
  }
}

export const audio = new AudioEngine();
