'use strict';

austerlitzModule.factory('landUnitsSetUpBrigadesFactory', function (
    turnSheetValueRulesFactory,
    ts01TransferGoodsUtilsFactory,
    turnMapsDepotLookupFactory,
    turnMapsTsTransferBuilderFactory,
    turnMapsTransferGoodsStorageFactory
) {
    var TS_COST_TYPE_ORDER = ['TS03', 'TS04', 'TS05', 'TS06'];
    var TS_COST_LABELS = {
        TS03: 'Set Up Brigades',
        TS04: 'Set Up Additional Battalions',
        TS05: 'Increase Headcount',
        TS06: 'Increase Brigade XP (Train)'
    };
    var EMPTY_LIST = [];
    var MANAGED_TS01_ROW_LIMIT = 10;
    var MANAGED_TS01_STORAGE_KEY_PREFIX = 'austerlitz.landUnits.managedTs01Rows.';
    var BATT_FIELDS = ['batt1', 'batt2', 'batt3', 'batt4', 'batt5', 'batt6', 'batt7'];
    var SPHERE_ALL = 'All';
    var SPHERE_EUROPE = 'Europe';
    var SPHERE_CARIBBEAN = 'Caribbean';
    var SPHERE_INDIA = 'India';
    var SPHERE_UNKNOWN = 'Unknown';

    function toInt(value, fallback) {
        return ts01TransferGoodsUtilsFactory.toInt(value, fallback);
    }

    function toFloat(value, fallback) {
        var parsed = parseFloat(value);
        return isNaN(parsed) ? (fallback || 0) : parsed;
    }

    function hasMeaningfulText(value) {
        if (value == null) return false;
        var text = value.toString().trim();
        return !!text && text !== '<Brigade Name>' && text.toLowerCase() !== 'temp brigade name';
    }

    function hasPositiveInt(value) {
        var parsed = parseInt(value, 10);
        return !isNaN(parsed) && parsed > 0;
    }

    function hasAnyGoods(goods) {
        if (!goods) return false;
        return toInt(goods.louisdore, 0) > 0
            || toInt(goods.citizens, 0) > 0
            || toInt(goods.ecPts, 0) > 0
            || toInt(goods.horses, 0) > 0
            || toInt(goods.wood, 0) > 0
            || toInt(goods.textiles, 0) > 0;
    }

    function normalizeSphereName(sphere) {
        var text = (sphere || '').toString().trim();
        if (!text) return SPHERE_UNKNOWN;
        var upper = text.toUpperCase();
        if (upper === 'ALL') return SPHERE_ALL;
        if (upper === 'EUROPE') return SPHERE_EUROPE;
        if (upper === 'INDIA') return SPHERE_INDIA;
        if (upper === 'CARIBBEAN' || upper === 'CARRIBEAN' || upper === 'CARRIBBEAN') return SPHERE_CARIBBEAN;
        return text;
    }

    return {
        attach: function ($scope, rulesCatalogFactory, turnSheetFactory) {
            $scope.getTsTypeSortOrder = function (tsType) {
                var idx = TS_COST_TYPE_ORDER.indexOf(tsType);
                return idx >= 0 ? idx : TS_COST_TYPE_ORDER.length + 99;
            };

            $scope.normalizeSetUpBrigadesRows = function (rows) {
                return (rows || []).map(function (row) {
                    row.depot = turnSheetValueRulesFactory.toPositiveIntOrNull(row.depot);
                    angular.forEach(BATT_FIELDS, function (field) {
                        row[field] = turnSheetValueRulesFactory.toPositiveIntOrNull(row[field]);
                    });
                    if (!row.depot || !hasMeaningfulText(row.brigadeName)) {
                        row.brigadeName = '';
                    }
                    return row;
                });
            };

            $scope.normalizeTransferGoodsRows = function (rows) {
                return (rows || []).map(function (row) {
                    row.from = turnSheetValueRulesFactory.toPositiveIntOrNull(row.from);
                    row.to = turnSheetValueRulesFactory.toPositiveIntOrNull(row.to);
                    row.louisdore = turnSheetValueRulesFactory.toPositiveIntOrNull(row.louisdore);
                    row.citizens = turnSheetValueRulesFactory.toPositiveIntOrNull(row.citizens);
                    row.ecPts = turnSheetValueRulesFactory.toPositiveIntOrNull(row.ecPts);
                    row.wood = turnSheetValueRulesFactory.toPositiveIntOrNull(row.wood);
                    row.horses = turnSheetValueRulesFactory.toPositiveIntOrNull(row.horses);
                    row.textiles = turnSheetValueRulesFactory.toPositiveIntOrNull(row.textiles);
                    return row;
                });
            };

            $scope.refreshSetUpBrigadesRows = function () {
                var topRows = ($scope.tsSetUpBrigadesList || []).filter(function (row) {
                    return toInt(row.orderNo, 0) <= 8;
                }).sort(function (left, right) {
                    return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
                });

                for (var orderNo = 1; orderNo <= 8; orderNo++) {
                    var found = false;
                    for (var i = 0; i < topRows.length; i++) {
                        if (toInt(topRows[i].orderNo, 0) === orderNo) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        var newRow = { orderNo: orderNo, depot: null, brigadeName: '' };
                        angular.forEach(BATT_FIELDS, function (field) {
                            newRow[field] = null;
                        });
                        topRows.push(newRow);
                        $scope.tsSetUpBrigadesList = ($scope.tsSetUpBrigadesList || []).concat([newRow]);
                    }
                }

                topRows.sort(function (left, right) {
                    return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
                });
                $scope.tsSetUpBrigadesRows = topRows;
            };

            $scope.buildSetUpDepotOptions = function () {
                var bySphere = { Europe: [], Caribbean: [], India: [], Unknown: [] };
                var turnReport = $scope.masterData && $scope.masterData.turnReport;
                var barracks = (turnReport && turnReport.barracks) || [];

                function mapDepot(raw, sourceType) {
                    var sphere = normalizeSphereName(ts01TransferGoodsUtilsFactory.getSphereFromCoordinate(raw.x, raw.y));
                    var name = (raw.name || '').toString().trim();
                    var itemNo = toInt(raw.itemNo, 0);
                    return {
                        itemNo: itemNo > 0 ? itemNo : null,
                        name: name,
                        x: toInt(raw.x, null),
                        y: toInt(raw.y, null),
                        sphere: sphere,
                        sourceType: sourceType,
                        label: itemNo + (name ? (' - ' + name) : '') + ' (' + raw.x + '/' + raw.y + ') [' + sphere + ']'
                    };
                }

                angular.forEach(barracks, function (raw) {
                    var depot = mapDepot(raw, 'Barracks');
                    if (!depot.itemNo) return;
                    bySphere[depot.sphere] = (bySphere[depot.sphere] || []).concat([depot]);
                });

                angular.forEach(Object.keys(bySphere), function (key) {
                    bySphere[key].sort(function (left, right) {
                        return toInt(left.itemNo, 0) - toInt(right.itemNo, 0);
                    });
                });

                $scope.setUpDepotOptionsBySphere = bySphere;
                $scope.setUpDepotOptions = []
                    .concat(bySphere.Europe || [])
                    .concat(bySphere.Caribbean || [])
                    .concat(bySphere.India || [])
                    .concat(bySphere.Unknown || []);
                $scope.refreshSetUpDepotSelectionOptions();
            };

            $scope.refreshSetUpDepotSelectionOptions = function () {
                var scoped = ($scope.setUpDepotOptions || []).slice();
                var seen = {};
                angular.forEach(scoped, function (depot) {
                    seen[toInt(depot && depot.itemNo, 0)] = true;
                });
                angular.forEach($scope.tsSetUpBrigadesRows || [], function (row) {
                    var selectedDepot = $scope.getSetUpDepotOptionByItemNo(row && row.depot);
                    var selectedNo = toInt(selectedDepot && selectedDepot.itemNo, 0);
                    if (!selectedNo || seen[selectedNo]) return;
                    scoped.push(selectedDepot);
                    seen[selectedNo] = true;
                });
                scoped.sort(function (left, right) {
                    return toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0);
                });
                $scope.setUpDepotSelectionOptions = scoped;
            };

            $scope.getSetUpDepotOptionByItemNo = function (itemNo) {
                var target = toInt(itemNo, 0);
                if (!target) return null;
                var options = $scope.setUpDepotOptions || [];
                for (var i = 0; i < options.length; i++) {
                    if (toInt(options[i].itemNo, 0) === target) {
                        return options[i];
                    }
                }
                return null;
            };

            $scope.getTurnStateCodeForSetUp = function () {
                if ($scope.masterData && $scope.masterData.turnId && $scope.masterData.turnId.length >= 4) {
                    return $scope.masterData.turnId.substr(3, 1);
                }
                return ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : 'E');
            };

            $scope.loadSetUpArmyListForTurnState = function () {
                var stateCode = ($scope.getTurnStateCodeForSetUp() || 'E').toString().trim().toUpperCase();
                return rulesCatalogFactory.getArmyList(stateCode).then(function (armyList) {
                    var filtered = (armyList || []).filter(function (item) {
                        var itemNo = parseInt(item.itemNo, 10);
                        return !isNaN(itemNo) && itemNo > 0 && itemNo % 2 === 1;
                    });

                    $scope.setupArmyListAllRows = filtered;
                    $scope.setupArmyListByItemNo = {};
                    angular.forEach(filtered, function (armyItem) {
                        var key = toInt(armyItem.itemNo, 0);
                        if (key > 0 && !$scope.setupArmyListByItemNo[key]) {
                            $scope.setupArmyListByItemNo[key] = armyItem;
                        }
                    });
                    $scope.refreshSetUpArmyListBySphere();
                    $scope.recalculateTransferGoodsForSetUpBrigades();
                }, function () {
                    $scope.setupArmyListAllRows = [];
                    $scope.setupArmyListRows = [];
                    $scope.setupArmyListByItemNo = {};
                });
            };

            $scope.getArmyListItemByItemNo = function (itemNo) {
                return itemNo == null ? null : ($scope.setupArmyListByItemNo[toInt(itemNo, 0)] || null);
            };

            $scope.getArmyListItemByShortName = function (shortName) {
                var match = null;
                var normalized = (shortName || '').toString().trim().toUpperCase();
                if (!normalized) return null;
                angular.forEach($scope.setupArmyListRows || [], function (armyItem) {
                    if (match) return;
                    var key = (armyItem.shortName || '').toString().trim().toUpperCase();
                    if (key === normalized) match = armyItem;
                });
                return match;
            };

            $scope.canAddArmyItemToDepotSphere = function (armyItemNo, sphere) {
                var armyItem = $scope.getArmyListItemByItemNo(armyItemNo);
                if (!armyItem) return false;
                var normalizedSphere = normalizeSphereName(sphere);
                if (!normalizedSphere || normalizedSphere === SPHERE_ALL) return true;

                var shortName = (armyItem.shortName || '').toString().trim().toUpperCase();
                var name = (armyItem.name || '').toString();
                var isColonial = !!armyItem.isColonial || /colonial/i.test(name);
                var isKt = shortName === 'KT';

                if (normalizedSphere === SPHERE_CARIBBEAN || normalizedSphere === SPHERE_INDIA) {
                    return isColonial && !isKt;
                }
                if (normalizedSphere === SPHERE_EUROPE) {
                    return !isColonial || isKt;
                }
                return true;
            };

            $scope.refreshSetUpArmyListBySphere = function () {
                var allRows = $scope.setupArmyListAllRows || [];
                $scope.setupArmyListRows = allRows.slice();
            };

            $scope.calculateHeadcountEfDrop = function (missingMen, size) {
                if (missingMen <= 0) return 0;
                if (missingMen > size) return 2;
                if (missingMen > (size * 0.5)) return 1;
                return 0;
            };

            $scope.isMountedArmyItem = function (armyItem) {
                if (!armyItem) return false;
                var shortName = (armyItem.shortName || '').toString();
                var name = (armyItem.name || '').toString();
                return !!armyItem.isCavalry || /mounted/i.test(name) || /^mc$/i.test(shortName);
            };

            $scope.pickSetUpArmyItem = function (armyItem) {
                $scope.selectedSetUpArmyItem = armyItem || null;
            };

            $scope.isSetUpArmyItemSelected = function (armyItem) {
                return !!(armyItem && $scope.selectedSetUpArmyItem && toInt(armyItem.itemNo, 0) === toInt($scope.selectedSetUpArmyItem.itemNo, 0));
            };

            $scope.setSetUpDepot = function (row) {
                if (!row) return;
                var currentOrderNo = toInt(row.orderNo, 0);
                var selectedDepot = toInt(row.depot, 0);
                if (currentOrderNo > 0 && selectedDepot > 0) {
                    var previousActiveRow = null;
                    angular.forEach($scope.tsSetUpBrigadesRows || [], function (candidate) {
                        if (!candidate) return;
                        var candidateOrderNo = toInt(candidate.orderNo, 0);
                        if (!candidateOrderNo || candidateOrderNo >= currentOrderNo) return;
                        var hasAnyData = hasPositiveInt(candidate.depot)
                            || hasPositiveInt(candidate.batt1)
                            || hasPositiveInt(candidate.batt2)
                            || hasPositiveInt(candidate.batt3)
                            || hasPositiveInt(candidate.batt4)
                            || hasPositiveInt(candidate.batt5)
                            || hasPositiveInt(candidate.batt6)
                            || hasPositiveInt(candidate.batt7)
                            || hasMeaningfulText(candidate.brigadeName);
                        if (!hasAnyData) return;
                        if (!previousActiveRow || candidateOrderNo > toInt(previousActiveRow.orderNo, 0)) {
                            previousActiveRow = candidate;
                        }
                    });

                    if (previousActiveRow) {
                        var firstFiveComplete = hasPositiveInt(previousActiveRow.batt1)
                            && hasPositiveInt(previousActiveRow.batt2)
                            && hasPositiveInt(previousActiveRow.batt3)
                            && hasPositiveInt(previousActiveRow.batt4)
                            && hasPositiveInt(previousActiveRow.batt5);
                        if (!firstFiveComplete) {
                            row.depot = null;
                            alert('cant add new brigade until first 5 batts are filled in');
                            $scope.recalculateTransferGoodsForSetUpBrigades();
                            return;
                        }
                    }
                }
                $scope.queueSetUpTsSave('SetUpBrigades');
                $scope.recalculateTransferGoodsForSetUpBrigades();
            };

            $scope.paintSetUpBattalion = function (row, battField) {
                if (!row || BATT_FIELDS.indexOf(battField) === -1 || !$scope.selectedSetUpArmyItem) return;
                if (!turnSheetValueRulesFactory.hasPositiveIntValue(row.depot)) {
                    alert('Select a barracks/shipyard for this row before adding battalions.');
                    return;
                }
                var itemNo = toInt($scope.selectedSetUpArmyItem.itemNo, 0);
                var rowSphere = normalizeSphereName($scope.getSphereFromDepotItemNo(row.depot));
                if (rowSphere && !$scope.canAddArmyItemToDepotSphere(itemNo, rowSphere)) {
                    var regionLabel = (rowSphere === SPHERE_EUROPE) ? 'Europe' : 'the Colonies';
                    alert('This troop type cannot be built at the selected barracks in ' + regionLabel + '.');
                    return;
                }
                row[battField] = itemNo;
                if (!row.brigadeName || row.brigadeName === '<Brigade Name>') {
                    row.brigadeName = ($scope.selectedSetUpArmyItem.name || '').toString().trim();
                }
                $scope.queueSetUpTsSave('SetUpBrigades');
                $scope.recalculateTransferGoodsForSetUpBrigades();
            };

            $scope.updateSetUpBrigadeName = function (row) {
                if (!row) return;
                if (!hasMeaningfulText(row.brigadeName)) row.brigadeName = '';
                $scope.queueSetUpTsSave('SetUpBrigades');
            };

            $scope.clearSetUpBrigadesRow = function (row) {
                if (!row) return;
                row.depot = null;
                angular.forEach(BATT_FIELDS, function (field) {
                    row[field] = null;
                });
                row.brigadeName = '';
                $scope.queueSetUpTsSave('SetUpBrigades');
                $scope.recalculateTransferGoodsForSetUpBrigades();
            };

            $scope.isBrigadeSetupIncomplete = function (setUpRow) {
                if (!setUpRow) return false;
                var hasDepot = turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.depot);
                var hasAnyBattalion = false;
                angular.forEach(BATT_FIELDS, function (field) {
                    if (turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow[field])) {
                        hasAnyBattalion = true;
                    }
                });

                if (!hasDepot && (hasAnyBattalion || hasMeaningfulText(setUpRow.brigadeName))) {
                    return true;
                }

                if (hasDepot) {
                    if (!turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt1)
                        || !turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt2)
                        || !turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt3)
                        || !turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt4)
                        || !turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt5)) return true;
                    if (turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt7)
                        && !turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt6)) return true;
                }
                return false;
            };

            $scope.getSetUpDepotPositionText = function (setUpRow) {
                var depot = $scope.getDepotReferenceByItemNo(setUpRow && setUpRow.depot);
                if (!depot) return '--/--';
                return depot.x + '/' + depot.y;
            };

            $scope.getSetUpBattalionDisplay = function (setUpRow, battField) {
                var armyItem = $scope.getArmyListItemByItemNo(setUpRow && setUpRow[battField]);
                if (!armyItem) return '- -- ---';
                return $scope.formatBattalionParts(armyItem.shortName, 3, 800);
            };

            $scope.getSetUpRowCostSummary = function (setUpRow) {
                var result = { louisdore: 0, citizens: 0, ecPts: 0, horses: 0 };
                angular.forEach(BATT_FIELDS, function (field) {
                    var armyItem = $scope.getArmyListItemByItemNo(setUpRow && setUpRow[field]);
                    if (!armyItem) return;
                    var recruits = 800;
                    result.citizens += recruits;
                    result.louisdore += Math.round(recruits * toFloat(armyItem.cost, 0));
                    result.ecPts += Math.round(Math.ceil(recruits / 25) * toFloat(armyItem.ecPtsPer25, 0));
                    if ($scope.isMountedArmyItem(armyItem)) result.horses += recruits;
                });
                return result;
            };

            $scope.getSetUpTotalCostSummary = function () {
                var totals = { louisdore: 0, citizens: 0, ecPts: 0, horses: 0 };
                angular.forEach($scope.tsSetUpBrigadesRows || [], function (row) {
                    var rowTotals = $scope.getSetUpRowCostSummary(row);
                    totals.louisdore += rowTotals.louisdore;
                    totals.citizens += rowTotals.citizens;
                    totals.ecPts += rowTotals.ecPts;
                    totals.horses += rowTotals.horses;
                });
                return totals;
            };

            $scope.getTransferGoodsRowByOrderNo = function (orderNo) {
                if (!$scope.tsTransferGoodsList) return null;
                for (var i = 0; i < $scope.tsTransferGoodsList.length; i++) {
                    if (toInt($scope.tsTransferGoodsList[i].orderNo, 0) === toInt(orderNo, 0)) return $scope.tsTransferGoodsList[i];
                }
                return null;
            };

            $scope.refreshTransferGoodsCostRows = function () {
                $scope.tsTransferGoodsCostRows = ($scope.tsTransferGoodsList || []).filter(function (row) {
                    return row.from != null || row.to != null || row.louisdore != null || row.citizens != null || row.ecPts != null || row.horses != null;
                });
            };

            $scope.loadManagedTransferGoodsRowsFromStorage = function () {
                $scope.managedTransferGoodsRowOrderNos = turnMapsTransferGoodsStorageFactory.loadManagedTransferGoodsRows(
                    $scope.masterData && $scope.masterData.turnId,
                    MANAGED_TS01_STORAGE_KEY_PREFIX
                );
            };

            $scope.saveManagedTransferGoodsRowsToStorage = function () {
                turnMapsTransferGoodsStorageFactory.saveManagedTransferGoodsRows(
                    $scope.masterData && $scope.masterData.turnId,
                    MANAGED_TS01_STORAGE_KEY_PREFIX,
                    $scope.managedTransferGoodsRowOrderNos || []
                );
            };

            $scope.getTransferGoodsRowSignature = function (row) {
                return turnMapsTransferGoodsStorageFactory.getTransferGoodsRowSignature(row, toInt);
            };

            $scope.clearTransferGoodsRowValues = turnMapsTransferGoodsStorageFactory.clearTransferGoodsRowValues;
            $scope.hasTransferGoodsData = function (transferRow) {
                return ts01TransferGoodsUtilsFactory.hasTransferGoodsData(transferRow, turnSheetValueRulesFactory);
            };
            $scope.isTransferGoodsRowEmpty = function (row) {
                return ts01TransferGoodsUtilsFactory.isTransferGoodsRowEmpty(row, turnSheetValueRulesFactory);
            };

            $scope.getDepotReferenceByItemNo = function (depotItemNo) {
                return turnMapsDepotLookupFactory.getDepotReferenceByItemNo($scope.masterData, depotItemNo);
            };
            $scope.getSphereFromDepotItemNo = function (depotItemNo) {
                return turnMapsDepotLookupFactory.getSphereFromDepotItemNo($scope.masterData, depotItemNo);
            };
            $scope.getLocationLabel = function (locationItemNo) {
                return turnMapsDepotLookupFactory.getLocationLabel($scope.masterData, locationItemNo);
            };
            $scope.getLineLocationContext = function (depotItemNo) {
                return turnMapsDepotLookupFactory.getLineLocationContext($scope.masterData, depotItemNo);
            };
            $scope.getWarehouseNoFromSphere = ts01TransferGoodsUtilsFactory.getWarehouseNoFromSphere;

            function getTransferCalcContext() {
                return {
                    tsCostLabels: TS_COST_LABELS,
                    masterData: $scope.masterData,
                    tsSetUpBrigadesList: $scope.tsSetUpBrigadesList,
                    tsSetUpAdditionalBrigadesList: $scope.tsSetUpAdditionalBrigadesList,
                    tsIncreaseHeadcountList: $scope.tsIncreaseHeadcountList,
                    tsIncreaseBrigadeXpList: $scope.tsIncreaseBrigadeXpList,
                    toInt: toInt,
                    toFloat: toFloat,
                    hasAnyGoods: hasAnyGoods,
                    getTsTypeSortOrder: $scope.getTsTypeSortOrder,
                    getSortedFilledRows: function (rows, requiredFields) {
                        return (rows || []).filter(function (row) {
                            return requiredFields.every(function (field) {
                                return row && row[field] != null && row[field] !== '';
                            });
                        }).sort(function (left, right) {
                            return toInt(left && left.orderNo, 0) - toInt(right && right.orderNo, 0);
                        });
                    },
                    getSphereFromDepotItemNo: $scope.getSphereFromDepotItemNo,
                    getWarehouseNoFromSphere: $scope.getWarehouseNoFromSphere,
                    getArmyListItemByItemNo: $scope.getArmyListItemByItemNo,
                    getArmyListItemByShortName: $scope.getArmyListItemByShortName,
                    getLocationLabel: $scope.getLocationLabel,
                    getLineLocationContext: $scope.getLineLocationContext,
                    getDepotForBrigadeState: function (brigadeState) {
                        return ts01TransferGoodsUtilsFactory.getDepotSourceItemNoAtCoordinate($scope.masterData && $scope.masterData.turnReport, brigadeState.x, brigadeState.y);
                    },
                    calculateHeadcountEfDrop: $scope.calculateHeadcountEfDrop,
                    isMountedArmyItem: $scope.isMountedArmyItem
                };
            }

            $scope.calculateTsCostTransferLines = function () {
                return turnMapsTsTransferBuilderFactory.calculateTsCostTransferLines(getTransferCalcContext());
            };

            $scope.buildEconomyTsCostSummary = function (lines) {
                $scope.economyTsCostSummarySections = turnMapsTransferGoodsStorageFactory.buildEconomyTsCostSummary(
                    lines, hasAnyGoods, TS_COST_LABELS, $scope.getTsTypeSortOrder, toInt
                );
            };

            $scope.buildTs01BarracksSummaryRows = function () {
                var grouped = {};
                angular.forEach($scope.latestTsCostTransferLines || [], function (line) {
                    if (!line || !line.goods || line.to == null) return;
                    if (!hasAnyGoods(line.goods)) return;
                    var toKey = toInt(line.to, 0);
                    if (!toKey) return;
                    if (!grouped[toKey]) {
                        grouped[toKey] = {
                            from: line.from,
                            to: line.to,
                            locationLabel: line.locationLabel || $scope.getLocationLabel(line.to),
                            goods: { louisdore: 0, citizens: 0, ecPts: 0, horses: 0, wood: 0, textiles: 0 }
                        };
                    }
                    grouped[toKey].from = grouped[toKey].from || line.from;
                    grouped[toKey].goods.louisdore += toInt(line.goods.louisdore, 0);
                    grouped[toKey].goods.citizens += toInt(line.goods.citizens, 0);
                    grouped[toKey].goods.ecPts += toInt(line.goods.ecPts, 0);
                    grouped[toKey].goods.horses += toInt(line.goods.horses, 0);
                    grouped[toKey].goods.wood += toInt(line.goods.wood, 0);
                    grouped[toKey].goods.textiles += toInt(line.goods.textiles, 0);
                });

                $scope.ts01BarracksSummaryRows = Object.keys(grouped).map(function (key) {
                    return grouped[key];
                }).sort(function (left, right) {
                    return toInt(left.to, 0) - toInt(right.to, 0);
                });
            };

            $scope.writeManagedTransferGoodsRows = function (lines) {
                if (!$scope.tsTransferGoodsList) return;
                $scope.economyTsCostWarnings = [];
                var previousManaged = ($scope.managedTransferGoodsRowOrderNos || []).slice();
                var existingManagedRows = previousManaged.map($scope.getTransferGoodsRowByOrderNo).filter(Boolean).sort(function (left, right) {
                    return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
                });

                var availableEmptyRows = ($scope.tsTransferGoodsList || []).filter(function (row) {
                    var orderNo = toInt(row && row.orderNo, 0);
                    if (!orderNo || previousManaged.indexOf(orderNo) >= 0) return false;
                    return $scope.isTransferGoodsRowEmpty(row);
                }).sort(function (left, right) {
                    return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
                });

                var targetRows = [];
                for (var i = 0; i < lines.length; i++) {
                    if (i < existingManagedRows.length) targetRows.push(existingManagedRows[i]);
                    else if (availableEmptyRows.length && targetRows.length < MANAGED_TS01_ROW_LIMIT) targetRows.push(availableEmptyRows.shift());
                    else break;
                }

                var overflowCount = lines.length - targetRows.length;
                if (overflowCount > 0) $scope.economyTsCostWarnings.push('TS01 managed rows are full. ' + overflowCount + ' cost line(s) could not be written.');

                var changed = false;
                var managedOrderNos = [];
                var used = {};

                angular.forEach(targetRows, function (row, idx) {
                    var line = lines[idx];
                    var before = $scope.getTransferGoodsRowSignature(row);
                    row.from = line.from;
                    row.to = line.to;
                    row.louisdore = toInt(line.goods.louisdore, 0) || null;
                    row.citizens = toInt(line.goods.citizens, 0) || null;
                    row.ecPts = toInt(line.goods.ecPts, 0) || null;
                    row.horses = toInt(line.goods.horses, 0) || null;
                    row.wood = toInt(line.goods.wood, 0) || null;
                    row.textiles = toInt(line.goods.textiles, 0) || null;
                    var after = $scope.getTransferGoodsRowSignature(row);
                    if (before !== after) changed = true;
                    var orderNo = toInt(row.orderNo, 0);
                    if (orderNo > 0) {
                        managedOrderNos.push(orderNo);
                        used[orderNo] = true;
                    }
                });

                angular.forEach(existingManagedRows, function (row) {
                    var orderNo = toInt(row.orderNo, 0);
                    if (!orderNo || used[orderNo]) return;
                    var before = $scope.getTransferGoodsRowSignature(row);
                    $scope.clearTransferGoodsRowValues(row);
                    var after = $scope.getTransferGoodsRowSignature(row);
                    if (before !== after) changed = true;
                });

                managedOrderNos.sort(function (left, right) { return left - right; });
                if ((managedOrderNos.join(',')) !== (($scope.managedTransferGoodsRowOrderNos || []).join(','))) changed = true;
                $scope.managedTransferGoodsRowOrderNos = managedOrderNos;
                $scope.saveManagedTransferGoodsRowsToStorage();
                $scope.refreshTransferGoodsCostRows();
                if (changed) $scope.queueSetUpTsSave('TransferGoods');
            };

            $scope.recalculateTransferGoodsForSetUpBrigades = function () {
                if (!$scope.tsTransferGoodsList) return;
                var lines = $scope.calculateTsCostTransferLines();
                $scope.latestTsCostTransferLines = lines;
                $scope.buildEconomyTsCostSummary(lines);
                $scope.writeManagedTransferGoodsRows(lines);
                $scope.buildTs01BarracksSummaryRows();
            };

            $scope.loadSetUpBrigadesData = function () {
                var turnId = $scope.masterData && $scope.masterData.turnId;
                if (!turnId || turnId === 'Unknown') return;

                turnSheetFactory.getTSSetUpBrigades(turnId).then(function (rows) {
                    $scope.tsSetUpBrigadesList = $scope.normalizeSetUpBrigadesRows(rows);
                    $scope.refreshSetUpBrigadesRows();
                    $scope.recalculateTransferGoodsForSetUpBrigades();
                });
                turnSheetFactory.getTSSetUpAdditionalBrigades(turnId).then(function (rows) {
                    $scope.tsSetUpAdditionalBrigadesList = rows || [];
                    $scope.recalculateTransferGoodsForSetUpBrigades();
                });
                turnSheetFactory.getTSIncreaseHeadcount(turnId).then(function (rows) {
                    $scope.tsIncreaseHeadcountList = rows || [];
                    $scope.recalculateTransferGoodsForSetUpBrigades();
                });
                turnSheetFactory.getTSIncreaseBrigadeXP(turnId).then(function (rows) {
                    $scope.tsIncreaseBrigadeXpList = rows || [];
                    $scope.recalculateTransferGoodsForSetUpBrigades();
                });
                turnSheetFactory.getTSTransferGoods(turnId).then(function (rows) {
                    $scope.tsTransferGoodsList = $scope.normalizeTransferGoodsRows(rows);
                    $scope.loadManagedTransferGoodsRowsFromStorage();
                    $scope.refreshTransferGoodsCostRows();
                    $scope.recalculateTransferGoodsForSetUpBrigades();
                });
            };

        }
    };
});
