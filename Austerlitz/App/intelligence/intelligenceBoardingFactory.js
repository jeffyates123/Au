"use strict";

austerlitzModule.factory(
  "intelligenceBoardingFactory",
  function (
    $q,
    navyFleetValidationFactory,
    turnAssignmentResolverFactory,
    boardingSharedFactory,
  ) {
    return {
      attach: function ($scope, turnSheetFactory) {
        var toInt = boardingSharedFactory.toInt;
        var toKey = boardingSharedFactory.toKey;

        function getSphereFromCoordinates(x, y) {
          return boardingSharedFactory.getSphereFromCoordinates(x, y);
        }

        function getTurnReport() {
          return ($scope.masterData && $scope.masterData.turnReport) || {};
        }

        function getRulesCatalog() {
          return ($scope.masterData && $scope.masterData.rulesCatalog) || {};
        }

        function getBoardedItemLoadCapacity(itemNo) {
          return boardingSharedFactory.getBoardedItemLoadCapacity(
            getTurnReport(),
            getRulesCatalog(),
            itemNo,
            $scope.sameNullableInt,
          );
        }

        function findNextEmptyTurnSheetRowWithinLimit(rows, fields, maxRows) {
          return boardingSharedFactory.findNextEmptyTurnSheetRowWithinLimit(
            rows,
            fields,
            maxRows,
            $scope.masterData.turnId,
            $scope.sameNullableInt,
          );
        }

        function showTurnSheetOrderError(error) {
          boardingSharedFactory.showTurnSheetOrderError(error);
        }

        $scope.getFleetUsedCapacityLookup = function (
          boardingRows,
          excludedItemNo,
          includeExcludedItem,
        ) {
          return boardingSharedFactory.buildFleetUsedCapacityLookup(
            boardingRows,
            excludedItemNo,
            includeExcludedItem,
            getBoardedItemLoadCapacity,
            $scope.sameNullableInt,
          );
        };

        $scope.getBoardingUnitRequiredCapacity = function () {
          // Match commander behavior: spies do not consume additional loading capacity.
          return 0;
        };

        // Backward compatible alias while templates/factory still refer to spy wording.
        $scope.getSpyBoardingRequiredCapacity = function () {
          return $scope.getBoardingUnitRequiredCapacity();
        };

        $scope.getSpySphere = function (spy) {
          if (!spy) {
            return "Unknown";
          }
          if (spy.boardingSelected && spy.boardingFleetNo != null) {
            return "Unknown";
          }
          return getSphereFromCoordinates(spy.x, spy.y);
        };

        $scope.ensureIntelligenceBoardingModalState = function () {
          if (!$scope.boardingModal) {
            $scope.boardingModal = {
              isOpen: false,
              isLoading: false,
              unit: null,
              spy: null,
              fleets: [],
              selectedFleetNo: null,
              currentUnitCapacity: 0,
              currentSpyCapacity: 0,
              currentAssignedFleetNo: null,
              hasExistingBoardingOrder: false,
            };
          }
        };

        $scope.findMatchingBoardingRow = function (rows, spyId) {
          return boardingSharedFactory.findMatchingBoardingRow(
            rows,
            spyId,
            $scope.sameNullableInt,
          );
        };

        $scope.setBoardingModalAssignmentState = function (spy, boardingRows) {
          $scope.ensureIntelligenceBoardingModalState();
          var currentRow = $scope.findMatchingBoardingRow(boardingRows, spy && spy.id);
          var assignedFleetNo = parseInt(currentRow && currentRow.fleetNo, 10);
          $scope.boardingModal.currentAssignedFleetNo =
            !isNaN(assignedFleetNo) && assignedFleetNo > 0 ? assignedFleetNo : null;
          $scope.boardingModal.hasExistingBoardingOrder =
            $scope.boardingModal.currentAssignedFleetNo != null;
        };

        $scope.getShipCapacityLookupByType = function () {
          return boardingSharedFactory.buildShipCapacityLookupByType(
            $scope.masterData && $scope.masterData.rulesCatalog,
          );
        };

        $scope.getConditionAdjustedShipCapacity = function (ship, shipLookupByType) {
          return boardingSharedFactory.getConditionAdjustedShipCapacity(
            ship,
            shipLookupByType,
          );
        };

        $scope.buildSpyBoardingShipOptions = function (spy, boardingRows) {
          if (!spy) {
            return [];
          }

          var spySphere = $scope.getSpySphere(spy);
          var currentAssignedFleetNo = toInt(
            $scope.boardingModal && $scope.boardingModal.currentAssignedFleetNo,
            null,
          );
          var shipLookupByType = $scope.getShipCapacityLookupByType();
          var turnReport = getTurnReport();
          var currentUnitCapacity = $scope.getBoardingUnitRequiredCapacity();
          var usedByShip = $scope.getFleetUsedCapacityLookup(
            boardingRows,
            spy && spy.id,
            false,
          );
          var ships = boardingSharedFactory.collectTurnReportShips(turnReport);

          var shipOptions = boardingSharedFactory.buildIndividualShipOptions({
            ships: ships,
            unitSphere: spySphere,
            currentAssignedFleetNo: currentAssignedFleetNo,
            usedCapacityLookup: usedByShip,
            currentUnitCapacity: currentUnitCapacity,
            shipLookupByType: shipLookupByType,
            getShipItemNo: turnAssignmentResolverFactory.getShipItemNo,
            sameNullableInt: $scope.sameNullableInt,
            getShipKind: function (ship) {
              return ship && ship.kind;
            },
          });

          angular.forEach(shipOptions, function (option) {
            option.currentSpyCapacity = option.currentUnitCapacity;
            option.wouldExceedForCurrentSpy = option.wouldExceedForCurrentUnit;
          });

          return shipOptions;
        };

        $scope.refreshSpyBoardingModalOptions = function (spy, closeWhenEmpty) {
          if (!spy) {
            return $q.when([]);
          }

          return turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
            function (rows) {
              rows = rows || [];
              $scope.setBoardingModalAssignmentState(spy, rows);
              $scope.boardingModal.fleets = $scope.buildSpyBoardingShipOptions(
                spy,
                rows,
              );
              if (
                closeWhenEmpty &&
                (!$scope.boardingModal.fleets || !$scope.boardingModal.fleets.length)
              ) {
                $scope.boardingModal.isOpen = false;
                alert("No eligible ships are available for this spy.");
              }
              return $scope.boardingModal.fleets;
            },
            function (error) {
              showTurnSheetOrderError(error);
              return [];
            },
          );
        };

        $scope.openSpyBoardingModal = function (spy) {
          if (!spy) {
            return;
          }

          $scope.ensureIntelligenceBoardingModalState();
          $scope.boardingModal.isOpen = true;
          $scope.boardingModal.isLoading = true;
          $scope.boardingModal.unit = spy;
          $scope.boardingModal.spy = spy;
          $scope.boardingModal.currentUnitCapacity =
            $scope.getBoardingUnitRequiredCapacity();
          $scope.boardingModal.currentSpyCapacity =
            $scope.boardingModal.currentUnitCapacity;
          $scope.boardingModal.fleets = [];
          $scope.boardingModal.selectedFleetNo =
            spy.boardingFleetNo != null ? toKey(spy.boardingFleetNo) : null;
          $scope.boardingModal.currentAssignedFleetNo = null;
          $scope.boardingModal.hasExistingBoardingOrder = false;

          $scope
            .refreshSpyBoardingModalOptions(spy, true)
            .finally(function () {
              $scope.boardingModal.isLoading = false;
            });
        };

        $scope.closeSpyBoardingModal = function () {
          $scope.ensureIntelligenceBoardingModalState();
          $scope.boardingModal.isOpen = false;
          $scope.boardingModal.isLoading = false;
          $scope.boardingModal.unit = null;
          $scope.boardingModal.spy = null;
          $scope.boardingModal.fleets = [];
          $scope.boardingModal.selectedFleetNo = null;
          $scope.boardingModal.currentUnitCapacity = 0;
          $scope.boardingModal.currentSpyCapacity = 0;
          $scope.boardingModal.currentAssignedFleetNo = null;
          $scope.boardingModal.hasExistingBoardingOrder = false;
        };

        $scope.persistSpyBoardingOrder = function (spy, fleetNo) {
          if (!spy || !navyFleetValidationFactory.isAssignedFleetNo(fleetNo)) {
            return $q.when(null);
          }

          return turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
            function (rows) {
              rows = rows || [];
              var targetRow =
                $scope.findMatchingBoardingRow(rows, spy.id) ||
                findNextEmptyTurnSheetRowWithinLimit(
                  rows,
                  ["command", "itemNo", "fleetNo", "fleetOwner"],
                  16,
                );

              if (!targetRow) {
                alert("No empty TS_20 row is available.");
                return null;
              }

              var shipOptions = $scope.buildSpyBoardingShipOptions(spy, rows);
              var selectedShip = boardingSharedFactory.findOptionByFleetNo(
                shipOptions,
                fleetNo,
                $scope.sameNullableInt,
              );
              if (!selectedShip) {
                alert("Selected ship is no longer available.");
                return null;
              }
              if (selectedShip.wouldExceedForCurrentSpy) {
                alert("Boarding exceeds ship loading capacity.");
                return null;
              }

              boardingSharedFactory.writeBoardingRow(
                targetRow,
                $scope.masterData.turnId,
                spy.id,
                fleetNo,
              );

              return turnSheetFactory.postTSRecords(rows, "Boarding").then(
                function () {
                  spy.boardingSelected = true;
                  spy.boardingFleetNo = targetRow.fleetNo;
                  return targetRow;
                },
                showTurnSheetOrderError,
              );
            },
            showTurnSheetOrderError,
          );
        };

        $scope.clearSpyBoardingOrder = function (spy) {
          if (!spy) {
            return $q.when(null);
          }

          return turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
            function (rows) {
              rows = rows || [];
              var targetRow = $scope.findMatchingBoardingRow(rows, spy.id);
              if (!targetRow) {
                spy.boardingSelected = false;
                spy.boardingFleetNo = null;
                return null;
              }

              boardingSharedFactory.clearBoardingRow(
                targetRow,
                $scope.masterData.turnId,
              );

              return turnSheetFactory.postTSRecords(rows, "Boarding").then(
                function () {
                  spy.boardingSelected = false;
                  spy.boardingFleetNo = null;
                  return targetRow;
                },
                showTurnSheetOrderError,
              );
            },
            showTurnSheetOrderError,
          );
        };

        $scope.applySpyBoardingFleet = function (fleetNo) {
          var spy = $scope.boardingModal && $scope.boardingModal.spy;
          if (!spy) {
            return;
          }

          var fleets = ($scope.boardingModal && $scope.boardingModal.fleets) || [];
          var selectedShip = boardingSharedFactory.findOptionByFleetNo(
            fleets,
            fleetNo,
            $scope.sameNullableInt,
          );
          if (selectedShip && selectedShip.wouldExceedForCurrentSpy) {
            alert("Boarding exceeds ship loading capacity.");
            return;
          }

          $scope.persistSpyBoardingOrder(spy, fleetNo).then(function (result) {
            if (result == null) {
              return;
            }
            $scope.closeSpyBoardingModal();
          });
        };

        $scope.removeSpyBoardingFromModal = function (keepOpenAndRefresh) {
          var spy = $scope.boardingModal && $scope.boardingModal.spy;
          if (!spy) {
            return;
          }

          $scope.clearSpyBoardingOrder(spy).then(function () {
            if (keepOpenAndRefresh) {
              $scope.refreshSpyBoardingModalOptions(spy, false);
              return;
            }
            $scope.closeSpyBoardingModal();
          });
        };

        $scope.handleSpyBoardingRowAction = function (ship) {
          if (!ship) {
            return;
          }

          if (ship.isCurrentlyAssigned) {
            $scope.removeSpyBoardingFromModal(true);
            return;
          }
          $scope.applySpyBoardingFleet(ship.fleetNo);
        };

        $scope.ensureIntelligenceBoardingModalState();
      },
    };
  },
);
