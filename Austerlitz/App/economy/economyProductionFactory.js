"use strict";

austerlitzModule.factory(
  "economyProductionFactory",
  function (economyConfigFactory, economyParseUtilsFactory, economyResourceFactory, economySphereFactory) {
    var productionRowConfig = economyConfigFactory.productionRowConfig;
    var mintGoldPerSiteCap = economyConfigFactory.mintGoldPerSiteCap;
    var toInt = economyParseUtilsFactory.toInt;
    var toFloat = economyParseUtilsFactory.toFloat;
    var toText = economyParseUtilsFactory.toText;
    var normalizeStrictUpperStateCode = economyParseUtilsFactory.normalizeStrictUpperStateCode;
    var createProductionRow = economyResourceFactory.createProductionRow;
    var inBounds = economySphereFactory.inBounds;

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

    function mapEconomySiteTypeNo(rawSiteTypeNo) {
      // Fortification variants share the same upkeep bucket as barracks in economy totals.
      if (rawSiteTypeNo === 15 || rawSiteTypeNo === 21) {
        return 2;
      }
      return rawSiteTypeNo;
    }

    function getProductionRowForRule(rows, rule, coord) {
      var siteTypeNo = mapEconomySiteTypeNo(
        toInt(rule.siteTypeNo != null ? rule.siteTypeNo : rule.SiteTypeNo, 0),
      );
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

    function getMaintenanceCitizens(rule) {
      var citizensPerSite = toInt(
        rule.citizensRequired != null ? rule.citizensRequired : rule.CitizensRequired,
        0,
      );
      var attritionPercent = toFloat(
        rule.citizenAttritionPercent != null ? rule.citizenAttritionPercent : rule.CitizenAttritionPercent,
        100,
      );
      return Math.round(citizensPerSite * (attritionPercent / 100));
    }

    function applyProductionRuleToRow(row, rule, coord) {
      if (!row || !rule) {
        return;
      }

      row.workCount += 1;
      row.maintenanceLd += toInt(rule.maintenance != null ? rule.maintenance : rule.Maintenance, 0);
      row.maintenanceWorkers += getMaintenanceCitizens(rule);

      var resourceKey = mapProductionTypeToResourceKey(rule.productionType != null ? rule.productionType : rule.ProductionType);
      if (!resourceKey || !Object.prototype.hasOwnProperty.call(row.resources, resourceKey)) {
        return;
      }

      var minProduction = toInt(rule.minProduction != null ? rule.minProduction : rule.MinProduction, 0);
      var maxProduction = toInt(rule.maxProduction != null ? rule.maxProduction : rule.MaxProduction, 0);
      var siteProduction = 0;
      if (minProduction > 0 && maxProduction > 0) {
        siteProduction = Math.round((minProduction + maxProduction) / 2);
      } else {
        siteProduction = Math.max(minProduction, maxProduction);
      }

      // Factories EcPts should always be shown as a positive contribution.
      if (row.key === "factories" && resourceKey === "ecPts") {
        siteProduction = Math.abs(siteProduction);
      }
      row.resources[resourceKey] += siteProduction;
    }

    function normalizeBuildRows(rows) {
      return (rows || []).filter(function (row) {
        var siteTypeNo = toInt(row && (row.prodSiteType != null ? row.prodSiteType : row.ProdSiteType), 0);
        var x = toInt(row && (row.x != null ? row.x : row.X), 0);
        var y = toInt(row && (row.y != null ? row.y : row.Y), 0);
        return siteTypeNo > 0 && x > 0 && y > 0;
      });
    }

    function applyFactoryInputConsumption(productionRows, warehouse) {
      var factoriesRow = null;
      var producedInputs = { wood: 0, ore: 0, zinc: 0, textiles: 0 };
      (productionRows || []).forEach(function (row) {
        if (row && row.key === "factories") {
          factoriesRow = row;
          return;
        }
        if (!row || !row.resources) {
          return;
        }
        // Factory can use same-turn resource outputs from other production rows.
        producedInputs.wood += Math.max(0, toInt(row.resources.wood, 0));
        producedInputs.ore += Math.max(0, toInt(row.resources.ore, 0));
        producedInputs.zinc += Math.max(0, toInt(row.resources.zinc, 0));
        producedInputs.textiles += Math.max(0, toInt(row.resources.textiles, 0));
      });
      if (!factoriesRow) {
        return;
      }

      // Factory rule: every 100 EcPts consumes 1 ore, 1 zinc, 5 textiles, 20 wood.
      var plannedEcPts = Math.max(0, toInt(factoriesRow.resources && factoriesRow.resources.ecPts, 0));
      var plannedBlocks = Math.floor(plannedEcPts / 100);
      var availableOre = Math.max(0, toInt(warehouse && warehouse.ore, 0) + producedInputs.ore);
      var availableZinc = Math.max(0, toInt(warehouse && warehouse.zinc, 0) + producedInputs.zinc);
      var availableTextiles = Math.max(0, toInt(warehouse && warehouse.textiles, 0) + producedInputs.textiles);
      var availableWood = Math.max(0, toInt(warehouse && warehouse.wood, 0) + producedInputs.wood);
      var maxBlocksByInputs = Math.min(
        Math.floor(availableOre / 1),
        Math.floor(availableZinc / 1),
        Math.floor(availableTextiles / 5),
        Math.floor(availableWood / 20),
      );
      var actualBlocks = Math.max(0, Math.min(plannedBlocks, maxBlocksByInputs));

      factoriesRow.resources.ecPts = actualBlocks * 100;
      factoriesRow.resources.ore = -(actualBlocks * 1);
      factoriesRow.resources.zinc = -(actualBlocks * 1);
      factoriesRow.resources.textiles = -(actualBlocks * 5);
      factoriesRow.resources.wood = -(actualBlocks * 20);
    }

    function applyMintGoldConstraint(productionRows, warehouse) {
      var mintsRow = null;
      var producedGold = 0;
      (productionRows || []).forEach(function (row) {
        if (!row || !row.resources) {
          return;
        }
        if (row.key === "mints") {
          mintsRow = row;
          return;
        }
        producedGold += Math.max(0, toInt(row.resources.gold, 0));
      });
      if (!mintsRow) {
        return;
      }
      var plannedLd = Math.max(0, toInt(mintsRow.resources.money, 0));
      if (plannedLd <= 0) {
        mintsRow.resources.money = 0;
        mintsRow.resources.gold = 0;
        return;
      }

      var warehouseGold = Math.max(0, toInt(warehouse && warehouse.gold, 0));
      var availableGold = Math.max(0, warehouseGold + producedGold);
      var mintSiteCount = Math.max(0, toInt(mintsRow.workCount, 0));
      if (mintSiteCount <= 0 || availableGold <= 0) {
        mintsRow.resources.money = 0;
        mintsRow.resources.gold = 0;
        return;
      }

      var maxGoldNeeded = mintSiteCount * mintGoldPerSiteCap;
      var ldPerMintSite = plannedLd / mintSiteCount;
      var fullMintLd = plannedLd;
      // Spreadsheet formula mirror:
      // =IF((G18*F18)+W3>G9*20,G9*F9,(W3+W18)*F9/20)
      // Mapping:
      // - (G18*F18)+W3 -> producedGold + warehouseGold
      // - G9*20        -> mintSiteCount * 20
      // - G9*F9        -> fullMintLd (mint work * average produce per mint site)
      // - (W3+W18)*F9/20 -> availableGold * ldPerMintSite / 20
      var actualLd =
        availableGold > maxGoldNeeded
          ? fullMintLd
          : Math.round((availableGold * ldPerMintSite) / mintGoldPerSiteCap);
      var actualGoldUsed = Math.max(0, Math.min(availableGold, maxGoldNeeded));
      mintsRow.resources.money = actualLd;
      mintsRow.resources.gold = -Math.round(actualGoldUsed);
    }

    function buildProductionModel(input) {
      var tabKey = input.tabKey;
      var bounds = input.sphereByTab[tabKey];
      var selectedState = input.selectedState;
      var mapRows = input.mapRows || [];
      var productionSiteRules = input.productionSiteRules || [];
      var buildRows = input.buildRows || [];
      var rows = createProductionRows();
      var rulesBySymbol = buildProductionSiteLookup(productionSiteRules);
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

          var state = normalizeStrictUpperStateCode(coord.state != null ? coord.state : coord.State);
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
        var siteTypeRules = (productionSiteRules || []).filter(function (siteRule) {
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

      applyFactoryInputConsumption(rows, input.warehouse);
      applyMintGoldConstraint(rows, input.warehouse);
      return rows;
    }

    return {
      buildProductionModel: buildProductionModel,
      createProductionRows: createProductionRows,
      mapProductionTypeToResourceKey: mapProductionTypeToResourceKey,
      normalizeBuildRows: normalizeBuildRows,
    };
  },
);
