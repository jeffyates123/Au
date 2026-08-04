# Turnsheet API and sections

## Purpose

Turnsheet data is the editable order set for a selected turn. TS01 through TS23 are separate order sections with independent shapes and limits.

## Main files

- API endpoints: `Controllers/TurnSheetApiController.cs`
- Domain read/write managers: `Austerlitz.Domain/TurnSheetManager*.cs`
- Repository: `Austerlitz.DAL/Management/TurnSheetRepository.cs`
- Client API wrapper: `App/turnSheetFactory.js`
- Section labels, columns, and limits: `App/turnSheet/turnSheetSectionsFactory.js`

## Conventions

- API actions use `getTS{Type}` and `postTS{Type}` naming.
- A screen owns only the sections it creates or edits; do not rewrite unrelated section rows.
- Preserve order numbers, row limits, and column layouts in `turnSheetSectionsFactory.js`.
- Autosave timings are feature-specific. Keep the existing debounce behavior unless there is a demonstrated data-loss issue.

## Verify

For a changed section, create/edit/delete an order, reload the selected turn, inspect the read-only Turnsheet route, and confirm other screens still replay the order correctly.

## Related handoffs

- [Turnsheet Excel](03-turnsheet-excel.md)
- [Managed TS01 transfers](managed-ts01-transfers.md)
- [Boarding](boarding-ts20.md)
- [Federation assignment replay](federation-assignment-replay.md)
