    DOC 03 — TECHNICAL ARCHITECTURE & BUILD ORDER
13. Stack (pin exact versions, no ^ or ~)
    Before installing, verify each version exists with npm view <pkg> versions --json. Use the newest stable release that is at least 14 days old. After install, npm ls three must show exactly one three version (deduplicate if not).
    Package
    Purpose
    vite, typescript (strict: true)
    build, language. No React: this is a single-canvas app and you need full control of the render loop
    three + matching @types/three
    rendering (use a release that supports MeshPhysicalMaterial.dispersion, r163 or newer)
    postprocessing (pmndrs)
    post FX. Choose a version whose three peer range includes your three
    gsap (includes ScrollTrigger)
    timelines and scroll-bound UI
    lenis
    smooth scroll
    simplex-noise (4.x)
    CPU noise for geometry generation
    @fontsource-variable/space-grotesk, @fontsource/instrument-serif, @fontsource-variable/jetbrains-mono
    fonts
    dev: lil-gui (only behind ?debug=1), playwright, eslint, typescript-eslint, prettier
    tooling
14. Renderer settings
    • new WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false, depth: true }).
    • renderer.outputColorSpace = SRGBColorSpace. Tone mapping is done in the post pipeline, so renderer.toneMapping = NoToneMapping.
    • setPixelRatio(Math.min(devicePixelRatio, tier.dprCap)); clear color --void.
    • PerspectiveCamera: fov 40 on landscape, 52 when aspect below 1; near 0.1, far 3000. Do not use a log depth buffer; avoid z-fighting with the explicit offsets given in DOC 04.
    • Handle webglcontextlost (preventDefault, show overlay Graphics context lost, reloading, reload on webglcontextrestored).
    • Linear workflow: all color constants converted with Color.setStyle or setHex and used in linear space inside shaders.
15. Source structure
    src/
    ├─ main.ts
    ├─ app/ App.ts Loop.ts Quality.ts Events.ts
    ├─ core/ Renderer.ts Composer.ts CameraRig.ts ScrollDirector.ts
    │ EnvBuilder.ts Noise3D.ts TaskQueue.ts math.ts
    ├─ chapters/ Chapter.ts (interface) Starfield.ts Planet.ts Rings.ts
    │ Asteroids.ts Nebula.ts Core.ts
    ├─ shaders/ chunks/{noise,fbm,blackbody,atmosphere,sdf}.glsl + one .vert/.frag per effect
    ├─ ui/ Loader.ts Hud.ts TextReveal.ts Cursor.ts AudioEngine.ts Fallback.ts
    ├─ styles/ tokens.css base.css typography.css hud.css
    ├─ config/ chapters.ts (ranges + copy) quality.ts cameraPath.ts
    └─ qa/ debugApi.ts
    Import shaders with Vite ?raw. Provide a tiny glsl() helper that resolves #include <chunk> lines from shaders/chunks/ at build time or startup, so chunks are shared and there is no copy-paste of noise code.
16. Chapter interface
    interface FrameState {
    time: number; dt: number;
    progress: number; // damped global progress 0..1
    chapterT: number; // 0..1 inside this chapter's range
    velocity: number; // smoothed scroll velocity, normalized -1..1
    pointer: Vector2; // -1..1, damped
    camera: PerspectiveCamera; tier: Tier;
    }
    interface Chapter {
    readonly id: string;
    readonly range: [number, number];
    init(ctx: Ctx, queue: TaskQueue): Promise<void>; // may spread GPU/CPU work across frames
    warm(renderer: WebGLRenderer): void; // one off-screen render to compile and upload
    update(s: FrameState): void; // only called while active
    setVisible(v: boolean): void;
    rebuild(tier: Tier): void; // live tier change without reload
    dispose(): void;
    }
    A chapter is active when progress is within its range ±0.06. Outside that window setVisible(false) and no update() calls. Never leave off-screen heavy chapters rendering (this is what keeps frame time stable).
17. Scroll and camera architecture
    • Page height is 900vh. Lenis (duration: 1.4, smoothWheel: true) is integrated with ScrollTrigger exactly like this: lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t _ 1000)); gsap.ticker.lagSmoothing(0);. One animation loop only: the GSAP ticker drives rendering. Do not start a second requestAnimationFrame loop.
    • ScrollDirector holds target (raw scroll 0..1) and progress (damped with 1 - Math.exp(-dt _ 6)). It also exposes velocity (smoothed) and jumpTo(p, duration).
    • CameraRig samples two CatmullRomCurve3 (type centripetal) built from the control points in DOC 04 §0: one for position, one for look-at target. Sample with arc-length parameterization (getPointAt) but remap progress so that segment timing matches the chapter ranges (use a piecewise-linear remap table of control points to progress values).
    • Add subtle handheld drift (amplitude 0.05 units, about 0.15 Hz, from noise) and roll up to 3° proportional to lateral camera velocity. Add pointer parallax from DOC 01 §5.
