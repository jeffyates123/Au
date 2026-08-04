# Rules and reference data

## Purpose

Reference data supplies game rules and lookup values used throughout the client and import calculations.

## Main files

- API: `Controllers/RulesCatalogApiController.cs`
- Domain/data access: `Austerlitz.Domain/ReferenceManager.cs`, `Austerlitz.DAL/Management/RefManager.cs`
- Entity tables: `Austerlitz.DAL/REF_*.cs`
- Client catalog: `App/rulesCatalogFactory.js`

## Rules

The rules catalog includes army data, terrain/factors, states, production sites, and ships. It is loaded into `masterData.RulesCatalog`. `REF_*` rows are source-of-truth rules, not per-turn report snapshots.

Regional map files are also uploaded through the rules catalog API. Treat file format changes as compatibility changes for Turn Maps.

## Verify

Reload the selected turn/application data, verify the affected lookup renders in each dependent screen, and test a calculation that consumes the changed factor.

## Related handoffs

- [Platform architecture](00-platform-architecture.md)
- [Math battles](math-battles.md)
- [Turn maps](turn-maps.md)
- [Turn order errors](turn-order-errors.md)
