# Intelligence map handoff

## Goal

Document the Turn Maps **Intelligence** display mode so its behaviour can be changed safely in a later chat.

The mode is a read-only map overlay. It combines current and previous turn data to flag:

- production sites outside their allowed population range
- production-site changes since the previous month
- newly owned coordinates, represented by a lowercase state code
- spy reports, including reports from spies boarded on ships
- reported army positions
- epidemics

It does not create or save turn-sheet orders.

## Current behaviour

### Display and controls

- `Intelligence` is a selectable Turn Maps mode.
- It shows State, Population, and Production Site text in each coordinate by default.
- It does not show the normal `unit_Exists` map marker.
- Sea coordinates retain the normal sea appearance and have no intelligence border.
- Clicking a coordinate still updates the coordinate details and item-grid selection. It only opens the movement picker if units are present, because Intelligence is not a special picker mode.
- The normal movement-order toolbar remains visible, and double-click still previews movement routes. Intelligence itself has no save path, but these inherited interactions can still alter TS18 movement work.

### Coordinate highlighting

Each non-sea coordinate first gets a state-coloured background when it has at least one intelligence condition, army position, or epidemic.

- A coordinate with a spy report always gets a black background, with a state-coloured border and light text.
- A coordinate with no highlight gets a white background and dark text.
- Borders use the strongest applicable condition:
  - **1px:** no intelligence condition
  - **2px:** one ordinary intelligence condition
  - **3px:** spy report
  - **4px:** multiple intelligence conditions, army position, or epidemic
- Border colours:
  - red: population outside its production site's min/max range
  - green: production-site change
  - amber: lowercase/new-owner state marker
  - state colour: spy report
  - dark goldenrod: army position
  - purple: epidemic

The count used for “multiple intelligence conditions” includes only out-of-range population, production-site change, new owner, and spy report. Army positions and epidemics override border priority but do not increase that count.

### Tooltip

In Intelligence mode, the coordinate tooltip combines the applicable details:

- `Critical: multiple intelligence criteria detected`
- production site min/max failure
- prior and current production-site names when changed
- new owner state code
- spy report text
- army state and battalion count
- epidemic state

`jumpOffText` is prepended when present. Spy reports are deliberately included in the Intelligence tooltip rather than added separately by the generic map-tooltip path.

## Data flow

```text
Turn map coordinates + current full turn report
  -> Turn Maps controller initializes lookups
  -> Intelligence helpers calculate visual state and tooltip
  -> map template applies CSS classes and title

Previous-month map coordinates
  -> previousMapCoordinatesByKey
  -> production-site change comparison

All state reports for the current game/month
  -> spyCoordinateReportByKey
  -> spy report marker and tooltip
```

### Previous-turn comparison

- `turnMapsSpyLookupFactory.getPreviousTurnId()` derives the strict previous month using `turnHistoryFactory`.
- If the turn list is available, it only uses that previous turn when it exists in the list.
- `loadPreviousMapCoordinates()` loads its map coordinates into `previousMapCoordinatesByKey`.
- The selected state affects the comparison turn ID and map region. It also reloads the previous map and rebuilds spy reports.

### Spy reports and transports

- The current game/month's reports for all available states are loaded and cached by turn ID.
- Each non-empty `turnReport.spies[].report` is placed at its effective coordinate.
- For the selected state report, a TS20 boarding row takes precedence: the spy follows its assigned ship/fleet coordinate.
- Otherwise a reported `spy.boarded` ship/fleet coordinate is used; finally the spy's own X/Y is used.
- Multiple reports at one coordinate are joined with ` || `.
- Request IDs prevent a stale asynchronous spy-report request from overwriting a newer lookup.

### Army and epidemics

- `turnReport.armyPositions` is indexed by coordinate, retaining state and battalion count.
- `turnReport.epidemics` is indexed by coordinate, retaining state.
- Both are read from the current full turn report.

## Main files

### Mode selection and page lifecycle

- `App/turnMaps/turnMapsConfigFactory.js`
  - declares the `Intelligence` display option and its default visible fields.
- `App/turnMaps/turnMapsMapSelectionFactory.js`
  - `isIntelligenceMode()`
  - refreshes prior-map and spy-report lookups after a state change.
