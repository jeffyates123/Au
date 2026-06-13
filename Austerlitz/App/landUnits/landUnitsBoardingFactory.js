"use strict";

austerlitzModule.factory("landUnitsBoardingFactory", function ($q) {
  function toInt(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback || 0 : parsed;
  }

  function toKey(value) {
    return value == null ? "" : value.toString().trim();
  }

  function isValidFleetNo(value) {
    var parsed = parseInt(value, 10);
    return !isNaN(parsed) && parsed > 0;
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

      $scope.getFleetUsedCapacityLookup = function (boardingRows, excludedItemNo) {
        var lookup = {};
        angular.forEach(boardingRows || [], function (row) {
          var fleetNo = parseInt(row && row.fleetNo, 10);
          var itemNo = parseInt(row && row.itemNo, 10);
          if (isNaN(fleetNo) || fleetNo <= 0 || isNaN(itemNo)) return;
          if (excludedItemNo != null && $scope.sameNullableInt(itemNo, excludedItemNo)) {
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

      $scope.ensureBoardingModalState = function () {
        if (!$scope.boardingModal) {
          $scope.boardingModal = {
            isOpen: false,
            isLoading: false,
            brigade: null,
            fleets: [],
            selectedFleetNo: null,
            currentBrigadeCapacity: 0,
          };
        }
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

      $scope.buildBoardingFleetOptions = function (brigade, boardingRows) {
        if (!brigade) {
          return [];
        }

        var brigadeSphere = $scope.getBrigadeSphere(brigade);
        if (!brigadeSphere) {
          return [];
        }

        var shipLookupByType = $scope.getShipCapacityLookupByType();
        var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
        var fleetsByNo = {};
        var usedByFleet = $scope.getFleetUsedCapacityLookup(
          boardingRows,
          brigade && brigade.id,
        );
        var currentBrigadeCapacity =
          $scope.getBoardingBrigadeRequiredCapacity(brigade);

        function addShipToFleet(ship, kind) {
          if (!ship) {
            return;
          }

          var fleetNo = toKey(ship.fleetNo);
          if (!isValidFleetNo(fleetNo)) {
            return;
          }

          var shipSphere = $scope.getSphereFromCoordinates(ship.x, ship.y);
          if (shipSphere !== brigadeSphere) {
            return;
          }

          if (!fleetsByNo[fleetNo]) {
            fleetsByNo[fleetNo] = {
              fleetNo: fleetNo,
              warshipCount: 0,
              merchantCount: 0,
              totalShips: 0,
              totalCapacity: 0,
            };
          }

          var fleet = fleetsByNo[fleetNo];
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
            fleet.currentBrigadeCapacity = currentBrigadeCapacity;
            fleet.wouldExceedForCurrentBrigade =
              currentBrigadeCapacity > availableCapacity;
            return fleet;
          })
          .sort(function (left, right) {
            return toInt(left.fleetNo, 0) - toInt(right.fleetNo, 0);
          });
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

        turnSheetFactory
          .getTSBoarding($scope.masterData.turnId)
          .then(function (rows) {
            $scope.boardingModal.fleets = $scope.buildBoardingFleetOptions(
              brigade,
              rows || [],
            );
            if (!$scope.boardingModal.fleets.length) {
              $scope.boardingModal.isOpen = false;
              alert("No available fleets in the same sphere for this brigade.");
            }
          }, $scope.showTurnSheetOrderError)
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
        if (!brigade || !isValidFleetNo(fleetNo)) {
          return $q.when(null);
        }

        return turnSheetFactory
          .getTSBoarding($scope.masterData.turnId)
          .then(function (rows) {
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

            var fleetOptions = $scope.buildBoardingFleetOptions(brigade, rows);
            var selectedFleet = null;
            for (var i = 0; i < fleetOptions.length; i++) {
              if ($scope.sameNullableInt(fleetOptions[i].fleetNo, fleetNo)) {
                selectedFleet = fleetOptions[i];
                break;
              }
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

        $scope.persistBoardingOrder(brigade, fleetNo).then(function () {
          $scope.closeBoardingModal();
        });
      };

      $scope.removeBoardingFromModal = function () {
        var brigade = $scope.boardingModal && $scope.boardingModal.brigade;
        if (!brigade) {
          return;
        }

        $scope.clearBoardingOrder(brigade).then(function () {
          $scope.closeBoardingModal();
        });
      };

      $scope.ensureBoardingModalState();
    },
  };
});
