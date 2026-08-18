# Movement X handoff

## Goal

Document Turn Maps Movement X, which reuses Existing Army and Existing Navy as the movement picker (modal or right pane). Treat current code as source of truth.

Movement X reuses ordinary Movement behavior:

- TS18 movement orders
- movement route calculation and map highlighting
- MP calculation
- order navigation
- autosave

Supported selectable items: brigades, commanders, spies, baggage trains, warships, merchant ships, land federations, and fleets.

## Army modal on the map

On Turn Maps, the “army modal” is the Movement X picker when it hosts `<existing-army>`:

- Narrow / non-panel layout: full-bleed overlay `existingArmyHostModal` in `Templates/turnMapsTemplate.html`
- Wide layout: same directive in the right-side `turnMapsMovementXPane`
- Always passes `modal-mode="movementXModalMode"` (true) and `movement-selection="true"`
- Title/subtitle say “Movement X”; body can switch Army/Navy at a coastal shipyard

This is separate from Army > Existing Army, which always renders inline (no modal-mode checkbox). Movement X still uses the same CSS shell and `modal-mode` on the directive.

## Current behavior

### Existing Army and Existing Navy reuse

- `existingArmy` owns Existing Army load, replay, state, and actions.
- `existingNavy` owns Existing Navy load, replay, state, and actions.
- Army > Existing Army and Navy > Existing Navy still work as standalone screens.
- Movement X hosts both directives with movement-selection + modal mode.
- Modal mode:
  - hides Federation Summary / Fleet Summary
  - blocks rename
  - makes battalion lozenges inert (no training colors / menus)
  - hides H/C, Train, Repair, fleet-assignment management, and trailing `...` menus
- Boarding remains available in Movement X (brigade/commander boarding modal; spy boarding modal).
- Federation chip still opens Form Federation in Movement X; after save, Turn Maps refreshes via `on-form-federation-saved`.

### Movement X picker

- Map defaults to Movement X.
- Picker does not open initially; Item button or a coordinate click opens it.
- Coordinate click:
  - sea → Navy view
  - coastal shipyard → Army/Navy radio toggle (`movementXPickerIsShipyard`)
  - units at that X/Y → position filter
  - otherwise → sphere filter
  - no unit starts yellow-selected (`movementXPickerShowCurrentSelection` starts false)
- Display mode (`orderUi.movementPickerDisplayMode`):
  - `panel` when wide-screen setting is on, not Production Site mode, and viewport width ≥ `wideScreenMinViewportWidth` (1500 from `turnMapsConfigFactory`)
  - otherwise `modal` overlay
- Intelligence mode forces the picker closed and does not show Movement X hosts.
- Row click selects the individual unit (brigade / commander / spy / baggage train / ship).
- `Move Fed` beside Fed selects land federation movement (disabled when no fed).
- `Move Fleet` beside Fleet selects fleet movement (disabled when no fleet).
- Current selection: yellow (`itemGridRowSelected`).
- Routed TS18 covering that unit/fed/fleet: light blue (`landUnitsMovementOrderExists`).
- Boarded movement items: Boarded badge; non-selectable boarded items use disabled row styling (`landUnitsMovementDisabled`).

### Provisional TS18 selection

- Selecting a unit/federation/fleet alone does not POST TS18.
- Selecting another unit or switching Unit/Fed/Fleet replaces the provisional choice.
- A route from map click, or manual direction/distance edits, triggers TS18 autosave.
- Navigating away clears an unrouted provisional choice.
- Light-blue “moved” status requires direction/distance data, not selection alone.

### ID ranges used by Movement X highlighting / fleet pick

- Land federation numbers: 61–90 (army moved highlighting treats these as fed orders).
- Commander numbers: 1–10.
- Brigade numbers: four digits.
- Fleet `Move Fleet` validation currently accepts fleet numbers 11–30 in `selectMovementXNavyShip()`.
- Fleet federation/movement orders must not light up army rows as moved.

## Main files

### Reusable views

- `App/landUnits/existingArmyDirective.js`
- `Templates/existingArmyTemplate.html`
- `App/navalUnits/existingNavyDirective.js`
- `Templates/existingNavyTemplate.html`

### Turn Maps host and movement

