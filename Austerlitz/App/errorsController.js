'use strict';

austerlitzModule.controller('errorsController', function ($scope, masterData) {
    $scope.masterData = masterData;
    $scope.errorSearchText = '';
    $scope.errorRows = [];
    $scope.errorSortField = 'sectionNo';
    $scope.errorSortDescending = false;

    $scope.initErrors = function () {
        $scope.errorRows = readErrorsFromMasterData();
    };

    function readErrorsFromMasterData() {
        var turnReport = $scope.masterData ? $scope.masterData.turnReport : null;
        if (!turnReport) {
            return [];
        }

        return normalizeErrors(turnReport.errors || turnReport.Errors || []);
    }

    function normalizeErrors(rows) {
        var result = [];
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i] || {};
            result.push({
                turnOrderErrorId: row.turnOrderErrorId || row.TurnOrderErrorId || 0,
                sectionNo: toInt(row.sectionNo, row.SectionNo),
                orderNo: toInt(row.orderNo, row.OrderNo),
                errorCode: toInt(row.errorCode, row.ErrorCode),
                message: (row.message || row.Message || 'Unknown error code').toString(),
                rawToken: (row.rawToken || row.RawToken || '').toString()
            });
        }
        return result;
    }

    function toInt(firstValue, secondValue) {
        var value = firstValue !== undefined && firstValue !== null ? firstValue : secondValue;
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
    }

    $scope.toggleErrorsSort = function (fieldName) {
        if ($scope.errorSortField === fieldName) {
            $scope.errorSortDescending = !$scope.errorSortDescending;
            return;
        }

        $scope.errorSortField = fieldName;
        $scope.errorSortDescending = false;
    };

    $scope.getSortedErrors = function () {
        var searchText = ($scope.errorSearchText || '').toLowerCase();
        var filtered = $scope.errorRows.filter(function (row) {
            if (!searchText) {
                return true;
            }

            var searchBlob = [
                row.sectionNo,
                row.orderNo,
                row.errorCode,
                row.message,
                row.rawToken
            ].join(' ').toLowerCase();
            return searchBlob.indexOf(searchText) !== -1;
        });

        var field = $scope.errorSortField;
        filtered.sort(function (a, b) {
            var left = a[field];
            var right = b[field];

            if (typeof left === 'string') {
                left = left.toLowerCase();
            }
            if (typeof right === 'string') {
                right = right.toLowerCase();
            }

            if (left < right) return $scope.errorSortDescending ? 1 : -1;
            if (left > right) return $scope.errorSortDescending ? -1 : 1;
            return 0;
        });

        return filtered;
    };

    $scope.$watch(function () {
        return $scope.masterData && $scope.masterData.turnReport;
    }, function () {
        $scope.errorRows = readErrorsFromMasterData();
    }, true);
});
