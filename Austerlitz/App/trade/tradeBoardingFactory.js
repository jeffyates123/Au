"use strict";

austerlitzModule.factory(
  "tradeBoardingFactory",
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

        $scope.getBoardingUnitRequiredCapacity = function (tradeRow) {
          if (!tradeRow) {
            return 0;
          }
          return getBoardedItemLoadCapacity(tradeRow.id);
        };

        // Backward-compatible alias to keep modal bindings simple.
        $scope.getTradeBoardingRequiredCapacity = function (tradeRow) {
          return $scope.getBoardingUnitRequiredCapacity(tradeRow);
        };

        $scope.getTradeSphere = function (tradeRow) {
          if (!tradeRow) {
            return "Unknown";
          }
          if (tradeRow.boardingSelected && tradeRow.boardingFleetNo != null) {
            return "Unknown";
          }
          return getSphereFromCoordinates(tradeRow.x, tradeRow.y);
        };

        $scope.ensureTradeBoardingModalState = function () {
          if (!$scope.boardingModal) {
            $scope.boardingModal = {
              isOpen: false,
              isLoading: false,
              unit: null,
              trade: null,
              fleets: [],
              selectedFleetNo: null,
              currentUnitCapacity: 0,
              currentTradeCapacity: 0,
              currentAssignedFleetNo: null,
              hasExistingBoardingOrder: false,
            };
          }
        };

        $scope.findMatchingBoardingRow = function (rows, itemNo) {
          return boardingSharedFactory.findMatchingBoardingRow(
            rows,
            itemNo,
            $scope.sameNullableInt,
          );
        };

        $scope.setBoardingModalAssignmentState = function (tradeRow, boardingRows) {
          $scope.ensureTradeBoardingModalState();
          var currentRow = $scope.findMatchingBoardingRow(
            boardingRows,
            tradeRow && tradeRow.id,
          );
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

        $scope.buildTradeBoardingShipOptions = function (tradeRow, boardingRows) {
          if (!tradeRow) {
            return [];
          }

          var tradeSphere = $scope.getTradeSphere(tradeRow);
          var currentAssignedFleetNo = toInt(
            $scope.boardingModal && $scope.boardingModal.currentAssignedFleetNo,
            null,
          );
          var shipLookupByType = $scope.getShipCapacityLookupByType();
          var turnReport = getTurnReport();
          var currentUnitCapacity = $scope.getBoardingUnitRequiredCapacity(tradeRow);
          var usedByShip = $scope.getFleetUsedCapacityLookup(
            boardingRows,
            tradeRow && tradeRow.id,
            false,
          );
          var ships = boardingSharedFactory.collectTurnReportShips(turnReport);

          var shipOptions = boardingSharedFactory.buildIndividualShipOptions({
            ships: ships,
            unitSphere: tradeSphere,
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
            option.currentTradeCapacity = option.currentUnitCapacity;
            option.wouldExceedForCurrentTrade = option.wouldExceedForCurrentUnit;
          });

          return shipOptions;
        };

        $scope.refreshTradeBoardingModalOptions = function (tradeRow, closeWhenEmpty) {
          if (!tradeRow) {
            return $q.when([]);
          }

          return turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
            function (rows) {
              rows = rows || [];
              $scope.setBoardingModalAssignmentState(tradeRow, rows);
              $scope.boardingModal.fleets = $scope.buildTradeBoardingShipOptions(
                tradeRow,
                rows,
              );
              if (
                closeWhenEmpty &&
                (!$scope.boardingModal.fleets || !$scope.boardingModal.fleets.length)
              ) {
                $scope.boardingModal.isOpen = false;
                alert("No eligible ships are available for this baggage train.");
              }
              return $scope.boardingModal.fleets;
            },
            function (error) {
              showTurnSheetOrderError(error);
              return [];
            },
          );
        };

        $scope.openTradeBoardingModal = function (tradeRow) {
          if (!tradeRow) {
            return;
          }

          $scope.ensureTradeBoardingModalState();
          $scope.boardingModal.isOpen = true;
          $scope.boardingModal.isLoading = true;
          $scope.boardingModal.unit = tradeRow;
          $scope.boardingModal.trade = tradeRow;
          $scope.boardingModal.currentUnitCapacity =
            $scope.getBoardingUnitRequiredCapacity(tradeRow);
          $scope.boardingModal.currentTradeCapacity =
            $scope.boardingModal.currentUnitCapacity;
          $scope.boardingModal.fleets = [];
          $scope.boardingModal.selectedFleetNo =
            tradeRow.boardingFleetNo != null ? toKey(tradeRow.boardingFleetNo) : null;
          $scope.boardingModal.currentAssignedFleetNo = null;
          $scope.boardingModal.hasExistingBoardingOrder = false;

          $scope
            .refreshTradeBoardingModalOptions(tradeRow, true)
            .finally(function () {
              $scope.boardingModal.isLoading = false;
            });
        };

        $scope.closeTradeBoardingModal = function () {
          $scope.ensureTradeBoardingModalState();
          $scope.boardingModal.isOpen = false;
          $scope.boardingModal.isLoading = false;
          $scope.boardingModal.unit = null;
          $scope.boardingModal.trade = null;
          $scope.boardingModal.fleets = [];
          $scope.boardingModal.selectedFleetNo = null;
          $scope.boardingModal.currentUnitCapacity = 0;
          $scope.boardingModal.currentTradeCapacity = 0;
          $scope.boardingModal.currentAssignedFleetNo = null;
          $scope.boardingModal.hasExistingBoardingOrder = false;
        };

        $scope.persistTradeBoardingOrder = function (tradeRow, fleetNo) {
          if (!tradeRow || !navyFleetValidationFactory.isAssignedFleetNo(fleetNo)) {
            return $q.when(null);
          }

          return turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
            function (rows) {
              rows = rows || [];
              var targetRow =
                $scope.findMatchingBoardingRow(rows, tradeRow.id) ||
                findNextEmptyTurnSheetRowWithinLimit(
                  rows,
                  ["command", "itemNo", "fleetNo", "fleetOwner"],
                  16,
                );

              if (!targetRow) {
                alert("No empty TS_20 row is available.");
                return null;
              }

              var shipOptions = $scope.buildTradeBoardingShipOptions(tradeRow, rows);
              var selectedShip = boardingSharedFactory.findOptionByFleetNo(
                shipOptions,
                fleetNo,
                $scope.sameNullableInt,
              );
              if (!selectedShip) {
                alert("Selected ship is no longer available.");
                return null;
              }
              if (selectedShip.wouldExceedForCurrentTrade) {
                alert("Boarding exceeds ship loading capacity.");
                return null;
              }

              boardingSharedFactory.writeBoardingRow(
                targetRow,
                $scope.masterData.turnId,
                tradeRow.id,
                fleetNo,
              );

              return turnSheetFactory.postTSRecords(rows, "Boarding").then(
                function () {
                  tradeRow.boardingSelected = true;
                  tradeRow.boardingFleetNo = targetRow.fleetNo;
                  return targetRow;
                },
                showTurnSheetOrderError,
              );
            },
            showTurnSheetOrderError,
          );
        };

        $scope.clearTradeBoardingOrder = function (tradeRow) {
          if (!tradeRow) {
            return $q.when(null);
          }

          return turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
            function (rows) {
              rows = rows || [];
              var targetRow = $scope.findMatchingBoardingRow(rows, tradeRow.id);
              if (!targetRow) {
                tradeRow.boardingSelected = false;
                tradeRow.boardingFleetNo = null;
                return null;
              }

              boardingSharedFactory.clearBoardingRow(
                targetRow,
                $scope.masterData.turnId,
              );

              return turnSheetFactory.postTSRecords(rows, "Boarding").then(
                function () {
                  tradeRow.boardingSelected = false;
                  tradeRow.boardingFleetNo = null;
                  return targetRow;
                },
                showTurnSheetOrderError,
              );
            },
            showTurnSheetOrderError,
          );
        };

        $scope.applyTradeBoardingFleet = function (fleetNo) {
          var tradeRow = $scope.boardingModal && $scope.boardingModal.trade;
          if (!tradeRow) {
            return;
          }

          var fleets = ($scope.boardingModal && $scope.boardingModal.fleets) || [];
          var selectedShip = boardingSharedFactory.findOptionByFleetNo(
            fleets,
            fleetNo,
            $scope.sameNullableInt,
          );
          if (selectedShip && selectedShip.wouldExceedForCurrentTrade) {
            alert("Boarding exceeds ship loading capacity.");
            return;
          }

          $scope.persistTradeBoardingOrder(tradeRow, fleetNo).then(function (result) {
            if (result == null) {
              return;
            }
            $scope.closeTradeBoardingModal();
          });
        };

        $scope.removeTradeBoardingFromModal = function (keepOpenAndRefresh) {
          var tradeRow = $scope.boardingModal && $scope.boardingModal.trade;
          if (!tradeRow) {
            return;
          }

          $scope.clearTradeBoardingOrder(tradeRow).then(function () {
            if (keepOpenAndRefresh) {
              $scope.refreshTradeBoardingModalOptions(tradeRow, false);
              return;
            }
            $scope.closeTradeBoardingModal();
          });
        };

        $scope.handleTradeBoardingRowAction = function (ship) {
          if (!ship) {
            return;
          }

          if (ship.isCurrentlyAssigned) {
            $scope.removeTradeBoardingFromModal(true);
            return;
          }
          $scope.applyTradeBoardingFleet(ship.fleetNo);
        };

        $scope.ensureTradeBoardingModalState();
      },
    };
  },
);
