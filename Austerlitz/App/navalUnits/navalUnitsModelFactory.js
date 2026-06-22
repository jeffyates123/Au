"use strict";

austerlitzModule.factory(
  "navalUnitsModelFactory",
  function (turnAssignmentResolverFactory, boardingSharedFactory) {
    var WARSHIP_MAX_TYPE = 25;
    var SEA_TERRAIN_CHARS = { "*": true, "+": true, ".": true };
    var SHIPYARD_PROD_SITE_CHARS = { "&": true, $: true };

  return {
    attach: function ($scope) {
      $scope.trimValue = function (value) {
        return value == null ? "" : value.toString().trim();
      };

      $scope.sameNullableInt = function (left, right) {
        return parseInt(left, 10) === parseInt(right, 10);
      };

      $scope.isWarshipType = function (typeNo) {
        var t = parseInt(typeNo, 10);
        return !isNaN(t) && t > 0 && t <= WARSHIP_MAX_TYPE;
      };

      $scope.formatShipPosition = function (x, y) {
        var px = parseInt(x, 10);
        var py = parseInt(y, 10);
        return isNaN(px) || isNaN(py) ? "" : px + "/" + py;
      };

      $scope.formatCondition = function (condition) {
        var c = parseInt(condition, 10);
        return isNaN(c) ? "" : c + "%";
      };

      $scope.formatFleet = function (fleetNo) {
        var f = parseInt(fleetNo, 10);
        return !isNaN(f) && f > 0 ? f : "";
      };

      $scope.compareShipsForDisplay = function (a, b) {
        var ax = parseInt(a.x, 10) || 0;
        var bx = parseInt(b.x, 10) || 0;
        if (ax !== bx) return ax - bx;
        var ay = parseInt(a.y, 10) || 0;
        var by = parseInt(b.y, 10) || 0;
        if (ay !== by) return ay - by;
        var at = parseInt(a.type, 10) || 0;
        var bt = parseInt(b.type, 10) || 0;
        if (at !== bt) return at - bt;
        return (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0);
      };

      $scope.getNavySphereFromCoordinates = function (x, y) {
        return boardingSharedFactory.getSphereFromCoordinates(x, y);
      };

      $scope.getNavySphereForShip = function (ship) {
        if (!ship) return "Unknown";
        return $scope.getNavySphereFromCoordinates(ship.x, ship.y);
      };

      $scope.matchesNavyPositionOrSphereFilter = function (ship) {
        if (!ship) return false;
        if ($scope.navyPositionFilter) return ship.position === $scope.navyPositionFilter;
        if ($scope.navySphereFilter) return $scope.getNavySphereForShip(ship) === $scope.navySphereFilter;
        return true;
      };

      $scope.buildWarshipRows = function () {
        var warships =
          ($scope.masterData &&
            $scope.masterData.turnReport &&
            $scope.masterData.turnReport.warships) ||
          [];

        $scope.warshipRows = warships
          .map(function (w) {
            var fleetNo = $scope.formatFleet(w.fleetNo);
            return {
              id: w.itemNo,
              type: w.type,
              name: $scope.trimValue(w.name),
              position: $scope.formatShipPosition(w.x, w.y),
              x: w.x,
              y: w.y,
              fleet: fleetNo,
              originalFleet: fleetNo,
              fleetChanged: false,
              mp: w.mp,
              condition: $scope.formatCondition(w.condition),
              conditionRaw: w.condition,
              age: w.age,
              marines: w.marines,
              brigade1: w.brigade1,
              brigade2: w.brigade2,
              source: w,
            };
          })
          .sort($scope.compareShipsForDisplay);
        $scope.buildFleetSummaryRows();
        $scope.refreshWarshipPairRows();
      };

      $scope.buildMerchantRows = function () {
        var merchants =
          ($scope.masterData &&
            $scope.masterData.turnReport &&
            $scope.masterData.turnReport.merchantShips) ||
          [];

        $scope.merchantRows = merchants
          .map(function (m) {
            var fleetNo = $scope.formatFleet(m.fleetNo);
            return {
              id: m.itemNo,
              type: m.type,
              position: $scope.formatShipPosition(m.x, m.y),
              x: m.x,
              y: m.y,
              fleet: fleetNo,
              originalFleet: fleetNo,
              fleetChanged: false,
              mp: m.mp,
              condition: $scope.formatCondition(m.condition),
              conditionRaw: m.condition,
              age: m.age,
              goods1: m.goods1,
              qty1: m.quantity1,
              goods2: m.goods2,
              qty2: m.quantity2,
              money: m.money,
              source: m,
            };
          })
          .sort($scope.compareShipsForDisplay);
        $scope.buildFleetSummaryRows();
        $scope.refreshMerchantPairRows();
      };

      $scope.buildFleetSummaryRows = function () {
        var allShips = (($scope.warshipRows || []).concat($scope.merchantRows || []))
          .filter(function (ship) {
            return $scope.matchesNavyPositionOrSphereFilter(ship);
          })
          .slice()
          .sort($scope.compareShipsForDisplay);
        var formFederationRows = $scope.navyFormFederationRows || [];
        var summariesByFleet = {};

        function toInt(value, fallback) {
          var parsed = parseInt(value, 10);
          return isNaN(parsed) ? fallback : parsed;
        }

        var turnReport =
          ($scope.masterData && $scope.masterData.turnReport) || {};
        var rulesCatalog =
          ($scope.masterData && $scope.masterData.rulesCatalog) || {};
        var loadedCapacityByFleet =
          boardingSharedFactory.buildFleetUsedCapacityLookup(
            $scope.tsBoardingList || [],
            null,
            true,
            function (itemNo) {
              return boardingSharedFactory.getBoardedItemLoadCapacity(
                turnReport,
                rulesCatalog,
                itemNo,
                $scope.sameNullableInt,
              );
            },
            $scope.sameNullableInt,
          );

        angular.forEach(allShips, function (ship) {
          var fleetNo =
            turnAssignmentResolverFactory.resolveEffectiveShipFleetNoForShip(
              ship,
              formFederationRows,
            );
          if (fleetNo == null || fleetNo <= 0) return;

          var summary = summariesByFleet[fleetNo];
          if (!summary) {
            summary = {
              fleetNo: fleetNo,
              maxMp: null,
              warships: 0,
              merchants: 0,
              loadingCap: 0,
                boardedCapRaw: boardingSharedFactory.roundTo2(
                  loadedCapacityByFleet[fleetNo] || 0,
                ),
              boardedCap: 0,
              availableCap: 0,
              position: ship.position || "",
              x: toInt(ship.x, 0),
              y: toInt(ship.y, 0),
            };
            summariesByFleet[fleetNo] = summary;
          }

          if ($scope.isWarshipType(ship.type)) {
            summary.warships += 1;
          } else {
            summary.merchants += 1;
          }

          var shipMp = toInt(ship.mp, null);
          if (shipMp != null) {
            summary.maxMp =
              summary.maxMp == null ? shipMp : Math.min(summary.maxMp, shipMp);
          }

          var shipDef = $scope.getRefShipByType(ship.type);
          summary.loadingCap += toInt(shipDef && shipDef.loadCapacity, 0);
        });

        angular.forEach(summariesByFleet, function (summary) {
          summary.maxMp = summary.maxMp == null ? "" : summary.maxMp;
          summary.boardedCap = Math.floor(summary.boardedCapRaw || 0);
          summary.availableCap = summary.loadingCap - summary.boardedCap;
        });

        var summaries = Object.keys(summariesByFleet)
          .map(function (fleetKey) {
            return summariesByFleet[fleetKey];
          })
          .sort(function (a, b) {
            if (a.x !== b.x) return a.x - b.x;
            if (a.y !== b.y) return a.y - b.y;
            return a.fleetNo - b.fleetNo;
          });

        var pairRows = [];
        for (var i = 0; i < summaries.length; i += 2) {
          pairRows.push({ left: summaries[i], right: summaries[i + 1] || null });
        }
        $scope.fleetSummaryPairRows = pairRows;
      };

      $scope.toggleNavyPositionFilter = function (ship) {
        var pos = ship && ship.position;
        if (!pos) return;

        var sphere = $scope.getNavySphereForShip(ship);
        var sphereKey = sphere && sphere !== "Unknown" ? sphere : null;

        if ($scope.navyPositionFilter === pos) {
          $scope.navyPositionFilter = null;
          $scope.navySphereFilter = sphereKey;
          $scope.buildFleetSummaryRows();
          $scope.refreshWarshipPairRows();
          $scope.refreshMerchantPairRows();
          return;
        }

        if (
          !$scope.navyPositionFilter &&
          sphereKey &&
          $scope.navySphereFilter === sphereKey
        ) {
          $scope.navyPositionFilter = pos;
          $scope.navySphereFilter = null;
          $scope.buildFleetSummaryRows();
          $scope.refreshWarshipPairRows();
          $scope.refreshMerchantPairRows();
          return;
        }

        $scope.navyPositionFilter = pos;
        $scope.navySphereFilter = null;
        $scope.buildFleetSummaryRows();
        $scope.refreshWarshipPairRows();
        $scope.refreshMerchantPairRows();
      };

      $scope.clearNavyPositionFilter = function () {
        $scope.navyPositionFilter = null;
        $scope.navySphereFilter = null;
        $scope.buildFleetSummaryRows();
        $scope.refreshWarshipPairRows();
        $scope.refreshMerchantPairRows();
      };

      $scope.refreshWarshipPairRows = function () {
        var ships = ($scope.warshipRows || []).filter(function (s) {
          return $scope.matchesNavyPositionOrSphereFilter(s);
        });
        var pairs = [];
        for (var i = 0; i < ships.length; i += 2) {
          pairs.push({ left: ships[i], right: ships[i + 1] || null });
        }
        $scope.warshipPairRows = pairs;
      };

      $scope.refreshMerchantPairRows = function () {
        var ships = ($scope.merchantRows || []).filter(function (s) {
          return $scope.matchesNavyPositionOrSphereFilter(s);
        });
        var pairs = [];
        for (var i = 0; i < ships.length; i += 2) {
          pairs.push({ left: ships[i], right: ships[i + 1] || null });
        }
        $scope.merchantPairRows = pairs;
      };

      $scope.getWarshipById = function (id) {
        for (var i = 0; i < ($scope.warshipRows || []).length; i++) {
          if ($scope.sameNullableInt($scope.warshipRows[i].id, id)) {
            return $scope.warshipRows[i];
          }
        }
        return null;
      };

      $scope.getMerchantById = function (id) {
        for (var i = 0; i < ($scope.merchantRows || []).length; i++) {
          if ($scope.sameNullableInt($scope.merchantRows[i].id, id)) {
            return $scope.merchantRows[i];
          }
        }
        return null;
      };

      $scope.getShipById = function (id) {
        return $scope.getWarshipById(id) || $scope.getMerchantById(id);
      };

      $scope.toggleWarshipsSection = function () {
        $scope.warshipsSectionCollapsed = !$scope.warshipsSectionCollapsed;
        try {
          window.localStorage.setItem(
            "austerlitz.navy.warshipsSectionCollapsed",
            $scope.warshipsSectionCollapsed ? "true" : "false",
          );
        } catch (e) {}
      };

      $scope.toggleMerchantsSection = function () {
        $scope.merchantsSectionCollapsed = !$scope.merchantsSectionCollapsed;
        try {
          window.localStorage.setItem(
            "austerlitz.navy.merchantsSectionCollapsed",
            $scope.merchantsSectionCollapsed ? "true" : "false",
          );
        } catch (e) {}
      };

      $scope.buildRefShipsIndex = function () {
        var ships = $scope.refShips || [];
        var byType = {};
        angular.forEach(ships, function (s) {
          var type = parseInt(s.type || s.Type, 10);
          if (!isNaN(type) && type > 0) {
            byType[type] = {
              type: type,
              name: s.name || s.Name || "",
              shipClass:
                s.shipClass != null
                  ? s.shipClass
                  : s.ShipClass != null
                    ? s.ShipClass
                    : null,
              wood: s.wood || s.Wood || 0,
              ecPts: s.ecPts || s.EcPts || 0,
              textiles: s.textiles || s.Textiles || 0,
              citizens: s.citizens || s.Citizens || 0,
              cost: s.cost || s.Cost || 0,
              maintenance: s.maintenance || s.Maintenance || 0,
              loadCapacity: s.loadCapacity || s.LoadCapacity || 0,
              movementFactor: s.movementFactor || s.MovementFactor || 0,
            };
          }
        });
        $scope.refShipsByType = byType;
        $scope.buildFleetSummaryRows();
      };

      $scope.getRefShipByType = function (typeNo) {
        if (!typeNo) return null;
        return $scope.refShipsByType[parseInt(typeNo, 10)] || null;
      };

      $scope.getShipTypeLabel = function (typeNo) {
        var t = parseInt(typeNo, 10);
        if (isNaN(t)) return "";
        var ship = $scope.refShipsByType[t];
        if (!ship) return t.toString();
        return ship.shipClass != null
          ? ship.name + " (" + ship.shipClass + ")"
          : ship.name;
      };

      // Shipyard + sea-access eligibility helpers (client-side using mapCoordinates).
      function isShipyardCoord(coord) {
        if (!coord || !coord.productionSite) return false;
        var site = coord.productionSite.toString().toUpperCase().trim();
        return !!SHIPYARD_PROD_SITE_CHARS[site];
      }

      function hasAdjacentSea(mapCoordinates, x, y) {
        var adjacents = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
        for (var i = 0; i < adjacents.length; i++) {
          var ax = adjacents[i][0];
          var ay = adjacents[i][1];
          if (
            ay >= 0 &&
            ay < mapCoordinates.length &&
            mapCoordinates[ay] &&
            ax >= 0 &&
            ax < mapCoordinates[ay].length &&
            mapCoordinates[ay][ax]
          ) {
            var coord = mapCoordinates[ay][ax];
            if (
              coord &&
              coord.terrain &&
              SEA_TERRAIN_CHARS[coord.terrain]
            ) {
              return true;
            }
          }
        }
        return false;
      }

      $scope.buildEligibleShipyardOptions = function () {
        var turnReport = $scope.masterData && $scope.masterData.turnReport;
        if (!turnReport) {
          $scope.eligibleShipyards = [];
          return;
        }

        var barracks = turnReport.barracks || [];
        var mapCoordinates = turnReport.mapCoordinates || [];
        var eligible = [];

        angular.forEach(barracks, function (b) {
          var x = parseInt(b.x, 10);
          var y = parseInt(b.y, 10);
          if (isNaN(x) || isNaN(y)) return;

          var mapCoord =
            mapCoordinates[y] && mapCoordinates[y][x]
              ? mapCoordinates[y][x]
              : null;
          if (!isShipyardCoord(mapCoord)) return;
          if (!hasAdjacentSea(mapCoordinates, x, y)) return;

          var itemNo = parseInt(b.itemNo, 10);
          if (!itemNo) return;

          eligible.push({
            itemNo: itemNo,
            x: x,
            y: y,
            label: itemNo + " (" + x + "/" + y + ")",
          });
        });

        eligible.sort(function (a, b) {
          return a.itemNo - b.itemNo;
        });
        $scope.eligibleShipyards = eligible;
      };

      $scope.isShipAtEligibleShipyard = function (ship) {
        if (!ship) return false;
        var sx = parseInt(ship.x, 10);
        var sy = parseInt(ship.y, 10);
        if (isNaN(sx) || isNaN(sy)) return false;

        for (var i = 0; i < ($scope.eligibleShipyards || []).length; i++) {
          var yard = $scope.eligibleShipyards[i];
          if (yard.x === sx && yard.y === sy) return true;
        }
        return false;
      };
    },
  };
}
);
