import { useState } from "react";
import { projects, poems, poetryCredit, reading, soundtrack, gardenNotes } from "../data/content";
import { useStore } from "../state/store";

/* ————— Exhibit detail ————— */
export function ExhibitPanel({ id }: { id: string }) {
  const p = projects.find((x) => x.id === id);
  if (!p) return null;
  return (
    <article className="panel-body exhibit" data-testid="exhibit-panel">
      <span className="chapter-mark">GALLERY OF CREATIONS</span>
      <h2>{p.name}</h2>
      <p className="italic gold">{p.subtitle}</p>
      <p className="lead">{p.description}</p>
      {p.technologies.length > 0 && (
        <>
          <h3>Technologies</h3>
          <div className="focus">
            {p.technologies.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </>
      )}
      {(p.event || p.result) && (
        <>
          <h3>Where it stood</h3>
          <p>
            {p.event}
            {p.result ? ` — ${p.result}` : ""}
          </p>
        </>
      )}
      <div className="panel-actions">
        <a className="btn-primary" data-testid="view-project-link" href={p.url} target="_blank" rel="noreferrer">
          View Project <span aria-hidden>↗</span>
        </a>
        <button className="btn-secondary" data-testid="exhibit-close" onClick={() => useStore.getState().closePanel()}>
          Back to the gallery
        </button>
      </div>
    </article>
  );
}

export function PoemsPanel() {
  const [idx, setIdx] = useState(0);
  return (
    <article className="panel-body poems" data-testid="poems-panel">
      <span className="chapter-mark">THE POETRY NOOK</span>
      <h2>{poems[idx].title}</h2>
      <p className="poem-text" data-testid="poem-text">
        {poems[idx].text}
      </p>
      <p className="small-copy">{poetryCredit}</p>
      <div className="book-nav">
        <button data-testid="poems-prev" disabled={idx === 0} onClick={() => setIdx(0)}>
          ← Glittering Desire
        </button>
        <button data-testid="poems-next" disabled={idx === 1} onClick={() => setIdx(1)}>
          The Last Day on Planet Earth →
        </button>
      </div>
      <div className="panel-actions">
        <button className="btn-secondary" data-testid="poems-close" onClick={() => useStore.getState().closePanel()}>
          Close the nook
        </button>
      </div>
    </article>
  );
}

/* ————— Reading nook ————— */
export function ReadingPanel() {
  return (
    <article className="panel-body reading" data-testid="reading-panel">
      <span className="chapter-mark">THE READING NOOK</span>
      <div className="reading-layout">
        <img src={reading.cover} alt={`Cover of ${reading.title} by ${reading.author}`} data-testid="alchemist-cover" />
        <div>
          <h2>{reading.title}</h2>
          <p className="italic gold">{reading.author}</p>
          <p>{reading.note}</p>
          <p className="small-copy">
            No passages are reproduced here — just the marker of a book she
            keeps close. Find your own copy to read along.
          </p>
        </div>
      </div>
      <div className="panel-actions">
        <button className="btn-secondary" data-testid="reading-close" onClick={() => useStore.getState().closePanel()}>
          Back to the garden
        </button>
      </div>
    </article>
  );
}

/* ————— Personal soundtrack ————— */
/* ————— Garden notes / fountain ————— */
export function NotePanel({ id }: { id: string }) {
  let title = "";
  let body: string[] = [];
  if (id === "fountain") {
    title = "The Courtyard Fountain";
    body = [
      "The heart of the castle grounds. Beyond it stand the keep and its two wings: the Gallery of Creations and the Living Archives.",
    ];
  } else {
    const note = gardenNotes[id];
    if (!note) return null;
    title = note.title;
    body = note.body;
  }
  return (
    <article className="panel-body note" data-testid="note-panel">
      <span className="chapter-mark">A SMALL DISCOVERY</span>
      <h2>{title}</h2>
      {body.map((b, i) => (
        <p key={i}>{b}</p>
      ))}
      <div className="panel-actions">
        <button className="btn-secondary" data-testid="note-close" onClick={() => useStore.getState().closePanel()}>
          Close
        </button>
      </div>
    </article>
  );
}

/* ————— Welcome / onboarding ————— */
export function WelcomePanel() {
  const closePanel = useStore((s) => s.closePanel);
  const set = useStore((s) => s.set);
  return (
    <article className="panel-body welcome-panel" data-testid="welcome-panel">
      <span className="chapter-mark">THE FIRST HELLO</span>
      <h2>
        Welcome to my portfolio.
      </h2>
      <p className="lead">
        Start with <strong>Meet Shruti</strong> for my introduction. Open the <strong>World Atlas</strong> whenever
        you want to visit my projects in the Castle or my creative work in the Memory Garden.
      </p>
      <div className="panel-actions welcome-choices">
        <button
          className="btn-primary"
          data-testid="guided-journey-button"
          onClick={() => {
            set({ guided: true });
            closePanel();
          }}
        >
          Explore with narration <span aria-hidden>↗</span>
        </button>
        <button
          className="btn-secondary"
          data-testid="independent-button"
          onClick={() => {
            set({ guided: false });
            closePanel();
          }}
        >
          Explore on my own →
        </button>
      </div>
      <p className="small-copy">
        Both options include on-screen directions. You can change narration from Help.
      </p>
    </article>
  );
}
