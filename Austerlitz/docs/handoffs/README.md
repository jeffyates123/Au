# Austerlitz handoffs

Use this index before changing an application feature. Read only the matching screen handoff and any linked shared workflow; do not load every document.

## Start here

- Application startup, routes, shared client state, and API conventions: [Platform architecture](00-platform-architecture.md)
- Turn report upload or parsed report data: [Turn report import](01-turn-report-import.md)
- Any TS_01 to TS_23 endpoint or order-row change: [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
- Spreadsheet import, export, save, or clear: [Turnsheet Excel](03-turnsheet-excel.md)

## Screen and tab map

| Route or screen | Handoff |
| --- | --- |
| Load/Import | [Home and turnsheet viewer](home-and-turnsheet-viewer.md) |
| Economy | [Economy](economy.md) |
| Army: Set-Up Brigades, Existing Army, Intelligence | [Army](army.md) |
| Navy: Set-Up Navy, Existing Navy | [Navy](navy.md) |
| Trade: Trading, Baggage Trains, Trading Cities | [Trade](trade.md) |
| Math Battles and Stats | [Math battles](math-battles.md) |
| Sea Battles | [Sea battles](sea-battles.md) |
| Turn Maps and TS18 movement | [Turn maps](turn-maps.md) |
| Turnsheet read-only screens | [Home and turnsheet viewer](home-and-turnsheet-viewer.md) |
| Errors | [Turn order errors](turn-order-errors.md) |
| User Settings | [User settings](user-settings.md) |

## Shared workflows

- TS20 capacity, allocation, and boarding modals: [Boarding](boarding-ts20.md)
- Auto-generated TS01 cost/transfer rows: [Managed TS01 transfers](managed-ts01-transfers.md)
- TS14 federation and fleet assignment replay: [Federation assignment replay](federation-assignment-replay.md)
- Rules catalog and reference tables: [Rules and reference data](rules-and-reference-data.md)
- Entity Framework schema and table ownership: [Database schema](database-schema.md)

## Existing implementation handoffs

- [Movement X](../../movement-x-handoff.md) describes the reusable Army/Navy movement picker.
- [Existing Navy](../../existing-navy-handoff.md) records the reusable Existing Navy implementation history.

## Handoff maintenance

Update the relevant handoff in the same change when behavior, ownership, data flow, or a business rule changes. Keep it short: entry point, main files, data in/out, critical rules, verification, and links to shared workflows.
