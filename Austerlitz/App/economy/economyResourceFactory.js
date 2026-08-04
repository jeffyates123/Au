"use strict";

austerlitzModule.factory(
  "economyResourceFactory",
  function (economyConfigFactory, economyParseUtilsFactory) {
    var resourceKeys = economyConfigFactory.resourceKeys;
    var toInt = economyParseUtilsFactory.toInt;

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

    return {
      createEmptyResourceBag: createEmptyResourceBag,
      createProductionRow: createProductionRow,
      createProductionSummaryRow: createProductionSummaryRow,
      createProductionSummaryRows: createProductionSummaryRows,
      mapTradeResourceKey: mapTradeResourceKey,
      sumResourceRows: sumResourceRows,
      sumProductionCitizens: sumProductionCitizens,
    };
  },
);
