"use strict";

austerlitzModule.factory(
  "navalUnitsFederationFactory",
  function (navyFleetValidationFactory, turnAssignmentResolverFactory) {
  var TS14_MAX_ROWS = 21;

  return {
    attach: function ($scope, turnSheetFactory) {
      function toInt(value) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
      }

      function formatReplayFleetNo(fleetNo) {
        var parsed = parseInt(fleetNo, 10);
        return !isNaN(parsed) && parsed > 0 ? parsed : "";
      }

      function getAllShips() {
        return ($scope.warshipRows || []).concat($scope.merchantRows || []);
      }

      function getShipEffectiveFleetNo(ship) {
        var fleetNo = navyFleetValidationFactory.toInt(ship && ship.fleet);
        return navyFleetValidationFactory.isPlayableFleetNo(fleetNo) ? fleetNo : null;
      }

      function getLockedFleetGroups() {
        return (
          ($scope.navyFormFederationModal &&
            $scope.navyFormFederationModal.lockedFleetGroups) ||
          {}
        );
      }

      function lockFleetGroup(fleetNo) {
        if (!navyFleetValidationFactory.isPlayableFleetNo(fleetNo)) {
          return;
        }
        $scope.navyFormFederationModal.lockedFleetGroups =
          $scope.navyFormFederationModal.lockedFleetGroups || {};
        $scope.navyFormFederationModal.lockedFleetGroups[fleetNo] = true;
      }

      function unlockFleetGroup(fleetNo) {
        if (!navyFleetValidationFactory.isPlayableFleetNo(fleetNo)) {
          return;
        }
        if (
          !$scope.navyFormFederationModal ||
          !$scope.navyFormFederationModal.lockedFleetGroups
        ) {
          return;
        }
        delete $scope.navyFormFederationModal.lockedFleetGroups[fleetNo];
      }

      function getShipsByEffectiveFleetNo(fleetNo) {
        var parsedFleetNo = navyFleetValidationFactory.toInt(fleetNo);
        if (!navyFleetValidationFactory.isPlayableFleetNo(parsedFleetNo)) {
          return [];
        }
        return getAllShips().filter(function (ship) {
          return $scope.sameNullableInt(getShipEffectiveFleetNo(ship), parsedFleetNo);
        });
      }

      function getShipsByOriginalFleetNo(fleetNo) {
        return getAllShips().filter(function (ship) {
          var sourceFleet =
            ship && ship.originalFleet != null && ship.originalFleet !== ""
              ? ship.originalFleet
              : ship.fleet;
          return $scope.sameNullableInt(sourceFleet, fleetNo);
        });
      }

      function applyFleetToShips(ships, targetFleetNo, isChangedThisTurn) {
        var formatted = formatReplayFleetNo(targetFleetNo);
        angular.forEach(ships, function (ship) {
          ship.fleet = formatted;
          ship.fleetChanged = !!isChangedThisTurn;
        });
      }

      function hasFleetOrderForShip(formFederationRows, ship) {
        var shipId = toInt(ship && ship.id);
        if (shipId == null) {
          return false;
        }

        for (var i = 0; i < (formFederationRows || []).length; i++) {
          var row = formFederationRows[i];
          if (!$scope.sameNullableInt(row && row.itemNo, shipId)) {
            continue;
          }
          if (
            navyFleetValidationFactory.isValidOrderFleetNo(
              navyFleetValidationFactory.toInt(row && row.federation_Fleet),
            )
          ) {
            return true;
          }
        }

        return false;
      }

      function findLatestTs14RowByItemNo(rows, itemNo) {
        var latest = null;
        for (var i = 0; i < (rows || []).length; i++) {
          if (!$scope.sameNullableInt(rows[i].itemNo, itemNo)) {
            continue;
          }

          if (!latest) {
            latest = rows[i];
            continue;
          }

          var latestOrderNo = toInt(latest.orderNo) || 0;
          var rowOrderNo = toInt(rows[i].orderNo) || 0;
          if (rowOrderNo >= latestOrderNo) {
            latest = rows[i];
          }
        }

        return latest;
      }

      function clearDuplicateTs14RowsForItemNo(rows, itemNo, keepRow) {
        angular.forEach(rows || [], function (row) {
          if (!$scope.sameNullableInt(row.itemNo, itemNo) || row === keepRow) {
            return;
          }

          row.turnId = $scope.masterData.turnId;
          row.itemNo = null;
          row.federation_Fleet = null;
        });
      }

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

      $scope.replayNavyFormFederations = function () {
        if (
          !$scope.masterData ||
          !$scope.masterData.turnId ||
          $scope.masterData.turnId === "Unknown"
        ) {
          return;
        }

        return turnSheetFactory
          .getTSFormFederations($scope.masterData.turnId)
          .then(function (rows) {
            var formFederationRows = rows || [];
            $scope.navyFormFederationRows = formFederationRows;
            angular.forEach(getAllShips(), function (ship) {
              var targetFleetNo =
                turnAssignmentResolverFactory.resolveEffectiveShipFleetNoForShip(
                  ship,
                  formFederationRows,
                );
              applyFleetToShips(
                [ship],
                targetFleetNo,
                hasFleetOrderForShip(formFederationRows, ship),
              );
            });

            $scope.refreshWarshipPairRows();
            $scope.refreshMerchantPairRows();
            $scope.buildFleetSummaryRows();
          });
      };

      $scope.restoreNavyShipOriginalFleet = function (ship) {
        if (!ship) {
          return;
        }

        var originalFleet = toInt(ship.originalFleet);
        ship.fleet = originalFleet != null && originalFleet > 0 ? originalFleet : "";
        ship.fleetChanged = false;
      };

      $scope.clearNavyFleetOrder = function (ship) {
        if (!ship) {
          return;
        }

        var shipId = toInt(ship.id);
        if (shipId == null) {
          return;
        }

        turnSheetFactory
          .getTSFormFederations($scope.masterData.turnId)
          .then(function (rows) {
            rows = rows || [];
            var touched = false;

            angular.forEach(rows, function (row) {
              if (!$scope.sameNullableInt(row.itemNo, shipId)) {
                return;
              }

              row.turnId = $scope.masterData.turnId;
              row.itemNo = null;
              row.federation_Fleet = null;
              touched = true;
            });

            if (!touched) {
              $scope.restoreNavyShipOriginalFleet(ship);
              return null;
            }

            return turnSheetFactory
              .postTSRecords(rows, "FormFederations")
              .then(function () {
                $scope.navyFormFederationRows = rows;
                $scope.restoreNavyShipOriginalFleet(ship);
                $scope.refreshWarshipPairRows();
                $scope.refreshMerchantPairRows();
                $scope.buildFleetSummaryRows();
              }, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

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
        if (navyFleetValidationFactory.isValidOrderFleetNo(fleetNo)) {
          $scope.navyFormFederationModal.validationError = "";
          return true;
        }
        $scope.navyFormFederationModal.validationError =
          "Enter 0 to clear, or a fleet number from " +
          navyFleetValidationFactory.min +
          " to " +
          navyFleetValidationFactory.max +
          ".";
        return false;
      };

      $scope.getNavyFederationTargetNo = function () {
        return navyFleetValidationFactory.toInt(
          $scope.navyFormFederationModal.targetFleetNo,
        );
      };

      $scope.getNextAvailableFleetNo = function () {
        var used = {};
        angular.forEach($scope.warshipRows || [], function (s) {
          var n = navyFleetValidationFactory.toInt(s.fleet);
          if (navyFleetValidationFactory.isAssignedFleetNo(n)) used[n] = true;
        });
        angular.forEach($scope.merchantRows || [], function (s) {
          var n = navyFleetValidationFactory.toInt(s.fleet);
          if (navyFleetValidationFactory.isAssignedFleetNo(n)) used[n] = true;
        });
        angular.forEach(
          ($scope.navyFormFederationModal &&
            $scope.navyFormFederationModal.stagedOrders) ||
            [],
          function (o) {
            var n = navyFleetValidationFactory.toInt(o.federation_Fleet);
            if (navyFleetValidationFactory.isAssignedFleetNo(n)) used[n] = true;
          },
        );
        for (
          var n = navyFleetValidationFactory.min;
          n <= navyFleetValidationFactory.max;
          n++
        ) {
          if (!used[n]) return n;
        }
        return null;
      };

      $scope.openNavyFederationModal = function (ship, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();
        if (!ship) return;
        if (ship.fleetChanged) {
          $scope.clearNavyFleetOrder(ship);
          return;
        }

        var targetFleetNo = navyFleetValidationFactory.toInt(ship.fleet);
        if (!navyFleetValidationFactory.isAssignedFleetNo(targetFleetNo)) {
          targetFleetNo = $scope.getNextAvailableFleetNo();
          if (targetFleetNo == null) {
            alert(
              "No available fleet numbers (" +
                navyFleetValidationFactory.min +
                "-" +
                navyFleetValidationFactory.max +
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
        $scope.navyFormFederationModal.lockedFleetGroups = {};
        $scope.stageNavyFleetForShip(ship);
      };

      $scope.closeNavyFederationModal = function () {
        $scope.navyFormFederationModal.isOpen = false;
        $scope.navyFormFederationModal.ship = null;
        $scope.navyFormFederationModal.targetFleetNo = null;
        $scope.navyFormFederationModal.validationError = "";
        $scope.navyFormFederationModal.stagedOrders = [];
        $scope.navyFormFederationModal.lockedFleetGroups = {};
      };

      $scope.isNavyFleetGroupLocked = function (ship) {
        var sourceFleetNo = getShipEffectiveFleetNo(ship);
        if (!navyFleetValidationFactory.isPlayableFleetNo(sourceFleetNo)) {
          return false;
        }
        return !!getLockedFleetGroups()[sourceFleetNo];
      };

      $scope.canStageNavyShip = function (ship) {
        var sourceFleetNo = getShipEffectiveFleetNo(ship);
        if (!navyFleetValidationFactory.isPlayableFleetNo(sourceFleetNo)) {
          return true;
        }
        return !$scope.isNavyFleetGroupLocked(ship);
      };

      $scope.isNavyFleetOrderStagedForShip = function (ship) {
        var sourceFleetNo = getShipEffectiveFleetNo(ship);
        if (!navyFleetValidationFactory.isPlayableFleetNo(sourceFleetNo)) {
          return false;
        }

        return ($scope.navyFormFederationModal.stagedOrders || []).some(
          function (order) {
            return (
              order &&
              order.orderType === "fleet" &&
              $scope.sameNullableInt(order.sourceFleetNo, sourceFleetNo)
            );
          },
        );
      };

      $scope.canStageNavyFleet = function (ship) {
        var sourceFleetNo = getShipEffectiveFleetNo(ship);
        if (!navyFleetValidationFactory.isPlayableFleetNo(sourceFleetNo)) {
          return false;
        }
        return !$scope.isNavyFleetGroupLocked(ship);
      };

      $scope.stageNavyFleetForShip = function (ship) {
        if (!ship) return;
        var targetFleetNo = $scope.getNavyFederationTargetNo();
        if (!$scope.isValidNavyFleetNo(targetFleetNo)) return;
        if (!$scope.canStageNavyShip(ship)) return;

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

      $scope.stageNavyFleetForFleet = function (ship) {
        if (!ship) return;
        var sourceFleetNo = getShipEffectiveFleetNo(ship);
        if (!navyFleetValidationFactory.isPlayableFleetNo(sourceFleetNo)) return;
        if (!$scope.canStageNavyFleet(ship)) return;

        var targetFleetNo = $scope.getNavyFederationTargetNo();
        if (!$scope.isValidNavyFleetNo(targetFleetNo)) return;

        var stagedOrders = $scope.navyFormFederationModal.stagedOrders || [];
        stagedOrders = stagedOrders.filter(function (order) {
          if (!order) {
            return false;
          }

          if (order.orderType === "fleet") {
            return true;
          }

          var stagedShip = $scope.getShipById(order.itemNo);
          if (!stagedShip) {
            return true;
          }

          return !$scope.sameNullableInt(
            getShipEffectiveFleetNo(stagedShip),
            sourceFleetNo,
          );
        });

        var existingFleetOrder = null;
        for (var i = 0; i < stagedOrders.length; i++) {
          var stagedOrder = stagedOrders[i];
          if (
            stagedOrder &&
            stagedOrder.orderType === "fleet" &&
            $scope.sameNullableInt(stagedOrder.sourceFleetNo, sourceFleetNo)
          ) {
            existingFleetOrder = stagedOrder;
            break;
          }
        }

        if (existingFleetOrder) {
          existingFleetOrder.federation_Fleet = targetFleetNo;
        } else {
          stagedOrders.push({
            orderType: "fleet",
            itemNo: sourceFleetNo,
            sourceFleetNo: sourceFleetNo,
            federation_Fleet: targetFleetNo,
            shipId: null,
          });
        }

        $scope.navyFormFederationModal.stagedOrders = stagedOrders;
        lockFleetGroup(sourceFleetNo);
      };

      $scope.unstageNavyFleetForFleet = function (ship) {
        if (!ship) return;
        var sourceFleetNo = getShipEffectiveFleetNo(ship);
        if (!navyFleetValidationFactory.isPlayableFleetNo(sourceFleetNo)) return;

        $scope.navyFormFederationModal.stagedOrders = (
          $scope.navyFormFederationModal.stagedOrders || []
        ).filter(function (order) {
          return !(
            order &&
            order.orderType === "fleet" &&
            $scope.sameNullableInt(order.sourceFleetNo, sourceFleetNo)
          );
        });

        unlockFleetGroup(sourceFleetNo);
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
            "No available fleet numbers (" +
              navyFleetValidationFactory.min +
              "-" +
              navyFleetValidationFactory.max +
              ").",
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
                findLatestTs14RowByItemNo(rows, order.itemNo) ||
                findNextEmptyTs14Row(rows);

              if (!targetRow) {
                alert("No empty TS_14 row is available.");
                return;
              }

              targetRow.turnId = $scope.masterData.turnId;
              targetRow.itemNo = order.itemNo;
              targetRow.federation_Fleet = order.federation_Fleet;
              clearDuplicateTs14RowsForItemNo(rows, order.itemNo, targetRow);
            }

            return turnSheetFactory
              .postTSRecords(rows, "FormFederations")
              .then(function () {
                $scope.navyFormFederationRows = rows;
                var shipsByFleetAtSave = {};
                angular.forEach(stagedOrders, function (order) {
                  if (!(order && order.orderType === "fleet")) {
                    return;
                  }
                  var sourceFleetNo = navyFleetValidationFactory.toInt(
                    order.sourceFleetNo,
                  );
                  if (!navyFleetValidationFactory.isPlayableFleetNo(sourceFleetNo)) {
                    return;
                  }
                  if (!shipsByFleetAtSave[sourceFleetNo]) {
                    shipsByFleetAtSave[sourceFleetNo] =
                      getShipsByEffectiveFleetNo(sourceFleetNo).slice();
                  }
                });

                angular.forEach(stagedOrders, function (order) {
                  var formatted =
                    navyFleetValidationFactory.isAssignedFleetNo(order.federation_Fleet)
                      ? turnAssignmentResolverFactory.toInt(order.federation_Fleet)
                      : "";

                  if (order && order.orderType === "fleet") {
                    var sourceFleetNo = navyFleetValidationFactory.toInt(
                      order.sourceFleetNo,
                    );
                    applyFleetToShips(
                      shipsByFleetAtSave[sourceFleetNo] || [],
                      formatted,
                      true,
                    );
                    return;
                  }

                  var ship = $scope.getShipById(order.itemNo);
                  if (ship) {
                    ship.fleet = formatted;
                    ship.fleetChanged = true;
                  }
                });
                $scope.buildFleetSummaryRows();
                $scope.closeNavyFederationModal();
              });
          });
      };
    },
  };
},
);
