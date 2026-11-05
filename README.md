# THE WORLD INSIDE
### A little universe called Shruti

An explorable, cinematic 3D portfolio — three worlds you walk through instead of
pages you scroll:

1. **The First Hello** — a lantern-lit valley: stone path, ivy archway, river,
   bridge, waterfalls, village and mountains. Meet Shruti here.
2. **The Castle** — approach across a moat, through the great doors into a Gothic
   hall; the **Gallery of Creations** (five real project exhibits) and the
   **Living Archives** (six readable 3D books) open from the hall.
3. **The Memory Garden** — a walled evening garden: old tree, pond, gazebo,
   conservatory, rose arches, poetry nook, reading nook and a personal
   soundtrack.
4. **The Open Door** — a static 2D closing contact page with real links and a
   working form.

Everything in the universe is real: every project, achievement and poem comes
from the owner's verified resume and content file. Nothing is invented.

## Tech

- **Frontend:** React 19 + TypeScript + Vite, `@react-three/fiber` + `three` 0.180,
  Zustand state, hand-built procedural 3D environments (instancing, LOD, adaptive
  DPR, per-world lazy mount).
- **Backend:** FastAPI + MongoDB — contact form storage and the AI narrator
  (OpenAI TTS via `emergentintegrations`, cached).
- **Audio:** original procedural WebAudio music & ambience per world, synthesized
  sound effects, audio ducking, official Spotify embed for the personal soundtrack.
- **Deploy:** Netlify (`netlify.toml` at repo root). See `CODEX_ENV_SETUP.md` for
  environment configuration and the encrypted `.env` handoff.

## Quick start

```bash
cd frontend && yarn install && yarn start     # http://localhost:3000
cd backend && pip install -r requirements.txt && uvicorn server:app --port 8001
```

Copy `frontend/.env.example` → `frontend/.env` and point `REACT_APP_BACKEND_URL`
at your backend (full details in `CODEX_ENV_SETUP.md`).

## Controls

- **Desktop:** WASD move · mouse look (click the world) · Shift run · Space/Ctrl
  altitude during flights · E interact · M atlas · Esc release/close.
- **Mobile:** touch joystick, drag to look, ✦ interact button, 2D book reader.

## New: Guestbook & hand gestures

- **Guestbook Wall** (Memory Garden, by the gate): visitors leave a note (name ≤40, note 3–140 chars, no links, bad words filtered). Notes stay pending until approved at `/moderate` with `GUESTBOOK_ADMIN_KEY`; approved notes float as glowing text above the garden.
- **Hand gestures** (“Use hand gestures” button): move hand to look, quick pinch to select/close, hold pinch to walk, swipe left/right to switch world. Runs fully in the browser (MediaPipe).

## Structure

```
frontend/   Vite + React + R3F app (src/scenes = the three worlds)
backend/    FastAPI: /api/contact, /api/narrate, /api/voice-status, /api/health
handoff/    env.enc — encrypted actual environment files (see CODEX_ENV_SETUP.md)
content/    portfolio_content.json — verified content source
docs/       architecture notes & asset licence register
```

## Content integrity rules (for future contributors)

- Portfolio facts come from `content/portfolio_content.json` and the resume.
- Do not add certifications, fake screenshots or invented personal details.
- Poems are reproduced exactly as written, line breaks preserved.
- Copyrighted audio (`website-theme.m4a`, BTS tracks) is never committed or
  publicly hosted; the soundtrack uses the official Spotify embed.
