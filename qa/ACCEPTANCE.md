# Final acceptance report

34 PASS, 2 FAIL, 0 NOT-RUN. This is not full compliance with DOC 00–07. The automated suite has 42 passing assertions; detailed visual criteria are assessed separately.

| ID     | Status | Evidence                                                                                |
| ------ | ------ | --------------------------------------------------------------------------------------- |
| AC-001 | PASS   | npm ci installed 131 packages; package.json uses exact versions.                        |
| AC-002 | PASS   | npm ls three shows one deduplicated three@0.187.0.                                      |
| AC-003 | PASS   | npm run typecheck: 0 errors.                                                            |
| AC-004 | PASS   | npm run lint: 0 errors and 0 warnings.                                                  |
| AC-005 | PASS   | npm run build succeeds; total JS gzip is 327,998 bytes.                                 |
| AC-006 | PASS   | Preview full scroll and return: 0 console errors or warnings in report.json.            |
| AC-007 | PASS   | Request listener recorded 0 external requests in report.json.                           |
| AC-010 | PASS   | Observed 000 and 100, wordmark and status; loader duration exceeds 2.2 s.               |
| AC-011 | PASS   | Inspected p0 and p0.08 desktop images: terrain, glint, clouds and lit limb.             |
| AC-012 | FAIL   | Night city points are visible; sunset band is weak and cloud shadows approximate.       |
| AC-013 | PASS   | Inspected p0.34/p0.43/p0.52 and high-rings.png; gaps, lit particles and shadow.         |
| AC-014 | PASS   | Inspected p0.64; 12 gates; conservative clearance is 1.6519 units after motion reserve. |
| AC-015 | PASS   | Inspected p0.78: three-color volume, embedded glows and sparks.                         |
| AC-016 | PASS   | Inspected p1 and core-click.png; click and tap each trigger one shockwave.              |
| AC-017 | PASS   | continuity-report.json: 201 samples, 41 reviewed frames, 0 browser issues.              |
| AC-020 | PASS   | npm run qa:geometry passes all minimums in geometry-report.json.                        |
| AC-021 | PASS   | Final desktop/mobile sheets and high-rings.png show smooth organic geometry.            |
| AC-030 | PASS   | report.json verifies all seven keyboard navigation keys.                                |
| AC-031 | PASS   | Pointer test passes; CameraRig uses reviewed exponential dt damping.                    |
| AC-032 | PASS   | Desktop cursor test passes; touch cursor display is none.                               |
| AC-033 | PASS   | Reduced motion test confirms parallax disabled and shockwave count remains zero.        |
| AC-034 | PASS   | Audio starts off; toggle and preference persistence pass without autoplay.              |
| AC-035 | PASS   | Begin again and actual 40-second Replay pass.                                           |
| AC-040 | PASS   | 11 samples per tier: medium max 49 calls/2,594,774 triangles; high 46/4,418,811.        |
| AC-041 | PASS   | Update paths reviewed: vectors, matrices, colors and arrays are preallocated.           |
| AC-042 | PASS   | Forced slow frames produce exactly one medium-to-low step without reload.               |
| AC-043 | PASS   | Five complete loops retain 43 geometries and 41 textures.                               |
| AC-050 | PASS   | Six labelled sections, skip link, nav, live region, 44px targets and focus ring pass.   |
| AC-051 | FAIL   | contrast-report.json: 27 of 42 conservative text rectangles fall below 4.5:1.           |
| AC-060 | PASS   | Forced fallback and unavailable WebGL2 tests pass; fallback.png inspected.              |
| AC-061 | PASS   | Actual context loss shows overlay; restoration reloads successfully.                    |
| AC-062 | PASS   | Rotation to 844×390 preserves canvas aspect without overflow.                           |
| AC-063 | PASS   | All eleven 390×844 captures inspected; touch, CTA and layout checks pass.               |
| AC-070 | PASS   | README covers commands, controls, quality tiers, debug flags and architecture.          |
| AC-071 | PASS   | PLAN, ASSUMPTIONS and DEVIATIONS exist and describe actual implementation.              |
| AC-072 | PASS   | Forbidden-term source scan returned zero matches.                                       |

## Measured render budgets

Intel UHD Graphics 730, 1440×900, high tier after settling six seconds per chapter. These observations are not a certified benchmark.

| Chapter    | Calls | Triangles |  FPS |
| ---------- | ----: | --------: | ---: |
| Arrival    |    25 |   417,489 | 12.0 |
| Atmosphere |    25 |   417,489 |  9.1 |
| Rings      |    27 | 2,194,257 | 33.0 |
| Debris     |    45 | 4,418,811 | 11.4 |
| Nebula     |    26 |     1,491 |  9.1 |
| Core       |    38 |   331,232 |  9.4 |

JavaScript gzip: 327,998 bytes (320.31 KiB), including the worker and optional debug chunk. Bundled fonts total 84,820 bytes. See bundle.json and supplemental-report.json.

## Failed criteria and attempted fixes

AC-012: the screenshots show night city points and cloud darkening, but the sunset band is weak and the cloud-shadow lookup does not track independently rotating clouds exactly. Added a lit limb, warm scattering term, localized lightning, changed framing and analytic ring shadow. The complete requested terminator appearance remains unmet.

AC-051: broader 55% radial scrims, opaque body copy, camera composition and a dimmer nebula improved readability. Conservative brightest-pixel tests over whole text rectangles still fall below 4.5:1 in 27 of 42 regions. Regions include whitespace and decorative rules, so these are bounds rather than glyph-only contrast measurements. The all-background guarantee is unmet.

## Verification history

Initial full software QA: 22 captures, 41 checks PASS, one pointer FAIL. Two software reruns were interrupted and retained. Final hardware QA: 22 captures, 42 checks PASS, zero console errors/warnings, zero page errors and zero external requests. Supplemental medium/high budget checks pass. An additional 201-position continuity check has no browser issues; 41 captured frames were reviewed.

## Known limits

See ../DEVIATIONS.md for exact shader approximations and omitted details. High tier measured 9–33 FPS on this integrated GPU. Desktop discrete GPU and physical phone targets were not tested. Boot work is not uniformly limited to 8 ms; emulated mobile recorded post-loader long tasks. No indefinite soak or physical-phone five-minute test was performed.
