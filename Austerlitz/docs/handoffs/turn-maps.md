# Turn maps and movement

## Scope

Route `/TurnMaps` renders regional maps and overlays for Terrain, State, Production Site, Intelligence, Movement, and Movement X. Movement edits TS18 orders.

## Main files

- Host controller/template: `App/turnMapsController.js`, `Templates/turnMapsTemplate.html`
- Map factories: `App/turnMaps/*Factory.js`
- Movement data API: `Controllers/TurnReportApiController.cs`

## Rules

The map supports Europe, Caribbean, and India with coordinate/sphere-aware data. A movement route consumes movement points and autosaves TS18 only after route details exist. Do not treat an unrouted picker selection as a persisted movement order.

Movement X embeds reusable Existing Army and Existing Navy views. Its selection, filtering, modal/wide-screen behavior, and persistence rules are documented separately.

## Verify

Switch every overlay and region. For movement changes, select an item, route it, reload the turn, and check TS18. Test both ordinary Movement and Movement X where the shared picker is affected.

## Related handoffs

- [Movement X](../../movement-x-handoff.md)
- [Army](army.md)
- [Navy](navy.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
