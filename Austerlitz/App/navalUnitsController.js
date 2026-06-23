"use strict";

austerlitzModule.controller(
  "navalUnitsController",
  function (
    $scope,
    $q,
    $timeout,
    masterData,
    turnDataLoaderService,
    rulesCatalogFactory,
    turnSheetFactory,
    navalUnitsStateFactory,
    navalUnitsModelFactory,
    landUnitsTurnSheetFactory,
    navalUnitsSetUpFactory,
    navalUnitsFederationFactory,
    navalUnitsRepairFactory,
    unitRenameFactory,
  ) {
    $scope.masterData = masterData;
    angular.extend($scope, navalUnitsStateFactory.createInitialState());

    navalUnitsModelFactory.attach($scope);
    landUnitsTurnSheetFactory.attach($scope, turnSheetFactory);
    unitRenameFactory.attach($scope, turnSheetFactory);
    navalUnitsSetUpFactory.attach($scope, turnSheetFactory);
    navalUnitsFederationFactory.attach($scope, turnSheetFactory);
    navalUnitsRepairFactory.attach($scope, turnSheetFactory);

    var saveAutoSavePromises = {};
    $scope.queueNavySave = function (tsType) {
      if (saveAutoSavePromises[tsType]) {
        $timeout.cancel(saveAutoSavePromises[tsType]);
      }
      saveAutoSavePromises[tsType] = $timeout(function () {
        var records = null;
        if (tsType === "BuildShips") records = $scope.tsNavyBuildList;
        if (tsType === "TransferGoods") records = $scope.tsNavyTransferGoodsList;
        if (!records) return;

        turnSheetFactory
          .postTSRecords(records, tsType)
          .then(function (savedRows) {
            if (tsType === "BuildShips") {
              $scope.tsNavyBuildList =
                $scope.normalizeBuildShipsRows(savedRows);
              $scope.refreshNavyBuildRows();
              $scope.recalculateNavyBuildCostRows();
            }
            if (tsType === "TransferGoods") {
              $scope.tsNavyTransferGoodsList = savedRows || [];
              $scope.refreshNavyTransferGoodsRows();
            }
          });
      }, 120);
    };

    $scope.selectNavyTab = function (tabKey) {
      $scope.activeNavyTab = tabKey || "setUpNavy";
    };

    function replayWarshipRenames() {
      return $scope.replayUnitRenameOrders(function (itemNo) {
        return typeof $scope.getWarshipById === "function"
          ? $scope.getWarshipById(itemNo)
          : null;
      });
    }

    function loadRefShips() {
      var catalog = $scope.masterData && $scope.masterData.rulesCatalog;
      var ships = catalog && (catalog.Ships || catalog.ships);
      if (ships && ships.length) {
        $scope.refShips = ships;
        $scope.buildRefShipsIndex();
        $scope.buildShipTypeOptions();
        return $q.when();
      }
      return rulesCatalogFactory.getRulesCatalog().then(
        function (loaded) {
          var loadedShips =
            (loaded && (loaded.Ships || loaded.ships)) || [];
          $scope.refShips = loadedShips;
          $scope.buildRefShipsIndex();
          $scope.buildShipTypeOptions();
        },
        function () {
          $scope.refShips = [];
          $scope.buildRefShipsIndex();
          $scope.buildShipTypeOptions();
        },
      );
    }

    function loadTsBoardingRows() {
      return turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
        function (rows) {
          $scope.tsBoardingList = rows || [];
          $scope.buildFleetSummaryRows();
        },
        function () {
          $scope.tsBoardingList = [];
          $scope.buildFleetSummaryRows();
        },
      );
    }

    $scope.initNavyUnits = function () {
      if (
        !$scope.masterData ||
        !$scope.masterData.turnId ||
        $scope.masterData.turnId === "Unknown"
      ) {
        $scope.warshipRows = [];
        $scope.merchantRows = [];
        return;
      }

      var refShipsPromise = loadRefShips();
      var tsBoardingPromise = loadTsBoardingRows();

      if (
        $scope.masterData.turnReport &&
        $scope.masterData.turnReport.warships
      ) {
        $scope.buildWarshipRows();
        $scope.buildMerchantRows();
        var replayRenamePromise = replayWarshipRenames();
        $scope.replayNavyFormFederations();
        $scope.buildEligibleShipyardOptions();
        $q.all([refShipsPromise, tsBoardingPromise, replayRenamePromise]).then(function () {
          $scope.loadNavySetUpData();
        });
        return;
      }

      $scope.isLoading = true;
      $scope.loadError = null;
      turnDataLoaderService
        .loadTR($scope.masterData, $scope.masterData.turnId)
        .then(
          function () {
            $scope.buildWarshipRows();
            $scope.buildMerchantRows();
            var replayRenamePromise = replayWarshipRenames();
            $scope.replayNavyFormFederations();
            $scope.buildEligibleShipyardOptions();
            $q.all([refShipsPromise, tsBoardingPromise, replayRenamePromise]).then(function () {
              $scope.loadNavySetUpData();
            });
          },
          function (error) {
            $scope.loadError =
              error && error.data ? error.data : "Unable to load turn report.";
            $scope.warshipRows = [];
            $scope.merchantRows = [];
          },
        )
        .finally(function () {
          $scope.isLoading = false;
        });
    };
  },
);
