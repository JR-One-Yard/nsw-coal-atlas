# NSW Coal Atlas — handover

Completed 11 September 2026. This is a working educational atlas with documented reconstructions, an editable Blender scene and a recorded flythrough. The geographical scope is Illawarra, Sydney, Lake Macquarie, Newcastle and an inland Hunter Valley extension.

## 1. What is completed

- Blender 5.2.1 LTS is installed in `/Applications/Blender.app`.
- Interactive 3D viewer with a 150-second guided tour, five chapter stops, camera orbit/pan/zoom, pause/scrub/speed controls and optional browser narration.
- Eight underground layers; independent thermal, metallurgical and unclassified filters; mixed-product producers included under either relevant filter.
- Terrain opacity, vertical exaggeration and an east–west cutaway to explore the underground geometry.
- Sixteen mine records, five destination facilities, twelve schematic supply links, and selectable source explanations. These cover steelmaking, power stations and exports.
- Published terrain samples and GSNSW mine and drilling records. The borehole display contains 1,017 representative records from 5,262 corridor records.
- Editable Blender scene using the same seam meshes as the browser, 62 objects, separate coal-use collections, source notes and a complete camera animation.
- MP4 recording of the actual full browser tour, five Blender renders, desktop and mobile screenshots, reproducible acquisition/build scripts, and verification reports.
- Bundled local viewer with no runtime CDN, paid service or API key. Double-click `launch.command`, or run `python3 scripts/serve.py`.

The private viewer address is provided with this handover once hosting reports successful publication. Both the Blender scene and MP4 are also downloadable inside the viewer's **Sources & assumptions** panel.

## 2. Workarounds and why

| Issue | What was done and its limit |
| --- | --- |
| No continuous, verified individual-seam 3D model obtained | Built explicitly labelled conceptual sheets from published seam order and local depth references. Smooth dips, footprints and intervening geometry are assumptions. The NSW download catalogue was accessible via HTTP; its listed statewide cover/fault models do not supply the needed continuous seam geometry. No coal intercepts were inferred from total drillhole depths. |
| Sparse information beneath Sydney and the Hunter | Used formation/composite envelopes, explicitly distinguished from named individual seams. The historical 880 m Birchgrove shaft is a local reference, not a universal coal depth. The Central Coast gap is left without fabricated continuity. |
| Regional scale makes coal thickness almost invisible | Coloured sheets and adjustable vertical exaggeration make the geology legible. Blender's narrow ribbon thickness is for visibility only. No real seam volumes, resources or workings can be calculated from it. |
| Transport networks were not surveyed | Linked documented mine–destination relationships with schematic curves. Moving dots indicate direction only. The Mount Thorley–Newcastle connection is explicitly a regional illustration. No shipment, rail alignment or tonnage is claimed. |
| GSNSW server-side borehole bounding-box query returned zero records | Downloaded the restricted-property statewide records, then clipped locally. Retained the raw cache and acquisition code. Spatial thinning keeps the deepest available total-depth record per approximately 0.02-degree cell. |
| Registry and operator status can differ | Preserved source provenance and caveats. In particular, the United Wambo point name says “proposal”; operator evidence documents operation. The registry snapshot is not a live status guarantee or exhaustive historical inventory. |
| Native WebMCP unavailable in verification Chrome | Kept feature detection and normal browser controls. Native registration is not verified; it is optional and not required to use the atlas. |
| Headless Blender failed inside the execution sandbox | Ran the installed Blender outside that sandbox with the authorized local execution permission. The resulting scene reopened, its geometry matched, and all chapter stills rendered. |
| Full offline Cycles movie would be a separate render | Included a complete recording of the working interactive tour and an editable Blender animation. The MP4 is silent; optional live speech depends on browser voices. Five actual Blender stills demonstrate the native render. |

No faults, mined-out volumes, precise longwall layouts, reserve quantities, coal assays or site-specific safety claims have been invented. The atlas is not suitable for planning excavation or estimating underground resources.

## 3. What still needs your decision

**Nothing is required to use the delivered atlas.** The significant future choice is whether you want to obtain authoritative seam surfaces or borehole coal-intercept logs and engage geological validation. That is necessary before turning this educational reconstruction into a geological decision tool. There is no pending purchase, account setup or access request.

Optional next choices are a longer narrated film, additional NSW coalfields, or detailed mine workings. These require new scope and, for detailed workings, suitable source data.

## 4. Evidence that it works

| Verification | Result | Evidence |
| --- | --- | --- |
| Model and data checks | 16 passed: product filtering, mixed producers, empty state, links, provenance, finite geometry, northward projection and stratigraphic order | `evidence/model-tests.json` |
| Real browser checks | 15 passed: WebGL scene, rendered filter changes, source/feature interactions, opacity, clipping, boreholes, tour playback/scrubbing, mobile layout and controls | `evidence/browser-tests.json` |
| Blender checks | 15 passed: saved scene reopens; all eight meshes match browser vertices; 16 mines and five destinations exist; sources, five markers and 150-second timeline exist | `evidence/blender-tests.json` |
| End-to-end tour | Reached the final Hunter chapter at 100%, with no recorded browser errors | `evidence/tour-recording.json` |
| Watchable output | H.264 MP4, 1280 × 800, 154.48 seconds (includes setup), 3,862 frames, silent | `dist/downloads/NSW-Coal-Flythrough.mp4` |
| Visual evidence | Five desktop chapter screenshots, mobile screenshot and five rendered Blender chapter images | `evidence/*.png` |
| Artifact integrity | File sizes, source download hashes and final static-asset SHA-256 hashes retained | `evidence/downloads.json`, `evidence/artifact-manifest.json` |

There were no browser console errors or failed asset responses in the browser verification. These checks establish software behavior and agreement between the two displays; they do not validate the assumed geology.

## Files to start with

- `launch.command` — local interactive viewer.
- `dist/downloads/NSW-Coal-Atlas.blend` — editable Blender scene; identical to `blender/NSW-Coal-Atlas.blend`.
- `dist/downloads/NSW-Coal-Flythrough.mp4` — complete tour recording.
- `README.md` — controls, coverage, data attribution and rebuilding.
- `dist/data/atlas.json` — features, meshes and source provenance.

Primary source context is linked within every relevant feature. The public 3D catalogue reviewed is https://www.resources.nsw.gov.au/geological-survey/products-and-data/3d-geological-mapping-data. Its broader cover models do not remove the seam-level limitations described above.
