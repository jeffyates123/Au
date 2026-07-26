"use strict";

austerlitzModule.directive("existingArmy", function () {
  return {
    restrict: "E",
    scope: {
      masterData: "=",
      modalMode: "=",
      movementSelection: "@",
      onMovementSelect: "&",
      isMovementUnitMoved: "&",
      selectedMovementItemNo: "=?",
      selectedMovementType: "=?",
      pickerPositionFilter: "=?",
      pickerSphereFilter: "=?",
    },
    templateUrl: "/Templates/existingArmyTemplate.html",
    controller: function (
      $scope,
      $q,
      turnDataLoaderService,
      rulesCatalogFactory,
      turnSheetFactory,
      landUnitsStateFactory,
      landUnitsModelFactory,
      landUnitsLocationCostFactory,
      landUnitsDisplayFactory,
      landUnitsFederationSummaryFactory,
      landUnitsEffectsFactory,
      landUnitsTurnSheetFactory,
      landUnitsReplayFactory,
      landUnitsFederationFactory,
      landUnitsHeadcountTrainFactory,
      landUnitsBoardingFactory,
      landUnitsBattalionOrdersFactory,
      landUnitsAddBattalionFactory,
      landUnitsExchangeMergeFactory,
      unitRenameFactory,
      landUnitsUiFactory,
    ) {
      var loadedTurnId = null;

      $scope.modalMode = !!$scope.modalMode;

      angular.extend($scope, landUnitsStateFactory.createExistingArmyState());

      landUnitsModelFactory.attach($scope, rulesCatalogFactory);
      landUnitsLocationCostFactory.attach($scope, rulesCatalogFactory);
      landUnitsDisplayFactory.attach($scope);
      landUnitsFederationSummaryFactory.attach($scope);
      landUnitsEffectsFactory.attach($scope);
      landUnitsTurnSheetFactory.attach($scope, turnSheetFactory);
      landUnitsReplayFactory.attach($scope, $q, turnSheetFactory);
      landUnitsFederationFactory.attach($scope, turnSheetFactory);
      landUnitsHeadcountTrainFactory.attach($scope, turnSheetFactory);
      landUnitsBoardingFactory.attach($scope, turnSheetFactory);
      landUnitsBattalionOrdersFactory.attach($scope, $q);
      landUnitsAddBattalionFactory.attach($scope, turnSheetFactory);
      landUnitsExchangeMergeFactory.attach($scope, turnSheetFactory);
      unitRenameFactory.attach($scope, turnSheetFactory);
      landUnitsUiFactory.attach($scope);

      $scope.isModalMode = function () {
        return !!$scope.modalMode;
      };

      $scope.isMovementSelectionMode = function () {
        return $scope.movementSelection === "true";
      };

      $scope.selectMovementUnit = function (unit, selectionType) {
        if (!unit || !$scope.isMovementSelectionMode()) {
          return;
        }

        if (
          selectionType === "fed" &&
          (unit.fed == null || unit.fed === "")
        ) {
          return;
        }

        $scope.onMovementSelect({
          unit: unit,
          selectionType: selectionType,
        });
      };

      $scope.isMovementUnitSelected = function (unit) {
        if (!unit || !$scope.isMovementSelectionMode()) {
          return false;
        }

        if ($scope.selectedMovementType === "Fed") {
          return (
            unit.fed != null &&
            unit.fed !== "" &&
            unit.fed == $scope.selectedMovementItemNo
          );
        }

        return unit.id == $scope.selectedMovementItemNo;
      };

      $scope.hasMovementOrder = function (unit) {
        return (
          $scope.isMovementSelectionMode() &&
          !!$scope.isMovementUnitMoved({ unit: unit })
        );
      };

      function replayLandUnitRenames() {
        return $scope.replayUnitRenameOrders(function (itemNo) {
          return typeof $scope.getLandUnitById === "function"
            ? $scope.getLandUnitById(itemNo)
            : null;
        });
      }

      function refreshExistingArmyData() {
        $scope.refreshBrigadeRows();
        $scope.refreshCommanderRows();
        return $scope
          .loadArmyListForHeadcountCosts()
          .then($scope.replayBrigadeTurnOrders)
          .then(replayLandUnitRenames);
      }

      $scope.initExistingArmy = function (forceReload) {
        var currentMasterData = $scope.masterData;
        var currentTurnId = currentMasterData && currentMasterData.turnId;

        if (!currentMasterData || !currentTurnId || currentTurnId === "Unknown") {
          $scope.brigadeRows = [];
          $scope.federationSummaryRows = [];
          $scope.federationSummaryPairRows = [];
          $scope.commanderRows = [];
          loadedTurnId = null;
          return $q.when();
        }

        if (!forceReload && loadedTurnId === currentTurnId) {
          return $q.when();
        }

        if (currentMasterData.turnReport && currentMasterData.turnReport.brigades) {
          loadedTurnId = currentTurnId;
          return refreshExistingArmyData();
        }

        $scope.isLoading = true;
        $scope.loadError = null;

        return turnDataLoaderService
          .loadTR(currentMasterData, currentTurnId)
          .then(
            function () {
              loadedTurnId = currentTurnId;
              return refreshExistingArmyData();
            },
            function (error) {
              $scope.loadError =
                error && error.data ? error.data : "Unable to load turn report.";
              $scope.brigadeRows = [];
              $scope.federationSummaryRows = [];
              $scope.federationSummaryPairRows = [];
              $scope.commanderRows = [];
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
          if (!newTurnId || newTurnId === oldTurnId) {
            return;
          }

          $scope.initExistingArmy(true);
        },
      );

      $scope.$watch(
        function () {
          return $scope.masterData && $scope.masterData.turnReport;
        },
        function (newTurnReport, oldTurnReport) {
          if (!newTurnReport || newTurnReport === oldTurnReport) {
            return;
          }

          loadedTurnId = $scope.masterData.turnId;
          refreshExistingArmyData();
        },
      );

      $scope.$watch(
        function () {
          var turnReport = $scope.masterData && $scope.masterData.turnReport;
          if (!turnReport) {
            return "";
          }

          return [
            (turnReport.brigades || []).length,
            (turnReport.commanders || []).length,
          ].join("|");
        },
        function (newRowCounts, oldRowCounts) {
          if (!newRowCounts || newRowCounts === oldRowCounts) {
            return;
          }

          loadedTurnId = $scope.masterData.turnId;
          refreshExistingArmyData();
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
          if (!$scope.isMovementSelectionMode()) {
            return;
          }

          $scope.positionFilter = $scope.pickerPositionFilter || null;
          $scope.selectedSphere = $scope.pickerSphereFilter || "All";
          $scope.refreshCommanderPairRows();
          $scope.refreshFederationSummaryPairRows();
        },
      );

      $scope.initExistingArmy(false);
    },
  };
});
