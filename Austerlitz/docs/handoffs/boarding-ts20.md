# Boarding (TS20)

## Purpose

TS20 records boarding and unloading across several screens. Keep capacity and order-allocation rules shared even though each screen has a tailored modal.

## Main files

- Shared behavior: `App/boardingSharedFactory.js`
- Army behavior: `App/landUnits/landUnitsBoardingFactory.js`
- Intelligence behavior: `App/intelligence/intelligenceBoardingFactory.js`
- Trade behavior: `App/trade/tradeBoardingFactory.js`
- Persistence: `Austerlitz.DAL/TS_20Boarding.cs`

## Rules

Capacity, sphere selection from X/Y coordinates, and finding/allocating TS20 rows must remain consistent. Spy boarding has a separate modal/workflow from land-unit boarding. Boarding is used by Army, Intelligence, Trade, and Movement X; do not fix one host by changing behavior for all others unintentionally.

Brigade boarding on Existing Army and Movement X may exceed a fleet's available capacity. The Board Brigade modal shows a warning and still writes TS20. Commanders, spies, and Trade still refuse an over-capacity board.

On Existing Army and Movement X, Board for a brigade lists every brigade at that coordinate. Select one and board it on a fleet; the modal stays open. A brigade boarded this turn can be unboarded from its row. A brigade already loaded in the report uses Unload and the existing unload-direction modal. Commanders stay single-unit.

## Verify

For the changed item type, board and unload it, reload the selected turn, inspect TS20, and test one other host that uses the shared logic.

## Related handoffs

- [Army](army.md)
- [Trade](trade.md)
- [Turn maps](turn-maps.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
