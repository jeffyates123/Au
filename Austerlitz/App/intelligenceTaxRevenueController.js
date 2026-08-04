"use strict";

austerlitzModule.controller(
  "intelligenceTaxRevenueController",
  function (
    $scope,
    $q,
    masterData,
    turnDataLoaderService,
    rulesCatalogFactory,
    economyConfigFactory,
    economyParseUtilsFactory,
    economySphereFactory,
  ) {
    var sphereByTab = economyConfigFactory.sphereByTab;
    var populationCitizensByDensity = economyConfigFactory.populationCitizensByDensity;

    var toInt = economyParseUtilsFactory.toInt;
    var toText = economyParseUtilsFactory.toText;
    var normalizeStateCode = economyParseUtilsFactory.normalizeStateCode;
    var inBounds = economySphereFactory.inBounds;

    var foreignEuropeTaxRate = 4;
    var overseasTaxRate = 3;

    var rowConfig = [
      { key: "homeEurope", label: "Europe (home territory)" },
      { key: "foreignEurope", label: "Europe (other owned territory)" },
      { key: "caribbean", label: "Caribbean" },
      { key: "india", label: "India" },
    ];
    var productionSphereConfig = [
      { key: "europe", label: "European" },
      { key: "caribbean", label: "Caribbean" },
      { key: "india", label: "Indian" },
    ];
    var workingProductionRowConfig = [
      { key: "factories", label: "Factory" },
      { key: "weaving", label: "Weaving Mill" },
      { key: "primeEstates", label: "Prime Estate" },
      { key: "estates", label: "Estate" },
      { key: "sheep", label: "Sheep Farm" },
      { key: "horse", label: "Horse Farm" },
      { key: "lumber", label: "Lumber Camp" },
      { key: "quarries", label: "Quarry" },
      { key: "goldMine", label: "Gold Mine" },
      { key: "oreMine", label: "Ore Mine" },
      { key: "zincMine", label: "Zinc Mine" },
      { key: "vineyards", label: "Vineyard" },
      { key: "barracks", label: "Barracks" },
    ];

    $scope.masterData = masterData;
    $scope.taxRevenueCountries = [];
    $scope.taxRevenueRows = [];
    $scope.taxRevenueBaseRows = [];
    $scope.selectedProductionSphere = "total";
    $scope.productionMatrices = {};
    $scope.selectedProductionMatrix = null;
    $scope.isTaxRevenueLoading = false;
    $scope.taxRevenueLoadError = null;

    function getCitizensForCoordinate(coord) {
      var density = toInt(coord && (coord.population != null ? coord.population : coord.Population), 0);
      if (density > 0 && populationCitizensByDensity[density]) {
        return populationCitizensByDensity[density];
      }

      var terrain = toText(coord && (coord.terrain != null ? coord.terrain : coord.Terrain), "").toUpperCase();
      return terrain === "D" ? 250 : 500;
    }

    function flattenMapCoordinates(rawMapCoordinates) {
      var output = [];
      (rawMapCoordinates || []).forEach(function (rowOrCoord) {
        if (angular.isArray(rowOrCoord)) {
          (rowOrCoord || []).forEach(function (coord) {
            output.push(coord);
          });
          return;
        }
        output.push(rowOrCoord);
      });
      return output;
    }

    function createStateEntry(refState) {
      var stateCode = normalizeStateCode(refState && (refState.state != null ? refState.state : refState.State));
      if (!stateCode) {
        return null;
      }

      return {
        state: stateCode,
        stateName: toText(refState && (refState.stateName != null ? refState.stateName : refState.StateName), stateCode),
        taxRate: toInt(refState && (refState.taxRate != null ? refState.taxRate : refState.TaxRate), 0),
      };
    }

    function buildCountryRows(refStates) {
      var rows = (refStates || [])
        .map(createStateEntry)
        .filter(function (entry) {
          return !!entry;
        });

      rows.sort(function (left, right) {
        if (left.stateName !== right.stateName) {
          return left.stateName.localeCompare(right.stateName);
        }
        return left.state.localeCompare(right.state);
      });
      return rows;
    }

    function createEmptyTotalsByCountry(countries) {
      var totals = {};
      (countries || []).forEach(function (country) {
        totals[country.state] = 0;
      });
      return totals;
    }

    function getCoordinateProductionSiteSymbol(coord) {
      return toText(
        coord && (coord.productionSite != null ? coord.productionSite : coord.ProductionSite),
        "",
      ).toUpperCase();
    }

    function buildProductionRulesBySymbol(productionSiteRules) {
      var rulesBySymbol = {};
      (productionSiteRules || []).forEach(function (rule) {
        ["symbol", "secondarySymbol"].forEach(function (fieldName) {
          var pascalName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
          var symbol = toText(rule && (rule[fieldName] != null ? rule[fieldName] : rule[pascalName]), "").toUpperCase();
          if (!symbol) {
            return;
          }
          rulesBySymbol[symbol] = rulesBySymbol[symbol] || [];
          rulesBySymbol[symbol].push(rule);
        });
      });
      return rulesBySymbol;
    }

    function selectProductionRule(rules, coord) {
      if (!rules || !rules.length) {
        return null;
      }
      if (rules.length === 1) {
        return rules[0];
      }

      var bonus = toText(coord && (coord.bonus != null ? coord.bonus : coord.Bonus), "");
      var terrain = toText(coord && (coord.terrain != null ? coord.terrain : coord.Terrain), "");
      var i;
      for (i = 0; i < rules.length; i++) {
        var bonusSymbol = toText(rules[i].bonusSymbol != null ? rules[i].bonusSymbol : rules[i].BonusSymbol, "");
        if (bonus && bonusSymbol && bonusSymbol.toUpperCase() === bonus.toUpperCase()) {
          return rules[i];
        }
      }
      for (i = 0; i < rules.length; i++) {
        var terrains = toText(rules[i].terrain != null ? rules[i].terrain : rules[i].Terrain, "");
        if (terrain && terrains && terrains.indexOf(terrain) >= 0) {
          return rules[i];
        }
      }
      return rules[0];
    }

    function getProductionRowKey(rule, coord) {
      var siteTypeNo = toInt(rule && (rule.siteTypeNo != null ? rule.siteTypeNo : rule.SiteTypeNo), 0);
      var productionType = toText(
        rule && (rule.productionType != null ? rule.productionType : rule.ProductionType),
        "",
      ).toLowerCase();
      if (siteTypeNo === 2) return "barracks";
      if (siteTypeNo === 4) return "factories";
      if (siteTypeNo === 5) return "weaving";
      if (siteTypeNo === 7) {
        var bonusSymbol = toText(rule.bonusSymbol != null ? rule.bonusSymbol : rule.BonusSymbol, "");
        var bonusPercentage = toInt(rule.bonusPercentage != null ? rule.bonusPercentage : rule.BonusPercentage, 0);
        var coordBonus = toText(coord && (coord.bonus != null ? coord.bonus : coord.Bonus), "");
        return bonusSymbol && bonusPercentage > 0 && coordBonus.toUpperCase() === bonusSymbol.toUpperCase()
          ? "primeEstates"
          : "estates";
      }
      if (siteTypeNo === 8) return "sheep";
      if (siteTypeNo === 9) return "horse";
      if (siteTypeNo === 10) return "lumber";
      if (siteTypeNo === 11) return "quarries";
      if (siteTypeNo === 12 && productionType === "gold") return "goldMine";
      if (siteTypeNo === 12 && productionType === "ore") return "oreMine";
      if (siteTypeNo === 12 && productionType === "zinc") return "zincMine";
      if (siteTypeNo === 13) return "vineyards";
      return "";
    }

    function createProductionRows(countries, includeBarracks) {
      return workingProductionRowConfig
        .filter(function (row) {
          return includeBarracks || row.key !== "barracks";
        })
        .map(function (row) {
          return {
            key: row.key,
            label: row.label,
            valuesByState: createEmptyTotalsByCountry(countries),
          };
        });
    }

    function createProductionMatrix(countries, sphereKey) {
      return {
        sphereKey: sphereKey,
        sphereLabel: sphereKey === "total"
          ? "All Spheres"
          : productionSphereConfig.filter(function (sphere) { return sphere.key === sphereKey; })[0].label,
        workingRows: createProductionRows(countries, true),
        underpopulatedRows: createProductionRows(countries, false),
      };
    }

    function addProductionSummaryRows(rows, countries) {
      var totals = createEmptyTotalsByCountry(countries);
      var costs = createEmptyTotalsByCountry(countries);
      (rows || []).forEach(function (row) {
        (countries || []).forEach(function (country) {
          totals[country.state] += toInt(row.valuesByState[country.state], 0);
          costs[country.state] += toInt(row.costsByState && row.costsByState[country.state], 0);
        });
      });
      rows.push({ key: "total", label: "TOTAL", valuesByState: totals, totalLine: true });
      return costs;
    }

    function buildProductionMatrices(countries, coordinates, productionSiteRules) {
      var matrices = { total: createProductionMatrix(countries, "total") };
      var rowByMatrixAndStatus = {};
      productionSphereConfig.forEach(function (sphere) {
        matrices[sphere.key] = createProductionMatrix(countries, sphere.key);
      });

      Object.keys(matrices).forEach(function (matrixKey) {
        rowByMatrixAndStatus[matrixKey] = { working: {}, underpopulated: {} };
        ["workingRows", "underpopulatedRows"].forEach(function (propertyName) {
          var statusKey = propertyName === "workingRows" ? "working" : "underpopulated";
          matrices[matrixKey][propertyName].forEach(function (row) {
            row.costsByState = createEmptyTotalsByCountry(countries);
            rowByMatrixAndStatus[matrixKey][statusKey][row.key] = row;
          });
        });
      });

      var countryLookup = {};
      (countries || []).forEach(function (country) {
        countryLookup[country.state] = true;
      });
      var rulesBySymbol = buildProductionRulesBySymbol(productionSiteRules);

      (coordinates || []).forEach(function (coord) {
        if (!coord) {
          return;
        }
        var x = toInt(coord.x != null ? coord.x : coord.X, 0);
        var y = toInt(coord.y != null ? coord.y : coord.Y, 0);
        var sphereKey = productionSphereConfig
          .filter(function (sphere) {
            return inBounds(x, y, sphereByTab[sphere.key]);
          })
          .map(function (sphere) {
            return sphere.key;
          })[0];
        if (!sphereKey) {
          return;
        }

        var state = normalizeStateCode(coord.state != null ? coord.state : coord.State);
        if (!countryLookup[state]) {
          return;
        }

        var symbol = getCoordinateProductionSiteSymbol(coord);
        if (!symbol || symbol === "." || symbol === " ") {
          return;
        }

        var rule = selectProductionRule(rulesBySymbol[symbol] || [], coord);
        var rowKey = getProductionRowKey(rule, coord);
        if (!rowKey) {
          return;
        }

        var population = toInt(coord.population != null ? coord.population : coord.Population, 0);
        var minPopulation = toInt(rule.minPopulation != null ? rule.minPopulation : rule.MinPopulation, 0);
        var maxPopulation = toInt(rule.maxPopulation != null ? rule.maxPopulation : rule.MaxPopulation, 0);
        var statusKey = population < minPopulation ? "underpopulated" : "working";
        if (statusKey === "working" && maxPopulation > 0 && population > maxPopulation) {
          return;
        }

        var maintenance = toInt(rule.maintenance != null ? rule.maintenance : rule.Maintenance, 0);
        [sphereKey, "total"].forEach(function (matrixKey) {
          var row = rowByMatrixAndStatus[matrixKey][statusKey][rowKey];
          if (!row) {
            return;
          }
          row.valuesByState[state] += 1;
          if (statusKey === "working") {
            row.costsByState[state] += maintenance;
          }
        });
      });

      Object.keys(matrices).forEach(function (matrixKey) {
        matrices[matrixKey].productionCostsByState = addProductionSummaryRows(
          matrices[matrixKey].workingRows,
          countries,
        );
        addProductionSummaryRows(matrices[matrixKey].underpopulatedRows, countries);
      });
      $scope.productionMatrices = matrices;
      $scope.selectedProductionMatrix = matrices[$scope.selectedProductionSphere] || matrices.total;
      refreshTaxRevenueRows();
    }

    function calculateTaxRevenue(countries, coordinates) {
      var countryLookup = {};
      (countries || []).forEach(function (country) {
        countryLookup[country.state] = country;
      });

      var totals = {
        homeEurope: createEmptyTotalsByCountry(countries),
        foreignEurope: createEmptyTotalsByCountry(countries),
        caribbean: createEmptyTotalsByCountry(countries),
        india: createEmptyTotalsByCountry(countries),
      };

      (coordinates || []).forEach(function (coord) {
        if (!coord) {
          return;
        }

        var x = toInt(coord.x != null ? coord.x : coord.X, 0);
        var y = toInt(coord.y != null ? coord.y : coord.Y, 0);
        var citizens = getCitizensForCoordinate(coord);
        if (citizens <= 0) {
          return;
        }

        if (inBounds(x, y, sphereByTab.europe)) {
          var ownerState = normalizeStateCode(coord.owner != null ? coord.owner : coord.Owner);
          var ownerCountry = countryLookup[ownerState];
          if (!ownerCountry) {
            return;
          }

          var regionState = normalizeStateCode(coord.state != null ? coord.state : coord.State);
          if (regionState === ownerState) {
            totals.homeEurope[ownerState] += citizens * ownerCountry.taxRate;
          } else {
            totals.foreignEurope[ownerState] += citizens * foreignEuropeTaxRate;
          }
          return;
        }

        if (inBounds(x, y, sphereByTab.caribbean)) {
          var caribbeanState = normalizeStateCode(coord.state != null ? coord.state : coord.State);
          if (countryLookup[caribbeanState]) {
            totals.caribbean[caribbeanState] += citizens * overseasTaxRate;
          }
          return;
        }

        if (inBounds(x, y, sphereByTab.india)) {
          var indiaState = normalizeStateCode(coord.state != null ? coord.state : coord.State);
          if (countryLookup[indiaState]) {
            totals.india[indiaState] += citizens * overseasTaxRate;
          }
        }
      });

      $scope.taxRevenueBaseRows = rowConfig.map(function (row) {
        return {
          key: row.key,
          label: row.label,
          valuesByState: totals[row.key] || {},
        };
      });
      refreshTaxRevenueRows();
    }

    function getTaxRevenueRowsForSphere(sphereKey) {
      var rowKeysBySphere = {
        total: ["homeEurope", "foreignEurope", "caribbean", "india"],
        europe: ["homeEurope", "foreignEurope"],
        caribbean: ["caribbean"],
        india: ["india"],
      };
      var allowedKeys = rowKeysBySphere[sphereKey] || rowKeysBySphere.total;
      return ($scope.taxRevenueBaseRows || []).filter(function (row) {
        return allowedKeys.indexOf(row.key) >= 0;
      });
    }

    function refreshTaxRevenueRows() {
      var countries = $scope.taxRevenueCountries || [];
      var rows = getTaxRevenueRowsForSphere($scope.selectedProductionSphere);
      var taxesByState = createEmptyTotalsByCountry(countries);
      var productionMatrix = $scope.productionMatrices[$scope.selectedProductionSphere];
      var productionCostsByState = productionMatrix
        ? productionMatrix.productionCostsByState || createEmptyTotalsByCountry(countries)
        : createEmptyTotalsByCountry(countries);
      var totalByState = createEmptyTotalsByCountry(countries);

      rows.forEach(function (row) {
        countries.forEach(function (country) {
          taxesByState[country.state] += toInt(row.valuesByState[country.state], 0);
        });
      });
      countries.forEach(function (country) {
        totalByState[country.state] =
          taxesByState[country.state] - toInt(productionCostsByState[country.state], 0);
      });

      if ($scope.selectedProductionSphere === "total") {
        rows.push({
          key: "taxTotal",
          label: "Tax Total",
          valuesByState: taxesByState,
          totalLine: true,
        });
      }
      rows.push(
        { key: "productionCosts", label: "Production Costs", valuesByState: productionCostsByState, costLine: true },
        { key: "netTotal", label: "Total", valuesByState: totalByState, totalLine: true },
      );
      $scope.taxRevenueRows = rows;
    }

    function ensureTurnReportLoaded() {
      var hasMapCoordinates =
        $scope.masterData &&
        $scope.masterData.turnReport &&
        (
          ($scope.masterData.turnReport.mapCoordinates && $scope.masterData.turnReport.mapCoordinates.length) ||
          ($scope.masterData.turnReport.MapCoordinates && $scope.masterData.turnReport.MapCoordinates.length)
        );

      return hasMapCoordinates
        ? $q.when($scope.masterData.turnReport)
        : turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId);
    }

    function ensureRefStatesLoaded() {
      return rulesCatalogFactory.getRefStates().then(
        function (rows) {
          return rows || [];
        },
        function () {
          return [];
        },
      );
    }

    $scope.getTaxRevenueValue = function (row, country) {
      if (!row || !country) {
        return 0;
      }
      return toInt(row.valuesByState && row.valuesByState[country.state], 0);
    };

    $scope.hasProductionSiteCount = function (row) {
      if (row && row.totalLine) {
        return true;
      }
      return ($scope.taxRevenueCountries || []).some(function (country) {
        return $scope.getTaxRevenueValue(row, country) > 0;
      });
    };

    $scope.formatTaxRevenueValue = function (value) {
      return toInt(value, 0).toLocaleString();
    };

    $scope.selectProductionSphere = function (sphereKey) {
      $scope.selectedProductionSphere = $scope.productionMatrices[sphereKey]
        ? sphereKey
        : "total";
      $scope.selectedProductionMatrix =
        $scope.productionMatrices[$scope.selectedProductionSphere] || null;
      refreshTaxRevenueRows();
    };

    $scope.getSelectedProductionMatrix = function () {
      return $scope.selectedProductionMatrix;
    };

    $scope.initTaxRevenue = function () {
      if (
        !$scope.masterData ||
        !$scope.masterData.turnId ||
        $scope.masterData.turnId === "Unknown"
      ) {
        $scope.taxRevenueCountries = [];
        $scope.taxRevenueRows = [];
        $scope.taxRevenueBaseRows = [];
        $scope.productionMatrices = {};
        $scope.selectedProductionMatrix = null;
        $scope.taxRevenueLoadError = "Select a turn to view tax revenue details.";
        return;
      }

      $scope.isTaxRevenueLoading = true;
      $scope.taxRevenueLoadError = null;

      $q
        .all([
          ensureTurnReportLoaded(),
          ensureRefStatesLoaded(),
          rulesCatalogFactory.getRefProductionSites(),
        ])
        .then(function (results) {
          var turnReport = results[0] || {};
          var refStates = results[1] || [];
          var productionSiteRules = results[2] || [];
          var countries = buildCountryRows(refStates);
          var coordinates = flattenMapCoordinates(
            turnReport.mapCoordinates || turnReport.MapCoordinates || [],
          );

          $scope.taxRevenueCountries = countries;
          calculateTaxRevenue(countries, coordinates);
          buildProductionMatrices(countries, coordinates, productionSiteRules);
        })
        .catch(function (error) {
          $scope.taxRevenueCountries = [];
          $scope.taxRevenueRows = [];
          $scope.taxRevenueBaseRows = [];
          $scope.productionMatrices = {};
          $scope.selectedProductionMatrix = null;
          $scope.taxRevenueLoadError =
            (error && error.data) || "Unable to load tax revenue intelligence data.";
        })
        .finally(function () {
          $scope.isTaxRevenueLoading = false;
        });
    };
  },
);
