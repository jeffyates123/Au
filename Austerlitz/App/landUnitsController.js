'use strict';

austerlitzModule.controller('landUnitsController', function ($scope, masterData, turnDataLoaderService, rulesCatalogFactory) {
    $scope.masterData = masterData;
    $scope.brigadeRows = [];
    $scope.isLoading = false;
    $scope.loadError = null;
    $scope.armyListByShortName = {};

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
            $scope.loadArmyListForHeadcountCosts();
            return;
        }

        $scope.isLoading = true;
        $scope.loadError = null;
        turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId).then(function () {
            $scope.refreshBrigadeRows();
            $scope.loadArmyListForHeadcountCosts();
        }, function (error) {
            $scope.loadError = (error && error.data) ? error.data : 'Unable to load turn report.';
            $scope.brigadeRows = [];
        }).finally(function () {
            $scope.isLoading = false;
        });
    };

    $scope.loadArmyListForHeadcountCosts = function () {
        var stateCode = getTurnStateCode();
        rulesCatalogFactory.getArmyList(stateCode).then(function (armyList) {
            $scope.armyListByShortName = buildArmyListLookup(armyList);
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
                trainSelected: false,
                headcountSelected: false,
                resources: calculatePlaceholderResources(),
                source: brigade
            };
        });
    };

    $scope.toggleBrigadeFlag = function (brigade, flagName) {
        if (!brigade) {
            return;
        }

        brigade[flagName] = !brigade[flagName];
        brigade.resources = calculatePlaceholderResources(brigade);
    };

    $scope.toggleHeadcount = function (brigade) {
        if (!brigade) {
            return;
        }

        if (brigade.headcountSelected) {
            brigade.headcountSelected = false;
            brigade.resources = calculatePlaceholderResources();
            resetBattalionDisplays(brigade);
            return;
        }

        if (!isBrigadeAtBarracks(brigade)) {
            alert('Headcount can only be increased when the brigade is at one of your barracks.');
            return;
        }

        brigade.headcountSelected = true;
        brigade.resources = calculateHeadcountResources(brigade);
        applyHeadcountEfChanges(brigade);
    };

    $scope.getBrigadeToggleStyle = function (isSelected) {
        if (!isSelected) {
            return {};
        }

        var stateColor = getStateColor();
        return {
            'background-color': stateColor.backgroundColor,
            color: stateColor.textColor,
            'border-color': stateColor.backgroundColor
        };
    };

    $scope.selectBrigadeAction = function (actionName, brigade) {
        var brigadeName = brigade && brigade.name ? brigade.name : 'selected brigade';
        alert(actionName + ' for ' + brigadeName + ' is not implemented yet.');
    };

    function buildBattalionDisplays(brigade) {
        var battalions = [];
        for (var i = 1; i <= 7; i++) {
            battalions.push(buildBattalionDisplay(brigade, i));
        }
        return battalions;
    }

    function buildBattalionDisplay(brigade, index) {
        var type = trimValue(brigade['batt' + index + 'Type']);
        var ef = brigade['batt' + index + 'EF'];
        var size = brigade['batt' + index + 'Size'];

        if (!type || type === '--') {
            return {
                slot: index,
                type: '',
                originalEf: null,
                currentEf: null,
                size: null,
                display: '',
                isEfChanged: false
            };
        }

        return {
            slot: index,
            type: type,
            originalEf: ef,
            currentEf: ef,
            size: size,
            display: formatBattalionParts(type, ef, size),
            isEfChanged: false
        };
    }

    function formatBattalionParts(type, ef, size) {
        var parts = [type];
        if (ef != null && ef !== '') parts.push(ef);
        if (size != null && size !== '') parts.push(size);
        return parts.join(' ');
    }

    function calculatePlaceholderResources() {
        return {
            ld: '',
            citizens: '',
            ecPts: '',
            horses: ''
        };
    }

    function calculateHeadcountResources(brigade) {
        var resources = {
            ld: 0,
            citizens: 0,
            ecPts: 0,
            horses: 0
        };

        angular.forEach(brigade.battalions, function (battalion) {
            var missingMen = getMissingHeadcount(battalion);
            if (missingMen <= 0) {
                return;
            }

            var armyItem = getArmyItemForBattalion(battalion);
            if (!armyItem) {
                return;
            }

            var cost = parseFloat(armyItem.cost);
            var ecPtsPer25 = parseFloat(armyItem.ecPtsPer25);
            if (isNaN(cost)) cost = 0;
            if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;

            resources.ld += Math.round(missingMen * cost);
            resources.citizens += missingMen;
            resources.ecPts += Math.round(Math.ceil(missingMen / 25) * ecPtsPer25);
            if (isMountedArmyItem(armyItem)) {
                resources.horses += missingMen;
            }
        });

        return {
            ld: resources.ld || '',
            citizens: resources.citizens || '',
            ecPts: resources.ecPts || '',
            horses: resources.horses || ''
        };
    }

    function applyHeadcountEfChanges(brigade) {
        angular.forEach(brigade.battalions, function (battalion) {
            var originalEf = parseInt(battalion.originalEf, 10);
            var missingMen = getMissingHeadcount(battalion);
            var drop = getEfDrop(missingMen, battalion.size);

            if (!battalion.display || isNaN(originalEf) || drop <= 0) {
                battalion.currentEf = battalion.originalEf;
                battalion.isEfChanged = false;
                battalion.display = formatBattalionParts(battalion.type, battalion.originalEf, battalion.size);
                return;
            }

            battalion.currentEf = Math.max(0, originalEf - drop);
            battalion.isEfChanged = battalion.currentEf !== originalEf;
            battalion.display = formatBattalionParts(battalion.type, battalion.currentEf, battalion.size);
        });
    }

    function resetBattalionDisplays(brigade) {
        angular.forEach(brigade.battalions, function (battalion) {
            battalion.currentEf = battalion.originalEf;
            battalion.isEfChanged = false;
            battalion.display = battalion.type ? formatBattalionParts(battalion.type, battalion.originalEf, battalion.size) : '';
        });
    }

    function getMissingHeadcount(battalion) {
        if (!battalion || !battalion.type) {
            return 0;
        }

        var currentSize = parseInt(battalion.size, 10);
        if (isNaN(currentSize)) {
            currentSize = 0;
        }

        return Math.max(0, 800 - currentSize);
    }

    function getEfDrop(missingMen, currentSize) {
        var size = parseInt(currentSize, 10);
        if (isNaN(size)) {
            size = 0;
        }

        if (missingMen <= 0) {
            return 0;
        }

        if (missingMen > size) {
            return 2;
        }

        if (missingMen > (size * 0.5)) {
            return 1;
        }

        return 0;
    }

    function getArmyItemForBattalion(battalion) {
        if (!battalion || !battalion.type) {
            return null;
        }

        return $scope.armyListByShortName[battalion.type.toString().trim().toUpperCase()] || null;
    }

    function isMountedArmyItem(armyItem) {
        if (!armyItem) {
            return false;
        }

        var shortName = (armyItem.shortName || '').toString();
        var name = (armyItem.name || '').toString();
        return !!armyItem.isCavalry || /mounted/i.test(name) || /^mc$/i.test(shortName);
    }

    function buildArmyListLookup(armyList) {
        var lookup = {};
        angular.forEach(armyList || [], function (armyItem) {
            if (armyItem.shortName != null) {
                var key = armyItem.shortName.toString().trim().toUpperCase();
                if (key && !lookup[key]) {
                    lookup[key] = armyItem;
                }
            }
        });
        return lookup;
    }

    function isBrigadeAtBarracks(brigade) {
        if (!brigade || !$scope.masterData || !$scope.masterData.turnReport) {
            return false;
        }

        var x = parseInt(brigade.source.x_OrState, 10);
        var y = parseInt(brigade.source.y_OrFleet, 10);
        if (isNaN(x) || isNaN(y)) {
            return false;
        }

        var barracks = $scope.masterData.turnReport.barracks || [];
        for (var i = 0; i < barracks.length; i++) {
            if (parseInt(barracks[i].x, 10) === x && parseInt(barracks[i].y, 10) === y) {
                return true;
            }
        }

        return false;
    }

    function getTurnStateCode() {
        if ($scope.masterData && $scope.masterData.selectedState) {
            return $scope.masterData.selectedState;
        }

        if ($scope.masterData && $scope.masterData.turnId && $scope.masterData.turnId.length >= 4) {
            return $scope.masterData.turnId.substr(3, 1);
        }

        return null;
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

    function getStateColor() {
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

        return {
            backgroundColor: stateColors[stateCode] || '#777777',
            textColor: stateCode === 'T' ? 'rgb(192, 192, 192)' : '#111111'
        };
    }

    function trimValue(value) {
        return value == null ? '' : value.toString().trim();
    }
});
