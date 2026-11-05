# Asset Inventory & Licence Register — THE WORLD INSIDE

| Asset | Source | Licence | Redistributed in repo? |
|---|---|---|---|
| `public/assets/tree.glb`, `tree-lod.glb`, `rocks.glb`, `rocks-lod.glb`, `fern.glb`, `fern-lod.glb` | Fetched by the original Astra build (`scripts/fetch-assets.mjs`, register in `public/assets/sources.json`) | CC0 (Poly Haven assets) | Yes |
| `public/assets/forest_ground_04_*`, `cobblestone_floor_08_*`, `bark_brown_02_*` textures | Same source register as above | CC0 | Yes |
| `public/assets/alchemist.jpg` | Owner-supplied book cover (personal reading nook display) | Copyright of the publisher — displayed under the owner's personal fair use in their own portfolio. **Not for reuse in other projects.** | Yes (flagged) |
| `public/assets/resume.pdf` | Owner's own resume | Owner's document | Yes (intentional download link) |
| `public/audio/website-theme.m4a` | Owner-supplied copyrighted recording (K-drama "Search: WWW" association) | Copyrighted — **not committed**; local preview only, gitignored | No |
| `Magic Shop-BTS.mp3` | Owner-supplied | Copyrighted — **never hosted**; official Spotify embed used instead | No |
| All music & ambience (valley / castle / garden themes, wind, stream, birds, crickets) | Original procedural WebAudio synthesis in `src/audio/AudioEngine.ts` | Original work, no third-party licence needed | Yes (source code) |
| UI sound effects (chime, page turn, book, door, footsteps, hover) | Original synthesis | Original work | Yes (source code) |
| Narration voice | OpenAI TTS via backend proxy | AI-generated (disclosed in-app) | n/a (generated at runtime, cached locally) |
| Poems ("Glittering Desire", "The Last Day on Planet Earth") | Shruti Thakur, published in a Notion Press publication | Owner's own work | Yes |
| Exhibit cover artwork | Original stylized 3D artefacts built in code (no fake screenshots) | Original work | Yes |
| Fonts: Cinzel, Cormorant Garamond | Google Fonts | SIL Open Font License | Yes (via Google Fonts CDN) |

## Licence rules carried from the master kit

- Never bundle copyrighted recordings into the public build.
- Never present generated artwork as real app screenshots.
- The `sources.json` register next to the GLB assets records each 3D asset's origin.
