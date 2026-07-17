"use strict";

austerlitzModule.factory("landUnitsLocationCostFactory", function (boardingSharedFactory) {
  return {
    attach: function ($scope, rulesCatalogFactory) {
      var refStatesLoadPromise = null;

      $scope.getTurnStateCode = function () {
        if ($scope.masterData && $scope.masterData.selectedState) {
          return $scope.masterData.selectedState;
        }

        if (
          $scope.masterData &&
          $scope.masterData.turnId &&
          $scope.masterData.turnId.length >= 4
        ) {
          return $scope.masterData.turnId.substr(3, 1);
        }

        return null;
      };

      $scope.normalizeStateCode = function (value) {
        var text = (value || "").toString().trim().toUpperCase();
        return text ? text.substr(0, 1) : "";
      };

      $scope.normalizePoliticalSphereToken = function (value) {
        var text = (value || "").toString().trim();
        return text ? text.toUpperCase() : "";
      };

      $scope.buildRefStatesByCode = function (stateList) {
        var byCode = {};
        angular.forEach(stateList || [], function (state) {
          if (!state) return;
          var code = $scope.normalizeStateCode(state.State || state.state);
          if (!code) return;
          byCode[code] = state;
        });
        return byCode;
      };

      $scope.setRefStatesForPoliticalSphere = function (stateList) {
        $scope.refStatesList = stateList || [];
        $scope.refStatesByCode = $scope.buildRefStatesByCode(
          $scope.refStatesList,
        );
      };

      $scope.loadRefStatesForPoliticalSphere = function () {
        if (refStatesLoadPromise) return refStatesLoadPromise;
        refStatesLoadPromise = rulesCatalogFactory.getRefStates().then(
          function (stateList) {
            $scope.setRefStatesForPoliticalSphere(stateList || []);
            return $scope.refStatesList;
          },
          function () {
            $scope.setRefStatesForPoliticalSphere([]);
            return [];
          },
        );
        return refStatesLoadPromise;
      };

      $scope.getPoliticalSphereTokenSetForState = function (stateCode) {
        var homeState = $scope.normalizeStateCode(stateCode);
        if (!homeState) return {};
        var stateRow = ($scope.refStatesByCode || {})[homeState];
        if (!stateRow) return {};

        var rawSphere =
          stateRow.PoliticalSphere != null
            ? stateRow.PoliticalSphere
            : stateRow.politicalSphere;
        var text = rawSphere == null ? "" : rawSphere.toString().trim();
        if (!text || text.toLowerCase() === "none") return {};

        var tokenSet = {};
        angular.forEach(text.split(","), function (token) {
          var normalized = $scope.normalizePoliticalSphereToken(token);
          if (!normalized) return;
          tokenSet[normalized] = true;
        });
        return tokenSet;
      };

      $scope.getEuropeLocationCostRule = function (mapCoord, loadedStateCode) {
        var homeState = $scope.normalizeStateCode(loadedStateCode);
        if (!homeState || !mapCoord) {
          return {
            code: "",
            tooltip: "",
            moneyMultiplier: 1,
            isForeignEuropeOutsideSphere: false,
          };
        }

        var regionState = $scope.normalizeStateCode(mapCoord.state);
        var ownerCode = $scope.normalizePoliticalSphereToken(mapCoord.owner);
        if (regionState === homeState && ownerCode === homeState) {
          return {
            code: "H",
            tooltip: "H - 1x cost as brigade resides in European Home region.",
            moneyMultiplier: 1,
            isForeignEuropeOutsideSphere: false,
          };
        }

        var politicalSphereTokens =
          $scope.getPoliticalSphereTokenSetForState(homeState);

        if (regionState === homeState && politicalSphereTokens[ownerCode]) {
          return {
            code: "P",
            tooltip:
              "P - 1.5x cost as brigade resides in European Political sphere.",
            moneyMultiplier: 1.5,
            isForeignEuropeOutsideSphere: false,
          };
        }

        if (homeState != regionState) {
          return {
            code: "",
            tooltip: "",
            moneyMultiplier: 1,
            isForeignEuropeOutsideSphere: false,
          };
        }

        return {
          code: "O",
          tooltip:
            "O - 3x cost as brigade resides in European Outside region (not home or political sphere).",
          moneyMultiplier: 3,
          isForeignEuropeOutsideSphere: true,
        };
      };

      $scope.getMapCoordinateAt = function (x, y) {
        var px = parseInt(x, 10);
        var py = parseInt(y, 10);
        if (isNaN(px) || isNaN(py)) {
          return null;
        }

        var mapRows =
          ($scope.masterData &&
            $scope.masterData.turnReport &&
            $scope.masterData.turnReport.mapCoordinates) ||
          [];
        if (!mapRows[py] || !mapRows[py][px]) {
          return null;
        }
        return mapRows[py][px];
      };

      $scope.getLocationCostBadgeForBrigade = function (brigade) {
        if (!brigade || !brigade.source) {
          return { code: "", tooltip: "" };
        }

        var sphere = $scope.getBrigadeSphere(brigade);
        if (sphere === "Caribbean") {
          return {
            code: "C",
            tooltip: "C - 1x cost as brigade resides in Caribbean region.",
          };
        }
        if (sphere === "India") {
          return {
            code: "I",
            tooltip: "I - 1x cost as brigade resides in India region.",
          };
        }
        if (sphere !== "Europe") {
          return { code: "", tooltip: "" };
        }

        var mapCoord = $scope.getMapCoordinateAt(
          brigade.source.x_OrState,
          brigade.source.y_OrFleet,
        );
        var rule = $scope.getEuropeLocationCostRule(
          mapCoord,
          $scope.getTurnStateCode(),
        );
        return { code: rule.code, tooltip: rule.tooltip };
      };

      $scope.getExistingArmyLocationBadge = function (brigade) {
        return $scope.getLocationCostBadgeForBrigade(brigade);
      };

      $scope.getSphereFromCoordinates = function (x, y) {
        return boardingSharedFactory.getSphereFromCoordinates(x, y);
      };

      $scope.getBrigadeSphere = function (brigade) {
        if (!brigade || !brigade.source) {
          return "Unknown";
        }

        return $scope.getSphereFromCoordinates(
          brigade.source.x_OrState,
          brigade.source.y_OrFleet,
        );
      };

      $scope.getCommanderSphere = function (commander) {
        if (!commander || !commander.source) {
          return "Unknown";
        }

        if ((parseInt(commander.source.boarded, 10) || 0) > 0) {
          return "Unknown";
        }

        return $scope.getSphereFromCoordinates(
          commander.source.x,
          commander.source.y,
        );
      };

      $scope.getLandUnitSphere = function (unit) {
        if (unit && unit.kind === "commander") {
          return $scope.getCommanderSphere(unit);
        }

        return $scope.getBrigadeSphere(unit);
      };
    },
  };
});
