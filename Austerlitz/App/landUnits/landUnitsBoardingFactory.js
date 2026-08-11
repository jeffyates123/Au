"use strict";

austerlitzModule.factory(
  "landUnitsBoardingFactory",
  function (
    $q,
    navyFleetValidationFactory,
    turnAssignmentResolverFactory,
    boardingSharedFactory,
  ) {
  function toInt(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback || 0 : parsed;
  }

  function toKey(value) {
    return value == null ? "" : value.toString().trim();
  }

  return {
    attach: function ($scope, turnSheetFactory) {
      function roundTo2(value) {
        return boardingSharedFactory.roundTo2(value);
      }

      function floorToWhole(value) {
        return boardingSharedFactory.floorToWhole(value);
      }

      function getTurnReport() {
        return ($scope.masterData && $scope.masterData.turnReport) || {};
      }

      function getRulesCatalog() {
        return ($scope.masterData && $scope.masterData.rulesCatalog) || {};
      }

      function getArmyLookupForWeight() {
        // Existing Army loads REF_ArmyList into armyListByShortName.
        // masterData.rulesCatalog does not include armyList, so do not rely on it.
        if (
          $scope.armyListByShortName &&
          Object.keys($scope.armyListByShortName).length > 0
        ) {
          return $scope.armyListByShortName;
        }

        return boardingSharedFactory.buildArmyListLookupByShortName(
          getRulesCatalog(),
        );
      }

      function getBoardedItemLoadCapacity(itemNo) {
        var liveBrigadeWeight = getLiveBrigadeRawWeight(itemNo);
        if (liveBrigadeWeight > 0) {
          return boardingSharedFactory.toLoadCapacityUnits(liveBrigadeWeight);
        }

        var rulesCatalog = getRulesCatalog();
        var armyLookup = getArmyLookupForWeight();
        if (Object.keys(armyLookup).length > 0) {
          rulesCatalog = angular.extend({}, rulesCatalog, {
            armyList: Object.keys(armyLookup).map(function (key) {
              return armyLookup[key];
            }),
          });
        }

        return boardingSharedFactory.getBoardedItemLoadCapacity(
          getTurnReport(),
          rulesCatalog,
          itemNo,
          $scope.sameNullableInt,
        );
      }

      function getLiveBrigadeRawWeight(itemNo) {
        var brigades = $scope.brigadeRows || [];
        var brigade = null;
        for (var i = 0; i < brigades.length; i++) {
          if ($scope.sameNullableInt(brigades[i].id, itemNo)) {
            brigade = brigades[i];
            break;
          }
        }

        if (!brigade || !brigade.battalions) {
          return 0;
        }

        var armyLookup = getArmyLookupForWeight();
        var totalWeight = 0;
        angular.forEach(brigade.battalions, function (battalion) {
          var type = (battalion && battalion.type ? battalion.type : "")
            .toString()
            .trim()
            .toUpperCase();
          var size = parseInt(battalion && battalion.size, 10) || 0;
          if (!type || type === "--" || size <= 0) {
            return;
          }

          totalWeight +=
            size *
            boardingSharedFactory.getBattalionWeightPerMan(armyLookup[type]);
        });

        return totalWeight;
      }

      var unloadDirectionOptions = [
        { value: 1, label: "North" },
        { value: 3, label: "East" },
        { value: 5, label: "South" },
        { value: 7, label: "West" },
        { value: 9, label: "Current Square" },
      ];

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

      $scope.getBoardingUnitRequiredCapacity = function (unit) {
        if (!unit) return 0;
        return getBoardedItemLoadCapacity(unit.id);
      };

      // Backward compatible alias used by existing template bindings.
      $scope.getBoardingBrigadeRequiredCapacity = function (brigade) {
        return $scope.getBoardingUnitRequiredCapacity(brigade);
      };

      $scope.isCommanderBoardingUnit = function (unit) {
        return !!(unit && unit.kind === "commander");
      };

      $scope.getBoardingUnitSphere = function (unit) {
        if (typeof $scope.getLandUnitSphere === "function") {
          return $scope.getLandUnitSphere(unit);
        }
        return $scope.getBrigadeSphere(unit);
      };

      $scope.ensureBoardingModalState = function () {
        if (!$scope.boardingModal) {
          $scope.boardingModal = {
            isOpen: false,
            isLoading: false,
            unit: null,
            brigade: null,
            fleets: [],
            selectedFleetNo: null,
            currentUnitCapacity: 0,
            currentBrigadeCapacity: 0,
            currentAssignedFleetNo: null,
            hasExistingBoardingOrder: false,
          };
        }
      };

      $scope.ensureUnloadDirectionModalState = function () {
        if (!$scope.unloadDirectionModal) {
          $scope.unloadDirectionModal = {
            isOpen: false,
            unit: null,
            options: unloadDirectionOptions,
          };
        }
      };

      $scope.setBoardingModalAssignmentState = function (unit, boardingRows) {
        $scope.ensureBoardingModalState();
        var currentRow = $scope.findMatchingBoardingRow(boardingRows, unit && unit.id);
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

      $scope.buildBoardingFleetOptions = function (
        brigade,
        boardingRows,
        formFederationRows,
        includeCurrentUnitInUsage,
      ) {
        if (!brigade) {
          return [];
        }

        var brigadeSphere = $scope.getBoardingUnitSphere(brigade);
        if (!brigadeSphere) {
          return [];
        }

        var shipLookupByType = $scope.getShipCapacityLookupByType();
        var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
        var currentUnitCapacity = $scope.getBoardingUnitRequiredCapacity(brigade);
        var currentAssignedFleetNo = parseInt(
          $scope.boardingModal && $scope.boardingModal.currentAssignedFleetNo,
          10,
        );

        if ($scope.isCommanderBoardingUnit(brigade)) {
          var usedByShip = $scope.getFleetUsedCapacityLookup(
            boardingRows,
            brigade && brigade.id,
            includeCurrentUnitInUsage,
          );
          var ships = boardingSharedFactory.collectTurnReportShips(turnReport);

          var commanderOptions = boardingSharedFactory.buildIndividualShipOptions({
            ships: ships,
            unitSphere: brigadeSphere,
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

          angular.forEach(commanderOptions, function (option) {
            option.currentBrigadeCapacity = option.currentUnitCapacity;
            option.currentBrigadeCapacityWholeUp = option.currentUnitCapacityWholeUp;
            option.wouldExceedForCurrentBrigade = option.wouldExceedForCurrentUnit;
          });

          return commanderOptions;
        }

        var fleetsByNo = {};
        var usedByFleet = $scope.getFleetUsedCapacityLookup(
          boardingRows,
          brigade && brigade.id,
          includeCurrentUnitInUsage,
        );
        var shipFleetLookup =
          turnAssignmentResolverFactory.buildEffectiveShipFleetLookup(
            (turnReport.warships || []).concat(turnReport.merchantShips || []),
            formFederationRows,
          );

        function addShipToFleet(ship, kind) {
          if (!ship) {
            return;
          }

          var shipItemNo = turnAssignmentResolverFactory.getShipItemNo(ship);
          var effectiveFleetNo =
            shipItemNo != null &&
            Object.prototype.hasOwnProperty.call(shipFleetLookup, shipItemNo)
              ? shipFleetLookup[shipItemNo]
              : turnAssignmentResolverFactory.resolveEffectiveShipFleetNoForShip(
                  ship,
                  formFederationRows,
                );

          var fleetNo = toKey(effectiveFleetNo);
          if (!navyFleetValidationFactory.isAssignedFleetNo(fleetNo)) {
            return;
          }

          var shipSphere = boardingSharedFactory.getSphereFromCoordinates(
            ship.x,
            ship.y,
          );
          var isAssignedFleet =
            !isNaN(currentAssignedFleetNo) &&
            $scope.sameNullableInt(effectiveFleetNo, currentAssignedFleetNo);
          if (shipSphere !== brigadeSphere && !isAssignedFleet) {
            return;
          }

          if (!fleetsByNo[fleetNo]) {
            fleetsByNo[fleetNo] = {
              fleetNo: fleetNo,
              warshipCount: 0,
              merchantCount: 0,
              totalShips: 0,
              totalCapacity: 0,
              x: ship.x,
              y: ship.y,
              hasMixedPosition: false,
            };
          }

          var fleet = fleetsByNo[fleetNo];
          if (
            !$scope.sameNullableInt(fleet.x, ship.x) ||
            !$scope.sameNullableInt(fleet.y, ship.y)
          ) {
            fleet.hasMixedPosition = true;
          }
          if (kind === "warship") {
            fleet.warshipCount += 1;
          } else {
            fleet.merchantCount += 1;
          }
          fleet.totalShips += 1;
          fleet.totalCapacity += $scope.getConditionAdjustedShipCapacity(
            ship,
            shipLookupByType,
          );
        }

        angular.forEach(turnReport.warships || [], function (warship) {
          addShipToFleet(warship, "warship");
        });
        angular.forEach(turnReport.merchantShips || [], function (merchant) {
          addShipToFleet(merchant, "merchant");
        });

        return Object.keys(fleetsByNo)
          .map(function (fleetKey) {
            var fleet = fleetsByNo[fleetKey];
            var fleetNo = parseInt(fleet.fleetNo, 10);
            var usedCapacity = roundTo2(usedByFleet[fleetNo] || 0);
            var availableCapacity = roundTo2(fleet.totalCapacity - usedCapacity);
            var usedCapacityWhole = floorToWhole(usedCapacity);

            fleet.usedCapacity = usedCapacity;
            fleet.usedCapacityWhole = usedCapacityWhole;
            fleet.availableCapacity = fleet.totalCapacity - usedCapacityWhole;
            fleet.remainingCapacity = availableCapacity;
            fleet.position =
              fleet.hasMixedPosition || fleet.x == null || fleet.y == null
                ? "Mixed"
                : toInt(fleet.x, 0) + "/" + toInt(fleet.y, 0);
            fleet.currentUnitCapacity = currentUnitCapacity;
            fleet.currentBrigadeCapacity = currentUnitCapacity;
            fleet.currentBrigadeCapacityWholeUp = Math.ceil(
              currentUnitCapacity || 0,
            );
            fleet.wouldExceedForCurrentBrigade =
              currentUnitCapacity > availableCapacity;
            fleet.isCurrentlyAssigned =
              !isNaN(currentAssignedFleetNo) &&
              $scope.sameNullableInt(fleet.fleetNo, currentAssignedFleetNo);
            return fleet;
          })
          .sort(function (left, right) {
            return toInt(left.fleetNo, 0) - toInt(right.fleetNo, 0);
          });
      };

      $scope.refreshBoardingModalOptions = function (unit, closeWhenEmpty) {
        return $q
          .all([
            turnSheetFactory.getTSBoarding($scope.masterData.turnId),
            turnSheetFactory.getTSFormFederations($scope.masterData.turnId),
          ])
          .then(function (results) {
            var rows = results[0] || [];
            var formFederationRows = results[1] || [];
            $scope.setBoardingModalAssignmentState(unit, rows);
            $scope.boardingModal.fleets = $scope.buildBoardingFleetOptions(
              unit,
              rows,
              formFederationRows,
              true,
            );
            if (
              closeWhenEmpty !== false &&
              (!$scope.boardingModal.fleets || !$scope.boardingModal.fleets.length)
            ) {
              $scope.boardingModal.isOpen = false;
              alert(
                $scope.isCommanderBoardingUnit(unit)
                  ? "No individual ships in the same sphere for this commander."
                  : "No available fleets in the same sphere for this brigade.",
              );
            }
          }, $scope.showTurnSheetOrderError);
      };

      $scope.openBoardingSelectionModal = function (brigade) {
        if (!brigade) {
          return;
        }

        $scope.ensureBoardingModalState();
        $scope.boardingModal.isOpen = true;
        $scope.boardingModal.isLoading = true;
        $scope.boardingModal.unit = brigade;
        $scope.boardingModal.brigade = brigade;
        $scope.boardingModal.currentUnitCapacity =
          $scope.getBoardingUnitRequiredCapacity(brigade);
        $scope.boardingModal.currentBrigadeCapacity =
          $scope.boardingModal.currentUnitCapacity;
        $scope.boardingModal.fleets = [];
        $scope.boardingModal.selectedFleetNo =
          brigade.boardingFleetNo != null ? toKey(brigade.boardingFleetNo) : null;
        $scope.boardingModal.currentAssignedFleetNo = null;
        $scope.boardingModal.hasExistingBoardingOrder = false;

        $scope.refreshBoardingModalOptions(brigade, true)
          .finally(function () {
            $scope.boardingModal.isLoading = false;
          });
      };

      function resolveCurrentLoadedFleetNo(unit, row) {
        var rowFleetNo = parseInt(row && row.fleetNo, 10);
        if (!isNaN(rowFleetNo) && rowFleetNo > 0) {
          return rowFleetNo;
        }

        var unitFleetNo = parseInt(unit && unit.boardingFleetNo, 10);
        if (!isNaN(unitFleetNo) && unitFleetNo > 0) {
          return unitFleetNo;
        }

        return null;
      }

      $scope.closeBoardingModal = function () {
        $scope.ensureBoardingModalState();
        $scope.boardingModal.isOpen = false;
        $scope.boardingModal.isLoading = false;
        $scope.boardingModal.unit = null;
        $scope.boardingModal.brigade = null;
        $scope.boardingModal.fleets = [];
        $scope.boardingModal.selectedFleetNo = null;
        $scope.boardingModal.currentUnitCapacity = 0;
        $scope.boardingModal.currentBrigadeCapacity = 0;
        $scope.boardingModal.currentAssignedFleetNo = null;
        $scope.boardingModal.hasExistingBoardingOrder = false;
      };

      $scope.closeUnloadDirectionModal = function () {
        $scope.ensureUnloadDirectionModalState();
        $scope.unloadDirectionModal.isOpen = false;
        $scope.unloadDirectionModal.unit = null;
      };

      $scope.findMatchingBoardingRow = function (rows, brigadeId) {
        return boardingSharedFactory.findMatchingBoardingRow(
          rows,
          brigadeId,
          $scope.sameNullableInt,
        );
      };

      $scope.persistBoardingOrder = function (brigade, fleetNo) {
        if (!brigade || !navyFleetValidationFactory.isAssignedFleetNo(fleetNo)) {
          return $q.when(null);
        }

        return $q
          .all([
            turnSheetFactory.getTSBoarding($scope.masterData.turnId),
            turnSheetFactory.getTSFormFederations($scope.masterData.turnId),
          ])
          .then(function (results) {
            var rows = results[0] || [];
            var formFederationRows = results[1] || [];
            rows = rows || [];
            var targetRow =
              $scope.findMatchingBoardingRow(rows, brigade.id) ||
              boardingSharedFactory.findNextEmptyTurnSheetRowWithinLimit(
                rows,
                ["command", "itemNo", "fleetNo", "fleetOwner"],
                16,
                $scope.masterData.turnId,
                $scope.sameNullableInt,
              );

            if (!targetRow) {
              alert("No empty TS_20 row is available.");
              return null;
            }

            var fleetOptions = $scope.buildBoardingFleetOptions(
              brigade,
              rows,
              formFederationRows,
              false,
            );
            var selectedFleet = boardingSharedFactory.findOptionByFleetNo(
              fleetOptions,
              fleetNo,
              $scope.sameNullableInt,
            );
            if (!selectedFleet) {
              alert("Selected transport is no longer available.");
              return null;
            }
            if (selectedFleet && selectedFleet.wouldExceedForCurrentBrigade) {
              alert("Boarding exceeds fleet loading capacity.");
              return null;
            }

            boardingSharedFactory.writeBoardingRow(
              targetRow,
              $scope.masterData.turnId,
              brigade.id,
              fleetNo,
            );

            return turnSheetFactory
              .postTSRecords(rows, "Boarding")
              .then(function () {
                brigade.boardingSelected = true;
                brigade.boardingFleetNo = targetRow.fleetNo;
                brigade.unloadDirection = null;
              }, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

      $scope.clearBoardingOrder = function (brigade) {
        if (!brigade) {
          return $q.when(null);
        }

        return turnSheetFactory
          .getTSBoarding($scope.masterData.turnId)
          .then(function (rows) {
            rows = rows || [];
            var targetRow = $scope.findMatchingBoardingRow(rows, brigade.id);
            if (!targetRow) {
              brigade.boardingSelected = false;
              brigade.boardingFleetNo = null;
              brigade.unloadDirection = null;
              return null;
            }

            boardingSharedFactory.clearBoardingRow(
              targetRow,
              $scope.masterData.turnId,
            );

            return turnSheetFactory
              .postTSRecords(rows, "Boarding")
              .then(function () {
                brigade.boardingSelected = false;
                brigade.boardingFleetNo = null;
                brigade.unloadDirection = null;
              }, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

      $scope.persistUnloadDirectionOrder = function (unit, direction, fixedFleetNo) {
        var unloadDirection = boardingSharedFactory.parseUnloadDirection(direction);
        if (!unit || unloadDirection == null) {
          return $q.when(null);
        }

        return turnSheetFactory
          .getTSBoarding($scope.masterData.turnId)
          .then(function (rows) {
            rows = rows || [];
            var targetRow =
              $scope.findMatchingBoardingRow(rows, unit.id) ||
              boardingSharedFactory.findNextEmptyTurnSheetRowWithinLimit(
                rows,
                ["command", "itemNo", "fleetNo", "fleetOwner"],
                16,
                $scope.masterData.turnId,
                $scope.sameNullableInt,
              );
            if (!targetRow) {
              alert("No empty TS_20 row is available.");
              return null;
            }

            var loadedFleetNo = resolveCurrentLoadedFleetNo(unit, targetRow);
            if (fixedFleetNo != null) {
              loadedFleetNo = parseInt(fixedFleetNo, 10);
            }
            if (!navyFleetValidationFactory.isAssignedFleetNo(loadedFleetNo)) {
              alert("Loaded ship/fleet number is not available.");
              return null;
            }

            boardingSharedFactory.writeUnloadDirectionRow(
              targetRow,
              $scope.masterData.turnId,
              unit.id,
              loadedFleetNo,
              unloadDirection,
            );

            return turnSheetFactory.postTSRecords(rows, "Boarding").then(
              function () {
                unit.boardingSelected = true;
                unit.boardingFleetNo = loadedFleetNo;
                unit.unloadDirection = unloadDirection;
                return targetRow;
              },
              $scope.showTurnSheetOrderError,
            );
          }, $scope.showTurnSheetOrderError);
      };

      $scope.clearUnloadDirectionOrder = function (unit) {
        if (!unit) {
          return $q.when(null);
        }

        return turnSheetFactory
          .getTSBoarding($scope.masterData.turnId)
          .then(function (rows) {
            rows = rows || [];
            var targetRow = $scope.findMatchingBoardingRow(rows, unit.id);
            if (!targetRow || !boardingSharedFactory.isUnloadDirectionCommand(targetRow)) {
              unit.unloadDirection = null;
              return null;
            }

            boardingSharedFactory.clearBoardingRow(
              targetRow,
              $scope.masterData.turnId,
            );

            return turnSheetFactory.postTSRecords(rows, "Boarding").then(
              function () {
                unit.unloadDirection = null;
                return targetRow;
              },
              $scope.showTurnSheetOrderError,
            );
          }, $scope.showTurnSheetOrderError);
      };

      $scope.openUnloadDirectionModal = function (unit) {
        if (!unit) {
          return;
        }
        $scope.ensureUnloadDirectionModalState();
        $scope.unloadDirectionModal.isOpen = true;
        $scope.unloadDirectionModal.unit = unit;
      };

      $scope.selectUnloadDirection = function (direction) {
        var modalUnit = $scope.unloadDirectionModal && $scope.unloadDirectionModal.unit;
        if (!modalUnit) {
          return;
        }

        $scope.persistUnloadDirectionOrder(modalUnit, direction).then(function (result) {
          if (result == null) {
            return;
          }
          $scope.closeUnloadDirectionModal();
        });
      };

      $scope.openBoardingModal = function (unit) {
        if (!unit) {
          return;
        }

        turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
          function (rows) {
            rows = rows || [];
            var currentRow = $scope.findMatchingBoardingRow(rows, unit.id);

            if (boardingSharedFactory.isUnloadDirectionCommand(currentRow)) {
              $scope.clearUnloadDirectionOrder(unit);
              return;
            }

            if (boardingSharedFactory.isBoardingCommandE(currentRow)) {
              $scope.clearBoardingOrder(unit);
              return;
            }

            var loadedFleetNo = resolveCurrentLoadedFleetNo(unit, currentRow);
            if (navyFleetValidationFactory.isAssignedFleetNo(loadedFleetNo)) {
              $scope.openUnloadDirectionModal(unit);
              return;
            }

            $scope.openBoardingSelectionModal(unit);
          },
          $scope.showTurnSheetOrderError,
        );
      };

      $scope.applyBoardingFleet = function (fleetNo) {
        var brigade = $scope.boardingModal && $scope.boardingModal.brigade;
        if (!brigade) {
          return;
        }

        var fleets = ($scope.boardingModal && $scope.boardingModal.fleets) || [];
        var selectedFleet = boardingSharedFactory.findOptionByFleetNo(
          fleets,
          fleetNo,
          $scope.sameNullableInt,
        );
        if (selectedFleet && selectedFleet.wouldExceedForCurrentBrigade) {
          alert("Boarding exceeds fleet loading capacity.");
          return;
        }

        $scope.persistBoardingOrder(brigade, fleetNo).then(function (result) {
          if (result == null) {
            return;
          }
          $scope.closeBoardingModal();
        });
      };

      $scope.removeBoardingFromModal = function (keepOpenAndRefresh) {
        var brigade = $scope.boardingModal && $scope.boardingModal.brigade;
        if (!brigade) {
          return;
        }

        $scope.clearBoardingOrder(brigade).then(function () {
          if (keepOpenAndRefresh) {
            $scope.refreshBoardingModalOptions(brigade, false);
            return;
          }
          $scope.closeBoardingModal();
        });
      };

      $scope.handleBoardingRowAction = function (fleet) {
        if (!fleet) {
          return;
        }
        if (fleet.isCurrentlyAssigned) {
          $scope.removeBoardingFromModal(true);
          return;
        }
        $scope.applyBoardingFleet(fleet.fleetNo);
      };

      $scope.ensureBoardingModalState();
      $scope.ensureUnloadDirectionModalState();
    },
  };
},
);
