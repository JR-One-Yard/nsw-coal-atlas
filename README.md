# Beneath the Coast — NSW Coal Atlas

A geology-led educational atlas connecting the NSW landscape, rock succession, underground coal and industry. Version 2 adds published Illawarra surface geology, a five-step geological field guide, linked cross-sections and a statewide mine inventory.

**Surface mapping is published geological interpretation. Underground coal geometry remains illustrative.** The sections intersect the actual 3D meshes, but this consistency does not validate their assumed depths, dips or footprints.

## Open and explore

Double-click `launch.command`, or run `python3 scripts/serve.py`. Use the local server rather than opening `dist/index.html` directly. All runtime libraries and data are bundled; source links require internet.

1. Choose **Explore Illawarra** to follow the five-step geology guide.
2. Use **Inspect surface** to read mapped formation, lithology, age and source feature ID.
3. Open **Rock sequence** to explore the simplified succession, younger to older. Row heights do not represent thickness or time.
4. Open **Cross-section** for four regional presets, coordinate endpoints or a line drawn on terrain. Select a seam in the section to select the same layer in 3D. Switch between true scale and vertical fit, inspect elevations, or export an attributed SVG.
5. Toggle **Mapped fault traces**, ground opacity and vertical exaggeration. **Separate coal layers** is a diagram aid; section elevations retain the unseparated model.
6. Switch underground colours between geological unit, coal use and evidence level. Thermal, metallurgical and unclassified filters remain independent.
7. Open **NSW mines** to search 35 downloaded coal registry records, filter region/product, inspect sources and export filtered CSV. Covered mines link back into the regional 3D scene.

The original five-chapter, 150-second coastal flythrough remains available, with play/pause, scrub, speed and optional browser speech. The new field guide is text-led. On mobile, use **Layers** to open controls; the section explanation can be expanded. Drag to orbit, pinch or scroll to zoom, and right-drag to pan.

Version 2.1 adds **Borehole evidence**: search 569 boreholes and inspect 4,955 preferred formation-top picks from Geoscience Australia's ABSUC 2024 v2. Logs retain measured depth (MD), AHD elevation, drilling reference and compiler flags. Selecting a surface unit now highlights its mapped exposures, and fault crossings in a section expose their original map descriptions.

In a section, enable **Reported coal tops within 1 km**. Diamonds represent nearby source picks projected onto the section; their offset and borehole are identified. Known horizontal/deviated holes are excluded, but the remaining records are not confirmed vertical. Model height references have not been reconciled to AHD. Open a diamond to inspect the underlying borehole. These are compiled interpretations, not independently checked core logs or validated surfaces.

## Coverage and evidence

| Content | Coverage | Evidence / limitation |
| --- | --- | --- |
| Surface geology | Illawarra: 150.55–151.12°E, 34.56–34.02°S; 2,004 source polygons | GSNSW NSW Seamless Geology, rasterized to 1,600 × 1,600 pixels for display and lookup. Boundaries are approximate at that resolution. |
| Surface faults | 1,884 source features, 3,774 displayed line segments inside the local extent | Published traces, draped 5 m above terrain for visibility. No subsurface fault dip or throw is reconstructed. |
| Local elevation | 257 × 257 samples, 66,049 vertices | Mapzen Terrarium z11 tile source. Sampling density is not a claim of survey accuracy. Replaces the coarser regional surface within its rectangle. |
| Regional terrain | Illawarra → Sydney → Lake Macquarie → Newcastle → Hunter | 193 × 289 samples; 150.45–152.05°E, 34.65–32.45°S. |
| Underground | Eight illustrative surfaces | Bulli, Balgownie, Wongawilli; buried Illawarra Coal Measures envelope; Wallarah, Great Northern, Fassifern; Hunter composite horizon. The last two envelopes are not individually mapped seams. |
| Drilling | 1,017 representative locations from 5,262 corridor records | Original recorded total-depth sticks; independent of the new ABSUC evidence and not used to fit seams. |
| Borehole stratigraphy | 569 boreholes; 4,955 preferred tops and 4,479 preferred bases, 5,105 unique records | ABSUC 2024 v2; GDA94 coordinates and original MD/AHD references. Tops/bases selected independently. Suspect bases are retained as flags, never used as accepted interval ends. |
| Industry inventory | All 35 COAL records in the downloaded statewide registry | A dated registry inventory, not an exhaustive live catalogue. Operator/group associations for 33; missing attributes remain explicit. |
| Regional mine scene | 15 registry mines plus historical Balmain, five destinations, 12 supply links | Source-linked point records and schematic connections. Statewide inventory entries outside the model remain in the 2D inventory. |

Production records for Moolarben, Mount Thorley Warkworth and Ulan are stored once per complex with reporting period and basis. Approved capacity is separately labelled and is not actual output. Operator/group associations do not automatically establish legal ownership. Region labels are editorial groupings, not official boundary polygons.

