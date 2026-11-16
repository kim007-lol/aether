    DOC 01 — CREATIVE BRIEF & COPY DECK
11. Concept
    AETHER is a single-page, scroll-driven cinematic journey through an invented alien system. The visitor is a camera flying on one continuous spline path: from a living planet, past its rings, through an asteroid field, into a glowing nebula, to a crystalline Aether Core that reacts to the cursor.
    The feeling is awe, silence, and scale: slow, confident, and expensive. Think premium space documentary meets luxury product reveal. Do not copy any existing film, game, or website; this is an original world.
12. Audience and goals
    • Audience: designers, developers, and creative directors evaluating technical and visual craft.
    • Goal: within 5 seconds the visitor thinks "this is not a template". Within 30 seconds they scroll to the end.
    • Success feeling: smooth, cinematic, never janky, never confusing.
13. The six chapters

#

Chapter
Scroll range (progress 0 to 1)
Hero visual
Emotional beat
0
Loader
before scroll
Glowing ring assembling
Anticipation
1
ARRIVAL
0.00 to 0.16
Planet "Aether" with atmosphere, clouds, rotating slowly against deep stars
Wonder
2
ATMOSPHERE
0.16 to 0.34
Camera swings to the terminator line: day, dusk, night, city lights, storm clouds
Intimacy
3
RINGS
0.34 to 0.52
Camera skims the ring plane through hundreds of thousands of lit particles
Speed and scale
4
DEBRIS
0.52 to 0.70
Weaving through a field of detailed, cratered asteroids
Tension
5
NEBULA
0.70 to 0.86
Volumetric glowing gas cloud with embedded stars
Transcendence
6
CORE
0.86 to 1.00
A refractive iridescent crystal with an energy heart and orbiting shards, reacting to the cursor
Climax and call to action
Transitions between chapters must be continuous (no cuts, no pop-in). Where a chapter's objects enter or leave, fade via distance, opacity, or scale, never abruptly. 4. Copy deck (use verbatim, do not invent other copy)
Loader: wordmark AETHER, status line Calibrating orbit, a numeric percent counter 000 to 100.
Hero (before first scroll)
• Eyebrow: A JOURNEY IN SIX MOVEMENTS
• Title: AETHER
• Subtitle: Beyond the last light, a world still listens.
• Hint: Scroll to descend
Chapters (each has label, headline, body)

1.  01 — Arrival · A world that breathes light. · Four billion years of weather, drawn in a single glance. Aether turns slowly, as if it knew you were coming.
2.  02 — Atmosphere · Where day lets go of night. · At the terminator, cities wake in gold while storms rewrite the sky below. Every cloud here is computed, not painted.
3.  03 — Rings · Ten thousand years, in motion. · Hundreds of thousands of fragments of ice and stone keep a quiet orbit. Slip between them.
4.  04 — Debris · The ruins of a moon that never formed. · Each rock carries its own scars. Fly close enough to read them.
5.  05 — Nebula · Light, before it learns a name. · A cloud of ionized gas, lit from within by stars not yet born.
6.  06 — Core · Touch the heart of it. · Everything you passed was only its echo. Move your cursor. It answers.
    Final section: primary button Begin again (smooth scroll to top), secondary text button Replay the descent (auto-scrolls the whole path in 40 seconds), footer line Made with WebGL. Built to be felt.
7.  Interactions (all required)
    • Smooth scroll drives everything (inertial, via Lenis).
    • Mouse parallax: camera offset up to ±0.6 units and ±2° rotation, eased with damping (lerp factor about 0.06 per frame at 60 FPS, frame-rate independent).
    • Custom cursor: small dot plus trailing ring; ring scales up over interactive elements and over the Core. Hidden on touch devices.
    • Keyboard: ArrowDown, PageDown, Space go to next chapter; ArrowUp, PageUp go to the previous; Home and End jump. Smooth animated jump over 1.6 s, expo.inOut.
    • Core interaction (Chapter 6): cursor proximity changes crystal emission intensity; click or tap fires a shockwave (expanding refractive ring plus bloom pulse, 1.2 s) and sends orbiting shards outward then back with spring physics.
    • Touch: vertical swipe scroll works natively; device tilt is NOT used. The Core reacts to touch position.
    • Audio (optional feature, OFF by default): a sound toggle in the HUD enables a generative ambient drone built with WebAudio (no audio files): 3 detuned sine/triangle oscillators through a low-pass filter plus slow LFO, with a soft swell at each chapter change. Must never autoplay. If you skip this feature, record it in DEVIATIONS.md, though implementing it is expected.
