# Release 2026-11-05

Base: main and development both d526ff77934a62cc35cc2c375e1bb72d7c901db0, fetched and compared before release. Earlier First Hello prototype remains in its separate local checkout.

Build from frontend with Yarn 1.22.22 using yarn.lock. `yarn install --frozen-lockfile`, `yarn test`, `yarn typecheck`, `yarn build`. Vite emits frontend/dist. Root netlify.toml uses base frontend, publish dist, and functions netlify/functions relative to that base. Production branch: main. Netlify UI has no overriding base/build/publish values.

Changes: corrected publish path; server-side contact processing; illustrated interactive atlas and responsive Open Door; context-aware hand recognition; HTML book controls outside the Three canvas; local reader and return animation; continuous castle stair/landing/wing geometry and collision; garden discovery signs/direction guide; narration cancellation, captions visibility and soundtrack cleanup.

## Required production configuration

No environment variables were configured in Netlify at inspection. Do not paste credentials into chat or commit them.

- RESEND_API_KEY: Netlify Functions scope, production. Resend sending API key.
- CONTACT_FROM_EMAIL: Netlify Functions scope, production. A verified Resend sender, e.g. The World Inside <hello@your-verified-domain>. Do not use an unverified example address.
- REACT_APP_BACKEND_URL: Builds scope, production. HTTPS URL of the existing running FastAPI backend, if narrator and moderated guestbook are wanted. Netlify does not run backend/server.py automatically.
- That backend requires MONGO_URL, DB_NAME, CORS_ORIGINS restricted to the production domain, and EMERGENT_LLM_KEY for the existing narrator implementation. See backend/.env.example. Keep those on the backend host, not in browser variables.

The contact function is fixed to 1729.shruti@gmail.com, validates input, rejects the honeypot, applies Netlify per-IP rate limits and uses provider idempotency. It returns 202 only after a provider ID is returned. This means provider acceptance, not confirmed inbox delivery. Without the two email settings it returns a clear 503 and offers direct email. Actual delivery has not been tested without configuration.

Ambient music and environmental effects are synthesized locally. The optional website-theme.m4a is not bundled; missing audio is detected by MIME type so an SPA fallback is not mistaken for a recording. Spotify uses its official iframe API for pause/end restoration. Its network availability and actual playback need a human check. No copyrighted soundtrack is redistributed.

Recognition tests simulate horizontal/vertical swipes, jitter, pinch, hold, release, tracking loss and two-hand zoom. Real camera gestures and low-end mobile frame rate remain manual verification items. Do not describe simulated tests as camera validation.

Resume: retained existing public/assets/resume.pdf (valid PDF header, 209933 bytes); download is named Shruti_Thakur_Resume.pdf. No replacement resume was invented.

Generated artwork: built-in image generation. assets/atlas-landscape.png is an illustration layer, not interactive UI. Prompt: aged parchment fantasy landscape with snowy mountains, river, bridges, ivy arch left, Gothic castle lower center and conservatory upper right; no labels, routes, markers or controls. assets/open-door-scenery.png prompt: ornate open Gothic doorway, gold filigree doors, sunset garden path, ivy, wisteria, lantern and books; scenic left column without text or form. All labels, routes, controls, form and links are separate HTML/SVG elements.
