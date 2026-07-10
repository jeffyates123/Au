"use strict";

austerlitzModule.controller(
  "economyController",
  function (
    $scope,
    $q,
    masterData,
    turnDataLoaderService,
    turnSheetFactory,
    rulesCatalogFactory,
  ) {
    var sphereByTab = {
      europe: { minX: 1, maxX: 80, minY: 1, maxY: 65 },
      caribbean: { minX: 1, maxX: 40, minY: 70, maxY: 99 },
      india: { minX: 51, maxX: 90, minY: 70, maxY: 99 },
    };
    var economyTabs = { europe: true, caribbean: true, india: true };
    var resourceKeys = [
      "money",
      "citizens",
      "ecPts",
      "food",
      "stone",
      "wood",
      "ore",
      "zinc",
      "horses",
      "textiles",
      "wool",
      "gold",
      "wine",
    ];
    var productionRowConfig = [
      { key: "barracks", label: "2. Barracks", siteTypeNo: 2 },
      { key: "factories", label: "4. Factories", siteTypeNo: 4 },
      { key: "weaving", label: "5. Weaving Mills", siteTypeNo: 5 },
      { key: "mints", label: "6. Mints", siteTypeNo: 6 },
      { key: "primeEstates", label: "7. Prime Estates", siteTypeNo: 7, prime: true },
      { key: "estates", label: "7. Estates", siteTypeNo: 7, prime: false },
      { key: "primeSheep", label: "8. Prime Sheep Farm", siteTypeNo: 8, prime: true },
      { key: "sheep", label: "8. Sheep Farm", siteTypeNo: 8, prime: false },
      { key: "primeHorse", label: "9. Prime Horse Farm", siteTypeNo: 9, prime: true },
      { key: "horse", label: "9. Horse Farm", siteTypeNo: 9, prime: false },
      { key: "lumber", label: "10. Lumber Camp", siteTypeNo: 10 },
      { key: "quarries", label: "11. Quarries", siteTypeNo: 11 },
      { key: "goldMine", label: "12. Gold Mine", siteTypeNo: 12, productionType: "gold" },
      { key: "oreMine", label: "12. Ore Mine", siteTypeNo: 12, productionType: "ore" },
      { key: "zincMine", label: "12. Zinc Mine", siteTypeNo: 12, productionType: "zinc" },
      { key: "vineyards", label: "13. Vineyards", siteTypeNo: 13 },
      { key: "quickFortress", label: "15. Quick Fortress", siteTypeNo: 15 },
      { key: "smallFortress", label: "21. Small Fortress", siteTypeNo: 21, fortressCost: 350000 },
      { key: "mediumFortress", label: "21. Medium Fortress", siteTypeNo: 21, fortressCost: 600000 },
      { key: "largeFortress", label: "21. Large Fortress", siteTypeNo: 21, fortressCost: 900000 },
    ];
    var tradeEstimateGoodsConfig = [
      { cityKey: "ectPts", goodsFactor: 6 },
      { cityKey: "food", goodsFactor: 4 },
      { cityKey: "stone", goodsFactor: 1 },
      { cityKey: "wood", goodsFactor: 3 },
      { cityKey: "ore", goodsFactor: 30 },
      { cityKey: "zinc", goodsFactor: 45 },
      { cityKey: "horses", goodsFactor: 2 },
      { cityKey: "textiles", goodsFactor: 5 },
      { cityKey: "wool", goodsFactor: 2 },
      { cityKey: "gold", goodsFactor: 35 },
      { cityKey: "wine", goodsFactor: 8 },
    ];
    var tradeGoodsIdToKey = {
      13: "ectPts",
      16: "food",
      18: "stone",
      19: "wood",
      20: "ore",
      21: "zinc",
      22: "horses",
      23: "textiles",
      24: "wool",
      29: "gold",
      30: "wine",
    };
    var goodsFactorByKey = {};
    (tradeEstimateGoodsConfig || []).forEach(function (item) {
      goodsFactorByKey[item.cityKey] = item.goodsFactor;
    });
    var populationCitizensByDensity = {
      1: 4000,
      2: 10000,
      3: 20000,
      4: 40000,
      5: 60000,
      6: 90000,
      7: 120000,
      8: 160000,
      9: 200000,
    };

    function toInt(value, fallback) {
      var parsed = parseInt(value, 10);
      return isNaN(parsed) ? fallback : parsed;
    }

    function toFloat(value, fallback) {
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

    function normalizeStateCode(value) {
      var text = toText(value, "").toUpperCase();
      if (!text) {
        return "";
      }
      return text.charAt(0);
    }

    function createEmptyResourceBag() {
      var bag = {};
      resourceKeys.forEach(function (key) {
        bag[key] = 0;
      });
      return bag;
    }

    function createProductionRow(config) {
      return {
        key: config.key,
        label: config.label,
        siteTypeNo: config.siteTypeNo,
        productionType: config.productionType || null,
        prime: config.prime,
        fortressCost: config.fortressCost || null,
        buildCount: 0,
        workCount: 0,
        maintenanceLd: 0,
        maintenanceWorkers: 0,
        buildLd: 0,
        buildCitizens: 0,
        resources: createEmptyResourceBag(),
      };
    }

    function createProductionSummaryRow(key, label) {
      return {
        key: key,
        label: label,
        citizens: 0,
        resources: createEmptyResourceBag(),
      };
    }

    function createProductionSummaryRows() {
      return [
        createProductionSummaryRow("goodsInBarracks", "Goods in Barracks"),
        createProductionSummaryRow("productionBuildMaintenance", "Prod. Build/Maintain"),
        createProductionSummaryRow("populationBuildMaintenance", "Pop. Build/Maintain"),
        createProductionSummaryRow("armyBuildMaintenance", "Army Build/Maintain"),
        createProductionSummaryRow("navyBuildRepair", "Navy Build & Repair"),
        createProductionSummaryRow("baggageTrainBuildRepair", "Bag. T Build/Repair"),
        createProductionSummaryRow("directTrade", "Direct Trade"),
      ];
    }

    function mapTradeResourceKey(key) {
      if (key === "ectPts") {
        return "ecPts";
      }
      return key;
    }

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
        resourceKeys.forEach(function (key) {
          totals[key] += toInt(row && (row[key] != null ? row[key] : row[key.charAt(0).toUpperCase() + key.slice(1)]), 0);
        });
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

    function buildTradeDirectByGoodForSphere(tabKey) {
      var totals = createEmptyResourceBag();
      var bounds = sphereByTab[tabKey];
      if (!bounds) {
        return totals;
      }

      var turnSheet = ($scope.masterData && $scope.masterData.turnSheet) || {};
      var ts17Rows = turnSheet.tsTradeAndLoading1 || turnSheet.TSTradeAndLoading1 || [];
      var ts19Rows = turnSheet.tsTradeAndLoading2 || turnSheet.TSTradeAndLoading2 || [];
      var allRows = (ts17Rows || []).concat(ts19Rows || []);
      if (!allRows.length) {
        return totals;
      }

      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      var tradingCities = turnReport.tradingPortsAndCities || turnReport.TradingPortsAndCities || [];
      var cityLookup = {};
      (tradingCities || []).forEach(function (city) {
        var itemNo = toInt(city.itemNo != null ? city.itemNo : city.ItemNo, 0);
        if (itemNo > 0) {
          cityLookup[itemNo] = city;
        }
      });

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
          grouped[key] = { cityItemNo: cityItemNo, goodsId: goodsId, directBuyQty: 0, sellQty: 0, sellN: 0 };
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
        var resourceKey = mapTradeResourceKey(cityKey);
        if (!Object.prototype.hasOwnProperty.call(totals, resourceKey)) {
          return;
        }
        var goodsFactor = Math.max(0, toInt(goodsFactorByKey[cityKey], 0));
        var cityStock = Math.max(
          0,
          toInt(
            city[cityKey] != null ? city[cityKey] : city[cityKey.charAt(0).toUpperCase() + cityKey.slice(1)],
            0,
          ),
        );
        var directBuyQty = Math.max(0, item.directBuyQty);
        var qty = Math.max(0, item.sellQty);
        var n = Math.max(0, item.sellN);
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
        totals[resourceKey] += totalSell - totalDirect;
      });

      return totals;
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

      var populationTotals = sumTs01GoodsForSections(tabKey, [12]);
      byKey.populationBuildMaintenance.citizens = toInt(populationTotals.citizens, 0);
      byKey.populationBuildMaintenance.resources.ecPts = toInt(populationTotals.ecPts, 0);
      byKey.populationBuildMaintenance.resources.wood = toInt(populationTotals.wood, 0);
      byKey.populationBuildMaintenance.resources.horses = toInt(populationTotals.horses, 0);
      byKey.populationBuildMaintenance.resources.textiles = toInt(populationTotals.textiles, 0);

      var armyTotals = sumTs01GoodsForSections(tabKey, [3, 4, 5, 6]);
      byKey.armyBuildMaintenance.citizens = toInt(armyTotals.citizens, 0);
      byKey.armyBuildMaintenance.resources.ecPts = toInt(armyTotals.ecPts, 0);
      byKey.armyBuildMaintenance.resources.wood = toInt(armyTotals.wood, 0);
      byKey.armyBuildMaintenance.resources.horses = toInt(armyTotals.horses, 0);
      byKey.armyBuildMaintenance.resources.textiles = toInt(armyTotals.textiles, 0);

      var navyTotals = sumTs01GoodsForSections(tabKey, [9, 10]);
      byKey.navyBuildRepair.citizens = toInt(navyTotals.citizens, 0);
      byKey.navyBuildRepair.resources.ecPts = toInt(navyTotals.ecPts, 0);
      byKey.navyBuildRepair.resources.wood = toInt(navyTotals.wood, 0);
      byKey.navyBuildRepair.resources.horses = toInt(navyTotals.horses, 0);
      byKey.navyBuildRepair.resources.textiles = toInt(navyTotals.textiles, 0);

      var baggageTotals = sumTs01GoodsForSections(tabKey, [11]);
      byKey.baggageTrainBuildRepair.citizens = toInt(baggageTotals.citizens, 0);
      byKey.baggageTrainBuildRepair.resources.ecPts = toInt(baggageTotals.ecPts, 0);
      byKey.baggageTrainBuildRepair.resources.wood = toInt(baggageTotals.wood, 0);
      byKey.baggageTrainBuildRepair.resources.horses = toInt(baggageTotals.horses, 0);
      byKey.baggageTrainBuildRepair.resources.textiles = toInt(baggageTotals.textiles, 0);

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

    function mapProductionTypeToResourceKey(productionType) {
      var key = toText(productionType, "").toLowerCase();
      if (!key) {
        return null;
      }
      if (key === "louisdore") {
        return "money";
      }
      if (key === "ecpts") {
        return "ecPts";
      }
      if (key === "citizens") {
        return "citizens";
      }
      return key;
    }

    function inBounds(x, y, bounds) {
      return (
        x >= bounds.minX &&
        x <= bounds.maxX &&
        y >= bounds.minY &&
        y <= bounds.maxY
      );
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

    function buildProductionSiteLookup(productionSites) {
      var lookup = {};
      (productionSites || []).forEach(function (site) {
        var symbol = toText(site.symbol != null ? site.symbol : site.Symbol, "");
        var secondarySymbol = toText(site.secondarySymbol != null ? site.secondarySymbol : site.SecondarySymbol, "");
        if (symbol) {
          lookup[symbol] = lookup[symbol] || [];
          lookup[symbol].push(site);
        }
        if (secondarySymbol) {
          lookup[secondarySymbol] = lookup[secondarySymbol] || [];
          lookup[secondarySymbol].push(site);
        }
      });
      return lookup;
    }

    function createProductionRows() {
      return productionRowConfig.map(createProductionRow);
    }

    function isPrimeCoordinateForRule(rule, coord) {
      var bonusSymbol = toText(rule.bonusSymbol != null ? rule.bonusSymbol : rule.BonusSymbol, "");
      var bonusPercent = toInt(rule.bonusPercentage != null ? rule.bonusPercentage : rule.BonusPercentage, 0);
      var coordBonus = toText(coord && (coord.bonus != null ? coord.bonus : coord.Bonus), "");
      return !!(bonusSymbol && bonusPercent > 0 && coordBonus && bonusSymbol.toLowerCase() === coordBonus.toLowerCase());
    }

    function getProductionRowForRule(rows, rule, coord) {
      var siteTypeNo = toInt(rule.siteTypeNo != null ? rule.siteTypeNo : rule.SiteTypeNo, 0);
      var productionType = toText(rule.productionType != null ? rule.productionType : rule.ProductionType, "").toLowerCase();
      var cost = toInt(rule.cost != null ? rule.cost : rule.Cost, 0);
      var isPrime = isPrimeCoordinateForRule(rule, coord);

      for (var i = 0; i < (rows || []).length; i++) {
        var row = rows[i];
        if (toInt(row.siteTypeNo, 0) !== siteTypeNo) {
          continue;
        }
        if (row.productionType && row.productionType.toLowerCase() !== productionType) {
          continue;
        }
        if (row.fortressCost && row.fortressCost !== cost) {
          continue;
        }
        if (row.prime === true && !isPrime) {
          continue;
        }
        if (row.prime === false && isPrime) {
          continue;
        }
        return row;
      }

      for (var j = 0; j < (rows || []).length; j++) {
        if (toInt(rows[j].siteTypeNo, 0) === siteTypeNo) {
          return rows[j];
        }
      }
      return null;
    }

    function selectMatchingProductionRule(rules, coord) {
      if (!rules || !rules.length) {
        return null;
      }
      if (rules.length === 1) {
        return rules[0];
      }

      var bonus = toText(coord.bonus != null ? coord.bonus : coord.Bonus, "");
      if (bonus) {
        for (var i = 0; i < rules.length; i++) {
          var bonusSymbol = toText(rules[i].bonusSymbol != null ? rules[i].bonusSymbol : rules[i].BonusSymbol, "");
          if (bonusSymbol && bonusSymbol.toLowerCase() === bonus.toLowerCase()) {
            return rules[i];
          }
        }
      }

      var terrain = toText(coord.terrain != null ? coord.terrain : coord.Terrain, "");
      if (terrain) {
        for (var j = 0; j < rules.length; j++) {
          var terrains = toText(rules[j].terrain != null ? rules[j].terrain : rules[j].Terrain, "");
          if (terrains && terrains.indexOf(terrain) >= 0) {
            return rules[j];
          }
        }
      }

      return rules[0];
    }

    function applyProductionRuleToRow(row, rule, coord) {
      if (!row || !rule) {
        return;
      }

      function getMaintenanceCitizens(ruleRow) {
        var citizensPerSite = toInt(
          ruleRow.citizensRequired != null
            ? ruleRow.citizensRequired
            : ruleRow.CitizensRequired,
          0,
        );
        var attritionPercent = toFloat(
          ruleRow.citizenAttritionPercent != null
            ? ruleRow.citizenAttritionPercent
            : ruleRow.CitizenAttritionPercent,
          100,
        );
        return Math.round(citizensPerSite * (attritionPercent / 100));
      }

      row.workCount += 1;
      row.maintenanceLd += toInt(rule.maintenance != null ? rule.maintenance : rule.Maintenance, 0);
      row.maintenanceWorkers += getMaintenanceCitizens(rule);

      var resourceKey = mapProductionTypeToResourceKey(rule.productionType != null ? rule.productionType : rule.ProductionType);
      if (!resourceKey || !Object.prototype.hasOwnProperty.call(row.resources, resourceKey)) {
        return;
      }

      var maxProduction = toInt(rule.maxProduction != null ? rule.maxProduction : rule.MaxProduction, 0);
      var bonusSymbol = toText(rule.bonusSymbol != null ? rule.bonusSymbol : rule.BonusSymbol, "");
      var bonusPercent = toInt(rule.bonusPercentage != null ? rule.bonusPercentage : rule.BonusPercentage, 0);
      var coordBonus = toText(coord.bonus != null ? coord.bonus : coord.Bonus, "");
      if (bonusSymbol && coordBonus && bonusSymbol.toLowerCase() === coordBonus.toLowerCase() && bonusPercent > 0) {
        maxProduction += Math.round((maxProduction * bonusPercent) / 100);
      }

      // Factories EcPts should always be shown as a positive contribution.
      if (row.key === "factories" && resourceKey === "ecPts") {
        maxProduction = Math.abs(maxProduction);
      }
      row.resources[resourceKey] += maxProduction;
    }

    function normalizeBuildRows(rows) {
      return (rows || []).filter(function (row) {
        var siteTypeNo = toInt(row && (row.prodSiteType != null ? row.prodSiteType : row.ProdSiteType), 0);
        var x = toInt(row && (row.x != null ? row.x : row.X), 0);
        var y = toInt(row && (row.y != null ? row.y : row.Y), 0);
        return siteTypeNo > 0 && x > 0 && y > 0;
      });
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

    function buildProductionModel(tabKey, buildRows) {
      var rows = createProductionRows();

      var bounds = sphereByTab[tabKey];
      var selectedState = normalizeStateCode($scope.masterData && $scope.masterData.selectedState);
      var mapRows = ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.mapCoordinates) ||
        ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.MapCoordinates) || [];
      var refProductionSites = getRulesProductionSites();
      var rulesBySymbol = buildProductionSiteLookup(refProductionSites);
      var coordLookup = {};

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

          var state = normalizeStateCode(coord.state != null ? coord.state : coord.State);
          if (!state || state !== selectedState) {
            return;
          }

          coordLookup[x + "," + y] = coord;

          var symbol = toText(coord.productionSite != null ? coord.productionSite : coord.ProductionSite, "");
          if (!symbol || symbol === "." || symbol === " ") {
            return;
          }

          var matchingRules = rulesBySymbol[symbol] || [];
          var selectedRule = selectMatchingProductionRule(matchingRules, coord);
          if (!selectedRule) {
            return;
          }

          var targetRow = getProductionRowForRule(rows, selectedRule, coord);
          if (!targetRow) {
            return;
          }

          applyProductionRuleToRow(targetRow, selectedRule, coord);
        });
      });

      (buildRows || []).forEach(function (row) {
        var x = toInt(row.x != null ? row.x : row.X, 0);
        var y = toInt(row.y != null ? row.y : row.Y, 0);
        if (!inBounds(x, y, bounds)) {
          return;
        }
        var siteTypeNo = toInt(row.prodSiteType != null ? row.prodSiteType : row.ProdSiteType, 0);
        var coord = coordLookup[x + "," + y] || { x: x, y: y };
        var siteTypeRules = (refProductionSites || []).filter(function (siteRule) {
          return toInt(siteRule.siteTypeNo != null ? siteRule.siteTypeNo : siteRule.SiteTypeNo, 0) === siteTypeNo;
        });
        var selectedRule = selectMatchingProductionRule(siteTypeRules, coord) || { SiteTypeNo: siteTypeNo };
        var target = getProductionRowForRule(rows, selectedRule, coord);
        if (target) {
          target.buildCount += 1;
          target.buildLd += toInt(selectedRule.cost != null ? selectedRule.cost : selectedRule.Cost, 0);
          target.buildCitizens += toInt(
            selectedRule.citizensRequired != null ? selectedRule.citizensRequired : selectedRule.CitizensRequired,
            0,
          );
        }
      });

      return rows;
    }

    function sumResourceRows(rows) {
      var total = createEmptyResourceBag();
      (rows || []).forEach(function (row) {
        resourceKeys.forEach(function (key) {
          total[key] += toInt(row.resources && row.resources[key], 0);
        });
      });
      return total;
    }

    function sumProductionCitizens(rows) {
      return (rows || []).reduce(function (sum, row) {
        return sum + toInt(row.maintenanceWorkers, 0) + toInt(row.buildCitizens, 0);
      }, 0);
    }

    function getTurnSheetRows(camelKey, pascalKey) {
      var turnSheet = ($scope.masterData && $scope.masterData.turnSheet) || {};
      return turnSheet[camelKey] || turnSheet[pascalKey] || [];
    }

    function getTurnReportBrigades() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.brigades || turnReport.Brigades || [];
    }

    function isEuropeCoordinate(x, y) {
      return inBounds(x, y, sphereByTab.europe);
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

    function buildFinanceSummary(tabKey, warehouse, productionRows) {
      var economySummary = ($scope.masterData && $scope.masterData.turnReport && ($scope.masterData.turnReport.economySummary || $scope.masterData.turnReport.EconomySummary)) || {};
      var productionTotals = sumResourceRows(productionRows);
      var maintenanceLd = productionRows.reduce(function (sum, row) { return sum + toInt(row.maintenanceLd, 0); }, 0);
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
      var commanderPay = toInt(economySummary.commanderPayLd != null ? economySummary.commanderPayLd : economySummary.CommanderPayLd, 0);
      var brigadePay = toInt(economySummary.brigadePayLd != null ? economySummary.brigadePayLd : economySummary.BrigadePayLd, 0);
      var navyMaintenance = toInt(economySummary.navyMaintenanceLd != null ? economySummary.navyMaintenanceLd : economySummary.NavyMaintenanceLd, 0);
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
      var projectedNextMonthLd =
        toInt(warehouse.money, 0) +
        estimatedNetTrade +
        taxes +
        toInt(productionTotals.money, 0) -
        productionMaintenanceLd -
        productionBuildLd -
        armyTrainingLd -
        armyBuildingLd -
        commanderPay -
        brigadePay -
        navyMaintenance -
        navyBuildRepairLd;

      return [
        { label: "Starting Revenue", value: toInt(warehouse.money, 0) },
        { label: "Production Maint.", value: productionMaintenanceLd },
        { label: "Production Build", value: productionBuildLd },
        { label: "Army Maint", value: brigadePay },
        { label: "Army Training", value: armyTrainingLd },
        { label: "Army Building", value: armyBuildingLd },
        { label: "Commander Pay", value: commanderPay },
        { label: "Navy Maint", value: navyMaintenance },
        { label: "Navy Build & Repair", value: navyBuildRepairLd },
        { label: "Direct Selling", value: directSelling },
        { label: "Direct Buying", value: directBuying },
        { label: "Taxes", value: taxes },
        { label: "Projected Next Month LD", value: projectedNextMonthLd, highlight: true },
      ];
    }

    function estimateTradeSummaryForSphere(tabKey) {
      var fromTurnSheet = estimateTradeSummaryFromTurnSheet(tabKey);
      if (fromTurnSheet !== null) {
        return fromTurnSheet;
      }

      return estimateTradeSummaryHeuristic(tabKey);
    }

    function estimateTradeSummaryFromTurnSheet(tabKey) {
      var bounds = sphereByTab[tabKey];
      if (!bounds) {
        return null;
      }

      var turnSheet = ($scope.masterData && $scope.masterData.turnSheet) || {};
      var ts17Rows = turnSheet.tsTradeAndLoading1 || turnSheet.TSTradeAndLoading1 || [];
      var ts19Rows = turnSheet.tsTradeAndLoading2 || turnSheet.TSTradeAndLoading2 || [];
      var allRows = (ts17Rows || []).concat(ts19Rows || []);
      if (!allRows.length) {
        return null;
      }

      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      var tradingCities = turnReport.tradingPortsAndCities || turnReport.TradingPortsAndCities || [];
      var cityLookup = {};
      (tradingCities || []).forEach(function (city) {
        var itemNo = toInt(city.itemNo != null ? city.itemNo : city.ItemNo, 0);
        if (itemNo > 0) {
          cityLookup[itemNo] = city;
        }
      });

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

    function estimateTradeSummaryHeuristic(tabKey) {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      var tradingCities = turnReport.tradingPortsAndCities || turnReport.TradingPortsAndCities || [];
      var bounds = sphereByTab[tabKey];
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

    function buildBalanceRows(warehouse, productionRows) {
      var productionTotals = sumResourceRows(productionRows);
      var productionCitizens = sumProductionCitizens(productionRows);
      var balance = createEmptyResourceBag();
      var projected = createEmptyResourceBag();
      resourceKeys.forEach(function (key) {
        var stock = toInt(warehouse[key], 0);
        var produced = toInt(productionTotals[key], 0);
        if (key === "citizens") {
          // Citizens in production mode represent maintain+build citizens from the middle table.
          balance[key] = productionCitizens;
          projected[key] = stock - productionCitizens;
          return;
        }
        // Balance row reflects the total of the middle production grid per resource column.
        balance[key] = produced;
        // Projected row reflects current warehouse stock minus production totals.
        projected[key] = stock - produced;
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
        $scope.economyProductionRows = buildProductionModel(tabKey, buildRows);
        $scope.economyProductionSummaryRows = buildProductionSummaryRows(tabKey, $scope.economyProductionRows);
        $scope.economyFinanceRows = buildFinanceSummary(tabKey, $scope.economyWarehouse, $scope.economyProductionRows);
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
    $scope.europeEconomyViewMode = "buildMaintain";
    $scope.economyWarehouse = normalizeWarehouseForDisplay({}, "europe");
    $scope.economyProductionRows = [];
    $scope.economyProductionSummaryRows = createProductionSummaryRows();
    $scope.economyFinanceRows = [];
    $scope.economyTotals = { balance: createEmptyResourceBag(), projected: createEmptyResourceBag() };
    $scope.isEconomyLoading = false;
    $scope.economyLoadError = null;
    $scope.productionSiteRules = [];
    $scope.refStates = [];
    $scope.economyArmyList = [];
    $scope.economyArmyListState = "";

    $scope.selectEconomyTab = function (tabKey) {
      var nextTab = economyTabs[tabKey] ? tabKey : "europe";
      $scope.activeEconomyTab = nextTab;
      if (nextTab !== "europe") {
        return;
      }
      refreshEconomyViewForTab("europe");
    };

    $scope.setEuropeEconomyViewMode = function (modeKey) {
      if (modeKey !== "buildMaintain" && modeKey !== "production") {
        return;
      }
      $scope.europeEconomyViewMode = modeKey;
    };

    $scope.formatNumber = function (value) {
      return toInt(value, 0).toLocaleString();
    };

    $scope.getProductionCitizensForRow = function (row) {
      return toInt(row && row.maintenanceWorkers, 0) + toInt(row && row.buildCitizens, 0);
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
          return $q.all([ensureProductionSiteRules(), ensureRefStates(), ensureEconomyArmyList()]);
        })
        .then(function () {
          return refreshEconomyViewForTab("europe");
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
