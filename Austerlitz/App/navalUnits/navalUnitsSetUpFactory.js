"use strict";

austerlitzModule.factory("navalUnitsSetUpFactory", function () {
  var MAX_BUILD_ROWS = 8;
  var WARSHIP_MAX_TYPE = 25;

  function toInt(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? (fallback !== undefined ? fallback : 0) : parsed;
  }

  function hasMeaningfulText(value) {
    return value != null && value.toString().trim().length > 0;
  }

  function createEmptyBuildRow(orderNo) {
    return {
      orderNo: orderNo,
      shipyard: null,
      shipType: null,
      name_WarshipOnly: "",
    };
  }

  function normalizeBuildRow(row) {
    if (!row) return row;
    var shipyard = toInt(row.shipyard, 0) || null;
    var shipType = toInt(row.shipType, 0) || null;
    row.shipyard = shipyard;
    row.shipType = shipType;
    if (!shipyard) {
      row.shipType = null;
      row.name_WarshipOnly = "";
    }
    return row;
  }

  return {
    attach: function ($scope, turnSheetFactory) {
      $scope.buildShipTypeOptions = function () {
        var ships = $scope.refShips || [];
        $scope.shipTypeOptions = ships
          .map(function (s) {
            var type = toInt(s.type || s.Type, 0);
            var name = s.name || s.Name || "";
            var shipClass =
              s.shipClass != null
                ? s.shipClass
                : s.ShipClass != null
                  ? s.ShipClass
                  : null;
            var label = type + " - " + name;
            if (shipClass != null) label += " (" + shipClass + ")";
            return {
              type: type,
              label: label,
              isWarship: type > 0 && type <= WARSHIP_MAX_TYPE,
            };
          })
          .filter(function (s) {
            return s.type > 0;
          })
          .sort(function (a, b) {
            return a.type - b.type;
          });
      };

      $scope.normalizeBuildShipsRows = function (rows) {
        return (rows || []).map(normalizeBuildRow);
      };

      $scope.refreshNavyBuildRows = function () {
        var all = $scope.tsNavyBuildList || [];
        var topRows = all
          .filter(function (r) {
            return toInt(r.orderNo, 0) <= MAX_BUILD_ROWS;
          })
          .sort(function (a, b) {
            return toInt(a.orderNo, 0) - toInt(b.orderNo, 0);
          });

        for (var orderNo = 1; orderNo <= MAX_BUILD_ROWS; orderNo++) {
          var found = false;
          for (var i = 0; i < topRows.length; i++) {
            if (toInt(topRows[i].orderNo, 0) === orderNo) {
              found = true;
              break;
            }
          }
          if (!found) {
            var newRow = createEmptyBuildRow(orderNo);
            topRows.push(newRow);
            $scope.tsNavyBuildList = ($scope.tsNavyBuildList || []).concat([
              newRow,
            ]);
          }
        }

        topRows.sort(function (a, b) {
          return toInt(a.orderNo, 0) - toInt(b.orderNo, 0);
        });
        $scope.tsNavyBuildRows = topRows;
      };

      $scope.isWarshipBuildRow = function (row) {
        if (!row || !row.shipType) return false;
        return toInt(row.shipType, 0) <= WARSHIP_MAX_TYPE;
      };

      $scope.isBuildRowIncomplete = function (row) {
        if (!row) return false;
        var hasYard = !!toInt(row.shipyard, 0);
        var hasType = !!toInt(row.shipType, 0);
        var hasName = hasMeaningfulText(row.name_WarshipOnly);

        if (!hasYard && (hasType || hasName)) return true;
        if (hasYard && hasType && $scope.isWarshipBuildRow(row) && !hasName)
          return true;
        return false;
      };

      $scope.getShipyardBuildPositionText = function (row) {
        if (!row || !row.shipyard) return "--/--";
        var yards = $scope.eligibleShipyards || [];
        for (var i = 0; i < yards.length; i++) {
          if (toInt(yards[i].itemNo, 0) === toInt(row.shipyard, 0)) {
            return yards[i].x + "/" + yards[i].y;
          }
        }
        return "--/--";
      };

      $scope.onBuildShipyardChanged = function (row) {
        if (!row) return;
        if (!toInt(row.shipyard, 0)) {
          row.shipType = null;
          row.name_WarshipOnly = "";
        }
        $scope.queueNavySave("BuildShips");
      };

      $scope.onBuildShipTypeChanged = function (row) {
        if (!row) return;
        if (!$scope.isWarshipBuildRow(row)) {
          row.name_WarshipOnly = "";
        }
        $scope.queueNavySave("BuildShips");
      };

      $scope.onBuildShipNameChanged = function (row) {
        if (!row) return;
        if (!hasMeaningfulText(row.name_WarshipOnly)) {
          row.name_WarshipOnly = "";
        }
        $scope.queueNavySave("BuildShips");
      };

      $scope.clearNavyBuildRow = function (row) {
        if (!row) return;
        row.shipyard = null;
        row.shipType = null;
        row.name_WarshipOnly = "";
        $scope.queueNavySave("BuildShips");
      };

      $scope.onNavyTransferGoodsChanged = function () {
        $scope.queueNavySave("TransferGoods");
      };

      $scope.refreshNavyTransferGoodsRows = function () {
        $scope.tsNavyTransferGoodsRows = (
          $scope.tsNavyTransferGoodsList || []
        ).sort(function (a, b) {
          return toInt(a.orderNo, 0) - toInt(b.orderNo, 0);
        });
      };

      $scope.loadNavySetUpData = function () {
        var turnId = $scope.masterData && $scope.masterData.turnId;
        if (!turnId || turnId === "Unknown") return;

        turnSheetFactory.getTSBuildShips(turnId).then(function (rows) {
          $scope.tsNavyBuildList = $scope.normalizeBuildShipsRows(rows);
          $scope.refreshNavyBuildRows();
        });

        turnSheetFactory.getTSTransferGoods(turnId).then(function (rows) {
          $scope.tsNavyTransferGoodsList = rows || [];
          $scope.refreshNavyTransferGoodsRows();
        });
      };
    },
  };
});
