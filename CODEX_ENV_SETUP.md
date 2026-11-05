# CODEX ENVIRONMENT SETUP — The World Inside

This document is the complete configuration handoff for continuing development on
**THE WORLD INSIDE — a little universe called Shruti** after cloning
`https://github.com/ShrutiThakur1729/Shruti.git` (branch `development`).

The repository contains an **encrypted archive of the actual working `.env` files**
(`handoff/env.enc`). You do not need to guess or recreate any configuration.

---

## 1. Decrypt and load the actual environment

The archive holds the real `backend/.env` and `frontend/.env` as they were in the
working Emergent environment.

The **decryption passphrase is NOT in this repository** — it was delivered to the
owner in the Emergent handoff report (and is stored in the owner's local
`/app/memory/test_credentials.md`). Ask the owner for it, then:

```bash
# from the repository root
openssl enc -d -aes-256-cbc -pbkdf2 -in handoff/env.enc -out /tmp/env.tar.gz -pass pass:'<PASSPHRASE>'
mkdir -p backend frontend
tar xzf /tmp/env.tar.gz -C .          # restores backend/.env and frontend/.env
rm /tmp/env.tar.gz
```

Verify:

```bash
grep -c . backend/.env frontend/.env   # both files should have content
```

`.gitignore` protects all `.env` files — they will never be committed accidentally.
Do not weaken those rules.

---

## 2. Complete environment-variable inventory

### frontend/.env (Vite app — exposed to the browser bundle via `vite.config.ts`)

| Variable | Used by | Purpose | Visibility | Required |
|---|---|---|---|---|
| `REACT_APP_BACKEND_URL` | Frontend | Base URL of the FastAPI backend. Used for the contact form (`POST /api/contact`), the AI narrator (`POST /api/narrate`) and voice availability (`GET /api/voice-status`). The name is legacy (CRA convention) but is read through a Vite `define` shim — keep the name. | Public (safe for the browser bundle) | Required for voice + form; the site still runs without it (captions-only narration, form falls back to Netlify Forms) |
| `WDS_SOCKET_PORT` | (legacy, react-dev-server) | CRA hot-reload websocket port from the original template. Not used by the Vite build. | Public | Optional — can be removed |
| `ENABLE_HEALTH_CHECK` | Emergent platform | Platform health-check flag from the original template. Not used by the app code. | Public | Optional |

### backend/.env (FastAPI + MongoDB)

| Variable | Used by | Purpose | Visibility | Required |
|---|---|---|---|---|
| `MONGO_URL` | Backend | MongoDB connection string (`mongodb://localhost:27017` in the Emergent container). Stores contact-form messages (`contact_messages` collection). | Confidential | Required |
| `DB_NAME` | Backend | Database name. | Public | Required |
| `CORS_ORIGINS` | Backend | CORS allow-list (`*` in the working environment). | Public | Required |
| `GITHUB_TOKEN` | Owner/tooling only | GitHub personal access token used to push this repository. The app itself never reads it. | **Confidential** | Optional |
| `EMERGENT_LLM_KEY` | Backend (`server.py` → `emergentintegrations`) | Universal LLM key used by `POST /api/narrate` to generate the female AI narrator voice (OpenAI `tts-1`, voice `fable`, cached to `backend/narration_cache/`). If missing, `/api/voice-status` reports `{available:false}` and the frontend gracefully falls back to text-only captions. | **Confidential** | Optional (required only for spoken narration) |
| `GUESTBOOK_ADMIN_KEY` | Backend (`server.py`) | Secret key for the guestbook moderation page (`/moderate`) and the `X-Admin-Key` header on `GET /api/guestbook/moderation`, `POST /api/guestbook/{id}/approve`, `DELETE /api/guestbook/{id}`. | **Confidential** | Required for guestbook moderation |

Frontend equivalent references: `.env.example` files exist at `frontend/.env.example`
(and document all names above).

---

