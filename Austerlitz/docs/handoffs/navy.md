# Navy

## Scope

Route `/Section/Naval` has Set-Up Navy and Existing Navy tabs. It handles ship builds, repairs, fleet assignment, federation replay, transfers, and renames.

## Main files

- Host controller/template: `App/navalUnitsController.js`, `Templates/navalUnitsTemplate.html`
- Existing Navy directive: `App/navalUnits/existingNavyDirective.js`, `Templates/existingNavyTemplate.html`
- Navy factories: `App/navalUnits/*.js`
- Assignment replay: `App/turnAssignmentResolverFactory.js`

## Order ownership

- TS01: managed transfer/cost rows for builds and repairs.
- TS09: repairs.
- TS10: ship builds.
- TS14: fleets/federations.
- TS22: renames.

Fleet numbers are 11–59. Existing Navy is also used by Turn Maps Movement X, so preserve its standalone and modal modes.

## Verify

Create or replay a ship build/repair, check its TS01 companion rows, reload Existing Navy, and open the Movement X picker if the directive changed.

## Related handoffs

- [Managed TS01 transfers](managed-ts01-transfers.md)
- [Federation assignment replay](federation-assignment-replay.md)
- [Existing Navy](../../existing-navy-handoff.md)
- [Movement X](../../movement-x-handoff.md)
