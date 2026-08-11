# Army

## Scope

Route `/Military/Brigades` has Set-Up Brigades, Existing Army, and Intelligence tabs. It combines report data with editable brigade, federation, training, and boarding orders.

## Main files

- Host controller/template: `App/landUnitsController.js`, `Templates/landUnitsTemplate.html`
- Existing Army directive: `App/landUnits/existingArmyDirective.js`, `Templates/existingArmyTemplate.html`
- Army factories: `App/landUnits/*.js`
- Intelligence: `App/intelligenceController.js`, `App/intelligence/intelligenceBoardingFactory.js`

## Order ownership

- TS03: set up brigades.
- TS05/TS06: headcount and experience.
- TS07/TS08: exchange and merge battalions.
- TS14: federations.
- TS20: boarding.
- TS22: renames.

Existing Army is reusable. Preserve these hosts:

- Army tab inline view
- Turn Maps Movement X modal/pane with `movement-selection="true"` (the map “army modal”)

Do not add screen-only assumptions to the directive. Map Movement X behavior lives in [Movement X](../../movement-x-handoff.md).

## Verify

Create an order in each changed action, reload the turn, and confirm replay on Existing Army. For directive changes, also open Turn Maps Movement X in both modal and wide pane layouts. Confirm Federation Summary **Load Cap** is non-zero for federations with brigades once the army list has loaded.

## Related handoffs

- [Boarding](boarding-ts20.md)
- [Managed TS01 transfers](managed-ts01-transfers.md)
- [Federation assignment replay](federation-assignment-replay.md)
- [Movement X](../../movement-x-handoff.md)
- [Turn maps](turn-maps.md)
