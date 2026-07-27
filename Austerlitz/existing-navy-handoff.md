# Existing Navy handoff

## Next goal

Apply the Existing Army approach to the Existing Navy tab:

- Extract Navy's current Existing Navy display and actions into a reusable directive.
- Keep Navy > Existing Navy working as it does now.
- Add a modal-mode host, matching Existing Army's read-only modal behavior where appropriate.
- Reuse that view from the next Movement X/Navy movement picker work without adding persistence APIs.

Treat the current code and `git diff` as source of truth. Do not restructure unrelated Navy behavior.

## Existing Army pattern to copy

`existingArmy` is a reusable AngularJS directive:

- Directive: `App/landUnits/existingArmyDirective.js`
- Template: `Templates/existingArmyTemplate.html`
- It owns its own state, loads from `masterData.turnReport`, replays orders, and attaches existing factories to its isolated scope.
- Its callers pass `master-data`, `modal-mode`, and optional Movement X selection callbacks/bindings.
- Existing Army can render normally, in the Army modal host, or in the Movement X modal/right pane.

Use this as a structural reference only. Keep Navy implementation simple; do not force shared abstractions between Army and Navy unless existing code already supports them.

## Current Existing Army behavior

### Main view and modal

- Army > Existing Army uses `existing-army`.
- Modal mode hides Federation Summary, rename controls, H/C, Train, trailing action menus, and interactive battalion menus.
- Boarding remains available in Movement X.
- Existing Army outer nested tab-pane border was removed; its root class is now `landUnitsExistingArmyPane`.

### Movement X

- Map default is Movement X.
- Narrow screens use an overlay picker; wide screens use a right-side pane.
- Brigades, commanders, and spies are selectable individually for TS18.
- Land federation numbers are 61–90.
- Commander numbers are 1–10.
- Brigade numbers are four digits.
- Fleet federation numbers are 11–59 and must not affect Army moved highlighting.
- Current selection is yellow; a routed TS18 order is light blue.
- Selecting an item without route data is provisional and does not autosave.

### Existing Army sections

- Commanders are collapsible.
- Brigades are collapsible, initially expanded, with a shared localStorage preference:
  `austerlitz.landUnits.brigadesSectionCollapsed`.
- Spies appear below Brigades, one row each: Spy, Pos, Boarded, Report, MP, Board.
- Spy Boarding uses `spyBoardingModal`, separate from land-unit `boardingModal`.

## Important files

### Existing Army reusable view

- `App/landUnits/existingArmyDirective.js`
- `App/landUnits/landUnitsStateFactory.js`
- `App/landUnits/landUnitsModelFactory.js`
- `Templates/existingArmyTemplate.html`
- `Content/Site.css`

### Spy boarding isolation

- `App/intelligence/intelligenceBoardingFactory.js`
- `App/intelligenceController.js`
- `Templates/landUnitsTemplate.html`

## Current local changes

Modified:

- `App/intelligence/intelligenceBoardingFactory.js`
- `App/intelligenceController.js`
- `App/landUnits/existingArmyDirective.js`
- `App/landUnits/landUnitsModelFactory.js`
- `App/landUnits/landUnitsStateFactory.js`
- `Content/Site.css`
- `Templates/existingArmyTemplate.html`
- `Templates/landUnitsTemplate.html`

Untracked `Turns/Online Austerlitz - Spain 436.xlsx` is user data; do not modify or commit it unless explicitly requested.

## Validation completed

- Modified JavaScript files pass `node --check`.
- `git diff --check` passes.
- Manual browser checks performed for Existing Army layout and Movement X.
- No automated UI tests exist for these screens.

## Known risks

- AngularJS version does not support `$watchGroup`; use `$watch`.
- Existing views attach many methods to scope through factories.
- The Existing Army directive uses separate modal state for land-unit boarding and spy boarding; retain this separation in Navy if it has overlapping actions.
- Fixed-width table layouts require `<colgroup>` classes to be styled as well as header/body cells.

## Recommended next-chat prompt

> Read `@existing-navy-handoff.md`, inspect the current git diff, and implement a reusable Existing Navy view using Existing Army as a reference. Preserve Existing Navy behavior first, then add a modal host and prepare it for future Movement X reuse. Do not modify unrelated Army work or the untracked Spain Excel file.