- `Templates/turnMapsTemplate.html` — modal + pane hosts for Movement X
- `App/turnMapsController.js` — `selectMovementXArmyUnit`, `selectMovementXNavyShip`, boarded/disabled helpers, display-mode flags
- `App/turnMaps/turnMapsMapSelectionFactory.js` — coordinate click → picker view / filters / shipyard toggle
- `App/turnMaps/turnMapsOrderNavigationFactory.js` — `selectMovementOrderItem`, open/close picker
- `App/turnMaps/turnMapsMovementPickerFactory.js`
- `App/turnMaps/turnMapsMovementItemFactory.js`
- `App/turnMaps/turnMapsConfigFactory.js` — wide-screen min width
- `App/turnAssignmentResolverFactory.js` — effective federation/fleet for movement
- `Content/Site.css` — `.existingArmyHostModal`, movement-selection row colors, pane min-width

### Standalone Army host (not map)

- `Templates/landUnitsTemplate.html` — inline Existing Army tab (no modal host)

## Important integration points

- Movement X shares `tsMovementList`; no separate persistence API.
- `selectMovementXArmyUnit(unit, 'item'|'fed')` adapts Existing Army rows to `selectMovementOrderItem()`.
- `selectMovementXNavyShip(ship, 'item'|'fleet')` adapts Existing Navy rows to `selectMovementOrderItem()`.
- Bindings on the map hosts:
  - `on-movement-select`
  - `is-movement-unit-moved` / `is-movement-unit-boarded` / `is-movement-unit-disabled`
  - `picker-position-filter` / `picker-sphere-filter`
  - `selected-movement-item-no` / `selected-movement-type`
  - `on-form-federation-saved` (army)

## Picker split: Movement X vs standard Movement

### Movement X

```html
<existing-army movement-selection="true" modal-mode="movementXModalMode" ...></existing-army>
<existing-navy movement-selection="true" modal-mode="movementXModalMode" ...></existing-navy>
```

- Full Existing Army/Navy layouts, filtered by map coordinate or sphere.
- Army: row click → item; `Move Fed` → fed TS18 `itemNo`.
- Navy: row click → item; `Move Fleet` → fleet TS18 `itemNo`.

### Standard Movement

- `Templates/turnMapsMovementPickerTableTemplate.html`
- Flat `itemGridRows` from `turnReport.movementItemList`
- Item / Fed chips call `selectMovementOrderItem(...)`
- Effective Fed/Fleet from `movementFormFederationRows` (TS14) via movement picker + assignment resolver helpers

## TS18 order creation path

```text
Movement X row / Move Fed / Move Fleet / standard picker chip
  -> selectMovementOrderItem(...)
  -> current or next empty tsMovementList row
  -> itemNo, type, MP, X/Y written
  -> route selection or manual direction/distance
  -> queueAutoSaveTsGrid('Movement')
  -> TS18 persistence
```

Key source:

- `App/turnMaps/turnMapsOrderNavigationFactory.js` — `selectMovementOrderItem()`
- `App/turnMapsController.js` — `selectMovementXArmyUnit()`, `selectMovementXNavyShip()`

## Known technical debt / risks

- Existing Army/Navy factories attach many methods directly to scope.
- Movement selection uses a separate one-row-per-commander table (duplicated commander markup).
- Wide right pane uses a 1050px minimum army-table width and may need horizontal scrolling.
- Existing Army directive and Turn Maps both touch shared `masterData.turnReport`; watchers handle load races.
- Nested boarding / form-federation modals stack above the Movement X host; z-index and close behavior must stay consistent when changing the shell.
- Full .NET build may be unavailable locally if `Microsoft.WebApplication.targets` is missing from the installed SDK path.

## Validation

- Prefer `node --check` on edited JS and `git diff --check`.
- No automated UI tests for this screen; verify in the browser: open Movement X picker as modal and as wide pane, select unit/fed, route, reload, confirm TS18 and highlighting.

## Related handoffs

- [Turn maps](docs/handoffs/turn-maps.md)
- [Army](docs/handoffs/army.md)
- [Navy](docs/handoffs/navy.md)
- [Existing Navy history](existing-navy-handoff.md)

## Recommended next-chat prompt

> Read `@movement-x-handoff.md` (and `@docs/handoffs/army.md` if touching the directive). Treat code as source of truth. Make the requested small fixes to the Movement X army modal/pane on Turn Maps without restructuring unrelated Army or Navy behavior.
