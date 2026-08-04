# Platform architecture

## Purpose

Austerlitz is an ASP.NET MVC application hosting an AngularJS single-page application. MVC serves the shell; AngularJS owns feature routes and templates.

## Entry points

- Client routes and controllers: `App/App.js`
- Shell, navigation, turn selector, and build-fund banner: `Views/Shared/_Layout.cshtml`
- Shared selected-turn state: `App/masterDataFactory.js`
- Turn/report loading: `App/turnDataLoaderService.js`
- MVC and Web API routing: `App_Start/RouteConfig.cs`, `App_Start/WebApiConfig.cs`

## Data flow

1. The user selects a game, state, and turn.
2. `masterData` holds the selection and the loaded turn report/turnsheet data.
3. `turnDataLoaderService.loadTurn()` loads report and order data for that selection.
4. AngularJS controllers render templates and post edited turnsheet rows through `/Api/{controller}/{action}`.

The application has no authentication boundary, background workers, or third-party APIs. Its persistent data is SQL Server LocalDB through Entity Framework.

## Conventions

- `TR_*` tables are imported turn-report snapshots; treat them as report data, not user orders.
- `TS_*` tables are editable turnsheet orders.
- `REF_*` tables are rules/reference data.
- A route change normally requires updates in `App/App.js`, a controller, and a template.

## Related handoffs

- [Turn report import](01-turn-report-import.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
- [Rules and reference data](rules-and-reference-data.md)
- [Database schema](database-schema.md)
