import { useState } from "react";
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
  const current = getWorld(world);
  const themeOn = audio.themeAvailable && audio.themePlaying;

  const toggleMute = () => setAudio({ muted: !audio_.muted });

  return (
    <footer className="narration-bar" data-testid="narration-bar">
      <div className="nb-narrator">
        {guided ? (
          <>
            <span className="nb-voice" aria-hidden>
              <i />
            </span>
            <div className="nb-caption-wrap">
              <span className="nb-label">
                NARRATOR {narrating ? "· SPEAKING" : audio.themePlaying ? "" : ""}
              </span>
              <p className="nb-caption" data-testid="narration-caption" aria-live="polite" hidden={!audio_.captions}>
                {caption || "The narrator waits — press play to begin the guided journey."}
              </p>
            </div>
            <div className="nb-narr-controls">
              <button
                data-testid="narration-toggle"
                onClick={() => (narrating ? narrator.pause() : narrator.resume())}
                aria-label={narrating ? "Pause narration" : "Play narration"}
              >
                {narrating ? "❚❚" : "▶"}
              </button>
              <button data-testid="narration-skip" onClick={() => narrator.skip()} aria-label="Skip narration line">
                ▶▶
              </button>
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
        <span>{themeOn ? "Website theme" : current.music}</span>
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
            The narrator voice is AI-generated. Music &amp; ambience are original
            synthesized themes; the personal soundtrack uses the official player.
          </p>
        </div>
      )}
    </footer>
  );
}
