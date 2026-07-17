"use strict";

austerlitzModule.factory("landUnitsAddBattalionFactory", function () {
  return {
    attach: function ($scope, turnSheetFactory) {
      $scope.canDemolishBattalion = function (battalion) {
        return !!(
          battalion &&
          !battalion.isDemolishedThisTurn &&
          !$scope.isBattalionLockedForOrders(battalion) &&
          !battalion.isNewAddition &&
          (battalion.type || battalion.demolishedType)
        );
      };

      $scope.demolishBattalion = function (brigade, battalion, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if (!brigade || !battalion || !$scope.canDemolishBattalion(battalion)) {
          return;
        }

        turnSheetFactory
          .getTSDemolishItems($scope.masterData.turnId)
          .then(function (rows) {
            var targetRow =
              $scope.findMatchingDemolishRow(rows, brigade.id, battalion.slot) ||
              $scope.findNextEmptyTurnSheetRowWithinLimit(
                rows,
                ["itemNo", "brigadeNo"],
                6,
              );

            if (!targetRow) {
              alert("No empty Demolish Items row is available.");
              return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.itemNo = brigade.id;
            targetRow.brigadeNo = battalion.slot;

            return turnSheetFactory
              .postTSRecords(rows, "DemolishItems")
              .then(function () {
                $scope.applyDemolishBattalionPreview(brigade, battalion);
              }, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

      $scope.cancelDemolishBattalion = function (brigade, battalion, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if (!brigade || !battalion || !battalion.isDemolishedThisTurn) {
          return;
        }

        turnSheetFactory
          .getTSDemolishItems($scope.masterData.turnId)
          .then(function (rows) {
            var row = $scope.findMatchingDemolishRow(
              rows,
              brigade.id,
              battalion.slot,
            );
            if (!row) {
              alert("No matching Demolish Items row was found for this battalion.");
              return;
            }

            row.turnId = $scope.masterData.turnId;
            row.itemNo = null;
            row.brigadeNo = null;

            return turnSheetFactory
              .postTSRecords(rows, "DemolishItems")
              .then(function () {
                $scope.restoreDemolishedBattalionPreview(brigade, battalion);
              }, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

      $scope.openAddBattalionModal = function (brigade, battalion, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if (!brigade || !battalion || battalion.type) {
          return;
        }

        if ($scope.brigadeHasLockedBattalion(brigade)) {
          $scope.alertLockedTurnOrder("Set up additional battalion", brigade);
          return;
        }

        if (!$scope.findFirstFreeBattalion(brigade)) {
          alert("can't be done as no space");
          return;
        }

        $scope.addBattalionModal.isOpen = true;
        $scope.addBattalionModal.brigade = brigade;
        $scope.addBattalionModal.selectedArmyItem = null;
        $scope.addBattalionModal.cost =
          $scope.calculateEmptyAdditionalBattalionCost();
      };

      $scope.closeAddBattalionModal = function () {
        $scope.addBattalionModal.isOpen = false;
        $scope.addBattalionModal.brigade = null;
        $scope.addBattalionModal.selectedArmyItem = null;
        $scope.addBattalionModal.cost =
          $scope.calculateEmptyAdditionalBattalionCost();
      };

      $scope.getAdditionalBattalionOptions = function () {
        var brigade = $scope.addBattalionModal.brigade;
        if (!brigade) {
          return [];
        }

        var sphere = $scope.getBrigadeSphere(brigade);
        return ($scope.armyListRows || []).filter(function (armyItem) {
          return $scope.isArmyItemValidForAdditionalBattalion(armyItem, sphere);
        });
      };

      $scope.selectAdditionalBattalion = function (armyItem) {
        $scope.addBattalionModal.selectedArmyItem = armyItem;
        $scope.addBattalionModal.cost =
          $scope.calculateAdditionalBattalionCost(armyItem);
      };

      $scope.saveAdditionalBattalion = function () {
        var brigade = $scope.addBattalionModal.brigade;
        var armyItem = $scope.addBattalionModal.selectedArmyItem;
        var targetBattalion = $scope.findFirstFreeBattalion(brigade);

        if ($scope.brigadeHasLockedBattalion(brigade)) {
          $scope.alertLockedTurnOrder("Set up additional battalion", brigade);
          return;
        }

        if (!brigade || !armyItem || !targetBattalion) {
          alert("can't be done as no space");
          return;
        }

        turnSheetFactory
          .getTSSetUpAdditionalBrigades($scope.masterData.turnId)
          .then(function (rows) {
            var targetRow =
              $scope.findMatchingAdditionalBattalionRow(rows, brigade.id) ||
              $scope.findNextEmptyTurnSheetRowWithinLimit(
                rows,
                ["brigadeNo", "battType"],
                6,
              );

            if (!targetRow) {
              alert("can't be done as no space");
              return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.brigadeNo = brigade.id;
            targetRow.battType = armyItem.itemNo;

            turnSheetFactory
              .postTSRecords(rows, "SetUpAdditionalBrigades")
              .then(function () {
                $scope.applyAdditionalBattalionPreview(
                  brigade,
                  targetBattalion,
                  armyItem,
                );
                $scope.closeAddBattalionModal();
              }, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };


      $scope.copyBattalionBaseline = function (battalion) {
        return {
          type: battalion.type,
          originalEf: battalion.originalEf,
          currentEf: battalion.originalEf,
          baseSize: battalion.baseSize,
          size: battalion.size,
          isDemolishedThisTurn: battalion.isDemolishedThisTurn,
          demolishedType: battalion.demolishedType,
          demolishedOriginalEf: battalion.demolishedOriginalEf,
          demolishedOriginalSize: battalion.demolishedOriginalSize,
        };
      };

      $scope.copyBattalionBaselineInto = function (target, source) {
        target.type = source.type;
        target.originalEf = source.originalEf;
        target.currentEf = source.originalEf;
        target.baseSize = source.baseSize;
        target.size = source.size;
        target.isDemolishedThisTurn = !!source.isDemolishedThisTurn;
        target.demolishedType = source.demolishedType || "";
        target.demolishedOriginalEf =
          source.demolishedOriginalEf != null ? source.demolishedOriginalEf : null;
        target.demolishedOriginalSize =
          source.demolishedOriginalSize != null
            ? source.demolishedOriginalSize
            : null;
        target.display = target.type
          ? $scope.formatBattalionParts(
              target.type,
              target.originalEf,
              target.size,
            )
          : "";
      };

      $scope.clearBattalionBaseline = function (battalion) {
        battalion.type = "";
        battalion.originalEf = null;
        battalion.currentEf = null;
        battalion.baseSize = null;
        battalion.size = null;
        battalion.display = "";
        battalion.isEfChanged = false;
        battalion.efDrop = 0;
        battalion.efIncrease = 0;
        battalion.isNewAddition = false;
        battalion.isDemolishedThisTurn = false;
        battalion.demolishedType = "";
        battalion.demolishedOriginalEf = null;
        battalion.demolishedOriginalSize = null;
      };

      $scope.applyDemolishBattalionPreview = function (brigade, battalion) {
        if (!brigade || !battalion) {
          return;
        }

        var demolishedType = battalion.type || battalion.demolishedType || "";
        var demolishedOriginalEf =
          battalion.originalEf != null
            ? battalion.originalEf
            : battalion.demolishedOriginalEf;
        var demolishedOriginalSize =
          battalion.baseSize != null
            ? battalion.baseSize
            : battalion.demolishedOriginalSize;
        $scope.clearBattalionBaseline(battalion);
        battalion.isDemolishedThisTurn = true;
        battalion.demolishedType = demolishedType;
        battalion.demolishedOriginalEf = demolishedOriginalEf;
        battalion.demolishedOriginalSize = demolishedOriginalSize;

        $scope.recalculateBrigadeEffects(brigade);
        $scope.refreshBoardingForBrigadeIfNeeded(brigade);
      };

      $scope.restoreDemolishedBattalionPreview = function (brigade, battalion) {
        if (!brigade || !battalion || !battalion.isDemolishedThisTurn) {
          return;
        }

        battalion.type = battalion.demolishedType || "";
        battalion.originalEf = battalion.demolishedOriginalEf;
        battalion.currentEf = battalion.demolishedOriginalEf;
        battalion.baseSize = battalion.demolishedOriginalSize;
        battalion.size = battalion.demolishedOriginalSize;
        battalion.display = battalion.type
          ? $scope.formatBattalionParts(
              battalion.type,
              battalion.originalEf,
              battalion.size,
            )
          : "";
        battalion.isDemolishedThisTurn = false;
        battalion.demolishedType = "";
        battalion.demolishedOriginalEf = null;
        battalion.demolishedOriginalSize = null;

        $scope.recalculateBrigadeEffects(brigade);
        $scope.refreshBoardingForBrigadeIfNeeded(brigade);
      };

      $scope.refreshBoardingForBrigadeIfNeeded = function (brigade) {
        if (!brigade || !brigade.boardingSelected) {
          return;
        }

        if (
          $scope.boardingModal &&
          $scope.boardingModal.isOpen &&
          $scope.boardingModal.brigade &&
          $scope.sameNullableInt($scope.boardingModal.brigade.id, brigade.id)
        ) {
          $scope.boardingModal.currentUnitCapacity =
            $scope.getBoardingUnitRequiredCapacity(brigade);
          $scope.boardingModal.currentBrigadeCapacity =
            $scope.boardingModal.currentUnitCapacity;
          $scope.refreshBoardingModalOptions(brigade, false);
        }
      };

      $scope.findFirstFreeBattalion = function (brigade) {
        if (!brigade || !brigade.battalions) {
          return null;
        }

        for (var i = 0; i < brigade.battalions.length; i++) {
          if (!brigade.battalions[i].type) {
            return brigade.battalions[i];
          }
        }

        return null;
      };

      $scope.applyAdditionalBattalionPreview = function (
        brigade,
        battalion,
        armyItem,
      ) {
        battalion.type = $scope.trimValue(armyItem.shortName);
        battalion.originalEf = armyItem.ef;
        battalion.currentEf = armyItem.ef;
        battalion.baseSize = 800;
        battalion.size = 800;
        battalion.isNewAddition = true;
        battalion.isDemolishedThisTurn = false;
        battalion.demolishedType = "";
        battalion.demolishedOriginalEf = null;
        battalion.demolishedOriginalSize = null;
        battalion.display = $scope.formatBattalionParts(
          battalion.type,
          battalion.originalEf,
          battalion.size,
        );
        $scope.recalculateBrigadeEffects(brigade);
      };

      $scope.calculateEmptyAdditionalBattalionCost = function () {
        return {
          ld: "",
          citizens: "",
          ecPts: "",
          horses: "",
        };
      };

      $scope.calculateAdditionalBattalionCost = function (armyItem) {
        if (!armyItem) {
          return $scope.calculateEmptyAdditionalBattalionCost();
        }

        var cost = parseFloat(armyItem.cost);
        var ecPtsPer25 = parseFloat(armyItem.ecPtsPer25);
        if (isNaN(cost)) cost = 0;
        if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;

        return {
          ld: Math.round(800 * cost * 2),
          citizens: 800,
          ecPts: Math.round(Math.ceil(800 / 25) * ecPtsPer25),
          horses: $scope.isMountedArmyItem(armyItem) ? 800 : "",
        };
      };

      $scope.isArmyItemValidForAdditionalBattalion = function (
        armyItem,
        sphere,
      ) {
        var parsedItemNo = parseInt(armyItem && armyItem.itemNo, 10);
        if (isNaN(parsedItemNo)) {
          return false;
        }

        if (sphere === "Europe") {
          if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39)
            return false;
          return true;
        }

        if (parsedItemNo % 2 === 0) return false;
        if (parsedItemNo === 19) return false;
        if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39)
          return sphere === "Caribbean" || sphere === "India";

        return true;
      };

    },
  };
});
