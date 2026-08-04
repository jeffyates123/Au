# Database schema

## Purpose

This is the data-ownership guide for changes that cross imported reports, editable orders, rules, or migrations.

## Main files

- Entity Framework model: `Austerlitz.DAL/AusterlitzDB1.edmx`, `Austerlitz.DAL/AusterlitzDB1.edmx.sql`
- Entity classes: `Austerlitz.DAL/TR_*.cs`, `Austerlitz.DAL/TS_*.cs`, `Austerlitz.DAL/REF_*.cs`
- Database scripts: `database/*.sql`
- Connection configuration: `Web.config`

## Ownership convention

- `TR_*`: imported report snapshot data for a turn.
- `TS_*`: editable user turn orders.
- `REF_*`: game-wide reference/rule data.

Do not use a report table as a substitute for a turnsheet order, or vice versa. Add a migration and update the EDMX/entity layer together when introducing persistent schema changes.

## Verify

Apply the migration to a disposable local database, regenerate/update the model as the project convention requires, then import a report and create an affected turnsheet order.

## Related handoffs

- [Platform architecture](00-platform-architecture.md)
- [Turn report import](01-turn-report-import.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
- [Rules and reference data](rules-and-reference-data.md)
