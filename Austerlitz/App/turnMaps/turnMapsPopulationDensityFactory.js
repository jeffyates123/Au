'use strict';

austerlitzModule.factory('turnMapsPopulationDensityFactory', function (turnMapsPopulationDensityRulesFactory) {

    return {
        attach: function ($scope) {
            $scope.selectedPopulationDensityRow = null;

            $scope.normalizeIncreasePopulationDensityRows = function (rows) {
                return rows || [];
            };

            $scope.isPopulationDensityMode = function () {
                return !!($scope.selectedDisplayOption && $scope.selectedDisplayOption.name === 'Inc. Pop. Density');
            };

            $scope.getSelectedNationCode = function () {
                var fromSelection = turnMapsPopulationDensityRulesFactory.normalizeStateCode(
                    $scope.selectedState && ($scope.selectedState.state || $scope.selectedState.State)
                );
                if (fromSelection) return fromSelection;

                return turnMapsPopulationDensityRulesFactory.normalizeStateCode($scope.masterData && $scope.masterData.selectedState);
            };

            $scope.getTerrainMaxDensity = function (coord) {
                if (!coord) return 0;
                return turnMapsPopulationDensityRulesFactory.getTerrainMaxDensity(coord.terrain || coord.Terrain);
            };

            $scope.getCoordinateDensity = function (coord) {
                if (!coord) return 0;
                var rawDensity = coord.population != null ? coord.population : coord.Population;
                return turnMapsPopulationDensityRulesFactory.toInt(rawDensity, 0);
            };

            $scope.isCoordinateOwnedBySelectedNation = function (coord) {
                if (!coord) return false;
                var selectedNation = $scope.getSelectedNationCode();
                if (!selectedNation) return false;

                return turnMapsPopulationDensityRulesFactory.normalizeStateCode(coord.state || coord.State) === selectedNation;
            };

            $scope.getPopulationDensityRowAtCoordinate = function (x, y) {
                if (!$scope.tsIncreasePopulationDensityList) return null;

                var targetX = turnMapsPopulationDensityRulesFactory.toInt(x, -1);
                var targetY = turnMapsPopulationDensityRulesFactory.toInt(y, -1);
                if (targetX <= 0 || targetY <= 0) return null;

                for (var i = 0; i < $scope.tsIncreasePopulationDensityList.length; i++) {
                    var row = $scope.tsIncreasePopulationDensityList[i];
                    if (turnMapsPopulationDensityRulesFactory.toInt(row && row.x, -1) === targetX
                        && turnMapsPopulationDensityRulesFactory.toInt(row && row.y, -1) === targetY) {
                        return row;
                    }
                }

                return null;
            };

            $scope.hasPopulationDensityOrderAtCoordinate = function (x, y) {
                return !!$scope.getPopulationDensityRowAtCoordinate(x, y);
            };

            $scope.getPopulationDensityEligibility = function (coord) {
                if (!coord) {
                    return { canRaise: false, isOwned: false, isSea: false, isAtMax: false, isAtProdSiteMax: false, isAlreadyOrdered: false };
                }

                var isSea = turnMapsPopulationDensityRulesFactory.isSeaTerrain(coord.terrain || coord.Terrain);
                var isOwned = $scope.isCoordinateOwnedBySelectedNation(coord);
                var isAlreadyOrdered = $scope.hasPopulationDensityOrderAtCoordinate(coord.x, coord.y);
                var currentDensity = $scope.getCoordinateDensity(coord);
                var maxDensity = $scope.getTerrainMaxDensity(coord);
                var isAtMax = currentDensity >= maxDensity;
                var isAtProdSiteMax = false;

                if (typeof $scope.getProductionSiteInfoByCoordinateSymbol === 'function') {
                    var symbol = (coord.productionSite || coord.ProductionSite || '').toString().trim();
                    if (symbol) {
                        var productionSite = $scope.getProductionSiteInfoByCoordinateSymbol(symbol);
                        if (productionSite) {
                            var prodSiteMax = turnMapsPopulationDensityRulesFactory.toInt(
                                productionSite.maxPopulation != null ? productionSite.maxPopulation : productionSite.MaxPopulation,
                                0
                            );
                            if (prodSiteMax > 0 && currentDensity >= prodSiteMax) {
                                isAtProdSiteMax = true;
                            }
                        }
                    }
                }

                return {
                    // Production-site presence does not block TS_12 population raises.
                    canRaise: isOwned && !isSea && !isAlreadyOrdered && !isAtMax && !isAtProdSiteMax,
                    isOwned: isOwned,
                    isSea: isSea,
                    isAtMax: isAtMax,
                    isAtProdSiteMax: isAtProdSiteMax,
                    isAlreadyOrdered: isAlreadyOrdered
                };
            };

            $scope.getPopulationDensityEligibilityClass = function (coord) {
                var eligibility = $scope.getPopulationDensityEligibility(coord);
                if (eligibility.isSea) return 'popDensity_Sea';
                if (!eligibility.isOwned) return 'popDensity_NotOwned';
                if (eligibility.isAlreadyOrdered) return 'popDensity_Ordered';
                var prodSitePopulationClass = $scope.getPopulationDensityProductionSiteClass(coord);
                if (prodSitePopulationClass) return prodSitePopulationClass;
                if (eligibility.isAtMax) return 'popDensity_Maxed';
                if (eligibility.canRaise) return 'popDensity_Yes';
                return 'popDensity_Ineligible';
            };

            $scope.getPopulationDensityProductionSiteClass = function (coord) {
                if (!coord || typeof $scope.getProductionSiteInfoByCoordinateSymbol !== 'function') return '';

                var symbol = (coord.productionSite || coord.ProductionSite || '').toString().trim();
                if (!symbol) return '';

                var productionSite = $scope.getProductionSiteInfoByCoordinateSymbol(symbol);
                if (!productionSite) return '';

                var minPopulation = turnMapsPopulationDensityRulesFactory.toInt(
                    productionSite.minPopulation != null ? productionSite.minPopulation : productionSite.MinPopulation,
                    0
                );
                var maxPopulation = turnMapsPopulationDensityRulesFactory.toInt(
                    productionSite.maxPopulation != null ? productionSite.maxPopulation : productionSite.MaxPopulation,
                    0
                );
                var currentDensity = $scope.getCoordinateDensity(coord);

                if (currentDensity < minPopulation) return 'popDensity_ProdSiteTooFew';
                if (currentDensity > maxPopulation) return 'popDensity_ProdSiteTooMany';
                return 'popDensity_ProdSiteOk';
            };

            $scope.getPopulationDensityProductionSiteTooltip = function (coord) {
                if (!coord || typeof $scope.getProductionSiteInfoByCoordinateSymbol !== 'function') return '';

                var symbol = (coord.productionSite || coord.ProductionSite || '').toString().trim();
                if (!symbol) return '';

                var productionSite = $scope.getProductionSiteInfoByCoordinateSymbol(symbol);
                if (!productionSite) return '';

                var minPopulation = turnMapsPopulationDensityRulesFactory.toInt(
                    productionSite.minPopulation != null ? productionSite.minPopulation : productionSite.MinPopulation,
                    0
                );
                var maxPopulation = turnMapsPopulationDensityRulesFactory.toInt(
                    productionSite.maxPopulation != null ? productionSite.maxPopulation : productionSite.MaxPopulation,
                    0
                );
                var currentDensity = $scope.getCoordinateDensity(coord);
                var siteName = (productionSite.siteType || productionSite.SiteType || symbol).toString().trim();
                var statusText = 'within range';

                if (currentDensity < minPopulation) statusText = 'below minimum';
                else if (currentDensity > maxPopulation) statusText = 'above maximum';

                return "Prod.Site '" + siteName + "' Pop " + currentDensity
                    + " (min " + minPopulation + ", max " + maxPopulation + ") - " + statusText;
            };

            $scope.getMapPopulationText = function (coord) {
                if (!coord) return '';
                if (!$scope.isPopulationDensityMode()) return coord.population;
                if (!$scope.isCoordinateOwnedBySelectedNation(coord)) return '';

                var densityValue = coord.population != null ? coord.population : coord.Population;
                if (densityValue == null || densityValue === '') return '0';
                return densityValue;
            };

            $scope.selectPopulationDensityRow = function (row) {
                $scope.selectedPopulationDensityRow = row || null;
            };

            $scope.selectPopulationDensityRowAtCoordinate = function (x, y) {
                $scope.selectPopulationDensityRow($scope.getPopulationDensityRowAtCoordinate(x, y));
            };

            $scope.showPopulationDensityRow = function (row) {
                if (!row) {
                    $scope.selectPopulationDensityRow(null);
                    return;
                }

                if (typeof $scope.syncPopulationDensityOrderIndexToRow === 'function') {
                    $scope.syncPopulationDensityOrderIndexToRow(row);
                }

                if (typeof $scope.focusCurrentPopulationDensityOrder === 'function') {
                    $scope.focusCurrentPopulationDensityOrder();
                    return;
                }

                $scope.selectPopulationDensityRow(row);
            };

            $scope.showPopulationDensityRowAtCoordinate = function (x, y) {
                $scope.showPopulationDensityRow($scope.getPopulationDensityRowAtCoordinate(x, y));
            };

            $scope.findFirstEmptyPopulationDensityOrderIndex = function () {
                if (!$scope.tsIncreasePopulationDensityList) return -1;

                for (var i = 0; i < $scope.tsIncreasePopulationDensityList.length; i++) {
                    var row = $scope.tsIncreasePopulationDensityList[i] || {};
                    var hasX = row.x != null && row.x !== '';
                    var hasY = row.y != null && row.y !== '';
                    if (!hasX && !hasY) return i;
                }

                return -1;
            };

            $scope.resolveRaiseMaterial = function (coord, nextDensity, sphere) {
                return turnMapsPopulationDensityRulesFactory.resolveRaiseMaterial($scope.getSelectedNationCode(), nextDensity, sphere);
            };

            $scope.getPopulationDensityOrderCost = function (row) {
                if (!row) {
                    return { isValid: false, citizens: 0, wood: 0, stone: 0, sphere: 'Unknown' };
                }

                var x = turnMapsPopulationDensityRulesFactory.toInt(row.x, 0);
                var y = turnMapsPopulationDensityRulesFactory.toInt(row.y, 0);
                if (x <= 0 || y <= 0) {
                    return { isValid: false, citizens: 0, wood: 0, stone: 0, sphere: 'Unknown' };
                }

                var coord = $scope.getCoordinateByXY(x, y);
                if (!coord) {
                    return { isValid: false, citizens: 0, wood: 0, stone: 0, sphere: 'Unknown' };
                }

                var currentDensity = $scope.getCoordinateDensity(coord);
                var raiseCost = turnMapsPopulationDensityRulesFactory.getRaiseCostByCurrentDensity(currentDensity);
                var sphere = turnMapsPopulationDensityRulesFactory.getSphereFromCoordinates(x, y);

                if (!raiseCost) {
                    return { isValid: false, citizens: 0, wood: 0, stone: 0, sphere: sphere };
                }

                var nextDensity = currentDensity + 1;
                var material = $scope.resolveRaiseMaterial(coord, nextDensity, sphere);
                var goodsAmount = raiseCost.goods;

                return {
                    isValid: true,
                    citizens: raiseCost.citizens,
                    wood: material === 'wood' ? goodsAmount : 0,
                    stone: material === 'stone' ? goodsAmount : 0,
                    sphere: sphere
                };
            };

            $scope.getPopulationDensityWarehouseBySphere = function () {
                var bySphere = {
                    Europe: { citizens: 0, wood: 0, stone: 0 },
                    Caribbean: { citizens: 0, wood: 0, stone: 0 },
                    India: { citizens: 0, wood: 0, stone: 0 }
                };
                var report = ($scope.masterData && $scope.masterData.turnReport) || {};
                var warehouses = report.warehouses || report.Warehouses || [];

                var sphereByItemNo = { 1: 'Europe', 2: 'Caribbean', 3: 'India' };
                angular.forEach(warehouses, function (warehouse) {
                    var itemNo = turnMapsPopulationDensityRulesFactory.toInt(warehouse.itemNo != null ? warehouse.itemNo : warehouse.ItemNo, 0);
                    var sphere = sphereByItemNo[itemNo];
                    if (!sphere) return;

                    bySphere[sphere] = {
                        citizens: turnMapsPopulationDensityRulesFactory.toInt(warehouse.citizens != null ? warehouse.citizens : warehouse.Citizens, 0),
                        wood: turnMapsPopulationDensityRulesFactory.toInt(warehouse.wood != null ? warehouse.wood : warehouse.Wood, 0),
                        stone: turnMapsPopulationDensityRulesFactory.toInt(warehouse.stone != null ? warehouse.stone : warehouse.Stone, 0)
                    };
                });

                return bySphere;
            };

            $scope.getPopulationDensityTotals = function () {
                var totals = {
                    citizens: 0,
                    wood: 0,
                    stone: 0,
                    bySphere: {
                        Europe: { citizens: 0, wood: 0, stone: 0 },
                        Caribbean: { citizens: 0, wood: 0, stone: 0 },
                        India: { citizens: 0, wood: 0, stone: 0 }
                    },
                    warningsBySphere: {}
                };

                angular.forEach($scope.tsIncreasePopulationDensityList || [], function (row) {
                    var cost = $scope.getPopulationDensityOrderCost(row);
                    if (!cost.isValid || !totals.bySphere[cost.sphere]) return;

                    totals.citizens += cost.citizens;
                    totals.wood += cost.wood;
                    totals.stone += cost.stone;

                    totals.bySphere[cost.sphere].citizens += cost.citizens;
                    totals.bySphere[cost.sphere].wood += cost.wood;
                    totals.bySphere[cost.sphere].stone += cost.stone;
                });

                var availableBySphere = $scope.getPopulationDensityWarehouseBySphere();
                angular.forEach(['Europe', 'Caribbean', 'India'], function (sphere) {
                    var needed = totals.bySphere[sphere];
                    var available = availableBySphere[sphere] || { citizens: 0, wood: 0, stone: 0 };

                    var shortfalls = [];
                    var citizensShort = needed.citizens - available.citizens;
                    var woodShort = needed.wood - available.wood;
                    var stoneShort = needed.stone - available.stone;

                    if (citizensShort > 0) shortfalls.push('Citizens ' + citizensShort);
                    if (woodShort > 0) shortfalls.push('Wood ' + woodShort);
                    if (stoneShort > 0) shortfalls.push('Stone ' + stoneShort);

                    if (shortfalls.length > 0) {
                        totals.warningsBySphere[sphere] = sphere + ' shortage: ' + shortfalls.join(', ');
                    }
                });

                return totals;
            };

            $scope.getPopulationDensityWarningText = function (row) {
                if (!row) return '';
                var cost = $scope.getPopulationDensityOrderCost(row);
                if (!cost.isValid) return '';

                var totals = $scope.getPopulationDensityTotals();
                return totals.warningsBySphere[cost.sphere] || '';
            };

            $scope.getPopulationDensityWarningSummaryText = function () {
                var totals = $scope.getPopulationDensityTotals();
                var warnings = [];
                angular.forEach(['Europe', 'Caribbean', 'India'], function (sphere) {
                    if (totals.warningsBySphere[sphere]) warnings.push(totals.warningsBySphere[sphere]);
                });
                return warnings.join(' | ');
            };

            $scope.addPopulationDensityOrderAtCoordinate = function (x, y) {
                if (!$scope.tsIncreasePopulationDensityList) return false;

                var existingRow = $scope.getPopulationDensityRowAtCoordinate(x, y);
                if (existingRow) {
                    $scope.showPopulationDensityRow(existingRow);
                    return true;
                }

                var coord = $scope.getCoordinateByXY(x, y);
                if (!coord) return false;

                var eligibility = $scope.getPopulationDensityEligibility(coord);
                if (!eligibility.canRaise) {
                    return false;
                }

                var firstEmptyIndex = $scope.findFirstEmptyPopulationDensityOrderIndex();
                if (firstEmptyIndex < 0) {
                    return false;
                }

                var targetRow = $scope.tsIncreasePopulationDensityList[firstEmptyIndex];
                targetRow.x = x;
                targetRow.y = y;
                $scope.showPopulationDensityRow(targetRow);
                $scope.queueAutoSaveTsGrid('IncreasePopulationDensity');
                return true;
            };

            $scope.removePopulationDensityRow = function (row) {
                if (!row || !row.entity) return;

                var targetRow = row.entity;
                if (($scope.tsIncreasePopulationDensityList || []).indexOf(targetRow) < 0) {
                    // Row references can go stale after autosave replaces the list.
                    // Re-resolve by order number/index so clear always affects the live list row.
                    var targetOrderNo = turnMapsPopulationDensityRulesFactory.toInt(targetRow.orderNo, 0);
                    var fallbackIndex = turnMapsPopulationDensityRulesFactory.toInt($scope.getCurrentOrderIndexForMode && $scope.getCurrentOrderIndexForMode('populationDensity'), -1);
                    targetRow = null;

                    if (targetOrderNo > 0) {
                        angular.forEach($scope.tsIncreasePopulationDensityList || [], function (candidate) {
                            if (!targetRow && turnMapsPopulationDensityRulesFactory.toInt(candidate && candidate.orderNo, 0) === targetOrderNo) {
                                targetRow = candidate;
                            }
                        });
                    }

                    if (!targetRow && fallbackIndex >= 0 && ($scope.tsIncreasePopulationDensityList || [])[fallbackIndex]) {
                        targetRow = $scope.tsIncreasePopulationDensityList[fallbackIndex];
                    }

                    if (!targetRow) {
                        return;
                    }
                }

                if ($scope.selectedPopulationDensityRow === targetRow) {
                    $scope.selectPopulationDensityRow(null);
                }

                targetRow.x = null;
                targetRow.y = null;
                if (typeof $scope.focusCurrentPopulationDensityOrder === 'function') {
                    $scope.focusCurrentPopulationDensityOrder();
                }
                $scope.queueAutoSaveTsGrid('IncreasePopulationDensity');
            };
        }
    };
});
