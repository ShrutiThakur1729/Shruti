import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import { getWorld } from "../data/worlds";
import { audio } from "../audio/AudioEngine";
import { narrator } from "../audio/narrator";

export default function NarrationBar() {
  const audio_ = useStore((s) => s.audio);
  const setAudio = useStore((s) => s.setAudio);
  const world = useStore((s) => s.world);
  const caption = useStore((s) => s.caption);
  const narrating = useStore((s) => s.narrating);
  const guided = useStore((s) => s.guided);
  const openPanel = useStore((s) => s.openPanel);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--world-bar-height', `${bar.current?.offsetHeight || 100}px`);
    });
    if (bar.current) observer.observe(bar.current);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--world-bar-height'); };
  }, []);
  const current = getWorld(world);
  const themeOn = audio.themeAvailable && audio.themePlaying;

  const toggleMute = () => setAudio({ muted: !audio_.muted });

  return (
    <footer ref={bar} className="narration-bar" data-testid="narration-bar">
      <div className="nb-narrator">
        {guided ? (
          <>
            <span className="nb-voice" aria-hidden>
              <i />
            </span>
            <div className="nb-caption-wrap">
              <span className="nb-label">
                NARRATOR {narrating ? "· SPEAKING" : ""}
              </span>
              <p className="nb-caption" data-testid="narration-caption" aria-live="polite" hidden={!audio_.captions}>
                {caption || "The narrator waits — press play to begin the guided journey."}
              </p>
            </div>
            <div className="nb-narr-controls">
              <button
                data-testid="narration-toggle"
                onClick={() => (narrating ? narrator.pause() : narrator.playing ? narrator.resume() : narrator.restart())}
                aria-label={narrating ? "Pause narration" : "Play narration"}
              >
                {narrating ? "❚❚" : "▶"}
              </button>
              <button data-testid="narration-skip" onClick={() => narrator.skip()} aria-label="Skip narration line">
                ▶▶
              </button>
              <button onClick={()=>narrator.restart()} aria-label="Restart narration">↺</button>
            </div>
          </>
        ) : (
          <div className="nb-caption-wrap">
            <span className="nb-label">FREE EXPLORATION</span>
            <p className="nb-caption muted">
              Guided narration is off. Open Help to switch it on.
            </p>
          </div>
        )}
      </div>

      <div className="nb-music" data-testid="music-indicator">
        <span aria-hidden>♪</span>
        <span>{themeOn ? "Theme Song" : current.music}</span>
      </div>

      <div className="nb-actions">
        <button
          data-testid="captions-toggle"
          className={audio_.captions ? "on" : ""}
          onClick={() => setAudio({ captions: !audio_.captions })}
          aria-pressed={audio_.captions}
          title="Captions"
        >
          CC
        </button>
        <button
          data-testid="mute-toggle"
          onClick={toggleMute}
          aria-pressed={audio_.muted}
          title={audio_.muted ? "Unmute" : "Mute"}
        >
          {audio_.muted ? "🔇" : "🔊"}
        </button>
        <button
          data-testid="settings-button"
          onClick={() => setSettingsOpen((v) => !v)}
          aria-expanded={settingsOpen}
          title="Sound settings"
        >
          ⚙
        </button>
        <button data-testid="bar-atlas-button" onClick={() => openPanel("atlas")}>
          Atlas <kbd>M</kbd>
        </button>
        <button data-testid="bar-open-door-button" onClick={() => useStore.getState().set({ phase: "opendoor", panel: null })}>
          The Open Door
        </button>
      </div>

      {settingsOpen && (
        <div className="sound-settings" role="dialog" aria-label="Sound settings" data-testid="sound-settings">
          <button onClick={() => setSettingsOpen(false)} aria-label="Close sound settings">Close ×</button>
          {(
            [
              ["master", "Master volume"],
              ["music", "Music volume"],
              ["sfx", "Environmental sound effects"],
              ["voice", "Narration volume"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                data-testid={`volume-${key}`}
                value={audio_[key]}
                onChange={(e) => setAudio({ [key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <label className="check">
            <input
              type="checkbox"
              data-testid="captions-checkbox"
              checked={audio_.captions}
              onChange={(e) => setAudio({ captions: e.target.checked })}
            />
            <span>Show captions</span>
          </label>
          <p className="settings-note">
            Narration uses the configured AI voice, or your device’s English voice when unavailable. Music &amp; ambience are original
            synthesized themes; the personal soundtrack uses the official player.
          </p>
        </div>
      )}
    </footer>
  );
}
