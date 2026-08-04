# Economy

## Scope

Route `/Section/Economy` shows warehouse, production-site, and build/maintain information for Europe, Caribbean, and India. It has Build & Maintain and Production modes.

## Main files

- Controller/template: `App/economyController.js`, `Templates/economyTemplate.html`
- Focused client modules: `App/economy/economyConfigFactory.js`, `economyParseUtilsFactory.js`, `economyResourceFactory.js`, `economySphereFactory.js`, `economyProductionFactory.js`, `economyTradeFactory.js`
- Report API: `Controllers/TurnReportApiController.EconomySummary.cs`
- Import parser: `Services/TurnReportImportService.Economy.cs`
- Data model: `Austerlitz.DAL/TR_Economy*.cs`
- Computed-summary migration: `database/2026-07-11-create-tr-economy-computed-summary.sql`
- Banner integration: `App/menuController.js`

## Rules

Warehouses 1–3 correspond to the regional spheres. Economy writes the computed report summary, not turnsheet orders. Build-fund changes notify the navigation banner through the `economyBuildFundsChanged` event.

## Verify

Switch all three spheres and both modes. Confirm production-site rows, computed totals, and the banner build-fund values after reloading the selected turn.

## Related handoffs

- [Turn report import](01-turn-report-import.md)
- [Database schema](database-schema.md)