## 3. Netlify environment configuration

The site deploys to Netlify. `netlify.toml` at the repo root is already configured:

- **Base directory:** `frontend`
- **Build command:** `yarn build`
- **Publish directory:** `frontend/dist`
- **Redirects:** SPA fallback (`/* → /index.html`, status 200) via `netlify.toml` + `frontend/public/_redirects`

Environment variables to set in **Netlify → Site settings → Environment variables**:

| Variable | Value | Notes |
|---|---|---|
| `REACT_APP_BACKEND_URL` | Your backend URL (e.g. a Railway/Fly/Render deployment of `backend/`) | Injected at build time. If you point it at the Emergent preview backend, note preview URLs are ephemeral — deploy the backend somewhere permanent for production. |

### Contact form on Netlify (no Functions required)

The React form (`frontend/src/ui/OpenDoor.tsx`) is wired for both worlds:

1. It first POSTs JSON to `${REACT_APP_BACKEND_URL}/api/contact` (works in the
   Emergent preview; messages are stored in MongoDB).
2. If that endpoint is unreachable (the Netlify deploy has no backend), it falls
   back to a standard **Netlify Forms** submission (`POST /` urlencoded, form name
   `open-door-contact`). A hidden static form skeleton in `index.html` lets Netlify
   detect the form at deploy time.

To activate: in Netlify enable **Forms** for the site, then set
**Forms → form notifications → email notifications** to `1729.shruti@gmail.com`.
**Netlify caveat:** email notification recipients must belong to the Netlify team —
invite that Gmail as a team member (or use a Netlify-compatible webhook). Spam
protection is built in via the `company` honeypot field (`netlify-honeypot`).

No Netlify Functions are required. If you prefer server-side email instead of
Netlify Forms, add a function (e.g. Resend/SendGrid) and keep the key in Netlify
env vars — never in the browser bundle.

---

## 4. External services still required

| Service | Status | Notes |
|---|---|---|
| MongoDB | Running locally in Emergent (`mongod` via supervisor). For production use MongoDB Atlas or any hosted Mongo; set `MONGO_URL`. | Required for the contact form |
| AI narrator (TTS) | Working via the encrypted `EMERGENT_LLM_KEY` (OpenAI `tts-1`, voice `fable`). | Optional; text-only fallback is automatic. Audio is cached in `backend/narration_cache/` (gitignored). |
| Hand gestures | MediaPipe Hand Landmarker runs in the browser; wasm from cdn.jsdelivr.net, model from storage.googleapis.com. No key. | Camera turns on only after the visitor clicks “Use hand gestures”. |
| Music & ambience | Fully self-contained: original procedural WebAudio synthesis + the owner's theme file. | `frontend/public/audio/website-theme.m4a` is **copyrighted** and gitignored — drop the owner's copy in for local preview only. Public builds use the procedural themes. |
| Magic Shop (BTS) | Official Spotify embed (`open.spotify.com`), no keys needed. | Nothing to configure |

---

## 5. Run from a clean clone

```bash
# backend (Python 3.11+, FastAPI)
cd backend
pip install -r requirements.txt
# restore backend/.env (see section 1) or create from the inventory above
uvicorn server:app --host 0.0.0.0 --port 8001

# frontend (Node 20+, yarn)
cd ../frontend
yarn install
# restore frontend/.env with REACT_APP_BACKEND_URL=http://localhost:8001
yarn start          # dev server on :3000
yarn build          # production build → dist/
```

Restore `frontend/public/audio/website-theme.m4a` (owner's copy) only for local
preview; it is intentionally absent from the repository.

## 6. Credentials & secrets policy

- All `.env` files are gitignored; the encrypted copy in `handoff/env.enc` is the
  only configuration handoff.
- The decryption passphrase and any tokens live with the owner — never commit them.
- `frontend/public/assets/resume.pdf` and `alchemist.jpg` are the owner's own
  documents and are intentionally included.
