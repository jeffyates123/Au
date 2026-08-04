# Turn report import

## Purpose

The Load/Import screen uploads a text turn report, parses it, and stores a report snapshot used by every feature screen.

## Main files

- Upload endpoint: `Controllers/FileLoadApiController.cs`
- Parser orchestration: `Services/TurnReportImportService.cs`
- Feature parsers: `Services/TurnReportImportService.*.cs`
- Client upload/status UI: `App/homeController.js`, `Templates/homeTemplate.html`

## Flow

1. The browser posts a multipart file.
2. The server stores it under `App_Data/TurnUploads`.
3. `TurnReportImportService` parses report sections in dependency order.
4. Parsed rows are stored in `TR_*` tables for the selected turn ID.
5. The client reloads shared turn data and exposes import errors/status.

The turn ID follows `AU-{gameNo}{state}{turn}`. Import failures are surfaced with the `loadTurnReport:` context; preserve that context when changing errors.

## Change safety

- Keep parser ordering: later parsers can depend on earlier imported rows.
- Test with a representative file in `Turns/`.
- Verify Load/Import status, target screen data, and the Errors screen after a parser change.

## Related handoffs

- [Platform architecture](00-platform-architecture.md)
- [Turn order errors](turn-order-errors.md)
- [Economy](economy.md)
- [Math battles](math-battles.md)
