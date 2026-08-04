# Sea battles

## Scope

Route `/Military/SeaBattles` configures two fleets and runs a naval combat simulation.

## Main files

- Screen: `App/seaBattlesController.js`, `Templates/seaBattlesTemplate.html`
- Engine: `App/seaBattlesEngineFactory.js`

## Rules

This is a fully client-side, eight-round engine. It uses warship and merchant-ship inputs from the imported turn report; there is no server persistence endpoint. Rounds include long-range, hand-to-hand, and merchant-capture behavior, with morale scoped by nation.

## Verify

Configure representative fleets, run all rounds, then change a combat calculation and confirm that output remains deterministic for the same inputs.

## Related handoffs

- [Turn report import](01-turn-report-import.md)
