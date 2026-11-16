# AETHER execution plan

Read DOC 00–07 in full before implementation.

## Direction

Luxury editorial astronomy: warm starlight, cool atmosphere, generous darkness.
Purpose: explore a continuous six-movement journey, ending in an interactive glass heart.
Anchor: a living blue-limbed planet under widely tracked typography, resolving into liquid glass.
DFII: impact 5 + fit 5 + feasibility 4 + performance 3 − consistency risk 3 = 14.
Space Grotesk display, Instrument Serif italic, JetBrains Mono telemetry; 8px rhythm.
Motion is slow, damped, reversible; reduced motion retains visual detail.
Pipeline: linear scene → half-float composer → bloom/chromatic/vignette/noise → ACES → SMAA when needed.

## Milestones

M1 Shell, DOM, fonts, loader, scroll, QA API.
M2 Renderer, composer, camera, tiering, resize.
M3 Stars, Milky Way, procedural environment.
M4 Planet, cloud layer, atmosphere.
M5 Orbital ring particles and rocks.
M6 Cratered asteroid gates and dust.
M7 Raymarched nebula.
M8 Transmissive Core and interaction.
M9 Accessibility, motion/audio polish and validation.
Capture and inspect each milestone; commit locally after each milestone.
Run install, typecheck, lint, build, geometry checks, two QA iterations, screenshots and review.
Keep honest limitations and unmet requirements in DEVIATIONS.md.

## Acceptance mapping

| ID     | Responsible files / verification                      |
| ------ | ----------------------------------------------------- |
| AC-001 | package.json, package-lock.json, qa/dependencies.json |
| AC-002 | package.json overrides; npm ls three                  |
| AC-003 | tsconfig.json; src/**/*.ts                            |
| AC-004 | eslint.config.js; src/**/*.ts                         |
| AC-005 | vite.config.ts; qa/bundle-check.mjs                   |
| AC-006 | qa/qa.mjs; src/app/App.ts                             |
| AC-007 | qa/qa.mjs request listener                            |
| AC-010 | index.html; src/ui/Loader.ts                          |
| AC-011 | src/chapters/Planet.ts; shaders/planet.*              |
| AC-012 | src/chapters/Planet.ts; shaders/atmosphere.frag       |
| AC-013 | src/chapters/Rings.ts                                 |
| AC-014 | src/chapters/Asteroids.ts; core/RockGeometry.ts       |
| AC-015 | src/chapters/Nebula.ts; core/Noise3D.ts               |
| AC-016 | src/chapters/Core.ts                                  |
| AC-017 | src/core/CameraRig.ts; src/app/App.ts                 |
| AC-020 | qa/geometry-check.mjs; core/geometry.ts               |
| AC-021 | core/RockGeometry.ts; qa/screenshots                  |
| AC-030 | src/core/ScrollDirector.ts                            |
| AC-031 | src/core/CameraRig.ts                                 |
| AC-032 | src/ui/Cursor.ts                                      |
| AC-033 | src/app/Events.ts; src/core/ScrollDirector.ts         |
| AC-034 | src/ui/AudioEngine.ts                                 |
| AC-035 | src/ui/Hud.ts; core/ScrollDirector.ts                 |
| AC-040 | src/qa/debugApi.ts; qa/qa.mjs                         |
| AC-041 | src/chapters/*; src/core/CameraRig.ts                 |
| AC-042 | src/app/Quality.ts                                    |
| AC-043 | src/app/App.ts dispose; qa/qa.mjs                     |
| AC-050 | index.html; src/ui/Hud.ts; styles/*                   |
| AC-051 | styles/base.css; qa/REVIEW.md                         |
| AC-060 | src/ui/Fallback.ts                                    |
| AC-061 | src/core/Renderer.ts                                  |
| AC-062 | src/app/Events.ts                                     |
| AC-063 | styles/*; qa/screenshots                              |
| AC-070 | README.md                                             |
| AC-071 | PLAN.md, ASSUMPTIONS.md, DEVIATIONS.md                |
| AC-072 | qa/hygiene.mjs                                        |
