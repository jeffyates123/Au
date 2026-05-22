'use strict';

austerlitzModule.controller('landUnitsController', function ($scope, masterData, turnDataLoaderService) {
    $scope.masterData = masterData;
    $scope.brigadeRows = [];
    $scope.isLoading = false;
    $scope.loadError = null;

    $scope.brigadeActions = [
        'Movement',
        'Rename',
        'Add Battalion',
        'Headcount',
        'Experience',
        'Exchange Battalions',
        'Merge Battalions',
        'Form Federation',
        'Boarding',
        'Demolish'
    ];

    $scope.initLandUnits = function () {
        if (!$scope.masterData || !$scope.masterData.turnId || $scope.masterData.turnId === 'Unknown') {
            $scope.brigadeRows = [];
            return;
        }

        if ($scope.masterData.turnReport && $scope.masterData.turnReport.brigades) {
            $scope.refreshBrigadeRows();
            return;
        }

        $scope.isLoading = true;
        $scope.loadError = null;
        turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId).then(function () {
            $scope.refreshBrigadeRows();
        }, function (error) {
            $scope.loadError = (error && error.data) ? error.data : 'Unable to load turn report.';
            $scope.brigadeRows = [];
        }).finally(function () {
            $scope.isLoading = false;
        });
    };

    $scope.refreshBrigadeRows = function () {
        var brigades = ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.brigades)
            ? $scope.masterData.turnReport.brigades
            : [];

        $scope.brigadeRows = brigades.map(function (brigade) {
            return {
                id: brigade.itemNo,
                name: trimValue(brigade.name),
                position: formatPosition(brigade),
                fed: formatFederation(brigade.federation),
                mp: brigade.mp,
                battalions: buildBattalionDisplays(brigade),
                totalMen: calculateTotalMen(brigade),
                source: brigade
            };
        });
    };

    $scope.selectBrigadeAction = function (actionName, brigade) {
        var brigadeName = brigade && brigade.name ? brigade.name : 'selected brigade';
        alert(actionName + ' for ' + brigadeName + ' is not implemented yet.');
    };

    function buildBattalionDisplays(brigade) {
        var battalions = [];
        for (var i = 1; i <= 7; i++) {
            battalions.push(formatBattalion(brigade, i));
        }
        return battalions;
    }

    function formatBattalion(brigade, index) {
        var type = trimValue(brigade['batt' + index + 'Type']);
        var ef = brigade['batt' + index + 'EF'];
        var size = brigade['batt' + index + 'Size'];

        if (!type || type === '--') {
            return '';
        }

        var parts = [type];
        if (ef != null && ef !== '') {
            parts.push(ef);
        }
        if (size != null && size !== '') {
            parts.push(size);
        }

        return parts.join(' ');
    }

    function calculateTotalMen(brigade) {
        var total = 0;
        for (var i = 1; i <= 7; i++) {
            var type = trimValue(brigade['batt' + i + 'Type']);
            var size = parseInt(brigade['batt' + i + 'Size'], 10);
            if (type && type !== '--' && !isNaN(size)) {
                total += size;
            }
        }
        return total;
    }

    function formatPosition(brigade) {
        var x = trimValue(brigade.x_OrState);
        var y = trimValue(brigade.y_OrFleet);
        if (!x && !y) {
            return '';
        }
        return x + '/' + y;
    }

    function formatFederation(federation) {
        return federation && federation !== 0 ? federation : '';
    }

    function trimValue(value) {
        return value == null ? '' : value.toString().trim();
    }
});
