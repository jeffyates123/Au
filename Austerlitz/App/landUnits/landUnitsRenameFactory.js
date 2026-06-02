"use strict";

austerlitzModule.factory("landUnitsRenameFactory", function () {
  return {
    attach: function ($scope, turnSheetFactory) {
      $scope.persistRenameOrder = function (unit, newName) {
        if (!unit) {
          return;
        }

        turnSheetFactory
          .getTSChangeNames($scope.masterData.turnId)
          .then(function (rows) {
            rows = rows || [];

            var targetRow =
              $scope.findMatchingRenameRow(rows, unit.id) ||
              $scope.findNextEmptyTurnSheetRow(rows, ["itemNo", "name"]);

            if (!targetRow) {
              targetRow = {
                turnId: $scope.masterData.turnId,
                orderNo: rows.length + 1,
              };
              rows.push(targetRow);
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

        var nameChanged = newName !== unit.name;
        unit.name = newName;
        unit.isRenaming = false;
        unit.pendingName = null;
        if (nameChanged && unit.source) {
          unit.source.name = newName;
        }

        if (nameChanged) {
          $scope.persistRenameOrder(unit, newName);
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
