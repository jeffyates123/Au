# Sea Battles

## Scope

`/Military/SeaBattles` has two modes:

1. Imported-battle viewer for `TR_SeaBattle*` report snapshots loaded per turn.
2. Client-side calculator for hypothetical fleets and an eight-round simulation.

Imported data is read-only. The simulator remains client-side and does not write
turnsheet orders.

## Entry points and ownership

- Route: `App/App.js`
- Sidebar link and script registration: `Views/Shared/_Layout.cshtml`
- Screen state, validation, and catalog mapping: `App/seaBattlesController.js`
- Combat rules and result construction: `App/seaBattlesEngineFactory.js`
- Fleet builder and round/result display: `Templates/seaBattlesTemplate.html`
- Styling: the `.seaBattles*` rules in `Content/Site.css`
- Reference-data API: `App/rulesCatalogFactory.js`,
  `Controllers/RulesCatalogApiController.cs`,
  `Austerlitz.Domain/ReferenceManager.cs`
- Turn-report API: `App/turnReportFactory.js`,
  `Controllers/TurnReportApiController.SeaBattles.Query.cs`
- Import parser: `Services/TurnReportImportService.SeaBattles.cs`
- Persistence: `database/2026-08-19-create-tr-seabattles.sql`,
  `TR_SeaBattles`, `TR_SeaBattleShips`, `TR_SeaBattleLongRangeActions`,
  `TR_SeaBattleBoardingActions`, `TR_SeaBattleMerchantCaptures`
- Reference entities: `Austerlitz.DAL/REF_Ships.cs` and
  `Austerlitz.DAL/REF_States.cs`

## Data flow

1. `initSeaBattles()` loads rules-catalog data for simulator options and
   `getTRSeaBattles(turnId)` data for imported battle history.
2. Imported battles come from `TR_SeaBattle*` and are selected by battle number.
   The user can copy PRE warships into the simulator with one line per ship,
   preserving imported name/tonnage/marines overrides.
3. Nations come from `RulesCatalog.States`. Fleet A defaults to
   `masterData.selectedState` when available; Fleet B defaults to the first
   different state.
4. The ship picker uses distinct `RulesCatalog.Ships` rows with a positive
   `ShipClass` and `Type <= 25`. This deliberately presents warships only.
5. Each fleet line contains a ship type and quantity. Imported rows may also
   carry name/tonnage/marine overrides for exact report replay inputs.
6. Before simulation, the
   controller removes invalid/empty lines and passes nation codes, fleet lines,
   and the full ship reference list to `seaBattlesEngineFactory.simulate()`.
7. The engine expands quantities into individual mutable ship records, resolves
   all rounds in memory, and returns round reports, fleet loss summaries, and a
   winner. Refreshing or navigating away discards the result.

The engine consumes these `REF_Ships` fields:

- `Type`: lookup key and part of the generated ship ID.
- `Name`: display name; the first number in the name is treated as cannon count.
- `Wood`: initial tonnage.
- `Citizens`: initial marine count.
- `ShipClass`: targeting, damage, and boarding rules.

When an imported simulator row includes `importedName`, `importedTonnage`, or
`importedMarines`, those values override the reference defaults for that row.

## Combat rules

The round order is fixed:

1. Rounds 1-3: long-range combat by all active ships.
2. Rounds 4-5: hand-to-hand combat by boarding ships.
3. Round 6: long-range combat by ships that did not board.
4. Round 7: long-range combat by all active ships.
5. Round 8: merchant capture placeholder.

Long-range combat:

- Ships fire in class/ID order and choose the lowest-class, lowest-tonnage,
  lowest-ID eligible target. Resolution is sequential, so earlier attacks can
  change later target selection. A ship sunk earlier in the round does not fire.
- Class 1-2 ships normally target classes 1-3. They may target classes 4-5 only
  when their side has no small ships and the enemy has at least three small
  ships per friendly large ship. Class 3-5 ships can target every class.
- Class 4-5 attacks against class 1-2 targets have 50% effectiveness.
- Combat power is
  `(cannons / 2) * 2 * sqrt(morale) * condition * sqrt(attacker class)`.
  Tonnage loss is `CP / sqrt(target class)` and marine loss is `CP / 6`.
  The engine rounds with JavaScript `Math.round`.

