# NSW Coal Atlas

An interactive map of coal geology and mines from Illawarra to the Hunter Valley.

The viewer opens on the map. Choose a region, select a layer or mine, or open a cross-section. Published surface mapping and borehole evidence are retained alongside the illustrative underground model.

## Open the atlas

Double-click `launch.command`, or run `python3 scripts/serve.py`. Keep the server window open while using the atlas. All runtime data and libraries are bundled; external source links need an internet connection.

The local version has the simplified interface. The previous private hosted version has **not** been updated: the Sites connector cannot find the saved project in the currently selected workspace.

## Navigation

- **Map:** choose one of five regions or Whole basin. Drag to rotate, scroll or pinch to zoom, and right-drag to pan.
- **Layers:** change ground opacity, coal layer, surface geology, fault traces, mine markers, place names and vertical scale. Find a feature by name, open the rock sequence or search borehole logs here.
- **Cross-section:** choose a transect, select a seam, switch to true scale or download the figure. Section options contains coordinates, reported coal tops and fault-crossing evidence.
- **Region notes:** read the geological context for the selected region.
- **Mines:** search the 35-record registry inventory, filter it, open a sourced profile or download the filtered list. On phones, Back to list returns to the same search.
- **About:** read source coverage and assumptions, or download the model, borehole picks, Blender scene and recorded tour.

Details appear only after a selection. A single side panel is shown at a time. Close it with × or Escape; Map returns from Mines or About.

## What was removed

The viewer no longer includes the commercial dashboard, comparison shortlist, revenue calculator, five-step lesson overlay, permanent tour player, narration toggle, floating story card, duplicate feature list, focus-mode switch, coal-use filter group, layer-separation slider, cutaway slider, colour-mode selector or raw drill-stick overlay. The recorded tour and all source datasets remain downloadable. Mine profiles retain operator, ownership, production, capacity, geology and destination information.

The previous UI is preserved in Git history. Historical browser scripts that target its controls are in `scripts/legacy/`; the active verification command tests the simplified viewer.

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

## Verification

```sh
npm test
# Start the local server, then in a second terminal:
ATLAS_URL=http://127.0.0.1:8765/ npm run verify:browser
node scripts/validate_static.mjs
```

`npm test` checks the model, geology, borehole observations, terrain corrections and retained commercial data calculations. The browser test exercises the actual viewer on desktop, phone, small-screen and landscape layouts, including downloads and empty results. Browser verification uses the Codex-bundled Playwright and installed Chrome paths on this Mac.

The active UI is authored in `dist/index.html`, `dist/app.js`, `dist/navigation.js`, `dist/style.css`, `dist/atlas-v2.css`, `dist/geology.js`, `dist/boreholes.js` and `dist/industry.js`. The data and scientific model modules are separate from these views.

The 12 September terrain correction is preserved: reviewed water-surface samples replace the isolated Yarra Bay peak and Hawkesbury pit. `dist/data/terrain-corrections.json` records the original values, replacement values and sources. The underground geometry has not been recalibrated.

## Attribution

GSNSW NSW Seamless Geology and mine records: CC BY 4.0, Geological Survey of New South Wales. Terrain: Mapzen / Tilezen terrain tiles on AWS, including SRTM and other underlying sources; https://www.mapzen.com/rights/. Stratigraphic context: Australian Government Bioregional Assessments, linked in the viewer. ABSUC: Vizy and Rollet (2024), Geoscience Australia, https://doi.org/10.26186/149324, CC BY 4.0; regional underlying sources GSNSW_2021 and GA_NDP_31_10_2022, CC BY 4.0. Three.js: MIT, licence in `dist/vendor/THREE-LICENSE.txt`. Operator material is summarized and linked to its source.


See `docs/UI-HANDOVER.md` for the simplification decisions, workarounds and evidence.
