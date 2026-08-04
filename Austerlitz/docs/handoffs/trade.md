# Trade

## Scope

Route `/Section/Trade` has Trading, Baggage Trains, and Trading Cities tabs. It creates trade/loading orders and uses boarding behavior for baggage-train capacity.

## Main files

- Controller/template: `App/tradeController.js`, `Templates/tradeTemplate.html`
- Boarding integration: `App/trade/tradeBoardingFactory.js`

## Order ownership

- TS17 and TS19: trade/loading orders.
- TS20: baggage-train boarding.

Trade rows use the `TRADE` marker and section limits apply. Keep the two trade/loading sections distinct; their names are similar but their output belongs to different turnsheet sections.

## Verify

Create a trade row, verify it appears in the correct TS17 or TS19 read-only section, then verify a baggage-train boarding action writes/replays correctly.

## Related handoffs

- [Boarding](boarding-ts20.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
