'use strict';

austerlitzModule.factory('turnMapsProductionSitesFactory', function (stateColorFactory) {
    return {
        attach: function ($scope) {
            $scope.selectedProductionSiteRow = null;
            $scope.getDefaultIntelligenceFilterState = function () {
                return {
                    spyReports: false,
                    changeOfState: false,
                    armyNavyPositions: false,
                    productionPopulation: false
                };
            };
            $scope.intelligenceFilterState = $scope.getDefaultIntelligenceFilterState();

            $scope.resetIntelligenceFilters = function () {
                $scope.intelligenceFilterState = $scope.getDefaultIntelligenceFilterState();
            };

            $scope.toggleIntelligenceFilter = function (filterKey) {
                if (!$scope.intelligenceFilterState || !Object.prototype.hasOwnProperty.call($scope.intelligenceFilterState, filterKey)) {
                    return;
                }

                $scope.intelligenceFilterState[filterKey] = !$scope.intelligenceFilterState[filterKey];
            };

            $scope.isIntelligenceFilterEnabled = function (filterKey) {
                return !!($scope.intelligenceFilterState && $scope.intelligenceFilterState[filterKey]);
            };

            $scope.normalizeBuildProductionSiteRows = function (rows) {
                return rows || [];
            };

            $scope.getProductionSiteTypeInfo = function (prodSiteTypeNo) {
                if (!$scope.productionSiteList || prodSiteTypeNo == null || prodSiteTypeNo === '') {
                    return null;
                }

                var parsedTypeNo = parseInt(prodSiteTypeNo, 10);
                if (isNaN(parsedTypeNo)) {
                    return null;
                }

                for (var i = 0; i < $scope.productionSiteList.length; i++) {
                    var site = $scope.productionSiteList[i];
                    if (site.siteTypeNo == parsedTypeNo || site.sitezTypeNo == parsedTypeNo) {
                        return site;
                    }
                }

                return null;
            };

            $scope.getProductionSiteDescription = function (row) {
                if (!row) return '';

                var productionSite = $scope.getProductionSiteTypeInfo(row.prodSiteType);
                return productionSite ? (productionSite.siteType || '') : '';
            };

            $scope.getProductionSiteSymbol = function (row) {
                if (!row) return '';

                var productionSite = $scope.getProductionSiteTypeInfo(row.prodSiteType);
                return productionSite ? (productionSite.symbol || productionSite.secondarySymbol || '') : '';
            };

            $scope.isCoordinateInSelectedMapChoice = function (x, y) {
                if (!$scope.selectedMapChoice) return false;

                return x >= $scope.selectedMapChoice.rangeMinX
                    && x <= $scope.selectedMapChoice.rangeMaxX
                    && y >= $scope.selectedMapChoice.rangeMinY
                    && y <= $scope.selectedMapChoice.rangeMaxY;
            };

            $scope.getBuildProductionSiteRowAtCoordinate = function (x, y) {
                if (!$scope.tsBuildProductionSitesList) return null;

                var parsedX = parseInt(x, 10);
                var parsedY = parseInt(y, 10);
                if (isNaN(parsedX) || isNaN(parsedY) || !$scope.isCoordinateInSelectedMapChoice(parsedX, parsedY)) {
                    return null;
                }

                for (var i = 0; i < $scope.tsBuildProductionSitesList.length; i++) {
                    var row = $scope.tsBuildProductionSitesList[i];
                    if (row.prodSiteType != null && row.prodSiteType !== '' && row.x == parsedX && row.y == parsedY) {
                        return row;
                    }
                }

                return null;
            };

            $scope.hasBuildProductionSiteAtCoordinate = function (x, y) {
                return !!$scope.getBuildProductionSiteRowAtCoordinate(x, y);
            };

            $scope.getMapProductionSiteText = function (coord) {
                if (!coord) return '';

                if ($scope.isProductionSiteMode()) {
                    var buildRow = $scope.getBuildProductionSiteRowAtCoordinate(coord.x, coord.y);
                    if (buildRow) {
                        return $scope.getProductionSiteSymbol(buildRow);
                    }
                }

                return coord.productionSite;
            };

            $scope.isSeaTerrain = function (terrain) {
                return '.+*'.indexOf((terrain || '').toString()) > -1;
            };

            $scope.getProductionSiteInfoByCoordinateSymbol = function (productionSiteSymbol) {
                if (!$scope.productionSiteList) return null;

                var normalizedSymbol = (productionSiteSymbol || '').toString().trim().toUpperCase();
                if (!normalizedSymbol) return null;

                for (var i = 0; i < $scope.productionSiteList.length; i++) {
                    var productionSite = $scope.productionSiteList[i] || {};
                    var symbol = (productionSite.symbol || productionSite.Symbol || '').toString().trim().toUpperCase();
                    var secondarySymbol = (productionSite.secondarySymbol || productionSite.SecondarySymbol || '').toString().trim().toUpperCase();

                    if (normalizedSymbol === symbol || normalizedSymbol === secondarySymbol) {
                        return productionSite;
                    }
                }

                return null;
            };

            $scope.normalizeProductionSiteSymbol = function (productionSiteSymbol) {
                return (productionSiteSymbol || '').toString().trim().toUpperCase();
            };

            $scope.getProductionSiteDisplayNameFromSymbol = function (productionSiteSymbol) {
                var normalizedSymbol = $scope.normalizeProductionSiteSymbol(productionSiteSymbol);
                if (!normalizedSymbol) return 'nothing';

                var productionSite = $scope.getProductionSiteInfoByCoordinateSymbol(normalizedSymbol);
                if (!productionSite) return normalizedSymbol;

                var siteName = (productionSite.siteType || productionSite.SiteType || '').toString().trim();
                return siteName || normalizedSymbol;
            };

            $scope.getPreviousCoordinateForIntelligence = function (coord) {
                if (!coord || !$scope.toMapCoordinateKey || !$scope.previousMapCoordinatesByKey) return null;
                var key = $scope.toMapCoordinateKey(coord.x, coord.y);
                if (!key || !Object.prototype.hasOwnProperty.call($scope.previousMapCoordinatesByKey, key)) return null;

                return $scope.previousMapCoordinatesByKey[key];
            };

            $scope.getProductionSiteChangeInfo = function (coord) {
                var previousCoord = $scope.getPreviousCoordinateForIntelligence(coord);
                if (!previousCoord) {
                    return {
                        hasPrevious: false,
                        changed: false,
                        previousSymbol: '',
                        currentSymbol: '',
                        previousName: '',
                        currentName: ''
                    };
                }

                var previousSymbol = $scope.normalizeProductionSiteSymbol(previousCoord.productionSite);
                var currentSymbol = $scope.normalizeProductionSiteSymbol($scope.getCurrentProductionSiteSymbolForIntelligence(coord));
                var previousName = $scope.getProductionSiteDisplayNameFromSymbol(previousSymbol);
                var currentName = $scope.getProductionSiteDisplayNameFromSymbol(currentSymbol);

                return {
                    hasPrevious: true,
                    changed: previousSymbol !== currentSymbol,
                    previousSymbol: previousSymbol,
                    currentSymbol: currentSymbol,
                    previousName: previousName,
                    currentName: currentName
                };
            };

            $scope.getCurrentProductionSiteSymbolForIntelligence = function (coord) {
                if (!coord) return '';

                var buildRow = $scope.getBuildProductionSiteRowAtCoordinate
                    ? $scope.getBuildProductionSiteRowAtCoordinate(coord.x, coord.y)
                    : null;

                if (buildRow) {
                    var buildTypeNo = parseInt(buildRow.prodSiteType, 10);
                    if (!isNaN(buildTypeNo) && buildTypeNo === 1) {
                        // Demolition row: effective site becomes nothing.
                        return '';
                    }

                    var buildSymbol = $scope.getProductionSiteSymbol(buildRow);
                    if (buildSymbol) return buildSymbol;
                }

                return coord.productionSite || '';
            };

            $scope.getIntelligenceNewOwnerStateCode = function (coord) {
                var stateCode = (coord && coord.state ? coord.state : '').toString().trim();
                if (!stateCode) return '';

                var isSingleLowercaseLetter = stateCode.length === 1 && stateCode >= 'a' && stateCode <= 'z';
                return isSingleLowercaseLetter ? stateCode.toUpperCase() : '';
            };

            $scope.intelligencePaletteByBucket = {
                critical: '#000000',
                high: '#d62828',
                mediumHigh: '#ffb703',
                medium: '#008000',
                low: '#7ccf8a',
                normal: '#ffffff'
            };

            $scope.getCoordinateIntelligenceStatus = function (coord) {
                if (!coord) {
                    return { status: 'none', siteName: '' };
                }

                if ($scope.isSeaTerrain(coord.terrain)) {
                    return { status: 'sea', siteName: '' };
                }

                var productionSite = $scope.getProductionSiteInfoByCoordinateSymbol(coord.productionSite);
                if (!productionSite) {
                    return { status: 'ok', siteName: '' };
                }

                var minPopulation = parseInt(productionSite.minPopulation != null ? productionSite.minPopulation : productionSite.MinPopulation, 10);
                var maxPopulation = parseInt(productionSite.maxPopulation != null ? productionSite.maxPopulation : productionSite.MaxPopulation, 10);
                var population = parseInt(coord.population, 10);
                var siteName = (productionSite.siteType || productionSite.SiteType || '').toString().trim();

                if (isNaN(population)) population = 0;
                if (isNaN(minPopulation) || isNaN(maxPopulation)) {
                    return { status: 'ok', siteName: siteName };
                }

                if (population < minPopulation) {
                    return { status: 'tooLow', siteName: siteName };
                }

                if (population > maxPopulation) {
                    return { status: 'tooHigh', siteName: siteName };
                }

                return { status: 'ok', siteName: siteName };
            };

            $scope.getIntelligenceCriteria = function (coord) {
                var intelligenceStatus = $scope.getCoordinateIntelligenceStatus(coord);
                var stateChangeCode = $scope.getIntelligenceNewOwnerStateCode(coord);
                var spyReportText = $scope.getIntelligenceSpyReportText(coord);
                var hasSpyPresence = $scope.hasSpyAtCoordinate(coord);
                var armyPositions = $scope.getArmyPositionsAtCoordinate(coord);
                var navyPositions = $scope.getNavyPositionsAtCoordinate ? $scope.getNavyPositionsAtCoordinate(coord) : [];
                var isOutOfRange = intelligenceStatus.status === 'tooLow' || intelligenceStatus.status === 'tooHigh';
                var hasStateChange = !!stateChangeCode;
                var hasSpyReport = hasSpyPresence;
                var hasArmyOrNavy = armyPositions.length > 0 || navyPositions.length > 0;

                var enabledSpyReport = $scope.isIntelligenceFilterEnabled('spyReports') && hasSpyReport;
                var enabledStateChange = $scope.isIntelligenceFilterEnabled('changeOfState') && hasStateChange;
                var enabledArmyNavy = $scope.isIntelligenceFilterEnabled('armyNavyPositions') && hasArmyOrNavy;
                var enabledPopulation = $scope.isIntelligenceFilterEnabled('productionPopulation') && isOutOfRange;

                var matchedEnabledOptionCount = 0;
                if (enabledSpyReport) matchedEnabledOptionCount++;
                if (enabledStateChange) matchedEnabledOptionCount++;
                if (enabledArmyNavy) matchedEnabledOptionCount++;
                if (enabledPopulation) matchedEnabledOptionCount++;

                var borderRings = [];
                if (enabledSpyReport) borderRings.push({ color: '#000000', baseWidth: 2 });
                if (enabledArmyNavy) borderRings.push({ color: '#ff0000', baseWidth: 2 });
                if (enabledPopulation) borderRings.push({ color: '#555555', baseWidth: 3 });

                return {
                    intelligenceStatus: intelligenceStatus,
                    stateChangeCode: stateChangeCode,
                    spyReportText: spyReportText,
                    hasSpyPresence: hasSpyPresence,
                    armyPositions: armyPositions,
                    navyPositions: navyPositions,
                    isOutOfRange: isOutOfRange,
                    hasStateChange: hasStateChange,
                    hasSpyReport: hasSpyReport,
                    hasArmyOrNavy: hasArmyOrNavy,
                    enabledSpyReport: enabledSpyReport,
                    enabledStateChange: enabledStateChange,
                    enabledArmyNavy: enabledArmyNavy,
                    enabledPopulation: enabledPopulation,
                    matchedEnabledOptionCount: matchedEnabledOptionCount,
                    additionalThicknessPx: matchedEnabledOptionCount > 1 ? (matchedEnabledOptionCount - 1) * 2 : 0,
                    borderRings: borderRings
                };
            };

            $scope.buildIntelligenceOverlayStyle = function (criteria) {
                var ringDefinitions = (criteria && criteria.borderRings) || [];
                if (!ringDefinitions.length) {
                    return {};
                }

                var extraThickness = criteria.additionalThicknessPx || 0;
                var cumulativeWidth = 0;
                var ringParts = [];

                angular.forEach(ringDefinitions, function (ring) {
                    if (!ring) return;
                    var baseWidth = parseInt(ring.baseWidth, 10);
                    if (isNaN(baseWidth) || baseWidth <= 0) return;

                    var finalWidth = baseWidth + extraThickness;
                    cumulativeWidth += finalWidth;
                    ringParts.push('inset 0 0 0 ' + cumulativeWidth + 'px ' + ring.color);
                });

                if (!ringParts.length) {
                    return {};
                }

                return { 'box-shadow': ringParts.join(', ') };
            };

            $scope.getIntelligenceVisualInfo = function (coord) {
                var criteria = $scope.getIntelligenceCriteria(coord);
                if (criteria.intelligenceStatus && criteria.intelligenceStatus.status === 'sea') {
                    return {
                        criteria: criteria,
                        stateBackgroundClass: 'terrain_sea',
                        textContrastClass: 'intelText_Dark',
                        overlayStyle: {},
                        hasEnabledMatch: false
                    };
                }

                var hasEnabledMatch = criteria.matchedEnabledOptionCount > 0;
                var stateCode = (coord && coord.state ? coord.state : '').toString().trim().toUpperCase();
                if (criteria.enabledSpyReport) {
                    var spyStateCode = $scope.getSpyStateCodeAtCoordinate(coord);
                    if (spyStateCode) {
                        stateCode = spyStateCode;
                    }
                } else if (criteria.enabledArmyNavy) {
                    var armyNavyStateCode = $scope.getArmyNavyStateCodeAtCoordinate(coord);
                    if (armyNavyStateCode) {
                        stateCode = armyNavyStateCode;
                    }
                }
                var stateBackgroundClass = hasEnabledMatch && stateCode
                    ? ('intelStateBg_' + stateCode)
                    : 'intelStateBg_Default';
                var backgroundColor = hasEnabledMatch && stateCode && stateColorFactory && stateColorFactory.getColor
                    ? stateColorFactory.getColor(stateCode)
                    : '#ffffff';
                var textContrastClass = stateColorFactory && stateColorFactory.getReadableTextClass
                    ? stateColorFactory.getReadableTextClass(backgroundColor)
                    : 'intelText_Dark';

                return {
                    criteria: criteria,
                    stateBackgroundClass: stateBackgroundClass,
                    textContrastClass: textContrastClass,
                    overlayStyle: $scope.buildIntelligenceOverlayStyle(criteria),
                    hasEnabledMatch: hasEnabledMatch
                };
            };

            $scope.getIntelligenceClass = function (coord) {
                var visualInfo = $scope.getIntelligenceVisualInfo(coord);
                if (!visualInfo) return 'intelStateBg_Default intelText_Dark';
                return visualInfo.stateBackgroundClass + ' ' + visualInfo.textContrastClass;
            };

            $scope.getIntelligenceCellStyle = function (coord) {
                var visualInfo = $scope.getIntelligenceVisualInfo(coord);
                return visualInfo ? (visualInfo.overlayStyle || {}) : {};
            };

            $scope.getIntelligenceChangedTooltip = function (coord) {
                var changeInfo = $scope.getProductionSiteChangeInfo(coord);
                if (!changeInfo.hasPrevious || !changeInfo.changed) return '';

                return "Prod site changed from '" + changeInfo.previousName + "' to '" + changeInfo.currentName + "'";
            };

            $scope.getIntelligenceNewOwnerTooltip = function (coord) {
                var ownerStateCode = $scope.getIntelligenceNewOwnerStateCode(coord);
                if (!ownerStateCode) return '';

                return "New owner is state : '" + ownerStateCode + "'";
            };

            $scope.getIntelligenceSpyReportText = function (coord) {
                if (!coord || !$scope.toMapCoordinateKey || !$scope.spyCoordinateReportByKey) return '';
                var key = $scope.toMapCoordinateKey(coord.x, coord.y);
                if (!key || !Object.prototype.hasOwnProperty.call($scope.spyCoordinateReportByKey, key)) return '';

                return ($scope.spyCoordinateReportByKey[key] || '').toString().trim();
            };

            $scope.hasSpyAtCoordinate = function (coord) {
                if (!coord || !$scope.toMapCoordinateKey || !$scope.spyCoordinatePresenceByKey) return false;
                var key = $scope.toMapCoordinateKey(coord.x, coord.y);
                if (!key) return false;
                return !!$scope.spyCoordinatePresenceByKey[key];
            };

            $scope.getSpyStateCodeAtCoordinate = function (coord) {
                if (!coord || !$scope.toMapCoordinateKey || !$scope.spyCoordinateStateByKey) return '';
                var key = $scope.toMapCoordinateKey(coord.x, coord.y);
                if (!key || !Object.prototype.hasOwnProperty.call($scope.spyCoordinateStateByKey, key)) return '';

                var states = $scope.spyCoordinateStateByKey[key] || [];
                if (!states.length) return '';
                return states.map(function (stateCode) {
                    return (stateCode || '').toString().trim().toUpperCase();
                }).filter(function (stateCode) {
                    return stateCode.length > 0;
                }).sort()[0] || '';
            };

            $scope.getArmyNavyStateCodeAtCoordinate = function (coord) {
                var armyStates = ($scope.getArmyPositionsAtCoordinate(coord) || []).map(function (armyPosition) {
                    return (armyPosition && armyPosition.state != null ? armyPosition.state : '').toString().trim().toUpperCase();
                }).filter(function (stateCode) {
                    return stateCode.length > 0;
                });

                if (armyStates.length) {
                    return armyStates.sort()[0];
                }

                var navyStates = ($scope.getNavyPositionsAtCoordinate(coord) || []).map(function (navyPosition) {
                    return (navyPosition && navyPosition.state != null ? navyPosition.state : '').toString().trim().toUpperCase();
                }).filter(function (stateCode) {
                    return stateCode.length > 0;
                });

                return navyStates.length ? navyStates.sort()[0] : '';
            };

            $scope.getArmyPositionsAtCoordinate = function (coord) {
                if (!coord || !$scope.toMapCoordinateKey || !$scope.armyCoordinateByKey) return [];
                var key = $scope.toMapCoordinateKey(coord.x, coord.y);
                if (!key || !Object.prototype.hasOwnProperty.call($scope.armyCoordinateByKey, key)) return [];
                return $scope.armyCoordinateByKey[key] || [];
            };

            $scope.getNavyPositionsAtCoordinate = function (coord) {
                if (!coord || !$scope.toMapCoordinateKey || !$scope.navyCoordinateByKey) return [];
                var key = $scope.toMapCoordinateKey(coord.x, coord.y);
                if (!key || !Object.prototype.hasOwnProperty.call($scope.navyCoordinateByKey, key)) return [];
                return $scope.navyCoordinateByKey[key] || [];
            };

            $scope.getEpidemicPositionsAtCoordinate = function (coord) {
                if (!coord || !$scope.toMapCoordinateKey || !$scope.epidemicCoordinateByKey) return [];
                var key = $scope.toMapCoordinateKey(coord.x, coord.y);
                if (!key || !Object.prototype.hasOwnProperty.call($scope.epidemicCoordinateByKey, key)) return [];
                return $scope.epidemicCoordinateByKey[key] || [];
            };

            $scope.getIntelligenceTooltip = function (coord) {
                var tooltipParts = [];
                var criteria = $scope.getIntelligenceCriteria(coord);
                var intelligenceStatus = criteria.intelligenceStatus;

                if (criteria.enabledPopulation && (intelligenceStatus.status === 'tooLow' || intelligenceStatus.status === 'tooHigh')) {
                    var siteName = intelligenceStatus.siteName || (coord && coord.productionSite ? coord.productionSite : '');
                    tooltipParts.push("Min/Max for '" + siteName + "' not met");
                }

                if (criteria.enabledStateChange) {
                    var newOwnerText = $scope.getIntelligenceNewOwnerTooltip(coord);
                    if (newOwnerText) tooltipParts.push(newOwnerText);
                }

                if (criteria.enabledSpyReport) {
                    if (criteria.spyReportText) {
                        tooltipParts.push("Spy report: '" + criteria.spyReportText + "'");
                    } else {
                        tooltipParts.push('Spy present (no report text)');
                    }
                }

                angular.forEach(criteria.enabledArmyNavy ? criteria.armyPositions : [], function (armyPosition) {
                    var state = (armyPosition && armyPosition.state != null ? armyPosition.state : '').toString().trim().toUpperCase();
                    var bats = parseInt(armyPosition && armyPosition.bats, 10);
                    if (isNaN(bats)) bats = 0;
                    tooltipParts.push("Army found here, State: " + state + " and Bats: " + bats);
                });

                angular.forEach(criteria.enabledArmyNavy ? criteria.navyPositions : [], function (navyPosition) {
                    var navyState = (navyPosition && navyPosition.state != null ? navyPosition.state : '').toString().trim().toUpperCase();
                    var shipType = (navyPosition && navyPosition.shipType ? navyPosition.shipType : '').toString().trim();
                    var fleetNo = parseInt(navyPosition && navyPosition.fleetNo, 10);
                    var fleetText = isNaN(fleetNo) ? '?' : fleetNo;
                    var typeText = shipType || 'Ship';
                    tooltipParts.push(typeText + " found here, State: " + (navyState || '?') + " and Fleet: " + fleetText);
                });

                return tooltipParts.join(' | ');
            };

            $scope.selectProductionSiteRow = function (row) {
                $scope.selectedProductionSiteRow = row || null;
            };

            $scope.selectProductionSiteRowAtCoordinate = function (x, y) {
                $scope.selectProductionSiteRow($scope.getBuildProductionSiteRowAtCoordinate(x, y));
            };

            $scope.getSelectedProductionSiteTypeNo = function () {
                if (!$scope.selectedProductionSite) {
                    return null;
                }

                var selectedTypeNo = $scope.selectedProductionSite.siteTypeNo || $scope.selectedProductionSite.sitezTypeNo;
                var parsed = parseInt(selectedTypeNo, 10);
                return isNaN(parsed) ? null : parsed;
            };

            $scope.getProductionSiteEligibilityClass = function (coord) {
                if (!coord || !$scope.selectedProductionSite) {
                    return '';
                }

                var coordStateCode = (coord.state || '').toString().trim().toUpperCase();
                var coordTerrain = (coord.terrain || '').toString();
                var coordProdSite = (coord.productionSite || '').toString();
                var coordBonus = (coord.bonus || '').toString();
                var coordPopulation = parseInt(coord.population, 10);
                var minPopulation = parseInt($scope.selectedProductionSite.minPopulation, 10);
                var maxPopulation = parseInt($scope.selectedProductionSite.maxPopulation, 10);
                var selectedSiteTypeNo = ($scope.selectedProductionSite.siteTypeNo || $scope.selectedProductionSite.sitezTypeNo || '').toString();
                var activeStateCode = ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : '').toString().trim().toUpperCase();

                if (!activeStateCode) {
                    activeStateCode = $scope.selectedState
                        ? (($scope.selectedState.state || $scope.selectedState.State || '').toString().trim().toUpperCase())
                        : '';
                }

                if (isNaN(coordPopulation)) coordPopulation = 0;
                if (isNaN(minPopulation)) minPopulation = 0;
                if (isNaN(maxPopulation)) maxPopulation = 0;

                if (activeStateCode && coordStateCode !== activeStateCode) {
                    if ('.+*'.indexOf(coordTerrain) > -1) {
                        return 'terrain_sea';
                    }

                    return 'state_R';
                }

                if ('.+*'.indexOf(coordTerrain) > -1) {
                    return 'terrain_sea';
                }

                if ($scope.selectedProductionSite.bonusSymbol == coordBonus) {
                    if (coordProdSite.trim().length > 0) return 'prodSite_Existing';
                    if (coordPopulation < minPopulation) return 'prodSite_TooFew';
                    if (coordPopulation > maxPopulation) return 'prodSite_TooMany';
                    return 'prodSite_Yes';
                }

                if (($scope.selectedProductionSite.terrain || '').indexOf(coordTerrain) > -1) {
                    if (coordPopulation < minPopulation) return 'prodSite_TooFew';
                    if (coordPopulation > maxPopulation) return 'prodSite_TooMany';

                    if (selectedSiteTypeNo == '1') {
                        if (coordProdSite.trim().length > 0) return 'prodSite_Yes';
                        return ' ';
                    }

                    if (coordProdSite.trim().length > 0) return 'prodSite_Existing';
                    return 'prodSite_Yes';
                }

                if (selectedSiteTypeNo == '21') {
                    if (coordProdSite.trim().length > 0 && ($scope.selectedProductionSite.terrain || '').indexOf(coordProdSite) > -1) return 'prodSite_Yes';
                    return ' ';
                }

                return '';
            };

            $scope.isAllowedProductionSiteClass = function (productionSiteClass) {
                var className = (productionSiteClass || '').toString().trim();
                if (!className) return false;
                if (className === 'terrain_sea') return false;

                return className.indexOf('prodSite_') === 0;
            };

            $scope.canAddProductionSiteAtCoordinate = function (coord, productionSiteClass) {
                var coordClass = productionSiteClass || $scope.getProductionSiteEligibilityClass(coord);
                return $scope.isAllowedProductionSiteClass(coordClass);
            };

            $scope.getProductionSiteRowTypeNo = function (row) {
                var parsed = parseInt(row.prodSiteType, 10);
                return isNaN(parsed) ? null : parsed;
            };

            $scope.setProductionSiteRowValues = function (row, prodSiteTypeNo, x, y, productionSiteClass) {
                row.prodSiteType = prodSiteTypeNo;
                row.x = x;
                row.y = y;
                row.prodSiteStatusClass = productionSiteClass || '';
                $scope.selectProductionSiteRow(row);
            };

            $scope.addOrUpdateProductionSiteRecord = function (x, y, productionSiteClass) {
                if (!$scope.tsBuildProductionSitesList) {
                    return;
                }

                var prodSiteTypeNo = $scope.getSelectedProductionSiteTypeNo();
                if (prodSiteTypeNo == null) {
                    return;
                }

                var rowsAtCoord = [];
                angular.forEach($scope.tsBuildProductionSitesList, function (row) {
                    if (row.x == x && row.y == y) {
                        rowsAtCoord.push(row);
                    }
                });

                var selectedTypeRow = null;
                angular.forEach(rowsAtCoord, function (row) {
                    if (!selectedTypeRow && $scope.getProductionSiteRowTypeNo(row) === prodSiteTypeNo) {
                        selectedTypeRow = row;
                    }
                });

                if (selectedTypeRow) {
                    $scope.setProductionSiteRowValues(selectedTypeRow, prodSiteTypeNo, x, y, productionSiteClass);
                    $scope.queueAutoSaveTsGrid('BuildProductionSites');
                    return;
                }

                var hasDemolitionRow = rowsAtCoord.some(function (row) {
                    return $scope.getProductionSiteRowTypeNo(row) === 1;
                });

                var canAddSecondRow = rowsAtCoord.length < 2 && (prodSiteTypeNo === 1 || hasDemolitionRow);

                if (!canAddSecondRow && rowsAtCoord.length > 0) {
                    var rowToUpdate = rowsAtCoord[0];
                    angular.forEach(rowsAtCoord, function (row) {
                        if ($scope.getProductionSiteRowTypeNo(row) !== 1) {
                            rowToUpdate = row;
                        }
                    });

                    $scope.setProductionSiteRowValues(rowToUpdate, prodSiteTypeNo, x, y, productionSiteClass);
                    $scope.queueAutoSaveTsGrid('BuildProductionSites');
                    return;
                }

                var firstAvailableRow = null;
                angular.forEach($scope.tsBuildProductionSitesList, function (row) {
                    if (firstAvailableRow) return;

                    if ((row.x == null || row.x === '') && (row.y == null || row.y === '')) {
                        firstAvailableRow = row;
                    }
                });

                if (firstAvailableRow) {
                    $scope.setProductionSiteRowValues(firstAvailableRow, prodSiteTypeNo, x, y, productionSiteClass);
                    $scope.queueAutoSaveTsGrid('BuildProductionSites');
                }
            };

            $scope.getProductionSiteRowClass = function (row) {
                if (!row) return '';

                var classes = [];
                var rowClass = row.prodSiteStatusClass || '';
                if ($scope.isAllowedProductionSiteClass(rowClass)) {
                    classes.push(rowClass);
                }
                if (row === $scope.selectedProductionSiteRow) {
                    classes.push('productionSiteRowSelected');
                }

                return classes.join(' ');
            };

            $scope.hasProductionSiteData = function (productionSiteRow) {
                if (!productionSiteRow) return false;

                return productionSiteRow.prodSiteType != null || productionSiteRow.x != null || productionSiteRow.y != null;
            };

            $scope.removeProductionSiteRow = function (row) {
                if (!row || !row.entity) return;

                if ($scope.selectedProductionSiteRow === row.entity) {
                    $scope.selectProductionSiteRow(null);
                }

                row.entity.prodSiteType = null;
                row.entity.x = null;
                row.entity.y = null;
                row.entity.prodSiteStatusClass = null;

                $scope.queueAutoSaveTsGrid('BuildProductionSites');
            };
        }
    };
});
