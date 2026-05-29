'use strict';

austerlitzModule.factory('landUnitsBattalionOrdersFactory', function () {
    return {
        attach: function ($scope, $q, turnSheetFactory) {
            $scope.startBattalionAction = function (actionType, brigade, battalion, $event) {
                    if ($event && $event.preventDefault) $event.preventDefault();
                    if ($event && $event.stopPropagation) $event.stopPropagation();
            
                    if (!brigade || !battalion) {
                        $scope.resetBattalionAction();
                        return;
                    }
            
                    if (!$scope.hasNumericCoordinate(brigade)) {
                        alert('Battalion actions require a brigade at a map coordinate.');
                        $scope.resetBattalionAction();
                        return;
                    }
            
                    if (actionType === 'merge' && !battalion.type) {
                        alert('Choose a non-empty battalion to start a merge.');
                        $scope.resetBattalionAction();
                        return;
                    }
            
                    if (battalion.isNewAddition) {
                        alert('A newly added additional battalion cannot be exchanged or merged in the same turn.');
                        $scope.resetBattalionAction();
                        return;
                    }
            
                    if ($scope.isBattalionLockedForOrders(battalion)) {
                        $scope.alertLockedTurnOrder(actionType === 'merge' ? 'Merge' : 'Exchange', brigade);
                        $scope.resetBattalionAction();
                        return;
                    }
            
                    $scope.battalionAction = {
                        type: actionType,
                        source: { brigade: brigade, battalion: battalion },
                        eligibleKeys: $scope.buildEligibleBattalionKeyMap(actionType, brigade, battalion)
                    };
                };

            $scope.onBattalionLozengeClick = function ($event, brigade, battalion) {
                    if (!$scope.battalionAction.type) {
                        return;
                    }
            
                    if ($event && $event.preventDefault) $event.preventDefault();
            
                    if (!$scope.isBattalionEligibleTarget(brigade, battalion)) {
                        $scope.resetBattalionAction();
                        return;
                    }
            
                    var source = $scope.battalionAction.source;
                    if (!source || $scope.isSameBattalionSlot(source.brigade, source.battalion, brigade, battalion)) {
                        $scope.resetBattalionAction();
                        return;
                    }
            
                    if ($scope.isBattalionLockedForOrders(source.battalion) || $scope.isBattalionLockedForOrders(battalion)) {
                        $scope.alertLockedTurnOrder($scope.battalionAction.type === 'merge' ? 'Merge' : 'Exchange', $scope.isBattalionLockedForOrders(source.battalion) ? source.brigade : brigade);
                        $scope.resetBattalionAction();
                        return;
                    }
            
                    if ($scope.battalionAction.type === 'exchange') {
                        $scope.exchangeBattalions(source.brigade, source.battalion, brigade, battalion);
                        $scope.persistExchangeBattalionOrder(source.brigade, source.battalion, brigade, battalion);
                    }
                    else if ($scope.battalionAction.type === 'merge') {
                        $scope.mergeBattalions(source.brigade, source.battalion, brigade, battalion);
                        $scope.persistMergeBattalionOrder(source.brigade, source.battalion, brigade, battalion);
                    }
            
                    $scope.resetBattalionAction();
                };

            $scope.resetBattalionAction = function () {
                    $scope.battalionAction = {
                        type: null,
                        source: null,
                        eligibleKeys: {}
                    };
                };

            $scope.isBattalionActionSource = function (brigade, battalion) {
                    var source = $scope.battalionAction.source;
                    return !!(source && $scope.isSameBattalionSlot(source.brigade, source.battalion, brigade, battalion));
                };


            $scope.canStartMerge = function (battalion) {
                    return !!(battalion && battalion.type);
                };



            $scope.canUseBarracksAction = function (brigade) {
                    return $scope.isBrigadeAtBarracks(brigade) && !$scope.brigadeHasLockedBattalion(brigade);
                };

            $scope.getBarracksActionTooltip = function (brigade) {
                    if (!$scope.isBrigadeAtBarracks(brigade)) {
                        return 'Brigade must start on a coordinate with a barracks owned by the current state.';
                    }
            
                    if ($scope.brigadeHasLockedBattalion(brigade)) {
                        return 'Brigade contains a battalion already used in Exchange Battalions or Merge Battalions this turn.';
                    }
            
                    return '';
                };

            $scope.getBattalionTitle = function (battalion) {
                    if ($scope.isBattalionLockedForOrders(battalion)) {
                        return 'This battalion has already been used in Exchange Battalions or Merge Battalions this turn.';
                    }
            
                    return battalion && battalion.isEfChanged ? 'EF changed from ' + battalion.originalEf + ' to ' + battalion.currentEf : '';
                };

            $scope.clearBattalionTurnOrder = function (brigade, battalion, $event) {
                    if ($event && $event.preventDefault) $event.preventDefault();
                    if ($event && $event.stopPropagation) $event.stopPropagation();
            
                    if (!brigade || !battalion || !$scope.isBattalionLockedForOrders(battalion)) {
                        return;
                    }
            
                    if (!window.confirm('Clear the Exchange Battalions or Merge Battalions order for this battalion?')) {
                        return;
                    }
            
                    var clearedOrders = [];
                    $q.all([
                        $scope.clearExchangeBattalionOrders(brigade, battalion, clearedOrders),
                        $scope.clearMergeBattalionOrders(brigade, battalion, clearedOrders)
                    ]).then(function () {
                        if (!clearedOrders.length) {
                            alert('No matching Exchange Battalions or Merge Battalions order was found for this battalion.');
                            return;
                        }
            
                        $scope.resetBattalionAction();
                        $scope.refreshBrigadeRows();
                        $scope.loadArmyListForHeadcountCosts().then(function () {
                            $scope.replayBrigadeTurnOrders();
                        });
                        alert('Cleared ' + clearedOrders.join(', ') + '.');
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.openAddBattalionModal = function (brigade, battalion, $event) {
                    if ($event && $event.preventDefault) $event.preventDefault();
                    if ($event && $event.stopPropagation) $event.stopPropagation();
            
                    if (!brigade || !battalion || battalion.type) {
                        return;
                    }
            
                    if ($scope.brigadeHasLockedBattalion(brigade)) {
                        $scope.alertLockedTurnOrder('Set up additional battalion', brigade);
                        return;
                    }
            
                    if (!$scope.findFirstFreeBattalion(brigade)) {
                        alert("can't be done as no space");
                        return;
                    }
            
                    $scope.addBattalionModal.isOpen = true;
                    $scope.addBattalionModal.brigade = brigade;
                    $scope.addBattalionModal.selectedArmyItem = null;
                    $scope.addBattalionModal.cost = $scope.calculateEmptyAdditionalBattalionCost();
                };

            $scope.closeAddBattalionModal = function () {
                    $scope.addBattalionModal.isOpen = false;
                    $scope.addBattalionModal.brigade = null;
                    $scope.addBattalionModal.selectedArmyItem = null;
                    $scope.addBattalionModal.cost = $scope.calculateEmptyAdditionalBattalionCost();
                };

            $scope.getAdditionalBattalionOptions = function () {
                    var brigade = $scope.addBattalionModal.brigade;
                    if (!brigade) {
                        return [];
                    }
            
                    var sphere = $scope.getBrigadeSphere(brigade);
                    return ($scope.armyListRows || []).filter(function (armyItem) {
                        return $scope.isArmyItemValidForAdditionalBattalion(armyItem, sphere);
                    });
                };

            $scope.selectAdditionalBattalion = function (armyItem) {
                    $scope.addBattalionModal.selectedArmyItem = armyItem;
                    $scope.addBattalionModal.cost = $scope.calculateAdditionalBattalionCost(armyItem);
                };

            $scope.saveAdditionalBattalion = function () {
                    var brigade = $scope.addBattalionModal.brigade;
                    var armyItem = $scope.addBattalionModal.selectedArmyItem;
                    var targetBattalion = $scope.findFirstFreeBattalion(brigade);
            
                    if ($scope.brigadeHasLockedBattalion(brigade)) {
                        $scope.alertLockedTurnOrder('Set up additional battalion', brigade);
                        return;
                    }
            
                    if (!brigade || !armyItem || !targetBattalion) {
                        alert("can't be done as no space");
                        return;
                    }
            
                    turnSheetFactory.getTSSetUpAdditionalBrigades($scope.masterData.turnId).then(function (rows) {
                        var targetRow = $scope.findMatchingAdditionalBattalionRow(rows, brigade.id)
                            || $scope.findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeNo', 'battType'], 6);
            
                        if (!targetRow) {
                            alert("can't be done as no space");
                            return;
                        }
            
                        targetRow.turnId = $scope.masterData.turnId;
                        targetRow.brigadeNo = brigade.id;
                        targetRow.battType = armyItem.itemNo;
            
                        turnSheetFactory.postTSRecords(rows, 'SetUpAdditionalBrigades').then(function () {
                            $scope.applyAdditionalBattalionPreview(brigade, targetBattalion, armyItem);
                            $scope.closeAddBattalionModal();
                        }, $scope.showTurnSheetOrderError);
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.buildEligibleBattalionKeyMap = function (actionType, sourceBrigade, sourceBattalion) {
                    var eligible = {};
                    angular.forEach($scope.brigadeRows, function (brigade) {
                        angular.forEach(brigade.battalions, function (battalion) {
                            if ($scope.isSameBattalionSlot(sourceBrigade, sourceBattalion, brigade, battalion)) {
                                return;
                            }
            
                            if (battalion.isNewAddition) {
                                return;
                            }
            
                            if ($scope.isBattalionLockedForOrders(battalion)) {
                                return;
                            }
            
                            if (actionType === 'exchange' && $scope.isSameCoordinate(sourceBrigade, brigade)) {
                                eligible[$scope.getBattalionKey(brigade, battalion)] = true;
                                return;
                            }
            
                            if (actionType === 'merge'
                                && sourceBattalion.type
                                && battalion.type
                                && sourceBattalion.type === battalion.type
                                && $scope.isSameCoordinate(sourceBrigade, brigade)) {
                                eligible[$scope.getBattalionKey(brigade, battalion)] = true;
                            }
                        });
                    });
            
                    return eligible;
                };

            $scope.isBattalionEligibleTarget = function (brigade, battalion) {
                    if (!$scope.battalionAction.type) {
                        return false;
                    }
            
                    return !!$scope.battalionAction.eligibleKeys[$scope.getBattalionKey(brigade, battalion)];
                };

            $scope.isBattalionLockedForOrders = function (battalion) {
                    return !!(battalion && battalion.isLockedByTurnOrder);
                };

            $scope.brigadeHasLockedBattalion = function (brigade) {
                    if (!brigade || !brigade.battalions) {
                        return false;
                    }
            
                    for (var i = 0; i < brigade.battalions.length; i++) {
                        if ($scope.isBattalionLockedForOrders(brigade.battalions[i])) {
                            return true;
                        }
                    }
            
                    return false;
                };

            $scope.hasAnyLockedBrigade = function (brigades, actionName) {
                    for (var i = 0; brigades && i < brigades.length; i++) {
                        if ($scope.brigadeHasLockedBattalion(brigades[i])) {
                            $scope.alertLockedTurnOrder(actionName, brigades[i]);
                            return true;
                        }
                    }
            
                    return false;
                };

            $scope.alertLockedTurnOrder = function (actionName, brigade) {
                    var brigadeLabel = brigade && brigade.id ? ' Brigade ' + brigade.id + ' contains' : ' This action uses';
                    alert(actionName + ' is not possible.' + brigadeLabel + ' a battalion already used in an Exchange Battalions or Merge Battalions order this turn.');
                };

            $scope.markBattalionLockedForOrders = function (battalion) {
                    if (battalion) {
                        battalion.isLockedByTurnOrder = true;
                    }
                };

            $scope.getBattalionKey = function (brigade, battalion) {
                    return brigade.id + ':' + battalion.slot;
                };

            $scope.isSameBattalionSlot = function (leftBrigade, leftBattalion, rightBrigade, rightBattalion) {
                    return !!(leftBrigade && rightBrigade && leftBattalion && rightBattalion
                        && leftBrigade.id === rightBrigade.id
                        && leftBattalion.slot === rightBattalion.slot);
                };

            $scope.isSameCoordinate = function (leftBrigade, rightBrigade) {
                    if (!$scope.hasNumericCoordinate(leftBrigade) || !$scope.hasNumericCoordinate(rightBrigade)) {
                        return false;
                    }
            
                    return $scope.getLandUnitCoordinateX(leftBrigade) === $scope.getLandUnitCoordinateX(rightBrigade)
                        && $scope.getLandUnitCoordinateY(leftBrigade) === $scope.getLandUnitCoordinateY(rightBrigade);
                };

            $scope.hasNumericCoordinate = function (brigade) {
                    if (!brigade || !brigade.source) {
                        return false;
                    }
            
                    return !isNaN($scope.getLandUnitCoordinateX(brigade))
                        && !isNaN($scope.getLandUnitCoordinateY(brigade));
                };

            $scope.getLandUnitCoordinateX = function (unit) {
                    if (!unit || !unit.source) {
                        return NaN;
                    }

                    return parseInt(unit.source.x_OrState != null ? unit.source.x_OrState : unit.source.x, 10);
                };

            $scope.getLandUnitCoordinateY = function (unit) {
                    if (!unit || !unit.source) {
                        return NaN;
                    }

                    return parseInt(unit.source.y_OrFleet != null ? unit.source.y_OrFleet : unit.source.y, 10);
                };

            $scope.exchangeBattalions = function (leftBrigade, leftBattalion, rightBrigade, rightBattalion) {
                    if ($scope.isBattalionLockedForOrders(leftBattalion) || $scope.isBattalionLockedForOrders(rightBattalion)) {
                        return;
                    }
            
                    var leftSnapshot = $scope.copyBattalionBaseline(leftBattalion);
                    $scope.copyBattalionBaselineInto(leftBattalion, rightBattalion);
                    $scope.copyBattalionBaselineInto(rightBattalion, leftSnapshot);
                    $scope.markBattalionLockedForOrders(leftBattalion);
                    $scope.markBattalionLockedForOrders(rightBattalion);
            
                    $scope.recalculateBrigadeEffects(leftBrigade);
                    if (leftBrigade.id !== rightBrigade.id) {
                        $scope.recalculateBrigadeEffects(rightBrigade);
                    }
                };

            $scope.mergeBattalions = function (sourceBrigade, sourceBattalion, targetBrigade, targetBattalion) {
                    if ($scope.isBattalionLockedForOrders(sourceBattalion) || $scope.isBattalionLockedForOrders(targetBattalion)) {
                        return;
                    }
            
                    if (!sourceBattalion.type || !targetBattalion.type || sourceBattalion.type !== targetBattalion.type) {
                        return;
                    }
            
                    var sourceSize = parseInt(sourceBattalion.size, 10) || 0;
                    var targetSize = parseInt(targetBattalion.size, 10) || 0;
                    var sourceEf = parseInt(sourceBattalion.originalEf, 10) || 0;
                    var targetEf = parseInt(targetBattalion.originalEf, 10) || 0;
                    var combinedSize = sourceSize + targetSize;
                    var mergedEf = combinedSize > 0 ? Math.floor(((sourceSize * sourceEf) + (targetSize * targetEf)) / combinedSize) : targetEf;
            
                    targetBattalion.type = targetBattalion.type || sourceBattalion.type;
                    targetBattalion.originalEf = mergedEf;
                    targetBattalion.currentEf = mergedEf;
                    targetBattalion.baseSize = Math.min(800, combinedSize);
                    targetBattalion.size = targetBattalion.baseSize;
                    targetBattalion.display = $scope.formatBattalionParts(targetBattalion.type, targetBattalion.originalEf, targetBattalion.size);
            
                    $scope.clearBattalionBaseline(sourceBattalion);
                    $scope.markBattalionLockedForOrders(sourceBattalion);
                    $scope.markBattalionLockedForOrders(targetBattalion);
            
                    $scope.recalculateBrigadeEffects(sourceBrigade);
                    if (sourceBrigade.id !== targetBrigade.id) {
                        $scope.recalculateBrigadeEffects(targetBrigade);
                    }
                };

            $scope.copyBattalionBaseline = function (battalion) {
                    return {
                        type: battalion.type,
                        originalEf: battalion.originalEf,
                        currentEf: battalion.originalEf,
                        baseSize: battalion.baseSize,
                        size: battalion.size
                    };
                };

            $scope.copyBattalionBaselineInto = function (target, source) {
                    target.type = source.type;
                    target.originalEf = source.originalEf;
                    target.currentEf = source.originalEf;
                    target.baseSize = source.baseSize;
                    target.size = source.size;
                    target.display = target.type ? $scope.formatBattalionParts(target.type, target.originalEf, target.size) : '';
                };

            $scope.clearBattalionBaseline = function (battalion) {
                    battalion.type = '';
                    battalion.originalEf = null;
                    battalion.currentEf = null;
                    battalion.baseSize = null;
                    battalion.size = null;
                    battalion.display = '';
                    battalion.isEfChanged = false;
                    battalion.efDrop = 0;
                    battalion.efIncrease = 0;
                    battalion.isNewAddition = false;
                };

            $scope.findFirstFreeBattalion = function (brigade) {
                    if (!brigade || !brigade.battalions) {
                        return null;
                    }
            
                    for (var i = 0; i < brigade.battalions.length; i++) {
                        if (!brigade.battalions[i].type) {
                            return brigade.battalions[i];
                        }
                    }
            
                    return null;
                };

            $scope.applyAdditionalBattalionPreview = function (brigade, battalion, armyItem) {
                    battalion.type = $scope.trimValue(armyItem.shortName);
                    battalion.originalEf = armyItem.ef;
                    battalion.currentEf = armyItem.ef;
                    battalion.baseSize = 800;
                    battalion.size = 800;
                    battalion.isNewAddition = true;
                    battalion.display = $scope.formatBattalionParts(battalion.type, battalion.originalEf, battalion.size);
                    $scope.recalculateBrigadeEffects(brigade);
                };

            $scope.calculateEmptyAdditionalBattalionCost = function () {
                    return {
                        ld: '',
                        citizens: '',
                        ecPts: '',
                        horses: ''
                    };
                };

            $scope.calculateAdditionalBattalionCost = function (armyItem) {
                    if (!armyItem) {
                        return $scope.calculateEmptyAdditionalBattalionCost();
                    }
            
                    var cost = parseFloat(armyItem.cost);
                    var ecPtsPer25 = parseFloat(armyItem.ecPtsPer25);
                    if (isNaN(cost)) cost = 0;
                    if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;
            
                    return {
                        ld: Math.round(800 * cost * 2),
                        citizens: 800,
                        ecPts: Math.round(Math.ceil(800 / 25) * ecPtsPer25),
                        horses: $scope.isMountedArmyItem(armyItem) ? 800 : ''
                    };
                };

            $scope.isArmyItemValidForAdditionalBattalion = function (armyItem, sphere) {
                    var parsedItemNo = parseInt(armyItem && armyItem.itemNo, 10);
                    if (isNaN(parsedItemNo)) {
                        return false;
                    }
            
                    if (sphere === 'Europe') {
                        if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39) return false;
                        return true;
                    }
            
                    if (parsedItemNo % 2 === 0) return false;
                    if (parsedItemNo === 19) return false;
                    if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39) return sphere === 'Caribbean' || sphere === 'India';
            
                    return true;
                };

            $scope.persistExchangeBattalionOrder = function (leftBrigade, leftBattalion, rightBrigade, rightBattalion) {
                    turnSheetFactory.getTSExchangeBattalions($scope.masterData.turnId).then(function (rows) {
                        var targetRow = $scope.findMatchingExchangeRow(rows, leftBrigade, leftBattalion, rightBrigade, rightBattalion)
                            || $scope.findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeA', 'battA', 'brigadeB', 'battB'], 4);
            
                        if (!targetRow) {
                            alert('No empty Exchange Battalions row is available.');
                            return;
                        }
            
                        targetRow.turnId = $scope.masterData.turnId;
                        targetRow.brigadeA = leftBrigade.id;
                        targetRow.battA = leftBattalion.slot;
                        targetRow.brigadeB = rightBrigade.id;
                        targetRow.battB = rightBattalion.slot;
            
                        return turnSheetFactory.postTSRecords(rows, 'ExchangeBattalions').then(angular.noop, $scope.showTurnSheetOrderError);
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.persistMergeBattalionOrder = function (sourceBrigade, sourceBattalion, targetBrigade, targetBattalion) {
                    turnSheetFactory.getTSMergeBattalions($scope.masterData.turnId).then(function (rows) {
                        var targetRow = $scope.findMatchingMergeRow(rows, sourceBrigade, sourceBattalion, targetBrigade, targetBattalion)
                            || $scope.findNextEmptyTurnSheetRowWithinLimit(rows, ['bridageA', 'battA', 'brigadeB', 'battB'], 8);
            
                        if (!targetRow) {
                            alert('No empty Merge Battalions row is available.');
                            return;
                        }
            
                        targetRow.turnId = $scope.masterData.turnId;
                        targetRow.bridageA = sourceBrigade.id;
                        targetRow.battA = sourceBattalion.slot;
                        targetRow.brigadeB = targetBrigade.id;
                        targetRow.battB = targetBattalion.slot;
            
                        return turnSheetFactory.postTSRecords(rows, 'MergeBattalions').then(angular.noop, $scope.showTurnSheetOrderError);
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.clearExchangeBattalionOrders = function (brigade, battalion, clearedOrders) {
                    return turnSheetFactory.getTSExchangeBattalions($scope.masterData.turnId).then(function (rows) {
                        var changed = false;
                        angular.forEach($scope.getFilledRowsInOrder(rows, ['brigadeA', 'battA', 'brigadeB', 'battB']), function (row) {
                            if (!$scope.turnSheetPairIncludesBattalion(row, brigade, battalion, 'brigadeA', 'battA', 'brigadeB', 'battB')) {
                                return;
                            }
            
                            $scope.clearTurnSheetPairRow(row, ['brigadeA', 'battA', 'brigadeB', 'battB']);
                            changed = true;
                            clearedOrders.push('Exchange Battalions row ' + ((row && row.orderNo) || '?'));
                        });
            
                        if (changed) {
                            return turnSheetFactory.postTSRecords(rows, 'ExchangeBattalions');
                        }
            
                        return null;
                    });
                };

            $scope.clearMergeBattalionOrders = function (brigade, battalion, clearedOrders) {
                    return turnSheetFactory.getTSMergeBattalions($scope.masterData.turnId).then(function (rows) {
                        var changed = false;
                        angular.forEach($scope.getFilledRowsInOrder(rows, ['bridageA', 'battA', 'brigadeB', 'battB']), function (row) {
                            if (!$scope.turnSheetPairIncludesBattalion(row, brigade, battalion, 'bridageA', 'battA', 'brigadeB', 'battB')) {
                                return;
                            }
            
                            $scope.clearTurnSheetPairRow(row, ['bridageA', 'battA', 'brigadeB', 'battB']);
                            changed = true;
                            clearedOrders.push('Merge Battalions row ' + ((row && row.orderNo) || '?'));
                        });
            
                        if (changed) {
                            return turnSheetFactory.postTSRecords(rows, 'MergeBattalions');
                        }
            
                        return null;
                    });
                };

        }
    };
});
