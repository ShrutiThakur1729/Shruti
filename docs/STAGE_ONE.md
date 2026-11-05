# Stage one audio and responsive fixes — 2026-11-06

Based on deployed main 2e0cebc. Theme Song uses the supplied recording Website theme.m4a, shipped as public/audio/theme-song.m4a; owner explicitly confirmed permission to host it publicly in this chat on 2026-11-06. Existing commercial soundtrack restrictions still apply to other recordings.

Theme is preloaded once and starts directly from the Open Door click, with a visible retry/play/pause control and independent music volume. Procedural world music is stopped while it plays. Castle crackling layer is disabled; Stones & Candlelight music remains.

The original Emergent narrator depended on EMERGENT_LLM_KEY and the hosted FastAPI service. Neither a public backend URL nor decryptable credentials are present. The owner confirmed no OpenAI key is available. Narration now falls back to browser speech synthesis, preferring an installed female English voice. This is a device voice, not the unavailable Emergent voice. Pause/resume/restart/skip and cancellation are retained; captions advance with speech completion. Voice availability and timbre depend on the visitor's device. No API key is bundled or required for this fallback.

Atlas approaches are restored in a separate column. Desktop map preserves its complete aspect ratio; smaller screens scroll naturally. Open Door buttons use consistent sizing, imagery uses contain on desktop, and audio has a separate control row. Garden guide is positioned above the bottom bar.

First Hello uses shared low-detail model assets, preloads essential models/textures on landing, and no longer downloads full-detail models merely to share materials. Castle and Garden scene modules load lazily. A loading notice replaces blank asset waits. These reduce initialization work; no numerical FPS improvement is claimed without a controlled measurement.

Gesture calibration survives panel changes and temporary tracking loss, while input state still resets to prevent stuck holds. The model remains mounted for the enabled session. Inference still runs on the main thread; real-camera responsiveness requires human validation. Do not report all gestures as tested from simulated landmark tests alone.

Reference recording: inspected frames at 5, 35 and 80 seconds from see this 2.mp4. The original text sequence and guided journey structure are retained. Exact voice recovery is blocked by the absent Emergent credentials/backend.

Validation: 11 automated tests (including theme instance reuse and keyless narration cancellation), TypeScript, portable production build. Local browser: guided caption advancement, pause/resume, atlas approaches, Open Door starts theme playback and exposes Pause Theme Song. Full camera gesture and physical mobile-device checks remain pending. Do not start a new Library/Gallery rebuild before Stage one verification is complete.
