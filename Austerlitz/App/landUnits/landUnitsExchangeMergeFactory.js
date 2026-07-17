"use strict";

austerlitzModule.factory("landUnitsExchangeMergeFactory", function () {
  return {
    attach: function ($scope, turnSheetFactory) {
      $scope.exchangeBattalions = function (
        leftBrigade,
        leftBattalion,
        rightBrigade,
        rightBattalion,
      ) {
        if (
          $scope.isBattalionLockedForOrders(leftBattalion) ||
          $scope.isBattalionLockedForOrders(rightBattalion)
        ) {
          return;
        }

        var leftSnapshot = $scope.copyBattalionBaseline(leftBattalion);
        $scope.copyBattalionBaselineInto(leftBattalion, rightBattalion);
        $scope.copyBattalionBaselineInto(rightBattalion, leftSnapshot);
        $scope.markBattalionLockedForOrders(leftBattalion);
        $scope.markBattalionLockedForOrders(rightBattalion);

        $scope.recalculateBrigadeEffects(leftBrigade);
        $scope.refreshBoardingForBrigadeIfNeeded(leftBrigade);
        if (leftBrigade.id !== rightBrigade.id) {
          $scope.recalculateBrigadeEffects(rightBrigade);
          $scope.refreshBoardingForBrigadeIfNeeded(rightBrigade);
        }
      };

      $scope.mergeBattalions = function (
        sourceBrigade,
        sourceBattalion,
        targetBrigade,
        targetBattalion,
      ) {
        if (
          $scope.isBattalionLockedForOrders(sourceBattalion) ||
          $scope.isBattalionLockedForOrders(targetBattalion)
        ) {
          return;
        }

        var sourceType = $scope.getBattalionMergeType(sourceBattalion);
        var targetType = targetBattalion.type;
        if (!sourceType || !targetType || sourceType !== targetType) {
          return;
        }

        var sourceSize = sourceBattalion.isDemolishedThisTurn
          ? 0
          : parseInt(sourceBattalion.size, 10) || 0;
        var targetSize = parseInt(targetBattalion.size, 10) || 0;
        var sourceEf = sourceBattalion.isDemolishedThisTurn
          ? parseInt(sourceBattalion.demolishedOriginalEf, 10) || 0
          : parseInt(sourceBattalion.originalEf, 10) || 0;
        var targetEf = parseInt(targetBattalion.originalEf, 10) || 0;
        var combinedSize = sourceSize + targetSize;
        var mergedEf =
          combinedSize > 0
            ? Math.floor(
                (sourceSize * sourceEf + targetSize * targetEf) / combinedSize,
              )
            : targetEf;

        targetBattalion.type = targetBattalion.type || sourceType;
        targetBattalion.originalEf = mergedEf;
        targetBattalion.currentEf = mergedEf;
        targetBattalion.baseSize = Math.min(800, combinedSize);
        targetBattalion.size = targetBattalion.baseSize;
        targetBattalion.display = $scope.formatBattalionParts(
          targetBattalion.type,
          targetBattalion.originalEf,
          targetBattalion.size,
        );

        $scope.clearBattalionBaseline(sourceBattalion);
        $scope.markBattalionLockedForOrders(sourceBattalion);
        $scope.markBattalionLockedForOrders(targetBattalion);

        $scope.recalculateBrigadeEffects(sourceBrigade);
        $scope.refreshBoardingForBrigadeIfNeeded(sourceBrigade);
        if (sourceBrigade.id !== targetBrigade.id) {
          $scope.recalculateBrigadeEffects(targetBrigade);
          $scope.refreshBoardingForBrigadeIfNeeded(targetBrigade);
        }
      };


      $scope.persistExchangeBattalionOrder = function (
        leftBrigade,
        leftBattalion,
        rightBrigade,
        rightBattalion,
      ) {
        turnSheetFactory
          .getTSExchangeBattalions($scope.masterData.turnId)
          .then(function (rows) {
            var targetRow =
              $scope.findMatchingExchangeRow(
                rows,
                leftBrigade,
                leftBattalion,
                rightBrigade,
                rightBattalion,
              ) ||
              $scope.findNextEmptyTurnSheetRowWithinLimit(
                rows,
                ["brigadeA", "battA", "brigadeB", "battB"],
                4,
              );

            if (!targetRow) {
              alert("No empty Exchange Battalions row is available.");
              return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.brigadeA = leftBrigade.id;
            targetRow.battA = leftBattalion.slot;
            targetRow.brigadeB = rightBrigade.id;
            targetRow.battB = rightBattalion.slot;

            return turnSheetFactory
              .postTSRecords(rows, "ExchangeBattalions")
              .then(angular.noop, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

      $scope.persistMergeBattalionOrder = function (
        sourceBrigade,
        sourceBattalion,
        targetBrigade,
        targetBattalion,
      ) {
        turnSheetFactory
          .getTSMergeBattalions($scope.masterData.turnId)
          .then(function (rows) {
            var targetRow =
              $scope.findMatchingMergeRow(
                rows,
                sourceBrigade,
                sourceBattalion,
                targetBrigade,
                targetBattalion,
              ) ||
              $scope.findNextEmptyTurnSheetRowWithinLimit(
                rows,
                ["bridageA", "battA", "brigadeB", "battB"],
                8,
              );

            if (!targetRow) {
              alert("No empty Merge Battalions row is available.");
              return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.bridageA = sourceBrigade.id;
            targetRow.battA = sourceBattalion.slot;
            targetRow.brigadeB = targetBrigade.id;
            targetRow.battB = targetBattalion.slot;

            return turnSheetFactory
              .postTSRecords(rows, "MergeBattalions")
              .then(angular.noop, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

      $scope.clearExchangeBattalionOrders = function (
        brigade,
        battalion,
        clearedOrders,
      ) {
        return turnSheetFactory
          .getTSExchangeBattalions($scope.masterData.turnId)
          .then(function (rows) {
            var changed = false;
            angular.forEach(
              $scope.getFilledRowsInOrder(rows, [
                "brigadeA",
                "battA",
                "brigadeB",
                "battB",
              ]),
              function (row) {
                if (
                  !$scope.turnSheetPairIncludesBattalion(
                    row,
                    brigade,
                    battalion,
                    "brigadeA",
                    "battA",
                    "brigadeB",
                    "battB",
                  )
                ) {
                  return;
                }

                $scope.clearTurnSheetPairRow(row, [
                  "brigadeA",
                  "battA",
                  "brigadeB",
                  "battB",
                ]);
                changed = true;
                clearedOrders.push(
                  "Exchange Battalions row " + ((row && row.orderNo) || "?"),
                );
              },
            );

            if (changed) {
              return turnSheetFactory.postTSRecords(rows, "ExchangeBattalions");
            }

            return null;
          });
      };

      $scope.clearMergeBattalionOrders = function (
        brigade,
        battalion,
        clearedOrders,
      ) {
        return turnSheetFactory
          .getTSMergeBattalions($scope.masterData.turnId)
          .then(function (rows) {
            var changed = false;
            angular.forEach(
              $scope.getFilledRowsInOrder(rows, [
                "bridageA",
                "battA",
                "brigadeB",
                "battB",
              ]),
              function (row) {
                if (
                  !$scope.turnSheetPairIncludesBattalion(
                    row,
                    brigade,
                    battalion,
                    "bridageA",
                    "battA",
                    "brigadeB",
                    "battB",
                  )
                ) {
                  return;
                }

                $scope.clearTurnSheetPairRow(row, [
                  "bridageA",
                  "battA",
                  "brigadeB",
                  "battB",
                ]);
                changed = true;
                clearedOrders.push(
                  "Merge Battalions row " + ((row && row.orderNo) || "?"),
                );
              },
            );

            if (changed) {
              return turnSheetFactory.postTSRecords(rows, "MergeBattalions");
            }

            return null;
          });
      };
    },
  };
});
