    DOC 04 — SCENE-BY-SCENE TECHNICAL SPEC
27. World, lighting, and camera path
    • Units are arbitrary. Planet radius R = 10 at the origin. Axial tilt 0.41 rad (around Z), self-rotation 0.012 rad/s.
    • Sun direction S = normalize(1.0, 0.28, 0.55) which is about (0.851, 0.238, 0.468). One DirectionalLight color #FFF1DC, intensity 3.2; hemisphere light sky #0B1030, ground #000000, intensity 0.15.
    • Ring plane: ringGroup.rotation.set(0.28, 0, -0.12), centered at the planet.
    • Asteroid field center F = (70, 0, -60). Nebula center N = (170, 15, -250), bounding radius 140. Core position C = (190, 0, -290).
    Camera control points (position then look-at). Chapter 3 points are authored in ring-local space and transformed by ringGroup.matrixWorld at init (this avoids coordinate mistakes).
    Progress
    Position
    Look-at
    Note
    0.00
    (0, 7, 52)
    (0, -3, 0)
    hero, planet in lower half
    0.08
    (-6, 5, 34)
    (0, 0, 0)
    slow dolly in
    0.16
    (-9, 6, 21)
    (0, 0, 0)
    arrives at terminator (position about 81° from sun)
    0.25
    (-14, 3, 17)
    (2, 0, 0)
    night side with city lights
    0.34
    ring-local (16.5, 3.0, 8)
    ring-local (22, 0, -8)
    approaches ring plane from above
    0.43
    ring-local arc radius 21, height +0.6
    tangent ahead
    skims inside the rings
    0.52
    ring-local arc radius 25, height -0.4
    tangent ahead
    crosses plane, exits
    0.58
    (48, 2, -26)
    F
    emerges toward field
    0.64
    (62, 0, -50)
    (74, 0, -72)
    weaves between gate rocks
    0.70
    (78, -3, -72)
    (100, 4, -112)
    leaves field
    0.78
    (110, 6, -112)
    (150, 12, -200)
    enters nebula
    0.86
    (150, 8, -190)
    C
    deep inside nebula, core glimmers ahead
    1.00
    (190, 2, -268)
    C
    final pose, distance about 22 from the Core
    The agent may fine-tune these numbers to improve composition, but must keep: continuity (no jumps), a minimum clearance of 1.5 units from any solid mesh, and the planet silhouette fully visible at progress 0.00.
28. Starfield and Milky Way (always visible, follows camera)
    • Group position copies camera.position each frame, so stars show no parallax (they are infinitely far).
    • Three Points layers (counts per tier split 60% / 30% / 10% into small / medium / large). Positions: random on a sphere of radius 2000. 40% of stars are concentrated near a galactic plane (Gaussian in latitude, sigma 0.18 rad) to form a band.
    • Per-star attributes: aSize (power-law, mostly small), aTemp (3000 to 12000 K, biased cool), aPhase, aSpeed.
    • Vertex shader: size = aSize _ uPixelRatio. Fragment: soft disc pow(1.0 - r, 3.0); color from an analytic blackbody approximation (Tanner Helland style) in linear space; twinkle 0.85 + 0.15 _ sin(t _ aSpeed + aPhase); HDR multiplier up to 3.0 on the largest stars so bloom catches them. Additive blending, depthWrite: false.
    • 2% of the brightest stars are drawn as a separate Points layer with a 4-point diffraction spike pattern in the fragment shader.
    • Milky Way: a BackSide sphere (radius 2400, depthWrite: false, rendered first) whose fragment shader samples 3D fbm along the view direction, concentrated by exp(-pow(dot(dir, galacticNormal) _ 4.0, 2.0)); dust lanes subtract light; palette from deep violet through warm cream; overall intensity about 0.25 so it supports the stars rather than competing.
