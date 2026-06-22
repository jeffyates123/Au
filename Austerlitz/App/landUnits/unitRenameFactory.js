"use strict";

austerlitzModule.factory("unitRenameFactory", function () {
  return {
    attach: function ($scope, turnSheetFactory) {
      var TS_22_MAX_ROWS = 4;

      function revertLocalRename(unit, previousName) {
        if (!unit) {
          return;
        }

        unit.name = previousName;
        if (unit.source) {
          unit.source.name = previousName;
        }
      }

      $scope.persistRenameOrder = function (unit, newName, previousName) {
        if (!unit) {
          return;
        }

        turnSheetFactory
          .getTSChangeNames($scope.masterData.turnId)
          .then(function (rows) {
            rows = rows || [];

            var targetRow =
              $scope.findMatchingRenameRow(rows, unit.id) ||
              $scope.findNextEmptyTurnSheetRowWithinLimit(
                rows,
                ["itemNo", "name"],
                TS_22_MAX_ROWS,
              );

            if (!targetRow) {
              alert(
                "TS_22 Change Name is full. You can only rename 4 units per turn.",
              );
              revertLocalRename(unit, previousName);
              return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.itemNo = unit.id;
            targetRow.name = newName;

            return turnSheetFactory
              .postTSRecords(rows, "ChangeNames")
              .then(angular.noop, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

      $scope.beginRename = function (unit) {
        if (!unit) {
          return;
        }

        unit.isRenaming = true;
        unit.pendingName = unit.name;
      };

      $scope.onRenameKeydown = function ($event, unit) {
        if ($event.keyCode === 13) {
          $event.preventDefault();
          $scope.applyRename(unit);
        } else if ($event.keyCode === 27) {
          $event.preventDefault();
          $scope.cancelRename(unit);
        }
      };

      $scope.applyRename = function (unit) {
        if (!unit || !unit.isRenaming) {
          return;
        }

        var newName = $scope.trimValue(unit.pendingName).substr(0, 15);
        if (!newName) {
          newName = unit.name;
        }

        var previousName = unit.name;
        var nameChanged = newName !== previousName;
        unit.name = newName;
        unit.isRenaming = false;
        unit.pendingName = null;
        if (nameChanged && unit.source) {
          unit.source.name = newName;
        }

        if (nameChanged) {
          $scope.persistRenameOrder(unit, newName, previousName);
        }
      };

      $scope.cancelRename = function (unit) {
        if (!unit) {
          return;
        }

        unit.isRenaming = false;
        unit.pendingName = null;
      };
    },
  };
});
