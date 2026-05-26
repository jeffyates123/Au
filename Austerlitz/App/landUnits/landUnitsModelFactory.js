'use strict';

austerlitzModule.factory('landUnitsModelFactory', function () {
    return {
        attach: function ($scope, rulesCatalogFactory) {
            $scope.getBrigadesByFederation = function (federationNo) {
                    return ($scope.brigadeRows || []).filter(function (brigade) {
                        return $scope.sameNullableInt(brigade.fed, federationNo);
                    });
                };

            $scope.getBrigadeById = function (id) {
                    for (var i = 0; i < $scope.brigadeRows.length; i++) {
                        if ($scope.sameNullableInt($scope.brigadeRows[i].id, id)) {
                            return $scope.brigadeRows[i];
                        }
                    }
            
                    return null;
                };

            $scope.sameNullableInt = function (left, right) {
                    return parseInt(left, 10) === parseInt(right, 10);
                };

            $scope.buildBattalionDisplays = function (brigade) {
                    var battalions = [];
                    for (var i = 1; i <= 7; i++) {
                        battalions.push($scope.buildBattalionDisplay(brigade, i));
                    }
                    return battalions;
                };

            $scope.buildBattalionDisplay = function (brigade, index) {
                    var type = $scope.trimValue(brigade['batt' + index + 'Type']);
                    var ef = brigade['batt' + index + 'EF'];
                    var size = brigade['batt' + index + 'Size'];
            
                    if (!type || type === '--') {
                        return {
                            slot: index,
                            type: '',
                            originalEf: null,
                            currentEf: null,
                            baseSize: null,
                            size: null,
                            display: '',
                            isEfChanged: false,
                            efDrop: 0,
                            efIncrease: 0,
                            isNewAddition: false,
                            isLockedByTurnOrder: false
                        };
                    }
            
                    return {
                        slot: index,
                        type: type,
                        originalEf: ef,
                        currentEf: ef,
                        baseSize: size,
                        size: size,
                        display: $scope.formatBattalionParts(type, ef, size),
                        isEfChanged: false,
                        efDrop: 0,
                        efIncrease: 0,
                        isNewAddition: false,
                        isLockedByTurnOrder: false
                    };
                };

            $scope.formatBattalionParts = function (type, ef, size) {
                    var parts = [type];
                    if (ef != null && ef !== '') parts.push(ef);
                    if (size != null && size !== '') parts.push(size);
                    return parts.join(' ');
                };

            $scope.calculatePlaceholderResources = function () {
                    return {
                        ld: '',
                        citizens: '',
                        ecPts: '',
                        horses: ''
                    };
                };

            $scope.buildArmyListLookup = function (armyList) {
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
                };

            $scope.normalizeBrigadeBattalionEfValues = function () {
                    angular.forEach($scope.brigadeRows || [], function (brigade) {
                        angular.forEach((brigade && brigade.battalions) || [], function (battalion) {
                            if (!battalion || !battalion.type) {
                                return;
                            }

                            var existingEf = parseInt(battalion.originalEf, 10);
                            if (!isNaN(existingEf) && existingEf > 0) {
                                return;
                            }

                            var armyItem = $scope.armyListByShortName[(battalion.type || '').toString().trim().toUpperCase()];
                            if (!armyItem) {
                                return;
                            }

                            var defaultEf = parseInt(armyItem.ef, 10);
                            if (isNaN(defaultEf)) {
                                defaultEf = parseInt(armyItem.EF, 10);
                            }
                            if (isNaN(defaultEf) || defaultEf <= 0) {
                                return;
                            }

                            battalion.originalEf = defaultEf;
                            battalion.currentEf = defaultEf;
                            battalion.display = $scope.formatBattalionParts(battalion.type, battalion.currentEf, battalion.size);
                            if (brigade.source) {
                                brigade.source['batt' + battalion.slot + 'EF'] = defaultEf;
                            }
                        });
                    });
                };

            $scope.getTurnStateCode = function () {
                    if ($scope.masterData && $scope.masterData.selectedState) {
                        return $scope.masterData.selectedState;
                    }
            
                    if ($scope.masterData && $scope.masterData.turnId && $scope.masterData.turnId.length >= 4) {
                        return $scope.masterData.turnId.substr(3, 1);
                    }
            
                    return null;
                };

            $scope.normalizeStateCode = function (value) {
                    var text = (value || '').toString().trim().toUpperCase();
                    return text ? text.substr(0, 1) : '';
                };

            $scope.getMapCoordinateAt = function (x, y) {
                    var px = parseInt(x, 10);
                    var py = parseInt(y, 10);
                    if (isNaN(px) || isNaN(py)) {
                        return null;
                    }

                    var mapRows = ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.mapCoordinates) || [];
                    if (!mapRows[py] || !mapRows[py][px]) {
                        return null;
                    }
                    return mapRows[py][px];
                };

            $scope.getLocationCostBadgeForBrigade = function (brigade) {
                    if (!brigade || !brigade.source) {
                        return { code: '', tooltip: '' };
                    }

                    var sphere = $scope.getBrigadeSphere(brigade);
                    if (sphere === 'Caribbean') {
                        return { code: 'C', tooltip: 'C - 1x cost as brigade resides in Caribbean region.' };
                    }
                    if (sphere === 'India') {
                        return { code: 'I', tooltip: 'I - 1x cost as brigade resides in India region.' };
                    }
                    if (sphere !== 'Europe') {
                        return { code: '', tooltip: '' };
                    }

                    var homeState = $scope.normalizeStateCode($scope.getTurnStateCode());
                    var mapCoord = $scope.getMapCoordinateAt(brigade.source.x_OrState, brigade.source.y_OrFleet);
                    if (!homeState || !mapCoord) {
                        return { code: '', tooltip: '' };
                    }

                    var regionState = $scope.normalizeStateCode(mapCoord.state);
                    var ownerState = $scope.normalizeStateCode(mapCoord.owner);
                    if (regionState && regionState === homeState) {
                        return { code: 'H', tooltip: 'H - 1x cost as brigade resides in European Home region.' };
                    }
                    if (ownerState && ownerState === homeState) {
                        return { code: 'P', tooltip: 'P - 1.5x cost as brigade resides in European Political sphere.' };
                    }
                    return { code: 'O', tooltip: 'O - 3x cost as brigade resides in European Outside region (not home or political sphere).' };
                };

            $scope.getInitialSphereFilter = function () {
                    var stored = null;
                    try {
                        stored = window.localStorage.getItem('austerlitz.landUnits.selectedSphere');
                    }
                    catch (e) {
                    }
            
                    return $scope.sphereOptions && $scope.sphereOptions.indexOf(stored) >= 0 ? stored : 'All';
                };

            $scope.getBrigadeSphere = function (brigade) {
                    if (!brigade || !brigade.source) {
                        return 'Unknown';
                    }
            
                    var x = parseInt(brigade.source.x_OrState, 10);
                    var y = parseInt(brigade.source.y_OrFleet, 10);
                    if (isNaN(x) || isNaN(y)) {
                        return 'Unknown';
                    }
            
                    if (x <= 80 && y <= 65) return 'Europe';
                    if (x <= 40 && y <= 99) return 'Caribbean';
                    if (x <= 90 && y <= 99) return 'India';
                    return 'Unknown';
                };

            $scope.compareBrigadeRowsForDisplay = function (left, right) {
                    var sphereCompare = $scope.getSphereSortOrder(left) - $scope.getSphereSortOrder(right);
                    if (sphereCompare !== 0) {
                        return sphereCompare;
                    }
            
                    var leftFederation = $scope.getFederationSortNo(left);
                    var rightFederation = $scope.getFederationSortNo(right);
                    var leftHasFederation = leftFederation > 0;
                    var rightHasFederation = rightFederation > 0;
            
                    if (leftHasFederation !== rightHasFederation) {
                        return leftHasFederation ? 1 : -1;
                    }
            
                    if (leftHasFederation && leftFederation !== rightFederation) {
                        return leftFederation - rightFederation;
                    }
            
                    return $scope.getUnitSortNo(left) - $scope.getUnitSortNo(right);
                };

            $scope.getSphereSortOrder = function (brigade) {
                    switch ($scope.getBrigadeSphere(brigade)) {
                        case 'Europe': return 1;
                        case 'Caribbean': return 2;
                        case 'India': return 3;
                        default: return 99;
                    }
                };

            $scope.getFederationSortNo = function (brigade) {
                    var federationNo = parseInt(brigade && brigade.fed, 10);
                    return isNaN(federationNo) ? 0 : federationNo;
                };

            $scope.getUnitSortNo = function (brigade) {
                    var unitNo = parseInt(brigade && brigade.id, 10);
                    return isNaN(unitNo) ? 0 : unitNo;
                };

            $scope.formatPosition = function (brigade) {
                    var x = $scope.trimValue(brigade.x_OrState);
                    var y = $scope.trimValue(brigade.y_OrFleet);
                    if (!x && !y) {
                        return '';
                    }
                    return x + '/' + y;
                };

            $scope.formatFederation = function (federation) {
                    return federation && federation !== 0 ? federation : '';
                };

            $scope.getStateColor = function () {
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
                };

            $scope.trimValue = function (value) {
                    return value == null ? '' : value.toString().trim();
                };

            $scope.loadArmyListForHeadcountCosts = function () {
                    var stateCode = $scope.getTurnStateCode();
                    return rulesCatalogFactory.getArmyList(stateCode).then(function (armyList) {
                        $scope.armyListRows = armyList || [];
                        $scope.armyListByShortName = $scope.buildArmyListLookup(armyList);
                        $scope.normalizeBrigadeBattalionEfValues();
                    }, function () {
                        $scope.armyListRows = [];
                        $scope.armyListByShortName = {};
                    });
                };

            $scope.refreshBrigadeRows = function () {
                    var brigades = ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.brigades)
                        ? $scope.masterData.turnReport.brigades
                        : [];
            
                    $scope.brigadeRows = brigades.map(function (brigade, index) {
                        return {
                            id: brigade.itemNo,
                            loadedOrder: index,
                            name: $scope.trimValue(brigade.name),
                            position: $scope.formatPosition(brigade),
                            fed: $scope.formatFederation(brigade.federation),
                            originalFed: $scope.formatFederation(brigade.federation),
                            fedChanged: false,
                            mp: brigade.mp,
                            battalions: $scope.buildBattalionDisplays(brigade),
                            trainSelected: false,
                            trainPlan: null,
                            headcountSelected: false,
                            headcountPlan: null,
                            resources: $scope.calculatePlaceholderResources(),
                            source: brigade
                        };
                    }).sort($scope.compareBrigadeRowsForDisplay);
                };

            $scope.filteredBrigadeRows = function () {
                    if (!$scope.selectedSphere || $scope.selectedSphere === 'All') {
                        return $scope.brigadeRows;
                    }
            
                    return $scope.brigadeRows.filter(function (brigade) {
                        return $scope.getBrigadeSphere(brigade) === $scope.selectedSphere;
                    });
                };

            $scope.onSphereChanged = function () {
                    try {
                        window.localStorage.setItem('austerlitz.landUnits.selectedSphere', $scope.selectedSphere || 'All');
                    }
                    catch (e) {
                    }
                };

        }
    };
});
