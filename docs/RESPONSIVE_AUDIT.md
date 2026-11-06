# Responsive release — 2026-11-06

Phase 1 was pushed to production main (1b1e22d) and Netlify published it before this separate audit began.

## Open Door

The supplied landscape is live. Browser measurements passed without horizontal overflow at 320x740, 390x844, 768x1024, 1024x768, 1366x768, 1518x853, 1672x941 and 1708x960. Desktop fits the viewport; tablet and phone use normal vertical scrolling. The last two logical desktop sizes include 90%/80% equivalents of 1366x768, not native browser zoom tests. Form constraints, pending state and failure/data retention were exercised. Production returned the explicit missing-email-configuration error; no delivery is claimed. Required Netlify Functions variables: RESEND_API_KEY and CONTACT_FROM_EMAIL (verified Resend sender), then redeploy and test acceptance/delivery.

## Phase 2 audit and changes

Inspected First Hello, Castle, Memory Garden, Atlas, entry screen, shared HUD, narration/captions, sound settings, help, profile, book controls and dialog/reader layouts. Changes retain the worlds and existing features:

- Reserve space above the Netlify badge for shared navigation; wrap controls at tablet widths.
- Read actual narration-bar height so joystick, interactions, book controls and Garden guide stay above it.
- Use readable wrapped captions and bounded, scrollable sound settings with an explicit close button.
- Give navigation, modal and Atlas controls at least 44px tap height; put map zoom/reset controls in normal layout.
- Keep small-screen dialogs within the viewport with an accessible sticky close button; wrap actions and help content.
- Adapt portrait camera FOV from 55 to 75 degrees. Existing arrivals and movement speeds remain unchanged.
- Start touch looking only on the world canvas, never on UI controls. Cancel on pointer cancellation/blur and reset joystick input on unmount.
- Make the Garden guide collapsible to leave room for exploration, retaining all destinations and bearing/distance information.
- Let compact entry screens scroll, keep entry button tappable, and reserve hosting-badge space in Open Door footer.

## Verification boundaries

TypeScript and all 11 existing audio, castle, contact and gesture regression tests pass. Local production bundle passes. Browser checks include entry, First Hello, Castle exterior, Garden, Atlas destination selection/travel and zoom/reset, help, profile and sound settings at phone/tablet/desktop dimensions. These verify rendered layouts and navigation; viewport resizing does not emulate a physical touchscreen. Camera/joystick input changes were code-reviewed; real multi-touch, mobile keyboard, camera gestures, every Castle interior book/reader and every Garden discovery still need device checks. Actual native desktop zoom at 80% and 90% remains unverified. This report does not certify the entire portfolio as fully mobile-responsive.
