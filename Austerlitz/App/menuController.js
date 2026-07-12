austerlitzModule.controller("menuController", function ($scope, $location, $route, turnSheetFactory, rulesCatalogFactory, turnDataLoaderService, turnReportFactory, masterData) {
    $scope.masterData = masterData;
    $scope.sidebarGameNoOptions = [];
    $scope.sidebarStateOptions = [];
    $scope.sidebarMonthYearOptions = [];
    $scope.sidebarSelectedGameNo = $scope.masterData.selectedGameNo || null;
    $scope.sidebarSelectedState = $scope.masterData.selectedState || null;
    $scope.sidebarSelectedMonthYear = $scope.masterData.selectedMonthYear || null;
    $scope.sidebarSelectedTurnDetails = {};
    $scope.sidebarTurnLoading = false;
    $scope.topBarBuildFunds = { europe: 0, caribbean: 0, india: 0 };

    function toInt(value, fallback) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? fallback : parsed;
    }

    function toText(value, fallback) {
        if (value === null || value === undefined) {
            return fallback;
        }
        var text = value.toString().trim();
        return text ? text : fallback;
    }

    function getSummaryRows(summary) {
        if (!summary) {
            return [];
        }
        return summary.rows || summary.Rows || [];
    }

    function readBuildFundsValue(row) {
        if (!row) {
            return 0;
        }
        if (row.buildFundsAvailableLd !== undefined && row.buildFundsAvailableLd !== null) {
            return toInt(row.buildFundsAvailableLd, 0);
        }
        return toInt(row.BuildFundsAvailableLd, 0);
    }

    function getBuildFundsBySphere(summary) {
        var result = { europe: 0, caribbean: 0, india: 0 };
        var rows = getSummaryRows(summary);

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var sphere = toText(row && (row.sphere !== undefined ? row.sphere : row.Sphere), '').toLowerCase();
            if (sphere === 'europe') {
                result.europe = readBuildFundsValue(row);
            } else if (sphere === 'caribbean') {
                result.caribbean = readBuildFundsValue(row);
            } else if (sphere === 'india') {
                result.india = readBuildFundsValue(row);
            }
        }

        return result;
    }

    function setTopBarBuildFundsDisplay(values) {
        var normalized = values || { europe: 0, caribbean: 0, india: 0 };
        $scope.topBarBuildFunds = normalized;
    }

    $scope.formatTopBarFundsValue = function (value) {
        return '$' + toInt(value, 0).toLocaleString();
    };

    $scope.getTopBarFundsClass = function (value) {
        return toInt(value, 0) < 0 ? 'text-danger' : 'text-success';
    };

    $scope.refreshTopBarBuildFunds = function () {
        var turnId = $scope.masterData ? $scope.masterData.turnId : null;
        if (!turnId || turnId === 'Unknown') {
            setTopBarBuildFundsDisplay({ europe: 0, caribbean: 0, india: 0 });
            return;
        }

        turnReportFactory.getTREconomyComputedSummary(turnId).then(function (summary) {
            setTopBarBuildFundsDisplay(getBuildFundsBySphere(summary));
        }, function () {
            setTopBarBuildFundsDisplay({ europe: 0, caribbean: 0, india: 0 });
        });
    };

    $scope.$on('economyBuildFundsChanged', function () {
        $scope.refreshTopBarBuildFunds();
    });

    $scope.init = function () {
        // One-shot hard refresh after Home button navigation.
        // We clear the flag before reload to avoid loops.
        if (window && window.sessionStorage && window.sessionStorage.getItem('homeHardRefreshPending') === '1') {
            window.sessionStorage.removeItem('homeHardRefreshPending');
            if (window.location && window.location.reload) {
                window.location.reload(true);
                return;
            }
        }

        var rememberedTurnId = $scope.masterData.getSelectedTurnId ? $scope.masterData.getSelectedTurnId() : null;
        if (rememberedTurnId) {
            $scope.masterData.turnId = rememberedTurnId;
        }

        $scope.getAllTurnsList().then(function () {
            if ($scope.masterData.turnId && $scope.masterData.turnId !== 'Unknown') {
                $scope.masterData.getTSFullTurnDetails();
                $scope.masterData.getTRFullTurnDetails();
            }
            $scope.refreshTopBarBuildFunds();
        });

        $scope.getRulesCatalog();
    };

    $scope.getAllTurnsList = function () {
        return turnSheetFactory.getAllTurnsList().then(function (turnsList) {
            $scope.masterData.turnsList = turnsList;

            if (!turnsList || turnsList.length === 0) {
                return;
            }

            var rememberedTurnId = $scope.masterData.getSelectedTurnId ? $scope.masterData.getSelectedTurnId() : null;
            var selectedTurn = null;

            if (rememberedTurnId) {
                for (var i = 0; i < turnsList.length; i++) {
                    if (turnsList[i].turnId === rememberedTurnId) {
                        selectedTurn = turnsList[i];
                        break;
                    }
                }
            }

            if (!selectedTurn) {
                selectedTurn = turnsList[0];
            }

            if (selectedTurn && selectedTurn.turnId) {
                if ($scope.masterData.setSelectedTurnId) {
                    $scope.masterData.setSelectedTurnId(selectedTurn.turnId);
                }
                else {
                    $scope.masterData.turnId = selectedTurn.turnId;
                }
            }

            $scope.refreshSidebarGameNoOptions();
            $scope.setSidebarSelectedTurnById($scope.masterData.turnId, false);
        });
    };

    $scope.masterData.getTSFullTurnDetails = function () {
         return turnDataLoaderService.loadTS($scope.masterData, $scope.masterData.turnId);
    };

    $scope.masterData.getTRFullTurnDetails = function () {
        return turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId);
    };

    $scope.getRulesCatalog = function () {
        rulesCatalogFactory.getRulesCatalog().then(function (rulesCatalog) {
            $scope.masterData.rulesCatalog = rulesCatalog;
        });
    };

    $scope.syncSidebarSelectedFiltersToMasterData = function () {
        if ($scope.masterData.setSelectedTurnFilters) {
            $scope.masterData.setSelectedTurnFilters($scope.sidebarSelectedGameNo, $scope.sidebarSelectedState, $scope.sidebarSelectedMonthYear);
            return;
        }

        $scope.masterData.selectedGameNo = $scope.sidebarSelectedGameNo;
        $scope.masterData.selectedState = $scope.sidebarSelectedState;
        $scope.masterData.selectedMonthYear = $scope.sidebarSelectedMonthYear;
    };

    $scope.getSidebarMonthNo = function (monthText) {
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

    $scope.normalizeSidebarTurn = function (turn) {
        if (!turn || !turn.turnId) {
            return null;
        }

        var turnId = turn.turnId;
        var gameNo = (turn.gameNo != null ? turn.gameNo : (turnId.length >= 3 ? turnId.substr(0, 3) : '')).toString().trim();
        var state = (turn.state != null ? turn.state : (turnId.length >= 4 ? turnId.substr(3, 1) : '')).toString().trim();
        var monthText = turn.month || (turnId.length >= 8 ? turnId.substring(4, turnId.length - 4) : '');
        var year = turn.year || (turnId.length >= 8 ? parseInt(turnId.substr(turnId.length - 4), 10) : 0);

        return {
            turnId: turnId,
            gameNo: gameNo,
            state: state,
            monthText: monthText,
            year: year,
            monthNo: $scope.getSidebarMonthNo(monthText),
            monthYearLabel: (monthText || '') + (year || '')
        };
    };

    $scope.getSidebarNormalizedTurns = function () {
        if (!$scope.masterData.turnsList || !$scope.masterData.turnsList.length) {
            return [];
        }

        return $scope.masterData.turnsList
            .map($scope.normalizeSidebarTurn)
            .filter(function (turn) { return !!turn; });
    };

    $scope.setSidebarSelectedTurnById = function (turnId, shouldLoad) {
        var turns = $scope.getSidebarNormalizedTurns();
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

        $scope.sidebarSelectedGameNo = matchedTurn.gameNo;
        $scope.refreshSidebarStateOptions();
        $scope.sidebarSelectedState = matchedTurn.state;
        $scope.refreshSidebarMonthYearOptions();
        $scope.sidebarSelectedMonthYear = matchedTurn.monthYearLabel;
        $scope.sidebarSelectedTurnDetails = { turnId: matchedTurn.turnId };
        $scope.syncSidebarSelectedFiltersToMasterData();

        if (shouldLoad) {
            $scope.loadSidebarTurnFromDatabase();
        }
    };

    $scope.refreshSidebarGameNoOptions = function () {
        var turns = $scope.getSidebarNormalizedTurns();
        var seen = {};
        var options = [];

        for (var i = 0; i < turns.length; i++) {
            var gameNo = (turns[i].gameNo || '').toString();
            if (!seen[gameNo]) {
                seen[gameNo] = true;
                options.push(gameNo);
            }
        }

        $scope.sidebarGameNoOptions = options;
    };

    $scope.refreshSidebarStateOptions = function (autoSelectFirst) {
        if (autoSelectFirst === undefined) {
            autoSelectFirst = true;
        }

        var turns = $scope.getSidebarNormalizedTurns().filter(function (turn) {
            return turn.gameNo === $scope.sidebarSelectedGameNo;
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

        $scope.sidebarStateOptions = options;
        if ($scope.sidebarStateOptions.indexOf($scope.sidebarSelectedState) < 0) {
            $scope.sidebarSelectedState = autoSelectFirst && options.length > 0 ? options[0] : null;
        }
    };

    $scope.refreshSidebarMonthYearOptions = function (autoSelectFirst) {
        if (autoSelectFirst === undefined) {
            autoSelectFirst = true;
        }

        var turns = $scope.getSidebarNormalizedTurns().filter(function (turn) {
            return turn.gameNo === $scope.sidebarSelectedGameNo && turn.state === $scope.sidebarSelectedState;
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

        $scope.sidebarMonthYearOptions = options;
        if ($scope.sidebarMonthYearOptions.indexOf($scope.sidebarSelectedMonthYear) < 0) {
            $scope.sidebarSelectedMonthYear = autoSelectFirst && options.length > 0 ? options[0] : null;
        }
    };

    $scope.onSidebarGameNoChanged = function () {
        $scope.sidebarSelectedState = null;
        $scope.sidebarSelectedMonthYear = null;
        $scope.sidebarSelectedTurnDetails = {};
        $scope.refreshSidebarStateOptions(false);
        $scope.refreshSidebarMonthYearOptions(false);
        $scope.syncSidebarSelectedFiltersToMasterData();
    };

    $scope.onSidebarStateChanged = function () {
        $scope.sidebarSelectedMonthYear = null;
        $scope.sidebarSelectedTurnDetails = {};
        $scope.refreshSidebarMonthYearOptions(false);
        $scope.syncSidebarSelectedFiltersToMasterData();
    };

    $scope.onSidebarMonthYearChanged = function () {
        $scope.syncSidebarSelectedFiltersToMasterData();

        if (!$scope.sidebarSelectedGameNo || !$scope.sidebarSelectedState || !$scope.sidebarSelectedMonthYear) {
            $scope.sidebarSelectedTurnDetails = {};
            return;
        }

        var turns = $scope.getSidebarNormalizedTurns();
        for (var i = 0; i < turns.length; i++) {
            var turn = turns[i];
            if (turn.gameNo === $scope.sidebarSelectedGameNo
                && turn.state === $scope.sidebarSelectedState
                && turn.monthYearLabel === $scope.sidebarSelectedMonthYear) {
                $scope.sidebarSelectedTurnDetails = { turnId: turn.turnId };
                $scope.loadSidebarTurnFromDatabase();
                return;
            }
        }

        $scope.sidebarSelectedTurnDetails = {};
    };

    $scope.loadSidebarTurnFromDatabase = function () {
        if (!$scope.sidebarSelectedTurnDetails || !$scope.sidebarSelectedTurnDetails.turnId) {
            return;
        }

        $scope.sidebarTurnLoading = true;

        if ($scope.masterData.setSelectedTurnId) {
            $scope.masterData.setSelectedTurnId($scope.sidebarSelectedTurnDetails.turnId);
        }
        else {
            $scope.masterData.turnId = $scope.sidebarSelectedTurnDetails.turnId;
        }

        $scope.syncSidebarSelectedFiltersToMasterData();
        turnDataLoaderService.loadTurn($scope.masterData, $scope.masterData.turnId)
            .finally(function () {
                $scope.refreshTopBarBuildFunds();
                $scope.sidebarTurnLoading = false;
                if ($route && $route.reload) {
                    $route.reload();
                }
            });
    };

    $scope.saveTurnsheetSpreadsheet = function ($event) {
        if ($event && $event.preventDefault) {
            $event.preventDefault();
        }

        var turnId = $scope.masterData ? $scope.masterData.turnId : null;
        if (!turnId || turnId === 'Unknown') {
            alert('Select a valid turn before saving to spreadsheet.');
            return;
        }

        turnSheetFactory.saveTurnsheetSpreadsheet(turnId).then(function () {
            alert('Turnsheet spreadsheet saved successfully.');
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            alert('Spreadsheet save failed.' + (detail ? ' ' + detail : ''));
        });
    };

    $scope.onHomeLinkClicked = function () {
        if (window && window.sessionStorage) {
            window.sessionStorage.setItem('homeHardRefreshPending', '1');
        }
    };

    $scope.clearTurnOrders = function ($event) {
        if ($event && $event.preventDefault) {
            $event.preventDefault();
        }

        var turnId = $scope.masterData ? $scope.masterData.turnId : null;
        if (!turnId || turnId === 'Unknown') {
            alert('Select a valid turn before clearing turn orders.');
            return;
        }

        if (!window.confirm('Clear all TS01-TS23 orders for ' + turnId + '? This cannot be undone.')) {
            return;
        }

        turnSheetFactory.clearTurnOrders(turnId).then(function () {
            turnDataLoaderService.loadTS($scope.masterData, turnId).finally(function () {
                if ($route && $route.reload) {
                    $route.reload();
                }
                alert('Turn orders cleared.');
            });
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            alert('Clear turn orders failed.' + (detail ? ' ' + detail : ''));
        });
    };

    $scope.getSelectedStateName = function () {
        var selectedState = ($scope.masterData && $scope.masterData.selectedState) ? $scope.masterData.selectedState : '';
        if (!selectedState) {
            return '';
        }

        var rulesCatalog = $scope.masterData ? $scope.masterData.rulesCatalog : null;
        var states = rulesCatalog ? (rulesCatalog.States || rulesCatalog.states) : null;
        if (!states || !states.length) {
            return selectedState;
        }

        for (var i = 0; i < states.length; i++) {
            var stateCode = (states[i].State || states[i].state || '').toString().trim().toUpperCase();
            if (stateCode === selectedState.toString().trim().toUpperCase()) {
                return states[i].StateName || states[i].stateName || selectedState;
            }
        }

        return selectedState;
    };

    $scope.getSelectedMonthYearText = function () {
        var selectedMonthYear = ($scope.masterData && $scope.masterData.selectedMonthYear) ? $scope.masterData.selectedMonthYear.toString() : '';
        if (!selectedMonthYear || selectedMonthYear.length < 4) {
            return selectedMonthYear;
        }

        var monthCode = selectedMonthYear.substr(0, 3).toUpperCase();
        var year = selectedMonthYear.substr(selectedMonthYear.length - 4, 4);
        var monthName = monthCode;

        switch (monthCode) {
            case 'JAN': monthName = 'January'; break;
            case 'FEB': monthName = 'February'; break;
            case 'MAR': monthName = 'March'; break;
            case 'APR': monthName = 'April'; break;
            case 'MAY': monthName = 'May'; break;
            case 'JUN': monthName = 'June'; break;
            case 'JUL': monthName = 'July'; break;
            case 'AUG': monthName = 'August'; break;
            case 'SEP': monthName = 'September'; break;
            case 'OCT': monthName = 'October'; break;
            case 'NOV': monthName = 'November'; break;
            case 'DEC': monthName = 'December'; break;
        }

        return monthName + ' ' + year;
    };

    $scope.getMenuBarStyle = function () {
        var stateCode = ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : '').toString().trim().toUpperCase();
        var stateColors = {
            'A': 'rgb(198, 23, 23)',
            'B': 'rgb(51,153,102)',
            'D': 'rgb(255, 204, 153)',
            'E': 'rgb(234, 230, 21)',
            'F': 'rgb(47, 164, 231)',
            'G': 'rgb(135, 219, 106)',
            'H': 'rgb(255, 106, 0)',
            'I': 'rgb(0, 255, 0)',
            'K': 'rgb(181, 36, 165)',
            'M': 'rgb(206, 203, 83)',
            'N': 'rgb(128, 128, 0)',
            'P': 'rgb(128, 128, 128)',
            'R': 'rgb(192, 192, 192)',
            'S': 'rgb(255, 255, 153)',
            'T': 'black',
            'W': 'rgb(0, 128, 0)'
        };

        var backgroundColor = stateColors[stateCode] || 'rgb(248, 248, 248)';
        var textColor = stateCode === 'T' ? 'rgb(192, 192, 192)' : '#111111';

        return {
            'background-color': backgroundColor,
            color: textColor,
            'background-image': 'none'
        };
    };

    $scope.isActive = function (path) {
        var currentPath = ($location.path() || '').toLowerCase();
        var targetPath = (path || '').toLowerCase();

        if (targetPath === '/home') {
            return currentPath === '/home' || currentPath === '/' || currentPath === '';
        }

        if (targetPath === '/military') {
            return currentPath.indexOf('/military') === 0;
        }

        if (targetPath === '/turnsheet') {
            return currentPath.indexOf('/turnsheet') === 0;
        }

        return currentPath === targetPath || currentPath.indexOf(targetPath + '/') === 0;
    };
});
