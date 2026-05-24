'use strict';

austerlitzModule.controller('landUnitsController', function (
    $scope,
    $q,
    masterData,
    turnDataLoaderService,
    rulesCatalogFactory,
    turnSheetFactory,
    landUnitsStateFactory,
    landUnitsModelFactory,
    landUnitsEffectsFactory,
    landUnitsTurnSheetFactory,
    landUnitsReplayFactory,
    landUnitsFederationFactory,
    landUnitsHeadcountTrainFactory,
    landUnitsBattalionOrdersFactory,
    landUnitsRenameFactory,
    landUnitsUiFactory) {

    $scope.masterData = masterData;
    angular.extend($scope, landUnitsStateFactory.createInitialState());

    landUnitsModelFactory.attach($scope, rulesCatalogFactory);
    landUnitsEffectsFactory.attach($scope);
    landUnitsTurnSheetFactory.attach($scope, turnSheetFactory);
    landUnitsReplayFactory.attach($scope, $q, turnSheetFactory);
    landUnitsFederationFactory.attach($scope, turnSheetFactory);
    landUnitsHeadcountTrainFactory.attach($scope, turnSheetFactory);
    landUnitsBattalionOrdersFactory.attach($scope, $q, turnSheetFactory);
    landUnitsRenameFactory.attach($scope, turnSheetFactory);
    landUnitsUiFactory.attach($scope);

    $scope.initLandUnits = function () {
        if (!$scope.masterData || !$scope.masterData.turnId || $scope.masterData.turnId === 'Unknown') {
            $scope.brigadeRows = [];
            return;
        }

        if ($scope.masterData.turnReport && $scope.masterData.turnReport.brigades) {
            $scope.refreshBrigadeRows();
            $scope.loadArmyListForHeadcountCosts().then($scope.replayBrigadeTurnOrders);
            return;
        }

        $scope.isLoading = true;
        $scope.loadError = null;
        turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId).then(function () {
            $scope.refreshBrigadeRows();
            return $scope.loadArmyListForHeadcountCosts().then($scope.replayBrigadeTurnOrders);
        }, function (error) {
            $scope.loadError = (error && error.data) ? error.data : 'Unable to load turn report.';
            $scope.brigadeRows = [];
        }).finally(function () {
            $scope.isLoading = false;
        });
    };
});
