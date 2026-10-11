"use strict";

austerlitzModule.factory("tradePriceFactory", function () {
  function toNumber(value, fallback) {
    var parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  function calculate(input) {
    input = input || {};
    var goodsFactor = Math.max(0, toNumber(input.goodsFactor, 0));
    var stock = Math.max(0, toNumber(input.stock, 0));
    var directBuyQty = Math.max(0, Math.round(toNumber(input.directBuyQty, 0)));
    var qty = Math.max(0, Math.round(toNumber(input.qty, 0)));
    var n = Math.max(0, Math.round(toNumber(input.n, 0)));
    var rate = Math.max(0, toNumber(input.rate, 0));
    var qtyS = qty * n;
    var netStock = Math.max(0, stock - directBuyQty);

    var buyPerUnit = (1600 * goodsFactor * rate) / Math.sqrt(stock + 10);
    var totalDirect = Math.floor(buyPerUnit * directBuyQty);
    var totalSell = 0;

    if (qty > 0 && n > 0) {
      for (var i = 0; i < n; i++) {
        var existingQtyForRound = netStock + i * qty;
        var sellPerUnit =
          (1500 * goodsFactor * rate) /
          (Math.sqrt(existingQtyForRound + 10) + Math.sqrt(qty));
        totalSell += Math.floor(sellPerUnit * qty);
      }
    }

    return {
      directBuyQty: directBuyQty,
      qty: qty,
      n: n,
      qtyS: qtyS,
      netStock: netStock,
      totalDirect: totalDirect,
      totalSell: totalSell,
      profitLd: totalSell - totalDirect,
    };
  }

  return {
    calculate: calculate,
  };
});
