"use strict";

austerlitzModule.factory("landUnitsReplayFactory", function (boardingSharedFactory) {
  return {
    attach: function ($scope, $q, turnSheetFactory) {
      $scope.replaySetUpAdditionalBrigades = function (rows, warnings) {
        angular.forEach(
          $scope.getFilledRowsInOrder(rows, ["brigadeNo", "battType"]),
          function (row) {
            var brigade = $scope.getBrigadeById(row.brigadeNo);
            var armyItem = $scope.getArmyItemByItemNo(row.battType);
            if (!brigade) {
              $scope.addReplayWarning(
                warnings,
                "TS04",
                row,
                "brigade not found: " + row.brigadeNo,
              );
              return;
            }
            if (!armyItem) {
              $scope.addReplayWarning(
                warnings,
                "TS04",
                row,
                "army item not found: " + row.battType,
              );
              return;
            }

            var targetBattalion = $scope.findFirstFreeBattalion(brigade);
            if (!targetBattalion) {
              $scope.addReplayWarning(
                warnings,
                "TS04",
                row,
                "no free battalion slot for brigade " + row.brigadeNo,
              );
              return;
            }

            $scope.applyAdditionalBattalionPreview(
              brigade,
              targetBattalion,
              armyItem,
            );
          },
        );
      };

      $scope.replayDemolishItems = function (rows, warnings) {
        angular.forEach(
          $scope.getFilledRowsInOrder(rows, ["itemNo", "brigadeNo"]),
          function (row) {
            var reference = $scope.getReplayBattalionRef(row.itemNo, row.brigadeNo);
            if (!reference) {
              $scope.addReplayWarning(
                warnings,
                "TS02",
                row,
                "brigade or battalion slot not found",
              );
              return;
            }

            $scope.applyDemolishBattalionPreview(
              reference.brigade,
              reference.battalion,
            );
          },
        );
      };

      $scope.replayIncreaseHeadcount = function (rows, warnings) {
        angular.forEach(
          $scope.getFilledRowsInOrder(rows, [
            "brigadeOrFederation",
            "increaseAmount",
          ]),
          function (row) {
            var targetHeadcount = $scope.normalizeTargetHeadcount(
              row.increaseAmount,
            );
            var affectedBrigades =
              $scope.getBrigadeOrFederationAffectedBrigades(
                row.brigadeOrFederation,
              );
            if (!affectedBrigades.length) {
              $scope.addReplayWarning(
                warnings,
                "TS05",
                row,
                "brigade/federation not found: " + row.brigadeOrFederation,
              );
              return;
            }

            var scope = $scope.getReplayScope(row.brigadeOrFederation);
            angular.forEach(affectedBrigades, function (brigade) {
              $scope.applyHeadcountPlanToBrigade(
                brigade,
                targetHeadcount,
                scope,
                row.brigadeOrFederation,
              );
            });
          },
        );
      };

      $scope.replayIncreaseBrigadeXP = function (rows, warnings) {
        angular.forEach(
          $scope.getFilledRowsInOrder(rows, ["brigadeOrFederation"]),
          function (row) {
            var affectedBrigades =
              $scope.getBrigadeOrFederationAffectedBrigades(
                row.brigadeOrFederation,
              );
            if (!affectedBrigades.length) {
              $scope.addReplayWarning(
                warnings,
                "TS06",
                row,
                "brigade/federation not found: " + row.brigadeOrFederation,
              );
              return;
            }

            var scope = $scope.getReplayScope(row.brigadeOrFederation);
            angular.forEach(affectedBrigades, function (brigade) {
              $scope.applyTrainPlanToBrigade(
                brigade,
                scope,
                row.brigadeOrFederation,
              );
            });
          },
        );
      };

      $scope.replayBoarding = function (rows, warnings) {
        var filledRows = $scope.getFilledRowsInOrder(rows, ["itemNo", "fleetNo"]);
        var allLandUnits = ($scope.brigadeRows || []).concat(
          $scope.commanderRows || [],
        );
        var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
        var nonLandBoardingItems = {};

        angular.forEach(turnReport.spies || [], function (spy) {
          var spyItemNo = parseInt(spy && spy.itemNo, 10);
          if (!isNaN(spyItemNo)) {
            nonLandBoardingItems[spyItemNo] = true;
          }
        });
        angular.forEach(turnReport.baggageTrains || [], function (tradeRow) {
          var tradeItemNo = parseInt(tradeRow && tradeRow.itemNo, 10);
          if (!isNaN(tradeItemNo)) {
            nonLandBoardingItems[tradeItemNo] = true;
          }
        });

        boardingSharedFactory.replayBoardingAssignments({
          rows: filledRows,
          units: allLandUnits,
          getUnitId: function (unit) {
            return parseInt(unit && unit.id, 10);
          },
          applyAssigned: function (unit, fleetNo) {
            unit.boardingSelected = true;
            unit.boardingFleetNo = fleetNo;
          },
          clearUnassigned: false,
          onUnmatchedAssignment: function (row, itemNo) {
            if (nonLandBoardingItems[itemNo]) {
              return;
            }

            $scope.addReplayWarning(
              warnings,
              "TS20",
              row,
              "unit not found: " + row.itemNo,
            );
          },
        });
      };

      $scope.replayExchangeBattalions = function (rows, warnings) {
        angular.forEach(
          $scope.getFilledRowsInOrder(rows, [
            "brigadeA",
            "battA",
            "brigadeB",
            "battB",
          ]),
          function (row) {
            var left = $scope.getReplayBattalionRef(row.brigadeA, row.battA);
            var right = $scope.getReplayBattalionRef(row.brigadeB, row.battB);
            if (!left || !right) {
              $scope.addReplayWarning(
                warnings,
                "Exchange Battalions",
                row,
                "brigade or battalion slot not found",
              );
              return;
            }
            if (!$scope.isSameCoordinate(left.brigade, right.brigade)) {
              $scope.addReplayWarning(
                warnings,
                "Exchange Battalions",
                row,
                "brigades are not at the same coordinate",
              );
              return;
            }
            if (left.battalion.isNewAddition || right.battalion.isNewAddition) {
              $scope.addReplayWarning(
                warnings,
                "Exchange Battalions",
                row,
                "newly added battalions cannot be exchanged in the same turn",
              );
              return;
            }
            if (
              $scope.isBattalionLockedForOrders(left.battalion) ||
              $scope.isBattalionLockedForOrders(right.battalion)
            ) {
              $scope.addReplayWarning(
                warnings,
                "Exchange Battalions",
                row,
                "battalion already used by Exchange Battalions or Merge Battalions this turn",
              );
              return;
            }

            $scope.exchangeBattalions(
              left.brigade,
              left.battalion,
              right.brigade,
              right.battalion,
            );
          },
        );
      };

      $scope.replayMergeBattalions = function (rows, warnings) {
        angular.forEach(
          $scope.getFilledRowsInOrder(rows, [
            "bridageA",
            "battA",
            "brigadeB",
            "battB",
          ]),
          function (row) {
            var source = $scope.getReplayBattalionRef(row.bridageA, row.battA);
            var target = $scope.getReplayBattalionRef(row.brigadeB, row.battB);
            if (!source || !target) {
              $scope.addReplayWarning(
                warnings,
                "Merge Battalions",
                row,
                "brigade or battalion slot not found",
              );
              return;
            }
            if (!$scope.isSameCoordinate(source.brigade, target.brigade)) {
              $scope.addReplayWarning(
                warnings,
                "Merge Battalions",
                row,
                "brigades are not at the same coordinate",
              );
              return;
            }
            if (
              source.battalion.isNewAddition ||
              target.battalion.isNewAddition
            ) {
              $scope.addReplayWarning(
                warnings,
                "Merge Battalions",
                row,
                "newly added battalions cannot be merged in the same turn",
              );
              return;
            }
            if (
              $scope.isBattalionLockedForOrders(source.battalion) ||
              $scope.isBattalionLockedForOrders(target.battalion)
            ) {
              $scope.addReplayWarning(
                warnings,
                "Merge Battalions",
                row,
                "battalion already used by Exchange Battalions or Merge Battalions this turn",
              );
              return;
            }
            if (
              !$scope.getBattalionMergeType(source.battalion) ||
              !target.battalion.type ||
              $scope.getBattalionMergeType(source.battalion) !==
                target.battalion.type
            ) {
              $scope.addReplayWarning(
                warnings,
                "Merge Battalions",
                row,
                "battalion types do not match",
              );
              return;
            }

            $scope.mergeBattalions(
              source.brigade,
              source.battalion,
              target.brigade,
              target.battalion,
            );
          },
        );
      };

      $scope.replayFormFederations = function (rows, warnings) {
        angular.forEach(
          $scope.getFilledRowsInOrder(rows, ["itemNo", "federation_Fleet"]),
          function (row) {
            var targetFederation = parseInt(row.federation_Fleet, 10);
            if (
              isNaN(targetFederation) ||
              targetFederation < 61 ||
              targetFederation > 90
            ) {
              return;
            }

            var brigade = $scope.getLandUnitById(row.itemNo);
            if (brigade) {
              $scope.setLandUnitFederation(brigade, targetFederation);
              return;
            }

            var affectedBrigades = $scope.getLandUnitsByFederation(row.itemNo);
            if (!affectedBrigades.length) {
              $scope.addReplayWarning(
                warnings,
                "TS14",
                row,
                "land unit/federation not found: " + row.itemNo,
              );
              return;
            }

            angular.forEach(affectedBrigades, function (affectedBrigade) {
              $scope.setLandUnitFederation(
                affectedBrigade,
                targetFederation,
              );
            });
          },
        );
      };

      $scope.addReplayWarning = function (warnings, sectionName, row, detail) {
        warnings.push(
          sectionName +
            " row " +
            ((row && row.orderNo) || "?") +
            ": " +
            detail +
            ".",
        );
      };

      $scope.getBrigadeOrFederationAffectedBrigades = function (value) {
        var parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
          return [];
        }

        var brigade = $scope.getBrigadeById(parsed);
        if (brigade) {
          return [brigade];
        }

        return $scope.getBrigadesByFederation(parsed);
      };

      $scope.getReplayScope = function (value) {
        return $scope.getBrigadeById(value) ? "brigade" : "federation";
      };

      $scope.getReplayBattalionRef = function (brigadeNo, battalionSlot) {
        var brigade = $scope.getBrigadeById(brigadeNo);
        var slot = parseInt(battalionSlot, 10);
        if (
          !brigade ||
          isNaN(slot) ||
          slot < 1 ||
          slot > brigade.battalions.length
        ) {
          return null;
        }

        return {
          brigade: brigade,
          battalion: brigade.battalions[slot - 1],
        };
      };

      $scope.getArmyItemByItemNo = function (itemNo) {
        var parsed = parseInt(itemNo, 10);
        if (isNaN(parsed)) {
          return null;
        }

        for (var i = 0; i < $scope.armyListRows.length; i++) {
          if (parseInt($scope.armyListRows[i].itemNo, 10) === parsed) {
            return $scope.armyListRows[i];
          }
        }

        return null;
      };

      $scope.replayBrigadeTurnOrders = function () {
        if (
          !$scope.masterData ||
          !$scope.masterData.turnId ||
          $scope.masterData.turnId === "Unknown"
        ) {
          return;
        }

        $scope.replayWarnings = [];

        return $q
          .all([
            turnSheetFactory.getTSSetUpAdditionalBrigades(
              $scope.masterData.turnId,
            ),
            turnSheetFactory.getTSDemolishItems($scope.masterData.turnId),
            turnSheetFactory.getTSIncreaseHeadcount($scope.masterData.turnId),
            turnSheetFactory.getTSIncreaseBrigadeXP($scope.masterData.turnId),
            turnSheetFactory.getTSExchangeBattalions($scope.masterData.turnId),
            turnSheetFactory.getTSMergeBattalions($scope.masterData.turnId),
            turnSheetFactory.getTSFormFederations($scope.masterData.turnId),
            turnSheetFactory.getTSBoarding($scope.masterData.turnId),
          ])
          .then(
            function (results) {
              var warnings = [];

              $scope.replaySetUpAdditionalBrigades(results[0], warnings);
              $scope.replayDemolishItems(results[1], warnings);
              $scope.replayIncreaseHeadcount(results[2], warnings);
              $scope.replayIncreaseBrigadeXP(results[3], warnings);
              $scope.replayExchangeBattalions(results[4], warnings);
              $scope.replayMergeBattalions(results[5], warnings);
              $scope.replayFormFederations(results[6], warnings);
              $scope.replayBoarding(results[7], warnings);

              $scope.replayWarnings = warnings;
            },
            function (error) {
              $scope.replayWarnings = [
                error && error.data
                  ? error.data
                  : "Unable to load saved brigade turn orders.",
              ];
            },
          );
      };
    },
  };
});
