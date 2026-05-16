austerlitzModule.controller("menuController", function ($scope, $location, turnSheetFactory, rulesCatalogFactory, turnDataLoaderService, masterData) {
    $scope.masterData = masterData;

    $scope.init = function () {
        var rememberedTurnId = $scope.masterData.getSelectedTurnId ? $scope.masterData.getSelectedTurnId() : null;
        if (rememberedTurnId) {
            $scope.masterData.turnId = rememberedTurnId;
        }

        $scope.getAllTurnsList().then(function () {
            if ($scope.masterData.turnId && $scope.masterData.turnId !== 'Unknown') {
                $scope.masterData.getTSFullTurnDetails();
                $scope.masterData.getTRFullTurnDetails();
            }
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

        return currentPath === targetPath;
    };
});
