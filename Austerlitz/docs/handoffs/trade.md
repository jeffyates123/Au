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

The first choice is Trade 17 or Trade 19, then a sphere: Europe, Caribbean, or India. The lists then show warehouses, baggage trains, merchant ships, and trade cities in that sphere. An owned trade city is bold. Owned means a barracks on that city's coordinate. The next click is the From item. That item number is the From field on TS17 and the source on TS19. The lists then keep that row and show To choices in the same sphere. On Trade 17 those To choices must also be legal for the current position: the same coordinate, or a warehouse transfer to a train or ship already in a barracks or shipyard, or to an owned trade city in that sphere. Clicking the From row again clears the To item. Changing the section or the sphere clears From and To. `New Trade` clears From and To and keeps the section and sphere.

Trade 17 lists show the turn-report stocks. Trade 19 lists replay every TS17 order onto those stocks before showing goods. A ship that loads 100 wood in TS17 shows that wood plus the wood already aboard. Warehouses and trade cities use the same replay on each goods column. A blank marker is included. Any other marker is ignored. The quantity check for a new order still replays TS17 and then TS19.

A To item cannot be the same kind as From. A baggage train cannot transfer with a merchant ship. A warehouse cannot transfer with a trade city the player does not own. Owned means a barracks on that city's coordinate. Sphere comes from coordinates through `boardingSharedFactory`: warehouse 1 is Europe, 2 is Caribbean, and 3 is India.

`+Trade1` writes one TS17 row and is allowed only for the current position. Two located items must share a coordinate. A warehouse transfer is allowed when the train or ship is already in a barracks or shipyard, or when the other end is an owned trade city in that sphere. Otherwise `+Trade1` warns and writes nothing. `+Trade2` writes one TS19 row for any allowed pair in the same sphere, because TS18 movement runs between the two trade phases.

The goods table changes by mode. Buy and sell keep the goods list. Sell has `Qty` and `n`, and writing a sell creates `n` separate `TRADE` rows of that quantity. Move mode (no trade city on either end) lists only goods the From item is carrying, plus Money. From and To stocks are projected from the report, then TS17 orders in order-number order, then TS19. A blank marker is included. Any other marker is ignored. A later order can unload goods an earlier order loaded, including across the two sections. A slot that reaches zero is free.

A baggage train holds 1,500 tons and two goods types. A merchant ship holds the ship table loading capacity and two goods types. Condition does not change that capacity. Tons are `quantity / units per ton` from rules-catalog `unitWeightsRates`, with the trade-goods fallback. Money is goods id 10 and does not consume cargo-slot types or tonnage. A write is refused when the From item lacks the quantity, when the destination would hold a third goods type, or when the projected tons exceed the limit. The warning names the reason.

When one end is a trade city, Calculate prices that quantity. The city as From is a buy. The city as To is a sell. Prices stay in `tradePriceFactory`. Sell pricing uses `Qty` repeated `n` times. When neither end is a city, the table shows projected stocks and quantities only.

Each section has 18 slots. If the new order does not fit in an empty slot, nothing is written. Clear Trade1 and Clear Trade2 clear only `TRADE` rows in that section. `Clear` resets the quantities. `New Trade` keeps Saved Trades and TS17/TS19.

Saved Trades replays city orders. A row with a trade city on exactly one end is a buy or a sell. To a trade city is a sell. From a trade city is a buy. Sell rows increment `n` and keep the first quantity. Buy quantities are summed. Saved Transfers sums the other `TRADE` rows by From, To, and goods. Economy prices only a row with a trade city on exactly one end.

Baggage train and merchant ship rows show both goods slots as `id (name)`, the slot quantities, and money.

## Baggage trains

TS20 boarding. Trade refuses an over-capacity board. See the boarding handoff.

## Verify

Select Trade 17, then Europe, and confirm the lists contain only that sphere and owned cities are bold. Select a warehouse, then an owned city. Enter a quantity, calculate, and write it with `+Trade1`. Select a sell direction (To is city), enter `Qty` and `n`, and confirm writing adds `n` rows. Select Trade 19 and confirm that ship's or train's goods include the TS17 quantity. Select a baggage train on Trade 17 and confirm the To list keeps only items on that coordinate, plus the sphere warehouse when the train is in a barracks or shipyard. Switch to a move pair (no city) and confirm the table lists carried goods plus Money only, then write one move row. Switch to Trade 19 and confirm the same sphere is listed again. Confirm `+Trade1` warns when it is not on the city's coordinate, then write it with `+Trade2`. Repeat with a merchant ship. Confirm a warehouse hides unowned cities, a train hides ships, and the same kind is hidden. Load a good onto a train in TS17 and unload that good from the same train in TS19. Confirm a third goods type and a load over 1,500 tons are refused with a reason. Reload and confirm Saved Trades, Saved Transfers, and the TS17 and TS19 grids.

## Related handoffs

- [Boarding](boarding-ts20.md)
- [Economy](economy.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
