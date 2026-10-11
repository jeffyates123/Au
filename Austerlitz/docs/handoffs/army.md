# Army

## Scope

Route `/Military/Brigades` has Set-Up Brigades, Existing Army, and Intelligence tabs. It combines report data with editable brigade, federation, training, and boarding orders.

Existing Army sections, top to bottom: Federation Summary (starts collapsed), Commanders (first 10, starts collapsed), Brigades, Spies, Baggage Trains. Baggage trains are report rows on this tab. They are selectable in Movement X, and they have no boarding or federation actions here.

## Main files

- Host controller/template: `App/landUnitsController.js`, `Templates/landUnitsTemplate.html`
- Existing Army directive: `App/landUnits/existingArmyDirective.js`, `Templates/existingArmyTemplate.html`
- Army factories: `App/landUnits/*.js`
- Spy boarding on Existing Army: `App/intelligence/intelligenceBoardingFactory.js`
- Intelligence tab: `App/intelligenceController.js`

## Order ownership

- TS02: demolish battalions (Existing Army).
- TS03: set up brigades (Set-Up Brigades tab).
- TS04: add battalions to an existing brigade (Existing Army).
- TS05/TS06: headcount and experience.
- TS07/TS08: exchange and merge battalions.
- TS14: federations.
- TS20: boarding for brigades, commanders, and spies. Spy boarding uses its own modal. On Existing Army and Movement X, Board lists every brigade at the selected coordinate so each can be boarded or unloaded on its own. A brigade may board past available fleet capacity; the modal warns and still saves.
- TS22: renames.

The brigade `...` menu is not the order surface. Only Form Federation in that menu is wired. The other labels alert that they are not implemented. Live actions are the row controls and the battalion lozenge menu.

Existing Army is reusable. Preserve these hosts:

- Army tab inline view (`master-data` only)
- Turn Maps Movement X modal/pane with `modal-mode` and `movement-selection="true"` (the map “army modal”)

Do not add screen-only assumptions to the directive. Map Movement X behavior lives in [Movement X](../../movement-x-handoff.md).

## Verify

Create an order in each changed action, reload the turn, and confirm replay on Existing Army. For directive changes, also open Turn Maps Movement X in both modal and wide pane layouts. Confirm Federation Summary **Load Cap** is non-zero for federations with brigades once the army list has loaded. Weights come from `armyListByShortName`. A missing troop type still counts as infantry weight.

## Related handoffs

- [Boarding](boarding-ts20.md)
- [Managed TS01 transfers](managed-ts01-transfers.md)
- [Federation assignment replay](federation-assignment-replay.md)
- [Movement X](../../movement-x-handoff.md)
- [Turn maps](turn-maps.md)
