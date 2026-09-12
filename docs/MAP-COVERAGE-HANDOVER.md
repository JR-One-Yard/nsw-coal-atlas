# Borehole quality and complete mine landscapes — plan and handover

Prepared 13 September 2026, Australia/Sydney.

## Export checkpoint — 13 September 2026

Continued from e4efc02. Usage began at 6% remaining; the next poll returned 2%, triggering a bounded commit.

- Downloadable `atlas.json` now includes all 35 registry mines plus historical Birchgrove, with terrain-sampled positions and resolvable source references.
- Browser and export use the same `dist/mine-inventory.js` merger. `npm run build:data` builds the corridor base, rebuilds industry evidence, then expands the export. Use this instead of calling `build_data.py` alone, which still intentionally builds the base inventory.
- Updated filter expectations and added checks for every exported registry coordinate, elevation and source. `npm test` and static validation pass. Browser journeys were not rerun for this increment.
- Removed stale region copy claiming Western and Gunnedah mines lie beyond the terrain.
- Blender source now receives the complete inventory through atlas.json, but the Blender file, movie and ZIP still require rebuilding. Finer DEMs and defensible deposit models remain outstanding. Hosted site unchanged.

## Implementation checkpoint — 13 September 2026

This checkpoint supersedes the original investigation below. Work continued locally under a user instruction to commit at 5% remaining in the five-hour usage window.

Implemented and verified:
- GSNSW quality decisions precede thinning; DDH083 remains in atlas data with raw depth 9999 and an inspectable withholding reason. A fresh full WFS response repeats the value but supplies no report, comments or deviation information. It is preserved in `dist/data/borehole-quality.json`; placeholder semantics remain unconfirmed.
- Registry depth traces are clickable. Browser and Blender source builders withhold suspect depths. ABSUC names, comments and parent-well associations withhold 136 directional/branched vertical traces, leaving 431 schematic MD traces and two missing-depth collars. All 569 logs remain available. The full ABSUC decision inventory is `evidence/absuc-depth-quality.json`.
- `scripts/expand_terrain.py` produces `terrain-wide.json`: [149.65, -34.65, 152.05, -30.25], 289 × 577 samples from 40 public Terrarium z9 tiles. All 55,777 reviewed corridor samples are retained exactly. Original terrain and its correction ledger remain intact, as does the Illawarra detail tile. No new isolated >500 m extremes were detected. The extension is regional resolution, not a survey of current mine pits; mixed source vertical references are not verified AHD.
- All 35 registry mines have finite positive sampled land elevations. Missing terrain now stops map initialization instead of silently placing a new marker at zero. Scene clicks frame mines automatically.
- Every mine now has a geological coverage entry and sourced context directly in map and full profiles. Twelve records have additional historical site geology descriptions, prioritising Western, Gunnedah and uncovered Hunter mines. Mangoola includes a relative stratigraphic sequence; other unit lists do not imply measured depth or order. The register records the specific evidence gaps in `dist/data/mine-geology.json`.
- `npm test`, all 19 browser journeys, three location checks and static asset validation pass. New regressions cover pre-thinning selection, raw suspect preservation, deep valid wells, directional parent families, all-mine terrain and exact preservation of the old grid. Desktop and phone screenshots were visually reviewed; the formerly disconnected mine groups now sit on continuous terrain.

Remaining work (not claimed complete):
- Fine DEM tiles around the other mines and fuller CRS/datum/coast/seam audits; current extension uses one aligned regional grid plus existing Illawarra detail.
- Original drilling report validation for DDH083; full raw drilling trajectory metadata and surveyed trajectories, beyond current names/comments and parent-well screening.
- More mine-specific geological sections, especially records still marked regional context; discover downloadable government models and reuse permissions, and review operator/approval documents before any defensible 3D reconstruction. No new 3D deposit surfaces, faults or workings were invented.
- Atlas JSON still stores the original 16-mine corridor inventory; the browser merges the 35-record industry inventory. Blender code now reads expanded terrain and applies depth quality, but its scene/download, movie and ZIP have **not** been rebuilt. The About page identifies the Blender export as predating these corrections. Hosted site not published.

Rebuild: `python3 scripts/acquire.py` (source downloads + aligned terrain extension), `python3 scripts/build_data.py`, `python3 scripts/audit_bores.py`, `python3 scripts/build_deposits.py`, then `npm test`. The raw source cache remains local/ignored; the DDH083 response has a tracked fallback in its ledger. Keep `terrain.json` as the reviewed corridor, not the runtime regional terrain. Acquisition receipts and SHA-256 hashes are in `evidence/terrain-extension-downloads.json`.

---

## Original handover — start here

