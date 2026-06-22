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
    $scope.masterData = masterData;
    $scope.tradeRows = [];
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
      return loadBoardingReplay();
    }

    $scope.initTrade = function () {
      if (
        !$scope.masterData ||
        !$scope.masterData.turnId ||
        $scope.masterData.turnId === "Unknown"
      ) {
        $scope.tradeRows = [];
        $scope.hasNewFederationColumn = false;
        return;
      }

      $scope.isLoading = true;
      $scope.loadError = null;

      var hasTurnReport =
        $scope.masterData.turnReport && $scope.masterData.turnReport.baggageTrains;
      var loadPromise = hasTurnReport
        ? $q.when($scope.masterData.turnReport)
        : turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId);

      loadPromise
        .then(afterTurnReportLoaded, function (error) {
          $scope.loadError =
            error && error.data ? error.data : "Unable to load trade data.";
          $scope.tradeRows = [];
          $scope.hasNewFederationColumn = false;
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };
  },
);
