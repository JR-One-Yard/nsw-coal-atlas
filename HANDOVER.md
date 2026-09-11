# NSW Coal Atlas — version 2.1 handover

11 September 2026. The local project now leads with geology: published Illawarra surface mapping, finer terrain, a five-step field guide, a stratigraphic column and sections linked to the displayed underground meshes. The statewide industry inventory complements this presentation.

## Delivered

- 2,004 mapped rock-unit features and 1,884 fault features from the separate GSNSW Seamless Geology WFS service. This corrects the earlier review's incomplete discovery of available surface mapping.
- A 66,049-vertex local elevation tile, with geological colours and source-feature inspection. The coarse regional terrain is masked under it.
- Four section presets, custom endpoints and terrain drawing. Sections preserve absent mesh coverage, identify model elevations, distinguish true scale from exaggerated scale and export SVG with sources.
- Linked seam selection across 3D, sections and stratigraphy. Upper rock units have sourced descriptions and sequence, without fabricated subsurface thicknesses.
- Geological unit / coal use / evidence colouring, display separation and mapped surface faults. Fault traces do not imply underground geometry.
- Five Illawarra lesson steps connecting surface rock, succession, section, seam evidence and Dendrobium's industry connections.
- All 35 downloaded statewide coal registry records in a separate searchable/filterable inventory. Sources distinguish operator/group, ownership where verified, approved capacity and complex-level actual production.
- Updated Blender scene and full regional tour recording. Regional features, filters, sources and earlier controls remain available.

## Additional work in version 2.1

- Acquired and filtered Geoscience Australia's ABSUC 2024 v2: 569 boreholes, 4,955 preferred formation tops and 4,479 preferred bases (5,105 unique records) in the atlas window.
- Added searchable measured-depth logs, original drilling references, AHD values, source GUIDs and preference flags. Only same-record, preferred TB bases with valid depths are treated as paired down-hole intervals; suspect bases are never accepted as interval ends.
- Added optional section diamonds for named coal tops within a fixed 1 km swath. Boreholes identified as horizontal/deviated are excluded. Other records lack verified deviation information; their reported AHD values remain uncorrected. Projection offsets are disclosed.
- Linked stratigraphic selection to highlighted mapped exposures, with an explicit no-matching-exposure state. Added mapped fault crossing arrows and source descriptions; no underground fault planes were invented.
- Packed the compiled borehole evidence and initially hidden coal-top markers into Blender, with marker-to-source lookup. The movie remains the version 2 regional presentation; the new analysis is interactive.

## What remains scientifically unfinished

The eight underground sheets are unchanged illustrative geometry. Published compiled coal-unit picks have now been acquired, but original logs have not been independently checked and no surfaces have been fitted to them. The displayed drilling sticks show total drilled depth, not coal. The section tool makes the assumptions easier to inspect; it does not make their local depths authoritative.

Highest-value next work:

1. Validate a small set of the acquired Illawarra coal picks against original logs and deviation surveys, then construct a defensible section with mapped contacts and fault constraints. Record original coordinates, height datum, lithology interval, uncertainty and source page for every observation. Compare the resulting model to independent observations.
2. Acquire detailed geological constraints for Newcastle/Lake Macquarie and Hunter. The Hunter Bioregional Assessment describes an existing regional 3D framework; its documentation was reviewed, but its model files were not acquired here.
3. Develop process-led stories about deposition, basin structure, erosion and coal quality supported by regional evidence. Add real logged stratigraphic columns and annotated outcrop/core images where reusable sources permit.
4. Replace composite Sydney/Hunter envelopes only when suitable constraints exist. Preserve gaps and distinguish mapped evidence from interpolation.

Industry work also remains: two operator associations and many product/ownership fields are unverified; only three complexes have production metrics; supply connections still cover the original 12 links; the registry is neither live nor a complete historical inventory. No detailed longwall layouts, worked-out volumes, coal assays or resource quantities were added.

The diagnostic comparison in `evidence/borehole-model-comparison.json` preserves 416 differences. At Cordeaux River 1, for example, ABSUC reports the Bulli top at +234.5 m AHD (92.5 m MD from a 327 m AHD Kelly Bushing reference), while the illustrative sheet is approximately −512.3 m in its sea-level convention at those coordinates. This is a provisional comparison, not a validated 746.8 m model error: correlation, source coordinates, deviation and datum need review. It demonstrates why the smooth sheets must not be treated as local depth predictions.

## Verification

Reports in `evidence/` record the checks actually run. Software checks establish behaviour and agreement of displays, not geological accuracy.

- `model-tests.json`: 16 original model checks.
- `geology-model-tests.json`: 11 tests of stratigraphic matching, fault intersections, triangle intersections, terrain orientation, coverage gaps, feature lookup, seam order and industry provenance.
- `borehole-model-tests.json`: 5 checks of source counts/IDs, drilling datum, interval flags and section projection.
- `browser-tests.json`: 15 original real-browser interactions.
- `geology-browser-tests.json`: 16 geology/industry/borehole browser scenarios, including source loads, linked selection, exports, mobile rendering and console errors.
- `blender-tests.json`: 20 checks, including compiled pick metadata and marker centres, eight matching seam meshes, detailed terrain elevation agreement, packed surface texture and embedded source metadata.
- `tour-recording.json`: actual complete regional flythrough playback and browser errors.
- `artifact-manifest.json`: delivery asset sizes and SHA-256 hashes.

Desktop and mobile screenshots plus fresh Blender chapter renders are retained. Browser checks emulate a mobile viewport; no physical phone was tested. The test scripts have local Playwright/Chrome paths documented in README.

## Delivery status

Use `launch.command` for the upgraded local viewer. The private hosted URL in the original handover was published for version 1; this upgrade has not been deployed there. `START-HERE.md` makes that distinction explicit.

The updated Blender download includes the published surface map and source metadata, with separate fault edges initially hidden. The MP4 is a silent recording of the regional tour; the new five-step guide is available interactively, with text explanations.

## Sources worth carrying forward

- GSNSW Seamless Geology: https://www.resources.nsw.gov.au/geological-survey/projects/nsw-seamless-geology-project
- WFS endpoint: https://gs-seamless.geoscience.nsw.gov.au/geoserver/ows — `geology:rock_units_nsw`, `geology:faults_nsw`.
- Southern Coalfield context: https://www.bioregionalassessments.gov.au/assessments/12-resource-assessment-sydney-basin-bioregion/1211-coal
- Hunter geological model context: https://www.bioregionalassessments.gov.au/assessments/21-22-data-analysis-hunter-subregion/212-geology
- GSNSW coalfield maps: https://www.resources.nsw.gov.au/geological-survey/products-and-data/maps/coalfields-maps
- Open exploration reports: https://www.resources.nsw.gov.au/geological-survey/publications/exploration-reports

ABSUC source: https://doi.org/10.26186/149324. Methodology and data schemas: https://d28rz98at9flks.cloudfront.net/149324/149324_00_1.pdf, especially pp. 5 and 9. Acquisition hashes and subset counts are in `evidence/borehole-downloads.json`.

Source URLs, feature IDs and download hashes are retained. These provide a starting point for the next scientific increment without overstating what is already reconstructed.
