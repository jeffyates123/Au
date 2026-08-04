"use strict";

austerlitzModule.controller(
  "economyController",
  function (
    $scope,
    $q,
    masterData,
    turnDataLoaderService,
    turnReportFactory,
    turnSheetFactory,
    rulesCatalogFactory,
    economyConfigFactory,
    economyParseUtilsFactory,
    economyResourceFactory,
    economySphereFactory,
    economyProductionFactory,
    economyTradeFactory,
  ) {
    var sphereByTab = economyConfigFactory.sphereByTab;
    var economyTabs = economyConfigFactory.economyTabs;
    var economyWarehouseNos = economyConfigFactory.economyWarehouseNos;
    var economyComputedVersion = economyConfigFactory.economyComputedVersion;
    var resourceKeys = economyConfigFactory.resourceKeys;
    var productionResourceColumnsByRowKey = economyConfigFactory.productionResourceColumnsByRowKey;
    var populationCitizensByDensity = economyConfigFactory.populationCitizensByDensity;

    var toInt = economyParseUtilsFactory.toInt;
    var toFloat = economyParseUtilsFactory.toFloat;
    var toText = economyParseUtilsFactory.toText;
    var normalizeStateCode = economyParseUtilsFactory.normalizeStateCode;
    var createEmptyResourceBag = economyResourceFactory.createEmptyResourceBag;
    var createProductionSummaryRows = economyResourceFactory.createProductionSummaryRows;
    var sumResourceRows = economyResourceFactory.sumResourceRows;
    var sumProductionCitizens = economyResourceFactory.sumProductionCitizens;
    var getWarehouseNoForTab = economySphereFactory.getWarehouseNoForTab;
    var getSphereLabelForWarehouseNo = economySphereFactory.getSphereLabelForWarehouseNo;
    var inBounds = economySphereFactory.inBounds;
    var getComputedSphereForTab = economySphereFactory.getComputedSphereForTab;
    var isEuropeCoordinate = economySphereFactory.isEuropeCoordinate;
    var createProductionRows = economyProductionFactory.createProductionRows;
    var mapProductionTypeToResourceKey = economyProductionFactory.mapProductionTypeToResourceKey;
    var normalizeBuildRows = economyProductionFactory.normalizeBuildRows;

    function getSectionNoFromTs01Row(row) {
      var sectionNo = toText(
        row && (row.turnSheetSectionNo != null ? row.turnSheetSectionNo : row.TurnSheetSectionNo),
        "",
      ).toUpperCase();
      if (sectionNo.indexOf("TS") === 0) {
        sectionNo = sectionNo.substring(2);
      }
      return toInt(sectionNo, 0);
    }

    function sumBarracksGoodsForSphere(tabKey) {
      var totals = createEmptyResourceBag();
      var bounds = sphereByTab[tabKey];
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      var barracksRows = turnReport.barracks || turnReport.Barracks || [];
      (barracksRows || []).forEach(function (row) {
        var x = toInt(row && (row.x != null ? row.x : row.X), 0);
        var y = toInt(row && (row.y != null ? row.y : row.Y), 0);
        if (!bounds || !inBounds(x, y, bounds)) {
          return;
        }
        // Goods in Barracks row must come only from barracks section columns.
        totals.money += toInt(row && (row.money != null ? row.money : row.Money), 0);
        totals.citizens += toInt(row && (row.citizens != null ? row.citizens : row.Citizens), 0);
        totals.ecPts += toInt(row && (row.ecPts != null ? row.ecPts : row.EcPts), 0);
        totals.wood += toInt(row && (row.wood != null ? row.wood : row.Wood), 0);
        totals.horses += toInt(row && (row.horses != null ? row.horses : row.Horses), 0);
        totals.textiles += toInt(row && (row.textiles != null ? row.textiles : row.Textiles), 0);
      });
      return totals;
    }

    function sumTs01GoodsForSections(tabKey, sectionNos) {
      var totals = createEmptyResourceBag();
      var targetWarehouseNo = tabKey === "europe" ? 1 : tabKey === "caribbean" ? 2 : tabKey === "india" ? 3 : 0;
      var turnSheet = ($scope.masterData && $scope.masterData.turnSheet) || {};
      var rows = turnSheet.tsTransferGoods || turnSheet.TSTransferGoods || [];
      (rows || []).forEach(function (row) {
        var sectionNo = getSectionNoFromTs01Row(row);
        if ((sectionNos || []).indexOf(sectionNo) < 0) {
          return;
        }
        var fromNo = toInt(row && (row.from != null ? row.from : row.From), 0);
        var toNo = toInt(row && (row.to != null ? row.to : row.To), 0);
        if (targetWarehouseNo > 0 && fromNo !== targetWarehouseNo && toNo !== targetWarehouseNo) {
          return;
        }
        totals.citizens += toInt(row && (row.citizens != null ? row.citizens : row.Citizens), 0);
        totals.ecPts += toInt(row && (row.ecPts != null ? row.ecPts : row.EcPts), 0);
        totals.wood += toInt(row && (row.wood != null ? row.wood : row.Wood), 0);
        totals.horses += toInt(row && (row.horses != null ? row.horses : row.Horses), 0);
        totals.textiles += toInt(row && (row.textiles != null ? row.textiles : row.Textiles), 0);
      });
      return totals;
    }

    function getInterSphereTransferKey(fromWarehouseNo, toWarehouseNo) {
      return toInt(fromWarehouseNo, 0) + "|" + toInt(toWarehouseNo, 0);
    }

    function getInterSphereTransferAmount(fromWarehouseNo, toWarehouseNo) {
      var key = getInterSphereTransferKey(fromWarehouseNo, toWarehouseNo);
      return toInt($scope.economyInterSphereTransfers[key], 0);
    }

    function setInterSphereTransferAmount(fromWarehouseNo, toWarehouseNo, amount) {
      var key = getInterSphereTransferKey(fromWarehouseNo, toWarehouseNo);
      var sanitizedAmount = Math.max(0, toInt(amount, 0));
      if (sanitizedAmount > 0) {
        $scope.economyInterSphereTransfers[key] = sanitizedAmount;
      } else {
        delete $scope.economyInterSphereTransfers[key];
      }
    }

    function hydrateInterSphereTransfersFromTurnSheet() {
      $scope.economyInterSphereTransfers = {};
      var turnSheet = ($scope.masterData && $scope.masterData.turnSheet) || {};
      var rows = turnSheet.tsTransferGoods || turnSheet.TSTransferGoods || [];
      (rows || []).forEach(function (row) {
        var fromNo = toInt(row && (row.from != null ? row.from : row.From), 0);
        var toNo = toInt(row && (row.to != null ? row.to : row.To), 0);
        if (fromNo === toNo) {
          return;
        }
        if (economyWarehouseNos.indexOf(fromNo) < 0 || economyWarehouseNos.indexOf(toNo) < 0) {
          return;
        }
        var ld = Math.max(0, toInt(row && (row.louisdore != null ? row.louisdore : row.Louisdore), 0));
        if (!ld) {
          return;
        }
        setInterSphereTransferAmount(
          fromNo,
          toNo,
          getInterSphereTransferAmount(fromNo, toNo) + ld,
        );
      });
    }

    function getInterSphereTransferTotals(tabKey) {
      var currentWarehouseNo = getWarehouseNoForTab(tabKey);
      var totals = { transferToLd: 0, transferFromLd: 0 };
      if (currentWarehouseNo <= 0) {
        return totals;
      }
      economyWarehouseNos.forEach(function (warehouseNo) {
        if (warehouseNo === currentWarehouseNo) {
          return;
        }
        totals.transferToLd += getInterSphereTransferAmount(currentWarehouseNo, warehouseNo);
        totals.transferFromLd += getInterSphereTransferAmount(warehouseNo, currentWarehouseNo);
      });
      return totals;
    }

    function buildTs01InterSphereTransferRows(tabKey) {
      var currentWarehouseNo = getWarehouseNoForTab(tabKey);
      if (currentWarehouseNo <= 0) {
        return [];
      }

      var otherWarehouseNos = economyWarehouseNos.filter(function (warehouseNo) {
        return warehouseNo !== currentWarehouseNo;
      });

      var result = [];
      otherWarehouseNos.forEach(function (warehouseNo) {
        var sphereLabel = getSphereLabelForWarehouseNo(warehouseNo);
        var transferToValue = getInterSphereTransferAmount(currentWarehouseNo, warehouseNo);
        var transferFromValue = getInterSphereTransferAmount(warehouseNo, currentWarehouseNo);
        result.push({
          label: "Transfer TO " + sphereLabel,
          value: transferToValue,
          editable: true,
          fromWarehouseNo: currentWarehouseNo,
          toWarehouseNo: warehouseNo,
          inputValue: transferToValue,
        });
        result.push({
          label: "Transfer FROM " + sphereLabel,
          value: transferFromValue,
        });
      });
      return result;
    }

    function rowHasTransferGoodsValues(row) {
      return !!(
        toInt(row && (row.from != null ? row.from : row.From), 0) ||
        toInt(row && (row.to != null ? row.to : row.To), 0) ||
        toInt(row && (row.louisdore != null ? row.louisdore : row.Louisdore), 0) ||
        toInt(row && (row.citizens != null ? row.citizens : row.Citizens), 0) ||
        toInt(row && (row.ecPts != null ? row.ecPts : row.EcPts), 0) ||
        toInt(row && (row.wood != null ? row.wood : row.Wood), 0) ||
        toInt(row && (row.horses != null ? row.horses : row.Horses), 0) ||
        toInt(row && (row.textiles != null ? row.textiles : row.Textiles), 0)
      );
    }

    function isInterSphereWarehouseTransferRow(row) {
      var fromNo = toInt(row && (row.from != null ? row.from : row.From), 0);
      var toNo = toInt(row && (row.to != null ? row.to : row.To), 0);
      if (
        fromNo <= 0 ||
        toNo <= 0 ||
        fromNo === toNo ||
        economyWarehouseNos.indexOf(fromNo) < 0 ||
        economyWarehouseNos.indexOf(toNo) < 0
      ) {
        return false;
      }
      // Keep only pure LD warehouse-to-warehouse transfer rows in this managed pool.
      return (
        toInt(row && (row.citizens != null ? row.citizens : row.Citizens), 0) === 0 &&
        toInt(row && (row.ecPts != null ? row.ecPts : row.EcPts), 0) === 0 &&
        toInt(row && (row.wood != null ? row.wood : row.Wood), 0) === 0 &&
        toInt(row && (row.horses != null ? row.horses : row.Horses), 0) === 0 &&
        toInt(row && (row.textiles != null ? row.textiles : row.Textiles), 0) === 0
      );
    }

    function clearTransferGoodsRow(row) {
      if (!row) {
        return;
      }
      row.from = null;
      row.to = null;
      row.louisdore = null;
      row.citizens = null;
      row.ecPts = null;
      row.wood = null;
      row.horses = null;
      row.textiles = null;
      row.turnSheetSectionNo = null;
    }

    function syncTurnSheetTransferGoodsRows(rows) {
      if (!$scope.masterData) {
        return;
      }
      $scope.masterData.turnSheet = $scope.masterData.turnSheet || {};
      $scope.masterData.turnSheet.tsTransferGoods = rows || [];
      $scope.masterData.turnSheet.TSTransferGoods = rows || [];
    }

    function buildDesiredInterSphereTransferLines() {
      var lines = [];
      Object.keys($scope.economyInterSphereTransfers || {}).forEach(function (key) {
        var parts = (key || "").split("|");
        var fromNo = toInt(parts[0], 0);
        var toNo = toInt(parts[1], 0);
        var amount = Math.max(0, toInt($scope.economyInterSphereTransfers[key], 0));
        if (
          fromNo <= 0 ||
          toNo <= 0 ||
          fromNo === toNo ||
          economyWarehouseNos.indexOf(fromNo) < 0 ||
          economyWarehouseNos.indexOf(toNo) < 0 ||
          !amount
        ) {
          return;
        }
        lines.push({ from: fromNo, to: toNo, louisdore: amount });
      });
      lines.sort(function (left, right) {
        if (left.from !== right.from) {
          return left.from - right.from;
        }
        return left.to - right.to;
      });
      return lines;
    }

    function persistInterSphereTransfersToTurnSheet() {
      if (!$scope.masterData || !$scope.masterData.turnId) {
        return $q.when(null);
      }
      return turnSheetFactory.getTSTransferGoods($scope.masterData.turnId).then(function (rows) {
        rows = rows || [];
        var managedRows = rows.filter(function (row) {
          return isInterSphereWarehouseTransferRow(row);
        });
        var desiredLines = buildDesiredInterSphereTransferLines();
        var availableEmptyRows = rows
          .filter(function (row) {
            var isManaged = managedRows.indexOf(row) >= 0;
            return !isManaged && !rowHasTransferGoodsValues(row);
          })
          .sort(function (left, right) {
            return toInt(left && (left.orderNo != null ? left.orderNo : left.OrderNo), 0) -
              toInt(right && (right.orderNo != null ? right.orderNo : right.OrderNo), 0);
          });

        var targetRows = [];
        for (var i = 0; i < desiredLines.length; i++) {
          if (i < managedRows.length) {
            targetRows.push(managedRows[i]);
          } else if (availableEmptyRows.length) {
            targetRows.push(availableEmptyRows.shift());
          }
        }

        if (targetRows.length < desiredLines.length) {
          throw new Error("No empty TS01 row is available to save inter-sphere transfers.");
        }

        for (var rowIdx = 0; rowIdx < targetRows.length; rowIdx++) {
          var row = targetRows[rowIdx];
          var line = desiredLines[rowIdx];
          row.turnId = $scope.masterData.turnId;
          row.from = line.from;
          row.to = line.to;
          row.louisdore = line.louisdore;
          row.citizens = null;
          row.ecPts = null;
          row.wood = null;
          row.horses = null;
          row.textiles = null;
          row.turnSheetSectionNo = null;
        }

        for (var staleIdx = targetRows.length; staleIdx < managedRows.length; staleIdx++) {
          var staleRow = managedRows[staleIdx];
          staleRow.turnId = $scope.masterData.turnId;
          clearTransferGoodsRow(staleRow);
        }

        return turnSheetFactory.postTSRecords(rows, "TransferGoods").then(function (savedRows) {
          syncTurnSheetTransferGoodsRows(savedRows || rows);
          return savedRows || rows;
        });
      });
    }

    function createTradeEstimationInput(tabKey) {
      var masterDataForTrade = $scope.masterData || {};
      return {
        tabKey: tabKey,
        sphereByTab: sphereByTab,
        turnSheet: masterDataForTrade.turnSheet || {},
        turnReport: masterDataForTrade.turnReport || {},
      };
    }

    function buildTradeDirectByGoodForSphere(tabKey) {
      return economyTradeFactory.buildTradeDirectByGoodForSphere(createTradeEstimationInput(tabKey));
    }

    function buildProductionSummaryRows(tabKey, productionRows) {
      var rows = createProductionSummaryRows();
      var byKey = {};
      (rows || []).forEach(function (row) {
        byKey[row.key] = row;
      });

      var barracksTotals = sumBarracksGoodsForSphere(tabKey);
      byKey.goodsInBarracks.citizens = Math.abs(toInt(barracksTotals.citizens, 0));
      byKey.goodsInBarracks.resources.ecPts = Math.abs(toInt(barracksTotals.ecPts, 0));
      byKey.goodsInBarracks.resources.food = Math.abs(toInt(barracksTotals.food, 0));
      byKey.goodsInBarracks.resources.stone = Math.abs(toInt(barracksTotals.stone, 0));
      byKey.goodsInBarracks.resources.wood = Math.abs(toInt(barracksTotals.wood, 0));
      byKey.goodsInBarracks.resources.ore = Math.abs(toInt(barracksTotals.ore, 0));
      byKey.goodsInBarracks.resources.zinc = Math.abs(toInt(barracksTotals.zinc, 0));
      byKey.goodsInBarracks.resources.horses = Math.abs(toInt(barracksTotals.horses, 0));
      byKey.goodsInBarracks.resources.textiles = Math.abs(toInt(barracksTotals.textiles, 0));
      byKey.goodsInBarracks.resources.wool = Math.abs(toInt(barracksTotals.wool, 0));
      byKey.goodsInBarracks.resources.gold = Math.abs(toInt(barracksTotals.gold, 0));
      byKey.goodsInBarracks.resources.wine = Math.abs(toInt(barracksTotals.wine, 0));

      byKey.productionBuildMaintenance.citizens = (productionRows || []).reduce(function (sum, row) {
        return sum + toInt(row.maintenanceWorkers, 0) + toInt(row.buildCitizens, 0);
      }, 0);
      byKey.productionBuildMaintenance.citizens = -Math.abs(byKey.productionBuildMaintenance.citizens);

      var populationTotals = sumTs01GoodsForSections(tabKey, [12]);
      byKey.populationBuildMaintenance.citizens = -Math.abs(toInt(populationTotals.citizens, 0));
      byKey.populationBuildMaintenance.resources.ecPts = -Math.abs(toInt(populationTotals.ecPts, 0));
      byKey.populationBuildMaintenance.resources.wood = -Math.abs(toInt(populationTotals.wood, 0));
      byKey.populationBuildMaintenance.resources.horses = -Math.abs(toInt(populationTotals.horses, 0));
      byKey.populationBuildMaintenance.resources.textiles = -Math.abs(toInt(populationTotals.textiles, 0));

      var armyTotals = sumTs01GoodsForSections(tabKey, [3, 4, 5, 6]);
      byKey.armyBuildMaintenance.citizens = -Math.abs(toInt(armyTotals.citizens, 0));
      byKey.armyBuildMaintenance.resources.ecPts = -Math.abs(toInt(armyTotals.ecPts, 0));
      byKey.armyBuildMaintenance.resources.wood = -Math.abs(toInt(armyTotals.wood, 0));
      byKey.armyBuildMaintenance.resources.horses = -Math.abs(toInt(armyTotals.horses, 0));
      byKey.armyBuildMaintenance.resources.textiles = -Math.abs(toInt(armyTotals.textiles, 0));

      var navyTotals = sumTs01GoodsForSections(tabKey, [9, 10]);
      byKey.navyBuildRepair.citizens = -Math.abs(toInt(navyTotals.citizens, 0));
      byKey.navyBuildRepair.resources.ecPts = -Math.abs(toInt(navyTotals.ecPts, 0));
      byKey.navyBuildRepair.resources.wood = -Math.abs(toInt(navyTotals.wood, 0));
      byKey.navyBuildRepair.resources.horses = -Math.abs(toInt(navyTotals.horses, 0));
      byKey.navyBuildRepair.resources.textiles = -Math.abs(toInt(navyTotals.textiles, 0));

      var baggageTotals = sumTs01GoodsForSections(tabKey, [11]);
      byKey.baggageTrainBuildRepair.citizens = -Math.abs(toInt(baggageTotals.citizens, 0));
      byKey.baggageTrainBuildRepair.resources.ecPts = -Math.abs(toInt(baggageTotals.ecPts, 0));
      byKey.baggageTrainBuildRepair.resources.wood = -Math.abs(toInt(baggageTotals.wood, 0));
      byKey.baggageTrainBuildRepair.resources.horses = -Math.abs(toInt(baggageTotals.horses, 0));
      byKey.baggageTrainBuildRepair.resources.textiles = -Math.abs(toInt(baggageTotals.textiles, 0));

      var tradeDirectTotals = buildTradeDirectByGoodForSphere(tabKey);
      byKey.directTrade.resources.ecPts = toInt(tradeDirectTotals.ecPts, 0);
      byKey.directTrade.resources.food = toInt(tradeDirectTotals.food, 0);
      byKey.directTrade.resources.stone = toInt(tradeDirectTotals.stone, 0);
      byKey.directTrade.resources.wood = toInt(tradeDirectTotals.wood, 0);
      byKey.directTrade.resources.ore = toInt(tradeDirectTotals.ore, 0);
      byKey.directTrade.resources.zinc = toInt(tradeDirectTotals.zinc, 0);
      byKey.directTrade.resources.horses = toInt(tradeDirectTotals.horses, 0);
      byKey.directTrade.resources.textiles = toInt(tradeDirectTotals.textiles, 0);
      byKey.directTrade.resources.wool = toInt(tradeDirectTotals.wool, 0);
      byKey.directTrade.resources.gold = toInt(tradeDirectTotals.gold, 0);
      byKey.directTrade.resources.wine = toInt(tradeDirectTotals.wine, 0);

      return rows;
    }

    function getWarehouseRowForSphere(tabKey) {
      var itemNoBySphere = { europe: 1, caribbean: 2, india: 3 };
      var targetItemNo = itemNoBySphere[tabKey] || 1;
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      var warehouses = turnReport.warehouses || turnReport.Warehouses || [];
      var match = null;
      (warehouses || []).forEach(function (warehouse) {
        var itemNo = toInt(warehouse.itemNo != null ? warehouse.itemNo : warehouse.ItemNo, 0);
        if (itemNo === targetItemNo) {
          match = warehouse;
        }
      });
      return match || {};
    }

    function normalizeWarehouseForDisplay(rawWarehouse, tabKey) {
      return {
        sphereLabel: tabKey === "europe" ? "Europe" : tabKey === "caribbean" ? "Caribbean" : "India",
        inhabitants: toInt(rawWarehouse.inhabitants != null ? rawWarehouse.inhabitants : rawWarehouse.Inhabitants, 0),
        foreign: toInt(rawWarehouse.foreign != null ? rawWarehouse.foreign : rawWarehouse.Foreign, 0),
        money: toInt(rawWarehouse.money != null ? rawWarehouse.money : rawWarehouse.Money, 0),
        citizens: toInt(rawWarehouse.citizens != null ? rawWarehouse.citizens : rawWarehouse.Citizens, 0),
        ecPts: toInt(rawWarehouse.ecPts != null ? rawWarehouse.ecPts : rawWarehouse.EcPts, 0),
        food: toInt(rawWarehouse.food != null ? rawWarehouse.food : rawWarehouse.Food, 0),
        stone: toInt(rawWarehouse.stone != null ? rawWarehouse.stone : rawWarehouse.Stone, 0),
        wood: toInt(rawWarehouse.wood != null ? rawWarehouse.wood : rawWarehouse.Wood, 0),
        ore: toInt(rawWarehouse.ore != null ? rawWarehouse.ore : rawWarehouse.Ore, 0),
        zinc: toInt(rawWarehouse.zinc != null ? rawWarehouse.zinc : rawWarehouse.Zinc, 0),
        horses: toInt(rawWarehouse.horses != null ? rawWarehouse.horses : rawWarehouse.Horses, 0),
        textiles: toInt(rawWarehouse.textiles != null ? rawWarehouse.textiles : rawWarehouse.Textiles, 0),
        wool: toInt(rawWarehouse.wool != null ? rawWarehouse.wool : rawWarehouse.Wool, 0),
        gold: toInt(rawWarehouse.gold != null ? rawWarehouse.gold : rawWarehouse.Gold, 0),
        wine: toInt(rawWarehouse.wine != null ? rawWarehouse.wine : rawWarehouse.Wine, 0),
      };
    }

    function getRulesProductionSites() {
      if ($scope.productionSiteRules && $scope.productionSiteRules.length) {
        return $scope.productionSiteRules;
      }

      var rulesCatalog = ($scope.masterData && $scope.masterData.rulesCatalog) || {};
      var fromCatalog = rulesCatalog.productionSites || rulesCatalog.ProductionSites || [];
      return fromCatalog || [];
    }

    function getBuildRowsForTurn() {
      var turnSheet = ($scope.masterData && $scope.masterData.turnSheet) || {};
      var inMemoryRows = turnSheet.tsBuildProductionSites || turnSheet.TSBuildProductionSites || [];
      if (inMemoryRows && inMemoryRows.length) {
        return $q.when(normalizeBuildRows(inMemoryRows));
      }

      return turnSheetFactory.getTSBuildProductionSites($scope.masterData.turnId).then(
        function (rows) {
          return normalizeBuildRows(rows);
        },
        function () {
          return [];
        },
      );
    }

    function createProductionModelInput(tabKey, buildRows) {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return {
        tabKey: tabKey,
        buildRows: buildRows || [],
        mapRows: turnReport.mapCoordinates || turnReport.MapCoordinates || [],
        productionSiteRules: getRulesProductionSites(),
        selectedState: normalizeStateCode($scope.masterData && $scope.masterData.selectedState),
        sphereByTab: sphereByTab,
        warehouse: normalizeWarehouseForDisplay(getWarehouseRowForSphere(tabKey), tabKey),
      };
    }

    function getTurnSheetRows(camelKey, pascalKey) {
      var turnSheet = ($scope.masterData && $scope.masterData.turnSheet) || {};
      return turnSheet[camelKey] || turnSheet[pascalKey] || [];
    }

    function getTurnReportBrigades() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.brigades || turnReport.Brigades || [];
    }

    function getArmyItemByShortName(shortName) {
      var target = toText(shortName, "").toUpperCase();
      if (!target) {
        return null;
      }
      var list = $scope.economyArmyList || [];
      for (var i = 0; i < (list || []).length; i++) {
        var row = list[i];
        var rowShort = toText(row && (row.shortName != null ? row.shortName : row.ShortName), "").toUpperCase();
        if (rowShort === target) {
          return row;
        }
      }
      return null;
    }

    function getArmyItemByItemNo(itemNo) {
      var target = toInt(itemNo, 0);
      if (!target) {
        return null;
      }
      var list = $scope.economyArmyList || [];
      for (var i = 0; i < (list || []).length; i++) {
        var row = list[i];
        var rowItemNo = toInt(row && (row.itemNo != null ? row.itemNo : row.ItemNo), 0);
        if (rowItemNo === target) {
          return row;
        }
      }
      return null;
    }

    function getDepotLookupByItemNo() {
      var lookup = {};
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      var barracks = turnReport.barracks || turnReport.Barracks || [];
      var ports = turnReport.tradingPortsAndCities || turnReport.TradingPortsAndCities || [];
      (barracks || []).concat(ports || []).forEach(function (row) {
        var itemNo = toInt(row && (row.itemNo != null ? row.itemNo : row.ItemNo), 0);
        if (!itemNo) {
          return;
        }
        lookup[itemNo] = row;
      });
      return lookup;
    }

    function getBrigadesForScope(brigadeOrFederation) {
      var value = toInt(brigadeOrFederation, 0);
      if (!value) {
        return [];
      }
      var brigades = getTurnReportBrigades();
      var direct = [];
      (brigades || []).forEach(function (brigade) {
        var itemNo = toInt(brigade && (brigade.itemNo != null ? brigade.itemNo : brigade.ItemNo), 0);
        if (itemNo === value) {
          direct.push(brigade);
        }
      });
      if (direct.length) {
        return direct;
      }
      return (brigades || []).filter(function (brigade) {
        var federation = toInt(brigade && (brigade.federation != null ? brigade.federation : brigade.Federation), 0);
        return federation === value;
      });
    }

    function buildTs05HeadcountPlanByBrigadeId() {
      var plans = {};
      var ts05Rows = getTurnSheetRows("tsIncreaseHeadcount", "TSIncreaseHeadcount");
      (ts05Rows || []).forEach(function (row) {
        var brigadeOrFederation = toInt(
          row && (row.brigadeOrFederation != null ? row.brigadeOrFederation : row.BrigadeOrFederation),
          0,
        );
        var increaseAmount = toInt(
          row && (row.increaseAmount != null ? row.increaseAmount : row.IncreaseAmount),
          0,
        );
        if (!brigadeOrFederation || !increaseAmount) {
          return;
        }
        var targetHeadcount = Math.max(1, Math.min(800, increaseAmount));
        var targets = getBrigadesForScope(brigadeOrFederation);
        (targets || []).forEach(function (brigade) {
          var id = toInt(brigade && (brigade.itemNo != null ? brigade.itemNo : brigade.ItemNo), 0);
          if (id > 0) {
            plans[id] = targetHeadcount;
          }
        });
      });
      return plans;
    }

    function estimateArmyTrainingLdFromTs06ForEurope() {
      var ts06Rows = getTurnSheetRows("tsIncreaseBrigadeXp", "TSIncreaseBrigadeXP");
      if (!ts06Rows || !ts06Rows.length) {
        return 0;
      }
      var headcountPlanByBrigadeId = buildTs05HeadcountPlanByBrigadeId();
      var totalLd = 0;

      (ts06Rows || []).forEach(function (row) {
        var brigadeOrFederation = toInt(
          row && (row.brigadeOrFederation != null ? row.brigadeOrFederation : row.BrigadeOrFederation),
          0,
        );
        if (!brigadeOrFederation) {
          return;
        }
        var targets = getBrigadesForScope(brigadeOrFederation);
        (targets || []).forEach(function (brigade) {
          var x = toInt(brigade && (brigade.x_OrState != null ? brigade.x_OrState : brigade.X_OrState), 0);
          var y = toInt(brigade && (brigade.y_OrFleet != null ? brigade.y_OrFleet : brigade.Y_OrFleet), 0);
          if (!isEuropeCoordinate(x, y)) {
            return;
          }
          var brigadeId = toInt(brigade && (brigade.itemNo != null ? brigade.itemNo : brigade.ItemNo), 0);
          for (var slot = 1; slot <= 7; slot++) {
            var typeKey = "batt" + slot + "Type";
            var sizeKey = "batt" + slot + "Size";
            var efKey = "batt" + slot + "EF";
            var battType = toText(
              brigade && (brigade[typeKey] != null ? brigade[typeKey] : brigade[typeKey.charAt(0).toUpperCase() + typeKey.slice(1)]),
              "",
            );
            if (!battType || battType === "--") {
              continue;
            }
            var armyItem = getArmyItemByShortName(battType);
            if (!armyItem) {
              continue;
            }
            var maxEf = toInt(armyItem.ef != null ? armyItem.ef : armyItem.EF, 0);
            if (maxEf <= 0) {
              continue;
            }
            var currentEf = toInt(
              brigade && (brigade[efKey] != null ? brigade[efKey] : brigade[efKey.charAt(0).toUpperCase() + efKey.slice(1)]),
              0,
            );
            if (currentEf >= maxEf) {
              continue;
            }
            var currentSize = Math.max(
              0,
              toInt(
                brigade && (brigade[sizeKey] != null ? brigade[sizeKey] : brigade[sizeKey.charAt(0).toUpperCase() + sizeKey.slice(1)]),
                0,
              ),
            );
            var plannedHeadcount = headcountPlanByBrigadeId[brigadeId];
            var headcount = plannedHeadcount != null ? Math.min(800, Math.max(currentSize, plannedHeadcount)) : Math.min(800, currentSize);
            var battalionSetupLd = headcount * toFloat(armyItem.cost != null ? armyItem.cost : armyItem.Cost, 0);
            totalLd += Math.round(battalionSetupLd / 10);
          }
        });
      });

      return totalLd;
    }

    function estimateArmyBuildingLdFromTs03Ts04ForEurope() {
      var totalLd = 0;
      var ts03Rows = getTurnSheetRows("tsSetUpBrigades", "TSSetUpBrigades");
      var ts04Rows = getTurnSheetRows("tsSetUpAdditionalBrigades", "TSSetUpAdditionalBrigades");
      var brigades = getTurnReportBrigades();
      var brigadeById = {};
      var depotByItemNo = getDepotLookupByItemNo();

      (brigades || []).forEach(function (brigade) {
        var id = toInt(brigade && (brigade.itemNo != null ? brigade.itemNo : brigade.ItemNo), 0);
        if (id > 0) {
          brigadeById[id] = brigade;
        }
      });

      (ts03Rows || []).forEach(function (row) {
        var depotItemNo = toInt(row && (row.depot != null ? row.depot : row.Depot), 0);
        if (!depotItemNo) {
          return;
        }
        var depot = depotByItemNo[depotItemNo];
        var x = toInt(depot && (depot.x != null ? depot.x : depot.X), 0);
        var y = toInt(depot && (depot.y != null ? depot.y : depot.Y), 0);
        if (!isEuropeCoordinate(x, y)) {
          return;
        }

        for (var slot = 1; slot <= 7; slot++) {
          var field = "batt" + slot;
          var battItemNo = toInt(row && (row[field] != null ? row[field] : row[field.charAt(0).toUpperCase() + field.slice(1)]), 0);
          if (!battItemNo) {
            continue;
          }
          var armyItem = getArmyItemByItemNo(battItemNo);
          if (!armyItem) {
            continue;
          }
          totalLd += Math.round(800 * toFloat(armyItem.cost != null ? armyItem.cost : armyItem.Cost, 0));
        }
      });

      (ts04Rows || []).forEach(function (row) {
        var brigadeNo = toInt(row && (row.brigadeNo != null ? row.brigadeNo : row.BrigadeNo), 0);
        var battType = toInt(row && (row.battType != null ? row.battType : row.BattType), 0);
        if (!brigadeNo || !battType) {
          return;
        }
        var brigade = brigadeById[brigadeNo];
        var x = toInt(brigade && (brigade.x_OrState != null ? brigade.x_OrState : brigade.X_OrState), 0);
        var y = toInt(brigade && (brigade.y_OrFleet != null ? brigade.y_OrFleet : brigade.Y_OrFleet), 0);
        if (!isEuropeCoordinate(x, y)) {
          return;
        }
        var armyItem = getArmyItemByItemNo(battType);
        if (!armyItem) {
          return;
        }
        totalLd += Math.round(800 * toFloat(armyItem.cost != null ? armyItem.cost : armyItem.Cost, 0) * 2);
      });

      return totalLd;
    }

    function getSelectedStateTaxRate() {
      var selectedState = normalizeStateCode($scope.masterData && $scope.masterData.selectedState);
      if (!selectedState) {
        return 0;
      }

      var refStates = $scope.refStates || [];
      for (var i = 0; i < (refStates || []).length; i++) {
        var refState = refStates[i];
        var refStateCode = normalizeStateCode(refState && (refState.state != null ? refState.state : refState.State));
        if (refStateCode !== selectedState) {
          continue;
        }
        return toInt(refState.taxRate != null ? refState.taxRate : refState.TaxRate, 0);
      }

      var rulesCatalog = ($scope.masterData && $scope.masterData.rulesCatalog) || {};
      var states = rulesCatalog.states || rulesCatalog.States || [];
      for (var j = 0; j < (states || []).length; j++) {
        var state = states[j];
        var stateCode = normalizeStateCode(state && (state.state != null ? state.state : state.State));
        if (stateCode !== selectedState) {
          continue;
        }
        return toInt(state.taxRate != null ? state.taxRate : state.TaxRate, 0);
      }

      return 0;
    }

    function getCitizensForCoordinate(coord) {
      var density = toInt(coord && (coord.population != null ? coord.population : coord.Population), 0);
      if (density > 0 && populationCitizensByDensity[density]) {
        return populationCitizensByDensity[density];
      }

      // If no population density is shown on the coordinate, use fallback values.
      var terrain = toText(coord && (coord.terrain != null ? coord.terrain : coord.Terrain), "").toUpperCase();
      return terrain === "D" ? 250 : 500;
    }

    function estimateTaxesForSphere(tabKey) {
      if (tabKey !== "europe") {
        return 0;
      }

      var homeState = normalizeStateCode($scope.masterData && $scope.masterData.selectedState);
      if (!homeState) {
        return 0;
      }
      var homeTaxRate = getSelectedStateTaxRate();
      var foreignTaxRate = 4;
      var bounds = sphereByTab.europe;
      var mapRows = ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.mapCoordinates) ||
        ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.MapCoordinates) || [];
      var taxes = 0;

      (mapRows || []).forEach(function (mapRow) {
        (mapRow || []).forEach(function (coord) {
          if (!coord) {
            return;
          }
          var x = toInt(coord.x != null ? coord.x : coord.X, 0);
          var y = toInt(coord.y != null ? coord.y : coord.Y, 0);
          if (!inBounds(x, y, bounds)) {
            return;
          }

          var ownerState = normalizeStateCode(coord.owner != null ? coord.owner : coord.Owner);
          if (ownerState !== homeState) {
            return;
          }

          var regionState = normalizeStateCode(coord.state != null ? coord.state : coord.State);
          var taxRate = regionState === homeState ? homeTaxRate : foreignTaxRate;
          taxes += getCitizensForCoordinate(coord) * taxRate;
        });
      });

      return taxes;
    }

    function sumProductionMaintenanceLd(rows) {
      return (rows || []).reduce(function (sum, row) {
        return sum + toInt(row && row.maintenanceLd, 0);
      }, 0);
    }

    function buildFinanceSummary(tabKey, warehouse, productionRows, productionRowsByTab) {
      var economySummary = ($scope.masterData && $scope.masterData.turnReport && ($scope.masterData.turnReport.economySummary || $scope.masterData.turnReport.EconomySummary)) || {};
      var productionTotals = sumResourceRows(productionRows);
      var barracksTotals = sumBarracksGoodsForSphere(tabKey);
      var barracksLd = Math.abs(toInt(barracksTotals.money, 0));
      var maintenanceLd = sumProductionMaintenanceLd(productionRows);
      var productionBuildLd = productionRows.reduce(function (sum, row) { return sum + toInt(row.buildLd, 0); }, 0);

      function sumTransferGoodsLdForSections(sectionNos, targetTabKey) {
        var turnSheet = ($scope.masterData && $scope.masterData.turnSheet) || {};
        var rows = turnSheet.tsTransferGoods || turnSheet.TSTransferGoods || [];
        var targetWarehouseNo = targetTabKey === "europe" ? 1 : targetTabKey === "caribbean" ? 2 : targetTabKey === "india" ? 3 : 0;
        var total = 0;
        (rows || []).forEach(function (row) {
          var sectionNo = getSectionNoFromTs01Row(row);
          if ((sectionNos || []).indexOf(sectionNo) < 0) {
            return;
          }
          if (targetWarehouseNo > 0) {
            var fromNo = toInt(row && (row.from != null ? row.from : row.From), 0);
            var toNo = toInt(row && (row.to != null ? row.to : row.To), 0);
            if (fromNo !== targetWarehouseNo && toNo !== targetWarehouseNo) {
              return;
            }
          }
          total += toInt(row && (row.louisdore != null ? row.louisdore : row.Louisdore), 0);
        });
        return total;
      }

      var productionMaintenanceLd = maintenanceLd;
      if (tabKey === "europe") {
        productionMaintenanceLd =
          sumProductionMaintenanceLd((productionRowsByTab && productionRowsByTab.europe) || []) +
          sumProductionMaintenanceLd((productionRowsByTab && productionRowsByTab.caribbean) || []) +
          sumProductionMaintenanceLd((productionRowsByTab && productionRowsByTab.india) || []);
      } else {
        // All production-site maintenance is paid from Europe warehouse only.
        productionMaintenanceLd = 0;
      }
      var includeArmyNavyMaintenance = tabKey === "europe";
      var commanderPay = toInt(economySummary.commanderPayLd != null ? economySummary.commanderPayLd : economySummary.CommanderPayLd, 0);
      var brigadePay = toInt(economySummary.brigadePayLd != null ? economySummary.brigadePayLd : economySummary.BrigadePayLd, 0);
      var armyMaintTotal = includeArmyNavyMaintenance ? brigadePay + commanderPay : 0;
      var navyMaintenance = includeArmyNavyMaintenance
        ? toInt(economySummary.navyMaintenanceLd != null ? economySummary.navyMaintenanceLd : economySummary.NavyMaintenanceLd, 0)
        : 0;
      var ldProduction = Math.max(0, toInt(productionTotals.money, 0));
      var ts01ArmyTrainingLd = sumTransferGoodsLdForSections([6], tabKey);
      var computedArmyTrainingLd = tabKey === "europe" ? estimateArmyTrainingLdFromTs06ForEurope() : 0;
      var armyTrainingLd = computedArmyTrainingLd > 0 ? computedArmyTrainingLd : ts01ArmyTrainingLd;
      var ts01ArmyBuildingLd = sumTransferGoodsLdForSections([3], tabKey);
      var computedArmyBuildingLd =
        tabKey === "europe" ? estimateArmyBuildingLdFromTs03Ts04ForEurope() : 0;
      var armyBuildingLd =
        computedArmyBuildingLd > 0 ? computedArmyBuildingLd : ts01ArmyBuildingLd;
      // Land-unit managed TS01 rows are currently stamped as section 3, which can
      // mix TS03 and TS06 costs on shared locations. When TS06 lines are not tagged
      // as section 6, split out training from section-3 total for display.
      if (tabKey === "europe" && ts01ArmyTrainingLd <= 0 && computedArmyTrainingLd > 0 && armyBuildingLd > 0) {
        armyBuildingLd = Math.max(0, armyBuildingLd - computedArmyTrainingLd);
      }
      var navyBuildRepairLd = sumTransferGoodsLdForSections([9, 10], tabKey);
      var tradeSummary = estimateTradeSummaryForSphere(tabKey);
      var directSelling = toInt(tradeSummary && tradeSummary.directSelling, 0);
      var directBuying = toInt(tradeSummary && tradeSummary.directBuying, 0);
      var estimatedNetTrade = directSelling - directBuying;
      var taxes = estimateTaxesForSphere(tabKey);
      var interSphereTransferTotals = getInterSphereTransferTotals(tabKey);
      var projectedNextMonthLd =
        toInt(warehouse.money, 0) +
        estimatedNetTrade +
        taxes +
        interSphereTransferTotals.transferFromLd -
        interSphereTransferTotals.transferToLd +
        barracksLd +
        toInt(productionTotals.money, 0) -
        productionMaintenanceLd -
        productionBuildLd -
        armyTrainingLd -
        armyBuildingLd -
        armyMaintTotal -
        navyMaintenance -
        navyBuildRepairLd;
      var startingRevenue = toInt(warehouse.money, 0);
      var transferToLd = Math.max(0, toInt(interSphereTransferTotals.transferToLd, 0));
      var transferFromLd = Math.max(0, toInt(interSphereTransferTotals.transferFromLd, 0));
      var buildFundsDeductions =
        armyMaintTotal +
        navyMaintenance +
        productionMaintenanceLd +
        armyBuildingLd +
        armyTrainingLd +
        navyBuildRepairLd +
        productionBuildLd;
      var buildFundsAvailable =
        startingRevenue -
        buildFundsDeductions +
        barracksLd +
        transferFromLd -
        transferToLd;
      var interSphereTransferRows = buildTs01InterSphereTransferRows(tabKey);

      var rows = [
        { label: "Starting Revenue", value: startingRevenue, totalLine: true },
        { label: "Army Building", value: armyBuildingLd },
        { label: "Army Training", value: armyTrainingLd },
        { label: "Navy Build & Repair", value: navyBuildRepairLd },
        { label: "Production Build", value: productionBuildLd },
        { label: "LD (Mny) in Barracks", value: barracksLd },
      ];
      if (tabKey === "europe") {
        rows.splice(1, 0, { label: "Production Maint.", value: productionMaintenanceLd });
      }
      if (includeArmyNavyMaintenance) {
        rows.splice(1, 0, { label: "Army Maint", value: armyMaintTotal }, { label: "Navy Maint", value: navyMaintenance });
      }
      rows = rows.concat(interSphereTransferRows);
      rows.push({ label: "Build Funds Available", value: buildFundsAvailable, totalLine: true });
      rows.push({ label: "Direct Selling", value: directSelling });
      rows.push({ label: "Direct Buying", value: directBuying });
      rows.push({ label: "Taxes", value: taxes });
      rows.push({ label: "LD Production", value: ldProduction });
      rows.push({ label: "Projected Next Month LD", value: projectedNextMonthLd, highlight: true, totalLine: true });
      return rows;
    }

    function getFinanceRowValueByLabel(rows, label) {
      var list = rows || [];
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].label === label) {
          return toInt(list[i].value, 0);
        }
      }
      return 0;
    }

    function isFinanceDebitLabel(label) {
      return (
        label === "Army Maint" ||
        label === "Navy Maint" ||
        label === "Production Maint." ||
        label === "Army Building" ||
        label === "Army Training" ||
        label === "Navy Build & Repair" ||
        label === "Production Build" ||
        label === "Direct Buying" ||
        toText(label, "").indexOf("Transfer TO ") === 0
      );
    }

    function buildEconomyComputedSummaryPayload(buildRows) {
      var payload = {
        turnId: toText($scope.masterData && $scope.masterData.turnId, ""),
        rows: [],
      };
      var productionRowsByTab = {
        europe: economyProductionFactory.buildProductionModel(createProductionModelInput("europe", buildRows)),
        caribbean: economyProductionFactory.buildProductionModel(createProductionModelInput("caribbean", buildRows)),
        india: economyProductionFactory.buildProductionModel(createProductionModelInput("india", buildRows)),
      };
      Object.keys(economyTabs).forEach(function (tabKey) {
        var sphere = getComputedSphereForTab(tabKey);
        if (!sphere) {
          return;
        }
        var warehouse = normalizeWarehouseForDisplay(getWarehouseRowForSphere(tabKey), tabKey);
        var productionRows = productionRowsByTab[tabKey] || [];
        var financeRows = buildFinanceSummary(tabKey, warehouse, productionRows, productionRowsByTab);
        payload.rows.push({
          turnId: payload.turnId,
          sphere: sphere,
          computedVersion: economyComputedVersion,
          computedAtUtc: new Date().toISOString(),
          startingRevenueLd: getFinanceRowValueByLabel(financeRows, "Starting Revenue"),
          armyMaintLd: getFinanceRowValueByLabel(financeRows, "Army Maint"),
          navyMaintLd: getFinanceRowValueByLabel(financeRows, "Navy Maint"),
          productionMaintLd: getFinanceRowValueByLabel(financeRows, "Production Maint."),
          armyBuildingLd: getFinanceRowValueByLabel(financeRows, "Army Building"),
          armyTrainingLd: getFinanceRowValueByLabel(financeRows, "Army Training"),
          navyBuildRepairLd: getFinanceRowValueByLabel(financeRows, "Navy Build & Repair"),
          productionBuildLd: getFinanceRowValueByLabel(financeRows, "Production Build"),
          ldInBarracks: getFinanceRowValueByLabel(financeRows, "LD (Mny) in Barracks"),
          buildFundsAvailableLd: getFinanceRowValueByLabel(financeRows, "Build Funds Available"),
          transferToEuropeLd: getFinanceRowValueByLabel(financeRows, "Transfer TO Europe"),
          transferFromEuropeLd: getFinanceRowValueByLabel(financeRows, "Transfer FROM Europe"),
          transferToCaribbeanLd: getFinanceRowValueByLabel(financeRows, "Transfer TO Caribbean"),
          transferFromCaribbeanLd: getFinanceRowValueByLabel(financeRows, "Transfer FROM Caribbean"),
          transferToIndiaLd: getFinanceRowValueByLabel(financeRows, "Transfer TO India"),
          transferFromIndiaLd: getFinanceRowValueByLabel(financeRows, "Transfer FROM India"),
          directSellingLd: getFinanceRowValueByLabel(financeRows, "Direct Selling"),
          directBuyingLd: getFinanceRowValueByLabel(financeRows, "Direct Buying"),
          taxesLd: getFinanceRowValueByLabel(financeRows, "Taxes"),
          ldProduction: getFinanceRowValueByLabel(financeRows, "LD Production"),
          projectedNextMonthLd: getFinanceRowValueByLabel(financeRows, "Projected Next Month LD"),
        });
      });
      return payload;
    }

    function hasPersistedEconomySummary(summary) {
      if (!summary) {
        return false;
      }
      var rows = summary.rows || summary.Rows || [];
      return Object.keys(economyTabs).every(function (tabKey) {
        var sphere = getComputedSphereForTab(tabKey);
        if (!sphere) {
          return false;
        }
        var match = null;
        (rows || []).forEach(function (row) {
          var rowSphere = toText(row && (row.sphere != null ? row.sphere : row.Sphere), "");
          if (!match && rowSphere.toLowerCase() === sphere.toLowerCase()) {
            match = row;
          }
        });
        if (!match) {
          return false;
        }
        var computedVersion = toInt(match.computedVersion != null ? match.computedVersion : match.ComputedVersion, 0);
        return computedVersion >= economyComputedVersion;
      });
    }

    function buildFinanceSummaryFromPersisted(tabKey, summary) {
      var sphere = getComputedSphereForTab(tabKey);
      if (!sphere) {
        return [];
      }
      var persistedRows = summary.rows || summary.Rows || [];
      var match = null;
      (persistedRows || []).forEach(function (row) {
        var rowSphere = toText(row && (row.sphere != null ? row.sphere : row.Sphere), "");
        if (!match && rowSphere.toLowerCase() === sphere.toLowerCase()) {
          match = row;
        }
      });
      if (!match) {
        return [];
      }
      function getValue(camelName, pascalName) {
        if (match && match[camelName] != null) {
          return toInt(match[camelName], 0);
        }
        if (match && match[pascalName] != null) {
          return toInt(match[pascalName], 0);
        }
        return 0;
      }

      var startingRevenue = getValue("startingRevenueLd", "StartingRevenueLd");
      var armyMaintLd = getValue("armyMaintLd", "ArmyMaintLd");
      var navyMaintLd = getValue("navyMaintLd", "NavyMaintLd");
      var productionMaintLd = getValue("productionMaintLd", "ProductionMaintLd");
      var armyBuildingLd = getValue("armyBuildingLd", "ArmyBuildingLd");
      var armyTrainingLd = getValue("armyTrainingLd", "ArmyTrainingLd");
      var navyBuildRepairLd = getValue("navyBuildRepairLd", "NavyBuildRepairLd");
      var productionBuildLd = getValue("productionBuildLd", "ProductionBuildLd");
      var ldInBarracks = getValue("ldInBarracks", "LdInBarracks");
      var interSphereTransferTotals = getInterSphereTransferTotals(tabKey);
      var transferToLd = Math.max(0, toInt(interSphereTransferTotals.transferToLd, 0));
      var transferFromLd = Math.max(0, toInt(interSphereTransferTotals.transferFromLd, 0));
      var buildFundsDeductions =
        armyMaintLd +
        navyMaintLd +
        productionMaintLd +
        armyBuildingLd +
        armyTrainingLd +
        navyBuildRepairLd +
        productionBuildLd;
      var buildFundsAvailable =
        startingRevenue -
        buildFundsDeductions +
        Math.abs(ldInBarracks) +
        transferFromLd -
        transferToLd;

      var financeRows = [
        { label: "Starting Revenue", value: startingRevenue, totalLine: true },
        { label: "Production Maint.", value: productionMaintLd },
        { label: "Army Building", value: armyBuildingLd },
        { label: "Army Training", value: armyTrainingLd },
        { label: "Navy Build & Repair", value: navyBuildRepairLd },
        { label: "Production Build", value: productionBuildLd },
        { label: "LD (Mny) in Barracks", value: ldInBarracks },
      ];

      if (tabKey === "europe") {
        financeRows.splice(
          1,
          0,
          { label: "Army Maint", value: armyMaintLd },
          { label: "Navy Maint", value: navyMaintLd },
        );
      }

      var transferRows = buildTs01InterSphereTransferRows(tabKey);
      financeRows = financeRows.concat(transferRows);
      financeRows.push({ label: "Build Funds Available", value: buildFundsAvailable, totalLine: true });
      financeRows.push({ label: "Direct Selling", value: getValue("directSellingLd", "DirectSellingLd") });
      financeRows.push({ label: "Direct Buying", value: getValue("directBuyingLd", "DirectBuyingLd") });
      financeRows.push({ label: "Taxes", value: getValue("taxesLd", "TaxesLd") });
      financeRows.push({ label: "LD Production", value: getValue("ldProduction", "LdProduction") });
      financeRows.push({
        label: "Projected Next Month LD",
        value: getValue("projectedNextMonthLd", "ProjectedNextMonthLd"),
        highlight: true,
        totalLine: true,
      });

      return financeRows;
    }

    function loadPersistedEconomySummary(turnId) {
      return turnReportFactory.getTREconomyComputedSummary(turnId).then(
        function (summary) {
          $scope.economyComputedSummary = summary || null;
          return $scope.economyComputedSummary;
        },
        function () {
          $scope.economyComputedSummary = null;
          return null;
        },
      );
    }

    function ensurePersistedEconomySummary() {
      var turnId = toText($scope.masterData && $scope.masterData.turnId, "");
      if (!turnId || turnId === "Unknown") {
        return $q.when(null);
      }
      // Always recompute from current TS/TR data when entering Economy so
      // build/train/repair cost edits are reflected immediately on next visit.
      return getBuildRowsForTurn().then(function (buildRows) {
        var payload = buildEconomyComputedSummaryPayload(buildRows || []);
        return turnReportFactory.saveTREconomyComputedSummary(payload).then(
          function (savedSummary) {
            $scope.economyComputedSummary = savedSummary || payload;
            return $scope.economyComputedSummary;
          },
          function () {
            // If save fails, try loading persisted summary; otherwise rely on runtime calculation.
            return loadPersistedEconomySummary(turnId).then(function (fallbackSummary) {
              if (hasPersistedEconomySummary(fallbackSummary)) {
                return fallbackSummary;
              }
              $scope.economyComputedSummary = null;
              return null;
            });
          },
        );
      });
    }

    function estimateTradeSummaryForSphere(tabKey) {
      return economyTradeFactory.estimateTradeSummaryForSphere(createTradeEstimationInput(tabKey));
    }

    function buildBalanceRows(warehouse, productionRows) {
      var productionTotals = sumResourceRows(productionRows);
      var productionCitizens = sumProductionCitizens(productionRows);
      var balance = createEmptyResourceBag();
      var projected = createEmptyResourceBag();
      resourceKeys.forEach(function (key) {
        var stock = toInt(warehouse[key], 0);
        var produced = toInt(productionTotals[key], 0);
        if (key === "citizens") {
          // Total Citz column is the net citizens value from the middle production table.
          balance[key] = stock + productionCitizens;
          projected[key] = stock + productionCitizens;
          return;
        }
        // Balance Available = warehouse start value + net production table values.
        balance[key] = stock + produced;
        projected[key] = stock + produced;
      });

      return {
        balance: balance,
        projected: projected,
      };
    }

    function refreshEconomyViewForTab(tabKey) {
      var warehouseRaw = getWarehouseRowForSphere(tabKey);
      $scope.economyWarehouse = normalizeWarehouseForDisplay(warehouseRaw, tabKey);

      return getBuildRowsForTurn().then(function (buildRows) {
        var productionRowsByTab = {
          europe: economyProductionFactory.buildProductionModel(createProductionModelInput("europe", buildRows)),
          caribbean: economyProductionFactory.buildProductionModel(createProductionModelInput("caribbean", buildRows)),
          india: economyProductionFactory.buildProductionModel(createProductionModelInput("india", buildRows)),
        };
        $scope.economyProductionRows = productionRowsByTab[tabKey] || [];
        $scope.economyProductionSummaryRows = buildProductionSummaryRows(tabKey, $scope.economyProductionRows);
        // Finance pane should always reflect the same live production rows shown on screen.
        // Persisted summaries are still saved for history/export, but not used as display source.
        $scope.economyFinanceRows = buildFinanceSummary(
          tabKey,
          $scope.economyWarehouse,
          $scope.economyProductionRows,
          productionRowsByTab,
        );
        $scope.economyTotals = buildBalanceRows($scope.economyWarehouse, $scope.economyProductionRows);
      });
    }

    function ensureProductionSiteRules() {
      function hasAttritionData(rows) {
        return (rows || []).some(function (row) {
          return (
            row &&
            (row.citizenAttritionPercent != null ||
              row.CitizenAttritionPercent != null)
          );
        });
      }

      var existing = getRulesProductionSites();
      if (existing && existing.length && hasAttritionData(existing)) {
        $scope.productionSiteRules = existing;
        return $q.when(existing);
      }

      return rulesCatalogFactory.getRefProductionSites().then(function (rows) {
        $scope.productionSiteRules = rows || [];
        return $scope.productionSiteRules;
      });
    }

    function loadTurnDataIfNeeded() {
      var hasTurnReport = !!($scope.masterData && $scope.masterData.turnReport);
      var turnId = $scope.masterData && $scope.masterData.turnId;
      if (!turnId || turnId === "Unknown") {
        return $q.when();
      }

      var promises = [];
      promises.push(hasTurnReport ? $q.when($scope.masterData.turnReport) : turnDataLoaderService.loadTR($scope.masterData, turnId));
      // Always refresh TS so TS_13 build rows are replayed fresh when entering Economy.
      promises.push(turnDataLoaderService.loadTS($scope.masterData, turnId));
      return $q.all(promises);
    }

    function ensureRefStates() {
      if ($scope.refStates && $scope.refStates.length) {
        return $q.when($scope.refStates);
      }
      return rulesCatalogFactory.getRefStates().then(
        function (rows) {
          $scope.refStates = rows || [];
          return $scope.refStates;
        },
        function () {
          $scope.refStates = [];
          return $scope.refStates;
        },
      );
    }

    function ensureEconomyArmyList() {
      var selectedState = toText($scope.masterData && $scope.masterData.selectedState, "").toUpperCase();
      var turnId = toText($scope.masterData && $scope.masterData.turnId, "");
      var turnState = turnId && turnId.length >= 4 ? turnId.substr(3, 1).toUpperCase() : "";
      var stateToLoad = selectedState || turnState || "E";

      if ($scope.economyArmyList && $scope.economyArmyList.length && $scope.economyArmyListState === stateToLoad) {
        return $q.when($scope.economyArmyList);
      }
      return rulesCatalogFactory.getArmyList(stateToLoad).then(
        function (rows) {
          if ((rows || []).length) {
            $scope.economyArmyList = rows || [];
            $scope.economyArmyListState = stateToLoad;
            return $scope.economyArmyList;
          }

          if (stateToLoad !== "E") {
            return rulesCatalogFactory.getArmyList("E").then(function (fallbackRows) {
              $scope.economyArmyList = fallbackRows || [];
              $scope.economyArmyListState = "E";
              return $scope.economyArmyList;
            });
          }

          $scope.economyArmyList = [];
          $scope.economyArmyListState = stateToLoad;
          return $scope.economyArmyList;
        },
        function () {
          $scope.economyArmyList = [];
          $scope.economyArmyListState = stateToLoad;
          return $scope.economyArmyList;
        },
      );
    }

    $scope.masterData = masterData;
    $scope.activeEconomyTab = "europe";
    $scope.economyViewMode = "buildMaintain";
    $scope.economyWarehouse = normalizeWarehouseForDisplay({}, "europe");
    $scope.economyProductionRows = [];
    $scope.economyProductionSummaryRows = createProductionSummaryRows();
    $scope.economyFinanceRows = [];
    $scope.economyTotals = { balance: createEmptyResourceBag(), projected: createEmptyResourceBag() };
    $scope.isEconomyLoading = false;
    $scope.economyLoadError = null;
    $scope.economyComputedSummary = null;
    $scope.productionSiteRules = [];
    $scope.refStates = [];
    $scope.economyArmyList = [];
    $scope.economyArmyListState = "";
    $scope.economyInterSphereTransfers = {};

    $scope.selectEconomyTab = function (tabKey) {
      var nextTab = economyTabs[tabKey] ? tabKey : "europe";
      $scope.activeEconomyTab = nextTab;
      refreshEconomyViewForTab(nextTab).catch(function (error) {
        $scope.economyLoadError = (error && error.data) || "Unable to load economy data.";
      });
    };

    $scope.setEconomyViewMode = function (modeKey) {
      if (modeKey !== "buildMaintain" && modeKey !== "production") {
        return;
      }
      $scope.economyViewMode = modeKey;
    };

    $scope.getEconomyFinancePaneTitle = function () {
      var sphereLabel = toText($scope.economyWarehouse && $scope.economyWarehouse.sphereLabel, "");
      return sphereLabel ? sphereLabel + " Finances" : "Finances";
    };

    $scope.onEconomyFinanceRowInputChanged = function (item) {
      if (!item || !item.editable) {
        return;
      }
      var fromWarehouseNo = toInt(item.fromWarehouseNo, 0);
      var toWarehouseNo = toInt(item.toWarehouseNo, 0);
      if (fromWarehouseNo <= 0 || toWarehouseNo <= 0 || fromWarehouseNo === toWarehouseNo) {
        return;
      }
      var amount = Math.max(0, toInt(item.inputValue, 0));
      item.inputValue = amount;
      item.value = amount;
      setInterSphereTransferAmount(fromWarehouseNo, toWarehouseNo, amount);
      persistInterSphereTransfersToTurnSheet()
        .then(function () {
          // Recompute and persist all sphere summaries so cross-sphere totals stay in sync.
          return ensurePersistedEconomySummary();
        })
        .then(function () {
          return refreshEconomyViewForTab($scope.activeEconomyTab || "europe");
        })
        .then(function () {
          $scope.$emit("economyBuildFundsChanged");
        })
        .catch(function (error) {
          $scope.economyLoadError = (error && error.data) || "Unable to save economy transfer.";
        });
    };

    $scope.formatNumber = function (value) {
      return toInt(value, 0).toLocaleString();
    };

    $scope.formatProductionNumber = function (value) {
      var numeric = toInt(value, 0);
      if (!numeric) {
        return "";
      }
      // Production view should show negative values without the minus sign.
      return Math.abs(numeric).toLocaleString();
    };

    $scope.getProductionValueClass = function (value) {
      var numeric = toInt(value, 0);
      if (numeric < 0) {
        return "text-danger";
      }
      return "";
    };

    $scope.getFinanceDisplayValue = function (item) {
      var numeric = toInt(item && item.value, 0);
      if (item && isFinanceDebitLabel(item.label)) {
        return -Math.abs(numeric);
      }
      return numeric;
    };

    $scope.getFinanceValueClass = function (item) {
      if (!item) {
        return "";
      }
      if (item.editable) {
        var editableNumeric = toInt(item.inputValue, toInt(item.value, 0));
        if (isFinanceDebitLabel(item.label)) {
          editableNumeric = -Math.abs(editableNumeric);
        }
        return $scope.getProductionValueClass(editableNumeric);
      }
      return $scope.getProductionValueClass($scope.getFinanceDisplayValue(item));
    };

    $scope.getVisibleProductionRows = function () {
      var rows = $scope.economyProductionRows || [];
      if ($scope.economyViewMode !== "production") {
        return rows;
      }
      return rows.filter(function (row) {
        return row && row.key !== "barracks";
      });
    };

    $scope.isProductionResourceApplicable = function (row, resourceKey) {
      if (!row || !resourceKey) {
        return false;
      }

      var rowKey = toText(row.key, "");
      if (rowKey && productionResourceColumnsByRowKey[rowKey]) {
        return !!productionResourceColumnsByRowKey[rowKey][resourceKey];
      }

      var mappedKey = mapProductionTypeToResourceKey(row.productionType);
      return mappedKey === resourceKey;
    };

    $scope.getProductionResourceCellClass = function (row, resourceKey) {
      if (!$scope.isProductionResourceApplicable(row, resourceKey)) {
        return "economyCellNotApplicable";
      }
      return $scope.getProductionValueClass(row && row.resources ? row.resources[resourceKey] : 0);
    };

    $scope.getProductionResourceDisplayValue = function (row, resourceKey) {
      if (!$scope.isProductionResourceApplicable(row, resourceKey)) {
        return "";
      }
      return $scope.formatProductionNumber(row && row.resources ? row.resources[resourceKey] : 0);
    };

    $scope.getProductionCitizensForRow = function (row) {
      var total = toInt(row && row.maintenanceWorkers, 0) + toInt(row && row.buildCitizens, 0);
      return total === 0 ? 0 : -Math.abs(total);
    };

    $scope.initEconomy = function () {
      if (!$scope.masterData || !$scope.masterData.turnId || $scope.masterData.turnId === "Unknown") {
        $scope.economyProductionRows = createProductionRows();
        $scope.economyFinanceRows = [];
        $scope.economyLoadError = "Select a turn to view economy details.";
        return;
      }

      $scope.isEconomyLoading = true;
      $scope.economyLoadError = null;

      loadTurnDataIfNeeded()
        .then(function () {
          hydrateInterSphereTransfersFromTurnSheet();
          return $q.all([ensureProductionSiteRules(), ensureRefStates(), ensureEconomyArmyList()]);
        })
        .then(function () {
          return ensurePersistedEconomySummary();
        })
        .then(function () {
          return refreshEconomyViewForTab($scope.activeEconomyTab || "europe");
        })
        .then(function () {
          $scope.$emit("economyBuildFundsChanged");
        })
        .catch(function (error) {
          $scope.economyLoadError = (error && error.data) || "Unable to load economy data.";
          $scope.economyProductionRows = createProductionRows();
          $scope.economyFinanceRows = [];
          $scope.economyTotals = { balance: createEmptyResourceBag(), projected: createEmptyResourceBag() };
        })
        .finally(function () {
          $scope.isEconomyLoading = false;
        });
    };
  },
);
