'use strict';

austerlitzModule.controller('turnSheetAllSectionsController', function ($scope, masterData, turnSheetFactory, turnSheetSectionsFactory) {
    var loadedTurnId = null;

    $scope.masterData = masterData;
    $scope.sections = [];
    $scope.loadError = '';
    $scope.isLoading = false;

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

    $scope.toggleSection = function (section) {
        section.collapsed = !section.collapsed;
    };

    $scope.isRowEmpty = function (section, row) {
        if (!row || !section || !section.columns) {
            return true;
        }

        var hasValue = false;
        angular.forEach(section.columns, function (column) {
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

    $scope.canRemoveRow = function (section, row) {
        return !section.isSaving && !$scope.isRowEmpty(section, row);
    };

    $scope.removeRow = function (sectionView, row, rowIndex) {
        if (!$scope.canRemoveRow(sectionView, row)) {
            return;
        }

        var orderNo = row && (row.orderNo || row.OrderNo);
        if (!window.confirm('Remove all data from row ' + orderNo + '?')) {
            return;
        }

        var config = turnSheetSectionsFactory.getByKey(sectionView.key);
        var previousRow = angular.copy(row);
        sectionView.actionError = '';
        sectionView.isSaving = true;
        sectionView.rows[rowIndex] = turnSheetSectionsFactory.clearRow(config, row, masterData && masterData.turnId);

        turnSheetFactory.postTSRecords(sectionView.rows, config.postType).then(function (savedRows) {
            sectionView.rows = turnSheetSectionsFactory.normalizeRows(config, savedRows, masterData && masterData.turnId);
            sectionView.isSaving = false;
        }, function () {
            sectionView.rows[rowIndex] = previousRow;
            sectionView.actionError = 'Failed to remove row. Changes were reverted.';
            sectionView.isSaving = false;
        });
    };

    $scope.loadAll = function () {
        var turnId = masterData && masterData.turnId;
        if (!turnId || turnId === 'Unknown') {
            $scope.loadError = 'No turn selected. Select a turn first.';
            return;
        }

        loadedTurnId = turnId;
        $scope.loadError = '';
        $scope.isLoading = true;

        $scope.sections = turnSheetSectionsFactory.getAll().map(function (config) {
            return {
                key: config.key,
                shortTitle: config.shortTitle,
                title: config.title,
                maxRows: config.maxRows,
                columns: config.columns,
                rows: turnSheetSectionsFactory.normalizeRows(config, [], turnId),
                isLoading: true,
                isSaving: false,
                loadError: '',
                actionError: '',
                collapsed: false
            };
        });

        angular.forEach($scope.sections, function (sectionView) {
            var config = turnSheetSectionsFactory.getByKey(sectionView.key);
            config.load(turnId).then(function (data) {
                sectionView.rows = turnSheetSectionsFactory.normalizeRows(config, data, turnId);
                sectionView.isLoading = false;
                markSectionLoaded();
            }, function () {
                sectionView.loadError = 'Failed to load this section.';
                sectionView.isLoading = false;
                markSectionLoaded();
            });
        });
    };

    function markSectionLoaded() {
        var loadingSections = $scope.sections.filter(function (section) {
            return section.isLoading;
        });

        $scope.isLoading = loadingSections.length > 0;
    }

    $scope.$watch(function () {
        return masterData && masterData.turnId;
    }, function (turnId) {
        if (turnId && turnId !== 'Unknown' && turnId !== loadedTurnId) {
            $scope.loadAll();
        }
    });

    $scope.loadAll();
});
