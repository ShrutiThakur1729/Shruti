import { useState, useEffect } from "react";
import type { GestureAction } from '../systems/gestureRecognizer';
import { projects, books, poems, poetryCredit, reading, soundtrack, gardenNotes } from "../data/content";
import { audio } from "../audio/AudioEngine";
import { bookBus } from "../scenes/CastleWings";
import { useStore, isTouch } from "../state/store";

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

/* ————— 2D book reader (mobile + accessible fallback) ————— */
export function BookPanel({ id }: { id: string }) {
  const book = books.find((b) => b.id === id);
  const [page, setPage] = useState(0);
  useEffect(()=>{
    const turn=(dir:number)=>{setPage(p=>Math.max(0,Math.min((book?.pages.length??1)-1,p+dir)));audio.playSfx('page');};
    const key=(e:KeyboardEvent)=>{if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowLeft')turn(-1);};
    const gesture=(e:Event)=>{const a=(e as CustomEvent<GestureAction>).detail;if(a.type==='swipe'&&a.dx)turn(a.dx<0?1:-1);};
    window.addEventListener('keydown',key);window.addEventListener('twi-gesture',gesture);
    return()=>{window.removeEventListener('keydown',key);window.removeEventListener('twi-gesture',gesture);};
  },[book]);
  if (!book) return null;
  const pages = book.pages;
  return (
    <article className="panel-body book-panel" data-testid="book-panel">
      <span className="chapter-mark">{book.author}</span>
      <h2>{book.title}</h2>
      <div className="book-page" data-testid="book-page">
        <h3>{pages[page].heading}</h3>
        {pages[page].body.map((para, i) =>
          Array.isArray(para) ? (
            <ul key={i}>
              {para.map((li, j) => (
                <li key={j}>{li}</li>
              ))}
            </ul>
          ) : (
            <p key={i}>{para}</p>
          )
        )}
      </div>
      <div className="book-nav">
        <button
          data-testid="book-prev"
          disabled={page === 0}
          onClick={() => {
            audio.playSfx("page");
            setPage((v) => v - 1);
          }}
        >
          ← Previous
        </button>
        <span className="page-count">
          Page {page + 1} of {pages.length}
        </span>
        <button
          data-testid="book-next"
          disabled={page === pages.length - 1}
          onClick={() => {
            audio.playSfx("page");
            setPage((v) => v + 1);
          }}
        >
          Next →
        </button>
      </div>
      {!isTouch && (
        <p className="small-copy">
          This is the accessible reader. Close to return to the shelf.
        </p>
      )}
      <div className="panel-actions">
        <button className="btn-secondary" data-testid="book-close" onClick={() => useStore.getState().closePanel()}>
          Close Book
        </button>
      </div>
    </article>
  );
}

/* ————— Poetry nook ————— */
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
  const enter = useStore((s) => s.enter);
  const closePanel = useStore((s) => s.closePanel);
  const set = useStore((s) => s.set);
  return (
    <article className="panel-body welcome-panel" data-testid="welcome-panel">
      <span className="chapter-mark">WELCOME, TRAVELLER!</span>
      <h2>
        Hello World.<br/><em>Welcome, Traveller!</em>
      </h2>
      <p className="lead">
        This is a little universe called Shruti — a valley for a first hello, a
        castle that holds the work, and a garden for the quieter things. Every
        fact here is real.
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
          Take the Guided Journey <span aria-hidden>↗</span>
        </button>
        <button
          className="btn-secondary"
          data-testid="independent-button"
          onClick={() => {
            set({ guided: false });
            closePanel();
          }}
        >
          Explore Independently →
        </button>
      </div>
      <p className="small-copy">
        The guided journey speaks its narration aloud (an AI-generated voice)
        with synchronized captions. You can change this anytime from Help.
      </p>
    </article>
  );
}

/* keyboard page turns for the book panel */
export function useBookKeys(open: boolean, onKey: (dir: number) => void) {
  useState(() => {
    /* placeholder to keep hooks tidy */
  });
  void open;
  void onKey;
}

export { bookBus };
