# Economy

## Scope

Route `/Section/Economy` shows warehouse, production-site, and build/maintain information for Europe, Caribbean, and India. Sphere tabs have Build & Maintain and Production modes. Tax Revenue is the first tab on `/Section/Intelligence`.

## Main files

- Controller/template: `App/economyController.js`, `Templates/economyTemplate.html`
- Tax Revenue tab: `App/intelligencePageController.js`, `Templates/intelligenceTemplate.html`, `App/intelligenceTaxRevenueController.js` (nested controller on the Intelligence Tax Revenue pane)
- Focused client modules: `App/economy/economyConfigFactory.js`, `economyParseUtilsFactory.js`, `economyResourceFactory.js`, `economySphereFactory.js`, `economyProductionFactory.js`, `economyTradeFactory.js`
- Report API: `Controllers/TurnReportApiController.EconomySummary.cs`
- Import parser: `Services/TurnReportImportService.Economy.cs`
- Data model: `Austerlitz.DAL/TR_Economy*.cs`
- Computed-summary migration: `database/2026-07-11-create-tr-economy-computed-summary.sql`
- Banner integration: `App/menuController.js`

## Rules

Warehouses 1–3 correspond to the regional spheres. Economy writes the computed report summary, not turnsheet orders. Build-fund changes notify the navigation banner through the `economyBuildFundsChanged` event.

Trade money estimates call `App/trade/tradePriceFactory.js`. Do not copy that price formula into Economy.

`economyTabs` is Europe, Caribbean, and India only. Computed-summary and warehouse refresh loops must use `sphereByTab` only.

Tax Revenue deep link: `/Section/Intelligence?tab=taxRevenue`. An old `/Section/Economy?tab=taxRevenue` link redirects there.

## Verify

Switch Europe, Caribbean, and India. Confirm both modes, production-site rows, computed totals, and the banner build-fund values after reloading the selected turn. Open Intelligence and confirm Tax Revenue is the first tab, with country columns and production matrices.

## Related handoffs

- [Turn report import](01-turn-report-import.md)
- [Database schema](database-schema.md)
