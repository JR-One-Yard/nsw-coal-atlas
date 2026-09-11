# Commercial ideas and implementation plan

12 September 2026. User direction: retain the current geological presentation and prioritise commercial insight. Confidence percentages below are product judgments, not statistical estimates.

## Thirty initial ideas

1. **Commercial overview:** Turn the inventory into a filter-linked overview of operations, product mix and reported production.

2. **Mine comparison shortlist:** Compare up to four selected operations in one persistent table.

3. **Operator portfolios:** Filter and inspect the operations associated with each operator/group.

4. **Destination relationships:** Explore which recorded mines connect to ports, power stations and steelmaking destinations.

5. **Revenue sensitivity lab:** Explore how realised price, saleable volume and AUD/USD affect illustrative gross revenue.

6. **Export gateway benchmarks:** Compare published annual coal throughput and stated handling capacity at export gateways.

7. **Approval and mine-life calendar:** Show sourced consent milestones, expansion decisions and published planned end dates.

8. **Product quality cards:** Explain the commercial differences between thermal and metallurgical products for selected operations.

9. **Regional procurement footprint:** Compare disclosed local spending and employment for operating complexes.

10. **Equity ownership exposure:** Show the difference between an operator's managed assets and ownership interests.

11. **Production trends:** Track multi-year reported output with comparable entity and reporting-period definitions.

12. **Commercial watchlists:** Save named groups of mines for repeated commercial review.

13. **Export-market mix:** Show aggregate destination-country exposure for NSW coal trade.

14. **Logistics scenario calculator:** Compare user-entered transport costs for hypothetical export and domestic routes.

15. **One-page commercial brief:** Export a printable commercial summary of selected operations and assumptions.

16. **Automated mine valuations:** Calculate a valuation for every NSW mine.

17. **Mine profitability league table:** Rank all operations by estimated margins.

18. **Live coal trading terminal:** Embed real-time coal prices and execution-style charts.

19. **Inferred customer contracts:** Guess customer relationships from proximity and product labels.

20. **Live vessel tracking:** Map ships and infer cargo origins in real time.

21. **Reserve-to-dollar converter:** Multiply underground model volumes by spot prices.

22. **Automated royalty engine:** Compute operation-specific tax and royalty liabilities.

23. **Weather-based production forecast:** Predict mine output from weather events.

24. **AI investment ratings:** Generate buy/sell-style scores for mine owners.

25. **Blockchain coal provenance:** Trace every tonne through a distributed ledger.

26. **Single ESG score:** Rank mines with one blended environmental/social score.

27. **Supplier contact harvesting:** Collect names and emails of mine procurement staff.

28. **Coal trading marketplace:** Allow users to transact coal through the atlas.

29. **Built-in team chat:** Add real-time discussion channels to every operation.

30. **Full CRM integration:** Synchronise mines into sales pipelines and contact systems.


## Critical evaluation

The test is usefulness to the atlas audience, feasibility with available data, clarity, maintenance burden, and risk of misleading comparisons. Keep means worth building; the first five are selected for immediate implementation.

