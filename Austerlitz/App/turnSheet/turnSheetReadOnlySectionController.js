'use strict';

austerlitzModule.controller('turnSheetReadOnlySectionController', function ($scope, $routeParams, masterData, turnSheetSectionsFactory) {
    var section = turnSheetSectionsFactory.getByKey($routeParams.section);
    var loadedTurnId = null;

    $scope.masterData = masterData;
    $scope.rows = [];
    $scope.columns = [];
    $scope.isLoading = false;
    $scope.loadError = '';

    if (!section) {
        $scope.title = 'Unknown Section';
        $scope.loadError = 'Unknown turn sheet section: ' + $routeParams.section;
        return;
    }

    $scope.title = section.title;
    $scope.columns = section.columns;

    $scope.getCellValue = function (row, column) {
        if (!row || !column) {
            return '';
        }

        var value = row[column.field];
        return value === null || angular.isUndefined(value) ? '' : value;
    };

    $scope.isEmptyValue = function (row, column) {
        var value = $scope.getCellValue(row, column);
        return value === '';
    };

    $scope.loadData = function () {
        var turnId = masterData && masterData.turnId;
        if (!turnId || turnId === 'Unknown') {
            $scope.loadError = 'No turn selected. Select a turn first.';
            return;
        }

        loadedTurnId = turnId;
        $scope.isLoading = true;
        $scope.loadError = '';

        section.load(turnId).then(function (data) {
            $scope.rows = turnSheetSectionsFactory.normalizeRows(section, data, turnId);
            $scope.isLoading = false;
        }, function () {
            $scope.loadError = 'Failed to load data for this section.';
            $scope.isLoading = false;
        });
    };

    $scope.$watch(function () {
        return masterData && masterData.turnId;
    }, function (turnId) {
        if (turnId && turnId !== 'Unknown' && turnId !== loadedTurnId) {
            $scope.loadData();
        }
    });

    $scope.loadData();
});
