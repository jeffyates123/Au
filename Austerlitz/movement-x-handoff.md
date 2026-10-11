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
  - hides H/C, Train, Repair, and trailing `...` menus
- Boarding remains available in Movement X (brigade/commander boarding modal; spy boarding modal).
- Federation chip still opens Form Federation. Fleet chip still opens fleet assignment. After either save, Turn Maps refreshes via `on-form-federation-saved`.

### Movement X picker

- Map defaults to Movement X.
- Picker does not open initially. Item button or a coordinate click opens it.
- Item button clears the position filter, sets the sphere from the current map’s minimum X/Y, and does not show a yellow selection.
- Coordinate click:
  - any of your land units or ships at that X/Y → position filter only, sphere All, so the modal shows that square and no other
  - land unit presence includes brigades (`x_OrState` / `y_OrFleet`), not only `x` / `y`
  - empty land → Army view of all land units
  - empty sea → Navy view of all ships
  - sea with ships → Navy view; coastal shipyard still has the Army/Navy toggle, and a shipyard with only ships opens on Navy
  - no unit starts yellow-selected (`movementXPickerShowCurrentSelection` starts false)
- Display mode (`orderUi.movementPickerDisplayMode`):
  - `panel` when wide-screen setting is on, not Production Site mode, and viewport width ≥ `wideScreenMinViewportWidth` (1500 from `turnMapsConfigFactory`)
  - otherwise `modal` overlay
- Intelligence mode forces the picker closed and does not show Movement X hosts.
- Row click selects the individual unit (brigade / commander / spy / baggage train / ship).
- `Move Fed` beside Fed selects land federation movement (disabled when no fed). It also clears the position filter and sets the sphere to All.
- `Move Fleet` beside Fleet selects fleet movement (disabled when no fleet).
- After a selection, the overlay closes. The wide pane stays open.
- Current selection: yellow (`itemGridRowSelected`).
- Routed TS18 covering that unit/fed/fleet: light blue (`landUnitsMovementOrderExists`).
- Non-selectable army rows use grey disabled styling (`landUnitsMovementDisabled`). Navy rows do not get disabled styling.

### Provisional TS18 selection

- Selecting a unit, federation, or fleet writes the TS18 row and autosaves immediately, before a route exists.
- That write uses the current row when it is empty or still unrouted. A routed current row uses the next empty row.
- A route from a map click, or a manual direction/distance edit, autosaves again.
- Navigating away from an unrouted row clears it and autosaves the clear.
- Light-blue “moved” status requires direction/distance data, not selection alone.

### ID ranges used by Movement X highlighting / fleet pick

- Land federation numbers: 61–90. Army moved highlighting treats only this range as federation orders.
- Fleet numbers: 11–30. `Move Fleet` rejects anything outside that range in `selectMovementXNavyShip()`, and navy moved highlighting uses the same range.
- Commander numbers 1–10 and four-digit brigade numbers are the usual item ids. Highlighting matches the unit id; it does not check those ranges.
- A fleet order must not light up an army row as moved. Army highlighting only treats 61–90 as a federation order.

## Main files

### Reusable views

- `App/landUnits/existingArmyDirective.js`
- `Templates/existingArmyTemplate.html`
- `App/navalUnits/existingNavyDirective.js`
- `Templates/existingNavyTemplate.html`

### Turn Maps host and movement

- `Templates/turnMapsTemplate.html` — modal + pane hosts for Movement X
- `App/turnMapsController.js` — `selectMovementXArmyUnit`, `selectMovementXNavyShip`, disabled-row helper, display-mode flags
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
- Bindings on both map hosts:
  - `on-movement-select`
  - `is-movement-unit-moved`
  - `picker-position-filter` / `picker-sphere-filter`
  - `selected-movement-item-no` / `selected-movement-type`
  - `on-form-federation-saved`
- Army hosts also bind `is-movement-unit-disabled`. Navy hosts do not.

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
  -> current unrouted row, or next empty tsMovementList row
  -> itemNo, type, MP, X/Y written; route segments cleared
  -> queueAutoSaveTsGrid('Movement')
  -> route selection or manual direction/distance
  -> queueAutoSaveTsGrid('Movement') again
```

Key source:

- `App/turnMaps/turnMapsOrderNavigationFactory.js` — `selectMovementOrderItem()`
- `App/turnMapsController.js` — `selectMovementXArmyUnit()`, `selectMovementXNavyShip()`

## Known technical debt / risks

- Existing Army/Navy factories attach many methods directly to scope.
- Movement selection uses a separate one-row-per-commander table (duplicated commander markup).
- Wide right pane uses a 1050px minimum army-table width and may need horizontal scrolling.
- Existing Army directive and Turn Maps both touch shared `masterData.turnReport`; watchers handle load races.
- Nested boarding, form-federation, and fleet-assignment modals stack above the Movement X host; z-index and close behavior must stay consistent when changing the shell.
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
