# Movement X handoff

## Goal

Document and continue the Turn Maps movement pickers, which reuse Existing Army and Existing Navy views in Movement X mode.

`Movement X` must reuse current Movement behavior:

- TS18 movement orders
- movement route calculation and map highlighting
- MP calculation
- order navigation
- autosave

Movement X supports army brigades, commanders, spies, warships, and merchant ships.

## Current behavior

### Existing Army and Existing Navy reuse

- `existingArmy` AngularJS directive owns Existing Army data loading, replay, state, and actions.
- `existingNavy` AngularJS directive owns Existing Navy data loading, replay, state, and actions.
- Army > Existing Army still works normally.
- Navy > Existing Navy still works normally.
- Movement X hosts both directives in movement-selection/modal mode.
- Standalone Existing Army/Navy screens retain their full management UI.
- Movement X modal mode:
  - hides Federation Summary
  - hides Fleet Summary
  - blocks rename
  - makes battalion lozenges inert
  - hides management actions such as H/C, Train, Repair, and fleet assignment
  - removes battalion training/headcount colors
  - hides trailing `...` menus
- Both directives support optional Movement X selection bindings.

### Movement X

- Map defaults to `Movement X`.
- Picker does not open initially.
- Item button opens picker for current map sphere.
- Clicking a map coordinate:
  - sea coordinate opens Navy view
  - coastal shipyard can switch between Army and Navy view
  - if relevant units exist at coordinate, picker filters to that X/Y
  - otherwise picker shows units in coordinate sphere
  - no unit starts yellow-selected
- Narrow screen: picker opens as overlay modal.
- Wide-screen layout: picker opens in right-side pane and map stays visible.
- Commander selection layout is one commander per row.
- Clicking a brigade, commander, spy, warship, or merchant row selects that individual item.
- `Move Fed` beside Fed value selects federation movement.
- `Move Fleet` beside Fleet value selects fleet movement.
- `Move Fed` is disabled when unit has no federation.
- `Move Fleet` is disabled when ship has no fleet.
- Current selected unit/federation is yellow.
- Units covered by a routed TS18 order are light blue.

### Provisional TS18 selection

- Selecting unit/federation alone does not POST TS18.
- Selecting another unit or switching Unit/Fed replaces current provisional choice.
- A route entered through map click triggers TS18 autosave.
- Manual direction/distance field changes trigger TS18 autosave.
- Navigating away clears an unrouted provisional choice.
- Light-blue moved status requires direction/distance data, not item selection alone.

## Main files

### Movement X directive hosts

- `App/landUnits/existingArmyDirective.js`
- `Templates/existingArmyTemplate.html`
- `App/navalUnits/existingNavyDirective.js`
- `Templates/existingNavyTemplate.html`

### Modified

- `App/landUnits/landUnitsStateFactory.js`
- `App/navalUnits/navalUnitsStateFactory.js`
- `App/navalUnits/navalUnitsFederationFactory.js`
- `App/turnAssignmentResolverFactory.js`
- `App/turnMaps/turnMapsConfigFactory.js`
- `App/turnMaps/turnMapsMapSelectionFactory.js`
- `App/turnMaps/turnMapsOrderNavigationFactory.js`
- `App/turnMaps/turnMapsMovementItemFactory.js`
- `App/turnMaps/turnMapsMovementPickerFactory.js`
- `App/turnMaps/turnMapsSharedFactory.js`
- `App/turnMapsController.js`
- `Content/Site.css`
- `Templates/landUnitsTemplate.html`
- `Templates/turnMapsTemplate.html`
- `Views/Shared/_Layout.cshtml`

## Important integration points

- Movement X shares `tsMovementList`; no new backend persistence/API.
- `selectMovementXArmyUnit()` adapts Existing Army rows to current `selectMovementOrderItem()`.
- `selectMovementXNavyShip()` adapts Existing Navy rows to `selectMovementOrderItem()`.
- `turnMapsMovementPickerDisplayMode` controls modal versus right-side panel.
- `existingArmy` selection callbacks:
  - `on-movement-select`
  - `is-movement-unit-moved`
- `existingNavy` uses equivalent callbacks for ship/fleet selection.
- Selection filters:
  - `picker-position-filter`
  - `picker-sphere-filter`
