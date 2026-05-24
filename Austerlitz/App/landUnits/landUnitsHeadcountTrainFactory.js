'use strict';

austerlitzModule.factory('landUnitsHeadcountTrainFactory', function () {
    return {
        attach: function ($scope, turnSheetFactory) {
            $scope.persistHeadcountOrder = function (brigade, scope, targetHeadcount) {
                    var brigadeOrFederation = $scope.getTurnSheetBrigadeOrFederationValue(brigade, scope);
                    if (brigadeOrFederation == null) {
                        return;
                    }
            
                    turnSheetFactory.getTSIncreaseHeadcount($scope.masterData.turnId).then(function (rows) {
                        rows = rows || [];
                        var targetRow = $scope.findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation)
                            || $scope.findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeOrFederation', 'increaseAmount'], 12);
            
                        if (!targetRow) {
                            alert('No empty TS_05 row is available.');
                            return;
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
                        return;
                    }
            
                    turnSheetFactory.getTSIncreaseHeadcount($scope.masterData.turnId).then(function (rows) {
                        rows = rows || [];
                        var targetRow = $scope.findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation);
                        if (!targetRow) {
                            return;
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
                        return;
                    }
            
                    turnSheetFactory.getTSIncreaseBrigadeXP($scope.masterData.turnId).then(function (rows) {
                        rows = rows || [];
                        var targetRow = $scope.findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation)
                            || $scope.findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeOrFederation'], 16);
            
                        if (!targetRow) {
                            alert('No empty TS_06 row is available.');
                            return;
                        }
            
                        targetRow.turnId = $scope.masterData.turnId;
                        targetRow.brigadeOrFederation = brigadeOrFederation;
            
                        return turnSheetFactory.postTSRecords(rows, 'IncreaseBrigadeXP').then(angular.noop, $scope.showTurnSheetOrderError);
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.clearTrainOrder = function (brigade, scope) {
                    var brigadeOrFederation = $scope.getTurnSheetBrigadeOrFederationValue(brigade, scope);
                    if (brigadeOrFederation == null) {
                        return;
                    }
            
                    turnSheetFactory.getTSIncreaseBrigadeXP($scope.masterData.turnId).then(function (rows) {
                        rows = rows || [];
                        var targetRow = $scope.findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation);
                        if (!targetRow) {
                            return;
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
            
                    $scope.persistHeadcountOrder(brigade, scope, targetHeadcount);
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
            
                    $scope.clearHeadcountOrder(brigade, scope);
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
            
                    $scope.persistTrainOrder(brigade, scope);
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
            
                    $scope.clearTrainOrder(brigade, scope);
                    $scope.closeTrainModal();
                };

        }
    };
});
