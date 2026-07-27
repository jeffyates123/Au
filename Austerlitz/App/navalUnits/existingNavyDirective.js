"use strict";

austerlitzModule.directive("existingNavy", function () {
  return {
    restrict: "E",
    scope: {
      masterData: "=",
      modalMode: "=",
      movementSelection: "@",
      selectedMovementItemNo: "=?",
      selectedMovementType: "=?",
      pickerPositionFilter: "=?",
      pickerSphereFilter: "=?",
      onMovementSelect: "&",
      isMovementUnitMoved: "&",
    },
    templateUrl: "/Templates/existingNavyTemplate.html",
    controller: function (
      $scope,
      $q,
      turnDataLoaderService,
      rulesCatalogFactory,
      turnSheetFactory,
      navalUnitsStateFactory,
      navalUnitsModelFactory,
      landUnitsTurnSheetFactory,
      navalUnitsFederationFactory,
      navalUnitsRepairFactory,
      unitRenameFactory,
    ) {
      var loadedTurnId = null;

      $scope.modalMode = !!$scope.modalMode;
      angular.extend($scope, navalUnitsStateFactory.createInitialState());
      navalUnitsModelFactory.attach($scope);
      landUnitsTurnSheetFactory.attach($scope, turnSheetFactory);
      navalUnitsFederationFactory.attach($scope, turnSheetFactory);
      navalUnitsRepairFactory.attach($scope, turnSheetFactory);
      unitRenameFactory.attach($scope, turnSheetFactory);

      $scope.isModalMode = function () {
        return !!$scope.modalMode;
      };

      $scope.isMovementSelectionMode = function () {
        return $scope.movementSelection === "true";
      };

      $scope.selectMovementShip = function (ship, selectionType) {
        if (!ship || !$scope.isMovementSelectionMode()) return;
        if (
          selectionType === "fleet" &&
          (ship.fleet == null || ship.fleet === "")
        ) {
          return;
        }
        $scope.onMovementSelect({ ship: ship, selectionType: selectionType });
      };

      $scope.isMovementShipSelected = function (ship) {
        if (!ship || !$scope.isMovementSelectionMode()) return false;
        if ($scope.selectedMovementType === "Fleet") {
          return ship.fleet == $scope.selectedMovementItemNo;
        }
        return ship.id == $scope.selectedMovementItemNo;
      };

      $scope.hasMovementOrder = function (ship) {
        return (
          $scope.isMovementSelectionMode() &&
          !!$scope.isMovementUnitMoved({ ship: ship })
        );
      };

      $scope.filteredWarshipRows = function () {
        return ($scope.warshipRows || []).filter(
          $scope.matchesNavyPositionOrSphereFilter,
        );
      };

      $scope.filteredMerchantRows = function () {
        return ($scope.merchantRows || []).filter(
          $scope.matchesNavyPositionOrSphereFilter,
        );
      };

      function loadRefShips() {
        var catalog = $scope.masterData && $scope.masterData.rulesCatalog;
        var ships = catalog && (catalog.Ships || catalog.ships);
        if (ships && ships.length) {
          $scope.refShips = ships;
          $scope.buildRefShipsIndex();
          return $q.when();
        }

        return rulesCatalogFactory.getRulesCatalog().then(
          function (loaded) {
            $scope.refShips = (loaded && (loaded.Ships || loaded.ships)) || [];
            $scope.buildRefShipsIndex();
          },
          function () {
            $scope.refShips = [];
            $scope.buildRefShipsIndex();
          },
        );
      }

      function loadBoardingRows() {
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

      function replayWarshipRenames() {
        return $scope.replayUnitRenameOrders(function (itemNo) {
          return $scope.getWarshipById(itemNo);
        });
      }

      function refreshExistingNavyData() {
        $scope.buildWarshipRows();
        $scope.buildMerchantRows();
        return $q
          .all([loadRefShips(), loadBoardingRows(), replayWarshipRenames()])
          .then(function () {
            return $scope.replayNavyFormFederations();
          });
      }

      $scope.initExistingNavy = function (forceReload) {
        var currentMasterData = $scope.masterData;
        var currentTurnId = currentMasterData && currentMasterData.turnId;
        if (!currentMasterData || !currentTurnId || currentTurnId === "Unknown") {
          $scope.warshipRows = [];
          $scope.merchantRows = [];
          $scope.fleetSummaryPairRows = [];
          loadedTurnId = null;
          return $q.when();
        }
        if (!forceReload && loadedTurnId === currentTurnId) return $q.when();

        if (currentMasterData.turnReport && currentMasterData.turnReport.warships) {
          loadedTurnId = currentTurnId;
          return refreshExistingNavyData();
        }

        $scope.isLoading = true;
        $scope.loadError = null;
        return turnDataLoaderService
          .loadTR(currentMasterData, currentTurnId)
          .then(
            function () {
              loadedTurnId = currentTurnId;
              return refreshExistingNavyData();
            },
            function (error) {
              $scope.loadError =
                error && error.data ? error.data : "Unable to load turn report.";
              $scope.warshipRows = [];
              $scope.merchantRows = [];
              $scope.fleetSummaryPairRows = [];
            },
          )
          .finally(function () {
            $scope.isLoading = false;
          });
      };

      $scope.$watch(
        function () {
          return ($scope.masterData && $scope.masterData.turnId) || "";
        },
        function (newTurnId, oldTurnId) {
          if (newTurnId && newTurnId !== oldTurnId) {
            $scope.initExistingNavy(true);
          }
        },
      );

      $scope.$watch(
        function () {
          return $scope.masterData && $scope.masterData.turnReport;
        },
        function (newReport, oldReport) {
          if (newReport && newReport !== oldReport) {
            loadedTurnId = $scope.masterData.turnId;
            refreshExistingNavyData();
          }
        },
      );

      $scope.$watch(
        function () {
          return [
            $scope.pickerPositionFilter || "",
            $scope.pickerSphereFilter || "",
          ].join("|");
        },
        function () {
          if (!$scope.isMovementSelectionMode()) return;
          $scope.navyPositionFilter = $scope.pickerPositionFilter || null;
          $scope.navySphereFilter = $scope.pickerPositionFilter
            ? null
            : $scope.pickerSphereFilter || null;
          $scope.buildFleetSummaryRows();
          $scope.refreshWarshipPairRows();
          $scope.refreshMerchantPairRows();
        },
      );

      $scope.initExistingNavy(false);
    },
  };
});
