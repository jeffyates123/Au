"use strict";

austerlitzModule.factory("navalUnitsRepairFactory", function () {
  var TS09_MAX_ROWS = 6;

  return {
    attach: function ($scope, turnSheetFactory) {
      function findTs09RowByItemNo(rows, itemNo) {
        for (var i = 0; i < (rows || []).length; i++) {
          if ($scope.sameNullableInt(rows[i].itemNo, itemNo)) return rows[i];
        }
        return null;
      }

      function findNextEmptyTs09Row(rows) {
        rows = rows || [];
        for (var orderNo = 1; orderNo <= TS09_MAX_ROWS; orderNo++) {
          var existing = null;
          for (var i = 0; i < rows.length; i++) {
            if ($scope.sameNullableInt(rows[i].orderNo, orderNo)) {
              existing = rows[i];
              break;
            }
          }
          if (!existing) {
            var newRow = {
              turnId: $scope.masterData.turnId,
              orderNo: orderNo,
            };
            rows.push(newRow);
            return newRow;
          }
          if (existing.itemNo == null) {
            return existing;
          }
        }
        return null;
      }

      $scope.isShipEligibleForRepair = function (ship) {
        if (!ship) return false;
        var condition = parseInt(ship.conditionRaw, 10);
        if (isNaN(condition) || condition >= 100) return false;
        return $scope.isShipAtEligibleShipyard(ship);
      };

      $scope.getEligibleRepairShips = function () {
        var all = ($scope.warshipRows || []).concat($scope.merchantRows || []);
        return all.filter(function (ship) {
          return $scope.isShipEligibleForRepair(ship);
        });
      };

      $scope.openNavyRepairModal = function () {
        $scope.navyRepairModal.isOpen = true;
        $scope.navyRepairModal.stagedItemNos = {};
      };

      $scope.closeNavyRepairModal = function () {
        $scope.navyRepairModal.isOpen = false;
        $scope.navyRepairModal.stagedItemNos = {};
      };

      $scope.toggleRepairShipStaged = function (ship) {
        if (!ship) return;
        var id = ship.id.toString();
        if ($scope.navyRepairModal.stagedItemNos[id]) {
          delete $scope.navyRepairModal.stagedItemNos[id];
        } else {
          $scope.navyRepairModal.stagedItemNos[id] = true;
        }
      };

      $scope.isRepairShipStaged = function (ship) {
        if (!ship) return false;
        return !!$scope.navyRepairModal.stagedItemNos[ship.id.toString()];
      };

      $scope.saveNavyRepairModal = function () {
        var stagedItemNos = $scope.navyRepairModal.stagedItemNos || {};
        var ids = Object.keys(stagedItemNos).filter(function (k) {
          return stagedItemNos[k];
        });

        if (!ids.length) {
          alert("No ships are selected for repair.");
          return;
        }

        turnSheetFactory
          .getTSRepairShips_BaggageTrains($scope.masterData.turnId)
          .then(function (rows) {
            rows = rows || [];

            var conflicts = ids.filter(function (idStr) {
              return !!findTs09RowByItemNo(rows, parseInt(idStr, 10));
            });

            if (
              conflicts.length &&
              !window.confirm(
                "One or more TS_09 repair orders already exist for selected ships. Overwrite them?",
              )
            ) {
              return;
            }

            for (var i = 0; i < ids.length; i++) {
              var itemNo = parseInt(ids[i], 10);
              var targetRow =
                findTs09RowByItemNo(rows, itemNo) ||
                findNextEmptyTs09Row(rows);

              if (!targetRow) {
                alert("TS_09 is full (max " + TS09_MAX_ROWS + " rows).");
                return;
              }

              targetRow.turnId = $scope.masterData.turnId;
              targetRow.itemNo = itemNo;
            }

            return turnSheetFactory
              .postTSRecords(rows, "RepairShips_BaggageTrains")
              .then(function () {
                $scope.closeNavyRepairModal();
              });
          });
      };
    },
  };
});