29. Planet "Aether" (Chapters 1 and 2)
    Geometry. SphereGeometry(10, w, h) using the tier's [w, h] (high: 384 by 256 which is about 196k triangles). The shader uses 3D position (never UVs), so there are no seams and no pole distortion. Vertex shader displaces along the normal by terrainHeight _ 0.12 (mountains) using the same terrain function as the fragment shader.
    Terrain function (shared GLSL chunk). Domain-warped fbm: p = normalize(pos) _ 2.2; p += 0.35 * vec3(fbm(p*1.7), fbm(p*1.7+7.3), fbm(p*1.7+13.1)); continents from 5-octave fbm; mountains from ridged multifractal masked by continental interior; sea level 0.48.
    Fragment shading (custom ShaderMaterial, not a stock material):
    • Biomes from height, latitude lat = abs(normalizedPos.y) and a noise-based moisture: deep ocean #04223d to #0a4a6e, shallows #1ea0a8, sand #c9b27c, grass and forest #2f5d34, arid #b88a52, rock #6b6358, snow #f2f6fa. Polar ice where lat > 0.78 + 0.06 _ noise. Blend with smooth transitions, no hard bands.
    • Normals: perturb the geometric normal using finite differences of the height function (2 tangent offsets), strength scaled by a mountain mask.
    • Day lighting: wrapped Lambert (wrap = 0.15) with sun color; ocean uses GGX specular (roughness 0.08, F0 0.02, Schlick Fresnel), animated micro-wave normals from two scrolling noise layers, giving a bright sun glint.
    • Night side: nightMask = 1.0 - smoothstep(-0.05, 0.20, dot(N, S)). City lights: land-only mask times clustered voronoi noise (thresholded, with fine detail), colored mix(ember, gold, noise), HDR intensity 2.2, with slow flicker. Cities must visibly appear only on the night side and fade through the terminator.
    • Cloud shadows: sample the cloud density function at pos - S _ 0.02 and darken diffuse light by up to 55%.
    • Ring shadow on planet: analytic ray from the surface point toward the sun against the ring plane; if the hit radius is inside [14, 30], multiply light by 1 - 0.5 \* ringDensity(r).
    Clouds. Separate sphere at radius 10.14 (SphereGeometry same segments), transparent, depthWrite: false. Density from 3D fbm (octaves per tier) with two layers advected at different angular speeds (0.004 and 0.007 rad/s), alpha = smoothstep(0.48, 0.78, density). Lit by sun with wrapped Lambert plus a warm forward-scatter tint near the terminator (use ember). On the night side clouds are dark with rare lightning flashes: a random cell lights up cyan-white (HDR 3.0) for 120 ms every 4 to 9 s. Surface offset 0.14 above terrain peaks prevents z-fighting; renderOrder above planet.
    Atmosphere. Sphere radius 10.9, BackSide is not used: render the front faces with a fragment shader that ray-marches from the camera ray through the atmosphere shell (ray-sphere intersection against radius 10.9 and the planet radius 10), single scattering with uSteps primary samples and 4 light samples each.
    • Rayleigh coefficients (5.8e-3, 13.5e-3, 33.1e-3) scaled to the unit system, Mie coefficient 21e-3 with asymmetry g = 0.76, scale heights 0.25 (Rayleigh) and 0.1 (Mie) as fractions of shell thickness, sun intensity about 22.
    • Must show: a blue limb halo on the lit side, a warm orange-to-magenta sunset band at the terminator, and a fine bright rim against black space.
    • transparent, blending: AdditiveBlending, depthWrite: false, renderOrder last among planet components. Add a tiny extra Fresnel glow tinted --cyan at 1.5% intensity.
    Behavior across chapters. In Chapter 1 the planet is calm and elegant. In Chapter 2 the camera sits near the terminator; the wrapped lighting, city lights, atmosphere band, and cloud shadows are the stars of the show. The planet fades out (scale stays, opacity of all three layers) between progress 0.70 and 0.78.
    Stretch S1 (high and ultra only): aurora curtains over the north pole: a ribbon mesh with additive shader, green-cyan-violet vertical gradient, animated fbm distortion.
