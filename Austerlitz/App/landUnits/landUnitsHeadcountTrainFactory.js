'use strict';

austerlitzModule.factory('landUnitsHeadcountTrainFactory', function ($q, turnSheetValueRulesFactory, ts01TransferGoodsUtilsFactory) {
    var LAND_UNITS_MANAGED_TS01_KEY_PREFIX = 'austerlitz.landUnits.managedTs01Rows.';
    var LAND_UNITS_TS01_MAX_ROWS = 10;

    function toInt(value, fallback) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? (fallback || 0) : parsed;
    }

    return {
        attach: function ($scope, turnSheetFactory) {
            $scope.getLandUnitsManagedTs01StorageKey = function () {
                    return ts01TransferGoodsUtilsFactory.buildManagedStorageKey(
                        LAND_UNITS_MANAGED_TS01_KEY_PREFIX,
                        $scope.masterData && $scope.masterData.turnId ? $scope.masterData.turnId : ''
                    );
                };

            $scope.loadLandUnitsManagedTs01OrderNos = function () {
                    return ts01TransferGoodsUtilsFactory.loadManagedOrderNos(
                        LAND_UNITS_MANAGED_TS01_KEY_PREFIX,
                        $scope.masterData && $scope.masterData.turnId
                    );
                };

            $scope.saveLandUnitsManagedTs01OrderNos = function (orderNos) {
                    ts01TransferGoodsUtilsFactory.saveManagedOrderNos(
                        LAND_UNITS_MANAGED_TS01_KEY_PREFIX,
                        $scope.masterData && $scope.masterData.turnId,
                        orderNos
                    );
                };

            $scope.isTransferGoodsRowEmpty = function (row) {
                    return ts01TransferGoodsUtilsFactory.isTransferGoodsRowEmpty(row, turnSheetValueRulesFactory);
                };

            $scope.getWarehouseNoForCoordinate = function (x, y) {
                    return ts01TransferGoodsUtilsFactory.getWarehouseNoForCoordinate(x, y);
                };

            $scope.getDepotForBrigade = function (brigade) {
                    if (!brigade || !brigade.source || !$scope.masterData || !$scope.masterData.turnReport) {
                        return null;
                    }

                    return ts01TransferGoodsUtilsFactory.getDepotSourceItemNoAtCoordinate(
                        $scope.masterData.turnReport,
                        brigade.source.x_OrState,
                        brigade.source.y_OrFleet
                    );
                };

            $scope.syncTransferGoodsForLandUnitsPlans = function () {
                    if (!$scope.masterData || !$scope.masterData.turnId || !$scope.brigadeRows || !$scope.brigadeRows.length) {
                        return;
                    }

                    var totalsByTypeAndDepot = {};
                    var order = [];

                    function ensureBucket(tsType, warehouseNo, depotItemNo) {
                        var key = tsType + ':' + depotItemNo;
                        if (!totalsByTypeAndDepot[key]) {
                            totalsByTypeAndDepot[key] = {
                                tsType: tsType,
                                from: warehouseNo,
                                to: depotItemNo,
                                louisdore: 0,
                                citizens: 0,
                                ecPts: 0,
                                horses: 0
                            };
                            order.push(key);
                        }
                        return totalsByTypeAndDepot[key];
                    }

                    angular.forEach($scope.brigadeRows, function (brigade) {
                        var depot = $scope.getDepotForBrigade(brigade);
                        var warehouse = $scope.getWarehouseNoForCoordinate(brigade && brigade.source ? brigade.source.x_OrState : null, brigade && brigade.source ? brigade.source.y_OrFleet : null);
                        if (!depot || !warehouse) {
                            return;
                        }

                        if (brigade.headcountPlan) {
                            var headcountCost = $scope.calculateHeadcountResources(brigade, brigade.headcountPlan.targetHeadcount);
                            var headcountBucket = ensureBucket('TS05', warehouse, depot);
                            headcountBucket.louisdore += toInt(headcountCost.ld, 0);
                            headcountBucket.citizens += toInt(headcountCost.citizens, 0);
                            headcountBucket.ecPts += toInt(headcountCost.ecPts, 0);
                            headcountBucket.horses += toInt(headcountCost.horses, 0);
                        }

                        if (brigade.trainPlan) {
                            var trainCost = $scope.calculateTrainResources(brigade);
                            var trainBucket = ensureBucket('TS06', warehouse, depot);
                            trainBucket.louisdore += toInt(trainCost.ld, 0);
                            trainBucket.ecPts += toInt(trainCost.ecPts, 0);
                        }
                    });

                    var transferLines = order.map(function (key) {
                        return totalsByTypeAndDepot[key];
                    }).filter(function (line) {
                        return line.louisdore > 0 || line.citizens > 0 || line.ecPts > 0 || line.horses > 0;
                    }).sort(function (left, right) {
                        if (left.tsType !== right.tsType) {
                            return left.tsType < right.tsType ? -1 : 1;
                        }
                        return toInt(left.to, 0) - toInt(right.to, 0);
                    });

                    return turnSheetFactory.getTSTransferGoods($scope.masterData.turnId).then(function (rows) {
                        rows = rows || [];
                        var ts01MaxRows = LAND_UNITS_TS01_MAX_ROWS;
                        if (transferLines.length > ts01MaxRows) {
                            alert('Cannot apply this Headcount/Train change because it would require ' + transferLines.length + ' TS01 rows, but TS01 supports a maximum of ' + ts01MaxRows + '.');
                            return null;
                        }
                        var managedOrderNos = $scope.loadLandUnitsManagedTs01OrderNos();
                        var managedRows = managedOrderNos.map(function (orderNo) {
                            return rows.find(function (row) {
                                return toInt(row && row.orderNo, 0) === orderNo;
                            });
                        }).filter(function (row) { return !!row; }).sort(function (left, right) {
                            return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
                        });

                        var freeRows = rows.filter(function (row) {
                            var orderNo = toInt(row && row.orderNo, 0);
                            return managedOrderNos.indexOf(orderNo) < 0 && $scope.isTransferGoodsRowEmpty(row);
                        }).sort(function (left, right) {
                            return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
                        });

                        var targetRows = [];
                        for (var i = 0; i < transferLines.length; i++) {
                            if (i < managedRows.length) {
                                targetRows.push(managedRows[i]);
                            }
                            else if (freeRows.length) {
                                targetRows.push(freeRows.shift());
                            }
                            else {
                                var created = $scope.findNextEmptyTurnSheetRowWithinLimit(rows, ['from', 'to', 'louisdore', 'citizens', 'ecPts', 'wood', 'horses', 'textiles'], ts01MaxRows);
                                if (created) {
                                    targetRows.push(created);
                                }
                            }
                        }

                        if (targetRows.length < transferLines.length) {
                            alert('Cannot apply this Headcount/Train change because TS01 has no free row within the first ' + ts01MaxRows + ' rows.');
                            return null;
                        }

                        for (var rowIdx = 0; rowIdx < targetRows.length; rowIdx++) {
                            var line = transferLines[rowIdx];
                            var row = targetRows[rowIdx];
                            row.turnId = $scope.masterData.turnId;
                            row.from = line.from;
                            row.to = line.to;
                            row.louisdore = line.louisdore || null;
                            row.citizens = line.citizens || null;
                            row.ecPts = line.ecPts || null;
                            row.horses = line.horses || null;
                            row.wood = null;
                            row.textiles = null;
                        }

                        for (var staleIdx = targetRows.length; staleIdx < managedRows.length; staleIdx++) {
                            var staleRow = managedRows[staleIdx];
                            staleRow.turnId = $scope.masterData.turnId;
                            staleRow.from = null;
                            staleRow.to = null;
                            staleRow.louisdore = null;
                            staleRow.citizens = null;
                            staleRow.ecPts = null;
                            staleRow.horses = null;
                            staleRow.wood = null;
                            staleRow.textiles = null;
                        }

                        var nextManaged = targetRows.map(function (row) { return toInt(row.orderNo, 0); }).filter(function (value) { return value > 0; });
                        $scope.saveLandUnitsManagedTs01OrderNos(nextManaged);

                        return turnSheetFactory.postTSRecords(rows, 'TransferGoods');
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.persistHeadcountOrder = function (brigade, scope, targetHeadcount) {
                    var brigadeOrFederation = $scope.getTurnSheetBrigadeOrFederationValue(brigade, scope);
                    if (brigadeOrFederation == null) {
                        return $q.when(null);
                    }
            
                    return turnSheetFactory.getTSIncreaseHeadcount($scope.masterData.turnId).then(function (rows) {
                        rows = rows || [];
                        var targetRow = $scope.findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation)
                            || $scope.findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeOrFederation', 'increaseAmount'], 12);
            
                        if (!targetRow) {
                            alert('No empty TS_05 row is available.');
                            return null;
                        }
            
                        targetRow.turnId = $scope.masterData.turnId;
                        targetRow.brigadeOrFederation = brigadeOrFederation;
                        targetRow.increaseAmount = targetHeadcount;
            
                        return turnSheetFactory.postTSRecords(rows, 'IncreaseHeadcount').then(angular.noop, $scope.showTurnSheetOrderError);
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.clearHeadcountOrder = function (brigade, scope) {
                    var brigadeOrFederation = $scope.getTurnSheetBrigadeOrFederationValue(brigade, scope);
                    if (brigadeOrFederation == null) {
                        return $q.when(null);
                    }
            
                    return turnSheetFactory.getTSIncreaseHeadcount($scope.masterData.turnId).then(function (rows) {
                        rows = rows || [];
                        var targetRow = $scope.findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation);
                        if (!targetRow) {
                            return null;
                        }
            
                        targetRow.turnId = $scope.masterData.turnId;
                        targetRow.brigadeOrFederation = null;
                        targetRow.increaseAmount = null;
            
                        return turnSheetFactory.postTSRecords(rows, 'IncreaseHeadcount').then(angular.noop, $scope.showTurnSheetOrderError);
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.persistTrainOrder = function (brigade, scope) {
                    var brigadeOrFederation = $scope.getTurnSheetBrigadeOrFederationValue(brigade, scope);
                    if (brigadeOrFederation == null) {
                        return $q.when(null);
                    }
            
                    return turnSheetFactory.getTSIncreaseBrigadeXP($scope.masterData.turnId).then(function (rows) {
                        rows = rows || [];
                        var targetRow = $scope.findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation)
                            || $scope.findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeOrFederation'], 16);
            
                        if (!targetRow) {
                            alert('No empty TS_06 row is available.');
                            return null;
                        }
            
                        targetRow.turnId = $scope.masterData.turnId;
                        targetRow.brigadeOrFederation = brigadeOrFederation;
            
                        return turnSheetFactory.postTSRecords(rows, 'IncreaseBrigadeXP').then(angular.noop, $scope.showTurnSheetOrderError);
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.clearTrainOrder = function (brigade, scope) {
                    var brigadeOrFederation = $scope.getTurnSheetBrigadeOrFederationValue(brigade, scope);
                    if (brigadeOrFederation == null) {
                        return $q.when(null);
                    }
            
                    return turnSheetFactory.getTSIncreaseBrigadeXP($scope.masterData.turnId).then(function (rows) {
                        rows = rows || [];
                        var targetRow = $scope.findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation);
                        if (!targetRow) {
                            return null;
                        }
            
                        targetRow.turnId = $scope.masterData.turnId;
                        targetRow.brigadeOrFederation = null;
            
                        return turnSheetFactory.postTSRecords(rows, 'IncreaseBrigadeXP').then(angular.noop, $scope.showTurnSheetOrderError);
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.openHeadcountModal = function (brigade) {
                    if (!brigade) {
                        return;
                    }
            
                    if ($scope.brigadeHasLockedBattalion(brigade)) {
                        $scope.alertLockedTurnOrder('Increase headcount', brigade);
                        return;
                    }
            
                    if (!$scope.isBrigadeAtBarracks(brigade)) {
                        alert('Headcount can only be increased when the brigade is at one of your barracks.');
                        return;
                    }
            
                    $scope.headcountModal.isOpen = true;
                    $scope.headcountModal.brigade = brigade;
                    $scope.headcountModal.targetHeadcount = brigade.headcountPlan ? brigade.headcountPlan.targetHeadcount : 800;
                    $scope.headcountModal.scope = brigade.headcountPlan ? brigade.headcountPlan.scope : 'brigade';
            
                    if ($scope.headcountModal.scope === 'federation' && !$scope.canApplyFederationScope(brigade)) {
                        $scope.headcountModal.scope = 'brigade';
                    }
            
                    $scope.refreshHeadcountPreview();
                };

            $scope.closeHeadcountModal = function () {
                    $scope.headcountModal.isOpen = false;
                    $scope.headcountModal.brigade = null;
                    $scope.headcountModal.preview = $scope.calculateEmptyHeadcountPreview();
                };

            $scope.onHeadcountScopeChanged = function () {
                    if ($scope.headcountModal.scope === 'federation' && !$scope.canApplyFederationScope($scope.headcountModal.brigade)) {
                        $scope.headcountModal.scope = 'brigade';
                    }
                    $scope.refreshHeadcountPreview();
                };

            $scope.refreshHeadcountPreview = function () {
                    var brigade = $scope.headcountModal.brigade;
                    if (!brigade) {
                        $scope.headcountModal.preview = $scope.calculateEmptyHeadcountPreview();
                        return;
                    }
            
                    var targetHeadcount = $scope.normalizeTargetHeadcount($scope.headcountModal.targetHeadcount);
                    var affectedBrigades = $scope.getHeadcountAffectedBrigades(brigade, $scope.headcountModal.scope);
                    $scope.headcountModal.preview = $scope.calculateHeadcountPreview(affectedBrigades, targetHeadcount);
                };

            $scope.applyHeadcountPlan = function () {
                    var brigade = $scope.headcountModal.brigade;
                    if (!brigade) {
                        return;
                    }
            
                    var targetHeadcount = $scope.normalizeTargetHeadcount($scope.headcountModal.targetHeadcount);
                    var scope = $scope.headcountModal.scope === 'federation' && $scope.canApplyFederationScope(brigade) ? 'federation' : 'brigade';
                    var affectedBrigades = $scope.getHeadcountAffectedBrigades(brigade, scope);
                    if ($scope.hasAnyLockedBrigade(affectedBrigades, 'Increase headcount')) {
                        return;
                    }
            
                    angular.forEach(affectedBrigades, function (affectedBrigade) {
                        $scope.applyHeadcountPlanToBrigade(affectedBrigade, targetHeadcount, scope, brigade.id);
                    });
            
                    $scope.persistHeadcountOrder(brigade, scope, targetHeadcount).then(function () {
                        return $scope.syncTransferGoodsForLandUnitsPlans();
                    }, $scope.showTurnSheetOrderError);
                    $scope.closeHeadcountModal();
                };

            $scope.clearHeadcountPlan = function () {
                    var brigade = $scope.headcountModal.brigade;
                    if (!brigade) {
                        return;
                    }
            
                    var scope = $scope.headcountModal.scope === 'federation' && $scope.canApplyFederationScope(brigade) ? 'federation' : 'brigade';
                    var affectedBrigades = $scope.getHeadcountAffectedBrigades(brigade, scope);
                    angular.forEach(affectedBrigades, $scope.clearHeadcountPlanFromBrigade);
            
                    $scope.clearHeadcountOrder(brigade, scope).then(function () {
                        return $scope.syncTransferGoodsForLandUnitsPlans();
                    }, $scope.showTurnSheetOrderError);
                    $scope.closeHeadcountModal();
                };

            $scope.openTrainModal = function (brigade) {
                    if (!brigade) {
                        return;
                    }
            
                    if ($scope.brigadeHasLockedBattalion(brigade)) {
                        $scope.alertLockedTurnOrder('Training', brigade);
                        return;
                    }
            
                    if (!$scope.isBrigadeAtBarracks(brigade)) {
                        alert('Training can only be done when the brigade is at one of your barracks.');
                        return;
                    }
            
                    $scope.trainModal.isOpen = true;
                    $scope.trainModal.brigade = brigade;
                    $scope.trainModal.scope = brigade.trainPlan ? brigade.trainPlan.scope : 'brigade';
            
                    if ($scope.trainModal.scope === 'federation' && !$scope.canApplyFederationScope(brigade)) {
                        $scope.trainModal.scope = 'brigade';
                    }
            
                    $scope.refreshTrainPreview();
                };

            $scope.closeTrainModal = function () {
                    $scope.trainModal.isOpen = false;
                    $scope.trainModal.brigade = null;
                    $scope.trainModal.preview = $scope.calculateEmptyTrainPreview();
                };

            $scope.onTrainScopeChanged = function () {
                    if ($scope.trainModal.scope === 'federation' && !$scope.canApplyFederationScope($scope.trainModal.brigade)) {
                        $scope.trainModal.scope = 'brigade';
                    }
                    $scope.refreshTrainPreview();
                };

            $scope.refreshTrainPreview = function () {
                    var brigade = $scope.trainModal.brigade;
                    if (!brigade) {
                        $scope.trainModal.preview = $scope.calculateEmptyTrainPreview();
                        return;
                    }
            
                    var affectedBrigades = $scope.getHeadcountAffectedBrigades(brigade, $scope.trainModal.scope);
                    $scope.trainModal.preview = $scope.calculateTrainPreview(affectedBrigades);
                };

            $scope.applyTrainPlan = function () {
                    var brigade = $scope.trainModal.brigade;
                    if (!brigade) {
                        return;
                    }
            
                    var scope = $scope.trainModal.scope === 'federation' && $scope.canApplyFederationScope(brigade) ? 'federation' : 'brigade';
                    var affectedBrigades = $scope.getHeadcountAffectedBrigades(brigade, scope);
                    if ($scope.hasAnyLockedBrigade(affectedBrigades, 'Training')) {
                        return;
                    }
            
                    angular.forEach(affectedBrigades, function (affectedBrigade) {
                        $scope.applyTrainPlanToBrigade(affectedBrigade, scope, brigade.id);
                    });
            
                    $scope.persistTrainOrder(brigade, scope).then(function () {
                        return $scope.syncTransferGoodsForLandUnitsPlans();
                    }, $scope.showTurnSheetOrderError);
                    $scope.closeTrainModal();
                };

            $scope.clearTrainPlan = function () {
                    var brigade = $scope.trainModal.brigade;
                    if (!brigade) {
                        return;
                    }
            
                    var scope = $scope.trainModal.scope === 'federation' && $scope.canApplyFederationScope(brigade) ? 'federation' : 'brigade';
                    var affectedBrigades = $scope.getHeadcountAffectedBrigades(brigade, scope);
                    angular.forEach(affectedBrigades, $scope.clearTrainPlanFromBrigade);
            
                    $scope.clearTrainOrder(brigade, scope).then(function () {
                        return $scope.syncTransferGoodsForLandUnitsPlans();
                    }, $scope.showTurnSheetOrderError);
                    $scope.closeTrainModal();
                };

        }
    };
});
