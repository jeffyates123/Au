# Turn maps and movement

## Scope

Route `/TurnMaps` renders regional maps and overlays for Terrain, State, Production Site, Intelligence, Movement, and Movement X. Movement edits TS18 orders.

## Main files

- Host controller/template: `App/turnMapsController.js`, `Templates/turnMapsTemplate.html`
- Map factories: `App/turnMaps/*Factory.js`
- Movement data API: `Controllers/TurnReportApiController.cs`

## Rules

The map supports Europe, Caribbean, and India with coordinate/sphere-aware data. Selecting a movement item writes the TS18 row and autosaves immediately. Leaving an unrouted row clears it and autosaves the clear. A route consumes movement points and autosaves again.

Movement X embeds reusable Existing Army and Existing Navy views:

- Overlay host: `existingArmyHostModal` (narrow / non-panel)
- Right pane host: `turnMapsMovementXPane` (wide screen)
- Both pass `modal-mode` and `movement-selection`

Selection, filtering, disabled-row highlighting, shipyard Army/Navy toggle, and provisional-selection rules are documented in [Movement X](../../movement-x-handoff.md).

## Verify

Switch every overlay and region. For movement changes, select an item, route it, reload the turn, and check TS18. Test both ordinary Movement and Movement X, including modal and wide-pane picker layouts where the shared picker is affected.

## Related handoffs

- [Movement X](../../movement-x-handoff.md)
- [Army](army.md)
- [Navy](navy.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