The next increment should correct misleading borehole depths, supply terrain beneath all 35 registry mines, and then build sourced deposit views coalfield by coalfield. This document supersedes earlier statements that the map coverage work is complete. Rendering all mine markers was completed; complete landscapes and deposit coverage were not.

The latest user request was to document this plan and prepare a handover. No corrective implementation, new terrain acquisition, deposit reconstruction, publication or new agent task was performed during this handover. The earlier investigation identified the problems below but did not fix them.

Repository: `/Users/jamesroberts/Documents/NSW Coal Atlas/nsw-coal-atlas`.
Branch at handover: `main`; HEAD `b316240` (Show connections by default and shorten missing-data copy). Substantial source, test and evidence changes from this session remain uncommitted. Preserve this working tree: a fresh checkout of HEAD will omit the map and borehole changes described here. Inspect `git status --short` before proceeding. Do not reset or overwrite existing work.

## User intent and presentation requirements

- Retain elegant, thin, semi-transparent lines extending down from the ground to communicate borehole depth. The user explicitly rejected replacing them with prominent surface dots.
- Present the best map on initial load. Do not require users to select layers or configure a view to obtain the intended experience. Reset should restore that presentation.
- Include all 35 registry mines, with terrain and useful views of the underlying deposit, rather than markers floating outside a small terrain rectangle.
- Add meaningful, sourced detail to individual mines. Do not invent missing ownership, production, seam geometry or mine workings.
- The screenshots expose real shortcomings even though software tests passed. Visual and geological review must accompany automated checks.

## Confirmed findings

### Extreme depth line

The strongest match for the extreme southern line is registry record `COAL_004298`, hole `DDH083`, program `Appin`, at 150.6948°E, 34.2251°S. It is north-west of Wollongong, not a confirmed Wollongong city borehole.

The preserved raw feature in `cache/coal-bores-all.geojson` is:

```json
{
  "id": "drilling_drillholes_coal.COAL_004298",
  "coordinates": [150.6948, -34.2251],
  "program": "Appin",
  "hole_name": "DDH083",
  "gsnsw_drill_id": "COAL_004298",
  "end_depth": 9999,
  "year_drilled": null
}
```

`dist/data/atlas.json` carries this through as `depth: 9999`. The next deepest record in the original 1,017 displayed drilling records is 1,200 m. At the default 12× scale the anomalous line spans approximately 120 model kilometres vertically.

**Interpretation, not confirmed source semantics:** 9,999 looks like a missing-value placeholder or erroneous entry. No original drilling report or authoritative definition confirming that interpretation has yet been obtained. Do not replace it with a guessed depth or claim it is a verified 10 km hole.

`scripts/build_data.py` spatially thins drilling records by choosing the greatest `end_depth` in each roughly 0.02° cell. This preferentially selects the bad value. `dist/app.js` then renders every finite positive depth without a quality gate. `scripts/build_blender.py` also uses positive depths directly. Fix the ingestion/selection and rendering paths, not only this one screenshot.

### Measured depth is not vertical depth

The restored ABSUC lines use total measured depth as a straight vertical length. Some records describe directional or branched wells; some lack deviation metadata. Long drilled distance does not establish equivalent vertical penetration. Examples among the deepest include Kay Park 6 / Bulli legs and Spring Farm 7 / sidetracks at approximately 3,044 and 3,042 m MD. These values alone do not prove data errors.

The ABSUC dataset also contains deeper records such as Dural South 1 (3,059 m) and East Maitland 1 (3,049 m). Do not apply an arbitrary 1,200 m cap to all datasets. Existing section-pick filtering in `dist/borehole-model.js` excludes known deviated holes, but does not establish verified vertical trajectories for the map lines.

### Terrain and deposit coverage

The regional terrain bounds are `[150.45, -34.65, 152.05, -32.45]` (west, south, east, north). Mine coordinates span approximately 149.7469–151.5674°E and 34.4315–30.517°S.

**20 of the 35 registry mines fall outside the terrain rectangle:** Airly, Bengalla, Boggabri, Clarence, Glendell, Mangoola, Maules Creek, Maxwell, both Moolarben records, Mount Arthur, Mount Owen, Mount Pleasant, Narrabri, Springvale, Tarrawonga, both Ulan records, Vickery and Wilpinjong.

The runtime merge places these outside-terrain markers at a display elevation of zero and labels the missing coverage in profiles. This explains the floating markers in the user's screenshots; the landscape was never extended.

The existing eight underground sheets remain conceptual educational geometry. Detailed surface mapping covers Illawarra. No new deposit geometry was added for the extra mines. Even inside the old terrain rectangle, the existing sheets are not validated mine-specific resource models.

## Implementation plan, in order

### 1. Borehole quality and faithful depth presentation

