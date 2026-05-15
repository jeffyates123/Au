'use strict';

function sendFile(file) {
    console.log(file.type);

    var data = new FormData();
    data.append("file1", file);
    var scope = angular.element($("#homePanel")).scope();
    scope.$apply(function () {
        scope.fileLoading = true;
    });

    $.ajax({
        type: 'post',
        url: '/Api/FileLoadApi/FilePost',
        data: data,
        success: function (result) {

            alert("File Load was successful");

            //http://stackoverflow.com/questions/15112584/using-scope-watch-and-scope-apply//

            scope.$apply(function () {
                var loadedTurnId = (result && (result.turnId || result.TurnId)) ? (result.turnId || result.TurnId) : null;
                if (loadedTurnId && scope.masterData && scope.masterData.setSelectedTurnId) {
                    scope.masterData.setSelectedTurnId(loadedTurnId);
                }

                //scope.myVar = scope.myVar + 1; // trigger a change in a watched data cell which does stuff
                scope.init(); // or call a function directly instead?
                scope.fileLoading = false;
            });
        },
        error: function (xhr, status, err) {
            var detail = xhr.responseText || err || status || "";
            if (detail.length > 500)
                detail = detail.substring(0, 500) + "…";
            scope.$apply(function () {
                scope.fileLoading = false;
            });
            alert("Error while invoking the Web API" + (xhr.status ? " (" + xhr.status + ")" : "") + (detail ? ": " + detail : ""));
        },
        contentType: false,
        processData: false
    });
};

