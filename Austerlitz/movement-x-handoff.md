# Movement X handoff

## Goal

Continue replacing the Turn Maps movement picker with a reusable Existing Army view.

`Movement X` must reuse current Movement behavior:

- TS18 movement orders
- movement route calculation and map highlighting
- MP calculation
- order navigation
- autosave

For now, Movement X selects only army brigades and commanders.

## Current behavior

### Existing Army reuse

- `existingArmy` AngularJS directive owns Existing Army data loading, replay, state, and actions.
- Army > Existing Army still works normally.
- Checkbox beside Existing Army opens same directive in modal mode.
- Modal mode:
  - hides Federation Summary
  - blocks rename
  - makes battalion lozenges inert
  - hides H/C and Train
  - removes battalion training/headcount colors
  - hides trailing `...` menus
- The directive supports optional Movement X selection bindings.

### Movement X

- Map defaults to `Movement X`.
- Picker does not open initially.
- Item button opens picker for current map sphere.
- Clicking a map coordinate:
  - if army brigades/commanders exist there, picker shows only those units
  - otherwise picker shows all army units in that coordinate's sphere
  - no unit starts yellow-selected
- Narrow screen: picker opens as overlay modal.
- Wide-screen layout: picker opens in right-side pane and map stays visible.
- Commander selection layout is one commander per row.
- Clicking a brigade/commander row selects that individual unit.
- `Move Fed` beside Fed value selects federation movement.
- `Move Fed` is disabled when unit has no federation.
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

### New

- `App/landUnits/existingArmyDirective.js`
- `Templates/existingArmyTemplate.html`

### Modified

- `App/landUnits/landUnitsStateFactory.js`
- `App/turnMaps/turnMapsConfigFactory.js`
- `App/turnMaps/turnMapsMapSelectionFactory.js`
- `App/turnMaps/turnMapsOrderNavigationFactory.js`
- `App/turnMaps/turnMapsSharedFactory.js`
- `App/turnMapsController.js`
- `Content/Site.css`
- `Templates/landUnitsTemplate.html`
- `Templates/turnMapsTemplate.html`
- `Views/Shared/_Layout.cshtml`

## Important integration points

- Movement X shares `tsMovementList`; no new backend persistence/API.
- `selectMovementXArmyUnit()` adapts Existing Army rows to current `selectMovementOrderItem()`.
- `turnMapsMovementPickerDisplayMode` controls modal versus right-side panel.
- `existingArmy` selection callbacks:
  - `on-movement-select`
  - `is-movement-unit-moved`
- Selection filters:
  - `picker-position-filter`
  - `picker-sphere-filter`
- Current selection bindings:
  - `selected-movement-item-no`
  - `selected-movement-type`

## Known technical debt / risks

- Existing Army factories attach many methods directly to scope.
- Movement selection has a separate one-row-per-commander table, duplicating some commander markup.
- Wide right pane uses a 1050px minimum army-table width and may need horizontal scrolling.
- Existing Army directive and Turn Maps both load/reuse shared `masterData.turnReport`; report watchers were added to handle load races.
- Commander list still uses existing 10-commander cap.
- Full .NET build was not available locally because `Microsoft.WebApplication.targets` is missing from the installed dotnet SDK path.

## Validation completed

- Modified JavaScript files pass `node --check`.
- `git diff --check` passes.
- No automated UI tests exist for this screen.
- Changes are uncommitted.

## Recommended next-chat prompt

> Read `@movement-x-handoff.md`, inspect the current git diff, and continue improving Movement X. Treat the code and git diff as source of truth. First verify the latest picker behavior in the browser, then implement my next requested change without restructuring unrelated code.