30. Rings (Chapter 3)
    Ring structure (ring-local space, y is the ring normal): annulus from inner radius 14.0 to outer radius 30.0.
    • Density profile density(r) (shared GLSL and TS function so planet shadow, particles, and dust agree): a smooth base profile with gaps at r = 18.2 (width 0.5), r = 22.6 (width 0.9), r = 26.8 (width 0.3), plus fine concentric banding (frequency about 20 per unit, amplitude 0.15) and low-frequency spiral density waves.
    • Color by radius: inner dusty brown #8a6f55, middle icy white #e8f0f6, outer bluish #9bbad6, with per-particle value variation.
    • Orbital motion: angular speed omega(r) = 0.25 _ pow(r / 14.0, -1.5) rad/s, computed in the vertex shader (no CPU per-particle updates).
    • Thickness: vertical Gaussian, sigma 0.05 + 0.02 _ noise.
    Two layers:
    • Layer A: lit sphere impostors. One Points object with tier.ringParticles entries. The fragment shader builds a fake sphere normal n = vec3(uv, sqrt(1 - r\*r)) and lights it with the sun (Lambert plus ice sparkle), so every dot reads as a small lit rock, not a flat dot. Include (a) planet shadow: analytic ray-cylinder test against the planet along S, with soft penumbra; (b) forward-scatter brightening using a Henyey-Greenstein phase function (g = 0.6) when looking toward the sun, which makes the rings glow; (c) size attenuation with a minimum of 1.5 px so far particles do not alias; (d) distance fade near the camera so impostors never fill the lens.
    • Layer B: hero rocks. InstancedMesh of tier.ringHeroRocks using 3 geometry variants (IcosahedronGeometry(1, 5) or higher detail, merged and displaced using the generator in §4, about 720 triangles each) with sizes from a power law between 0.03 and 0.35 units, placed with the same density function. They use the same lighting and planet-shadow logic as Layer A (via onBeforeCompile on a MeshStandardMaterial) and tumble slowly through per-instance axis attributes in the vertex shader.
    A faint continuous dust sheet (PlaneGeometry-based annulus with alpha from the density function, additive, low opacity 0.12) fills visual gaps between particles when viewed from far.
    Stretch S2: when scroll velocity is high, stretch Layer A sprites along motion direction for a streak effect.
31. Asteroid field (Chapter 4)
    Shape generator (shared by rings and asteroids; runs in a Web Worker or the TaskQueue):
32. Start from IcosahedronGeometry(1, detail). Because it is non-indexed, call mergeVertices(geometry) from BufferGeometryUtils before displacement, otherwise normals become flat and the rock looks faceted. This step is mandatory.
33. Displace each vertex: radius = 1 + 0.35 _ ridgedFbm(p _ 1.3 + seed) + 0.08 _ fbm(p _ 4.0 + seed).
34. Craters: for each rock choose 10 to 16 random directions with random radius 0.08..0.3; apply a depth profile -depth _ (1 - smoothstep(0, R, angularDistance)) + rim _ smoothstep(R _ 0.8, R, d) _ (1 - smoothstep(R, R \* 1.3, d)).
35. Apply non-uniform scale (0.7..1.3) per axis for elongation.
36. computeVertexNormals() after displacement; store a baked cavity attribute aCavity (0 in deep craters, 1 on rims).
    Detail levels (triangle counts are hard minimums):
    Level
    Geometry
    Triangles
    Count
    Hero (near gate rocks)
    IcosahedronGeometry(1, 28)
    16,820
    12 individual meshes placed along the camera path
    Mid
    IcosahedronGeometry(1, 14) x 3 variants
    4,500
    tier mid instances
    Far
    IcosahedronGeometry(1, 6) x 3 variants
    980
    tier far instances
    Instances live in an ellipsoidal shell radii (38, 14, 38) around F with a clearing along the camera path. Size distribution log-normal, range 0.4..6.0 units. Place 6 "gate" rocks close to the camera path (near-miss distance between 1.5 and 3 units) to create a visceral sense of speed.
    Material: MeshStandardMaterial (roughness 0.92, metalness 0.05) extended with onBeforeCompile: triplanar mapping of procedural, tileable 1024² albedo and normal textures (grey-brown base with mineral flecks, generated at boot through a GPU render-to-texture pass), multiplied by aCavity for baked ambient occlusion, plus instanceColor variation (hue shift within ±8%, value ±15%). Tumbling is done in the vertex shader from per-instance axis and speed attributes.
    Shadows (high and ultra): the sun DirectionalLight casts shadows only onto hero and mid rocks; shadow frustum 14 units around the camera, bias = -0.0004, normalBias = 0.02, PCFSoftShadowMap. On low and medium use cavity AO only.
    Speed cue: 4,000 dust motes (Points, tiny, additive, low opacity) drifting around the camera, wrapping in a 30-unit cube anchored to the camera, with a slight velocity-based stretch.