- Current selection bindings:
  - `selected-movement-item-no`
  - `selected-movement-type`

## Picker split: Movement X vs standard Movement

### Movement X

`Templates/turnMapsTemplate.html` hosts:

```html
<existing-army movement-selection="true" ...></existing-army>
<existing-navy movement-selection="true" ...></existing-navy>
```

- Uses full Existing Army/Navy row layouts, filtered by map coordinate or sphere.
- Army selection calls `selectMovementXArmyUnit(unit, 'item' | 'fed')`.
- Navy selection calls `selectMovementXNavyShip(ship, 'item' | 'fleet')`.
- `Move Fed` writes a TS18 order whose `itemNo` is federation number.
- `Move Fleet` writes a TS18 order whose `itemNo` is fleet number.

### Standard Movement

- Uses `Templates/turnMapsMovementPickerTableTemplate.html`.
- Shows a flat `itemGridRows` table from `turnReport.movementItemList`.
- Item chip calls `selectMovementOrderItem(itemRow, 'item')`.
- Fed/Fleet chip calls `selectMovementOrderItem(itemRow, 'fed')`.
- Effective Fed/Fleet values come from `movementFormFederationRows` (TS14) through:
  - `turnMapsMovementPickerFactory.buildMovementPickerEffectiveFederationLookup()`
  - `turnAssignmentResolverFactory.buildEffectiveMovementFederationLookup()`

## Navy federation and fleet orders

- Navy fleet assignment uses TS14 `FormFederations`.
- Per-ship order: `itemNo = ship item number`, `federation_Fleet = target fleet`.
- Fleet-level order: `itemNo = source fleet number`, `federation_Fleet = target fleet`.
- `turnAssignmentResolverFactory.resolveEffectiveShipFleetNoForShip()` applies either type to a ship.
- Movement uses fleet number as TS18 `itemNo` to move fleet together.
- `turnMapsMovementItemFactory.getFederationMovementSummary()` derives fleet movement MP, X/Y, and member list from effective fleet values.

## TS18 order creation path

```text
Movement X row / standard picker chip
  -> selectMovementOrderItem(...)
  -> current or next empty tsMovementList row
  -> itemNo, type, MP, X/Y written
  -> route selection or manual direction/distance
  -> queueAutoSaveTsGrid('Movement')
  -> TS18 persistence
```

Key source:

- `App/turnMaps/turnMapsOrderNavigationFactory.js`
  - `selectMovementOrderItem()`
  - `selectMovementOrderItemFromPickerRow()`
  - `getCurrentOrNextEmptyMovementOrderIndex()`
- `App/turnMapsController.js`
  - `selectMovementXArmyUnit()`
  - `selectMovementXNavyShip()`

## Known technical debt / risks

- Existing Army factories attach many methods directly to scope.
- Existing Navy factories also attach methods directly to scope.
- Movement selection has a separate one-row-per-commander table, duplicating some commander markup.
- Wide right pane uses a 1050px minimum army-table width and may need horizontal scrolling.
- Existing Army directive and Turn Maps both load/reuse shared `masterData.turnReport`; report watchers were added to handle load races.
- Commander list still uses existing 10-commander cap.
- Current reported issue is **Navy-only**:
  - Army `Move Brigade` and `Move Fed` correctly populate a provisional TS18 movement row.
  - Navy `Move Ship` and `Move Fleet` only yellow-highlight the selected row; no TS18 row is populated or selected.
  - Do not change working Army behavior while fixing this.
  - Compare `selectMovementXNavyShip()` in `App/turnMapsController.js` with working `selectMovementXArmyUnit()`, then trace their shared call to `selectMovementOrderItem()` in `App/turnMaps/turnMapsOrderNavigationFactory.js`.
- Full .NET build was not available locally because `Microsoft.WebApplication.targets` is missing from the installed dotnet SDK path.

## Validation completed

- Modified JavaScript files pass `node --check`.
- `git diff --check` passes.
- No automated UI tests exist for this screen.
- Changes are uncommitted.

## Recommended next-chat prompt

> Read `@movement-x-handoff.md`, inspect the current git diff, and continue improving Movement X. Treat the code and git diff as source of truth. First verify the latest picker behavior in the browser, then implement my next requested change without restructuring unrelated code.
