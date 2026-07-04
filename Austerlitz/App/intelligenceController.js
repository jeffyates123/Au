"use strict";

austerlitzModule.controller(
  "intelligenceController",
  function (
    $scope,
    $q,
    masterData,
    turnDataLoaderService,
    turnSheetFactory,
    intelligenceBoardingFactory,
    boardingSharedFactory,
  ) {
    $scope.masterData = masterData;
    $scope.spyRows = [];
    $scope.isLoading = false;
    $scope.loadError = null;
    // Keep intelligence modal state local when controller runs as nested scope.
    $scope.boardingModal = null;
    $scope.spyUnloadDirectionModal = null;

    intelligenceBoardingFactory.attach($scope, turnSheetFactory);

    function toInt(value, fallback) {
      var parsed = parseInt(value, 10);
      return isNaN(parsed) ? fallback : parsed;
    }

    function getSpyReportRows() {
      var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
      return turnReport.spies || [];
    }

    $scope.sameNullableInt = function (left, right) {
      return parseInt(left, 10) === parseInt(right, 10);
    };

    $scope.formatSpyBoarded = function (spy) {
      if (!spy) {
        return "----";
      }

      if (spy.boardingSelected && spy.boardingFleetNo != null) {
        return spy.boardingFleetNo;
      }

      if (spy.reportBoarded != null) {
        return spy.reportBoarded;
      }

      return "----";
    };

    $scope.getSpyBoardButtonLabel = function (spy) {
      var unloadDirection = toInt(spy && spy.unloadDirection, null);
      if (unloadDirection != null && [1, 3, 5, 7, 9].indexOf(unloadDirection) >= 0) {
        return "Unload (" + unloadDirection + ")";
      }

      if (!spy || !spy.boardingSelected) {
        return "Board";
      }

      var transportNo = toInt(spy.boardingFleetNo, null);
      return transportNo != null && transportNo > 0 ? transportNo.toString() : "Board";
    };

    $scope.refreshSpyRows = function () {
      var spies = getSpyReportRows();
      $scope.spyRows = (spies || [])
        .map(function (spy) {
          var spyNo = toInt(spy && spy.itemNo, null);
          var reportBoarded = toInt(spy && spy.boarded, null);
          return {
            id: spyNo,
            itemNo: spyNo,
            x: toInt(spy && spy.x, null),
            y: toInt(spy && spy.y, null),
            report: spy && spy.report ? spy.report : "",
            reportBoarded: reportBoarded != null && reportBoarded > 0 ? reportBoarded : null,
            boardingSelected: false,
            boardingFleetNo: null,
            unloadDirection: null,
          };
        })
        .sort(function (left, right) {
          return toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0);
        });
    };

    $scope.replaySpyBoardingFromRows = function (boardingRows) {
      var unloadDirectionLookup =
        boardingSharedFactory.buildUnloadDirectionLookup(boardingRows || []);
      boardingSharedFactory.replayBoardingAssignments({
        rows: boardingRows || [],
        units: $scope.spyRows || [],
        getUnitId: function (spy) {
          return toInt(spy && spy.id, null);
        },
        applyAssigned: function (spy, fleetNo) {
          spy.boardingSelected = true;
          spy.boardingFleetNo = fleetNo;
          var spyId = toInt(spy && spy.id, null);
          spy.unloadDirection =
            spyId != null &&
            Object.prototype.hasOwnProperty.call(unloadDirectionLookup, spyId)
              ? unloadDirectionLookup[spyId]
              : null;
        },
        applyUnassigned: function (spy) {
          spy.boardingSelected = false;
          spy.boardingFleetNo = null;
          spy.unloadDirection = null;
        },
        clearUnassigned: true,
      });
    };

    $scope.getSpyBoardToggleStyle = function (isSelected) {
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
          $scope.replaySpyBoardingFromRows(rows || []);
          return rows || [];
        },
        function () {
          $scope.replaySpyBoardingFromRows([]);
          return [];
        },
      );
    }

    function afterTurnReportLoaded() {
      $scope.refreshSpyRows();
      return loadBoardingReplay();
    }

    $scope.initIntelligence = function () {
      if (
        !$scope.masterData ||
        !$scope.masterData.turnId ||
        $scope.masterData.turnId === "Unknown"
      ) {
        $scope.spyRows = [];
        return;
      }

      $scope.isLoading = true;
      $scope.loadError = null;

      var hasTurnReport =
        $scope.masterData.turnReport && $scope.masterData.turnReport.spies;
      var loadPromise = hasTurnReport
        ? $q.when($scope.masterData.turnReport)
        : turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId);

      loadPromise
        .then(afterTurnReportLoaded, function (error) {
          $scope.loadError =
            error && error.data ? error.data : "Unable to load intelligence data.";
          $scope.spyRows = [];
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };
  },
);
