"use strict";

austerlitzModule.factory(
  "economyTradeFactory",
  function (economyConfigFactory, economyParseUtilsFactory, economyResourceFactory, economySphereFactory) {
    var tradeEstimateGoodsConfig = economyConfigFactory.tradeEstimateGoodsConfig;
    var tradeGoodsIdToKey = economyConfigFactory.tradeGoodsIdToKey;
    var goodsFactorByKey = economyConfigFactory.goodsFactorByKey;
    var toInt = economyParseUtilsFactory.toInt;
    var toText = economyParseUtilsFactory.toText;
    var createEmptyResourceBag = economyResourceFactory.createEmptyResourceBag;
    var mapTradeResourceKey = economyResourceFactory.mapTradeResourceKey;
    var inBounds = economySphereFactory.inBounds;

    function getTradeRows(context) {
      var turnSheet = context.turnSheet || {};
      var ts17Rows = turnSheet.tsTradeAndLoading1 || turnSheet.TSTradeAndLoading1 || [];
      var ts19Rows = turnSheet.tsTradeAndLoading2 || turnSheet.TSTradeAndLoading2 || [];
      return (ts17Rows || []).concat(ts19Rows || []);
    }

    function getTradingCityLookup(context) {
      var turnReport = context.turnReport || {};
      var tradingCities = turnReport.tradingPortsAndCities || turnReport.TradingPortsAndCities || [];
      var cityLookup = {};
      (tradingCities || []).forEach(function (city) {
        var itemNo = toInt(city.itemNo != null ? city.itemNo : city.ItemNo, 0);
        if (itemNo > 0) {
          cityLookup[itemNo] = city;
        }
      });
      return cityLookup;
    }

    function getBounds(context) {
      return context.sphereByTab && context.sphereByTab[context.tabKey];
    }

    function buildTradeDirectByGoodForSphere(context) {
      var totals = createEmptyResourceBag();
      var bounds = getBounds(context);
      if (!bounds) {
        return totals;
      }

      var allRows = getTradeRows(context);
      if (!allRows.length) {
        return totals;
      }

      var cityLookup = getTradingCityLookup(context);
      var grouped = {};
      (allRows || []).forEach(function (row) {
        var marker = toText(row.rowMarker != null ? row.rowMarker : row.RowMarker, "").toUpperCase();
        if (marker && marker !== "TRADE") {
          return;
        }
        var goodsId = toInt(row.goods != null ? row.goods : row.Goods, 0);
        var qty = Math.max(0, toInt(row.quantity != null ? row.quantity : row.Quantity, 0));
        if (goodsId <= 0 || qty <= 0) {
          return;
        }
        var fromNo = toInt(row.from != null ? row.from : row.From, toInt(row.source != null ? row.source : row.Source, 0));
        var toNo = toInt(row.to != null ? row.to : row.To, toInt(row.destination != null ? row.destination : row.Destination, 0));
        if (fromNo <= 0 || toNo <= 0) {
          return;
        }
        var fromCity = cityLookup[fromNo];
        var toCity = cityLookup[toNo];
        var fromIsTradeCity = !!fromCity;
        var toIsTradeCity = !!toCity;
        if (fromIsTradeCity === toIsTradeCity) {
          return;
        }
        var city = fromIsTradeCity ? fromCity : toCity;
        var cityX = toInt(city && (city.x != null ? city.x : city.X), 0);
        var cityY = toInt(city && (city.y != null ? city.y : city.Y), 0);
        if (!inBounds(cityX, cityY, bounds)) {
          return;
        }
        var cityItemNo = fromIsTradeCity ? fromNo : toNo;
        var key = cityItemNo + "|" + goodsId;
        if (!grouped[key]) {
          grouped[key] = { cityItemNo: cityItemNo, goodsId: goodsId, directBuyQty: 0, sellTotalQty: 0 };
        }
        // Direction rule: TO trade city = sell, FROM trade city = buy.
        if (toIsTradeCity) {
          grouped[key].sellTotalQty += qty;
        } else {
          grouped[key].directBuyQty += qty;
        }
      });

      Object.keys(grouped).forEach(function (groupKey) {
        var item = grouped[groupKey];
        var cityKey = tradeGoodsIdToKey[item.goodsId];
        if (!cityKey) {
          return;
        }
        var resourceKey = mapTradeResourceKey(cityKey);
        if (!Object.prototype.hasOwnProperty.call(totals, resourceKey)) {
          return;
        }
        var netGoods = toInt(item.directBuyQty, 0) - toInt(item.sellTotalQty, 0);
        totals[resourceKey] += netGoods;
      });

      return totals;
    }

    function estimateTradeSummaryForSphere(context) {
      var fromTurnSheet = estimateTradeSummaryFromTurnSheet(context);
      if (fromTurnSheet !== null) {
        return fromTurnSheet;
      }

      return estimateTradeSummaryHeuristic(context);
    }

    function estimateTradeSummaryFromTurnSheet(context) {
      var bounds = getBounds(context);
      if (!bounds) {
        return null;
      }

      var allRows = getTradeRows(context);
      if (!allRows.length) {
        return null;
      }

      var cityLookup = getTradingCityLookup(context);
      var grouped = {};
      var relevantCount = 0;
      var hasAnyTradeMarkerRows = false;

      (allRows || []).forEach(function (row) {
        var marker = toText(row.rowMarker != null ? row.rowMarker : row.RowMarker, "").toUpperCase();
        if (marker && marker !== "TRADE") {
          return;
        }
        hasAnyTradeMarkerRows = true;

        var goodsId = toInt(row.goods != null ? row.goods : row.Goods, 0);
        var qty = Math.max(0, toInt(row.quantity != null ? row.quantity : row.Quantity, 0));
        if (goodsId <= 0 || qty <= 0) {
          return;
        }

        var fromNo = toInt(row.from != null ? row.from : row.From, toInt(row.source != null ? row.source : row.Source, 0));
        var toNo = toInt(row.to != null ? row.to : row.To, toInt(row.destination != null ? row.destination : row.Destination, 0));
        if (fromNo <= 0 || toNo <= 0) {
          return;
        }

        var fromCity = cityLookup[fromNo];
        var toCity = cityLookup[toNo];
        var fromIsTradeCity = !!fromCity;
        var toIsTradeCity = !!toCity;
        if (fromIsTradeCity === toIsTradeCity) {
          return;
        }

        var city = fromIsTradeCity ? fromCity : toCity;
        var cityX = toInt(city && (city.x != null ? city.x : city.X), 0);
        var cityY = toInt(city && (city.y != null ? city.y : city.Y), 0);
        if (!inBounds(cityX, cityY, bounds)) {
          return;
        }

        var cityItemNo = fromIsTradeCity ? fromNo : toNo;

        relevantCount += 1;
        var key = cityItemNo + "|" + goodsId;
        if (!grouped[key]) {
          grouped[key] = {
            cityItemNo: cityItemNo,
            goodsId: goodsId,
            directBuyQty: 0,
            sellQty: 0,
            sellN: 0,
          };
        }

        // Direction rule: TO trade city = sell, FROM trade city = buy.
        if (toIsTradeCity) {
          grouped[key].sellN += 1;
          if (!grouped[key].sellQty) {
            grouped[key].sellQty = qty;
          }
        } else {
          grouped[key].directBuyQty += qty;
        }
      });

      if (!relevantCount) {
        // If TRADE rows exist but none target this sphere's warehouse,
        // net trade for this sphere is explicitly zero.
        if (hasAnyTradeMarkerRows) {
          return { directSelling: 0, directBuying: 0 };
        }
        return null;
      }

      var totalDirectSelling = 0;
      var totalDirectBuying = 0;
      Object.keys(grouped).forEach(function (groupKey) {
        var item = grouped[groupKey];
        var city = cityLookup[item.cityItemNo];
        var cityRate = Math.max(0, toInt(city.rate != null ? city.rate : city.Rate, 0));
        if (cityRate <= 0) {
          return;
        }

        var cityKey = tradeGoodsIdToKey[item.goodsId];
        if (!cityKey) {
          return;
        }

        var goodsFactor = Math.max(0, toInt(goodsFactorByKey[cityKey], 0));
        var cityStock = Math.max(
          0,
          toInt(
            city[cityKey] != null
              ? city[cityKey]
              : city[cityKey.charAt(0).toUpperCase() + cityKey.slice(1)],
            0,
          ),
        );
        var directBuyQty = Math.max(0, item.directBuyQty);
        var qty = Math.max(0, item.sellQty);
        var n = Math.max(0, item.sellN);
        var qtyS = qty * n;
        var netStock = Math.max(0, cityStock - directBuyQty);

        var buyPerUnit = (1600 * goodsFactor * cityRate) / Math.sqrt(cityStock + 10);
        var totalDirect = Math.floor(buyPerUnit * directBuyQty);
        var totalSell = 0;
        if (qty > 0 && n > 0) {
          for (var i = 0; i < n; i++) {
            var existingQtyForRound = netStock + i * qty;
            var sellPerUnit = (1500 * goodsFactor * cityRate) / (Math.sqrt(existingQtyForRound + 10) + Math.sqrt(qty));
            totalSell += Math.floor(sellPerUnit * qty);
          }
        }

        if (qtyS > 0 || directBuyQty > 0) {
          totalDirectSelling += totalSell;
          totalDirectBuying += totalDirect;
        }
      });

      return {
        directSelling: totalDirectSelling,
        directBuying: totalDirectBuying,
      };
    }

    function estimateTradeSummaryHeuristic(context) {
      var turnReport = context.turnReport || {};
      var tradingCities = turnReport.tradingPortsAndCities || turnReport.TradingPortsAndCities || [];
      var bounds = getBounds(context);
      if (!bounds || !tradingCities || !tradingCities.length) {
        return { directSelling: 0, directBuying: 0 };
      }

      var totalDirectSelling = 0;
      var totalDirectBuying = 0;
      var tradeFraction = 0.1;

      (tradingCities || []).forEach(function (city) {
        var x = toInt(city.x != null ? city.x : city.X, 0);
        var y = toInt(city.y != null ? city.y : city.Y, 0);
        if (!inBounds(x, y, bounds)) {
          return;
        }

        var rate = Math.max(0, toInt(city.rate != null ? city.rate : city.Rate, 0));
        if (rate <= 0) {
          return;
        }

        (tradeEstimateGoodsConfig || []).forEach(function (good) {
          var stock = toInt(city[good.cityKey] != null ? city[good.cityKey] : city[good.cityKey.charAt(0).toUpperCase() + good.cityKey.slice(1)], 0);
          if (stock <= 0) {
            return;
          }

          var qtyC = Math.max(0, stock);
          var tradeQty = Math.max(1, Math.round(qtyC * tradeFraction));
          var directBuyQty = tradeQty;
          var netStock = Math.max(0, qtyC - directBuyQty);
          var goodsFactor = Math.max(0, toInt(good.goodsFactor, 0));

          var buyPerUnit = (1600 * goodsFactor * rate) / Math.sqrt(qtyC + 10);
          var totalDirect = Math.floor(buyPerUnit * directBuyQty);
          var sellPerUnit = (1500 * goodsFactor * rate) / (Math.sqrt(netStock + 10) + Math.sqrt(tradeQty));
          var totalSell = Math.floor(sellPerUnit * tradeQty);
          totalDirectSelling += totalSell;
          totalDirectBuying += totalDirect;
        });
      });

      return {
        directSelling: totalDirectSelling,
        directBuying: totalDirectBuying,
      };
    }

    return {
      buildTradeDirectByGoodForSphere: buildTradeDirectByGoodForSphere,
      estimateTradeSummaryForSphere: estimateTradeSummaryForSphere,
      estimateTradeSummaryFromTurnSheet: estimateTradeSummaryFromTurnSheet,
      estimateTradeSummaryHeuristic: estimateTradeSummaryHeuristic,
    };
  },
);
