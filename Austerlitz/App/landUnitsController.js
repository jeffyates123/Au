"use strict";

austerlitzModule.controller(
  "landUnitsController",
  function (
    $scope,
    $q,
    $timeout,
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
    landUnitsBoardingFactory,
    landUnitsBattalionOrdersFactory,
    unitRenameFactory,
    landUnitsUiFactory,
    landUnitsSetUpBrigadesFactory,
  ) {
    $scope.masterData = masterData;
    angular.extend($scope, landUnitsStateFactory.createInitialState());

    landUnitsModelFactory.attach($scope, rulesCatalogFactory);
    landUnitsEffectsFactory.attach($scope);
    landUnitsTurnSheetFactory.attach($scope, turnSheetFactory);
    landUnitsReplayFactory.attach($scope, $q, turnSheetFactory);
    landUnitsFederationFactory.attach($scope, turnSheetFactory);
    landUnitsHeadcountTrainFactory.attach($scope, turnSheetFactory);
    landUnitsBoardingFactory.attach($scope, turnSheetFactory);
    landUnitsBattalionOrdersFactory.attach($scope, $q, turnSheetFactory);
    unitRenameFactory.attach($scope, turnSheetFactory);
    landUnitsUiFactory.attach($scope);
    landUnitsSetUpBrigadesFactory.attach(
      $scope,
      rulesCatalogFactory,
      turnSheetFactory,
    );

    var setUpAutoSavePromises = {};
    $scope.queueSetUpTsSave = function (tsType) {
      if (setUpAutoSavePromises[tsType]) {
        $timeout.cancel(setUpAutoSavePromises[tsType]);
      }
      setUpAutoSavePromises[tsType] = $timeout(function () {
        var records = null;
        if (tsType === "SetUpBrigades") records = $scope.tsSetUpBrigadesList;
        if (tsType === "TransferGoods") records = $scope.tsTransferGoodsList;
        if (!records) return;

        turnSheetFactory
          .postTSRecords(records, tsType)
          .then(function (savedRows) {
            if (tsType === "SetUpBrigades") {
              $scope.tsSetUpBrigadesList =
                $scope.normalizeSetUpBrigadesRows(savedRows);
              $scope.refreshSetUpBrigadesRows();
              // Keep TS01 managed cost rows in sync with server-returned TS03 rows.
              $scope.recalculateTransferGoodsForSetUpBrigades();
            }
            if (tsType === "TransferGoods") {
              $scope.tsTransferGoodsList =
                $scope.normalizeTransferGoodsRows(savedRows);
              $scope.refreshTransferGoodsCostRows();
            }
          });
      }, 120);
    };

    $scope.selectArmyTab = function (tabKey) {
      $scope.activeArmyTab = tabKey || "setUpBrigades";
    };

    $scope.initLandUnits = function () {
      if (
        !$scope.masterData ||
        !$scope.masterData.turnId ||
        $scope.masterData.turnId === "Unknown"
      ) {
        $scope.brigadeRows = [];
        $scope.commanderRows = [];
        return;
      }

      if (
        $scope.masterData.turnReport &&
        $scope.masterData.turnReport.brigades
      ) {
        $scope.refreshBrigadeRows();
        $scope.refreshCommanderRows();
        $scope.buildSetUpDepotOptions();
        $q.all([
          typeof $scope.loadRefStatesForPoliticalSphere === "function"
            ? $scope.loadRefStatesForPoliticalSphere()
            : $q.when([]),
          $scope
            .loadArmyListForHeadcountCosts()
            .then($scope.replayBrigadeTurnOrders),
          $scope.loadSetUpArmyListForTurnState(),
        ]).finally(function () {
          $scope.loadSetUpBrigadesData();
        });
        return;
      }

      $scope.isLoading = true;
      $scope.loadError = null;
      turnDataLoaderService
        .loadTR($scope.masterData, $scope.masterData.turnId)
        .then(
          function () {
            $scope.refreshBrigadeRows();
            $scope.refreshCommanderRows();
            $scope.buildSetUpDepotOptions();
            return $q
              .all([
                typeof $scope.loadRefStatesForPoliticalSphere === "function"
                  ? $scope.loadRefStatesForPoliticalSphere()
                  : $q.when([]),
                $scope
                  .loadArmyListForHeadcountCosts()
                  .then($scope.replayBrigadeTurnOrders),
                $scope.loadSetUpArmyListForTurnState(),
              ])
              .finally(function () {
                $scope.loadSetUpBrigadesData();
              });
          },
          function (error) {
            $scope.loadError =
              error && error.data ? error.data : "Unable to load turn report.";
            $scope.brigadeRows = [];
            $scope.commanderRows = [];
          },
        )
        .finally(function () {
          $scope.isLoading = false;
        });
    };
  },
);