Hand-to-hand combat:

- A ship can board an enemy within one class; class 3 can also board classes
  4-5. Unengaged compatible targets are preferred.
- A ship already involved as an attacker or target does not start a reciprocal
  engagement later in the same round.
- Each engagement has up to three attacks. Combat power is
  `(marines * 1.5) / 6`, and each side's rounded combat power becomes the
  opponent's marine loss.
- A ship is captured only when one side has strictly more than three times the
  other's remaining marines and the losing side still has marines. The winner's
  marines are halved, rounded, and assigned to both ships.
- Boarding participation excludes the ship from round 6.

Morale is hard-coded in `MORALE_BY_NATION`, not read from
`REF_States.FleetMorale`. Unknown nations default to 4. Nation `M` uses morale 6
for ship types 3 and 9; otherwise its morale is 5.

The winner is the fleet with the lower average of its tonnage-loss percentage
and marine-loss percentage. A difference below 8 percentage points is a draw.
Captured or sunk original ships contribute no remaining tonnage or marines to
their original fleet.

## Output contract

`simulate()` returns:

- `nationA` and `nationB`
- `rounds`, each with per-fleet action/CP/loss totals and expandable details
- `fleetAStats` and `fleetBStats`, containing before/after values and loss
  percentages
- `victory`, containing `winnerCode`, `winnerText`, and `lossDifferencePct`

The template relies directly on these property names. Treat renames as a
controller/template compatibility change.

## Known limitations and risks

- Round 8 does not implement merchant capture. It returns
  `Merchant capture skipped in v1 (warships-only fleet builder).`
- Imported-battle persistence exists only in SQL `TR_SeaBattle*`; there are no
  mutation endpoints for editing imported battle rows.
- There are no focused automated tests for the controller or engine. Formula,
  rounding, ordering, and capture changes therefore need manual regression
  checks or new unit coverage.
- Cannon count depends on the first digits in `REF_Ships.Name`; a naming change
  can silently change combat power.
- Morale duplicates reference data and can drift from `REF_States.FleetMorale`.

## Change guide

- Fleet-builder or validation changes belong in `seaBattlesController.js` and
  `seaBattlesTemplate.html`.
- Formula, targeting, round order, capture, morale, or winner changes belong in
  `seaBattlesEngineFactory.js`.
- Ship or state field changes must remain compatible with the rules-catalog JSON
  shape. The controller and engine accept both PascalCase and camelCase ship
  fields.
- Preserve deterministic ordering unless a rules change explicitly requires
  randomness. There is currently no random-number input or tie-breaker.

## Verification

1. Open `/Military/SeaBattles`; confirm the selected state defaults Fleet A and
   Fleet B selects a different state.
2. Confirm ship labels show type, name, class, and marine count from the rules
   catalog.
3. Import `Turns/136F0508.txt`, then confirm Naval Battle 2 appears with initial
   fleets, long-range rounds, boarding rounds, winner summary, and final fleets.
4. Import `Turns/307G0009_06.txt` and confirm merchant-capture rows render.
5. Verify `Load initial warships into simulator` creates one line per PRE
   warship with imported name/tonnage/marines hints.
6. Verify validation rejects equal/missing nations and either empty fleet.
7. Run the same fleets twice and compare winner, loss totals, and expanded round
   details.
8. Exercise small-versus-large targeting, the class 4-5 effectiveness penalty,
   boarding/capture, round 6 boarding exclusion, and a ship sunk before its turn.
9. Confirm round 8 clearly reports that merchant capture is skipped.
10. For formula or reference-data changes, test nation `M` with ship types 3 and
   9 and at least one ordinary nation.
11. Repeat one ship type on separate fleet lines and confirm round details contain
   unique ship IDs.
12. Use damage greater than the target's remaining tonnage or marines and confirm
   round losses are capped at the amount the target actually had.
13. Re-import the same turn and confirm no duplicate `TR_SeaBattle*` rows for the
    same `TurnId`.
14. If deploying, inspect the publish/package output for both JavaScript files
    and the template.

## Related handoffs

- [Platform architecture](00-platform-architecture.md)
- [Turn report import](01-turn-report-import.md)
- [Rules and reference data](rules-and-reference-data.md)
- [Navy](navy.md)
