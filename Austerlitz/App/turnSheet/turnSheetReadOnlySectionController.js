'use strict';

austerlitzModule.controller('turnSheetReadOnlySectionController', function ($scope, $routeParams, masterData, turnSheetFactory, turnSheetSectionsFactory) {
    var section = turnSheetSectionsFactory.getByKey($routeParams.section);
    var loadedTurnId = null;

    $scope.masterData = masterData;
    $scope.rows = [];
    $scope.columns = [];
    $scope.isLoading = false;
    $scope.isSaving = false;
    $scope.loadError = '';
    $scope.actionError = '';

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

    $scope.isRowEmpty = function (row) {
        if (!row) {
            return true;
        }

        var hasValue = false;
        angular.forEach($scope.columns, function (column) {
            if (column.field === 'orderNo') {
                return;
            }

            var value = row[column.field];
            if (!(value === null || angular.isUndefined(value) || value === '')) {
                hasValue = true;
            }
        });

        return !hasValue;
    };

    $scope.canRemoveRow = function (row) {
        return !$scope.isSaving && !$scope.isRowEmpty(row);
    };

    $scope.removeRow = function (row, rowIndex) {
        if (!$scope.canRemoveRow(row)) {
            return;
        }

        var orderNo = row && (row.orderNo || row.OrderNo);
        if (!window.confirm('Remove all data from row ' + orderNo + '?')) {
            return;
        }

        var previousRow = angular.copy(row);
        $scope.actionError = '';
        $scope.isSaving = true;
        $scope.rows[rowIndex] = turnSheetSectionsFactory.clearRow(section, row, masterData && masterData.turnId);

        turnSheetFactory.postTSRecords($scope.rows, section.postType).then(function (savedRows) {
            $scope.rows = turnSheetSectionsFactory.normalizeRows(section, savedRows, masterData && masterData.turnId);
            $scope.isSaving = false;
        }, function () {
            $scope.rows[rowIndex] = previousRow;
            $scope.actionError = 'Failed to remove row. Changes were reverted.';
            $scope.isSaving = false;
        });
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
        $scope.actionError = '';

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
