import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import { bookBus } from "../scenes/CastleWings";

export default function OpenDoor() {
  const set = useStore((s) => s.set);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", company: "" });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Escape") set({ phase: "world" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [set]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useStore.getState();
      if (st.panel !== "book") return;
      if (e.key === "ArrowRight") bookBus.next();
      if (e.key === "ArrowLeft") bookBus.prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.company) return; // honeypot
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setState("error");
      setError("Please fill in every field — Shruti reads each message herself.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setState("error");
      setError("That email address looks incomplete.");
      return;
    }
    setState("sending");
    setError("");
    const payload = {
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    };
    try {
      const backend = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
      const res = await fetch(`${backend}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("ok");
    } catch {
      // Netlify Forms fallback (works when deployed on Netlify)
      try {
        const body = new URLSearchParams({ "form-name": "open-door-contact", ...payload });
        const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
        if (!res.ok) throw new Error();
        setState("ok");
      } catch {
        setState("error");
        setError("The door didn't quite reach — please try again, or email her directly.");
      }
    }
  };

  const field = (key: keyof typeof form) => form[key];
  const setField = (key: keyof typeof form, value: string) =>
    setForm({ ...form, [key]: value });

  return (
    <section className="open-door" data-testid="open-door">
      <div className="od-frame" aria-hidden />
      <div className="od-inner">
        <span className="eyebrow">THE JOURNEY ENDS WHERE IT BEGAN</span>
        <h1>
          The Open <em>Door</em>
        </h1>
        <p className="od-lede">
          Every little universe has a door that leads back to the real world.
          This one is open — the person who built all of this is on the other
          side.
        </p>

        <div className="od-links">
          <a href="https://www.linkedin.com/in/shruti-t-694467279/" target="_blank" rel="noreferrer" data-testid="od-linkedin">
            LinkedIn <span aria-hidden>↗</span>
          </a>
          <a href="https://github.com/ShrutiThakur1729" target="_blank" rel="noreferrer" data-testid="od-github">
            GitHub <span aria-hidden>↗</span>
          </a>
          <a href="https://jlstech.io/home" target="_blank" rel="noreferrer" data-testid="od-jls">
            JLS Technologies <span aria-hidden>↗</span>
          </a>
          <a href="/assets/resume.pdf" download data-testid="od-resume">
            Download Resume <span aria-hidden>↓</span>
          </a>
        </div>

        {state === "ok" ? (
          <div className="od-success" data-testid="contact-success" role="status">
            <h2>Delivered.</h2>
            <p>
              Your message has passed through the door. Shruti reads every one —
              thank you for wandering all the way here.
            </p>
            <button className="btn-secondary" onClick={() => setState("idle")}>
              Send another
            </button>
          </div>
        ) : (
          <form
            className="od-form"
            name="open-door-contact"
            method="POST"
            data-netlify="true"
            netlify-honeypot="company"
            onSubmit={submit}
            data-testid="contact-form"
          >
            <p className="hidden-field">
              <label>
                Don't fill this out:{" "}
                <input
                  name="company"
                  value={field("company")}
                  onChange={(e) => setField("company", e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </p>
            <div className="od-grid">
              <label>
                <span>Name</span>
                <input
                  name="name"
                  required
                  data-testid="contact-name"
                  value={field("name")}
                  onChange={(e) => setField("name", e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  data-testid="contact-email"
                  value={field("email")}
                  onChange={(e) => setField("email", e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="full">
                <span>Subject / Reason</span>
                <input
                  name="subject"
                  required
                  data-testid="contact-subject"
                  value={field("subject")}
                  onChange={(e) => setField("subject", e.target.value)}
                />
              </label>
              <label className="full">
                <span>Message</span>
                <textarea
                  name="message"
                  required
                  rows={5}
                  data-testid="contact-message"
                  value={field("message")}
                  onChange={(e) => setField("message", e.target.value)}
                />
              </label>
            </div>
            {state === "error" && (
              <p className="od-error" role="alert" data-testid="contact-error">
                {error}
              </p>
            )}
            <button className="btn-primary" type="submit" disabled={state === "sending"} data-testid="contact-submit">
              {state === "sending" ? "Opening the door…" : "Send through the door"} <span aria-hidden>↗</span>
            </button>
            <p className="privacy-note">
              Your message goes only to Shruti's inbox ({""}
              <span aria-label="email">1729.shruti@gmail.com</span>) — never to
              anywhere else, and never shown publicly.
            </p>
          </form>
        )}

        <button className="btn-secondary od-return" data-testid="od-return" onClick={() => set({ phase: "world" })}>
          ← Return to the universe
        </button>
      </div>
    </section>
  );
}