37. Nebula (Chapter 5)
    Volume rendering (the camera flies inside it, so it must be a true volume):
    • Render the volume with a fullscreen-triangle fragment shader into a HalfFloatType RGBA render target at tier.nebulaRes of the screen. RGB holds in-scattered light, A holds transmittance. Only render it while progress is within 0.62..0.98.
    • Per pixel: ray from camera, intersect the bounding sphere (center N, radius 140), march tier.nebulaSteps steps with adaptive step size (1.0 to 2.5 units) and per-pixel jitter (interleaved gradient noise) to hide banding. Early exit when transmittance is below 0.02.
    • Density d(p) = lobeMask(p) _ (0.55 _ n1 + 0.3 _ n2 + 0.15 _ n3), with n1..n3 sampled from the 128³ Noise3D texture at scales 0.012, 0.03, 0.07 with different offsets and slow time drift. lobeMask is the union of three soft ellipsoids with falloff to zero at the bounding sphere edge.
    • Color by density ramp: 0.15 cyan #5CE1FF, 0.5 violet #8B5CFF, 0.85 ember #FF8A4C (hot cores). Emission HDR up to 3.0 so bloom lifts the cores.
    • Lighting: 5 embedded star lights; accumulate 1 / (1 + dist² _ k) times color; one shadow sample toward the dominant star gives depth. Absorption by Beer-Lambert with sigma = 0.06 per unit.
    • Composite: draw the render target texture (linear filtering) with a fullscreen triangle in the opaque queue (transparent: false, depthTest: false, depthWrite: false, renderOrder: -100) as rgb + background _ a. It must be opaque-queue so it shows up in the Core's transmission pass (see DOC 07).
    • Add 3 protostar glows (additive soft billboards, HDR 4.0) and 8,000 ionized spark particles with curl-noise motion in the vertex shader.
    • No temporal accumulation or TAA (avoid ghosting).
38. The Aether Core (Chapter 6)
    All Core objects live in a group at C.
    • a) Liquid-glass monolith. IcosahedronGeometry(4, 64) (84,500 triangles) after mergeVertices. The vertex shader (via onBeforeCompile) displaces vertices with animated 3D simplex noise (amplitude 0.35, two octaves, slow time evolution) and recomputes the normal by finite differences: build tangent t = normalize(cross(n, up)), b = cross(n, t), displace p, p + t*eps, p + b*eps and use normalize(cross(p1 - p0, p2 - p0)). Material MeshPhysicalMaterial: transmission: 1, thickness: 2.5, ior: 1.45, dispersion: 0.35, roughness: 0.02, iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [200, 800], attenuationColor violet, attenuationDistance: 3, clearcoat: 1, envMapIntensity: 1.6.
    • b) Energy heart. IcosahedronGeometry(1.4, 32) (21,780 triangles) with an opaque shader (plasma: fbm-animated, fresnel edge, HDR color 6+, toneMapped: false). It must be opaque so it appears refracted through the glass (three.js only renders the opaque queue into the transmission buffer).
    • c) Orbit rings. Three counter-rotating TorusGeometry(2.4..3.2, 0.015, 32, 512) meshes, MeshStandardMaterial metalness 1, roughness 0.2, emissive cyan HDR 2.0, different axes.
    • d) Shards. InstancedMesh with tier.shards bipyramid crystal shards (hexagonal bipyramid, elongated 1:4). Flat facets are correct here (hard crystal) and are the one allowed exception to the anti-faceting rule. Material MeshPhysicalMaterial transmission 0.9, roughness 0.05, iridescence 1. Elliptical orbits radius 6..14, random inclination and speed. Matrices updated on the CPU (at most 400 instances) with pre-allocated temporaries.
    • e) Local environment. Build a procedural PMREM from a mini scene (gradient dome plus emissive softbox strips in cyan, violet, and ember) with PMREMGenerator.fromScene. Assign it as envMap on Core materials only. Do not set it as scene.environment, which would alter other chapters.
    • f) Lights. Three point lights (cyan, violet, ember), intensity about 60, orbiting at radius 9, plus a rim light.
    • g) Cursor proximity. Raycast the pointer against a plane through C facing the camera. proximity = smoothstep(14, 0, distance). It drives heart emission 1.0 to 2.6, displacement amplitude 0.35 to 0.6, and attracts shards toward the cursor point by up to 1.5 units (spring, damped).
    • h) Shockwave (click or tap): an expanding thin ring (RingGeometry(1, 1.15, 256) billboarded to camera) scaling 1 to 18 over 1.2 s with a Fresnel-lit additive shader (HDR 3.0), a bloom intensity spike (+0.8, decays over 0.8 s), a chromatic aberration spike, camera shake (0.15 units, exponential decay over 0.5 s), and an outward impulse on shards that spring back.
    • i) CTA. When progress is greater than 0.93, the final section fades in over the Core without covering it (text left, Core stays center-right).