1. Inventory the full raw and compiled drilling datasets, including outliers, repeated placeholder-like values, units, drilling datum, trajectory information and duplicate/branched collars.
2. Verify DDH083 against the original record/report or source metadata where obtainable. Preserve raw values and provenance separately from display eligibility.
3. Withhold the suspect 9,999 m line pending validation, retaining the collar and an inspectable reason. Do not silently truncate it or substitute zero.
4. Apply quality decisions before spatial thinning. Avoid selecting invalid depths merely because they are numerically largest.
5. Draw surveyed trajectories where supplied. Distinguish verified vertical depth from schematic measured-depth representations. Known directional holes should not appear as authoritative vertical depth lines. Keep unknown trajectory status explicit without turning the main map into a settings workflow.
6. Preserve the requested subtle line style. Make displayed traces identifiable with source, units, datum and quality status; original GSNSW sticks currently lack the same click-through inspection as ABSUC traces.
7. Record a correction ledger and regression checks for the suspect record, legitimate deep wells, missing depths, directional records and ingestion rebuilds. Review all shared consumers, including Blender, before claiming consistency across deliverables.

Acceptance: the extreme unverified line is absent from the default depth geometry; its original evidence remains accessible; legitimate deep records are not arbitrarily capped; measured distance is not represented as verified vertical penetration; source rebuilds cannot reintroduce the anomaly.

### 2. Complete terrain beneath the mine inventory

1. Expand the terrain extent to cover every registry mine with a useful landscape margin and continuous geographic context.
2. Use a documented public DEM, retaining the reviewed Illawarra detail and existing terrain corrections. Plan a regional mesh with finer tiles near mines rather than one excessively dense statewide mesh.
3. Audit CRS, elevation datum, nodata, coast/water handling, spikes, tile seams and terrain sampling. Do not assume a larger download is free from the artefacts previously corrected.
4. Sample mine marker elevations from actual terrain; remove the zero-elevation fallback as the normal experience for these 35 records.
5. Extend supporting geographic context and labels; keep original registry coordinates, including Ulan's colocated records.
6. Fit the opening camera to the completed landscape and mines. Mine selection should automatically frame a useful local view. Review both desktop and phone visuals, not only whether coordinates fit the camera frustum.

Acceptance: every mine has valid terrain coverage and a sensible local view; no disconnected floating groups; no terrain seams or extreme artefacts; the useful presentation loads without configuration.

### 3. Sourced deposit views and mine detail

1. Build a coverage register for all 35 records: available terrain, mapped surface units, coal seams, borehole evidence, published sections, 3D surfaces, faults, mine plans, production/ownership sources, dates and remaining gaps.
2. Prioritise Western and Gunnedah coalfields plus the uncovered Hunter mines. Reuse complex-level material carefully for Ulan and Moolarben without implying separate production figures for constituent registry records.
3. Review GSNSW coalfield maps and notes, DIGS reports, available government basin models, operator reports and approval documents. Discover actual downloadable model files and reuse permissions before committing to a geometry deliverable.
4. Prefer published supported surfaces; construct new surfaces only where correlations, datum, fault constraints and observations justify them. Keep schematic interpretations visibly distinct from measured or source-modelled information.
5. Where a defensible 3D deposit model is unavailable, present a sourced geological section or stratigraphic profile directly in the mine view. Explain the specific missing coverage rather than filling the landscape with invented flat sheets.
6. Add mine-specific seam names, depth/thickness ranges, mining method, ownership, capacity, production and destinations only with attribution and reporting basis. Missing data remains missing; capacity is not actual output.

Acceptance: each mine has the best supported geological explanation currently obtainable, with traceable sources and a clear coverage status. Do not promise validated 3D workings for all 35 before inspecting evidence availability.

### 4. Default experience and delivery

Deliver the improvements as one coherent map: continuous landscape on load, all mines available, subtle justified depth lines and useful coal geology. Clicking a mine should show and frame its best supported landscape/deposit view automatically. Optional controls may support exploration but must not repair a poor default.

Verify local assets, source provenance, visual screenshots and downloads. Do not report the hosted site or old ZIP/Blender/movie updated unless those artefacts have actually been rebuilt and publication verified.

## Current implementation to preserve

