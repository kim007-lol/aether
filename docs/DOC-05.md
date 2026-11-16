    DOC 05 — QUALITY BAR, ANTI-LOW-POLY RULES, PERFORMANCE BUDGETS
39. Geometry minimums (hard requirements, medium tier and above)
    Object
    Minimum triangles
    Note
    Planet
    100,000
    sphere segments from the tier table
    Cloud shell
    100,000
    same segment counts
    Core monolith
    80,000
    IcosahedronGeometry(4, 64)
    Energy heart
    20,000

Hero asteroid (near)
15,000 each

Mid asteroid
4,000 each

Far asteroid
900 each

Ring hero rock
700 each

Torus rings
30,000 each
32 x 512 tubular segments
Total triangles submitted per frame, counting only active chapters: at most 6 million on high, 3 million on medium. The low tier may drop to 60% of the minimums above. 2. Shading and material rules
• No flat shading on organic objects (planet, clouds, asteroids, monolith, heart). Always smooth normals. Hard facets are allowed only on the Core shards.
• No stock MeshBasicMaterial or default-colored MeshStandardMaterial for hero objects. Hero objects use custom shaders or extended PBR as specified.
• Every texture is generated procedurally, uses mipmaps and anisotropy = min(8, maxAnisotropy), and has the correct color space (SRGBColorSpace for color maps, linear for data).
• No visible banding in gradients: use the dithering NoiseEffect, jittered ray marching, and HalfFloatType buffers.
• No visible aliasing: shimmering stars and thin rings must be stable while the camera moves.
• One consistent sun direction across the whole journey. Shadows and highlights must agree with it. 3. Visual quality bar (what an evaluator should see)

1.  Scale and depth: layered depth cues in every frame (foreground particles, mid-ground object, background stars or nebula) plus atmospheric perspective.
2.  Focal hierarchy: every frame has one clear focal point, offset to a third line, with text placed in the opposite space.
3.  Light story: warm light (sun, city lights, ember) against cool shadows and space (cyan, violet). Highlights are bright but never clipped to flat white blobs.
4.  Material richness: the planet shows continents, ocean glint, cloud shadows, and city lights; rocks show craters and mineral variation; the Core shows refraction, dispersion, and iridescence.
5.  Motion quality: no jitter, no teleporting, no sudden brightness jumps; all transitions eased.
6.  Never empty: at no scroll position is the viewport an unintended black void.
    Forbidden looks: neon-gradient "generic tech" backgrounds, plain colored spheres, particle clouds that look like uniform snow, faceted "PS1" rocks, lens-flare spam, over-bloomed washed-out frames, white text directly over bright unmasked regions.
7.  Performance budgets
    Metric
    Target
    Frame rate
    60 FPS on a desktop discrete GPU at high; 30 FPS or better on a mid-range phone at medium
    Draw calls
    at most 120 per frame
    JS bundle
    at most 450 KB gzip (excluding fonts)
    Initial transfer including fonts
    at most 1.5 MB
    Long main-thread tasks after loader
    none above 50 ms
    Cumulative layout shift
    below 0.05
    Allocations in update() loops
    zero (pre-allocate Vector3, Matrix4, Quaternion, Color)
    Memory
    all chapters disposed correctly on dispose(); no growth over a 5-minute scroll loop
8.  Code quality
    TypeScript strict, no any, no unused symbols, ESLint clean, Prettier formatted. Modules stay under roughly 400 lines; extract helpers beyond that. Every non-obvious formula has a one-line comment explaining its intent. Magic numbers live in named constants or config/.