18. Post-processing pipeline (pmndrs postprocessing)
19. EffectComposer(renderer, { frameBufferType: HalfFloatType, multisampling: tier.msaa }).
20. RenderPass(scene, camera).
21. One merged EffectPass containing, in this order: BloomEffect (mipmapBlur: true, luminanceThreshold: 0.9, luminanceSmoothing: 0.2, intensity: 0.9 base, radius: 0.85, levels: 8), ChromaticAberrationEffect (radialModulation: true, base offset 0.0005, up to 0.0022 driven by velocity, off on low), VignetteEffect (offset 0.3, darkness 0.65), NoiseEffect (premultiply, opacity 0.035), then ToneMappingEffect (ACES_FILMIC, exposure 1.0) last.
22. If tier.msaa === 0, add an SMAAEffect pass at the end.
    Authoring rule: emissive things (city lights, stars, energy heart, nebula cores, shockwave) are authored with HDR values above 1.0 and toneMapped handled by the composer, so bloom picks exactly these and nothing else. Never fake glow with sprites if bloom can do it.
23. Quality tiers
    Parameter
    low
    medium
    high
    ultra
    dprCap
    1.0
    1.5
    2.0
    2.0
    msaa (else SMAA)
    0
    0
    4
    4
    Planet sphere segments [w, h]
    [224,128]
    [320,192]
    [384,256]
    [512,320]
    Cloud fbm octaves
    4
    5
    6
    7
    Atmosphere march steps
    8
    12
    16
    24
    Stars
    30k
    60k
    120k
    200k
    Ring impostor particles
    60k
    150k
    300k
    450k
    Ring hero rocks (mesh)
    1,000
    2,000
    3,000
    4,000
    Asteroid far / mid instances
    600 / 120
    1,200 / 300
    2,000 / 500
    3,000 / 800
    Nebula march steps
    40
    56
    80
    112
    Nebula resolution scale
    0.5
    0.6
    0.75
    1.0
    Core shards
    120
    200
    300
    400
    Shadows on hero rocks
    off
    off
    2048 map
    4096 map
    Chromatic aberration
    off
    on
    on
    on
    • Auto-detect the initial tier from navigator.deviceMemory, hardwareConcurrency, matchMedia('(pointer: coarse)'), and the unmasked GPU renderer string. Phones start at medium at most; desktops with discrete GPU start at high.
    • Adaptive step-down: if average frame time over 90 consecutive frames exceeds 22 ms, drop one tier by calling every chapter's rebuild(tier) (no page reload). At most 2 step-downs. Never step up automatically.
    • Manual override: HUD quality toggle Auto / Low / Medium / High / Ultra, stored in localStorage (wrap in try/catch).
    • Geometry minimums in DOC 05 apply to medium and above. low may go down to 60% of those minimums but must still show smooth shading.
24. Boot sequence
    • The loader HTML and critical CSS are inline in index.html, so something beautiful shows before JS finishes.
    • A TaskQueue runs heavy generation in slices of at most 8 ms per frame and reports real progress to the loader. Loader shows progress smoothly (counter eases to the real value) and lasts at least 2.2 s so it never flashes.
    • Generated at boot: Noise3D (128³ R8 Data3DTexture, repeat-wrapped), asteroid geometries (preferably in a Web Worker, returning transferable buffers), tileable rock textures (GPU render-to-texture 1024² albedo + normal), the procedural environment map (PMREM), star buffers.
    • Call renderer.compileAsync(scene, camera) per chapter, then chapter.warm(). The loader may only finish when all chapters are warmed, so there are no stutters on first reveal.
25. Build order (milestones)
    After each milestone, capture a screenshot to qa/screenshots/Mx.png and look at it critically before continuing.
    M
    Deliverable
    M1
    Shell: Vite + TS strict, tokens, fonts, HUD skeleton, loader, Lenis + ScrollTrigger, 900vh scroll, debug API
    M2
    Core engine: renderer, composer, camera rig (debug path markers only, removed before M9), quality system, resize and DPR
    M3
    Starfield, Milky Way, procedural environment
    M4
    Planet, clouds, atmosphere (Chapters 1 and 2) and the loader-to-hero transition
    M5
    Rings (Chapter 3)
    M6
    Asteroids (Chapter 4)
    M7
    Nebula (Chapter 5)
    M8
    Core, shockwave, CTA (Chapter 6)
    M9
    Polish: text reveals, cursor, audio, keyboard nav, reduced motion, WebGL fallback, velocity FX, README, QA run
26. Debug and QA API
    Expose window.**AETHER** only when URL has ?qa=1 (or in dev):
    • ready: Promise<void> resolves after the first warmed frame.
    • setProgress(p: number): sets progress instantly (bypasses damping).
    • setTier(t: 'low'|'medium'|'high'|'ultra').
    • getInfo(): { progress, chapter, tier, fps, calls, triangles, geometries, textures } using renderer.info.