| # | Idea | Decision | Rationale | Confidence |
|---|---|---|---|---|
| 1 | Commercial overview | Keep · implement now | Directly answers what is in the selected market slice using data already present. | 98% |
| 2 | Mine comparison shortlist | Keep · implement now | Cuts repeated profile navigation and supports practical asset screening. | 97% |
| 3 | Operator portfolios | Keep · implement now | Makes the corporate landscape legible and helps users find competing or adjacent assets. | 97% |
| 4 | Destination relationships | Keep · implement now | Connects the resource map to commercial demand using the twelve existing sourced relationships. | 95% |
| 5 | Revenue sensitivity lab | Keep · implement now | Adds an immediately useful commercial calculation without needing private mine-cost assumptions. | 93% |
| 6 | Export gateway benchmarks | Keep · later | Adds market scale and infrastructure context that individual mine records lack. | 87% |
| 7 | Approval and mine-life calendar | Keep · later | Helps users understand where supply could change and when decisions matter. | 85% |
| 8 | Product quality cards | Keep · later | Makes product-market positioning more useful than two broad colour categories. | 88% |
| 9 | Regional procurement footprint | Keep · later | Supports a commercial audience interested in regional suppliers and economic footprint. | 89% |
| 10 | Equity ownership exposure | Keep · later | A corporate lens adds useful commercial context beyond operator association. | 84% |
| 11 | Production trends | Keep · later | Trend direction is more useful than a single annual number for many commercial questions. | 91% |
| 12 | Commercial watchlists | Keep · later | Builds naturally on the comparison shortlist for recurring user workflows. | 88% |
| 13 | Export-market mix | Keep · later | Adds the demand-side geography absent from the mine inventory. | 83% |
| 14 | Logistics scenario calculator | Keep · later | Extends the revenue lab into operational commercial tradeoffs while keeping assumptions explicit. | 81% |
| 15 | One-page commercial brief | Keep · later | Turns exploration into a reusable briefing artifact. | 94% |
| 16 | Automated mine valuations | Reject | Private costs, reserves, fiscal assumptions and contracts are missing; outputs would look precise without a defensible model. | 30% |
| 17 | Mine profitability league table | Reject | There is no comparable cost dataset, and product/contract differences defeat simple price-minus-cost estimates. | 25% |
| 18 | Live coal trading terminal | Reject | Licensing, feeds and ongoing maintenance overwhelm the value to a regional atlas; a scenario tool is practical now. | 45% |
| 19 | Inferred customer contracts | Reject | Would fabricate commercial relationships and misrepresent the existing sourced transport map. | 10% |
| 20 | Live vessel tracking | Reject | AIS integration is expensive and vessel position does not establish mine origin or coal ownership. | 40% |
| 21 | Reserve-to-dollar converter | Reject | The atlas's sheets are illustrative and do not encode recoverable tonnes or product quality; this would be fundamentally invalid. | 5% |
| 22 | Automated royalty engine | Reject | Requires current legal rules and entity/contract data beyond the scope of an atlas. Gross-revenue scenarios deliver value with fewer hidden assumptions. | 35% |
| 23 | Weather-based production forecast | Reject | Lacks operating constraints and training evidence; would create an unsupported commercial forecast. | 20% |
| 24 | AI investment ratings | Reject | Not grounded in financial statements, valuation or user objectives; no place in the requested commercial atlas. | 10% |
| 25 | Blockchain coal provenance | Reject | No authenticated supply-chain inputs or participating counterparties, with enormous implementation overhead. | 5% |
| 26 | Single ESG score | Reject | A subjective aggregate hides materially different metrics and would need a much larger verified dataset. | 30% |
| 27 | Supplier contact harvesting | Reject | Contact collection is peripheral to commercial insight, privacy-sensitive and quickly stale. | 20% |
| 28 | Coal trading marketplace | Reject | Requires counterparties, contracts, compliance and settlement infrastructure unrelated to the existing product. | 5% |
| 29 | Built-in team chat | Reject | Authentication and moderation complexity with little immediate benefit; exportable briefs serve collaboration more directly. | 35% |
| 30 | Full CRM integration | Reject | Premature without a defined workflow or target CRM; portable exports offer the useful part now. | 40% |


## Actionable plans for all fifteen retained ideas

### 1. Commercial overview — 98% confidence

**Why:** Directly answers what is in the selected market slice using data already present.

**Implementation:** Add a pure summarize(industry, records) function and four KPI cards. Group thermal-only, metallurgical-only, mixed and unclassified records without overlap. Deduplicate complex IDs, group production by reporting period, show represented-record coverage and link every complex to its source. Recompute with search, region, product, operator and destination filters.

**Downsides and boundaries:** Registry counts are not market shares; a selected component includes its whole complex production. Label the small covered subset beside every total.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 2. Mine comparison shortlist — 97% confidence

**Why:** Cuts repeated profile navigation and supports practical asset screening.

**Implementation:** Add compare toggles to inventory rows, a max-four selection set and a comparison tab. Persist validated record IDs in localStorage with a versioned key; tolerate malformed or unavailable storage. Compare products, operator, ownership, method, region, whole-complex saleable output, approved capacity and known destinations. Export the selected rows with sources and explicit production basis.

