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
  ) {
    var validTradeTabs = {
      baggageTrains: true,
      tradingCities: true,
      trading: true,
    };
    var tradingGoodsConfig = [
      { key: "ectPts", itemType: "ecpts", label: "EcPts", fallbackGoodsFactor: 6, fallbackPerTon: 25 },
      { key: "zinc", itemType: "zinc", label: "Zinc", fallbackGoodsFactor: 45, fallbackPerTon: 1 },
      { key: "gold", itemType: "gold", label: "Gold", fallbackGoodsFactor: 35, fallbackPerTon: 1 },
      { key: "ore", itemType: "ore", label: "Ore", fallbackGoodsFactor: 30, fallbackPerTon: 1 },
      { key: "horses", itemType: "horses", label: "Horses", fallbackGoodsFactor: 2, fallbackPerTon: 5 },
      { key: "wood", itemType: "wood", label: "Wood", fallbackGoodsFactor: 3, fallbackPerTon: 3 },
      { key: "wine", itemType: "wine", label: "Wine", fallbackGoodsFactor: 8, fallbackPerTon: 1 },
      { key: "textiles", itemType: "textiles", label: "Textiles", fallbackGoodsFactor: 5, fallbackPerTon: 1 },
      { key: "food", itemType: "food", label: "Food", fallbackGoodsFactor: 4, fallbackPerTon: 1 },
      { key: "wool", itemType: "wool", label: "Wool", fallbackGoodsFactor: 2, fallbackPerTon: 1 },
      { key: "stone", itemType: "stone", label: "Stone", fallbackGoodsFactor: 1, fallbackPerTon: 3 },
    ];
    var tradeGoodsIdByKey = {
      ectPts: 13,
      food: 16,
      stone: 18,
      wood: 19,
      ore: 20,
      zinc: 21,
      horses: 22,
      textiles: 23,
      wool: 24,
      gold: 29,
      wine: 30,
    };
    var tradeGoodsKeyById = {};
    Object.keys(tradeGoodsIdByKey).forEach(function (key) {
      tradeGoodsKeyById[tradeGoodsIdByKey[key]] = key;
    });
    var tradeRowMarker = "TRADE";
    var tradeTurnSheetMaxRows = 18;
    var sphereWarehouseNos = { 1: true, 2: true, 3: true };

    function toInt(value, fallback) {
      var parsed = parseInt(value, 10);
      return isNaN(parsed) ? fallback : parsed;
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

    function calculateTradeValues(row, rate) {
      var goodsFactor = Math.max(0, toNumber(row && row.goodsFactor, 0));
      var qtyC = Math.max(0, toNumber(row && row.stock, 0));
      var directBuyQty = Math.max(0, Math.round(toNumber(row && row.directBuyQty, 0)));
      var qty = Math.max(0, Math.round(toNumber(row && row.qty, 0)));
      var n = Math.max(0, Math.round(toNumber(row && row.n, 0)));
      var qtyS = qty * n;
      var netStock = Math.max(0, qtyC - directBuyQty);

      var buyPerUnit = (1600 * goodsFactor * rate) / Math.sqrt(qtyC + 10);
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
      var selectedCity = $scope.selectedTradingCity;
      var warehouseNo = getWarehouseNoForCity(selectedCity);
      var selectedWarehouse = null;
      ($scope.sphereWarehouseRows || []).forEach(function (warehouseRow) {
        if (toInt(warehouseRow && warehouseRow.itemNo, null) === warehouseNo) {
          selectedWarehouse = warehouseRow;
        }
      });
      ($scope.tradingCalcRows || []).forEach(function (row) {
        row.stock = toInt(selectedCity && selectedCity[row.key], 0);
        row.warehouse = toInt(selectedWarehouse && selectedWarehouse[row.key], 0);
      });
    }

    function getTradeReportRows() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.baggageTrains || [];
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

    function syncSelectedTradingCityAfterRefresh() {
      if (!$scope.selectedTradingCity) {
        return;
      }
      var selectedMatch = ($scope.ownedTradeCityRows || []).find(function (city) {
        return city.id === $scope.selectedTradingCity.id;
      });
      $scope.selectedTradingCity = selectedMatch || null;
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

    function getWarehouseLookupByItemNo() {
      var lookup = {};
      ($scope.sphereWarehouseRows || []).forEach(function (warehouse) {
        var warehouseNo = toInt(warehouse && warehouse.itemNo, null);
        if (warehouseNo == null) {
          return;
        }
        lookup[warehouseNo] = warehouse;
      });
      return lookup;
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
      var warehouseLookup = getWarehouseLookupByItemNo();
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

          var warehouseNo =
            source.warehouseNo != null ? source.warehouseNo : getWarehouseNoForCity(city);
          var warehouse = warehouseLookup[warehouseNo] || {};
          var rate = Math.max(0, toNumber(city && city.rate, 0));
          var stock = goodsKey ? Math.max(0, toNumber(city && city[goodsKey], 0)) : 0;
          var warehouseStock = goodsKey ? Math.max(0, toNumber(warehouse && warehouse[goodsKey], 0)) : 0;

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

          var values = calculateTradeValues(replayRow, rate);
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
    }

    function hasAnyTurnSheetValue(row, fields) {
      if (!row) {
        return false;
      }
      for (var i = 0; i < fields.length; i++) {
        var value = row[fields[i]];
        if (value != null && value !== "") {
          return true;
        }
      }
      return false;
    }

    function getTurnSheetFieldSet(sectionKey) {
      if (sectionKey === "ts17") {
        return ["goods", "quantity", "from", "to", "rowMarker"];
      }
      return ["goods", "quantity", "source", "destination", "rowMarker"];
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

    function buildTradeRecordPlan(targetRow) {
      if (!$scope.selectedTradingCity) {
        return { error: "Select an owned trade city first.", records: [] };
      }

      var cityItemNo = toInt($scope.selectedTradingCity.itemNo, null);
      var warehouseNo = getWarehouseNoForCity($scope.selectedTradingCity);
      if (cityItemNo == null || warehouseNo == null) {
        return { error: "Selected trade city has invalid location mapping.", records: [] };
      }

      var records = [];
      var rowsToProcess = targetRow ? [targetRow] : ($scope.tradingCalcRows || []);
      (rowsToProcess || []).forEach(function (row) {
        var goodsId = tradeGoodsIdByKey[row.key];
        var buyQty = Math.max(0, Math.round(toNumber(row.directBuyQty, 0)));
        var sellQty = Math.max(0, Math.round(toNumber(row.qty, 0)));
        var n = Math.max(0, Math.round(toNumber(row.n, 0)));
        if (goodsId == null) {
          return;
        }

        if (buyQty > 0) {
          records.push({
            goods: goodsId,
            quantity: buyQty,
            fromNo: cityItemNo,
            toNo: warehouseNo,
            rowMarker: tradeRowMarker,
          });
        }

        if (sellQty > 0 && n > 0) {
          for (var i = 0; i < n; i++) {
            records.push({
              goods: goodsId,
              quantity: sellQty,
              fromNo: warehouseNo,
              toNo: cityItemNo,
              rowMarker: tradeRowMarker,
            });
          }
        }
      });

      return { error: null, records: records };
    }

    function getWritableRowsWithCapacityCheck(sectionKey, recordsToWrite) {
      var fields = getTurnSheetFieldSet(sectionKey);
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
        if (!hasAnyTurnSheetValue(row, fields)) {
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
        goods: toInt(row.goods != null ? row.goods : row.Goods, null),
        quantity: toInt(row.quantity != null ? row.quantity : row.Quantity, null),
        rowMarker: toText(row.rowMarker != null ? row.rowMarker : row.RowMarker, ""),
      };

      if (!normalized.rowMarker) {
        normalized.rowMarker = null;
      }

      if (sectionKey === "ts17") {
        normalized.from = toInt(row.from != null ? row.from : row.From, null);
        normalized.to = toInt(row.to != null ? row.to : row.To, null);
      } else {
        normalized.source = toInt(row.source != null ? row.source : row.Source, null);
        normalized.destination = toInt(
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
          return result || [];
        });
    }

    function applyTradeRowsToSection(sectionKey, targetRow) {
      clearTradeSyncMessage();
      var tradePlan = buildTradeRecordPlan(targetRow);
      if (tradePlan.error) {
        setTradeSyncMessage(tradePlan.error, "warning");
        return $q.when(false);
      }

      if (!tradePlan.records.length) {
        setTradeSyncMessage("No trade rows to write. Enter Direct Buy Qty and/or Qty + n.", "warning");
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
    $scope.tradeCityRows = [];
    $scope.ownedTradeCityRows = [];
    $scope.sphereWarehouseRows = [];
    $scope.selectedTradingCity = null;
    $scope.tradingCalcRows = tradingGoodsConfig.map(createTradingCalcRow);
    $scope.savedTradingRows = [];
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

    $scope.getSelectedTradingCityTitle = function () {
      if (!$scope.selectedTradingCity) {
        return "No owned trade city selected.";
      }
      return (
        $scope.selectedTradingCity.itemNo +
        " - " +
        $scope.selectedTradingCity.name +
        " (" +
        $scope.selectedTradingCity.x +
        "/" +
        $scope.selectedTradingCity.y +
        ") - Rate " +
        $scope.selectedTradingCity.rate
      );
    };

    $scope.isOwnedTradingCitySelected = function (city) {
      return !!(
        city &&
        $scope.selectedTradingCity &&
        $scope.selectedTradingCity.id === city.id
      );
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
      ($scope.tradingCalcRows || []).forEach(function (row) {
        row.directBuyQty = null;
        row.qty = null;
        row.n = null;
      });
      $scope.selectedTradingCity = null;
      refreshTradingCalcStocks();
      $scope.clearTradingCalculatedValues();
    };

    $scope.selectOwnedTradingCity = function (city) {
      $scope.selectedTradingCity = city || null;
      refreshTradingCalcStocks();
      $scope.clearTradingCalculatedValues();
    };

    $scope.calculateTrade = function () {
      if (!$scope.selectedTradingCity) {
        return;
      }

      var rate = Math.max(0, toNumber($scope.selectedTradingCity.rate, 0));
      ($scope.tradingCalcRows || []).forEach(function (row) {
        var values = calculateTradeValues(row, rate);
        row.qtyS = values.qtyS;
        row.directBuyQty = values.directBuyQty;
        row.qty = values.qty;
        row.n = values.n;
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

      $scope.tradeRows = (baggageTrains || [])
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
            boardingSelected: false,
            boardingFleetNo: null,
          };
        })
        .sort(function (left, right) {
          return toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0);
        });

      $scope.hasNewFederationColumn = hasNewFederation;
    };

    $scope.refreshTradeCityRows = function () {
      var tradingCities = getTradingCitiesReportRows();
      var barracksLookup = buildBarracksCoordinateLookup();
      var mappedRows = (tradingCities || [])
        .map(function (city) {
          var itemNo = toInt(city && (city.itemNo != null ? city.itemNo : city.ItemNo), null);
          return {
            id: itemNo,
            itemNo: itemNo,
            x: toInt(city && (city.x != null ? city.x : city.X), null),
            y: toInt(city && (city.y != null ? city.y : city.Y), null),
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
        })
        .sort(function (left, right) {
          return toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0);
        });

      $scope.tradeCityRows = mappedRows;
      $scope.ownedTradeCityRows = mappedRows.filter(function (city) {
        return !!barracksLookup[city.x + "," + city.y];
      });
      syncSelectedTradingCityAfterRefresh();
      refreshTradingCalcStocks();
      $scope.clearTradingCalculatedValues();
      refreshSphereWarehouseRows();
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
        $scope.tradeCityRows = [];
        $scope.ownedTradeCityRows = [];
        $scope.sphereWarehouseRows = [];
        $scope.ts17Rows = [];
        $scope.ts19Rows = [];
        refreshTurnSheetTriplets();
        $scope.savedTradingRows = [];
        $scope.selectedTradingCity = null;
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
          $scope.masterData.turnReport.tradingPortsAndCities);
      var loadPromise = hasTurnReport
        ? $q.when($scope.masterData.turnReport)
        : turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId);

      loadPromise
        .then(afterTurnReportLoaded, function (error) {
          $scope.loadError =
            error && error.data ? error.data : "Unable to load trade data.";
          $scope.tradeRows = [];
          $scope.tradeCityRows = [];
          $scope.ownedTradeCityRows = [];
          $scope.sphereWarehouseRows = [];
          $scope.ts17Rows = [];
          $scope.ts19Rows = [];
          refreshTurnSheetTriplets();
          $scope.savedTradingRows = [];
          $scope.selectedTradingCity = null;
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
