# Open Door Phase 1 — 2026-11-06

Scope: OpenDoor.tsx, its new scoped stylesheet, and the owner-supplied landscape background. Existing audio engine, worlds, navigation, gestures and server email handler are unchanged.

The new page uses a landscape backdrop, translucent emerald panel, gold borders, paired desktop name/email fields, subject selector, integrated equal-size professional links, and a single responsive footer with the existing Theme Song controls. Phones stack fields and narrow-screen professional links. Tablet layouts move the panel below a clear artwork area. No nested panel scrolling is used.

Checks: TypeScript, contact-handler tests (validation, failure, fixed recipient, provider acceptance and idempotent retries), local production bundle and browser layout checks at 320/390/768/1024/1366/1672 widths. Form empty/invalid constraints and data retention after a failed local submission were observed. 1518x853 and 1708x960 logical viewport sizes represent 90% and 80% equivalents of a 1366x768 desktop. Actual browser zoom controls were unavailable in the preview engine, so these are not claimed as native browser zoom tests. Touchscreen hardware and virtual keyboard checks remain unverified.

The contact function already targets only 1729.shruti@gmail.com with sender reply-to and server-side validation, rate limiting, honeypot and provider idempotency. It returns success only on Resend acceptance. The required success copy is shown only after that response; the UI distinguishes provider acceptance from inbox delivery.

Production email needs Netlify Functions environment variables RESEND_API_KEY and CONTACT_FROM_EMAIL. CONTACT_FROM_EMAIL must be a verified Resend sender; its domain DNS must be verified in Resend. Redeploy after adding variables. A real provider acceptance/inbox delivery test cannot be claimed without that setup. No API key belongs in frontend code or Git.

Phase 2 responsive audit of other portfolio areas is separate and starts only after this page is published. No claim of complete portfolio mobile readiness is made here.