- `App/turnMapsController.js`
  - initializes lookup state
  - loads map coordinates, current full turn data, TS20 boarding data, and reference data
  - watches turn list and boarding rows so intelligence lookups are refreshed.

### Intelligence calculation and map rendering

- `App/turnMaps/turnMapsProductionSitesFactory.js`
  - contains the Intelligence calculation helpers despite its broader name:
    - `getIntelligenceCriteria()`
    - `getIntelligenceVisualInfo()`
    - `getIntelligenceTooltip()`
    - production-site change and population-range helpers.
- `App/turnMaps/turnMapsSpyLookupFactory.js`
  - loads and indexes previous map, spy reports, army positions, and epidemics.
- `App/turnMaps/turnMapsSharedFactory.js`
  - `defineCoordClass()` applies Intelligence background and border classes.
- `Templates/turnMapsTemplate.html`
  - renders the mode selector, map grid, CSS classes, and tooltip.
- `Content/Site.css`
  - defines `intelStateBg_*`, `intelStateBorder_*`, `intelSeverityBorder_*`, `intelText_*`, and `intelBorder_*`.

### Related intelligence screen

- `App/intelligenceController.js`
- `App/intelligence/intelligenceBoardingFactory.js`

These own the standalone Intelligence tab and TS20 spy boarding/unloading actions. The map does not reuse that controller; it reads the same report and TS20 data independently.

## Important integration points

- The mode requires `turnReportFactory.getTRFullTurnDetails()` data for spies, army positions, epidemics, and ship coordinates.
- Production-site labels and population ranges depend on `rulesCatalogFactory.getRefProductionSites()`.
- The reported current production site can be overridden in the visual comparison by a pending TS19 build/demolish order through `getCurrentProductionSiteSymbolForIntelligence()`.
- TS20 boarding rows are needed for correctly locating selected-state spies aboard ships.
- `stateColorFactory` supplies state backgrounds and readable text contrast.

## Known technical debt and risks

- Intelligence-specific functions live in `turnMapsProductionSitesFactory.js`; the name obscures that responsibility.
- The map controller owns several asynchronous lookup lifecycles and scope-level caches, so additions need to preserve request-order protection.
- Spy data aggregates reports from every state in the current game/month. This can require several full-turn-report requests and can show overlapping reports from different states at one coordinate.
- Previous-map comparison is unavailable when the strict prior-month turn is missing from `turnsList`; the affected coordinate simply has no production-site-change signal.
- The lowercase state-code convention is assumed to mean a new owner.
- The colours and border widths are hard-coded in `Content/Site.css`; any new condition needs an explicit priority decision in `getIntelligenceVisualInfo()`.
- `intelligencePaletteByBucket` is currently unused; the active colours are defined by CSS classes.
- Each map-cell render calls several helpers that independently recompute `getIntelligenceVisualInfo()`. Keep this in mind before adding more data lookups or enabling wider map views.
- Intelligence mode has no interaction guard around normal movement controls. A future change should decide whether analysis mode should remain interactive or explicitly disable TS18 selection and route preview.
- No automated UI tests exist for this mode.

## Current repository state

- At handoff creation, the only tracked modification is `Services/TurnReportImportParsingUtils.cs`, which is unrelated to Intelligence Map Mode.
- Several untracked files in `Turns/` appear to be turn data or match documents; do not modify or commit them unless explicitly requested.

## Recommended validation after changes

1. Select Intelligence mode and verify default State/Population/Production Site text.
2. Check a sea coordinate remains unhighlighted.
3. Verify a coordinate for each condition: out-of-range population, site change, lowercase state, spy report, army position, and epidemic.
4. Verify combinations use the intended strongest border and complete tooltip.
5. Change the selected state and confirm the map region, prior-turn comparison, and spy lookup refresh.
6. Board a spy in TS20, return to the map, and verify the report follows the assigned ship/fleet coordinate.
7. Run `node --check` on changed JavaScript files and `git diff --check`.

## Recommended next-chat prompt

> Read `@intelligence-map-handoff.md`, inspect the current git diff, and make the requested Intelligence Map Mode change. Preserve the existing data-source precedence and map-mode behaviour unless the change explicitly requires it. Do not modify unrelated turn-import work or untracked files in `Turns/`.