## Downloadable presentation

- `dist/downloads/NSW-Coal-Atlas.blend`: editable Blender scene, matching browser seam vertices, detailed mapped terrain with packed texture, source metadata, separate published fault-trace collection and compiled coal-top markers. The markers are initially hidden, not deviation-corrected and have no fitted connection to the seam sheets. Vertical exaggeration is baked at 12×. The fault collection is initially hidden and intended for viewport inspection; its edges are not renderable tubes.
- `dist/downloads/NSW-Coal-Flythrough.mp4`: version 2 silent recording of the complete interactive regional tour. The newer borehole tools are demonstrated in the live viewer, not this movie. This tour does not demonstrate every new field-guide tool.
- Cross-section **Export SVG**: portable figure with source attribution, model caveat and vertical scale.

Blender has five camera markers over frames 1–1800 at 12 fps. Its embedded **READ ME — atlas evidence and controls** explains collections and opacity. Both regional and local terrain opacity must be changed together; the regional material uses a mask to avoid duplicate surfaces. Seam ribbon thickness is for visibility only.

## Reproduce and verify

```sh
python3 scripts/acquire_geology.py
python3 scripts/build_industry.py
python3 scripts/acquire_boreholes.py
node scripts/compare_boreholes.mjs
npm test
# With a server on http://127.0.0.1:8765:
node scripts/verify_ui.mjs
node scripts/verify_geology.mjs
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python scripts/build_blender.py -- --render-stills
/Applications/Blender.app/Contents/MacOS/Blender --background blender/NSW-Coal-Atlas.blend --python-exit-code 1 --python scripts/verify_blender.py
node scripts/validate_static.mjs
```

Python acquisition needs Pillow; Blender builds need Blender. Browser scripts currently use this Mac's Codex-bundled Playwright and installed Chrome paths; adapt those two paths on another machine. Copy a rebuilt Blender scene from `blender/` to `dist/downloads/` before delivery.

`acquire_geology.py` retrieves paginated WFS features and caches original responses before rasterization. Download URLs and hashes are in `evidence/geology-downloads.json`. It reuses cached downloads; review and preserve old evidence before refreshing a snapshot. `build_industry.py` records curated operator evidence separately from source registry attributes. `acquire.py` and `build_data.py` rebuild the original regional terrain and conceptual model.

Core files: `dist/geology-model.js` contains mesh intersection and terrain sampling; `dist/geology.js` supplies the mapped view, section and field guide; `dist/industry.js` supplies the statewide inventory. `dist/data/atlas.json` retains the original seam geometry and provenance.

## Next geological work

The next substantial improvement is a **validated local underground section**. Published compiled picks are now acquired, but need checking against original logs, deviation surveys, surveyed contacts and structural constraints, with coordinate/height datums reconciled. Preserve observations separately from interpolated surfaces and test against withheld observations. Then expand detailed surface mapping and geology-led stories to Newcastle/Lake Macquarie and Hunter. The current upper-unit column establishes order; it does not reconstruct their subsurface boundaries.

`acquire_boreholes.py` downloads and filters a ~744 MB national archive into a 1.8 MB regional subset. The archive remains in the ignored cache. `compare_boreholes.mjs` records 416 provisional comparisons without changing any geometry; these are not validated model errors.

See `HANDOVER.md` for remaining work, verification and delivery status.

## Attribution

GSNSW NSW Seamless Geology and mine records: CC BY 4.0, Geological Survey of New South Wales. Terrain: Mapzen / Tilezen terrain tiles on AWS, including SRTM and other underlying sources; https://www.mapzen.com/rights/. Stratigraphic context: Australian Government Bioregional Assessments, linked in the viewer. ABSUC: Vizy and Rollet (2024), Geoscience Australia, https://doi.org/10.26186/149324, CC BY 4.0; regional underlying sources GSNSW_2021 and GA_NDP_31_10_2022, CC BY 4.0. Three.js: MIT, licence in `dist/vendor/THREE-LICENSE.txt`. Operator material is summarized and linked to its source.

## Terrain correction — 12 September 2026

The isolated Yarra Bay peak (826 m) and a Hawkesbury water-area pit (−1,284 m) were replaced with zero-valued samples checked against Geoscience Australia’s DEM service. `dist/data/terrain-corrections.json` preserves coordinates, original values, responses and attribution. Zero represents the DEM water surface, not measured seabed depth. `scripts/terrain_quality.py` applies this reviewed ledger during acquisition and rejects new isolated extremes for review. It does not smooth the terrain.

Run `python3 scripts/test_terrain.py` and `node scripts/verify_terrain.mjs` for the targeted regression checks. The Blender scene and regional movie were regenerated after correction. The complete current verification set contains 96 checks.
