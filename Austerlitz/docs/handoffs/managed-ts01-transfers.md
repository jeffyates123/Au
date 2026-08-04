# Managed TS01 transfers

## Purpose

Some feature actions automatically create TS01 Transfer Goods rows to represent their costs. These rows are managed companions, not arbitrary user-created transfers.

## Main files

- Pipeline: `App/setUpTransferPipelineFactory.js`
- Shared setup helpers: `App/setUpBrigadesSharedFactory.js`
- Utilities: `App/ts01TransferGoodsUtilsFactory.js`
- Army setup caller: `App/landUnits/landUnitsSetUpBrigadesFactory.js`
- Turn Maps setup caller: `App/turnMaps/turnMapsSetUpBrigadesFactory.js`
- Navy callers: `App/navalUnits/*.js`

## Rules

Managed rows track ownership/order numbers in localStorage so updates replace the correct companion cost row. A feature may edit only its own managed rows; it must not clear or overwrite user rows or rows owned by another feature.

Set Up Brigades hosts share only pure row normalization, TS-section ordering, and cost helpers. Their depot rules, visible-row rules, localStorage prefixes, and save callbacks remain host-specific.

## Verify

Create, edit, and remove the owning action. Confirm exactly one companion TS01 row is created/updated/removed and unrelated TS01 rows survive.

## Related handoffs

- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
- [Army](army.md)
- [Navy](navy.md)
