    DOC 07 — KNOWN PITFALLS (read before coding)
    These are the mistakes that most often break projects like this. Each one is a binding instruction.
19. API drift in three.js. Use renderer.outputColorSpace and SRGBColorSpace; encoding and sRGBEncoding no longer exist. dispersion exists only on recent MeshPhysicalMaterial (r163 or newer). Verify every API you use against the installed version's types before relying on it.
20. Duplicate three instances. postprocessing and @types/three must resolve to the same three. Use overrides in package.json if needed.
21. Flat-shaded rocks. IcosahedronGeometry is non-indexed. Run mergeVertices before displacement and computeVertexNormals() afterward.
22. Transmission shows only the opaque queue. The Core's glass refracts only opaque objects. Make the Milky Way sphere, the nebula composite, and the energy heart opaque-queue objects (transparent: false). Stars and additive particles will not appear in refraction, which is acceptable.
23. Transparent sorting. Clouds and atmosphere need depthWrite: false, explicit renderOrder, and a radial offset (cloud at 10.14, atmosphere at 10.9) to avoid z-fighting.
24. GLSL numerical traps. Guard sqrt of negatives (sqrt(max(x, 0.0))), normalize of zero vectors, pow of negatives, and divisions by zero. A single NaN becomes a black or white square after bloom.
25. Bloom pollution. Anything above the bloom threshold glows. Keep non-emissive surfaces below 0.9 luminance in linear HDR before tone mapping, and author emissives deliberately above 1.0.
26. Lenis and ScrollTrigger. Use exactly the integration in DOC 03 §5. Two loops or missing lagSmoothing(0) causes jitter.
27. Per-frame allocations. Creating vectors or arrays inside update() causes GC stutters. Pre-allocate.
28. Heavy work on the main thread. Noise textures, asteroid geometry, and ring buffers must be generated through the TaskQueue (8 ms slices) or a Web Worker. A blocking 2-second freeze at boot is a failure.
29. Shader compile hitches. Call compileAsync and warm() for every chapter at boot. First reveal of a chapter must not hitch.
30. Rendering everything always. Only active chapters update and render. Hide the rest with visible = false, and skip the nebula render-target pass outside its range.
31. Resize and DPR. On resize update the renderer, composer, camera aspect, nebula render target, and all uResolution or uPixelRatio uniforms. Respect the tier DPR cap; never use raw devicePixelRatio above 2.
32. Half-float support. Use HalfFloatType render targets (not FloatType) so iOS Safari works. Feature-detect EXT_color_buffer_half_float/EXT_color_buffer_float and degrade gracefully.
33. 3D textures. Data3DTexture needs RedFormat, UnsignedByteType, LinearFilter, RepeatWrapping, and unpackAlignment = 1.
34. Shadow acne and peter-panning. Use the bias values from DOC 04 §4 and test with the sun at the real angle.
35. Camera clipping. Hero rocks and ring particles near the path must keep at least 1.5 units clearance. Verify numerically in code (sample the path, compute distances) and log the minimum clearance in the QA report.
36. Instanced matrix updates. After CPU updates set instanceMatrix.needsUpdate = true. For per-instance rotation done in shaders, do not also update matrices on the CPU.
37. Touch and scroll. Do not call preventDefault on touch scroll. Do not lock scroll. touch-action stays default on the page body.
38. Fonts. Preload the display font file, set font-display: swap, and size the loader and hero so no layout shift occurs when fonts arrive.
39. Cursor. The custom cursor must not hide the native cursor on touch devices or when the pointer leaves the window; use pointer: fine media query.
40. Audio. An AudioContext starts only after a user gesture (the toggle click). Ramp gain over 0.4 s to avoid clicks. Suspend when the tab is hidden.
41. Tab visibility. Pause the loop when document.hidden and reset the delta timer on return so dt never spikes.
42. Delta time clamp. Clamp dt to at most 0.05 s so nothing explodes after stalls.
43. Honest reporting. If something is not verified, mark it NOT-RUN. A falsely green report is worse than a red one.
