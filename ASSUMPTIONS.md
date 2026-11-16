# Assumptions

- The existing readme.md is the immutable source specification. The application lives in aether/. DOC 00–07 are copied into docs/.
- The client date is November 16, 2026; dependency release cutoff is November 2, 2026. Registry availability and compatibility decide exact pins.
- The markdown multiplication underscores mean multiplication. The debug API is window.__AETHER__, with window.AETHER as an alias.
- Chapter visibility margins override the later planet fade instruction: the planet is culled after its active window. Adjacent-object fades are applied before culling.
- Camera composition may be fine-tuned under DOC 04 permission, keeping continuous motion and clearance.
- The supplied low sphere segment count gives fewer than 60,000 triangles; low uses 240×128 (60,960) to honor the geometry minimum.
- Stretch aurora and sprite streak features are optional.
- Automated Chromium runs may use software rendering; hardware FPS is reported only if a real GPU is observed.
- TypeScript 6.0.3 is the newest compatible release below 6.1; newest stable 7.0.2 fails typescript-eslint peer resolution. No forced peer overrides are used.
