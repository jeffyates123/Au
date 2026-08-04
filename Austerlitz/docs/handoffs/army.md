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

Existing Army is reusable: it can run in the normal tab, a modal, or Turn Maps Movement X. Preserve those modes and do not add screen-only assumptions to the directive.

## Verify

Create an order in each changed action, reload the turn, and confirm replay on Existing Army. For directive changes, also open Turn Maps Movement X.

## Related handoffs

- [Boarding](boarding-ts20.md)
- [Managed TS01 transfers](managed-ts01-transfers.md)
- [Federation assignment replay](federation-assignment-replay.md)
- [Movement X](../../movement-x-handoff.md)
