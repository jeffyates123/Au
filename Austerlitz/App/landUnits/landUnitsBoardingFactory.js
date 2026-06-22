"use strict";

austerlitzModule.factory(
  "landUnitsBoardingFactory",
  function ($q, navyFleetValidationFactory, turnAssignmentResolverFactory) {
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
        return Math.round((parseFloat(value) || 0) * 100) / 100;
      }

      function floorToWhole(value) {
        var parsed = parseFloat(value) || 0;
        return Math.floor(parsed);
      }

      function toLoadCapacityUnits(rawWeight) {
        return roundTo2((parseFloat(rawWeight) || 0) / 1000);
      }

      function getArmyListLookupByShortName() {
        var lookup = {};
        var allArmyItems =
          ($scope.masterData &&
            $scope.masterData.rulesCatalog &&
            ($scope.masterData.rulesCatalog.armyList ||
              $scope.masterData.rulesCatalog.ArmyList)) ||
          [];

        angular.forEach(allArmyItems, function (armyItem) {
          var shortName = toKey(armyItem && armyItem.shortName).toUpperCase();
          if (shortName) {
            lookup[shortName] = armyItem;
          }
        });

        return lookup;
      }

      function getBattalionWeightPerMan(armyItem) {
        if (!armyItem) return 0;
        var itemNo = parseInt(armyItem.itemNo, 10);
        if (armyItem.isCavalry) return 400;
        if (!isNaN(itemNo) && itemNo >= 40) return 600;
        return 200;
      }

      function getBrigadeRawWeight(itemNo) {
        var brigades =
          ($scope.masterData &&
            $scope.masterData.turnReport &&
            $scope.masterData.turnReport.brigades) ||
          [];
        var armyLookup = getArmyListLookupByShortName();

        for (var i = 0; i < brigades.length; i++) {
          if (!($scope.sameNullableInt(brigades[i].itemNo, itemNo))) continue;
          var totalWeight = 0;
          for (var b = 1; b <= 7; b++) {
            var battType = toKey(brigades[i]["batt" + b + "Type"]).toUpperCase();
            var battSize = parseInt(brigades[i]["batt" + b + "Size"], 10) || 0;
            if (!battType || battType === "--" || battSize <= 0) continue;
            totalWeight += battSize * getBattalionWeightPerMan(armyLookup[battType]);
          }
          return totalWeight;
        }

        return 0;
      }

      function getBaggageTrainRawWeight(itemNo) {
        var baggageTrains =
          ($scope.masterData &&
            $scope.masterData.turnReport &&
            $scope.masterData.turnReport.baggageTrains) ||
          [];

        for (var i = 0; i < baggageTrains.length; i++) {
          if (!($scope.sameNullableInt(baggageTrains[i].itemNo, itemNo))) continue;
          var qty1 = parseInt(baggageTrains[i].quantity1, 10) || 0;
          var qty2 = parseInt(baggageTrains[i].quantity2, 10) || 0;
          return 500000 + qty1 + qty2;
        }

        return 0;
      }

      function getBoardedItemLoadCapacity(itemNo) {
        return toLoadCapacityUnits(
          getBrigadeRawWeight(itemNo) || getBaggageTrainRawWeight(itemNo),
        );
      }

      $scope.getFleetUsedCapacityLookup = function (
        boardingRows,
        excludedItemNo,
        includeExcludedItem,
      ) {
        var lookup = {};
        angular.forEach(boardingRows || [], function (row) {
          var fleetNo = parseInt(row && row.fleetNo, 10);
          var itemNo = parseInt(row && row.itemNo, 10);
          if (isNaN(fleetNo) || fleetNo <= 0 || isNaN(itemNo)) return;
          if (
            excludedItemNo != null &&
            !includeExcludedItem &&
            $scope.sameNullableInt(itemNo, excludedItemNo)
          ) {
            return;
          }
          lookup[fleetNo] = roundTo2(
            (lookup[fleetNo] || 0) + getBoardedItemLoadCapacity(itemNo),
          );
        });
        return lookup;
      };

      $scope.getBoardingBrigadeRequiredCapacity = function (brigade) {
        if (!brigade) return 0;
        return getBoardedItemLoadCapacity(brigade.id);
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
            brigade: null,
            fleets: [],
            selectedFleetNo: null,
            currentBrigadeCapacity: 0,
            currentAssignedFleetNo: null,
            hasExistingBoardingOrder: false,
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
        var lookup = {};
        var ships =
          ($scope.masterData &&
            $scope.masterData.rulesCatalog &&
            $scope.masterData.rulesCatalog.ships) ||
          [];

        angular.forEach(ships, function (ship) {
          var key = toKey(ship && ship.type).toUpperCase();
          if (key) {
            lookup[key] = ship;
          }
        });

        return lookup;
      };

      $scope.getConditionAdjustedShipCapacity = function (ship, shipLookupByType) {
        if (!ship) {
          return 0;
        }

        var typeKey = toKey(ship.type).toUpperCase();
        var shipDef = shipLookupByType[typeKey];
        var baseCapacity = toInt(shipDef && shipDef.loadCapacity, 0);
        var condition = parseFloat(ship.condition);
        if (isNaN(condition)) {
          condition = 100;
        }

        return Math.floor(baseCapacity * (condition / 100));
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
        var currentBrigadeCapacity =
          $scope.getBoardingBrigadeRequiredCapacity(brigade);
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
          var shipOptions = [];

          function pushShipOption(ship, kind) {
            if (!ship) {
              return;
            }

            var shipSphere = $scope.getSphereFromCoordinates(ship.x, ship.y);
            var isAssignedShip =
              !isNaN(currentAssignedFleetNo) &&
              $scope.sameNullableInt(shipItemNo, currentAssignedFleetNo);
            if (shipSphere !== brigadeSphere && !isAssignedShip) {
              return;
            }

            var shipItemNo = turnAssignmentResolverFactory.getShipItemNo(ship);
            if (shipItemNo == null || shipItemNo <= 0) {
              return;
            }

            var totalCapacity = $scope.getConditionAdjustedShipCapacity(
              ship,
              shipLookupByType,
            );
            var usedCapacity = roundTo2(usedByShip[shipItemNo] || 0);
            var usedCapacityWhole = floorToWhole(usedCapacity);
            var availableCapacity = totalCapacity - usedCapacityWhole;
            var isCurrentlyAssigned =
              !isNaN(currentAssignedFleetNo) &&
              $scope.sameNullableInt(shipItemNo, currentAssignedFleetNo);

            shipOptions.push({
              fleetNo: shipItemNo,
              warshipCount: kind === "warship" ? 1 : 0,
              merchantCount: kind === "merchant" ? 1 : 0,
              totalShips: 1,
              totalCapacity: totalCapacity,
              usedCapacity: usedCapacity,
              usedCapacityWhole: usedCapacityWhole,
              availableCapacity: availableCapacity,
              remainingCapacity: availableCapacity,
              currentBrigadeCapacity: currentBrigadeCapacity,
              currentBrigadeCapacityWholeUp: Math.ceil(
                currentBrigadeCapacity || 0,
              ),
              wouldExceedForCurrentBrigade: currentBrigadeCapacity > availableCapacity,
              position: toInt(ship.x, 0) + "/" + toInt(ship.y, 0),
              typeLabel: kind === "warship" ? "Warship" : "Merchant",
              warshipType:
                kind === "warship" && ship.type != null && ship.type !== ""
                  ? toKey(ship.type)
                  : "-",
              warshipName:
                kind === "warship" && toKey(ship.name)
                  ? toKey(ship.name)
                  : "-",
              conditionLabel:
                (parseInt(ship.condition, 10) || 100).toString() + "%",
              isIndividualShip: true,
              isCurrentlyAssigned: isCurrentlyAssigned,
            });
          }

          angular.forEach(turnReport.warships || [], function (warship) {
            pushShipOption(warship, "warship");
          });
          angular.forEach(turnReport.merchantShips || [], function (merchant) {
            pushShipOption(merchant, "merchant");
          });

          return shipOptions.sort(function (left, right) {
            return toInt(left.fleetNo, 0) - toInt(right.fleetNo, 0);
          });
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

          var shipSphere = $scope.getSphereFromCoordinates(ship.x, ship.y);
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
            fleet.currentBrigadeCapacity = currentBrigadeCapacity;
            fleet.currentBrigadeCapacityWholeUp = Math.ceil(
              currentBrigadeCapacity || 0,
            );
            fleet.wouldExceedForCurrentBrigade =
              currentBrigadeCapacity > availableCapacity;
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

      $scope.openBoardingModal = function (brigade) {
        if (!brigade) {
          return;
        }

        $scope.ensureBoardingModalState();
        $scope.boardingModal.isOpen = true;
        $scope.boardingModal.isLoading = true;
        $scope.boardingModal.brigade = brigade;
        $scope.boardingModal.currentBrigadeCapacity =
          $scope.getBoardingBrigadeRequiredCapacity(brigade);
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

      $scope.closeBoardingModal = function () {
        $scope.ensureBoardingModalState();
        $scope.boardingModal.isOpen = false;
        $scope.boardingModal.isLoading = false;
        $scope.boardingModal.brigade = null;
        $scope.boardingModal.fleets = [];
        $scope.boardingModal.selectedFleetNo = null;
        $scope.boardingModal.currentBrigadeCapacity = 0;
        $scope.boardingModal.currentAssignedFleetNo = null;
        $scope.boardingModal.hasExistingBoardingOrder = false;
      };

      $scope.findMatchingBoardingRow = function (rows, brigadeId) {
        for (var i = 0; rows && i < rows.length; i++) {
          if ($scope.sameNullableInt(rows[i].itemNo, brigadeId)) {
            return rows[i];
          }
        }

        return null;
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
              $scope.findNextEmptyTurnSheetRowWithinLimit(
                rows,
                ["command", "itemNo", "fleetNo", "fleetOwner"],
                16,
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
            var selectedFleet = null;
            for (var i = 0; i < fleetOptions.length; i++) {
              if ($scope.sameNullableInt(fleetOptions[i].fleetNo, fleetNo)) {
                selectedFleet = fleetOptions[i];
                break;
              }
            }
            if (!selectedFleet) {
              alert("Selected transport is no longer available.");
              return null;
            }
            if (selectedFleet && selectedFleet.wouldExceedForCurrentBrigade) {
              alert("Boarding exceeds fleet loading capacity.");
              return null;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.command = "E";
            targetRow.itemNo = brigade.id;
            targetRow.fleetNo = toInt(fleetNo, null);
            targetRow.fleetOwner = null;

            return turnSheetFactory
              .postTSRecords(rows, "Boarding")
              .then(function () {
                brigade.boardingSelected = true;
                brigade.boardingFleetNo = targetRow.fleetNo;
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
              return null;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.command = null;
            targetRow.itemNo = null;
            targetRow.fleetNo = null;
            targetRow.fleetOwner = null;

            return turnSheetFactory
              .postTSRecords(rows, "Boarding")
              .then(function () {
                brigade.boardingSelected = false;
                brigade.boardingFleetNo = null;
              }, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

      $scope.applyBoardingFleet = function (fleetNo) {
        var brigade = $scope.boardingModal && $scope.boardingModal.brigade;
        if (!brigade) {
          return;
        }

        var fleets = ($scope.boardingModal && $scope.boardingModal.fleets) || [];
        var selectedFleet = null;
        for (var i = 0; i < fleets.length; i++) {
          if ($scope.sameNullableInt(fleets[i].fleetNo, fleetNo)) {
            selectedFleet = fleets[i];
            break;
          }
        }
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
    },
  };
},
);
