# User settings

## Scope

Route `/UserSettings` manages browser-local user preferences, currently the wide-screen layout option.

## Main files

- `App/userSettingsController.js`
- `Templates/userSettingsTemplate.html`

## Rules

Settings are local browser preferences, not turn data and not server-persisted game state. Keep their storage keys backward-compatible or provide a migration/default.

## Verify

Change the preference, reload the page, and confirm the layout responds while the selected turn and its orders remain unchanged.
