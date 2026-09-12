# UI simplification handover

12 September 2026

## 1. Completed

The atlas opens directly on the map with seven interactive controls: Map, Mines, About, region, Layers, Cross-section and Region notes. No modal, sidebar, dashboard or tutorial opens automatically.

Map, Mines and About are the three main destinations. The region picker replaces the chapter navigation. Layers and geological details share one panel area, and opening one closes the other. On phones, background map controls cannot take keyboard focus through an open panel. Close buttons remain visible while scrolling; Escape closes the current map panel or section.

The mines page starts with its searchable list. Selecting a mine shows its sourced profile. Back to list preserves the search, and the main Mines navigation always returns to the list. Production, approved capacity, ownership, geology and destination information remain in the profiles. The filtered CSV export remains available.

Surface mapping, rock sequence, fault traces, borehole logs, cross-section presets, custom coordinates, nearby coal-top observations and attributed SVG export remain available. More specialised section controls are under Section options. The map caption retains the essential warning that the underground surfaces are illustrative.

Visible navigation and explanatory copy were reviewed manually using the de-slopify skill. Scientific datasets and source citations were preserved. The region summaries now describe the geology directly and no longer refer to removed controls.

Removed from the viewer:

- The commercial dashboard, comparison shortlist and revenue calculator. These required a second application’s worth of navigation before reaching a mine.
- The five-step lesson overlay, floating chapter card, persistent tour player and narration controls. The region notes and downloadable recording retain the useful content.
- The permanent left and right sidebars, duplicate feature list and focus-view button. The map now has room without a special mode.
- The cutaway and layer-separation sliders, alternate colour modes, coal-use checkbox group and raw drill-stick overlay. The retained layer selector, sourced borehole logs and cross-sections provide clearer ways to inspect the geology.
- The mines coordinate scatterplot and empty profile placeholder. The list leads directly to the requested record.

Two functional problems were fixed during verification: borehole profiles now recover after a no-results search, and mine navigation no longer reopens a stale profile over the list on phones. Map rendering also pauses while Mines or About is open.

## 2. Workarounds and assumptions

The Sites connector returned `Sites project not found` for the project ID saved in `.openai/hosting.json`. A search for the existing `nsw-coal` site returned no results in the selected workspace. The original project identity and access were preserved. No replacement public site was created. The complete result is delivered locally and in `NSW-Coal-Atlas-v3.zip`; the hosted site has not been updated. See `evidence/ui-hosting-status.json`.

The local preview uses port 8766 because 8765 was occupied but did not respond to the readiness check. The supplied launcher already chooses another available port when its preferred port is busy.

The existing Blender scene and recorded MP4 remain available unchanged. The movie demonstrates the previous interface; it is not evidence of the new UI. The new screenshots and browser report provide that evidence. No production mocks, placeholder records or invented geology were introduced.

The scope decision was to prioritise finding and understanding geology and mine records. Commercial analysis interfaces were removed under the instruction to prune ruthlessly. Their previous implementation remains recoverable from Git history; the commercial source data and model checks remain in the project.

## 3. What still needs a decision

No UI decision is required to use the completed local viewer.

To update the original hosted URL, restore access to its original Sites workspace/project. The current connection cannot publish to it. The completed source can then be deployed with the existing audience unchanged.

## 4. Evidence

The final verification set contains 52 passing data/model checks and 16 passing browser journeys, plus static asset validation. Browser verification reported no JavaScript exceptions or failed asset responses.

The browser journeys cover all five regions and Whole basin, layer controls and reset, feature selection and automatic connections, mapped rock inspection, rock sequence, all section presets, coordinate validation, reported coal tops, attributed SVG export, borehole source references, no-results recovery, all 35 mine records, intersecting filters, CSV export, mine-to-map navigation, downloads and About. Responsive checks cover 1440 × 960, 390 × 844, 320 × 568, 844 × 390 and 720 × 480. These checks do not constitute physical-device or screen-reader certification.

- [Browser results](../evidence/simple-browser-tests.json)
- [Desktop map](../evidence/simple-desktop.png)
- [Desktop mines](../evidence/simple-mines.png)
- [Phone map](../evidence/simple-mobile.png)
- [Phone layers](../evidence/simple-mobile-layers.png)
- [Phone cross-section](../evidence/simple-mobile-section.png)
- [Phone mines](../evidence/simple-mobile-mines.png)
- [Phone borehole log](../evidence/simple-mobile-borehole.png)
- [Static asset hashes](../evidence/artifact-manifest.json)

Run `npm test` for the data/model checks. Run `ATLAS_URL=http://127.0.0.1:8765/ npm run verify:browser` against the server address printed by the launcher; substitute its port if different. `node scripts/validate_static.mjs` checks the static entrypoint, local links, asset sizes and downloadable Blender scene and writes the asset manifest.

The geometry, downloaded evidence and terrain corrections remain scientifically unchanged. Underground surfaces are still illustrative; the UI work does not validate their depths or footprints.

## Follow-up: connections and profile copy

Connections are displayed with mine markers by default and survive Reset map. The Show connections button has been removed. Missing profile fields use “No data”. Repetitive explanations and stale filter references were removed from the mine descriptions; numerical observations and sources were preserved.
