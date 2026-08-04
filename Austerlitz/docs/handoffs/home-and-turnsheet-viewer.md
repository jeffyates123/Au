# Home, import, and turnsheet viewer

## Scope

- `/home`: upload a turn report, import a turnsheet spreadsheet, and show load status.
- `/TurnSheet`: read-only all-sections grid.
- `/TurnSheet/:section`: read-only single-section grid.

## Main files

- `App/homeController.js`, `Templates/homeTemplate.html`
- `App/turnSheet/turnSheetAllSectionsController.js`, `Templates/turnSheetAllSectionsTemplate.html`
- `App/turnSheet/turnSheetReadOnlySectionController.js`, `Templates/turnSheetSectionTemplate.html`
- `App/turnSheet/turnSheetSectionsFactory.js`

## Rules

Home requires a valid selected turn before spreadsheet actions. The viewer is a diagnostic/read-only view of TS01–TS23; its row-removal behavior must remain aligned with the owning section's API semantics.

The sidebar `Home` link (`/`) is not an AngularJS template route. Do not use it as an implementation entry point; use `/home`.

## Verify

Load a report or spreadsheet, confirm its status, then navigate to both the all-sections and a single-section viewer.

## Related handoffs

- [Turn report import](01-turn-report-import.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
- [Turnsheet Excel](03-turnsheet-excel.md)
