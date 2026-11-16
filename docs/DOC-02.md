    DOC 02 — DESIGN SYSTEM & MOTION
8.  Color tokens (CSS custom properties on :root, mirrored in a tokens.ts for JS use)
    Token
    Value
    Use
    --void
    #05060A
    page background, deep space
    --ink
    #0B0E17
    panels, loader background
    --stellar
    #F4F1EA
    primary text
    --stellar-dim
    rgba(244,241,234,0.62)
    body text
    --hairline
    rgba(244,241,234,0.14)
    borders, dividers
    --cyan
    #5CE1FF
    primary accent, atmosphere, UI highlights
    --violet
    #8B5CFF
    secondary accent, nebula, core
    --ember
    #FF8A4C
    warm accent, city lights, dusk
    --gold
    #FFD89A
    highlight, sun glints
    Rules: text over canvas must reach contrast ratio of at least 4.5:1 against its worst-case background. Where the 3D background can be bright, add a soft local gradient scrim behind the text block (radial, max 55% opacity of --void). Do not use pure #000 or pure #fff.
9.  Typography (self-hosted through npm, font-display: swap, preload the display font)
    • Display: Space Grotesk Variable (@fontsource-variable/space-grotesk), weights 300 to 700. Used for the title, headlines, and UI.
    • Editorial accent: Instrument Serif italic (@fontsource/instrument-serif). Used for the subtitle and one emphasized word per headline if desired.
    • Mono: JetBrains Mono Variable (@fontsource-variable/jetbrains-mono). Used for labels, counters, and HUD.
    Role
    Size
    Weight
    Tracking
    Line height
    Hero title AETHER
    clamp(4rem, 17vw, 17rem)
    300
    0.18em
    0.9
    Chapter headline
    clamp(2rem, 5.2vw, 5rem)
    400
    -0.02em
    1.04
    Body
    clamp(1rem, 1.15vw, 1.2rem)
    400
    0
    1.6, max-width 38ch
    Label / HUD
    0.75rem
    500
    0.16em, uppercase
    1.2
10. Layout
    • 12-column grid, outer margin clamp(20px, 4vw, 72px), 8px spacing scale.
    • Text blocks alternate sides per chapter (left, right, left, right, left, center) so they never cover the focal object. The focal object must stay in the visible third not covered by text.
    • HUD (fixed, pointer-events: none except buttons): top-left wordmark AETHER; top-right sound toggle and quality toggle; right edge vertical chapter indicator (6 ticks plus active label); bottom center scroll hint (only at progress below 0.03); bottom-left live chapter name in mono; thin progress line along the bottom edge.
    • All text is real DOM, not canvas text, so it is selectable and accessible.
11. Motion language
    • Philosophy: slow, weighty, cinematic. Nothing snaps; everything has inertia.
    • Easing vocabulary: expo.out (entrances), power3.inOut (camera jumps), sine.inOut (ambient loops). Never use linear except for scrubbed scroll.
    • Text reveal: custom line splitter (do not depend on paid plugins). Each line is wrapped in an overflow: hidden mask; inner line translates from 110% to 0 with expo.out, 1.1 s, stagger 0.08 s. Label fades and slides 12px. Exit is reversed faster (0.5 s).
    • Chapter text is bound to scroll ranges via ScrollTrigger, with enter and leave handled symmetrically for scrolling up.
    • Scroll scrub smoothing: camera progress follows scroll with damping (critically damped spring or lerp with 1 - Math.exp(-dt \* 6)), so rapid scrolling never produces jitter.
    • Loader to hero transition (1.8 s): the loader ring expands and fades while the planet fades in from darkness and the camera pulls back from z = 60 to its starting pose.
    • Post-processing animation: bloom intensity and chromatic aberration increase slightly during fast scroll (velocity-driven, capped), then relax. Vignette is constant.
12. Accessibility
    • prefers-reduced-motion: reduce: disable parallax, shockwave, velocity effects, and text mask animation (use simple opacity cross-fades); camera moves chapter to chapter with 0.8 s eased jumps instead of continuous scrub; keep visuals otherwise intact.
    • Semantic structure: <header>, <main> with 6 <section> elements each with aria-labelledby, <nav aria-label="Chapters">. Canvas has aria-hidden="true". A visually hidden aria-live="polite" region announces the chapter name on change.
    • Visible focus ring (2px --cyan, 3px offset) on all focusable elements. Skip link Skip to content as the first focusable element.
    • All buttons are real <button> elements with accessible names and a minimum 44 by 44 px target.
