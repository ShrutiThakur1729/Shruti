import { audio } from "../audio/AudioEngine";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import { identity } from "../data/content";
import "./OpenDoor.css";

export default function OpenDoor() {
  const set = useStore((s) => s.set);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", company: "" });
  const [themePlaying,setThemePlaying]=useState(audio.themePlaying);
  useEffect(()=>{const update=()=>setThemePlaying(audio.themePlaying);window.addEventListener("twi-audio",update);return()=>window.removeEventListener("twi-audio",update);},[]);
  const pending = useRef(false);
  const submissionId = useRef(crypto.randomUUID());
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.code === "Escape") set({ phase: "world", panel: null }); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [set]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    if (form.company || Object.entries(form).some(([k,v]) => k !== "company" && !v.trim()) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Please complete every field and check your email address."); setState("error"); return;
    }
    pending.current = true; setState("sending"); setError("");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, submissionId: submissionId.current }), signal: AbortSignal.timeout(20000) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status !== "accepted") throw new Error(data.error || "The message could not be sent. Please retry or email Shruti directly.");
      setState("ok");
    } catch (err) {
      setState("error"); setError(err instanceof Error && err.name !== "TimeoutError" ? err.message : "The request timed out. You can retry safely or email Shruti directly.");
    } finally { pending.current = false; }
  };
  return (
    <section className="open-door od-immersive" data-testid="open-door">
      <header className="od-header"><span className="od-brand">✧ <span>THE WORLD INSIDE<em>A little universe called Shruti</em></span></span><button onClick={() => set({ phase: "world", panel: null })}>Return to the universe ←</button></header>
      <div className="od-backdrop" aria-hidden="true"/><div className="od-composition">

        <article className="od-contact-panel">
          <span className="chapter-mark">THE CLOSING CHAPTER</span>
          <h1>The Open Door</h1><div className="od-ornament" aria-hidden>──── ✧ ────</div>
          <h2>Let’s Connect</h2><p>Have a question, an idea, a collaboration in mind,<br className="desktop-break"/> or just want to say hello? I’d love to hear from you.</p>
          {state === "ok" ? <div role="status" className="od-success" data-testid="contact-success"><h2>Thank you.</h2><p>Your message has found its way to me. Thank you for reaching out!</p><small>Accepted by the email service for sending. Inbox delivery is not yet confirmed.</small><button className="btn-primary" onClick={() => { setForm({ name: "", email: "", subject: "", message: "", company: "" }); submissionId.current = crypto.randomUUID(); setState("idle"); }}>Write another message</button></div> :
          <form className="od-form" onSubmit={submit} data-testid="contact-form" aria-busy={state === "sending"}>
            <label className="hidden-field" aria-hidden>Leave this empty<input name="company" tabIndex={-1} autoComplete="off" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}/></label>
            <div className="od-name-email">
              <label><span>Your Name</span><i aria-hidden="true">♙</i><input name="name" required maxLength={100} autoComplete="name" placeholder="Your Name" data-testid="contact-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
              <label><span>Your Email</span><i aria-hidden="true">✉</i><input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="Your Email" data-testid="contact-email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
            </div>
            <label className="od-subject"><span>Subject / Reason</span><i aria-hidden="true">☷</i><select name="subject" required data-testid="contact-subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}><option value="" disabled>Subject / Reason</option><option>Collaboration</option><option>Career opportunity</option><option>Project enquiry</option><option>Just saying hello</option><option>Other</option></select><b aria-hidden="true">⌄</b></label>
            <label><span>Your Message</span><i aria-hidden="true">✎</i><textarea name="message" required maxLength={6000} rows={4} placeholder="Your Message…" data-testid="contact-message" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></label>
            {state === "error" && <p role="alert" className="od-error" data-testid="contact-error">{error}</p>}
            <button className="btn-primary" type="submit" disabled={state === "sending"} data-testid="contact-submit">{state === "sending" ? "Sending your message…" : "➤  Send Message"}</button>

          </form>}
<div className="od-link-divider" aria-hidden="true">✧</div>        <aside className="od-links" aria-label="Connect with Shruti"><a href={identity.linkedin} target="_blank" rel="noopener noreferrer" data-testid="od-linkedin">in <span>LinkedIn Profile ↗</span></a><a href={identity.github} target="_blank" rel="noopener noreferrer" data-testid="od-github">⌘ <span>GitHub Profile ↗</span></a><a href={identity.resume} download="Shruti_Thakur_Resume.pdf" data-testid="od-resume">↓ <span>Download Resume</span></a><a href={identity.jls} target="_blank" rel="noopener noreferrer" data-testid="od-jls" className="od-jls">JLS Technologies ↗</a></aside>
        </article>

      </div>
      <footer className="od-footer"><span>✧ THE WORLD INSIDE</span>      <div className="od-theme"><span>♪ Theme Song</span><button onClick={()=>{audio.init();if(audio.themePlaying)audio.pauseTheme();else audio.startTheme();setThemePlaying(audio.themePlaying);}}>{themePlaying?"Pause Theme Song":"Play Theme Song"}</button><label>Volume <input aria-label="Theme Song volume" type="range" min="0" max="1" step=".05" defaultValue={audio.settings.music} onChange={e=>useStore.getState().setAudio({music:Number(e.target.value)})}/></label></div><i>Thank you for visiting ♡</i></footer>
    </section>
  );
}
