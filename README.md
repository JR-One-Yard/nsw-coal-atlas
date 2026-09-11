# Beneath the Coast — NSW Coal Atlas

An interactive journey from **Illawarra → Sydney → Lake Macquarie → Newcastle → Hunter Valley**, with an editable Blender scene and a complete guided camera tour.

**This is an educational reconstruction.** Terrain is sampled elevation data, mine points come from GSNSW, and coal-use classifications cite operator/government sources. All subsurface sheets have conceptual geometry. They are not surveyed seam surfaces, resource estimates, or mine plans.

## Open it

- **Interactive viewer:** double-click `launch.command` on this Mac. Keep its terminal window open. Alternatively run `python3 scripts/serve.py` in this directory.
- **Blender:** open `blender/NSW-Coal-Atlas.blend` (also in `dist/downloads/`). Blender 5.2.1 LTS is installed in `/Applications/Blender.app`.
- **Recorded walkthrough:** `dist/downloads/NSW-Coal-Flythrough.mp4` is a recording of the actual browser tour, without audio. Optional spoken narration is available in the interactive viewer where the browser provides speech synthesis.
- **Evidence and workarounds:** `HANDOVER.md` and `evidence/`.

All runtime JavaScript and datasets are bundled. The local viewer needs no API keys, account, map subscription or internet connection after download. Source links naturally require internet. Do not double-click `dist/index.html`: browsers restrict data loading from `file://`; use the launcher.

## Explore

- Drag to orbit, scroll to zoom, right-drag to pan. On touch screens use the normal orbit/pinch controls.
- **Start flythrough** plays a 150-second guided journey. Pause, scrub, or jump to any chapter. Space toggles play/pause when a form control is not focused.
- **Thermal / Metallurgical / Unclassified** are independent switches. Mixed producers appear under either applicable use. Switch all off to show the empty state.
- **Ground opacity** reveals the subsurface. **Vertical scale** exaggerates elevation and depth together. **East–west cutaway** clips the terrain and geological sheets from the east.
- Select a seam, mine or destination using the scene, the feature list, or **Jump to a feature**. Read the associated source evidence and documented coal products.
- Enable **Coal journeys** for schematic source-to-destination links, or **Recorded coal boreholes** for thinned exploration locations and total drilled depths.
- On mobile, open **Layers** for controls and close the feature panel to return to the map.
- **Sources & assumptions** explains the limitations and provides downloads, including the Blender file.

## Coverage

The model window is 150.45–152.05°E, 34.65–32.45°S. It includes the requested coastal journey and an inland Hunter extension, not the entirety of NSW. The mine inventory includes all 15 coal point records returned by the GSNSW operating-mine layer within this window, plus historical Balmain. This does not mean every historical or current mine in the region is represented by the registry.

Eight geological layers: Bulli, Balgownie, Wongawilli; a buried Illawarra Coal Measures envelope under Sydney; Wallarah, Great Northern, Fassifern; and a composite Hunter coal-bearing horizon. Sydney and Hunter envelopes are not named individual seams.

There are 16 mine records, five destination facilities, 12 schematic supply links, and 1,017 displayed boreholes spatially thinned from 5,262 corridor records. Thinning keeps one representative record in each ~0.02° cell (deepest available total-depth record). Raw selected source records are retained in `cache/` locally and reproducibly downloadable.

## Blender

The scene contains 62 objects, the shared mesh geometry, 12× vertical exaggeration, chapter labels, source notes and a 1–1800 frame camera animation at 12 fps. Frame 1 starts in Illawarra; markers identify the five stops.

The Outliner collections separate met, thermal, mixed-use and unclassified layers. When manually filtering in Blender, include **Mixed-use horizons** under either met or thermal. The browser provides the automatic filter logic.

The ground material uses alpha 0.28; change the Terrain material's Principled BSDF alpha for opacity. The narrow Solidify ribbon on seam meshes is purely for visibility, not real coal thickness. **READ ME — atlas evidence and controls** is embedded in Blender's text data.

Rebuild from the shared JSON:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/build_blender.py -- --render-stills
```

`--render-animation` additionally renders the full offline animation as PNG frames. The included MP4 is the actual interactive tour recording, not this costly offline Cycles render.

## Data and reproducibility

- `dist/data/atlas.json`: model meshes, feature records, coal-use tags and source notes.
- `dist/data/terrain.json`: regional elevation samples.
- `dist/data/nsw-operating-mines.geojson`: GSNSW downloaded point layer.
- `scripts/acquire.py`: fetches public datasets and pinned Three.js 0.180.0; requires Python and Pillow. Stores download hashes.
- `scripts/build_data.py`: deterministic conceptual model and curated source associations. No hidden fitting or machine-generated geological claims.
- `scripts/build_blender.py`: builds Blender from the same mesh arrays.
- `dist/model.js`: shared filter rules used by the browser and model tests.

To refresh the raw download snapshot, preserve the existing `cache/` and outputs for audit before removing only the cached datasets you intend to refresh. The acquisition script deliberately reuses existing downloads. A refresh alone does not validate changing mine status or coal products; review operator evidence too.

The browser has optional WebMCP feature detection. Native WebMCP was unavailable in the verification browser; this does not affect normal controls. No external AI service is used.

## Verify

```sh
node scripts/test.mjs
```

Browser verification uses Playwright and the installed Google Chrome. The verification scripts currently reference the bundled Codex Playwright runtime on this Mac; on another machine, replace that module path with a local Playwright installation. Run a local server on port 8765 before `node scripts/verify_ui.mjs`.

## Attribution

GSNSW downloadable data: **CC BY 4.0**, Geological Survey of New South Wales. Terrain: **Mapzen / Tilezen terrain tiles on AWS**, including underlying SRTM and other elevation sources; full attribution at https://www.mapzen.com/rights/. Three.js: MIT, license bundled in `dist/vendor/THREE-LICENSE.txt`. Operator/government prose is summarised and linked in the atlas. All reconstructions and schematic connections are explicitly identified.
