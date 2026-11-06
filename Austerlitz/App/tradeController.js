"use strict";

austerlitzModule.controller(
  "tradeController",
  function (
    $scope,
    $q,
    masterData,
    turnDataLoaderService,
    turnSheetFactory,
    tradeBoardingFactory,
    boardingSharedFactory,
    tradePriceFactory,
    tradeGoodsFactory,
  ) {
    var validTradeTabs = {
      baggageTrains: true,
      tradingCities: true,
      trading: true,
    };
    var tradingGoodsConfig = tradeGoodsFactory.tradingGoodsConfig || [];
    var tradeGoodsIdByKey = tradeGoodsFactory.tradeGoodsIdByKey || {};
    var tradeGoodsKeyById = tradeGoodsFactory.tradeGoodsKeyById || {};
    var tradeGoodsLabelById = {};
    (tradingGoodsConfig || []).forEach(function (good) {
      if (!good || good.goodsId == null) {
        return;
      }
      tradeGoodsLabelById[good.goodsId] = toText(good.label, "");
    });
    var tradeRowMarker = "TRADE";
    var tradeTurnSheetMaxRows = 18;
    var sphereWarehouseNos = { 1: true, 2: true, 3: true };
    var moneyGoodsId = 10;

    function toInt(value, fallback) {
      var parsed = parseInt(value, 10);
      return isNaN(parsed) ? fallback : parsed;
    }

    function toOccupiedInt(value, fallback) {
      var parsed = toInt(value, fallback);
      return parsed != null && parsed !== 0 ? parsed : null;
    }

    function toNumber(value, fallback) {
      var parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    }

    function toText(value, fallback) {
      if (value == null) {
        return fallback;
      }
      var text = value.toString().trim();
      return text ? text : fallback;
    }

    function createTradingCalcRow(config) {
      return {
        key: config.key,
        goodsId: config.goodsId,
        itemType: config.itemType,
        label: config.label,
        goodsFactor: config.fallbackGoodsFactor,
        perTon: config.fallbackPerTon,
        stock: 0,
        warehouse: 0,
        directBuyQty: null,
        qty: null,
        n: null,
        qtyS: 0,
        totalDirect: null,
        totalSell: null,
        profitLd: null,
      };
    }

    function getUnitWeightRateLookup() {
      var rulesCatalog = ($scope.masterData && $scope.masterData.rulesCatalog) || {};
      var rows = rulesCatalog.unitWeightsRates || [];
      var lookup = {};
      (rows || []).forEach(function (row) {
        var key = toText(row && row.itemType, "").toLowerCase();
        if (!key) {
          return;
        }
        lookup[key] = {
          goodsFactor: toNumber(row && row.goodsFactors, null),
          perTon: toNumber(row && row.weightOfItem, null),
        };
      });
      return lookup;
    }

    function refreshTradingCalcGoodsMeta() {
      var lookup = getUnitWeightRateLookup();
      ($scope.tradingCalcRows || []).forEach(function (row) {
        var ref = lookup[row.itemType] || {};
        row.goodsFactor =
          ref.goodsFactor != null && ref.goodsFactor > 0
            ? ref.goodsFactor
            : row.goodsFactor;
        row.perTon =
          ref.perTon != null && ref.perTon > 0
            ? ref.perTon
            : row.perTon;
      });
    }

    function refreshTradingCalcStocks() {
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      var cityEndpoint = tradeCityEndpoint(fromEndpoint, toEndpoint);
      ($scope.tradingCalcRows || []).forEach(function (row) {
        var goodsId = tradeGoodsIdByKey[row.key];
        row.fromStock = fromEndpoint ? projectGoodsQty(fromEndpoint, goodsId) : 0;
        row.toStock = toEndpoint ? projectGoodsQty(toEndpoint, goodsId) : 0;
        row.stock = cityEndpoint ? projectGoodsQty(cityEndpoint, goodsId) : 0;
        row.rate = cityEndpoint ? Math.max(0, toNumber(cityEndpoint.rate, 0)) : 0;
      });
    }

    function getTradeReportRows() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.baggageTrains || [];
    }

    function getMerchantShipReportRows() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.merchantShips || turnReport.MerchantShips || [];
    }

    function getTradingCitiesReportRows() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.tradingPortsAndCities || turnReport.TradingPortsAndCities || [];
    }

    function getWarehouseReportRows() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.warehouses || [];
    }

    function buildBarracksCoordinateLookup() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      var barracks = turnReport.barracks || [];
      var lookup = {};
      (barracks || []).forEach(function (row) {
        var x = toInt(row && row.x, null);
        var y = toInt(row && row.y, null);
        if (x == null || y == null) {
          return;
        }
        lookup[x + "," + y] = true;
      });
      return lookup;
    }

    function syncTradeSelection() {
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      if ($scope.selectedTradeFrom && !fromEndpoint) {
        $scope.selectedTradeFrom = null;
        $scope.selectedTradeTo = null;
        return;
      }
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      if ($scope.selectedTradeTo && (!fromEndpoint || !toEndpoint || !isTradeCandidate(fromEndpoint, toEndpoint))) {
        $scope.selectedTradeTo = null;
      }
    }

    function clearTradingInputValues() {
      ($scope.tradingCalcRows || []).forEach(function (row) {
        row.qty = null;
        row.n = null;
      });
    }

    function getSphereForCoordinates(x, y) {
      return boardingSharedFactory.getSphereFromCoordinates(x, y);
    }

    function getSphereForCity(city) {
      return getSphereForCoordinates(city && city.x, city && city.y);
    }

    function getSphereForTradeTrain(train) {
      return getSphereForCoordinates(train && train.x, train && train.y);
    }

    function getTradeTrainStockByGoodsId(train, goodsId) {
      if (!train || goodsId == null) {
        return 0;
      }
      var total = 0;
      if (toInt(train.goods1, null) === goodsId) {
        total += Math.max(0, toInt(train.quantity1, 0));
      }
      if (toInt(train.goods2, null) === goodsId) {
        total += Math.max(0, toInt(train.quantity2, 0));
      }
      return total;
    }

    function getWarehouseRowByItemNo(itemNo) {
      var match = null;
      ($scope.sphereWarehouseRows || []).forEach(function (warehouseRow) {
        if (match) {
          return;
        }
        if (toInt(warehouseRow && warehouseRow.itemNo, null) === toInt(itemNo, null)) {
          match = warehouseRow;
        }
      });
      return match;
    }

    function getTradeTrainByItemNo(itemNo) {
      var match = null;
      ($scope.playerBaggageTrainRows || []).forEach(function (train) {
        if (match) {
          return;
        }
        if (toInt(train && train.itemNo, null) === toInt(itemNo, null)) {
          match = train;
        }
      });
      return match;
    }

    function getMerchantShipByItemNo(itemNo) {
      var match = null;
      ($scope.playerMerchantShipRows || []).forEach(function (ship) {
        if (match) {
          return;
        }
        if (toInt(ship && ship.itemNo, null) === toInt(itemNo, null)) {
          match = ship;
        }
      });
      return match;
    }

    function getCounterpartyStockByItemNoAndGood(sourceItemNo, goodsId, goodsKey) {
      var sourceNo = toInt(sourceItemNo, null);
      if (sourceNo == null) {
        return 0;
      }
      if (sphereWarehouseNos[sourceNo]) {
        var warehouseRow = getWarehouseRowByItemNo(sourceNo);
        return Math.max(0, toInt(warehouseRow && goodsKey ? warehouseRow[goodsKey] : 0, 0));
      }
      var trainRow = getTradeTrainByItemNo(sourceNo);
      if (trainRow) {
        return getTradeTrainStockByGoodsId(trainRow, goodsId);
      }
      return getTradeTrainStockByGoodsId(getMerchantShipByItemNo(sourceNo), goodsId);
    }

    function isOwnedTradeCity(city) {
      return !!(city && city.isOwned);
    }

    function refreshTradingSelectionLists() {
      syncTradeSelection();
    }

    function refreshSphereWarehouseRows() {
      var sphereNameByItemNo = {
        1: "Europe",
        2: "Carib",
        3: "India",
      };
      var byItemNo = {};
      (getWarehouseReportRows() || []).forEach(function (row) {
        var itemNo = toInt(row && row.itemNo, null);
        if (itemNo == null) {
          return;
        }
        byItemNo[itemNo] = row;
      });

      $scope.sphereWarehouseRows = [1, 2, 3].map(function (itemNo) {
        var row = byItemNo[itemNo] || {};
        return {
          itemNo: itemNo,
          warehouseLabel: "-" + itemNo + "- " + (sphereNameByItemNo[itemNo] || ""),
          inhabitants: toInt(row && (row.inhabitants != null ? row.inhabitants : row.Inhabitants), 0),
          foreign: toInt(row && (row.foreign != null ? row.foreign : row.Foreign), 0),
          money: toInt(row && (row.money != null ? row.money : row.Money), 0),
          citizens: toInt(row && (row.citizens != null ? row.citizens : row.Citizens), 0),
          ectPts: toInt(row && (row.ecPts != null ? row.ecPts : row.EcPts), 0),
          food: toInt(row && (row.food != null ? row.food : row.Food), 0),
          stone: toInt(row && (row.stone != null ? row.stone : row.Stone), 0),
          wood: toInt(row && (row.wood != null ? row.wood : row.Wood), 0),
          ore: toInt(row && (row.ore != null ? row.ore : row.Ore), 0),
          zinc: toInt(row && (row.zinc != null ? row.zinc : row.Zinc), 0),
          horses: toInt(row && (row.horses != null ? row.horses : row.Horses), 0),
          textiles: toInt(row && (row.textiles != null ? row.textiles : row.Textiles), 0),
          wool: toInt(row && (row.wool != null ? row.wool : row.Wool), 0),
          gold: toInt(row && (row.gold != null ? row.gold : row.Gold), 0),
          wine: toInt(row && (row.wine != null ? row.wine : row.Wine), 0),
        };
      });
    }

    function getCityLookupByItemNo() {
      var lookup = {};
      ($scope.tradeCityRows || []).forEach(function (city) {
        var cityItemNo = toInt(city && city.itemNo, null);
        if (cityItemNo == null) {
          return;
        }
        lookup[cityItemNo] = city;
      });
      if (Object.keys(lookup).length) {
        return lookup;
      }
      (getTradingCitiesReportRows() || []).forEach(function (city) {
        var cityItemNo = toInt(city && (city.itemNo != null ? city.itemNo : city.ItemNo), null);
        if (cityItemNo == null) {
          return;
        }
        lookup[cityItemNo] = {
          itemNo: cityItemNo,
          name: toText(city && (city.name != null ? city.name : city.Name), ""),
          rate: toInt(city && (city.rate != null ? city.rate : city.Rate), 0),
          ectPts: toInt(city && (city.ectPts != null ? city.ectPts : city.EctPts), 0),
          food: toInt(city && (city.food != null ? city.food : city.Food), 0),
          stone: toInt(city && (city.stone != null ? city.stone : city.Stone), 0),
          wood: toInt(city && (city.wood != null ? city.wood : city.Wood), 0),
          ore: toInt(city && (city.ore != null ? city.ore : city.Ore), 0),
          zinc: toInt(city && (city.zinc != null ? city.zinc : city.Zinc), 0),
          horses: toInt(city && (city.horses != null ? city.horses : city.Horses), 0),
          textiles: toInt(city && (city.textiles != null ? city.textiles : city.Textiles), 0),
          wool: toInt(city && (city.wool != null ? city.wool : city.Wool), 0),
          gold: toInt(city && (city.gold != null ? city.gold : city.Gold), 0),
          wine: toInt(city && (city.wine != null ? city.wine : city.Wine), 0),
        };
      });
      return lookup;
    }

    var baggageTrainLoadTons = 1500;

    function sphereForWarehouseNo(itemNo) {
      if (toInt(itemNo, null) === 1) {
        return "Europe";
      }
      if (toInt(itemNo, null) === 2) {
        return "Caribbean";
      }
      if (toInt(itemNo, null) === 3) {
        return "India";
      }
      return "Unknown";
    }

    function findTradeRow(kind, itemNo) {
      if (kind === "warehouse") {
        return getWarehouseRowByItemNo(itemNo);
      }
      if (kind === "train") {
        return getTradeTrainByItemNo(itemNo);
      }
      if (kind === "merchant") {
        return getMerchantShipByItemNo(itemNo);
      }
      if (kind === "city") {
        var match = null;
        ($scope.tradeCityRows || []).forEach(function (city) {
          if (!match && toInt(city && city.itemNo, null) === toInt(itemNo, null)) {
            match = city;
          }
        });
        return match;
      }
      return null;
    }

    function resolveTradeKind(itemNo) {
      var parsed = toInt(itemNo, null);
      if (parsed == null) {
        return null;
      }
      if (sphereWarehouseNos[parsed]) {
        return "warehouse";
      }
      if (getCityLookupByItemNo()[parsed]) {
        return "city";
      }
      if (getTradeTrainByItemNo(parsed)) {
        return "train";
      }
      if (getMerchantShipByItemNo(parsed)) {
        return "merchant";
      }
      return null;
    }

    function rowToTradeEndpoint(kind, row) {
      if (!row) {
        return null;
      }
      var itemNo = toInt(row.itemNo, null);
      if (kind === "warehouse") {
        return {
          kind: "warehouse",
          itemNo: itemNo,
          sphere: sphereForWarehouseNo(itemNo),
          x: null,
          y: null,
          name: row.warehouseLabel,
          source: row,
        };
      }
      return {
        kind: kind,
        itemNo: itemNo,
        sphere: row.sphere || getSphereForCoordinates(row.x, row.y),
        x: toInt(row.x, null),
        y: toInt(row.y, null),
        name: row.name || "",
        rate: toNumber(row.rate, 0),
        isOwned: !!row.isOwned,
        type: row.type,
        source: row,
      };
    }

    function currentTradeEndpoint(selection) {
      if (!selection) {
        return null;
      }
      return rowToTradeEndpoint(selection.kind, findTradeRow(selection.kind, selection.itemNo));
    }

    function canPairTradeKinds(fromKind, toKind) {
      if (!fromKind || !toKind || fromKind === toKind) {
        return false;
      }
      if (
        (fromKind === "train" && toKind === "merchant") ||
        (fromKind === "merchant" && toKind === "train")
      ) {
        return false;
      }
      return true;
    }

    function warehouseOwnsCity(warehouseEndpoint, cityEndpoint) {
      return !!(
        warehouseEndpoint &&
        cityEndpoint &&
        cityEndpoint.kind === "city" &&
        cityEndpoint.isOwned &&
        getWarehouseNoForCity(cityEndpoint) === warehouseEndpoint.itemNo
      );
    }

    function isTradeCandidate(fromEndpoint, toEndpoint) {
      if (!fromEndpoint || !toEndpoint) {
        return false;
      }
      if (!canPairTradeKinds(fromEndpoint.kind, toEndpoint.kind)) {
        return false;
      }
      if (fromEndpoint.sphere !== toEndpoint.sphere) {
        return false;
      }
      if (fromEndpoint.kind === "warehouse" && toEndpoint.kind === "city") {
        return warehouseOwnsCity(fromEndpoint, toEndpoint);
      }
      if (toEndpoint.kind === "warehouse" && fromEndpoint.kind === "city") {
        return warehouseOwnsCity(toEndpoint, fromEndpoint);
      }
      return true;
    }

    function visibleTradeRows(kind) {
      if (!$scope.selectedTradeSection || !$scope.selectedTradeSphere) {
        return [];
      }
      var sourceRows =
        kind === "warehouse"
          ? $scope.sphereWarehouseRows || []
          : kind === "train"
            ? $scope.playerBaggageTrainRows || []
            : kind === "merchant"
              ? $scope.playerMerchantShipRows || []
              : $scope.tradeCityRows || [];
      var rows = sourceRows.filter(function (row) {
        return rowMatchesSelectedSphere(kind, row);
      });
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      if (!fromEndpoint) {
        return rows.map(function (row) {
          return withTs17Cargo(kind, row);
        });
      }
      if (fromEndpoint.kind === kind) {
        return rows
          .filter(function (row) {
            return toInt(row && row.itemNo, null) === fromEndpoint.itemNo;
          })
          .map(function (row) {
            return withTs17Cargo(kind, row);
          });
      }
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      if (toEndpoint) {
        if (toEndpoint.kind !== kind) {
          return [];
        }
        return rows
          .filter(function (row) {
            return toInt(row && row.itemNo, null) === toEndpoint.itemNo;
          })
          .map(function (row) {
            return withTs17Cargo(kind, row);
          });
      }
      return rows
        .filter(function (row) {
          var candidate = rowToTradeEndpoint(kind, row);
          if (!isTradeCandidate(fromEndpoint, candidate)) {
            return false;
          }
          if ($scope.selectedTradeSection !== "ts17") {
            return true;
          }
          return !getTs17BlockReason(fromEndpoint, candidate);
        })
        .map(function (row) {
          return withTs17Cargo(kind, row);
        });
    }

    function tradeEndpointLabel(endpoint) {
      if (!endpoint) {
        return "Item";
      }
      if (endpoint.kind === "warehouse") {
        return "Warehouse " + endpoint.itemNo;
      }
      if (endpoint.kind === "train") {
        return "Baggage train " + endpoint.itemNo;
      }
      if (endpoint.kind === "merchant") {
        return "Merchant ship " + endpoint.itemNo;
      }
      return "Trade city " + endpoint.itemNo + (endpoint.name ? " " + endpoint.name : "");
    }

    function tradeGoodsName(goodsId) {
      var label = toText(tradeGoodsLabelById[goodsId], "");
      return label || "goods " + goodsId;
    }

    function tradeCityEndpoint(fromEndpoint, toEndpoint) {
      if (fromEndpoint && fromEndpoint.kind === "city") {
        return fromEndpoint;
      }
      if (toEndpoint && toEndpoint.kind === "city") {
        return toEndpoint;
      }
      return null;
    }

    function isSellTrade(fromEndpoint, toEndpoint) {
      return !!(fromEndpoint && toEndpoint && fromEndpoint.kind !== "city" && toEndpoint.kind === "city");
    }

    function isMoveTrade(fromEndpoint, toEndpoint) {
      return !!(fromEndpoint && toEndpoint && !tradeCityEndpoint(fromEndpoint, toEndpoint));
    }

    function perTonForGoodsId(goodsId) {
      if (toInt(goodsId, null) === moneyGoodsId) {
        return Number.MAX_SAFE_INTEGER;
      }
      var key = tradeGoodsKeyById[goodsId];
      var match = null;
      ($scope.tradingCalcRows || []).forEach(function (row) {
        if (!match && row.key === key) {
          match = row;
        }
      });
      var perTon = match ? toNumber(match.perTon, 0) : 0;
      return perTon > 0 ? perTon : 1;
    }

    function addSlotQty(slots, goodsId, qty) {
      goodsId = toInt(goodsId, null);
      qty = Math.max(0, toInt(qty, 0));
      if (goodsId === moneyGoodsId) {
        return;
      }
      if (goodsId == null || goodsId <= 0 || qty <= 0) {
        return;
      }
      var i;
      for (i = 0; i < slots.length; i++) {
        if (slots[i].goodsId === goodsId) {
          slots[i].qty += qty;
          return;
        }
      }
      for (i = 0; i < slots.length; i++) {
        if (slots[i].qty <= 0) {
          slots[i].goodsId = goodsId;
          slots[i].qty = qty;
          return;
        }
      }
      slots.push({ goodsId: goodsId, qty: qty });
    }

    function removeSlotQty(slots, goodsId, qty) {
      goodsId = toInt(goodsId, null);
      qty = Math.max(0, toInt(qty, 0));
      if (goodsId === moneyGoodsId) {
        return;
      }
      if (goodsId == null || qty <= 0) {
        return;
      }
      for (var i = 0; i < slots.length; i++) {
        if (slots[i].goodsId !== goodsId) {
          continue;
        }
        slots[i].qty -= qty;
        if (slots[i].qty <= 0) {
          slots[i].goodsId = null;
          slots[i].qty = 0;
        }
        return;
      }
    }

    function reportCarrierSlots(source) {
      var slots = [
        { goodsId: null, qty: 0 },
        { goodsId: null, qty: 0 },
      ];
      addSlotQty(slots, source && source.goods1, source && source.quantity1);
      addSlotQty(slots, source && source.goods2, source && source.quantity2);
      return slots;
    }

    function readReportGoodsQty(endpoint, goodsId) {
      if (!endpoint || !endpoint.source) {
        return 0;
      }
      if (toInt(goodsId, null) === moneyGoodsId) {
        return Math.max(0, toInt(endpoint.source.money, 0));
      }
      if (endpoint.kind === "train" || endpoint.kind === "merchant") {
        return getTradeTrainStockByGoodsId(endpoint.source, goodsId);
      }
      var key = tradeGoodsKeyById[goodsId];
      return Math.max(0, toInt(key ? endpoint.source[key] : 0, 0));
    }

    function projectMoneyQty(endpoint, throughSection) {
      if (!endpoint) {
        return 0;
      }
      var qty = readReportGoodsQty(endpoint, moneyGoodsId);
      eachSavedCargoOrder(function (order) {
        if (order.goodsId !== moneyGoodsId) {
          return;
        }
        if (orderMatchesEndpoint(endpoint, order.toNo)) {
          qty += order.quantity;
        } else if (orderMatchesEndpoint(endpoint, order.fromNo)) {
          qty = Math.max(0, qty - order.quantity);
        }
      }, throughSection);
      return qty;
    }

    function eachSavedCargoOrder(visitor, throughSection) {
      function visit(sectionKey, rows) {
        (rows || []).forEach(function (row) {
          var marker = toText(row && row.rowMarker, "").toUpperCase();
          if (marker && marker !== tradeRowMarker) {
            return;
          }
          var goodsId = toInt(row && row.goods, null);
          var quantity = Math.max(0, toInt(row && row.quantity, 0));
          var fromNo = toInt(
            sectionKey === "ts17" ? row && row.from : row && (row.source != null ? row.source : row.from),
            null,
          );
          var toNo = toInt(
            sectionKey === "ts17" ? row && row.to : row && (row.destination != null ? row.destination : row.to),
            null,
          );
          if (goodsId == null || quantity <= 0 || fromNo == null || toNo == null) {
            return;
          }
          visitor({ goodsId: goodsId, quantity: quantity, fromNo: fromNo, toNo: toNo });
        });
      }

      visit("ts17", $scope.ts17Rows);
      if (throughSection !== "ts17") {
        visit("ts19", $scope.ts19Rows);
      }
    }

    function orderMatchesEndpoint(endpoint, itemNo) {
      return !!(
        endpoint &&
        toInt(itemNo, null) === endpoint.itemNo &&
        resolveTradeKind(itemNo) === endpoint.kind
      );
    }

    function projectCarrierSlots(endpoint, throughSection) {
      var slots = reportCarrierSlots(endpoint && endpoint.source);
      eachSavedCargoOrder(function (order) {
        if (orderMatchesEndpoint(endpoint, order.toNo)) {
          addSlotQty(slots, order.goodsId, order.quantity);
        } else if (orderMatchesEndpoint(endpoint, order.fromNo)) {
          removeSlotQty(slots, order.goodsId, order.quantity);
        }
      }, throughSection);
      return slots;
    }

    function projectGoodsQty(endpoint, goodsId, throughSection) {
      if (!endpoint || goodsId == null) {
        return 0;
      }
      if (toInt(goodsId, null) === moneyGoodsId) {
        return projectMoneyQty(endpoint, throughSection);
      }
      if (endpoint.kind === "train" || endpoint.kind === "merchant") {
        var total = 0;
        projectCarrierSlots(endpoint, throughSection).forEach(function (slot) {
          if (slot.goodsId === goodsId) {
            total += Math.max(0, slot.qty);
          }
        });
        return total;
      }
      var qty = readReportGoodsQty(endpoint, goodsId);
      eachSavedCargoOrder(function (order) {
        if (order.goodsId !== goodsId) {
          return;
        }
        if (orderMatchesEndpoint(endpoint, order.toNo)) {
          qty += order.quantity;
        } else if (orderMatchesEndpoint(endpoint, order.fromNo)) {
          qty = Math.max(0, qty - order.quantity);
        }
      }, throughSection);
      return qty;
    }

    function copyTradeRow(row) {
      var copy = {};
      var key;
      for (key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          copy[key] = row[key];
        }
      }
      return copy;
    }

    function rowMatchesSelectedSphere(kind, row) {
      if (!$scope.selectedTradeSphere || !row) {
        return false;
      }
      if (kind === "warehouse") {
        return sphereForWarehouseNo(row.itemNo) === $scope.selectedTradeSphere;
      }
      return (row.sphere || getSphereForCoordinates(row.x, row.y)) === $scope.selectedTradeSphere;
    }

    function withTs17Cargo(kind, row) {
      if ($scope.selectedTradeSection !== "ts19" || !row) {
        return row;
      }
      var endpoint = rowToTradeEndpoint(kind, row);
      if (!endpoint) {
        return row;
      }
      var shown = copyTradeRow(row);
      if (kind === "train" || kind === "merchant") {
        var slots = projectCarrierSlots(endpoint, "ts17");
        shown.goods1 = slots[0] ? slots[0].goodsId : null;
        shown.quantity1 = slots[0] ? slots[0].qty : 0;
        shown.goods2 = slots[1] ? slots[1].goodsId : null;
        shown.quantity2 = slots[1] ? slots[1].qty : 0;
        return shown;
      }
      tradingGoodsConfig.forEach(function (good) {
        shown[good.key] = projectGoodsQty(endpoint, good.goodsId, "ts17");
      });
      return shown;
    }

    function measureCarrierSlots(slots) {
      var tons = 0;
      var names = [];
      (slots || []).forEach(function (slot) {
        if (!slot || !slot.goodsId || slot.qty <= 0) {
          return;
        }
        tons += slot.qty / perTonForGoodsId(slot.goodsId);
        names.push(tradeGoodsName(slot.goodsId));
      });
      return { tons: tons, names: names };
    }

    function carrierLoadLimit(endpoint) {
      if (!endpoint) {
        return 0;
      }
      if (endpoint.kind === "train") {
        return baggageTrainLoadTons;
      }
      if (endpoint.kind === "merchant") {
        var catalog = ($scope.masterData && ($scope.masterData.rulesCatalog || $scope.masterData.RulesCatalog)) || {};
        var lookup = boardingSharedFactory.buildShipCapacityLookupByType({
          ships: catalog.ships || catalog.Ships || [],
        });
        return boardingSharedFactory.getCatalogShipLoadCapacity({ type: endpoint.type }, lookup);
      }
      return 0;
    }

    function formatTons(value) {
      var rounded = Math.round((toNumber(value, 0) || 0) * 10) / 10;
      if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
        return String(Math.round(rounded));
      }
      return rounded.toFixed(1);
    }

    function isInBarracksOrShipyard(endpoint) {
      if (!endpoint || endpoint.x == null || endpoint.y == null) {
        return false;
      }
      return !!buildBarracksCoordinateLookup()[endpoint.x + "," + endpoint.y];
    }

    function getTs17BlockReason(fromEndpoint, toEndpoint) {
      if (!fromEndpoint || !toEndpoint) {
        return "Select a From item and a To item first.";
      }
      if (fromEndpoint.sphere !== toEndpoint.sphere) {
        return "TS17 needs both items in the same sphere.";
      }
      var warehouseEndpoint =
        fromEndpoint.kind === "warehouse" ? fromEndpoint : toEndpoint.kind === "warehouse" ? toEndpoint : null;
      var otherEndpoint =
        warehouseEndpoint === fromEndpoint ? toEndpoint : warehouseEndpoint === toEndpoint ? fromEndpoint : null;
      if (warehouseEndpoint) {
        if (otherEndpoint.kind === "city") {
          if (!warehouseOwnsCity(warehouseEndpoint, otherEndpoint)) {
            return "A warehouse cannot trade with a trade city you do not own.";
          }
          return null;
        }
        if (!isInBarracksOrShipyard(otherEndpoint)) {
          return (
            "TS17 needs " +
            tradeEndpointLabel(otherEndpoint) +
            " in a barracks or shipyard."
          );
        }
        return null;
      }
        if (
          fromEndpoint.x == null ||
          fromEndpoint.y == null ||
          toEndpoint.x == null ||
          toEndpoint.y == null
        ) {
          return "TS17 needs both items on the same coordinate.";
        }
        if (fromEndpoint.x !== toEndpoint.x || fromEndpoint.y !== toEndpoint.y) {
          return (
            "TS17 needs the same coordinate. " +
            tradeEndpointLabel(fromEndpoint) +
            " is at " +
            fromEndpoint.x +
            "/" +
            fromEndpoint.y +
            " and " +
            tradeEndpointLabel(toEndpoint) +
            " is at " +
            toEndpoint.x +
            "/" +
            toEndpoint.y +
            "."
          );
        }
        return null;
    }

    function getTransferBlockReason(sectionKey, fromEndpoint, toEndpoint, goodsId, quantity, repeatCount) {
      var repeats = Math.max(1, toInt(repeatCount, 1));
      var requiredQty = quantity * repeats;
      if (sectionKey === "ts17") {
        var positionReason = getTs17BlockReason(fromEndpoint, toEndpoint);
        if (positionReason) {
          return positionReason;
        }
      } else if (!fromEndpoint || !toEndpoint || fromEndpoint.sphere !== toEndpoint.sphere) {
        return "TS19 needs both items in the same sphere.";
      }

      var available = projectGoodsQty(fromEndpoint, goodsId);
      if (requiredQty > available) {
        return (
          tradeEndpointLabel(fromEndpoint) +
          " has " +
          available +
          " " +
          tradeGoodsName(goodsId) +
          ". The quantity is " +
          requiredQty +
          (repeats > 1 ? " (" + quantity + " x " + repeats + ")." : ".")
        );
      }

      if (toInt(goodsId, null) === moneyGoodsId) {
        return null;
      }

      if (toEndpoint.kind === "train" || toEndpoint.kind === "merchant") {
        var slots = projectCarrierSlots(toEndpoint);
        addSlotQty(slots, goodsId, requiredQty);
        var measured = measureCarrierSlots(slots);
        if (measured.names.length > 2) {
          return (
            tradeEndpointLabel(toEndpoint) +
            " would carry " +
            measured.names.join(" and ") +
            ". It can hold two goods types."
          );
        }
        var limit = carrierLoadLimit(toEndpoint);
        if (!(limit > 0)) {
          return tradeEndpointLabel(toEndpoint) + " has no loading capacity for its ship type.";
        }
        if (measured.tons > limit + 0.0001) {
          return (
            tradeEndpointLabel(toEndpoint) +
            " would hold " +
            formatTons(measured.tons) +
            " tons of " +
            measured.names.join(" and ") +
            ". Its loading capacity is " +
            limit +
            " tons."
          );
        }
      }

      return null;
    }

    function getTradeRepeatCount(fromEndpoint, toEndpoint, row) {
      if (!isSellTrade(fromEndpoint, toEndpoint)) {
        return 1;
      }
      var parsed = Math.round(toNumber(row && row.n, 1));
      return parsed > 0 ? parsed : 1;
    }

    function buildTradeRecords(goodsId, quantity, fromNo, toNo, repeatCount) {
      var repeats = Math.max(1, toInt(repeatCount, 1));
      var records = [];
      for (var i = 0; i < repeats; i++) {
        records.push({
          goods: goodsId,
          quantity: quantity,
          fromNo: fromNo,
          toNo: toNo,
          rowMarker: tradeRowMarker,
        });
      }
      return records;
    }

    function parseTradeReplayEntry(sectionKey, row) {
      var marker = toText(row && row.rowMarker, "").toUpperCase();
      if (marker && marker !== tradeRowMarker) {
        return null;
      }

      var goodsId = toInt(row && row.goods, null);
      var quantity = Math.max(0, toInt(row && row.quantity, 0));
      if (goodsId == null || quantity <= 0) {
        return null;
      }

      var fromNo = toInt(
        sectionKey === "ts17"
          ? row && row.from
          : row && (row.source != null ? row.source : row.from),
        null,
      );
      var toNo = toInt(
        sectionKey === "ts17"
          ? row && row.to
          : row && (row.destination != null ? row.destination : row.to),
        null,
      );
      if (fromNo == null || toNo == null) {
        return null;
      }

      var cityLookup = getCityLookupByItemNo();
      var fromIsTradeCity = !!cityLookup[fromNo];
      var toIsTradeCity = !!cityLookup[toNo];
      if (fromIsTradeCity === toIsTradeCity) {
        return null;
      }

      return {
        goodsId: goodsId,
        quantity: quantity,
        warehouseNo: fromIsTradeCity ? toNo : fromNo,
        cityItemNo: fromIsTradeCity ? fromNo : toNo,
        // Direction rule: TO trade city = sell, FROM trade city = buy.
        isSell: toIsTradeCity,
      };
    }

    function rebuildSavedTradingRows() {
      var cityLookup = getCityLookupByItemNo();
      var grouped = {};

      function absorbRow(sectionKey, row) {
        var parsed = parseTradeReplayEntry(sectionKey, row);
        if (!parsed) {
          return;
        }
        var key = parsed.cityItemNo + "|" + parsed.goodsId;
        if (!grouped[key]) {
          grouped[key] = {
            cityItemNo: parsed.cityItemNo,
            goodsId: parsed.goodsId,
            warehouseNo: parsed.warehouseNo,
            directBuyQty: 0,
            sellN: 0,
            sellQty: 0,
          };
        }

        grouped[key].warehouseNo = parsed.warehouseNo;
        if (parsed.isSell) {
          grouped[key].sellN += 1;
          if (!grouped[key].sellQty && parsed.quantity > 0) {
            grouped[key].sellQty = parsed.quantity;
          }
        } else {
          grouped[key].directBuyQty += parsed.quantity;
        }
      }

      ($scope.ts17Rows || []).forEach(function (row) {
        absorbRow("ts17", row);
      });
      ($scope.ts19Rows || []).forEach(function (row) {
        absorbRow("ts19", row);
      });

      var rows = Object.keys(grouped)
        .map(function (key) {
          var source = grouped[key];
          var city = cityLookup[source.cityItemNo];
          if (!city) {
            return null;
          }

          var goodsKey = tradeGoodsKeyById[source.goodsId];
          var calcTemplate = ($scope.tradingCalcRows || []).find(function (row) {
            return row.key === goodsKey;
          }) || {
            label: "Goods " + source.goodsId,
            goodsFactor: 0,
          };

          var sourceItemNo =
            source.warehouseNo != null ? source.warehouseNo : getWarehouseNoForCity(city);
          var rate = Math.max(0, toNumber(city && city.rate, 0));
          var stock = goodsKey ? Math.max(0, toNumber(city && city[goodsKey], 0)) : 0;
          var warehouseStock = goodsKey
            ? Math.max(0, toNumber(getCounterpartyStockByItemNoAndGood(sourceItemNo, source.goodsId, goodsKey), 0))
            : 0;

          var replayRow = {
            key: "saved-" + source.cityItemNo + "-" + source.goodsId,
            goodsId: source.goodsId,
            label: calcTemplate.label,
            goodsFactor: calcTemplate.goodsFactor,
            rate: rate,
            stock: stock,
            warehouse: warehouseStock,
            directBuyQty: source.directBuyQty,
            qty: source.sellQty,
            n: source.sellN,
            cityItemNo: source.cityItemNo,
            cityName: city.name,
          };

          var values = tradePriceFactory.calculate({
            goodsFactor: replayRow.goodsFactor,
            stock: replayRow.stock,
            directBuyQty: replayRow.directBuyQty,
            qty: replayRow.qty,
            n: replayRow.n,
            rate: rate,
          });
          replayRow.qtyS = values.qtyS;
          replayRow.netStock = values.netStock;
          replayRow.totalDirect = values.totalDirect;
          replayRow.totalSell = values.totalSell;
          replayRow.profitLd = values.profitLd;

          return replayRow;
        })
        .filter(function (row) {
          return !!row;
        })
        .sort(function (left, right) {
          if (left.cityItemNo !== right.cityItemNo) {
            return left.cityItemNo - right.cityItemNo;
          }
          return toText(left && left.label, "").localeCompare(toText(right && right.label, ""));
        });

      $scope.savedTradingRows = rows;
      $scope.savedTransferRows = buildSavedTransferRows();
    }

    function readCargoOrder(sectionKey, row) {
      var marker = toText(row && row.rowMarker, "").toUpperCase();
      if (marker && marker !== tradeRowMarker) {
        return null;
      }
      var goodsId = toInt(row && row.goods, null);
      var quantity = Math.max(0, toInt(row && row.quantity, 0));
      var fromNo = toInt(
        sectionKey === "ts17" ? row && row.from : row && (row.source != null ? row.source : row.from),
        null,
      );
      var toNo = toInt(
        sectionKey === "ts17" ? row && row.to : row && (row.destination != null ? row.destination : row.to),
        null,
      );
      if (goodsId == null || quantity <= 0 || fromNo == null || toNo == null) {
        return null;
      }
      return { goodsId: goodsId, quantity: quantity, fromNo: fromNo, toNo: toNo };
    }

    function savedItemLabel(itemNo) {
      var kind = resolveTradeKind(itemNo);
      var row = kind ? findTradeRow(kind, itemNo) : null;
      if (!row) {
        return String(itemNo);
      }
      return tradeEndpointLabel(rowToTradeEndpoint(kind, row));
    }

    function buildSavedTransferRows() {
      var grouped = {};
      function absorb(sectionKey, row) {
        var order = readCargoOrder(sectionKey, row);
        if (!order) {
          return;
        }
        var fromKind = resolveTradeKind(order.fromNo);
        var toKind = resolveTradeKind(order.toNo);
        if (fromKind === "city" || toKind === "city" || !fromKind || !toKind) {
          return;
        }
        var key = order.fromNo + "|" + order.toNo + "|" + order.goodsId;
        if (!grouped[key]) {
          grouped[key] = {
            key: "transfer-" + key,
            goodsId: order.goodsId,
            label: tradeGoodsName(order.goodsId),
            quantity: 0,
            fromItemNo: order.fromNo,
            toItemNo: order.toNo,
            fromLabel: savedItemLabel(order.fromNo),
            toLabel: savedItemLabel(order.toNo),
          };
        }
        grouped[key].quantity += order.quantity;
      }

      ($scope.ts17Rows || []).forEach(function (row) {
        absorb("ts17", row);
      });
      ($scope.ts19Rows || []).forEach(function (row) {
        absorb("ts19", row);
      });

      return Object.keys(grouped)
        .map(function (key) {
          return grouped[key];
        })
        .sort(function (left, right) {
          if (left.fromItemNo !== right.fromItemNo) {
            return left.fromItemNo - right.fromItemNo;
          }
          if (left.toItemNo !== right.toItemNo) {
            return left.toItemNo - right.toItemNo;
          }
          return toText(left.label, "").localeCompare(toText(right.label, ""));
        });
    }

    function getTurnSheetRows(sectionKey) {
      return sectionKey === "ts17" ? ($scope.ts17Rows || []) : ($scope.ts19Rows || []);
    }

    function buildTurnSheetTriplets(rows) {
      var triplets = [];
      var byOrderNo = {};
      (rows || []).forEach(function (row) {
        var orderNo = toInt(row && row.orderNo, null);
        if (orderNo == null) {
          return;
        }
        byOrderNo[orderNo] = row;
      });

      for (var i = 1; i <= 6; i++) {
        triplets.push([
          byOrderNo[i] || null,
          byOrderNo[i + 6] || null,
          byOrderNo[i + 12] || null,
        ]);
      }
      return triplets;
    }

    function refreshTurnSheetTriplets() {
      $scope.ts17Triplets = buildTurnSheetTriplets($scope.ts17Rows || []);
      $scope.ts19Triplets = buildTurnSheetTriplets($scope.ts19Rows || []);
    }

    function setTurnSheetRows(sectionKey, rows) {
      if (sectionKey === "ts17") {
        $scope.ts17Rows = rows;
      } else {
        $scope.ts19Rows = rows;
      }
      refreshTurnSheetTriplets();
      rebuildSavedTradingRows();
    }

    function setTradeSyncMessage(text, type) {
      $scope.tradeSyncMessage = text || null;
      $scope.tradeSyncMessageType = type || "warning";
    }

    function clearTradeSyncMessage() {
      $scope.tradeSyncMessage = null;
      $scope.tradeSyncMessageType = "warning";
    }

    function getWarehouseNoForCity(city) {
      var sphere = boardingSharedFactory.getSphereFromCoordinates(city && city.x, city && city.y);
      if (sphere === "Europe") {
        return 1;
      }
      if (sphere === "Caribbean") {
        return 2;
      }
      if (sphere === "India") {
        return 3;
      }
      return null;
    }

    function buildTradeRecordPlan(sectionKey, targetRow) {
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      if (!fromEndpoint || !toEndpoint) {
        return { error: "Select a From item and a To item first.", records: [] };
      }
      if (!targetRow) {
        return { error: "Select a goods row first.", records: [] };
      }

      var goodsId = toInt(targetRow.goodsId, null);
      if (goodsId == null) {
        goodsId = tradeGoodsIdByKey[targetRow.key];
      }
      var quantity = Math.max(0, Math.round(toNumber(targetRow.qty, 0)));
      if (goodsId == null) {
        return { error: "That goods row cannot be written.", records: [] };
      }
      if (quantity <= 0) {
        return { error: "Enter a quantity.", records: [] };
      }
      var repeatCount = getTradeRepeatCount(fromEndpoint, toEndpoint, targetRow);

      var blockReason = getTransferBlockReason(
        sectionKey,
        fromEndpoint,
        toEndpoint,
        goodsId,
        quantity,
        repeatCount,
      );
      if (blockReason) {
        return { error: blockReason, records: [] };
      }

      return {
        error: null,
        records: buildTradeRecords(goodsId, quantity, fromEndpoint.itemNo, toEndpoint.itemNo, repeatCount),
      };
    }

    function getWritableRowsWithCapacityCheck(sectionKey, recordsToWrite) {
      var existingRows = angular.copy(getTurnSheetRows(sectionKey) || []);
      var byOrderNo = {};
      (existingRows || []).forEach(function (row) {
        byOrderNo[toInt(row && row.orderNo, 0)] = row;
      });

      var availableRows = [];
      for (var orderNo = 1; orderNo <= tradeTurnSheetMaxRows; orderNo++) {
        var row = byOrderNo[orderNo];
        if (!row) {
          row = { turnId: $scope.masterData.turnId, orderNo: orderNo };
          existingRows.push(row);
          byOrderNo[orderNo] = row;
        }
        if (!toOccupiedInt(row.goods, null) || !toOccupiedInt(row.quantity, null)) {
          availableRows.push(row);
        }
      }

      if (availableRows.length < recordsToWrite.length) {
        return {
          hasCapacity: false,
          rows: existingRows,
        };
      }

      for (var i = 0; i < recordsToWrite.length; i++) {
        var record = recordsToWrite[i];
        var targetRow = availableRows[i];
        targetRow.goods = record.goods;
        targetRow.quantity = record.quantity;
        targetRow.rowMarker = record.rowMarker;
        if (sectionKey === "ts17") {
          targetRow.from = record.fromNo;
          targetRow.to = record.toNo;
        } else {
          targetRow.source = record.fromNo;
          targetRow.destination = record.toNo;
        }
      }

      existingRows.sort(function (left, right) {
        return toInt(left && left.orderNo, 0) - toInt(right && right.orderNo, 0);
      });

      return {
        hasCapacity: true,
        rows: existingRows,
      };
    }

    function getPostTypeForSection(sectionKey) {
      return sectionKey === "ts17" ? "TradeAndLoading1" : "TradeAndLoading2";
    }

    function normalizeTurnSheetRow(sectionKey, row) {
      row = row || {};
      var normalized = {
        turnId: row.turnId != null ? row.turnId : row.TurnId,
        orderNo: toInt(row.orderNo != null ? row.orderNo : row.OrderNo, null),
        goods: toOccupiedInt(row.goods != null ? row.goods : row.Goods, null),
        quantity: toOccupiedInt(row.quantity != null ? row.quantity : row.Quantity, null),
        rowMarker: toText(row.rowMarker != null ? row.rowMarker : row.RowMarker, ""),
      };

      if (!normalized.rowMarker) {
        normalized.rowMarker = null;
      }

      if (sectionKey === "ts17") {
        normalized.from = toOccupiedInt(row.from != null ? row.from : row.From, null);
        normalized.to = toOccupiedInt(row.to != null ? row.to : row.To, null);
      } else {
        normalized.source = toOccupiedInt(row.source != null ? row.source : row.Source, null);
        normalized.destination = toOccupiedInt(
          row.destination != null ? row.destination : row.Destination,
          null,
        );
      }

      return normalized;
    }

    function loadTradeTurnSheetRows() {
      var turnId = $scope.masterData && $scope.masterData.turnId;
      if (!turnId || turnId === "Unknown") {
        $scope.ts17Rows = [];
        $scope.ts19Rows = [];
        refreshTurnSheetTriplets();
        rebuildSavedTradingRows();
        return $q.when([]);
      }

      return $q
        .all([
          turnSheetFactory.getTSTradeAndLoading1(turnId),
          turnSheetFactory.getTSTradeAndLoading2(turnId),
        ])
        .then(function (result) {
          var ts17Rows = (result[0] || []).map(function (row) {
            return normalizeTurnSheetRow("ts17", row);
          });
          var ts19Rows = (result[1] || []).map(function (row) {
            return normalizeTurnSheetRow("ts19", row);
          });
          ts17Rows.sort(function (left, right) {
            return toInt(left && left.orderNo, 0) - toInt(right && right.orderNo, 0);
          });
          ts19Rows.sort(function (left, right) {
            return toInt(left && left.orderNo, 0) - toInt(right && right.orderNo, 0);
          });
          $scope.ts17Rows = ts17Rows;
          $scope.ts19Rows = ts19Rows;
          refreshTurnSheetTriplets();
          rebuildSavedTradingRows();
          refreshTradingCalcStocks();
          return result || [];
        });
    }

    function applyTradeRowsToSection(sectionKey, targetRow) {
      clearTradeSyncMessage();
      var tradePlan = buildTradeRecordPlan(sectionKey, targetRow);
      if (tradePlan.error) {
        setTradeSyncMessage(tradePlan.error, "warning");
        return $q.when(false);
      }

      if (!tradePlan.records.length) {
        setTradeSyncMessage("Enter a quantity.", "warning");
        return $q.when(false);
      }

      var writable = getWritableRowsWithCapacityCheck(sectionKey, tradePlan.records);
      if (!writable.hasCapacity) {
        setTradeSyncMessage("Not enough empty rows in " + (sectionKey === "ts17" ? "TS17" : "TS19") + ". No rows written.", "danger");
        return $q.when(false);
      }

      return turnSheetFactory
        .postTSRecords(writable.rows, getPostTypeForSection(sectionKey))
        .then(function () {
          setTurnSheetRows(sectionKey, writable.rows);
          setTradeSyncMessage(
            "Wrote " + tradePlan.records.length + " TRADE rows to " + (sectionKey === "ts17" ? "TS17" : "TS19") + ".",
            "success",
          );
          return loadTradeTurnSheetRows().then(function () {
            return true;
          });
        }, function () {
          setTradeSyncMessage("Failed to write rows to " + (sectionKey === "ts17" ? "TS17" : "TS19") + ".", "danger");
          return false;
        });
    }

    function clearTradeRowsFromSection(sectionKey) {
      clearTradeSyncMessage();
      var rows = angular.copy(getTurnSheetRows(sectionKey) || []);
      var changed = 0;

      rows.forEach(function (row) {
        if (toText(row && row.rowMarker, "") !== tradeRowMarker) {
          return;
        }
        changed++;
        row.goods = null;
        row.quantity = null;
        row.rowMarker = null;
        if (sectionKey === "ts17") {
          row.from = null;
          row.to = null;
        } else {
          row.source = null;
          row.destination = null;
        }
      });

      if (!changed) {
        setTradeSyncMessage("No TRADE rows found in " + (sectionKey === "ts17" ? "TS17" : "TS19") + ".", "warning");
        return $q.when(false);
      }

      return turnSheetFactory
        .postTSRecords(rows, getPostTypeForSection(sectionKey))
        .then(function () {
          setTurnSheetRows(sectionKey, rows);
          setTradeSyncMessage("Cleared " + changed + " TRADE rows from " + (sectionKey === "ts17" ? "TS17" : "TS19") + ".", "success");
          return loadTradeTurnSheetRows().then(function () {
            return true;
          });
        }, function () {
          setTradeSyncMessage("Failed to clear TRADE rows from " + (sectionKey === "ts17" ? "TS17" : "TS19") + ".", "danger");
          return false;
        });
    }

    $scope.masterData = masterData;
    $scope.activeTradeTab = "trading";
    $scope.tradeRows = [];
    $scope.playerBaggageTrainRows = [];
    $scope.playerMerchantShipRows = [];
    $scope.tradeCityRows = [];
    $scope.ownedTradeCityRows = [];
    $scope.visibleTradeCityRows = [];
    $scope.sphereWarehouseRows = [];
    $scope.availableTradeWarehouseRows = [];
    $scope.availableTradeBaggageTrainRows = [];
    $scope.availableTradeMerchantShipRows = [];
    $scope.selectedTradeSection = null;
    $scope.selectedTradeSphere = null;
    $scope.tradeSphereChoices = [
      { key: "Europe", label: "Europe" },
      { key: "Caribbean", label: "Caribbean" },
      { key: "India", label: "India" },
    ];
    $scope.selectedTradeFrom = null;
    $scope.selectedTradeTo = null;
    $scope.tradingCalcRows = tradingGoodsConfig.map(createTradingCalcRow);
    $scope.savedTradingRows = [];
    $scope.savedTransferRows = [];
    $scope.ts17Rows = [];
    $scope.ts19Rows = [];
    $scope.ts17Triplets = [];
    $scope.ts19Triplets = [];
    $scope.tradeTurnSheetsCollapsed = true;
    $scope.tradeSyncMessage = null;
    $scope.tradeSyncMessageType = "warning";
    $scope.hasNewFederationColumn = false;
    $scope.isLoading = false;
    $scope.loadError = null;

    tradeBoardingFactory.attach($scope, turnSheetFactory);

    $scope.selectTradeTab = function (tabKey) {
      $scope.activeTradeTab =
        tabKey && Object.prototype.hasOwnProperty.call(validTradeTabs, tabKey)
          ? tabKey
          : "trading";
    };

    $scope.sameNullableInt = function (left, right) {
      return parseInt(left, 10) === parseInt(right, 10);
    };

    $scope.toggleTradeTurnSheets = function () {
      $scope.tradeTurnSheetsCollapsed = !$scope.tradeTurnSheetsCollapsed;
    };

    $scope.selectTradeSection = function (sectionKey) {
      if (sectionKey !== "ts17" && sectionKey !== "ts19") {
        return;
      }
      if ($scope.selectedTradeSection === sectionKey) {
        return;
      }
      $scope.selectedTradeSection = sectionKey;
      $scope.selectedTradeFrom = null;
      $scope.selectedTradeTo = null;
      clearTradingInputValues();
      $scope.clearTradingCalculatedValues();
      refreshTradingCalcStocks();
    };

    $scope.selectTradeSphere = function (sphere) {
      var allowed = { Europe: true, Caribbean: true, India: true };
      if (!allowed[sphere] || $scope.selectedTradeSphere === sphere) {
        return;
      }
      $scope.selectedTradeSphere = sphere;
      $scope.selectedTradeFrom = null;
      $scope.selectedTradeTo = null;
      clearTradingInputValues();
      $scope.clearTradingCalculatedValues();
      refreshTradingCalcStocks();
    };

    $scope.getTradeSelectionTitle = function () {
      if (!$scope.selectedTradeSection) {
        return "Select Trade 17 or Trade 19.";
      }
      var sectionLabel = $scope.selectedTradeSection === "ts19" ? "Trade 19" : "Trade 17";
      if (!$scope.selectedTradeSphere) {
        return sectionLabel + ". Select a sphere.";
      }
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      if (!fromEndpoint) {
        return sectionLabel + " in " + $scope.selectedTradeSphere + ". Select the From item.";
      }
      if (!toEndpoint) {
        return "From " + tradeEndpointLabel(fromEndpoint) + ". Select the To item.";
      }
      var cityEndpoint = tradeCityEndpoint(fromEndpoint, toEndpoint);
      if (!cityEndpoint) {
        return "From " + tradeEndpointLabel(fromEndpoint) + " to " + tradeEndpointLabel(toEndpoint);
      }
      var direction = fromEndpoint.kind === "city" ? "Buy" : "Sell";
      return (
        direction +
        ": from " +
        tradeEndpointLabel(fromEndpoint) +
        " to " +
        tradeEndpointLabel(toEndpoint)
      );
    };

    $scope.getTradeToPrompt = function () {
      if ($scope.selectedTradeSection !== "ts17") {
        return "Select the To item in the same sphere.";
      }
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      if (fromEndpoint && fromEndpoint.kind === "warehouse") {
        return "Select a train or ship in a barracks or shipyard, or an owned trade city.";
      }
      return "Select the To item on the same coordinate.";
    };

    $scope.getTradePositionHint = function () {
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      if (!fromEndpoint || !toEndpoint) {
        return "";
      }
      var reason = getTs17BlockReason(fromEndpoint, toEndpoint);
      if (!reason) {
        return "TS17 and TS19 can both take this transfer.";
      }
      return reason + " TS19 can still write it.";
    };

    $scope.tradePositionHintIsWarning = function () {
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      return !!(fromEndpoint && toEndpoint && getTs17BlockReason(fromEndpoint, toEndpoint));
    };

    $scope.tradeInvolvesCity = function () {
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      return !!tradeCityEndpoint(fromEndpoint, toEndpoint);
    };

    $scope.isSellTrade = function () {
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      return isSellTrade(fromEndpoint, toEndpoint);
    };

    $scope.isMoveTrade = function () {
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      return isMoveTrade(fromEndpoint, toEndpoint);
    };

    $scope.getTradingEntryRows = function () {
      var rows = ($scope.tradingCalcRows || []).slice();
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      if (!fromEndpoint || !toEndpoint) {
        return rows;
      }
      if (isMoveTrade(fromEndpoint, toEndpoint)) {
        return rows.filter(function (row) {
          var goodsId = toInt(row && row.goodsId, null);
          if (goodsId === moneyGoodsId) {
            return true;
          }
          return Math.max(0, toInt(row && row.fromStock, 0)) > 0;
        });
      }
      return rows.filter(function (row) {
        return toInt(row && row.goodsId, null) !== moneyGoodsId;
      });
    };

    $scope.isTradeEndpointSelected = function (kind, itemNo) {
      function matches(selection) {
        return !!(
          selection &&
          selection.kind === kind &&
          toInt(selection.itemNo, null) === toInt(itemNo, null)
        );
      }
      return matches($scope.selectedTradeFrom) || matches($scope.selectedTradeTo);
    };

    $scope.getVisibleTradeWarehouseRows = function () {
      return visibleTradeRows("warehouse");
    };

    $scope.getVisibleTradeBaggageTrainRows = function () {
      return visibleTradeRows("train");
    };

    $scope.getVisibleTradeMerchantShipRows = function () {
      return visibleTradeRows("merchant");
    };

    $scope.getVisibleTradeCityRows = function () {
      return visibleTradeRows("city");
    };

    $scope.clearTradingCalculatedValues = function () {
      ($scope.tradingCalcRows || []).forEach(function (row) {
        row.qtyS = 0;
        row.totalDirect = null;
        row.totalSell = null;
        row.profitLd = null;
      });
    };

    $scope.clearTradingGridInputs = function () {
      clearTradingInputValues();
      $scope.clearTradingCalculatedValues();
    };

    $scope.startNewTrade = function () {
      $scope.selectedTradeFrom = null;
      $scope.selectedTradeTo = null;
      clearTradingInputValues();
      $scope.clearTradingCalculatedValues();
      clearTradeSyncMessage();
      refreshTradingSelectionLists();
      refreshTradingCalcStocks();
    };

    $scope.selectTradeEndpoint = function (kind, row) {
      if (!row) {
        return;
      }
      var itemNo = toInt(row.itemNo, null);
      var fromSelection = $scope.selectedTradeFrom;
      if (
        fromSelection &&
        fromSelection.kind === kind &&
        toInt(fromSelection.itemNo, null) === itemNo
      ) {
        $scope.selectedTradeTo = null;
        clearTradingInputValues();
        $scope.clearTradingCalculatedValues();
        refreshTradingCalcStocks();
        return;
      }
      if (!fromSelection) {
        $scope.selectedTradeFrom = { kind: kind, itemNo: itemNo };
        $scope.selectedTradeTo = null;
        clearTradingInputValues();
        $scope.clearTradingCalculatedValues();
        refreshTradingCalcStocks();
        return;
      }
      var fromEndpoint = currentTradeEndpoint(fromSelection);
      var candidate = rowToTradeEndpoint(kind, row);
      if (!fromEndpoint || !candidate || !isTradeCandidate(fromEndpoint, candidate)) {
        return;
      }
      $scope.selectedTradeTo = { kind: kind, itemNo: itemNo };
      clearTradingInputValues();
      $scope.clearTradingCalculatedValues();
      refreshTradingCalcStocks();
    };

    $scope.isTradeReadyForInput = function () {
      return !!(currentTradeEndpoint($scope.selectedTradeFrom) && currentTradeEndpoint($scope.selectedTradeTo));
    };

    $scope.calculateTrade = function () {
      if (!$scope.isTradeReadyForInput()) {
        return;
      }
      var fromEndpoint = currentTradeEndpoint($scope.selectedTradeFrom);
      var toEndpoint = currentTradeEndpoint($scope.selectedTradeTo);
      var cityEndpoint = tradeCityEndpoint(fromEndpoint, toEndpoint);
      var isBuy = !!(cityEndpoint && fromEndpoint.kind === "city");
      ($scope.tradingCalcRows || []).forEach(function (row) {
        var quantity = Math.max(0, Math.round(toNumber(row && row.qty, 0)));
        var repeats = getTradeRepeatCount(fromEndpoint, toEndpoint, row);
        if (!cityEndpoint) {
          row.totalDirect = null;
          row.totalSell = null;
          row.profitLd = null;
          return;
        }
        var values = tradePriceFactory.calculate({
          goodsFactor: row.goodsFactor,
          stock: row.stock,
          directBuyQty: isBuy ? quantity : 0,
          qty: isBuy ? 0 : quantity,
          n: !isBuy && quantity > 0 ? repeats : 0,
          rate: cityEndpoint.rate,
        });
        row.totalDirect = values.totalDirect;
        row.totalSell = values.totalSell;
        row.profitLd = values.profitLd;
      });
    };

    $scope.addTrade1 = function () {
      return applyTradeRowsToSection("ts17", null);
    };

    $scope.addTrade2 = function () {
      return applyTradeRowsToSection("ts19", null);
    };

    $scope.addTrade1ForRow = function (row) {
      return applyTradeRowsToSection("ts17", row || null);
    };

    $scope.addTrade2ForRow = function (row) {
      return applyTradeRowsToSection("ts19", row || null);
    };

    $scope.clearTrade1 = function () {
      return clearTradeRowsFromSection("ts17");
    };

    $scope.clearTrade2 = function () {
      return clearTradeRowsFromSection("ts19");
    };

    $scope.getTradingNetStock = function (row) {
      var stock = Math.max(0, toNumber(row && row.stock, 0));
      var directBuyQty = Math.max(
        0,
        Math.round(toNumber(row && row.directBuyQty, 0)),
      );
      return Math.max(0, stock - directBuyQty);
    };

    $scope.getTradingStockPlusWarehouse = function (row) {
      var stock = Math.max(0, toNumber(row && row.stock, 0));
      var warehouse = Math.max(0, toNumber(row && row.warehouse, 0));
      return stock + warehouse;
    };

    $scope.getTradingGoodsCode = function (row) {
      if (!row) {
        return "";
      }
      if (row.goodsId != null) {
        return row.goodsId;
      }
      return tradeGoodsIdByKey[row.key] != null ? tradeGoodsIdByKey[row.key] : "";
    };

    $scope.formatTradeBoarded = function (tradeRow) {
      if (!tradeRow) {
        return "----";
      }

      if (tradeRow.boardingSelected && tradeRow.boardingFleetNo != null) {
        return tradeRow.boardingFleetNo;
      }

      return "----";
    };

    $scope.refreshTradeRows = function () {
      var baggageTrains = getTradeReportRows();
      var hasNewFederation = false;

      var mappedRows = (baggageTrains || [])
        .map(function (train) {
          var itemNo = toInt(train && train.itemNo, null);
          var newFederation =
            train && train.newFederation != null
              ? toInt(train.newFederation, null)
              : null;
          if (newFederation != null) {
            hasNewFederation = true;
          }

          return {
            id: itemNo,
            itemNo: itemNo,
            x: toInt(train && train.x, null),
            y: toInt(train && train.y, null),
            federationNo: toInt(train && train.federationNo, null),
            newFederation: newFederation,
            mp: toInt(train && train.mp, null),
            condition: toInt(train && train.condition, null),
            goods1: toInt(train && train.goods1, null),
            quantity1: toInt(train && train.quantity1, 0),
            goods2: toInt(train && train.goods2, null),
            quantity2: toInt(train && train.quantity2, 0),
            money: toInt(train && train.money, 0),
            sphere: getSphereForCoordinates(train && train.x, train && train.y),
            boardingSelected: false,
            boardingFleetNo: null,
          };
        })
        .sort(function (left, right) {
          return toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0);
        });

      $scope.tradeRows = mappedRows;
      $scope.playerBaggageTrainRows = mappedRows;
      $scope.hasNewFederationColumn = hasNewFederation;
      refreshTradingSelectionLists();
      refreshTradingCalcStocks();
    };

    $scope.refreshMerchantShipRows = function () {
      var merchantShips = getMerchantShipReportRows();
      $scope.playerMerchantShipRows = (merchantShips || [])
        .map(function (ship) {
          var itemNo = toInt(ship && (ship.itemNo != null ? ship.itemNo : ship.ItemNo), null);
          return {
            id: itemNo,
            itemNo: itemNo,
            x: toInt(ship && (ship.x != null ? ship.x : ship.X), null),
            y: toInt(ship && (ship.y != null ? ship.y : ship.Y), null),
            goods1: toInt(ship && (ship.goods1 != null ? ship.goods1 : ship.Goods1), null),
            quantity1: toInt(ship && (ship.quantity1 != null ? ship.quantity1 : ship.Quantity1), 0),
            goods2: toInt(ship && (ship.goods2 != null ? ship.goods2 : ship.Goods2), null),
            quantity2: toInt(ship && (ship.quantity2 != null ? ship.quantity2 : ship.Quantity2), 0),
            money: toInt(ship && (ship.money != null ? ship.money : ship.Money), 0),
            type: toInt(ship && (ship.type != null ? ship.type : ship.Type), null),
            sphere: getSphereForCoordinates(
              ship && (ship.x != null ? ship.x : ship.X),
              ship && (ship.y != null ? ship.y : ship.Y),
            ),
          };
        })
        .sort(function (left, right) {
          return toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0);
        });
      refreshTradingSelectionLists();
      refreshTradingCalcStocks();
    };

    $scope.formatTradeGoodsWithName = function (goodsId) {
      var id = toInt(goodsId, null);
      if (id == null) {
        return "----";
      }
      var label = toText(tradeGoodsLabelById[id], "");
      return label ? id + " (" + label + ")" : id.toString();
    };

    $scope.refreshTradeCityRows = function () {
      var tradingCities = getTradingCitiesReportRows();
      var barracksLookup = buildBarracksCoordinateLookup();
      var mappedRows = (tradingCities || [])
        .map(function (city) {
          var itemNo = toInt(city && (city.itemNo != null ? city.itemNo : city.ItemNo), null);
          var x = toInt(city && (city.x != null ? city.x : city.X), null);
          var y = toInt(city && (city.y != null ? city.y : city.Y), null);
          return {
            id: itemNo,
            itemNo: itemNo,
            x: x,
            y: y,
            name: toText(city && (city.name != null ? city.name : city.Name), ""),
            rate: toInt(city && (city.rate != null ? city.rate : city.Rate), 0),
            ectPts: toInt(city && (city.ectPts != null ? city.ectPts : city.EctPts), 0),
            food: toInt(city && (city.food != null ? city.food : city.Food), 0),
            stone: toInt(city && (city.stone != null ? city.stone : city.Stone), 0),
            wood: toInt(city && (city.wood != null ? city.wood : city.Wood), 0),
            ore: toInt(city && (city.ore != null ? city.ore : city.Ore), 0),
            zinc: toInt(city && (city.zinc != null ? city.zinc : city.Zinc), 0),
            horses: toInt(city && (city.horses != null ? city.horses : city.Horses), 0),
            textiles: toInt(city && (city.textiles != null ? city.textiles : city.Textiles), 0),
            wool: toInt(city && (city.wool != null ? city.wool : city.Wool), 0),
            gold: toInt(city && (city.gold != null ? city.gold : city.Gold), 0),
            wine: toInt(city && (city.wine != null ? city.wine : city.Wine), 0),
            isOwned: !!barracksLookup[x + "," + y],
            sphere: getSphereForCoordinates(x, y),
          };
        })
        .sort(function (left, right) {
          return toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0);
        });

      $scope.tradeCityRows = mappedRows;
      $scope.ownedTradeCityRows = mappedRows.filter(function (city) {
        return !!barracksLookup[city.x + "," + city.y];
      });
      refreshSphereWarehouseRows();
      syncTradeSelection();
      refreshTradingSelectionLists();
      refreshTradingCalcStocks();
      $scope.clearTradingCalculatedValues();
      rebuildSavedTradingRows();
    };

    $scope.replayTradeBoardingFromRows = function (boardingRows) {
      boardingSharedFactory.replayBoardingAssignments({
        rows: boardingRows || [],
        units: $scope.tradeRows || [],
        getUnitId: function (tradeRow) {
          return toInt(tradeRow && tradeRow.id, null);
        },
        applyAssigned: function (tradeRow, fleetNo) {
          tradeRow.boardingSelected = true;
          tradeRow.boardingFleetNo = fleetNo;
        },
        applyUnassigned: function (tradeRow) {
          tradeRow.boardingSelected = false;
          tradeRow.boardingFleetNo = null;
        },
        clearUnassigned: true,
      });
    };

    $scope.getTradeBoardToggleStyle = function (isSelected) {
      if (!isSelected) {
        return {};
      }

      return {
        "background-color": "#e8f2ff",
        color: "#1f4f8c",
        "border-color": "#80a7d9",
      };
    };

    function loadBoardingReplay() {
      return turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
        function (rows) {
          $scope.replayTradeBoardingFromRows(rows || []);
          return rows || [];
        },
        function () {
          $scope.replayTradeBoardingFromRows([]);
          return [];
        },
      );
    }

    function afterTurnReportLoaded() {
      $scope.refreshTradeRows();
      $scope.refreshMerchantShipRows();
      $scope.refreshTradeCityRows();
      refreshTradingCalcGoodsMeta();
      return $q.all([loadBoardingReplay(), loadTradeTurnSheetRows()]);
    }

    $scope.initTrade = function () {
      if (
        !$scope.masterData ||
        !$scope.masterData.turnId ||
        $scope.masterData.turnId === "Unknown"
      ) {
        $scope.tradeRows = [];
        $scope.playerBaggageTrainRows = [];
        $scope.playerMerchantShipRows = [];
        $scope.tradeCityRows = [];
        $scope.ownedTradeCityRows = [];
        $scope.visibleTradeCityRows = [];
        $scope.sphereWarehouseRows = [];
        $scope.availableTradeWarehouseRows = [];
        $scope.availableTradeBaggageTrainRows = [];
        $scope.availableTradeMerchantShipRows = [];
        $scope.ts17Rows = [];
        $scope.ts19Rows = [];
        refreshTurnSheetTriplets();
        $scope.savedTradingRows = [];
        $scope.savedTransferRows = [];
        $scope.selectedTradeFrom = null;
        $scope.selectedTradeTo = null;
        clearTradeSyncMessage();
        refreshTradingCalcStocks();
        $scope.clearTradingCalculatedValues();
        $scope.hasNewFederationColumn = false;
        return;
      }

      $scope.isLoading = true;
      $scope.loadError = null;

      var hasTurnReport =
        $scope.masterData.turnReport &&
        ($scope.masterData.turnReport.baggageTrains ||
          $scope.masterData.turnReport.merchantShips ||
          $scope.masterData.turnReport.MerchantShips ||
          $scope.masterData.turnReport.tradingPortsAndCities);
      var loadPromise = hasTurnReport
        ? $q.when($scope.masterData.turnReport)
        : turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId);

      loadPromise
        .then(afterTurnReportLoaded, function (error) {
          $scope.loadError =
            error && error.data ? error.data : "Unable to load trade data.";
          $scope.tradeRows = [];
          $scope.playerBaggageTrainRows = [];
          $scope.playerMerchantShipRows = [];
          $scope.tradeCityRows = [];
          $scope.ownedTradeCityRows = [];
          $scope.visibleTradeCityRows = [];
          $scope.sphereWarehouseRows = [];
          $scope.availableTradeWarehouseRows = [];
          $scope.availableTradeBaggageTrainRows = [];
          $scope.availableTradeMerchantShipRows = [];
          $scope.ts17Rows = [];
          $scope.ts19Rows = [];
          refreshTurnSheetTriplets();
          $scope.savedTradingRows = [];
          $scope.savedTransferRows = [];
          $scope.selectedTradeFrom = null;
          $scope.selectedTradeTo = null;
          clearTradeSyncMessage();
          refreshTradingCalcStocks();
          $scope.clearTradingCalculatedValues();
          $scope.hasNewFederationColumn = false;
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };

    refreshTradingCalcGoodsMeta();
  },
);