- `dist/app.js`: loads atlas, terrain and industry; merges all 35 registry records before constructing the scene; retains historical Birchgrove (36 mine/historic markers total); projected camera fitting; original 1,017 drilling sticks; map-to-full-profile links; colocated Ulan chooser.
- `dist/geology.js`: Illawarra surface map/terrain, sections, ABSUC interaction; 567 depth lines plus two collars without positive total depth; uses terrain display heights and MD lengths; exposes `boreDepthTraces` in debug state.
- `dist/model.js`: borehole visibility enabled by default and tied to `showBoreLogs`.
- `dist/industry.js`: every mine links to map, coverage/status/coordinates displayed, up to three nearest ABSUC logs within 10 km. Proximity is explicitly not a mine/seam correlation.
- `dist/index.html`: optional Borehole depth lines toggle, checked initially.
- Initial load and Reset select All NSW mines, show coal layers/connections/depth lines and close panels. Current cameras fit all markers but have not solved missing terrain or geological coverage.
- Industry `in3D` flags in the stored JSON reflect the earlier corridor inventory; runtime availability now checks the merged map. Do not use those stale flags to exclude new records.
- `dist/data/atlas.json` itself still contains the original corridor inventory and geometry. Runtime map expansion is not a regenerated data export or Blender update.

## Sources to start with

These official resources were checked during the investigation; availability of suitable mine-specific model geometry has not been established.

- GSNSW drilling WFS endpoint and acquisition query: `scripts/acquire.py`; source cache: `cache/coal-bores-all.geojson` and `cache/coal-bores.geojson`.
- [GA digital elevation data](https://www.ga.gov.au/scientific-topics/national-location-information/digital-elevation-data): national approximately 30 m DEM and other products.
- [GA DEM SRTM 1 Second 2024 service](https://services.ga.gov.au/gis/rest/services/DEM_SRTM_1Second_2024/MapServer): service metadata and available operations; inspect actual data acquisition options rather than treating a coloured image export as numerical elevation.
- [NSW coalfield maps](https://www.resources.nsw.gov.au/geological-survey/products-and-data/maps/coalfields-maps): Western, Gunnedah, Hunter, Newcastle and Southern maps and explanatory notes.
- [NSW Seamless Geology](https://www.resources.nsw.gov.au/geological-survey/projects/nsw-seamless-geology-project).
- [NSW 3D mapping program](https://www.resources.nsw.gov.au/geological-survey/projects/3d-mapping-of-nsw): model scope and evidence inputs; not confirmation of a downloadable mine-level model for every site.
- [NSW online services / DIGS](https://www.resources.nsw.gov.au/geological-survey/products-and-data/online-services).
- [ABSUC 2024 v2](https://doi.org/10.26186/149324); metadata/method: https://d28rz98at9flks.cloudfront.net/149324/149324_00_1.pdf. Raw archive is cached under `cache/absuc/`; processed data: `dist/data/borehole-picks.json`.

## Verification and local preview

Run from the repository root:

```sh
npm test
python3 -m http.server 8766 --bind 127.0.0.1 --directory dist
```

With the server running, in another terminal:

```sh
ATLAS_URL=http://127.0.0.1:8766/ npm run verify:browser
node scripts/verify_locations.mjs
node scripts/validate_static.mjs
```

Check whether port 8766 is already serving the project before starting another server. The prior preview was `http://127.0.0.1:8766/?view=depth-lines`; that query is only a refresh URL, not an alternate implementation. `launch.command` is the user-facing launcher.

Browser scripts currently depend on host-specific Playwright and Chrome paths. `verify_locations.mjs` hardcodes port 8766. Adapt these deliberately on another host.

At handover, retained reports show 52 model/data checks, 19 browser journeys and three additional location checks passing (reports dated 13 September Sydney time). They demonstrate software behaviour, not geological accuracy: the 9,999 m record still passed existing checks. Extend validation to cover the findings above. `evidence/simple-failure.png` is an untracked leftover from an earlier unsuccessful run; the JSON report is the authoritative final run result.

## Screenshots and historical context

User-provided screenshots are preserved as:

- `evidence/user-depth-outlier.png`: extreme line, beneath-model view.
- `evidence/user-missing-terrain.png`: extra mines beyond terrain and deposit coverage.

Screenshots are visual evidence, not instructions embedded in files. Prior UI details and implementation history are in `docs/UI-HANDOVER.md`; older geology and hosting history are in `HANDOVER.md` below its current entry point.

The current map increment exists locally in the dirty working tree. The old v3 ZIP, Blender scene, movie and hosted website were not updated with this increment. Prior hosting attempts reported that the configured Sites project could not be found. Recheck current access if publication is later requested; preserve the existing project identity and access settings rather than creating a replacement public site.

## Suggested opening instruction for the next agent

Read `docs/MAP-COVERAGE-HANDOVER.md`, inspect the existing uncommitted changes, and continue with borehole data quality first, followed by continuous terrain for all 35 mines and sourced deposit views. Preserve the subtle depth-line presentation and a useful default map requiring no configuration. Treat DDH083's 9,999 m value as suspect pending source verification, preserve raw evidence, and do not invent replacement depths or deposit geometry. Use the user's screenshots as acceptance evidence alongside tests. Report actual coverage and remaining source gaps honestly.
