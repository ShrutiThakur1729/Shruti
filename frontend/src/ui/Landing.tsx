import { useMemo, useEffect } from "react";
import { audio } from '../audio/AudioEngine';
import { useGLTF,useTexture } from '@react-three/drei';
import { useStore } from "../state/store";
import "./Orientation.css";

export default function Landing() {
  useEffect(()=>{audio.prepareTheme();useGLTF.preload('/assets/tree-lod.glb');useGLTF.preload('/assets/rocks-lod.glb');useGLTF.preload('/assets/fern-lod.glb');for(const name of ['cobblestone_floor_08','bark_brown_02','forest_ground_04'])for(const type of ['diff','nor_gl','rough'])useTexture.preload(`/assets/${name}_${type}.jpg`);},[]);
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
        <span className="eyebrow">SHRUTI THAKUR’S PORTFOLIO</span>
        <h1 className="landing-title">
          THE WORLD INSIDE
          <em>A little universe called Shruti</em>
        </h1>
        <p className="landing-lede">
          I’m Shruti, an Information Technology student building AI applications and accessible software.
          Step into my valley to meet me, visit the Castle for my work, or find my poems in the Garden.
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
        <nav className="landing-shortcuts" aria-label="Portfolio shortcuts">
          <button onClick={() => { enter(false); useStore.getState().travelTo("castle"); }}>See my projects <span aria-hidden>↗</span></button>
          <button onClick={() => useStore.getState().set({ phase: "opendoor", panel: null })}>Contact &amp; résumé <span aria-hidden>↗</span></button>
        </nav>
      </div>
      <footer className="landing-footer">
        <span>SHRUTI THAKUR</span>
        <span>THREE WORLDS. ONE UNIVERSE.</span>
      </footer>
    </section>
  );
}
