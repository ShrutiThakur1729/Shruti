# Immersion work — 2026-11-06

Stable production checkpoint: main 481bef9. Updated owner-supplied resume is live (download SHA-256 matches the supplied file). Resend key is stored only in Netlify production secrets. The live form returned provider acceptance for the requested message to 1729.shruti@gmail.com; inbox receipt was not independently confirmed.

## Stability and gesture phase

- First Hello now renders sky, mountains and water independently of downloaded foliage/surface assets. Detailed architecture remains behind Suspense. No claim of a measured cold-load speedup across devices is made yet.
- World changes fade/stop old procedural music voices; completed audio timers and owned geometry/textures are cleaned up. Narration resumes a paused browser speech engine and bounds backend waiting to six seconds before device fallback. Castle retains music and bells without noisy wind/crackle layers.
- Gentle open-hand movement controls look; a distinct fast horizontal swipe selects adjacent worlds with a 4.5-second navigation lockout. Panel gestures remain pan/zoom/page actions. Tracking loss releases movement without forcing repeated calibration.
- Local production bundle, TypeScript and 12 regression tests pass. Local browser replay fixture exercised the real recognizer, dispatcher, store and camera travel: Hello → Castle → Garden → Castle → Hello. Gentle trace did not navigate. Browser error console was clear.
- Browser replay is simulated hand input, not a physical-camera certification. Real camera gestures, hardware audibility and mobile touch still need owner/device checks. The fixture is excluded from the normal Vite entry and uses no API credentials.

Further Castle and immersion work is staged on the isolated castle-immersion development branch. Production is kept stable while these phases are verified, avoiding intermediate Netlify production builds.
