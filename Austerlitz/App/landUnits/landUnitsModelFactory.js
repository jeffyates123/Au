"use strict";

austerlitzModule.factory("landUnitsModelFactory", function () {
  return {
    attach: function ($scope, rulesCatalogFactory) {
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

      $scope.loadArmyListForHeadcountCosts = function () {
        var stateCode = $scope.getTurnStateCode();
        return rulesCatalogFactory.getArmyList(stateCode).then(
          function (armyList) {
            $scope.armyListRows = armyList || [];
            $scope.armyListByShortName = $scope.buildArmyListLookup(armyList);
            $scope.normalizeBrigadeBattalionEfValues();
            $scope.refreshFederationSummaryPairRows();
          },
          function () {
            $scope.armyListRows = [];
            $scope.armyListByShortName = {};
            $scope.refreshFederationSummaryPairRows();
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
            var boardedFleetNo = $scope.getBrigadeBoardingFleetNo(brigade);
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
              boardingSelected: boardedFleetNo > 0,
              boardingFleetNo: boardedFleetNo > 0 ? boardedFleetNo : null,
              unloadDirection: null,
              resources: $scope.calculatePlaceholderResources(),
              source: brigade,
            };
          })
          .sort($scope.compareBrigadeRowsForDisplay);
        $scope.refreshFederationSummaryPairRows();
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
              unloadDirection: null,
              source: commander,
            };
          })
          .sort($scope.compareCommanderRowsForDisplay);
        $scope.refreshCommanderPairRows();
        $scope.refreshFederationSummaryPairRows();
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

      $scope.onSphereChanged = function () {
        try {
          window.localStorage.setItem(
            "austerlitz.landUnits.selectedSphere",
            $scope.selectedSphere || "All",
          );
        } catch (e) {}
        $scope.refreshCommanderPairRows();
        $scope.refreshFederationSummaryPairRows();
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
