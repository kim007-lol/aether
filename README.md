# AETHER

A continuous, scroll-driven WebGL journey through Arrival, Atmosphere, Rings, Debris, Nebula, and Core. The world, clouds, rocks, starfield, volumetric gas, glass environment, and ambient sound are generated procedurally. Text remains accessible HTML above one Three.js canvas.

## Run

Use Node.js 22.12 or newer; Node.js 24.14 was used during development. The commands below work in Windows Command Prompt (CMD).

For the first installation, start from the parent workspace. Stop any existing AETHER dev or preview server with **Ctrl+C** in its terminal before installing:

```cmd
cd aether
npm ci && npm run dev
```

Vite prints the local development address, normally `http://127.0.0.1:5173`. Keep that terminal running while using the site. The `&&` runs the server only if installation succeeds.

On later launches, dependencies are already installed. From inside `aether/`, run only:

```cmd
npm run dev
```

For production verification, stop the dev server with **Ctrl+C**, then run from inside `aether/`:

```cmd
npm run typecheck && npm run lint && npm run build && npm run preview
```

Preview serves `http://127.0.0.1:4173` and keeps its terminal occupied. Run QA in a separate terminal as described below. Stop preview with **Ctrl+C** before reinstalling dependencies.

Deploy the generated `dist/` directory to a static web server. The Vite base is relative, so bundled resources also work under a subdirectory. Opening `index.html` directly as a filesystem URL is not supported.

### Windows: EPERM during npm ci

If `npm ci` reports `EPERM: operation not permitted, unlink` for `@rolldown/binding-win32-x64-msvc/rolldown-binding.win32-x64-msvc.node`, a running AETHER Vite process can still be holding that native file open. Stop this project's dev and preview servers with **Ctrl+C** in their terminals, and wait for the command prompt to return. Then, inside `aether/`, restore the dependencies:

```cmd
npm ci && npm run dev
```

A failed `npm ci` can leave `node_modules` only partially installed. Subsequent “vite/tsc/eslint is not recognized” or missing Playwright errors are consequences of that incomplete installation. Wait for `npm ci` to finish successfully before running the other commands. Installing those tools globally does not repair this project.

For this file-lock case, administrator mode is not needed. Do not terminate every Node process: other projects and tools may also use Node. If the lock persists after stopping the AETHER servers, identify the process holding this particular file before retrying.

CMD does not recognize `#` as a comment. Explanatory instructions in this README are outside the command blocks; copy only the commands inside each block.

## Controls

| Input                                       | Action                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Mouse wheel, trackpad, vertical touch swipe | Move through the 900-viewport-height journey                                   |
| Chapter ticks on the right                  | Smoothly visit the selected chapter                                            |
| ArrowDown, PageDown, Space                  | Next chapter                                                                   |
| ArrowUp, PageUp                             | Previous chapter                                                               |
| Home / End                                  | Arrival / Core                                                                 |
| Pointer movement                            | Damped camera parallax; near the Core, strengthen its heart and attract shards |
| Click or tap the Core scene                 | Expanding shockwave and shard impulse; a swipe does not count as a tap         |
| Sound toggle                                | Enable or disable the generated ambient drone                                  |
| Quality toggle                              | Cycle Auto, Low, Medium, High, Ultra                                           |
| Begin again                                 | Return to the beginning                                                        |
| Replay the descent                          | Replay the full path over 40 seconds                                           |

Buttons retain ordinary keyboard activation, including Space on a focused button. The custom cursor appears only with a fine pointer and restores the native cursor on leaving the page. Touch scrolling is not prevented and device tilt is not used.

Sound starts off and no AudioContext is created until the sound button is activated. The last choice is stored, but a new page still waits for an explicit gesture before playing. Audio suspends when the document is hidden. The quality choice is stored separately; denied local storage does not stop the experience.

With `prefers-reduced-motion: reduce`, camera travel uses 0.8-second chapter transitions, text cross-fades, and parallax, shockwaves, and velocity-driven effects are disabled. Pointer interaction with the heart remains available. A skip link, named chapter navigation, visible focus rings, and polite chapter announcements provide alternative access.

## Quality

Auto starts conservatively using available memory, logical processor count, pointer type, and the GPU renderer string. Software rendering selects Low. A supported desktop GPU may start at High; coarse-pointer devices start no higher than Medium. In Auto, an average frame time over 22 ms for 90 frames drops one tier, with no more than two automatic drops per session. It never automatically increases quality. Manual or URL-selected tiers bypass automatic adjustment.

