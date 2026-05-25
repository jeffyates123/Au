'use strict';

austerlitzModule.factory('turnMapsSetUpBrigadesFactory', function (
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
    var MANAGED_TS01_ROW_LIMIT = 10;
    var MANAGED_TS01_STORAGE_KEY_PREFIX = 'austerlitz.turnMaps.managedTs01Rows.';

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

    function hasAnyGoods(goods) {
        if (!goods) return false;
        return toInt(goods.louisdore, 0) > 0
            || toInt(goods.citizens, 0) > 0
            || toInt(goods.ecPts, 0) > 0
            || toInt(goods.horses, 0) > 0
            || toInt(goods.wood, 0) > 0
            || toInt(goods.textiles, 0) > 0;
    }

    return {
        attach: function ($scope, rulesCatalogFactory) {
            $scope.pendingDepotSourceItemNo = null;
            $scope.selectedArmyListItem = null;
            $scope.economyTsCostSummarySections = [];
            $scope.economyTsCostWarnings = [];
            $scope.managedTransferGoodsRowOrderNos = [];
            $scope.armyListCostRows = [];
            $scope.armyListCostByItemNo = {};
            $scope.armyListCostByShortName = {};

            $scope.getTsTypeSortOrder = function (tsType) {
                var idx = TS_COST_TYPE_ORDER.indexOf(tsType);
                return idx >= 0 ? idx : TS_COST_TYPE_ORDER.length + 99;
            };

            $scope.getSortedFilledRows = function (rows, requiredFields) {
                return (rows || []).filter(function (row) {
                    return requiredFields.every(function (field) {
                        return row && row[field] != null && row[field] !== '';
                    });
                }).sort(function (left, right) {
                    return toInt(left && left.orderNo, 0) - toInt(right && right.orderNo, 0);
                });
            };

            $scope.refreshSetUpBrigadesRows = function () {
                $scope.tsSetUpBrigadesRows = ($scope.tsSetUpBrigadesList || []).filter(function (row) {
                    return row.orderNo != null && parseInt(row.orderNo, 10) <= 8;
                });
            };

            $scope.normalizeSetUpBrigadesRows = function (rows) {
                return (rows || []).map(function (row) {
                    row.depot = turnSheetValueRulesFactory.toPositiveIntOrNull(row.depot);
                    row.batt1 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt1);
                    row.batt2 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt2);
                    row.batt3 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt3);
                    row.batt4 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt4);
                    row.batt5 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt5);
                    row.batt6 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt6);
                    row.batt7 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt7);
                    if (!row.depot || !hasMeaningfulText(row.brigadeName)) row.brigadeName = '';
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

            $scope.refreshTransferGoodsCostRows = function () {
                $scope.tsTransferGoodsCostRows = ($scope.tsTransferGoodsList || []).filter(function (row) {
                    return row.from != null || row.to != null || row.louisdore != null || row.citizens != null || row.ecPts != null || row.horses != null;
                });
            };

            $scope.getTransferGoodsRowByOrderNo = function (orderNo) {
                if (!$scope.tsTransferGoodsList) return null;
                for (var i = 0; i < $scope.tsTransferGoodsList.length; i++) {
                    if (toInt($scope.tsTransferGoodsList[i].orderNo, 0) === toInt(orderNo, 0)) return $scope.tsTransferGoodsList[i];
                }
                return null;
            };
            $scope.getTransferCostRow = function (warehouseNo) {
                if (!$scope.tsTransferGoodsList) return null;
                for (var i = 0; i < $scope.tsTransferGoodsList.length; i++) {
                    if ($scope.tsTransferGoodsList[i].orderNo == warehouseNo) return $scope.tsTransferGoodsList[i];
                }
                return $scope.tsTransferGoodsList[warehouseNo - 1] || null;
            };

            $scope.getTurnStateCodeForArmyList = function () {
                if ($scope.masterData && $scope.masterData.turnId && $scope.masterData.turnId.length >= 4) return $scope.masterData.turnId.substr(3, 1);
                return ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : 'E');
            };

            $scope.loadArmyListForTurnState = function () {
                var stateCode = ($scope.getTurnStateCodeForArmyList() || 'E').toString().trim().toUpperCase();
                var mapId = ($scope.selectedMapChoice && $scope.selectedMapChoice.mapId ? $scope.selectedMapChoice.mapId : '').toString().toUpperCase();
                var isEuropeSphere = mapId === 'E' || mapId === 'EW' || mapId === 'EE';
                rulesCatalogFactory.getArmyList(stateCode).then(function (armyList) {
                    $scope.armyListCostRows = armyList || [];
                    $scope.armyListCostByItemNo = {};
                    $scope.armyListCostByShortName = {};
                    angular.forEach($scope.armyListCostRows, function (armyItem) {
                        var itemNo = toInt(armyItem && armyItem.itemNo, 0);
                        if (itemNo > 0 && !$scope.armyListCostByItemNo[itemNo]) $scope.armyListCostByItemNo[itemNo] = armyItem;
                        var shortName = (armyItem && armyItem.shortName != null ? armyItem.shortName : '').toString().trim().toUpperCase();
                        if (shortName && !$scope.armyListCostByShortName[shortName]) $scope.armyListCostByShortName[shortName] = armyItem;
                    });

                    $scope.armyListRows = (armyList || []).filter(function (item) {
                        var parsedItemNo = parseInt(item.itemNo, 10);
                        if (item.itemNo == null || isNaN(parsedItemNo) || parsedItemNo % 2 === 0) return false;
                        if (isEuropeSphere && (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39)) return false;
                        if (!isEuropeSphere && parsedItemNo === 19) return false;
                        return true;
                    });

                    $scope.recalculateTransferGoodsForSetUpBrigades();
                });
            };

            $scope.getWarehouseNoFromSphere = ts01TransferGoodsUtilsFactory.getWarehouseNoFromSphere;
            $scope.getSphereFromCoordinate = ts01TransferGoodsUtilsFactory.getSphereFromCoordinate;
            $scope.getDepotReferenceByItemNo = function (depotItemNo) { return turnMapsDepotLookupFactory.getDepotReferenceByItemNo($scope.masterData, depotItemNo); };
            $scope.getSphereFromDepotItemNo = function (depotItemNo) { return turnMapsDepotLookupFactory.getSphereFromDepotItemNo($scope.masterData, depotItemNo); };
            $scope.getLocationLabel = function (locationItemNo) { return turnMapsDepotLookupFactory.getLocationLabel($scope.masterData, locationItemNo); };
            $scope.getLineLocationContext = function (depotItemNo) { return turnMapsDepotLookupFactory.getLineLocationContext($scope.masterData, depotItemNo); };

            $scope.getArmyListItemByItemNo = function (itemNo) { return itemNo == null ? null : ($scope.armyListCostByItemNo[toInt(itemNo, 0)] || null); };
            $scope.getArmyListItemByShortName = function (shortName) {
                var key = (shortName || '').toString().trim().toUpperCase();
                return key ? ($scope.armyListCostByShortName[key] || null) : null;
            };

            $scope.canAddArmyItemToDepotSphere = function (armyItemNo, sphere) {
                var parsedItemNo = parseInt(armyItemNo, 10);
                if (isNaN(parsedItemNo)) return false;
                if (parsedItemNo === 19) return sphere === 'Europe';
                if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39) return sphere === 'Carribbean' || sphere === 'India';
                return true;
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
                    getSortedFilledRows: $scope.getSortedFilledRows,
                    getSphereFromDepotItemNo: $scope.getSphereFromDepotItemNo,
                    getWarehouseNoFromSphere: $scope.getWarehouseNoFromSphere,
                    getArmyListItemByItemNo: $scope.getArmyListItemByItemNo,
                    getArmyListItemByShortName: $scope.getArmyListItemByShortName,
                    getLocationLabel: $scope.getLocationLabel,
                    getLineLocationContext: $scope.getLineLocationContext,
                    getDepotForBrigadeState: function (brigadeState) {
                        return $scope.getDepotSourceItemNoAtCoordinate(brigadeState.x, brigadeState.y);
                    },
                    calculateHeadcountEfDrop: $scope.calculateHeadcountEfDrop,
                    isMountedArmyItem: $scope.isMountedArmyItem
                };
            }

            $scope.buildBrigadeStateMapForCosting = function () {
                return turnMapsTsTransferBuilderFactory.buildBrigadeStateMapForCosting(getTransferCalcContext());
            };
            $scope.applyTs04ToBrigadeState = function (brigadeStateById) {
                return turnMapsTsTransferBuilderFactory.applyTs04ToBrigadeState(getTransferCalcContext(), brigadeStateById);
            };
            $scope.applyTs05Ts06PlansToBrigadeState = function (brigadeStateById) {
                return turnMapsTsTransferBuilderFactory.applyTs05Ts06PlansToBrigadeState(getTransferCalcContext(), brigadeStateById);
            };
            $scope.getBrigadesByScopeValue = function (brigadeStateById, brigadeOrFederation) {
                return turnMapsTsTransferBuilderFactory.getBrigadesByScopeValue(getTransferCalcContext(), brigadeStateById, brigadeOrFederation);
            };
            $scope.getDepotForBrigadeState = function (brigadeState) {
                return $scope.getDepotSourceItemNoAtCoordinate(brigadeState.x, brigadeState.y);
            };
            $scope.buildTs03TransferLines = function () {
                return turnMapsTsTransferBuilderFactory.buildTs03TransferLines(getTransferCalcContext());
            };
            $scope.buildTs04TransferLines = function (brigadeStateById) {
                return turnMapsTsTransferBuilderFactory.buildTs04TransferLines(getTransferCalcContext(), brigadeStateById);
            };
            $scope.buildTs05TransferLines = function (brigadeStateById) {
                return turnMapsTsTransferBuilderFactory.buildTs05TransferLines(getTransferCalcContext(), brigadeStateById);
            };
            $scope.buildTs06TransferLines = function (brigadeStateById) {
                return turnMapsTsTransferBuilderFactory.buildTs06TransferLines(getTransferCalcContext(), brigadeStateById);
            };
            $scope.calculateTsCostTransferLines = function () {
                return turnMapsTsTransferBuilderFactory.calculateTsCostTransferLines(getTransferCalcContext());
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
            $scope.buildEconomyTsCostSummary = function (lines) {
                $scope.economyTsCostSummarySections = turnMapsTransferGoodsStorageFactory.buildEconomyTsCostSummary(
                    lines, hasAnyGoods, TS_COST_LABELS, $scope.getTsTypeSortOrder, toInt
                );
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
                if (changed) $scope.queueAutoSaveTsGrid('TransferGoods');
            };

            $scope.recalculateTransferGoodsForSetUpBrigades = function () {
                if (!$scope.tsTransferGoodsList) return;
                var lines = $scope.calculateTsCostTransferLines();
                $scope.buildEconomyTsCostSummary(lines);
                $scope.writeManagedTransferGoodsRows(lines);
            };

            $scope.getDepotSourceItemNoAtCoordinate = function (x, y) {
                return ts01TransferGoodsUtilsFactory.getDepotSourceItemNoAtCoordinate($scope.masterData && $scope.masterData.turnReport, x, y);
            };

            $scope.hasSetUpBrigadesData = function (setUpRow) {
                if (!setUpRow) return false;
                return turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.depot)
                    || turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt1)
                    || turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt2)
                    || turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt3)
                    || turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt4)
                    || turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt5)
                    || turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt6)
                    || turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.batt7)
                    || hasMeaningfulText(setUpRow.brigadeName);
            };

            $scope.isBrigadeSetupIncomplete = function (setUpRow) {
                if (!setUpRow) return false;
                if (turnSheetValueRulesFactory.hasPositiveIntValue(setUpRow.depot)) {
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

            $scope.removeSetUpBrigadesRow = function (row) {
                if (!row || !row.entity) return;
                row.entity.depot = null;
                row.entity.batt1 = null;
                row.entity.batt2 = null;
                row.entity.batt3 = null;
                row.entity.batt4 = null;
                row.entity.batt5 = null;
                row.entity.batt6 = null;
                row.entity.batt7 = null;
                row.entity.brigadeName = '';
                $scope.queueAutoSaveTsGrid('SetUpBrigades');
                $scope.recalculateTransferGoodsForSetUpBrigades();
            };

            $scope.removeTransferGoodsRow = function (row) {
                if (!row || !row.entity) return;
                var orderNo = toInt(row.entity.orderNo, 0);
                $scope.clearTransferGoodsRowValues(row.entity);
                if (orderNo > 0 && ($scope.managedTransferGoodsRowOrderNos || []).indexOf(orderNo) >= 0) {
                    $scope.managedTransferGoodsRowOrderNos = ($scope.managedTransferGoodsRowOrderNos || []).filter(function (value) {
                        return toInt(value, 0) !== orderNo;
                    });
                    $scope.saveManagedTransferGoodsRowsToStorage();
                }
                $scope.queueAutoSaveTsGrid('TransferGoods');
            };

            $scope.armyListClickRow = function (row) {
                if (!row || !row.entity) return;
                $scope.selectedArmyListItem = row.entity;
            };

            $scope.isArmyListItemSelected = function (armyItem) {
                return !!(armyItem && $scope.selectedArmyListItem && armyItem.itemNo == $scope.selectedArmyListItem.itemNo);
            };

            $scope.setUpBrigadesGridClick = function (row, col) {
                if (!row || !row.entity || !col) return;
                var field = (col.field || '').toLowerCase();

                if (field === 'depot') {
                    if (!$scope.pendingDepotSourceItemNo) {
                        alert('Select a barracks/shipyard coordinate first.');
                        return;
                    }
                    row.entity.depot = $scope.pendingDepotSourceItemNo;
                    $scope.queueAutoSaveTsGrid('SetUpBrigades');
                    $scope.recalculateTransferGoodsForSetUpBrigades();
                    return;
                }

                var battFields = ['batt1', 'batt2', 'batt3', 'batt4', 'batt5', 'batt6', 'batt7'];
                if (battFields.indexOf(field) === -1) return;
                if (!$scope.selectedArmyListItem) {
                    alert('Select an army list row first.');
                    return;
                }

                var unitItemNo = $scope.selectedArmyListItem.itemNo;
                var sphere = $scope.getSphereFromDepotItemNo(row.entity.depot);
                if (!sphere) {
                    alert('Select a depot in this TS_03 row before adding battalions.');
                    return;
                }
                if (!$scope.canAddArmyItemToDepotSphere(unitItemNo, sphere)) {
                    alert('This troop type cannot be built in the selected sphere.');
                    return;
                }

                row.entity[field] = unitItemNo;
                if (!row.entity.brigadeName || row.entity.brigadeName === '<Brigade Name>') row.entity.brigadeName = $scope.selectedArmyListItem.name;
                $scope.queueAutoSaveTsGrid('SetUpBrigades');
                $scope.recalculateTransferGoodsForSetUpBrigades();
            };

            $scope.loadManagedTransferGoodsRowsFromStorage();
        }
    };
});
