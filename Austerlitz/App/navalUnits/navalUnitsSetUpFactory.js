"use strict";

austerlitzModule.factory(
  "navalUnitsSetUpFactory",
  function (ts01TransferGoodsUtilsFactory) {
  var MAX_BUILD_ROWS = 8;
  var MAX_TRANSFER_GOODS_ROWS = 10;
  var WARSHIP_MAX_TYPE = 25;
  var TS_NAVY_TRANSFER_SECTION = "10";

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

  function getSectionNumber(sectionNo) {
    var text = (sectionNo || "").toString().trim().toUpperCase();
    if (!text) return null;
    if (text.indexOf("TS") === 0) {
      text = text.substring(2);
    }
    var parsed = parseInt(text, 10);
    return isNaN(parsed) ? null : parsed;
  }

  function isManagedNavyTransferSection(sectionNo) {
    return getSectionNumber(sectionNo) === 10;
  }

  function isTransferGoodsRowEmpty(row) {
    if (!row) return true;
    return (
      toInt(row.from, 0) <= 0 &&
      toInt(row.to, 0) <= 0 &&
      toInt(row.louisdore, 0) <= 0 &&
      toInt(row.citizens, 0) <= 0 &&
      toInt(row.ecPts, 0) <= 0 &&
      toInt(row.wood, 0) <= 0 &&
      toInt(row.horses, 0) <= 0 &&
      toInt(row.textiles, 0) <= 0
    );
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
        $scope.tsNavyTransferGoodsRows = ($scope.tsNavyTransferGoodsList || [])
          .filter(function (r) {
            return isManagedNavyTransferSection(r.turnSheetSectionNo);
          })
          .sort(function (a, b) {
            return toInt(a.orderNo, 0) - toInt(b.orderNo, 0);
          });
      };

      $scope.recalculateNavyBuildCostRows = function () {
        if (
          !$scope.hasLoadedNavyBuildRows ||
          !$scope.hasLoadedNavyTransferGoodsRows ||
          !$scope.tsNavyBuildRows ||
          !$scope.tsNavyTransferGoodsList
        ) {
          return;
        }

        var groupedByShipyard = {};
        angular.forEach($scope.tsNavyBuildRows || [], function (row) {
          var shipyard = toInt(row && row.shipyard, 0);
          var shipType = toInt(row && row.shipType, 0);
          if (!shipyard || !shipType) return;

          var refShip = $scope.getRefShipByType(shipType) || {};
          if (!groupedByShipyard[shipyard]) {
            groupedByShipyard[shipyard] = {
              shipyard: shipyard,
              louisdore: 0,
              citizens: 0,
              ecPts: 0,
              wood: 0,
              textiles: 0,
            };
          }

          groupedByShipyard[shipyard].louisdore += toInt(refShip.cost, 0);
          groupedByShipyard[shipyard].citizens += toInt(refShip.citizens, 0);
          groupedByShipyard[shipyard].ecPts += toInt(refShip.ecPts, 0);
          groupedByShipyard[shipyard].wood += toInt(refShip.wood, 0);
          groupedByShipyard[shipyard].textiles += toInt(refShip.textiles, 0);
        });

        var allRows = $scope.tsNavyTransferGoodsList || [];
        var keptRows = allRows.filter(function (row) {
          return (
            !isManagedNavyTransferSection(row.turnSheetSectionNo) &&
            !isTransferGoodsRowEmpty(row)
          );
        });

        var usedOrderNos = {};
        angular.forEach(keptRows, function (row) {
          var n = toInt(row && row.orderNo, 0);
          if (n > 0 && n <= MAX_TRANSFER_GOODS_ROWS) {
            usedOrderNos[n] = true;
          }
        });

        var groupedRows = Object.keys(groupedByShipyard)
          .map(function (key) {
            return groupedByShipyard[key];
          })
          .sort(function (a, b) {
            return a.shipyard - b.shipyard;
          });

        var managedRows = [];
        var overflowCount = 0;
        angular.forEach(groupedRows, function (row) {
          var yard = null;
          var yards = $scope.eligibleShipyards || [];
          for (var yi = 0; yi < yards.length; yi++) {
            if (toInt(yards[yi] && yards[yi].itemNo, 0) === row.shipyard) {
              yard = yards[yi];
              break;
            }
          }
          var fromWarehouse = yard
            ? ts01TransferGoodsUtilsFactory.getWarehouseNoForCoordinate(
                yard.x,
                yard.y,
              )
            : null;

          var nextOrderNo = null;
          for (var i = 1; i <= MAX_TRANSFER_GOODS_ROWS; i++) {
            if (!usedOrderNos[i]) {
              nextOrderNo = i;
              usedOrderNos[i] = true;
              break;
            }
          }

          if (nextOrderNo == null) {
            overflowCount++;
            return;
          }

          managedRows.push({
            turnId: $scope.masterData && $scope.masterData.turnId,
            orderNo: nextOrderNo,
            turnSheetSectionNo: TS_NAVY_TRANSFER_SECTION,
            from: fromWarehouse,
            to: row.shipyard,
            louisdore: row.louisdore || null,
            citizens: row.citizens || null,
            ecPts: row.ecPts || null,
            wood: row.wood || null,
            textiles: row.textiles || null,
            horses: null,
          });
        });

        $scope.tsNavyTransferGoodsList = keptRows.concat(managedRows);
        $scope.refreshNavyTransferGoodsRows();
        if (!$scope.tsNavyTransferGoodsList.length) {
          return;
        }
        console.log(
          "Navy costs recalc",
          "buildGroups=" + groupedRows.length,
          "keptRows=" + keptRows.length,
          "managedRows=" + managedRows.length,
        );
        if (overflowCount > 0) {
          console.warn(
            "Navy build cost rows exceed TS_01 capacity by " +
              overflowCount +
              " row(s).",
          );
        }
        $scope.queueNavySave("TransferGoods");
      };

      $scope.loadNavySetUpData = function () {
        var turnId = $scope.masterData && $scope.masterData.turnId;
        if (!turnId || turnId === "Unknown") return;
        $scope.hasLoadedNavyBuildRows = false;
        $scope.hasLoadedNavyTransferGoodsRows = false;

        turnSheetFactory.getTSBuildShips(turnId).then(function (rows) {
          $scope.tsNavyBuildList = $scope.normalizeBuildShipsRows(rows);
          $scope.refreshNavyBuildRows();
          $scope.hasLoadedNavyBuildRows = true;
          $scope.recalculateNavyBuildCostRows();
        });

        turnSheetFactory.getTSTransferGoods(turnId).then(function (rows) {
          $scope.tsNavyTransferGoodsList = rows || [];
          $scope.refreshNavyTransferGoodsRows();
          $scope.hasLoadedNavyTransferGoodsRows = true;
          $scope.recalculateNavyBuildCostRows();
        });
      };
    },
  };
  },
);