**Downsides and boundaries:** Sparse fields may dominate some comparisons. Keep missing entries visible and do not convert missing output to zero or rank complex totals as individual-mine performance.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 3. Operator portfolios — 97% confidence

**Why:** Makes the corporate landscape legible and helps users find competing or adjacent assets.

**Implementation:** Build exact-match operator filters and clickable horizontal bars with record counts and product categories. Include the unverified group in the display. Preserve search/region/product filters when selecting a group and provide a reset action. Use operator identity as recorded rather than trying to infer parent-company ownership.

**Downsides and boundaries:** Associations and joint ventures are not legal ownership or equity-adjusted production. Counts must be described as registry records, never market concentration by output.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 4. Destination relationships — 95% confidence

**Why:** Connects the resource map to commercial demand using the twelve existing sourced relationships.

**Implementation:** Group existing routes by destination; show unique linked mine counts and transport descriptions. Clicking a destination filters the inventory to those relationships, and profile links retain source access. Show how many filtered operations have no recorded destination and distinguish illustrative regional connections in their labels.

**Downsides and boundaries:** The relationship set is incomplete and includes a schematic Hunter connection. It cannot establish customer revenue concentration, capacity utilisation or specific shipment volumes.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 5. Revenue sensitivity lab — 93% confidence

**Why:** Adds an immediately useful commercial calculation without needing private mine-cost assumptions.

**Implementation:** Implement revenueAUDm = volumeMt * priceUSDperT / usdPerAUD. Accept user-entered inputs with explicit units, optionally load a reported complex volume and retain its period/source. Display baseline revenue, a USD10/t price sensitivity and a 3-by-3 price/FX matrix. Export assumptions and calculations. Defaults are editable teaching assumptions, not market quotes.

**Downsides and boundaries:** This is gross revenue, not profit or valuation; it omits product premiums, hedging, costs, royalties and taxes. Do not present a blended complex volume as realised sales or an investment recommendation.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 6. Export gateway benchmarks — 87% confidence

**Why:** Adds market scale and infrastructure context that individual mine records lack.

**Implementation:** Acquire dated operator/port annual reports; store terminal versus port scope, coal-only tonnes, calendar/fiscal periods and capacity basis. Build a compact comparison with source-linked bars and disallow utilisation when scope or periods differ. Validate one port first before expanding.

**Downsides and boundaries:** Capacity and throughput definitions differ; confusing terminal totals with port totals double counts traffic. Implementation depends on matched public disclosures.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 7. Approval and mine-life calendar — 85% confidence

**Why:** Helps users understand where supply could change and when decisions matter.

**Implementation:** Create event records with operation ID, event type, date, source document/page and whether the date is approved, proposed or operator guidance. Add a timeline and filters. Keep consent expiry distinct from reserves-based life and commercial closure expectations.

**Downsides and boundaries:** Approval dates are legally and temporally sensitive. Require primary-document review before publication and never treat a proposal as approved output.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 8. Product quality cards — 88% confidence

**Why:** Makes product-market positioning more useful than two broad colour categories.

**Implementation:** Add sourced specifications where publicly disclosed: energy basis, ash, sulfur, moisture and coking category, with units and assay/report dates. Display only comparable bases together and connect cards to existing product filters. Begin with qualitative operator product descriptions where assays are absent.

**Downsides and boundaries:** Mixing GAR/NAR or wet/dry analytical bases misleads. Do not derive a price premium from a product label alone.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 9. Regional procurement footprint — 89% confidence

**Why:** Supports a commercial audience interested in regional suppliers and economic footprint.

**Implementation:** Use public operator contribution reports with operation/complex scope, reporting year, AUD denomination and employee/contractor definition. Pilot Ulan's published 2025 goods-and-services and workforce metrics. Add source-linked cards and a regional selector; avoid sums across overlapping entities.

**Downsides and boundaries:** Spending is not local unless the source says so; jobs may include contractors or estimates. Keep published definitions attached.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 10. Equity ownership exposure — 84% confidence

**Why:** A corporate lens adds useful commercial context beyond operator association.

**Implementation:** Create structured dated equity stakes keyed to legal asset entities, with parent/child relationships and source pages. Validate sums and effective dates. Offer managed-operation and equity-interest views; compute attributable output only when production scope matches ownership scope.

