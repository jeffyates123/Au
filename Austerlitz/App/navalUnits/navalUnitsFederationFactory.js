"use strict";

austerlitzModule.factory("navalUnitsFederationFactory", function () {
  var FLEET_MIN = 11;
  var FLEET_MAX = 30;
  var TS14_MAX_ROWS = 21;

  return {
    attach: function ($scope, turnSheetFactory) {
      function findTs14RowByItemNo(rows, itemNo) {
        for (var i = 0; i < (rows || []).length; i++) {
          if ($scope.sameNullableInt(rows[i].itemNo, itemNo)) return rows[i];
        }
        return null;
      }

      function findNextEmptyTs14Row(rows) {
        rows = rows || [];
        for (var orderNo = 1; orderNo <= TS14_MAX_ROWS; orderNo++) {
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
          if (
            existing.itemNo == null &&
            existing.federation_Fleet == null
          ) {
            return existing;
          }
        }
        return null;
      }

      $scope.getNavyFederationWarships = function () {
        var ship = $scope.navyFormFederationModal.ship;
        if (!ship || !ship.position) return $scope.warshipRows || [];
        return ($scope.warshipRows || []).filter(function (s) {
          return s.position === ship.position;
        });
      };

      $scope.getNavyFederationMerchants = function () {
        var ship = $scope.navyFormFederationModal.ship;
        if (!ship || !ship.position) return $scope.merchantRows || [];
        return ($scope.merchantRows || []).filter(function (s) {
          return s.position === ship.position;
        });
      };

      $scope.isValidNavyFleetNo = function (fleetNo) {
        if (fleetNo === 0 || fleetNo === "0") {
          $scope.navyFormFederationModal.validationError = "";
          return true;
        }
        var n = parseInt(fleetNo, 10);
        if (!isNaN(n) && n >= FLEET_MIN && n <= FLEET_MAX) {
          $scope.navyFormFederationModal.validationError = "";
          return true;
        }
        $scope.navyFormFederationModal.validationError =
          "Enter 0 to clear, or a fleet number from " +
          FLEET_MIN +
          " to " +
          FLEET_MAX +
          ".";
        return false;
      };

      $scope.getNavyFederationTargetNo = function () {
        var n = parseInt(
          $scope.navyFormFederationModal.targetFleetNo,
          10,
        );
        return isNaN(n) ? null : n;
      };

      $scope.getNextAvailableFleetNo = function () {
        var used = {};
        angular.forEach($scope.warshipRows || [], function (s) {
          var n = parseInt(s.fleet, 10);
          if (!isNaN(n) && n > 0) used[n] = true;
        });
        angular.forEach($scope.merchantRows || [], function (s) {
          var n = parseInt(s.fleet, 10);
          if (!isNaN(n) && n > 0) used[n] = true;
        });
        angular.forEach(
          ($scope.navyFormFederationModal &&
            $scope.navyFormFederationModal.stagedOrders) ||
            [],
          function (o) {
            var n = parseInt(o.federation_Fleet, 10);
            if (!isNaN(n) && n > 0) used[n] = true;
          },
        );
        for (var n = FLEET_MIN; n <= FLEET_MAX; n++) {
          if (!used[n]) return n;
        }
        return null;
      };

      $scope.openNavyFederationModal = function (ship) {
        if (!ship) return;

        var targetFleetNo = parseInt(ship.fleet, 10);
        if (isNaN(targetFleetNo) || targetFleetNo <= 0) {
          targetFleetNo = $scope.getNextAvailableFleetNo();
          if (targetFleetNo == null) {
            alert(
              "No available fleet numbers (" +
                FLEET_MIN +
                "-" +
                FLEET_MAX +
                ").",
            );
            targetFleetNo = "";
          }
        }

        $scope.navyFormFederationModal.isOpen = true;
        $scope.navyFormFederationModal.ship = ship;
        $scope.navyFormFederationModal.targetFleetNo = targetFleetNo;
        $scope.navyFormFederationModal.validationError = "";
        $scope.navyFormFederationModal.stagedOrders = [];
        $scope.stageNavyFleetForShip(ship);
      };

      $scope.closeNavyFederationModal = function () {
        $scope.navyFormFederationModal.isOpen = false;
        $scope.navyFormFederationModal.ship = null;
        $scope.navyFormFederationModal.targetFleetNo = null;
        $scope.navyFormFederationModal.validationError = "";
        $scope.navyFormFederationModal.stagedOrders = [];
      };

      $scope.stageNavyFleetForShip = function (ship) {
        if (!ship) return;
        var targetFleetNo = $scope.getNavyFederationTargetNo();
        if (!$scope.isValidNavyFleetNo(targetFleetNo)) return;

        var shipId = parseInt(ship.id, 10);
        if (isNaN(shipId)) return;

        var stagedOrders = $scope.navyFormFederationModal.stagedOrders || [];
        for (var i = 0; i < stagedOrders.length; i++) {
          if ($scope.sameNullableInt(stagedOrders[i].itemNo, shipId)) {
            stagedOrders[i].federation_Fleet = targetFleetNo;
            return;
          }
        }
        stagedOrders.push({
          itemNo: shipId,
          federation_Fleet: targetFleetNo,
          shipId: ship.id,
        });
        $scope.navyFormFederationModal.stagedOrders = stagedOrders;
      };

      $scope.unstageNavyFleetForShip = function (ship) {
        if (!ship) return;
        $scope.navyFormFederationModal.stagedOrders = (
          $scope.navyFormFederationModal.stagedOrders || []
        ).filter(function (o) {
          return !$scope.sameNullableInt(o.itemNo, ship.id);
        });
      };

      $scope.isNavyShipStaged = function (ship) {
        if (!ship) return false;
        return ($scope.navyFormFederationModal.stagedOrders || []).some(
          function (o) {
            return $scope.sameNullableInt(o.itemNo, ship.id);
          },
        );
      };

      $scope.onNavyFleetTargetChanged = function () {
        var targetFleetNo = $scope.getNavyFederationTargetNo();
        if (!$scope.isValidNavyFleetNo(targetFleetNo)) return;
        angular.forEach(
          $scope.navyFormFederationModal.stagedOrders,
          function (o) {
            o.federation_Fleet = targetFleetNo;
          },
        );
      };

      $scope.selectNextAvailableFleetNo = function () {
        var next = $scope.getNextAvailableFleetNo();
        if (next == null) {
          alert(
            "No available fleet numbers (" + FLEET_MIN + "-" + FLEET_MAX + ").",
          );
          return;
        }
        $scope.navyFormFederationModal.targetFleetNo = next;
        $scope.onNavyFleetTargetChanged();
      };

      $scope.saveNavyFederationModal = function () {
        var targetFleetNo = $scope.getNavyFederationTargetNo();
        if (!$scope.isValidNavyFleetNo(targetFleetNo)) return;

        var stagedOrders = $scope.navyFormFederationModal.stagedOrders || [];
        if (!stagedOrders.length) {
          alert("No fleet changes are staged.");
          return;
        }

        turnSheetFactory
          .getTSFormFederations($scope.masterData.turnId)
          .then(function (rows) {
            rows = rows || [];

            var conflicts = stagedOrders.filter(function (order) {
              return !!findTs14RowByItemNo(rows, order.itemNo);
            });

            if (
              conflicts.length &&
              !window.confirm(
                "One or more TS_14 orders already exist for these ships. Overwrite them?",
              )
            ) {
              return;
            }

            for (var i = 0; i < stagedOrders.length; i++) {
              var order = stagedOrders[i];
              var targetRow =
                findTs14RowByItemNo(rows, order.itemNo) ||
                findNextEmptyTs14Row(rows);

              if (!targetRow) {
                alert("No empty TS_14 row is available.");
                return;
              }

              targetRow.turnId = $scope.masterData.turnId;
              targetRow.itemNo = order.itemNo;
              targetRow.federation_Fleet = order.federation_Fleet;
            }

            return turnSheetFactory
              .postTSRecords(rows, "FormFederations")
              .then(function () {
                angular.forEach(stagedOrders, function (order) {
                  var ship = $scope.getShipById(order.itemNo);
                  if (ship) {
                    var formatted =
                      !isNaN(parseInt(order.federation_Fleet, 10)) &&
                      parseInt(order.federation_Fleet, 10) > 0
                        ? parseInt(order.federation_Fleet, 10)
                        : "";
                    ship.fleet = formatted;
                    ship.fleetChanged = true;
                  }
                });
                $scope.closeNavyFederationModal();
              });
          });
      };
    },
  };
});
