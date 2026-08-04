# Turn order errors

## Scope

Route `/Section/Errors` displays validation errors parsed from the imported turn report. The sidebar shows their count.

## Main files

- Client screen: `App/errorsController.js`
- Import parser: `Services/TurnReportImportService.TurnOrderErrors.cs`
- Report model: `Austerlitz.DAL/TR_TurnOrderErrors.cs`
- Error definitions: `Austerlitz.DAL/REF_TurnErrorCodes.cs`
- Migrations: `database/2026-07-14-create-ref-error-codes.sql`, `database/2026-07-14-create-tr-turn-errors.sql`

## Rules

Errors belong to imported turn-report data. The reference error-code table supplies their human-readable messages. Do not turn this screen into validation of locally edited turnsheet rows unless that boundary is deliberately redesigned.

## Verify

Import a report with known errors, confirm sorting/filtering and sidebar count, and verify the displayed code/message matches reference data.

## Related handoffs

- [Turn report import](01-turn-report-import.md)
- [Rules and reference data](rules-and-reference-data.md)