| Setting                  |       Low |      Medium |        High |       Ultra |
| ------------------------ | --------: | ----------: | ----------: | ----------: |
| DPR cap                  |         1 |         1.5 |           2 |           2 |
| MSAA samples             |         0 |           0 |           4 |           4 |
| Planet/cloud segments    | 240 × 128 |   320 × 192 |   384 × 256 |   512 × 320 |
| Stars                    |    30,000 |      60,000 |     120,000 |     200,000 |
| Ring particles           |    60,000 |     150,000 |     300,000 |     450,000 |
| Ring rocks               |     1,000 |       2,000 |       3,000 |       4,000 |
| Asteroids, far / mid     | 600 / 120 | 1,200 / 300 | 2,000 / 500 | 3,000 / 800 |
| Nebula march samples     |        40 |          56 |          80 |         112 |
| Nebula resolution factor |       0.5 |         0.6 |        0.75 |           1 |
| Core shards              |       120 |         200 |         300 |         400 |
| Hero shadow map          |       Off |         Off |        2048 |        4096 |

SMAA is used when MSAA is off. Chromatic aberration is off on Low. Low uses slightly more sphere segments than the source tier table to satisfy its minimum triangle requirement.

## Debug flags and API

Flags can be combined, for example `/?qa=1&tier=low`.

| Flag               | Effect                                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| `?debug=1`         | Load the local lil-gui panel for progress and tier control                   |
| `?qa=1`            | Expose the QA API in a production build                                      |
| `?tier=low`        | Force Low; also accepts `medium`, `high`, `ultra`                            |
| `?forceFallback=1` | Show the designed CSS/HTML fallback without creating the experience renderer |

The API is available as `window.__AETHER__` and `window.AETHER` in development or with `?qa=1`:

```js
await window.__AETHER__.ready;
window.__AETHER__.setProgress(0.78);
window.__AETHER__.setTier("medium");
console.table(window.__AETHER__.getInfo());
```

`getInfo()` reports chapter, progress, tier, renderer calls, triangles, points, geometry/texture counts, observed FPS, GPU identification, and path-clearance evidence. Additional QA helpers include `getState()`, `shockwave()`, `setAuto()`, `forceSlowFrames(ms)`, and `dispose()`. Set the artificial delay back to zero after testing adaptation. Instant progress assignment deliberately bypasses normal damping.

## Architecture

- `src/app/` owns boot, the single GSAP-driven render loop, device events, disposal, and quality policy.
- `src/core/` owns the renderer, post-processing composer, camera rig, Lenis/ScrollTrigger integration, sliced task queue, procedural noise, environment generation, and rock geometry/texture utilities. Rock generation uses a worker.
- `src/chapters/` implements the always-visible starfield and active planet, rings, asteroids, nebula, and Core groups. Heavy scene updates are limited to their active progress windows; the nebula remains available behind the transmissive Core.
- `src/shaders/` contains raw GLSL effects and shared chunks resolved by the `glsl()` helper.
- `src/ui/` implements the loader, DOM copy, custom line reveals, HUD, cursor, WebAudio drone, and fallback.
- `src/config/` centralizes chapter ranges/copy, camera control points, tier settings, and tokens.
- `qa/` contains geometry checks, bundle measurements, browser automation, screenshots, and reports.

The renderer outputs linear scene data into the post pipeline. Half-float targets are selected where supported; bloom, chromatic aberration, vignette, grain, and ACES tone mapping are composed before the optional SMAA pass. The nebula uses a separate raymarch target and an opaque composite so the glass can refract it. Core materials use a local procedural PMREM environment. Window resizing updates projection, renderer/composer sizes, and the nebula target. Context loss displays an overlay; restoration reloads the page.

## Verification

Install Playwright's Chromium once:

```cmd
npx playwright install chromium && npm run qa:geometry && npm run build && npm run preview
```

Leave preview running, then in a second terminal inside `aether/`:

```cmd
npm run qa
```

The QA script launches Chromium visibly by default and requests hardware rendering, captures 11 progress positions at 1440×900 and 390×844, and collects console/network events, renderer counts, pixel statistics, interactions, fallback behavior, memory loops, and adaptation. It writes `qa/report.json` and `qa/screenshots/p{progress}-{viewport}.png`. The suite also checks the layout after rotation.

Optional CMD configuration, from the second terminal inside `aether/`:

