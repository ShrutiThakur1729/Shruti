import { useStore } from "../state/store";
import { identity, introduction } from "../data/content";

export default function MeetShruti() {
  const openPanel = useStore((s) => s.openPanel);
  return (
    <article className="panel-body meet" data-testid="meet-shruti-panel">
      <span className="chapter-mark">01 / THE FIRST HELLO</span>
      <h2>
        Hello, I'm <em>Shruti.</em>
      </h2>
      <p className="lead">{introduction}</p>
      <div className="focus">
        {[
          "AI-powered applications",
          "Full-stack development",
          "Accessible software",
        ].map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      <dl className="profile-grid">
        <div>
          <dt>Name</dt>
          <dd>{identity.name}</dd>
        </div>
        <div>
          <dt>Home</dt>
          <dd>{identity.location}</dd>
        </div>
        <div>
          <dt>Degree</dt>
          <dd>B.E. Information Technology</dd>
        </div>
        <div>
          <dt>Honors</dt>
          <dd>Artificial Intelligence &amp; Machine Learning</dd>
        </div>
      </dl>
      <div className="panel-actions">
        <button className="btn-primary" data-testid="meet-open-atlas" onClick={() => openPanel("atlas")}>
          Explore the journey <span aria-hidden>↗</span>
        </button>
        <button className="btn-secondary" data-testid="meet-continue" onClick={() => useStore.getState().closePanel()}>
          Keep wandering →
        </button>
      </div>
    </article>
  );
}
