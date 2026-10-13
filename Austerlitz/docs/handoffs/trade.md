# Trade

## Scope

Route `/Section/Trade` opens on the Trading tab. Baggage Trains and Trading Cities are the other tabs. Trading writes trade orders. Baggage trains use boarding for capacity.

## Main files

- Controller/template: `App/tradeController.js`, `Templates/tradeTemplate.html`
- Boarding integration: `App/trade/tradeBoardingFactory.js`
- Goods catalog: `App/trade/tradeGoodsFactory.js`
- Price formula: `App/trade/tradePriceFactory.js`
- Economy reader of the same orders: `App/economy/economyTradeFactory.js`

## Trading tab

Trade Cities first shows all trade cities and marks each as owned or not owned. Ownership still uses the barracks coordinate match. After selecting a city, the table collapses to that city until `New Trade` is clicked.

Second selection is the trade counterparty in the same sphere:

- Owned city: one sphere warehouse, all baggage trains in that sphere, and all merchant ships in that sphere.
- Unowned city: baggage trains and merchant ships in that sphere.

The sphere warehouse is never auto-selected. A warehouse, baggage train, or merchant ship must be clicked before the calculator is shown. Counterparty selection is exclusive across those three lists. After selecting one counterparty type, the other two tables hide until `New Trade`. Changing counterparty clears calculator inputs and totals.

Goods ids and fallback factors are owned by `tradeGoodsFactory` and shared with Economy.

The live calculator source column is `WH/BagT`. For a warehouse it reads warehouse goods stock. For a baggage train or merchant ship it reads that row's Goods1/Goods2 quantity for the goods id; if both slots use the same goods id, quantities are added.

Calculate is display-only. Buy and sell prices are computed only in `tradePriceFactory`. `n` is the number of sell rounds. Economy estimates call that same factory.

`+Trade1` writes TS17 (`goods`, `quantity`, `from`, `to`, `rowMarker`) through `TradeAndLoading1`. `+Trade2` writes TS19 (`goods`, `quantity`, `source`, `destination`, `rowMarker`) through `TradeAndLoading2`. A row button writes that good only. A buy is city to selected counterparty. A sell is selected counterparty to city, one order per `n`. The marker is `TRADE`. Each section has 18 slots. If the new orders do not fit in empty slots, nothing is written.

Clear Trade1 and Clear Trade2 clear only `TRADE` rows in that section.

`Clear` resets only buy/sell inputs and totals. `New Trade` resets city and counterparty selection and inputs, and keeps Saved Trades and TS17/TS19.

Saved Trades replays TS17 and TS19 together, grouped by city and goods. A blank marker is included. Any other marker is ignored. Exactly one end must be a trade city. Sell rows increment `n` and keep the first quantity. Buy quantities are summed. `WH/BagT` shows warehouse stock for non-city item 1/2/3 and baggage-train or merchant-ship stock for any other non-city item number. Missing stock rows resolve to 0. The collapsed TS17 / TS19 grid shows orders 1–6, 7–12, and 13–18. TS19 stores source and destination, shown there as From and To.

## Baggage trains

TS20 boarding. Trade refuses an over-capacity board. See the boarding handoff.

## Verify

Select an owned city, then a warehouse, calculate, and write one good with `+Trade1`. Click a same-sphere baggage train, confirm inputs reset, then write one good with `+Trade2`. Repeat with a same-sphere merchant ship, then repeat with an unowned city and non-warehouse counterparties. Reload and confirm Saved Trades plus the TS17 and TS19 grids. Confirm `New Trade` restores all cities, `Clear` keeps selections, a full section rejects writes, and Economy estimates still move with the saved rows.

## Related handoffs

- [Boarding](boarding-ts20.md)
- [Economy](economy.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