```cmd
set "QA_URL=http://127.0.0.1:4173"
set "QA_ITERATION=1"
set "QA_HEADLESS=1"
set "QA_SOFTWARE=1"
npm run qa
set "QA_URL="
set "QA_ITERATION="
set "QA_HEADLESS="
set "QA_SOFTWARE="
```

Equivalent configuration for PowerShell:

```powershell
$env:QA_URL = 'http://127.0.0.1:4173'
$env:QA_ITERATION = '1'
$env:QA_HEADLESS = '1'
$env:QA_SOFTWARE = '1'
npm run qa
Remove-Item Env:QA_URL, Env:QA_ITERATION, Env:QA_HEADLESS, Env:QA_SOFTWARE
```

`QA_ITERATION=1` writes a separate first-iteration report and screenshot directory. Omit it for final output. `QA_SOFTWARE=1` enables the ANGLE SwiftShader launch flags for machines without a usable GPU; otherwise the renderer string in each sample identifies the actual hardware. `QA_HEADLESS=1` is optional. `QA_FAST=1` skips the extended interaction suite; it is not equivalent to a full acceptance run.

Final verification evidence:

- [Final full QA report](qa/report.json): **42 passing assertions, 0 failed assertions, 22 captured samples**, and 2 performance observations. No console warnings/errors, page errors, or external-origin requests were collected. The actual renderer was **Intel UHD Graphics 730 through ANGLE Direct3D11**, not SwiftShader.
- [First QA iteration](qa/report-iteration1.json): the complete software-rendering baseline is preserved, including its failed pointer-parallax check. The final run passes the revised pointer/cursor check and records one shockwave per tap.
- [Visual review](qa/REVIEW.md): both sets of 22 sample panels were inspected. It records per-chapter critiques, corrections, final comparisons, and limits.
- [Geometry measurements](qa/geometry-report.json) and [supplemental tier measurements](qa/supplemental-report.json): generated geometry meets the checked minimums; sampled Medium/High renderer counts remain within their budgets.
- [Bundle measurements](qa/bundle.json): **327,998 bytes gzip** across all built JavaScript chunks, including the worker and optional debug GUI, below the 450 KB cap.
- [Contrast measurement](qa/contrast-report.json): **AC-051 remains FAIL**. A conservative full-text-rectangle check falls below 4.5:1 in 27 of 42 sampled rectangles. The method includes spaces and bright background details; it does not isolate glyph coverage or prove every animated frame. The required worst-case 4.5:1 guarantee is therefore not met.

A final clean install, typecheck, lint, geometry check, and build completed successfully. Windows initially refused to replace a locked Vite binary during install; stopping the running servers released it and the clean install then completed with 131 packages.

The final Low-tier hardware samples range from **19.67 to 100.43 FPS**, with an arithmetic mean of **49.86 FPS** across the captured samples. These are observed frame-rate readings during automated traversal, not a standardized sustained benchmark. High-tier settled chapter readings on the same integrated GPU are approximately **12.00, 9.10, 33.05, 11.41, 9.12, and 9.43 FPS** for Arrival through Core. This machine does **not** achieve 60 FPS at High. Neither a discrete-GPU target nor a real-phone target has been validated.

Five full scroll loops retained **43 geometries and 41 textures** on every loop. This establishes the tested loop stability, not an indefinite or five-minute phone memory soak. The final mobile emulation still recorded two post-loader long tasks. Passing the 42 scripted assertions does not mean every specification requirement passes; consult [DEVIATIONS.md](DEVIATIONS.md) and the acceptance report for remaining failures and unverified claims.

## Assets and specification

There are no runtime CDN requests, downloaded models, texture photographs, HDRI files, or audio recordings. Fonts are bundled locally from the installed Fontsource packages: Space Grotesk Variable, Instrument Serif italic, and JetBrains Mono Variable. Their license files remain in their packages. Three.js, pmndrs postprocessing, GSAP, Lenis, simplex-noise, and the development tools retain their upstream licenses.

The world concept, exact six-chapter copy, and requirements come from the supplied AETHER spec pack. [DOC 00–07](docs/DOC-00.md) are preserved in `docs/`. The original parent `readme.md` is unchanged. See [PLAN.md](PLAN.md), [ASSUMPTIONS.md](ASSUMPTIONS.md), and [DEVIATIONS.md](DEVIATIONS.md) for scope mapping, interpretation choices, and unmet requirements.
