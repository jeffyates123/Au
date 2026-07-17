"use strict";

austerlitzModule.factory("landUnitsFederationSummaryFactory", function () {
  return {
    attach: function ($scope) {

      $scope.getBattalionSummaryType = function (battalion) {
        if (!battalion || !battalion.type) {
          return "";
        }

        var armyItem =
          ($scope.armyListByShortName || {})[
            (battalion.type || "").toString().trim().toUpperCase()
          ];
        var itemNo = parseInt(
          armyItem ? armyItem.itemNo || armyItem.ItemNo : null,
          10,
        );

        if (!isNaN(itemNo) && itemNo >= 41 && itemNo <= 45) {
          return "art";
        }

        if (
          ($scope.isMountedArmyItem && $scope.isMountedArmyItem(armyItem)) ||
          !!(armyItem && armyItem.isCavalry)
        ) {
          return "cav";
        }

        return "inf";
      };

      $scope.getBattalionActualMen = function (battalion) {
        if (!battalion) {
          return 0;
        }

        var parsed = parseInt(
          battalion.size != null && battalion.size !== ""
            ? battalion.size
            : battalion.baseSize,
          10,
        );
        return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
      };

      $scope.buildFederationSummaryRows = function () {
        var brigades = $scope.filteredBrigadeRows() || [];
        var commanders = $scope.filteredCommanderRows() || [];
        var byFed = {};
        function ensureSummary(fedNo) {
          if (!byFed[fedNo]) {
            byFed[fedNo] = {
              fedNo: fedNo,
              position: "",
              maxMp: "",
              maxCc: null,
              totalLoadingCapacityRaw: 0,
              totalLoadingCapacity: 0,
              inf: 0,
              cav: 0,
              art: 0,
              total: 0,
              totalMen: 0,
              _minMp: null,
              _positionKey: null,
              _isMixedPosition: false,
            };
          }
          return byFed[fedNo];
        }

        angular.forEach(brigades, function (brigade) {
          var fedNo = parseInt(brigade && brigade.fed, 10);
          if (isNaN(fedNo) || fedNo <= 0) {
            return;
          }

          var summary = ensureSummary(fedNo);
          var positionKey = $scope.getLandUnitPositionKey(brigade);
          if (positionKey) {
            if (summary._positionKey == null) {
              summary._positionKey = positionKey;
            } else if (summary._positionKey !== positionKey) {
              summary._isMixedPosition = true;
            }
          }

          var mp = parseInt(brigade.mp, 10);
          if (!isNaN(mp)) {
            summary._minMp = summary._minMp == null ? mp : Math.min(summary._minMp, mp);
          }
          summary.totalLoadingCapacityRaw +=
            typeof $scope.getBoardingUnitRequiredCapacity === "function"
              ? $scope.getBoardingUnitRequiredCapacity(brigade) || 0
              : 0;

          angular.forEach((brigade && brigade.battalions) || [], function (battalion) {
            if (!battalion || !battalion.type) {
              return;
            }

            var battalionType = $scope.getBattalionSummaryType(battalion);
            if (battalionType === "art") {
              summary.art += 1;
            } else if (battalionType === "cav") {
              summary.cav += 1;
            } else {
              summary.inf += 1;
            }

            summary.total += 1;
            summary.totalMen += $scope.getBattalionActualMen(battalion);
          });
        });

        angular.forEach(commanders, function (commander) {
          var fedNo = parseInt(commander && commander.fed, 10);
          if (isNaN(fedNo) || fedNo <= 0) {
            return;
          }

          var summary = ensureSummary(fedNo);
          var positionKey = $scope.getLandUnitPositionKey(commander);
          if (positionKey) {
            if (summary._positionKey == null) {
              summary._positionKey = positionKey;
            } else if (summary._positionKey !== positionKey) {
              summary._isMixedPosition = true;
            }
          }

          var mp = parseInt(commander.mp, 10);
          if (!isNaN(mp)) {
            summary._minMp = summary._minMp == null ? mp : Math.min(summary._minMp, mp);
          }
          summary.totalLoadingCapacityRaw +=
            typeof $scope.getBoardingUnitRequiredCapacity === "function"
              ? $scope.getBoardingUnitRequiredCapacity(commander) || 0
              : 0;

          var maxCcCandidate = parseInt(commander.commandCapacity, 10);
          if (isNaN(maxCcCandidate)) {
            return;
          }

          summary.maxCc =
            summary.maxCc == null
              ? maxCcCandidate
              : Math.max(summary.maxCc, maxCcCandidate);
        });

        return Object.keys(byFed)
          .map(function (fedKey) {
            var summary = byFed[fedKey];
            var strengthBase = summary.total * 800;
            var percentHc =
              strengthBase > 0
                ? Math.round((summary.totalMen / strengthBase) * 100)
                : 0;

            summary.position = summary._isMixedPosition
              ? "Mixed"
              : summary._positionKey || "-";
            summary.maxMp = summary._minMp == null ? "" : summary._minMp;
            summary.maxCc = summary.maxCc == null ? "N/A" : summary.maxCc;
            summary.totalLoadingCapacity = Math.ceil(summary.totalLoadingCapacityRaw || 0);
            summary.percentHc = percentHc;
            summary.isMixedPosition = !!summary._isMixedPosition;
            return summary;
          })
          .sort(function (left, right) {
            return left.fedNo - right.fedNo;
          });
      };

      $scope.refreshFederationSummaryPairRows = function () {
        var summaryRows = $scope.buildFederationSummaryRows();
        var pairRows = [];

        for (var i = 0; i < summaryRows.length; i += 2) {
          pairRows.push({
            left: summaryRows[i],
            right: summaryRows[i + 1] || null,
          });
        }

        $scope.federationSummaryRows = summaryRows;
        $scope.federationSummaryPairRows = pairRows;
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

    },
  };
});
