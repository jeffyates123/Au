"use strict";

austerlitzModule.controller(
  "tradeController",
  function (
    $scope,
    $q,
    masterData,
    turnDataLoaderService,
    turnSheetFactory,
    tradeBoardingFactory,
    boardingSharedFactory,
  ) {
    var validTradeTabs = {
      baggageTrains: true,
      tradingCities: true,
    };

    $scope.masterData = masterData;
    $scope.activeTradeTab = "baggageTrains";
    $scope.tradeRows = [];
    $scope.tradeCityRows = [];
    $scope.ownedTradeCityRows = [];
    $scope.hasNewFederationColumn = false;
    $scope.isLoading = false;
    $scope.loadError = null;

    tradeBoardingFactory.attach($scope, turnSheetFactory);

    function toInt(value, fallback) {
      var parsed = parseInt(value, 10);
      return isNaN(parsed) ? fallback : parsed;
    }

    function getTradeReportRows() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.baggageTrains || [];
    }

    function getTradingCitiesReportRows() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.tradingPortsAndCities || [];
    }

    function buildBarracksCoordinateLookup() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      var barracks = turnReport.barracks || [];
      var lookup = {};
      (barracks || []).forEach(function (row) {
        var x = toInt(row && row.x, null);
        var y = toInt(row && row.y, null);
        if (x == null || y == null) {
          return;
        }
        lookup[x + "," + y] = true;
      });
      return lookup;
    }

    $scope.selectTradeTab = function (tabKey) {
      $scope.activeTradeTab =
        tabKey && Object.prototype.hasOwnProperty.call(validTradeTabs, tabKey)
          ? tabKey
          : "baggageTrains";
    };

    $scope.sameNullableInt = function (left, right) {
      return parseInt(left, 10) === parseInt(right, 10);
    };

    $scope.formatTradeBoarded = function (tradeRow) {
      if (!tradeRow) {
        return "----";
      }

      if (tradeRow.boardingSelected && tradeRow.boardingFleetNo != null) {
        return tradeRow.boardingFleetNo;
      }

      return "----";
    };

    $scope.refreshTradeRows = function () {
      var baggageTrains = getTradeReportRows();
      var hasNewFederation = false;

      $scope.tradeRows = (baggageTrains || [])
        .map(function (train) {
          var itemNo = toInt(train && train.itemNo, null);
          var newFederation =
            train && train.newFederation != null
              ? toInt(train.newFederation, null)
              : null;
          if (newFederation != null) {
            hasNewFederation = true;
          }

          return {
            id: itemNo,
            itemNo: itemNo,
            x: toInt(train && train.x, null),
            y: toInt(train && train.y, null),
            federationNo: toInt(train && train.federationNo, null),
            newFederation: newFederation,
            mp: toInt(train && train.mp, null),
            condition: toInt(train && train.condition, null),
            goods1: toInt(train && train.goods1, null),
            quantity1: toInt(train && train.quantity1, 0),
            goods2: toInt(train && train.goods2, null),
            quantity2: toInt(train && train.quantity2, 0),
            money: toInt(train && train.money, 0),
            boardingSelected: false,
            boardingFleetNo: null,
          };
        })
        .sort(function (left, right) {
          return toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0);
        });

      $scope.hasNewFederationColumn = hasNewFederation;
    };

    $scope.refreshTradeCityRows = function () {
      var tradingCities = getTradingCitiesReportRows();
      var barracksLookup = buildBarracksCoordinateLookup();
      var mappedRows = (tradingCities || [])
        .map(function (city) {
          var itemNo = toInt(city && city.itemNo, null);
          return {
            id: itemNo,
            itemNo: itemNo,
            x: toInt(city && city.x, null),
            y: toInt(city && city.y, null),
            name: city && city.name ? city.name : "",
            rate: toInt(city && city.rate, 0),
            ectPts: toInt(city && city.ectPts, 0),
            food: toInt(city && city.food, 0),
            stone: toInt(city && city.stone, 0),
            wood: toInt(city && city.wood, 0),
            ore: toInt(city && city.ore, 0),
            zinc: toInt(city && city.zinc, 0),
            horses: toInt(city && city.horses, 0),
            textiles: toInt(city && city.textiles, 0),
            wool: toInt(city && city.wool, 0),
            gold: toInt(city && city.gold, 0),
            wine: toInt(city && city.wine, 0),
          };
        })
        .sort(function (left, right) {
          return toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0);
        });

      $scope.tradeCityRows = mappedRows;
      $scope.ownedTradeCityRows = mappedRows.filter(function (city) {
        return !!barracksLookup[city.x + "," + city.y];
      });
    };

    $scope.replayTradeBoardingFromRows = function (boardingRows) {
      boardingSharedFactory.replayBoardingAssignments({
        rows: boardingRows || [],
        units: $scope.tradeRows || [],
        getUnitId: function (tradeRow) {
          return toInt(tradeRow && tradeRow.id, null);
        },
        applyAssigned: function (tradeRow, fleetNo) {
          tradeRow.boardingSelected = true;
          tradeRow.boardingFleetNo = fleetNo;
        },
        applyUnassigned: function (tradeRow) {
          tradeRow.boardingSelected = false;
          tradeRow.boardingFleetNo = null;
        },
        clearUnassigned: true,
      });
    };

    $scope.getTradeBoardToggleStyle = function (isSelected) {
      if (!isSelected) {
        return {};
      }

      return {
        "background-color": "#e8f2ff",
        color: "#1f4f8c",
        "border-color": "#80a7d9",
      };
    };

    function loadBoardingReplay() {
      return turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(
        function (rows) {
          $scope.replayTradeBoardingFromRows(rows || []);
          return rows || [];
        },
        function () {
          $scope.replayTradeBoardingFromRows([]);
          return [];
        },
      );
    }

    function afterTurnReportLoaded() {
      $scope.refreshTradeRows();
      $scope.refreshTradeCityRows();
      return loadBoardingReplay();
    }

    $scope.initTrade = function () {
      if (
        !$scope.masterData ||
        !$scope.masterData.turnId ||
        $scope.masterData.turnId === "Unknown"
      ) {
        $scope.tradeRows = [];
        $scope.tradeCityRows = [];
        $scope.ownedTradeCityRows = [];
        $scope.hasNewFederationColumn = false;
        return;
      }

      $scope.isLoading = true;
      $scope.loadError = null;

      var hasTurnReport =
        $scope.masterData.turnReport &&
        ($scope.masterData.turnReport.baggageTrains ||
          $scope.masterData.turnReport.tradingPortsAndCities);
      var loadPromise = hasTurnReport
        ? $q.when($scope.masterData.turnReport)
        : turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId);

      loadPromise
        .then(afterTurnReportLoaded, function (error) {
          $scope.loadError =
            error && error.data ? error.data : "Unable to load trade data.";
          $scope.tradeRows = [];
          $scope.tradeCityRows = [];
          $scope.ownedTradeCityRows = [];
          $scope.hasNewFederationColumn = false;
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };
  },
);
