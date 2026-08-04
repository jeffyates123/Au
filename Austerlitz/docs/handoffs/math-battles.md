# Math battles

## Scope

`/Military/MathBattles` displays imported battles and supports estimated/model battles. `/Military/MathBattles/Stats` shows a nation-scoped unit statistics table.

## Main files

- Client screen: `App/mathBattlesController.js`, `Templates/mathBattlesTemplate.html`
- Stats: `App/mathBattlesStatsController.js`, `Templates/mathBattlesStatsTemplate.html`
- Combat helper: `App/mathBattlesCombatHelperFactory.js`
- Report API/import: `Controllers/TurnReportApiController.MathBattles.*.cs`, `Services/TurnReportImportService.MathBattles.cs`
- Estimated-outcome calculation: `Controllers/TurnReportApiController.MathBattles.Calculator.cs`
- Persistence: `Austerlitz.DAL/TR_MathBattle*.cs`

## Rules

The Initial, Result, and Final tabs represent distinct battle states. Imported, estimated, model, and federation-replacement battles have different provenance; preserve it. Combat calculations use terrain and troop-type factors. JSON names such as `LR1` and `H2H1` are compatibility-sensitive.

Estimated-battle loss allocation is isolated in the calculator partial. Keep its calculation order, rounding, casualty caps, and legacy `CalcArtileery` spelling unchanged unless accompanied by focused regression coverage.

## Verify

Load an imported battle, create or save an estimate if the change affects persistence, check all battle-state tabs, and confirm the Stats route still renders from the selected nation's army list.

## Related handoffs

- [Turn report import](01-turn-report-import.md)
- [Rules and reference data](rules-and-reference-data.md)