austerlitzModule.controller("homeController", function ($scope, $routeParams, turnDataLoaderService, masterData) {
    $scope.fileLoading = false;
    $scope.selectedTurnDetails = {};
    $scope.masterData = masterData;
    $scope.gameNoOptions = [];
    $scope.stateOptions = [];
    $scope.monthYearOptions = [];
    $scope.selectedGameNo = $scope.masterData.selectedGameNo || null;
    $scope.selectedState = $scope.masterData.selectedState || null;
    $scope.selectedMonthYear = $scope.masterData.selectedMonthYear || null;

    var syncSelectedFiltersToMasterData = function () {
        if ($scope.masterData.setSelectedTurnFilters) {
            $scope.masterData.setSelectedTurnFilters($scope.selectedGameNo, $scope.selectedState, $scope.selectedMonthYear);
            return;
        }

        $scope.masterData.selectedGameNo = $scope.selectedGameNo;
        $scope.masterData.selectedState = $scope.selectedState;
        $scope.masterData.selectedMonthYear = $scope.selectedMonthYear;
    };

    var getMonthNo = function (monthText) {
        if (!monthText) return 0;

        switch (monthText.toString().substr(0, 3).toUpperCase()) {
            case 'JAN': return 1;
            case 'FEB': return 2;
            case 'MAR': return 3;
            case 'APR': return 4;
            case 'MAY': return 5;
            case 'JUN': return 6;
            case 'JUL': return 7;
            case 'AUG': return 8;
            case 'SEP': return 9;
            case 'OCT': return 10;
            case 'NOV': return 11;
            case 'DEC': return 12;
            default: return 0;
        }
    };

    var normalizeTurn = function (turn) {
        if (!turn || !turn.turnId) {
            return null;
        }

        var turnId = turn.turnId;
        var gameNo = (turn.gameNo != null ? turn.gameNo : (turnId.length >= 3 ? turnId.substr(0, 3) : '')).toString().trim();
        var state = (turn.state != null ? turn.state : (turnId.length >= 4 ? turnId.substr(3, 1) : '')).toString().trim();
        var monthText = turn.month || (turnId.length >= 8 ? turnId.substring(4, turnId.length - 4) : '');
        var year = turn.year || (turnId.length >= 8 ? parseInt(turnId.substr(turnId.length - 4), 10) : 0);
        var monthNo = getMonthNo(monthText);

        return {
            turnId: turnId,
            gameNo: gameNo,
            state: state,
            monthText: monthText,
            year: year,
            monthNo: monthNo,
            monthYearLabel: (monthText || '') + (year || '')
        };
    };

    var getNormalizedTurns = function () {
        if (!$scope.masterData.turnsList || !$scope.masterData.turnsList.length) {
            return [];
        }

        return $scope.masterData.turnsList
            .map(normalizeTurn)
            .filter(function (t) { return !!t; });
    };

    var setSelectedTurnById = function (turnId, shouldLoad) {
        var turns = getNormalizedTurns();
        var matchedTurn = null;

        for (var i = 0; i < turns.length; i++) {
            if (turns[i].turnId === turnId) {
                matchedTurn = turns[i];
                break;
            }
        }

        if (!matchedTurn && turns.length > 0) {
            matchedTurn = turns[0];
        }

        if (!matchedTurn) {
            return;
        }

        $scope.selectedGameNo = matchedTurn.gameNo;
        $scope.refreshStateOptions();
        $scope.selectedState = matchedTurn.state;
        $scope.refreshMonthYearOptions();
        $scope.selectedMonthYear = matchedTurn.monthYearLabel;
        syncSelectedFiltersToMasterData();

        $scope.selectedTurnDetails = { turnId: matchedTurn.turnId };

        if (shouldLoad) {
            $scope.loadTurnFromDataBase();
        }
    };

    $scope.refreshGameNoOptions = function () {
        var turns = getNormalizedTurns();
        var seen = {};
        var options = [];

        for (var i = 0; i < turns.length; i++) {
            var gameNo = (turns[i].gameNo || '').toString();
            if (!seen[gameNo]) {
                seen[gameNo] = true;
                options.push(gameNo);
            }
        }

        $scope.gameNoOptions = options;
    };

    $scope.refreshStateOptions = function () {
        var turns = getNormalizedTurns().filter(function (turn) {
            return turn.gameNo === $scope.selectedGameNo;
        });

        var seen = {};
        var options = [];
        for (var i = 0; i < turns.length; i++) {
            var state = (turns[i].state || '').toString();
            if (!seen[state]) {
                seen[state] = true;
                options.push(state);
            }
        }

        $scope.stateOptions = options;
        if ($scope.stateOptions.indexOf($scope.selectedState) < 0) {
            $scope.selectedState = options.length > 0 ? options[0] : null;
        }
    };

    $scope.refreshMonthYearOptions = function () {
        var turns = getNormalizedTurns().filter(function (turn) {
            return turn.gameNo === $scope.selectedGameNo && turn.state === $scope.selectedState;
        });

        var seen = {};
        var options = [];
        for (var i = 0; i < turns.length; i++) {
            var monthYear = turns[i].monthYearLabel;
            if (!seen[monthYear]) {
                seen[monthYear] = true;
                options.push(monthYear);
            }
        }

        $scope.monthYearOptions = options;
        if ($scope.monthYearOptions.indexOf($scope.selectedMonthYear) < 0) {
            $scope.selectedMonthYear = options.length > 0 ? options[0] : null;
        }
    };

    $scope.onGameNoChanged = function () {
        $scope.refreshStateOptions();
        $scope.refreshMonthYearOptions();
        syncSelectedFiltersToMasterData();
        $scope.onMonthYearChanged();
    };

    $scope.onStateChanged = function () {
        $scope.refreshMonthYearOptions();
        syncSelectedFiltersToMasterData();
        $scope.onMonthYearChanged();
    };

    $scope.onMonthYearChanged = function () {
        syncSelectedFiltersToMasterData();

        var turns = getNormalizedTurns();
        for (var i = 0; i < turns.length; i++) {
            var turn = turns[i];
            if (turn.gameNo === $scope.selectedGameNo
                && turn.state === $scope.selectedState
                && turn.monthYearLabel === $scope.selectedMonthYear) {
                $scope.selectedTurnDetails = { turnId: turn.turnId };
                $scope.loadTurnFromDataBase();
                return;
            }
        }
    };

    $scope.$watch('masterData.turnsList', function () {
        $scope.refreshGameNoOptions();
        setSelectedTurnById($scope.masterData.turnId, false);
    });

    $scope.loadTurnFromDataBase = function () {
        if (!$scope.selectedTurnDetails || !$scope.selectedTurnDetails.turnId) {
            return;
        }

        if ($scope.masterData.setSelectedTurnId) {
            $scope.masterData.setSelectedTurnId($scope.selectedTurnDetails.turnId);
        }
        else {
            $scope.masterData.turnId = $scope.selectedTurnDetails.turnId;
        }

        syncSelectedFiltersToMasterData();

        turnDataLoaderService.loadTurn($scope.masterData, $scope.masterData.turnId);
    }
});