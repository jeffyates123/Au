'use strict';

austerlitzModule.controller('turnSheetAllSectionsController', function ($scope, masterData, turnSheetSectionsFactory) {
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
                loadError: '',
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
