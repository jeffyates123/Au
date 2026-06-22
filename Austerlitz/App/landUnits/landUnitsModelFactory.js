"use strict";

austerlitzModule.factory("landUnitsModelFactory", function (boardingSharedFactory) {
  return {
    attach: function ($scope, rulesCatalogFactory) {
      var refStatesLoadPromise = null;
      var maxCommanderCount = 10;

      $scope.getBrigadesByFederation = function (federationNo) {
        return ($scope.brigadeRows || []).filter(function (brigade) {
          return $scope.sameNullableInt(brigade.fed, federationNo);
        });
      };

      $scope.getCommandersByFederation = function (federationNo) {
        return ($scope.commanderRows || []).filter(function (commander) {
          return $scope.sameNullableInt(commander.fed, federationNo);
        });
      };

      $scope.getLandUnitsByFederation = function (federationNo) {
        return $scope
          .getBrigadesByFederation(federationNo)
          .concat($scope.getCommandersByFederation(federationNo));
      };

      $scope.getBrigadeById = function (id) {
        for (var i = 0; i < $scope.brigadeRows.length; i++) {
          if ($scope.sameNullableInt($scope.brigadeRows[i].id, id)) {
            return $scope.brigadeRows[i];
          }
        }

        return null;
      };

      $scope.getCommanderById = function (id) {
        for (var i = 0; i < ($scope.commanderRows || []).length; i++) {
          if ($scope.sameNullableInt($scope.commanderRows[i].id, id)) {
            return $scope.commanderRows[i];
          }
        }

        return null;
      };

      $scope.getLandUnitById = function (id) {
        return $scope.getBrigadeById(id) || $scope.getCommanderById(id);
      };

      $scope.getLandUnitKey = function (unit) {
        if (!unit) {
          return "";
        }

        return (unit.kind || "brigade") + ":" + (unit.id || "");
      };

      $scope.getLandFederationPartSummary = function (federationNo) {
        var parsedFederationNo = parseInt(federationNo, 10);
        if (
          isNaN(parsedFederationNo) ||
          parsedFederationNo < 61 ||
          parsedFederationNo > 90
        ) {
          return "-";
        }

        var brigadesCount =
          $scope.getBrigadesByFederation(parsedFederationNo).length;
        var commandersCount =
          $scope.getCommandersByFederation(parsedFederationNo).length;
        return "B:" + brigadesCount + " C:" + commandersCount;
      };

      $scope.sameNullableInt = function (left, right) {
        return parseInt(left, 10) === parseInt(right, 10);
      };

      $scope.buildBattalionDisplays = function (brigade) {
        var battalions = [];
        for (var i = 1; i <= 7; i++) {
          battalions.push($scope.buildBattalionDisplay(brigade, i));
        }
        return battalions;
      };

      $scope.buildBattalionDisplay = function (brigade, index) {
        var type = $scope.trimValue(brigade["batt" + index + "Type"]);
        var ef = brigade["batt" + index + "EF"];
        var size = brigade["batt" + index + "Size"];

        if (!type || type === "--") {
          return {
            slot: index,
            type: "",
            originalEf: null,
            currentEf: null,
            baseSize: null,
            size: null,
            display: "",
            isEfChanged: false,
            efDrop: 0,
            efIncrease: 0,
            isNewAddition: false,
            isLockedByTurnOrder: false,
            isDemolishedThisTurn: false,
            demolishedType: "",
            demolishedOriginalEf: null,
            demolishedOriginalSize: null,
          };
        }

        return {
          slot: index,
          type: type,
          originalEf: ef,
          currentEf: ef,
          baseSize: size,
          size: size,
          display: $scope.formatBattalionParts(type, ef, size),
          isEfChanged: false,
          efDrop: 0,
          efIncrease: 0,
          isNewAddition: false,
          isLockedByTurnOrder: false,
          isDemolishedThisTurn: false,
          demolishedType: "",
          demolishedOriginalEf: null,
          demolishedOriginalSize: null,
        };
      };

      $scope.formatBattalionParts = function (type, ef, size) {
        var parts = [type];
        if (ef != null && ef !== "") parts.push(ef);
        if (size != null && size !== "") parts.push(size);
        return parts.join(" ");
      };

      $scope.calculatePlaceholderResources = function () {
        return {
          ld: "",
          citizens: "",
          ecPts: "",
          horses: "",
        };
      };

      $scope.buildArmyListLookup = function (armyList) {
        var lookup = {};
        angular.forEach(armyList || [], function (armyItem) {
          if (armyItem.shortName != null) {
            var key = armyItem.shortName.toString().trim().toUpperCase();
            if (key && !lookup[key]) {
              lookup[key] = armyItem;
            }
          }
        });
        return lookup;
      };

      $scope.normalizeBrigadeBattalionEfValues = function () {
        angular.forEach($scope.brigadeRows || [], function (brigade) {
          angular.forEach(
            (brigade && brigade.battalions) || [],
            function (battalion) {
              if (!battalion || !battalion.type) {
                return;
              }

              var existingEf = parseInt(battalion.originalEf, 10);
              if (!isNaN(existingEf) && existingEf > 0) {
                return;
              }

              var armyItem =
                $scope.armyListByShortName[
                  (battalion.type || "").toString().trim().toUpperCase()
                ];
              if (!armyItem) {
                return;
              }

              var defaultEf = parseInt(armyItem.ef, 10);
              if (isNaN(defaultEf)) {
                defaultEf = parseInt(armyItem.EF, 10);
              }
              if (isNaN(defaultEf) || defaultEf <= 0) {
                return;
              }

              battalion.originalEf = defaultEf;
              battalion.currentEf = defaultEf;
              battalion.display = $scope.formatBattalionParts(
                battalion.type,
                battalion.currentEf,
                battalion.size,
              );
              if (brigade.source) {
                brigade.source["batt" + battalion.slot + "EF"] = defaultEf;
              }
            },
          );
        });
      };

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

      $scope.compareBrigadeRowsForDisplay = function (left, right) {
        var sphereCompare =
          $scope.getSphereSortOrder(left) - $scope.getSphereSortOrder(right);
        if (sphereCompare !== 0) {
          return sphereCompare;
        }

        var leftFederation = $scope.getFederationSortNo(left);
        var rightFederation = $scope.getFederationSortNo(right);
        var leftHasFederation = leftFederation > 0;
        var rightHasFederation = rightFederation > 0;

        if (leftHasFederation !== rightHasFederation) {
          return leftHasFederation ? 1 : -1;
        }

        if (leftHasFederation && leftFederation !== rightFederation) {
          return leftFederation - rightFederation;
        }

        return $scope.getUnitSortNo(left) - $scope.getUnitSortNo(right);
      };

      $scope.getSphereSortOrder = function (brigade) {
        switch ($scope.getLandUnitSphere(brigade)) {
          case "Europe":
            return 1;
          case "Caribbean":
            return 2;
          case "India":
            return 3;
          default:
            return 99;
        }
      };

      $scope.getFederationSortNo = function (brigade) {
        var federationNo = parseInt(brigade && brigade.fed, 10);
        return isNaN(federationNo) ? 0 : federationNo;
      };

      $scope.getUnitSortNo = function (brigade) {
        var unitNo = parseInt(brigade && brigade.id, 10);
        return isNaN(unitNo) ? 0 : unitNo;
      };

      $scope.compareCommanderRowsForDisplay = function (left, right) {
        return $scope.getUnitSortNo(left) - $scope.getUnitSortNo(right);
      };

      $scope.formatPosition = function (brigade) {
        var x = $scope.trimValue(brigade.x_OrState);
        var y = $scope.trimValue(brigade.y_OrFleet);
        if (!x && !y) {
          return "";
        }
        return x + "/" + y;
      };

      $scope.formatFederation = function (federation) {
        return federation && federation !== 0 ? federation : "";
      };

      $scope.formatCommanderBoarded = function (boardedValue) {
        var parsed = parseInt(boardedValue, 10);
        return !isNaN(parsed) && parsed > 0 ? "Yes" : "";
      };

      $scope.getLandUnitPositionKey = function (unit) {
        if (!unit) {
          return "";
        }

        if (unit.position) {
          return $scope.trimValue(unit.position);
        }

        if (!unit.source) {
          return "";
        }

        var x =
          unit.source.x_OrState != null ? unit.source.x_OrState : unit.source.x;
        var y =
          unit.source.y_OrFleet != null ? unit.source.y_OrFleet : unit.source.y;
        return $scope.formatPosition({ x_OrState: x, y_OrFleet: y });
      };

      $scope.togglePositionFilter = function (unit) {
        var positionKey = $scope.getLandUnitPositionKey(unit);
        if (!positionKey) {
          return;
        }

        var sphereKey = $scope.getLandUnitSphere(unit);
        if (!sphereKey || sphereKey === "Unknown") {
          sphereKey = "All";
        }

        if ($scope.positionFilter === positionKey) {
          $scope.positionFilter = null;
          $scope.selectedSphere = sphereKey;
          $scope.onSphereChanged();
          return;
        }

        if (
          !$scope.positionFilter &&
          sphereKey !== "All" &&
          $scope.selectedSphere === sphereKey
        ) {
          $scope.positionFilter = positionKey;
          $scope.refreshCommanderPairRows();
          return;
        }

        $scope.selectedSphere = sphereKey;
        $scope.positionFilter = positionKey;
        $scope.onSphereChanged();
      };

      $scope.clearPositionFilter = function () {
        $scope.positionFilter = null;
        $scope.selectedSphere = "All";
        $scope.onSphereChanged();
      };

      $scope.matchesPositionFilter = function (unit) {
        if (!$scope.positionFilter) {
          return true;
        }

        return $scope.getLandUnitPositionKey(unit) === $scope.positionFilter;
      };

      $scope.getStateColor = function () {
        var stateCode = (
          $scope.masterData && $scope.masterData.selectedState
            ? $scope.masterData.selectedState
            : ""
        )
          .toString()
          .trim()
          .toUpperCase();
        var stateColors = {
          A: "rgb(198, 23, 23)",
          B: "rgb(51,153,102)",
          D: "rgb(255, 204, 153)",
          E: "rgb(234, 230, 21)",
          F: "rgb(47, 164, 231)",
          G: "rgb(135, 219, 106)",
          H: "rgb(255, 106, 0)",
          I: "rgb(0, 255, 0)",
          K: "rgb(181, 36, 165)",
          M: "rgb(206, 203, 83)",
          N: "rgb(128, 128, 0)",
          P: "rgb(128, 128, 128)",
          R: "rgb(192, 192, 192)",
          S: "rgb(255, 255, 153)",
          T: "black",
          W: "rgb(0, 128, 0)",
        };

        return {
          backgroundColor: stateColors[stateCode] || "#777777",
          textColor: stateCode === "T" ? "rgb(192, 192, 192)" : "#111111",
        };
      };

      $scope.trimValue = function (value) {
        return value == null ? "" : value.toString().trim();
      };

      $scope.loadArmyListForHeadcountCosts = function () {
        var stateCode = $scope.getTurnStateCode();
        return rulesCatalogFactory.getArmyList(stateCode).then(
          function (armyList) {
            $scope.armyListRows = armyList || [];
            $scope.armyListByShortName = $scope.buildArmyListLookup(armyList);
            $scope.normalizeBrigadeBattalionEfValues();
          },
          function () {
            $scope.armyListRows = [];
            $scope.armyListByShortName = {};
          },
        );
      };

      $scope.refreshBrigadeRows = function () {
        var brigades =
          $scope.masterData &&
          $scope.masterData.turnReport &&
          $scope.masterData.turnReport.brigades
            ? $scope.masterData.turnReport.brigades
            : [];

        $scope.brigadeRows = brigades
          .map(function (brigade, index) {
            return {
              id: brigade.itemNo,
              loadedOrder: index,
              name: $scope.trimValue(brigade.name),
              position: $scope.formatPosition(brigade),
              fed: $scope.formatFederation(brigade.federation),
              originalFed: $scope.formatFederation(brigade.federation),
              fedChanged: false,
              mp: brigade.mp,
              battalions: $scope.buildBattalionDisplays(brigade),
              trainSelected: false,
              trainPlan: null,
              headcountSelected: false,
              headcountPlan: null,
              resources: $scope.calculatePlaceholderResources(),
              source: brigade,
            };
          })
          .sort($scope.compareBrigadeRowsForDisplay);
      };

      $scope.refreshCommanderRows = function () {
        var commanders =
          $scope.masterData &&
          $scope.masterData.turnReport &&
          $scope.masterData.turnReport.commanders
            ? $scope.masterData.turnReport.commanders
            : [];
        var boundedCommanders = commanders.slice(0, maxCommanderCount);
        $scope.commanderOverflowCount = Math.max(
          0,
          commanders.length - maxCommanderCount,
        );

        $scope.commanderRows = boundedCommanders
          .map(function (commander, index) {
            var federationNo = $scope.formatFederation(commander.federation);
            return {
              kind: "commander",
              id: commander.itemNo,
              loadedOrder: index,
              rank: $scope.trimValue(commander.rank),
              name: $scope.trimValue(commander.name),
              position: commander.boarded
                ? ""
                : $scope.formatPosition({
                    x_OrState: commander.x,
                    y_OrFleet: commander.y,
                  }),
              fed: federationNo,
              originalFed: federationNo,
              fedChanged: false,
              mp: commander.mp,
              commandCapacity: commander.commandCapacity,
              boarded: $scope.formatCommanderBoarded(commander.boarded),
              boardingSelected: (parseInt(commander.boarded, 10) || 0) > 0,
              boardingFleetNo:
                (parseInt(commander.boarded, 10) || 0) > 0
                  ? parseInt(commander.boarded, 10)
                  : null,
              source: commander,
            };
          })
          .sort($scope.compareCommanderRowsForDisplay);
        $scope.refreshCommanderPairRows();
      };

      $scope.filteredBrigadeRows = function () {
        if (!$scope.selectedSphere || $scope.selectedSphere === "All") {
          return ($scope.brigadeRows || []).filter(function (brigade) {
            return $scope.matchesPositionFilter(brigade);
          });
        }

        return $scope.brigadeRows.filter(function (brigade) {
          return (
            $scope.getBrigadeSphere(brigade) === $scope.selectedSphere &&
            $scope.matchesPositionFilter(brigade)
          );
        });
      };

      $scope.filteredCommanderRows = function () {
        if (!$scope.selectedSphere || $scope.selectedSphere === "All") {
          return ($scope.commanderRows || []).filter(function (commander) {
            return $scope.matchesPositionFilter(commander);
          });
        }

        return ($scope.commanderRows || []).filter(function (commander) {
          return (
            $scope.getCommanderSphere(commander) === $scope.selectedSphere &&
            $scope.matchesPositionFilter(commander)
          );
        });
      };

      $scope.refreshCommanderPairRows = function () {
        var commanders = $scope.filteredCommanderRows() || [];
        var pairRows = [];
        for (var i = 0; i < commanders.length; i += 2) {
          pairRows.push({
            left: commanders[i],
            right: commanders[i + 1] || null,
          });
        }

        $scope.commanderPairRows = pairRows;
      };

      $scope.onSphereChanged = function () {
        try {
          window.localStorage.setItem(
            "austerlitz.landUnits.selectedSphere",
            $scope.selectedSphere || "All",
          );
        } catch (e) {}
        $scope.refreshCommanderPairRows();
      };

      $scope.toggleCommandersSection = function () {
        $scope.commandersSectionCollapsed = !$scope.commandersSectionCollapsed;
        try {
          window.localStorage.setItem(
            "austerlitz.landUnits.commandersSectionCollapsed",
            $scope.commandersSectionCollapsed ? "true" : "false",
          );
        } catch (e) {}
      };
    },
  };
});
