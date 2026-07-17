"use strict";

austerlitzModule.factory("landUnitsBattalionOrdersFactory", function () {
  return {
    attach: function ($scope, $q) {
      $scope.startBattalionAction = function (
        actionType,
        brigade,
        battalion,
        $event,
      ) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if (!brigade || !battalion) {
          $scope.resetBattalionAction();
          return;
        }

        if (!$scope.hasNumericCoordinate(brigade)) {
          alert("Battalion actions require a brigade at a map coordinate.");
          $scope.resetBattalionAction();
          return;
        }

        if (actionType === "merge" && !$scope.getBattalionMergeType(battalion)) {
          alert("Choose a non-empty battalion to start a merge.");
          $scope.resetBattalionAction();
          return;
        }

        if (battalion.isNewAddition) {
          alert(
            "A newly added additional battalion cannot be exchanged or merged in the same turn.",
          );
          $scope.resetBattalionAction();
          return;
        }

        if ($scope.isBattalionLockedForOrders(battalion)) {
          $scope.alertLockedTurnOrder(
            actionType === "merge" ? "Merge" : "Exchange",
            brigade,
          );
          $scope.resetBattalionAction();
          return;
        }

        $scope.battalionAction = {
          type: actionType,
          source: { brigade: brigade, battalion: battalion },
          eligibleKeys: $scope.buildEligibleBattalionKeyMap(
            actionType,
            brigade,
            battalion,
          ),
        };
      };

      $scope.onBattalionLozengeClick = function ($event, brigade, battalion) {
        if (!$scope.battalionAction.type) {
          return;
        }

        if ($event && $event.preventDefault) $event.preventDefault();

        if (!$scope.isBattalionEligibleTarget(brigade, battalion)) {
          $scope.resetBattalionAction();
          return;
        }

        var source = $scope.battalionAction.source;
        if (
          !source ||
          $scope.isSameBattalionSlot(
            source.brigade,
            source.battalion,
            brigade,
            battalion,
          )
        ) {
          $scope.resetBattalionAction();
          return;
        }

        if (
          $scope.isBattalionLockedForOrders(source.battalion) ||
          $scope.isBattalionLockedForOrders(battalion)
        ) {
          $scope.alertLockedTurnOrder(
            $scope.battalionAction.type === "merge" ? "Merge" : "Exchange",
            $scope.isBattalionLockedForOrders(source.battalion)
              ? source.brigade
              : brigade,
          );
          $scope.resetBattalionAction();
          return;
        }

        if ($scope.battalionAction.type === "exchange") {
          $scope.exchangeBattalions(
            source.brigade,
            source.battalion,
            brigade,
            battalion,
          );
          $scope.persistExchangeBattalionOrder(
            source.brigade,
            source.battalion,
            brigade,
            battalion,
          );
        } else if ($scope.battalionAction.type === "merge") {
          $scope.mergeBattalions(
            source.brigade,
            source.battalion,
            brigade,
            battalion,
          );
          $scope.persistMergeBattalionOrder(
            source.brigade,
            source.battalion,
            brigade,
            battalion,
          );
        }

        $scope.resetBattalionAction();
      };

      $scope.resetBattalionAction = function () {
        $scope.battalionAction = {
          type: null,
          source: null,
          eligibleKeys: {},
        };
      };

      $scope.isBattalionActionSource = function (brigade, battalion) {
        var source = $scope.battalionAction.source;
        return !!(
          source &&
          $scope.isSameBattalionSlot(
            source.brigade,
            source.battalion,
            brigade,
            battalion,
          )
        );
      };

      $scope.canStartMerge = function (battalion) {
        return !!$scope.getBattalionMergeType(battalion);
      };

      $scope.canUseBarracksAction = function (brigade) {
        return (
          $scope.isBrigadeAtBarracks(brigade) &&
          !$scope.brigadeHasLockedBattalion(brigade)
        );
      };

      $scope.getBarracksActionTooltip = function (brigade) {
        if (!$scope.isBrigadeAtBarracks(brigade)) {
          return "Brigade must start on a coordinate with a barracks owned by the current state.";
        }

        if ($scope.brigadeHasLockedBattalion(brigade)) {
          return "Brigade contains a battalion already used in Exchange Battalions or Merge Battalions this turn.";
        }

        return "";
      };

      $scope.getBattalionTitle = function (battalion) {
        if (battalion && battalion.isDemolishedThisTurn) {
          return "This battalion has been demolished this turn.";
        }

        if ($scope.isBattalionLockedForOrders(battalion)) {
          return "This battalion has already been used in Exchange Battalions or Merge Battalions this turn.";
        }

        return battalion && battalion.isEfChanged
          ? "EF changed from " +
              battalion.originalEf +
              " to " +
              battalion.currentEf
          : "";
      };

      $scope.getBattalionLozengeDisplay = function (battalion) {
        if (!battalion) {
          return "- -- ---";
        }

        if (battalion.isDemolishedThisTurn && battalion.demolishedType) {
          return battalion.demolishedType;
        }

        return battalion.display || "- -- ---";
      };

      $scope.getBattalionMergeType = function (battalion) {
        if (!battalion) {
          return "";
        }

        if (battalion.type) {
          return battalion.type;
        }

        return battalion.isDemolishedThisTurn && battalion.demolishedType
          ? battalion.demolishedType
          : "";
      };

      $scope.clearBattalionTurnOrder = function (brigade, battalion, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if (
          !brigade ||
          !battalion ||
          !$scope.isBattalionLockedForOrders(battalion)
        ) {
          return;
        }

        if (
          !window.confirm(
            "Clear the Exchange Battalions or Merge Battalions order for this battalion?",
          )
        ) {
          return;
        }

        var clearedOrders = [];
        $q.all([
          $scope.clearExchangeBattalionOrders(
            brigade,
            battalion,
            clearedOrders,
          ),
          $scope.clearMergeBattalionOrders(brigade, battalion, clearedOrders),
        ]).then(function () {
          if (!clearedOrders.length) {
            alert(
              "No matching Exchange Battalions or Merge Battalions order was found for this battalion.",
            );
            return;
          }

          $scope.resetBattalionAction();
          $scope.refreshBrigadeRows();
          $scope.loadArmyListForHeadcountCosts().then(function () {
            $scope.replayBrigadeTurnOrders();
          });
          alert("Cleared " + clearedOrders.join(", ") + ".");
        }, $scope.showTurnSheetOrderError);
      };


      $scope.buildEligibleBattalionKeyMap = function (
        actionType,
        sourceBrigade,
        sourceBattalion,
      ) {
        var eligible = {};
        angular.forEach($scope.brigadeRows, function (brigade) {
          angular.forEach(brigade.battalions, function (battalion) {
            if (
              $scope.isSameBattalionSlot(
                sourceBrigade,
                sourceBattalion,
                brigade,
                battalion,
              )
            ) {
              return;
            }

            if (battalion.isNewAddition) {
              return;
            }

            if ($scope.isBattalionLockedForOrders(battalion)) {
              return;
            }

            if (
              actionType === "exchange" &&
              $scope.isSameCoordinate(sourceBrigade, brigade)
            ) {
              eligible[$scope.getBattalionKey(brigade, battalion)] = true;
              return;
            }

            if (
              actionType === "merge" &&
              $scope.getBattalionMergeType(sourceBattalion) &&
              battalion.type &&
              $scope.getBattalionMergeType(sourceBattalion) === battalion.type &&
              $scope.isSameCoordinate(sourceBrigade, brigade)
            ) {
              eligible[$scope.getBattalionKey(brigade, battalion)] = true;
            }
          });
        });

        return eligible;
      };

      $scope.isBattalionEligibleTarget = function (brigade, battalion) {
        if (!$scope.battalionAction.type) {
          return false;
        }

        return !!$scope.battalionAction.eligibleKeys[
          $scope.getBattalionKey(brigade, battalion)
        ];
      };

      $scope.isBattalionLockedForOrders = function (battalion) {
        return !!(battalion && battalion.isLockedByTurnOrder);
      };

      $scope.brigadeHasLockedBattalion = function (brigade) {
        if (!brigade || !brigade.battalions) {
          return false;
        }

        for (var i = 0; i < brigade.battalions.length; i++) {
          if ($scope.isBattalionLockedForOrders(brigade.battalions[i])) {
            return true;
          }
        }

        return false;
      };

      $scope.hasAnyLockedBrigade = function (brigades, actionName) {
        for (var i = 0; brigades && i < brigades.length; i++) {
          if ($scope.brigadeHasLockedBattalion(brigades[i])) {
            $scope.alertLockedTurnOrder(actionName, brigades[i]);
            return true;
          }
        }

        return false;
      };

      $scope.alertLockedTurnOrder = function (actionName, brigade) {
        var brigadeLabel =
          brigade && brigade.id
            ? " Brigade " + brigade.id + " contains"
            : " This action uses";
        alert(
          actionName +
            " is not possible." +
            brigadeLabel +
            " a battalion already used in an Exchange Battalions or Merge Battalions order this turn.",
        );
      };

      $scope.markBattalionLockedForOrders = function (battalion) {
        if (battalion) {
          battalion.isLockedByTurnOrder = true;
        }
      };

      $scope.getBattalionKey = function (brigade, battalion) {
        return brigade.id + ":" + battalion.slot;
      };

      $scope.isSameBattalionSlot = function (
        leftBrigade,
        leftBattalion,
        rightBrigade,
        rightBattalion,
      ) {
        return !!(
          leftBrigade &&
          rightBrigade &&
          leftBattalion &&
          rightBattalion &&
          leftBrigade.id === rightBrigade.id &&
          leftBattalion.slot === rightBattalion.slot
        );
      };

      $scope.isSameCoordinate = function (leftBrigade, rightBrigade) {
        var leftCoordinate = $scope.getLandUnitCoordinate(leftBrigade);
        var rightCoordinate = $scope.getLandUnitCoordinate(rightBrigade);
        if (!leftCoordinate || !rightCoordinate) {
          return false;
        }

        return (
          leftCoordinate.x === rightCoordinate.x &&
          leftCoordinate.y === rightCoordinate.y
        );
      };

      $scope.hasNumericCoordinate = function (brigade) {
        return !!$scope.getLandUnitCoordinate(brigade);
      };

      $scope.getLandUnitCoordinateX = function (unit) {
        var coordinate = $scope.getLandUnitCoordinate(unit);
        return coordinate ? coordinate.x : NaN;
      };

      $scope.getLandUnitCoordinateY = function (unit) {
        var coordinate = $scope.getLandUnitCoordinate(unit);
        return coordinate ? coordinate.y : NaN;
      };

      $scope.getLandUnitCoordinate = function (unit) {
        if (!unit || !unit.source) {
          return null;
        }

        var x = parseInt(
          unit.source.x_OrState != null ? unit.source.x_OrState : unit.source.x,
          10,
        );
        var y = parseInt(
          unit.source.y_OrFleet != null ? unit.source.y_OrFleet : unit.source.y,
          10,
        );
        if (isNaN(x) || isNaN(y)) {
          return null;
        }

        return { x: x, y: y };
      };

    },
  };
});
