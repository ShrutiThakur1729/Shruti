import { useCallback, useEffect, useState } from "react";

type Note = { id: string; name: string; message: string; status: string; created_at: string };
const backend = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const KEY = "twi-mod-key";

export default function Moderation() {
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY) || "");
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");

  const call = useCallback(
    (path: string, method = "GET") =>
      fetch(`${backend}/api/guestbook${path}`, { method, headers: { "X-Admin-Key": key } }).then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || "Request failed");
        return d;
      }),
    [key]
  );

  const load = useCallback(() => {
    if (!key) return;
    call("/moderation")
      .then((d) => {
        setNotes(d);
        setError("");
        sessionStorage.setItem(KEY, key);
      })
      .catch((e) => {
        setError(e.message);
        setKey("");
        sessionStorage.removeItem(KEY);
      });
  }, [call, key]);

  useEffect(load, [load]);

  const act = (id: string, path: string, method: string) => call(path, method).then(load).catch((e) => setError(e.message));

  return (
    <section className="moderation" data-testid="moderation-page">
      <span className="eyebrow">THE WORLD INSIDE · GUESTBOOK</span>
      <h1>Notes waiting in the garden</h1>
      {!key ? (
        <form className="mod-login" onSubmit={(e) => { e.preventDefault(); setKey(draft.trim()); }}>
          <input
            type="password"
            placeholder="Moderation key"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            data-testid="moderation-key-input"
          />
          <button className="btn-primary" type="submit" data-testid="moderation-key-submit">Open</button>
        </form>
      ) : (
        <button className="btn-secondary" data-testid="moderation-lock" onClick={() => { sessionStorage.removeItem(KEY); setKey(""); setNotes([]); }}>
          Lock
        </button>
      )}
      {error && <p className="od-error" role="alert" data-testid="moderation-error">{error}</p>}
      {key && notes.length === 0 && !error && <p data-testid="moderation-empty">No notes yet.</p>}
      <ul className="mod-list">
        {notes.map((n) => (
          <li key={n.id} className={n.status} data-testid={`mod-note-${n.id}`}>
            <p>“{n.message}”</p>
            <small>— {n.name} · {new Date(n.created_at).toLocaleString()} · <b>{n.status}</b></small>
            <div>
              {n.status !== "approved" && (
                <button className="btn-primary" data-testid={`mod-approve-${n.id}`} onClick={() => act(n.id, `/${n.id}/approve`, "POST")}>
                  Approve
                </button>
              )}
              <button className="btn-secondary" data-testid={`mod-delete-${n.id}`} onClick={() => act(n.id, `/${n.id}`, "DELETE")}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <a href="/" className="mod-back" data-testid="moderation-back">← Back to the worlds</a>
    </section>
  );
}