**Downsides and boundaries:** Joint ventures and transactions can change rapidly. Existing ownership prose is insufficient for automated calculations and cannot be parsed into verified stakes.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 11. Production trends — 91% confidence

**Why:** Trend direction is more useful than a single annual number for many commercial questions.

**Implementation:** Extend complexes with annual observations containing saleable/ROM, period boundaries, basis, source and restatements. Add sparklines and growth only for comparable consecutive periods. Start with the existing three complexes and retain nulls and discontinued operations.

**Downsides and boundaries:** Changing asset boundaries can create false growth. Never stitch a mine series to a combined complex series without a bridge.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 12. Commercial watchlists — 88% confidence

**Why:** Builds naturally on the comparison shortlist for recurring user workflows.

**Implementation:** Extend versioned local storage to named lists, optional user notes and JSON import/export. Keep IDs stable, surface missing records after data updates and provide explicit delete/restore actions. Offer filters for product, region and company.

**Downsides and boundaries:** Local-only storage is device-specific; do not imply account sync. Notes need text escaping and exported files must not execute spreadsheet formulas.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 13. Export-market mix — 83% confidence

**Why:** Adds the demand-side geography absent from the mine inventory.

**Implementation:** Find an official coal-only NSW or port trade series with country, period, mass/value basis and licence. Build ranked bars and period comparison, clearly separated from mine-level relationships. Keep country attribution at the exact source scope.

**Downsides and boundaries:** Port, state and customs datasets have different boundaries. Country totals do not reveal individual mine customers.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 14. Logistics scenario calculator — 81% confidence

**Why:** Extends the revenue lab into operational commercial tradeoffs while keeping assumptions explicit.

**Implementation:** Accept user-specified rail/road/handling/freight components with currency and per-tonne basis. Preserve calculation boundary, avoid double counting FOB freight, and compare scenarios without claiming actual tariffs. Reuse the validated unit conversion and export helpers from the revenue lab.

**Downsides and boundaries:** Private tariffs and route constraints are not available. Default costs must be clearly hypothetical and distances must not be inferred from schematic arcs.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

### 15. One-page commercial brief — 94% confidence

**Why:** Turns exploration into a reusable briefing artifact.

**Implementation:** Build a print stylesheet and report composition using comparison IDs, filters, data snapshot, source links and optional saved revenue assumptions. Repeat basis/currency/period labels next to values. Add page-break and missing-data tests and a visible generated date.

**Downsides and boundaries:** A report can outlive its snapshot. Include the source date and prevent clipped tables or loss of qualifications in PDF output.

**Verification:** Exercise a populated case, an empty/missing-data case and a contradictory-input case. Pure calculations need unit tests; controls and exports need browser tests with inputs, expected outputs and source snapshot recorded.

## Core implementation contracts

```js

// Count each represented complex once; never allocate its total to a component mine.

const complexIds = new Set(records.map(r => r.complexId).filter(Boolean));

// Keep production grouped by reporting period; never add different years together.

// Mt × USD/tonne yields USD millions; FX is USD per AUD.

const revenueAUDm = volumeMt * priceUSDperT / usdPerAUD;

// Persist only known IDs, remove duplicates and cap the comparison at four.

const selected = [...new Set(savedIds)].filter(id => knownIds.has(id)).slice(0, 4);

```

## Evidence used in the first increment

- Existing 35-record industry inventory, 12 source-linked routes and five destinations. Registry snapshot: 11 September 2026.

- Yancoal 2025 report, operations overview: https://www.yancoal.com.au/wp-content/uploads/2026/04/Yancoal-P4-Report-2025.pdf

- Ulan 2025 saleable production: https://www.glencore.com.au/operations-and-projects/coal/current-operations/ulan-coal

Both production sources were rechecked on 12 September 2026. Prices and FX in the calculator are editable assumptions, not retrieved market quotes.

## Delivery scope

Implement ideas 1–5 in this increment. Ideas 6–15 remain a commercial backlog; they do not redirect work into further geological validation. Preserve all existing geology, borehole, industry and export functions.
