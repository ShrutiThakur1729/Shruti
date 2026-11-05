import { useMemo } from "react";
import { useStore } from "../state/store";

export default function Landing() {
  const enter = useStore((s) => s.enter);
  const stars = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        left: `${(i * 37.7) % 100}%`,
        top: `${(i * 53.3) % 100}%`,
        delay: `${(i % 7) * 0.8}s`,
        size: i % 5 === 0 ? 3 : 2,
      })),
    []
  );
  return (
    <section className="landing" data-testid="landing">
      <div className="landing-stars" aria-hidden>
        {stars.map((s, i) => (
          <i key={i} style={{ left: s.left, top: s.top, animationDelay: s.delay, width: s.size, height: s.size }} />
        ))}
      </div>
      <div className="landing-frame" aria-hidden />
      <div className="landing-inner">
        <span className="eyebrow">AN INVITATION TO WANDER</span>
        <h1 className="landing-title">
          THE WORLD INSIDE
          <em>A little universe called Shruti</em>
        </h1>
        <p className="landing-lede">
          Beyond the familiar, a story is waiting — a valley, a castle and a
          garden built from one person's real work.
        </p>
        <button
          className="btn-primary"
          data-testid="enter-universe-button"
          onClick={() => {
            enter(false);
          }}
        >
          Enter the Universe <span aria-hidden>↗</span>
        </button>
        <small className="landing-note">
          An explorable 3D portfolio · Best with sound · Works on desktop &amp; mobile
        </small>
      </div>
      <footer className="landing-footer">
        <span>SHRUTI THAKUR</span>
        <span>THREE WORLDS. ONE UNIVERSE.</span>
      </footer>
    </section>
  );
}
