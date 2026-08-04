# Turnsheet Excel

## Purpose

The application imports, exports, saves, and clears turnsheet spreadsheets using the project template.

## Main files

- Spreadsheet service: `Services/TurnsheetExcelService.cs`, `Services/TurnsheetExcelService.Read.cs`
- Spreadsheet API actions: `Controllers/TurnSheetApiController.Spreadsheet.cs`
- Client import/export actions: `App/homeController.js`, `App/turnSheetFactory.js`
- Template: `Excel Turnsheet.xlsx`

## Rules

- A selected turn ID is required before import.
- The template's worksheet and row layout maps to TS01–TS23 sections.
- Import reports failures per section through `failedSections`; do not hide partial failures.
- Save/export and clear affect turnsheet orders, not imported turn-report data.

## Verify

Use a copy of the template: import it, check the reported sections, open Turnsheet read-only views, export, and confirm a clear removes only the intended orders.

## Related handoffs

- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
- [Home and turnsheet viewer](home-and-turnsheet-viewer.md)
