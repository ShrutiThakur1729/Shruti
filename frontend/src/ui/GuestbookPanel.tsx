import { useState } from "react";
import { useStore } from "../state/store";

const backend = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

export default function GuestbookPanel() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch(`${backend}/api/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong.");
      setState("ok");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (state === "ok")
    return (
      <article className="panel-body guestbook" data-testid="guestbook-panel">
        <span className="chapter-mark">THE GUESTBOOK WALL</span>
        <h2>Your note is in the post.</h2>
        <p data-testid="guestbook-success">
          Shruti reads every note. Once she approves yours, it will float among the lanterns of the garden.
        </p>
        <div className="panel-actions">
          <button className="btn-primary" data-testid="guestbook-done" onClick={() => useStore.getState().closePanel()}>
            Back to the garden
          </button>
        </div>
      </article>
    );

  return (
    <article className="panel-body guestbook" data-testid="guestbook-panel">
      <span className="chapter-mark">THE GUESTBOOK WALL</span>
      <h2>Leave a little light behind.</h2>
      <p>Write a short note. After Shruti approves it, it will glow above the garden for every visitor.</p>
      <form className="gb-form" onSubmit={submit}>
        <label>
          Your name
          <input
            data-testid="guestbook-name"
            value={name}
            maxLength={40}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Your note
          <textarea
            data-testid="guestbook-message"
            value={message}
            maxLength={140}
            minLength={3}
            rows={3}
            required
            onChange={(e) => setMessage(e.target.value)}
          />
          <small className="gb-count" data-testid="guestbook-count">{message.length}/140</small>
        </label>
        {state === "error" && (
          <p className="od-error" role="alert" data-testid="guestbook-error">{error}</p>
        )}
        <div className="panel-actions">
          <button className="btn-primary" type="submit" disabled={state === "sending"} data-testid="guestbook-submit">
            {state === "sending" ? "Sending…" : "Send my note"}
          </button>
        </div>
      </form>
    </article>
  );
}
