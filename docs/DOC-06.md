    DOC 06 — ACCEPTANCE CRITERIA & SELF-VERIFICATION PROTOCOL
9.  Acceptance criteria
    Every ID must be reported as PASS, FAIL, or NOT-RUN in the final report, with evidence.
    Build and tooling
    ID
    Criterion
    AC-001
    Clean install succeeds; every dependency in package.json is an exact version (no ^ or ~)
    AC-002
    npm ls three shows exactly one three version
    AC-003
    npm run typecheck reports 0 errors
    AC-004
    npm run lint reports 0 errors and 0 warnings
    AC-005
    npm run build succeeds; JS gzip total is at most 450 KB
    AC-006
    npm run preview serves the site; full scroll from 0 to 1 and back produces 0 console errors and 0 warnings
    AC-007
    Zero network requests to any external origin during a full session (verified with a request listener)
    Visual, per chapter (each verified by a screenshot you actually inspected)
    ID
    Criterion
    AC-010
    Loader shows wordmark, status line, counter 000 to 100, lasts at least 2.2 s, transitions into the hero without a cut
    AC-011
    Chapter 1: planet with visible continents, ocean glint, cloud layer, blue limb halo, rim against stars, readable hero title
    AC-012
    Chapter 2: terminator with sunset band, city lights visible only on the night side, cloud shadows on the surface
    AC-013
    Chapter 3: ring with visible gaps, lit particles, planet shadow on rings, forward-scatter glow; camera passes through without clipping artifacts
    AC-014
    Chapter 4: cratered asteroids with smooth shading and mineral texture detail; at least 6 near-miss gate rocks; no rock intersects the camera
    AC-015
    Chapter 5: volumetric nebula with 3-color ramp, embedded star glows, sparks, no visible banding
    AC-016
    Chapter 6: Core shows refraction, dispersion, iridescence, glowing heart, orbiting shards; shockwave works on click and tap
    AC-017
    Continuous transitions: scrubbing progress slowly from 0 to 1 shows no pop-in, flash, or camera jump
    Geometry
    ID
    Criterion
    AC-020
    A script (qa/geometry-check) builds each hero geometry and asserts the triangle minimums of DOC 05 §1 for medium and above
    AC-021
    No hero object shows flat-shaded faceting in screenshots (except Core shards)
    Interaction
    ID
    Criterion
    AC-030
    Keyboard navigation works for all keys listed in DOC 01 §5
    AC-031
    Pointer parallax is smooth and frame-rate independent
    AC-032
    Custom cursor works on desktop and is hidden on touch
    AC-033
    prefers-reduced-motion: reduce produces the reduced behavior of DOC 02 §5
    AC-034
    Sound is OFF by default, never autoplays, toggle works and persists the choice
    AC-035
    Begin again and Replay the descent work
    Performance
    ID
    Criterion
    AC-040
    At 11 sample progress values, draw calls are at most 120 and triangles are within the DOC 05 budget (read from getInfo())
    AC-041
    Code review shows no new Vector3, new Matrix4, new Color, or array literals created inside per-frame update() paths
    AC-042
    Forcing slow frames (CPU throttle or artificial delay) triggers one automatic tier step-down without reload or visual glitch
    AC-043
    After 5 full scroll loops, renderer.info.memory geometries and textures counts are stable
    Accessibility and resilience
    ID
    Criterion
    AC-050
    Semantic structure, skip link, visible focus ring, accessible names, and aria-live chapter announcements as in DOC 02 §5
    AC-051
    Text over canvas reaches contrast 4.5:1 at every chapter (check worst-case screenshot regions)
    AC-060
    With ?forceFallback=1 (and when WebGL2 is unavailable) a graceful, designed fallback page appears with the copy deck and a CSS-only animated background
    AC-061
    WebGL context loss is handled as specified
    AC-062
    Resizing the window or rotating the device never stretches the canvas or breaks layout
    AC-063
    At 390 by 844 viewport, text, HUD, and Core are all usable and nothing overflows horizontally
    Documentation and hygiene
    ID
    Criterion
    AC-070
    README.md covers run, build, controls, tiers, debug flags (?debug=1, ?qa=1, ?tier=, ?forceFallback=1), and architecture
    AC-071
    PLAN.md, ASSUMPTIONS.md, and DEVIATIONS.md exist and are truthful
    AC-072
    grep -ri "todo|fixme|lorem|placeholder" src index.html returns nothing
10. Self-verification protocol (mandatory)
11. Write qa/qa.mjs (Playwright, Chromium). Launch with --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist when no GPU exists. Support ?tier=low so software rendering finishes in reasonable time.
12. For viewports 1440x900 and 390x844 and for p in [0, 0.08, 0.16, 0.25, 0.34, 0.43, 0.52, 0.64, 0.78, 0.90, 1.00]: call **AETHER**.setProgress(p), wait about 1.5 s, save qa/screenshots/p{p}-{viewport}.png, record getInfo().
13. Assert for every screenshot: not blank (luminance standard deviation above a threshold and mean luminance between 3 and 230).
14. Collect console errors and warnings and all non-same-origin requests.
15. Write qa/report.json with all measurements.
16. Look at the screenshots. If you can view images, open each one and write qa/REVIEW.md with at least one critique per chapter and what you changed. If you cannot view images, say so in the final report and rely on pixel assertions plus code review.
17. Perform at least two full iterations: QA, fix, QA again. The second run must show improvements over the first.
18. FPS measured in software rendering is not representative. Report it separately and never present it as real-GPU performance.
