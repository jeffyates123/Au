# Trade

## Scope

Route `/Section/Trade` opens on the Trading tab. Baggage Trains and Trading Cities are the other tabs. Trading writes trade orders. Baggage trains use boarding for capacity.

## Main files

- Controller/template: `App/tradeController.js`, `Templates/tradeTemplate.html`
- Boarding integration: `App/trade/tradeBoardingFactory.js`
- Price formula: `App/trade/tradePriceFactory.js`
- Economy reader of the same orders: `App/economy/economyTradeFactory.js`, with goods ids and fallback factors in `App/economy/economyConfigFactory.js`

## Trading tab

An owned trade city is a trading port whose X,Y matches a barracks. The calculator uses that city's stock and rate. Warehouse stock is warehouse 1 Europe, 2 Caribbean, or 3 India, from the city coordinates. Goods factors come from rules-catalog `unitWeightsRates`, then the hardcoded fallbacks.

Goods ids, shared with Economy: EcPts 13, Food 16, Stone 18, Wood 19, Ore 20, Zinc 21, Horses 22, Textiles 23, Wool 24, Gold 29, Wine 30.

Calculate is display-only. Buy and sell prices are computed only in `tradePriceFactory`. `n` is the number of sell rounds. Economy estimates call that same factory.

`+Trade1` writes TS17 (`goods`, `quantity`, `from`, `to`, `rowMarker`) through `TradeAndLoading1`. `+Trade2` writes TS19 (`goods`, `quantity`, `source`, `destination`, `rowMarker`) through `TradeAndLoading2`. A row button writes that good only. A buy is city to warehouse. A sell is warehouse to city, one order per `n`. The marker is `TRADE`. Each section has 18 slots. If the new orders do not fit in empty slots, nothing is written.

Clear Trade1 and Clear Trade2 clear only `TRADE` rows in that section.

Saved Trades replays TS17 and TS19 together, grouped by city and goods. A blank marker is included. Any other marker is ignored. Exactly one end must be a trade city. Sell rows increment `n` and keep the first quantity. Buy quantities are summed. The collapsed TS17 / TS19 grid shows orders 1–6, 7–12, and 13–18. TS19 stores source and destination, shown there as From and To.

## Baggage trains

TS20 boarding. Trade refuses an over-capacity board. See the boarding handoff.

## Verify

Select an owned city, calculate, write one good with `+Trade1` and another with `+Trade2`, reload, and confirm Saved Trades plus the TS17 and TS19 grids. Confirm a full section rejects the write. Confirm Clear removes only `TRADE` rows. Confirm the Economy sphere estimate moves with those rows.

## Related handoffs

- [Boarding](boarding-ts20.md)
- [Economy](economy.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
