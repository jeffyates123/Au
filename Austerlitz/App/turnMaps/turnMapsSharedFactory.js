'use strict';

austerlitzModule.factory('turnMapsSharedFactory', function () {
    return {
        attach: function ($scope) {
            $scope.attachUnitsToMapCoordinates = function () {
                if (!$scope.mapCoordinates || !$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
                    return;
                }

                angular.forEach($scope.mapCoordinates, function (mapRow) {
                    angular.forEach(mapRow, function (coordinate) {
                        coordinate.units = [];
                    });
                });

                angular.forEach($scope.masterData.turnReport.movementItemList, function (item) {
                    if ($scope.mapCoordinates[item.y] && $scope.mapCoordinates[item.y][item.x]) {
                        $scope.mapCoordinates[item.y][item.x].units.push(item.itemNo);
                    }
                });
            };

            $scope.getJumpOffPointText = function (coord) {
                if (!coord) return '';

                var x = parseInt(coord.x);
                var y = parseInt(coord.y);
                var terrain = coord.terrain || '';
                var isSea = '*+.'.indexOf(terrain) > -1;

                if (!isSea) return '';

                if (x === 1 && y >= 11 && y <= 20) return 'Europe -> Caribbean';
                if (x === 40 && y >= 71 && y <= 80) return 'Caribbean -> Europe';
                if (x === 1 && y >= 41 && y <= 50) return 'Europe -> India';
                if (x === 51 && y >= 81 && y <= 90) return 'India -> Europe';
                if (x >= 65 && x <= 66 && y === 65) return 'Red Sea -> India';
                if (x === 51 && y >= 75 && y <= 76) return 'India -> Red Sea';
                if (x === 40 && y >= 86 && y <= 90) return 'Caribbean (E) -> India (SW)';
                if (x >= 56 && x <= 60 && y === 99) return 'India (SW) -> Caribbean (E)';
                if (x === 1 && y >= 91 && y <= 95) return 'Caribbean (W) -> India (NE)';
                if (x === 90 && y >= 71 && y <= 75) return 'India (NE) -> Caribbean (W)';
                if (x >= 8 && x <= 12 && y === 99) return 'Caribbean (SW) -> India (SE)';
                if (x === 90 && y >= 88 && y <= 92) return 'India (SE) -> Caribbean (SW)';

                return '';
            };

            $scope.markJumpOffPoints = function () {
                if (!$scope.mapCoordinates) return;

                angular.forEach($scope.mapCoordinates, function (mapRow) {
                    angular.forEach(mapRow, function (coordinate) {
                        coordinate.jumpOffText = $scope.getJumpOffPointText(coordinate);
                    });
                });
            };


            $scope.getItemTypeName = function (itemType) {
                if (itemType === null || itemType === undefined) return '';
                if (typeof itemType === 'string') return itemType;

                switch (parseInt(itemType)) {
                    case 0: return 'Commander';
                    case 1: return 'Brigade';
                    case 2: return 'Warship';
                    case 3: return 'MerchantShip';
                    case 4: return 'BaggageTrain';
                    case 5: return 'Spy';
                    default: return '';
                }
            };

            $scope.normalizeItemTypeName = function (itemTypeName) {
                return (itemTypeName == null ? '' : itemTypeName.toString()).trim();
            };

            $scope.resolveItemTypeName = function (item) {
                if (!item) return '';

                var fromType = $scope.getItemTypeName(item.itemType);
                if (fromType) return fromType;

                var explicitTypeName = $scope.normalizeItemTypeName(item.itemTypeName);
                if (explicitTypeName === 'Brigade'
                    || explicitTypeName === 'Commander'
                    || explicitTypeName === 'Warship'
                    || explicitTypeName === 'MerchantShip'
                    || explicitTypeName === 'BaggageTrain'
                    || explicitTypeName === 'Spy') {
                    return explicitTypeName;
                }

                return explicitTypeName;
            };

            $scope.isNavalItemTypeName = function (itemTypeName) {
                var normalized = $scope.normalizeItemTypeName(itemTypeName);
                return normalized === 'Warship' || normalized === 'MerchantShip';
            };

            $scope.isNavalMovementItem = function (item) {
                if (!item) return false;
                if ($scope.isNavalItemTypeName(item.itemTypeName)) return true;
                return $scope.isNavalItemTypeName($scope.getItemTypeName(item.itemType));
            };

            $scope.getItemTypeAbbrev = function (item) {
                if (!item) return '';

                var typeName = $scope.resolveItemTypeName(item);

                switch (typeName) {
                    case 'Brigade': return 'Bgd';
                    case 'Commander': return 'Cmd';
                    case 'Warship': return item.shipTypeNo != null ? item.shipTypeNo.toString() : 'War';
                    case 'Spy': return 'Spy';
                    case 'BaggageTrain': return 'BagT';
                    case 'MerchantShip': return item.shipTypeNo != null ? item.shipTypeNo.toString() : 'Mer';
                    case 'Federation': return 'Fed';
                    default: return typeName;
                }
            };

            $scope.clearDisplayField = function () {
                angular.forEach($scope.mapCoordinates, function (mapcol) {
                    angular.forEach(mapcol, function (coordinate) {
                        coordinate.displayField = '';
                    });
                });
            };

            $scope.getTerrainMP = function (terrain) {
                var breakLoop = false;
                var rtnMP = 0;

                if ('*+.'.indexOf(terrain) > -1) return 99;

                angular.forEach($scope.terrainList, function (terrainItem) {
                    if (!breakLoop && terrainItem.terrainId == terrain) {
                        rtnMP = parseInt(terrainItem.mp);
                        breakLoop = true;
                    }
                });
                return rtnMP;
            };

            $scope.getNextCoordinate = function (dir, currentCoord) {
                var newX = currentCoord.x;
                var newY = currentCoord.y;

                switch (parseInt(dir)) {
                    case 1: newY--; break;
                    case 2: newY--; newX++; break;
                    case 3: newX++; break;
                    case 4: newY++; newX++; break;
                    case 5: newY++; break;
                    case 6: newY++; newX--; break;
                    case 7: newX--; break;
                    case 8: newY--; newX--; break;
                }
                return $scope.getCoordinateByXY(newX, newY);
            };

            $scope.getCoordinateByXY = function (x, y) {
                var breakLoop = false;
                var rtnCoordinate = null;

                angular.forEach($scope.mapCoordinates, function (mapcol) {
                    if (breakLoop == false) {
                        angular.forEach(mapcol, function (coordinate) {
                            if (coordinate.x == x && coordinate.y == y) {
                                rtnCoordinate = coordinate;
                                breakLoop = true;
                            }
                        });
                    }
                });
                return rtnCoordinate;
            };

            $scope.getCoordinatesInADirection = function (requiredDirection, requiredDistance, beginCoordinate, item, className) {
                var nextCoordinate = beginCoordinate;
                var travelledDistance = 0;

                while (travelledDistance < requiredDistance && nextCoordinate.x >= $scope.selectedMapChoice.rangeMinX && nextCoordinate.x <= $scope.selectedMapChoice.rangeMaxX && nextCoordinate.y >= $scope.selectedMapChoice.rangeMinY && nextCoordinate.y <= $scope.selectedMapChoice.rangeMaxY) {
                    nextCoordinate = $scope.getNextCoordinate(requiredDirection, nextCoordinate);
                    var nextMoveCostMP = $scope.getTerrainMPForItem(nextCoordinate, item);

                    if (nextMoveCostMP <= (item.mp - item.mpUsed)) {
                        nextCoordinate.displayField = className;
                    } else {
                        nextCoordinate.displayField = 'moveInvalid';
                    }

                    item.mpUsed = item.mpUsed + nextMoveCostMP;
                    travelledDistance++;
                }

                return nextCoordinate;
            };

            $scope.defineCoordClass = function (terrain, state, population, productionSite, bonusSymbol, displayField, units, x, y, routeCandidate, jumpOffText) {
                var baseClass = '';

                switch ($scope.selectedDisplayOption.name) {
                    case 'Movement':
                    case 'Boarding':
                        baseClass = (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea' : 'terrain_' + terrain;
                        if (displayField) {
                            baseClass = baseClass + ' ' + displayField;
                        }
                        break;
                    case 'SetUpBrigades':
                    case 'FormFederation':
                        baseClass = (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea' : 'terrain_' + terrain;
                        break;
                    case 'Terrain':
                        baseClass = (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea unitExists' : 'terrain_' + terrain;
                        break;
                    case 'State':
                        baseClass = 'state_' + state;
                        break;
                    case 'ProductionSite':
                        baseClass = $scope.getProductionSiteEligibilityClass({
                            terrain: terrain,
                            state: state,
                            population: population,
                            productionSite: productionSite,
                            bonus: bonusSymbol
                        });
                        break;
                }

                if ($scope.isProductionSiteMode && $scope.isProductionSiteMode() && $scope.hasBuildProductionSiteAtCoordinate && $scope.hasBuildProductionSiteAtCoordinate(x, y)) {
                    baseClass = (baseClass ? baseClass + ' ' : '') + 'prodSite_BuiltThisTurn';
                }

                if (x > 0 && y > 0 && units && units.length > 0) {
                    baseClass = (baseClass ? baseClass + ' ' : '') + 'unit_Exists';
                }

                if ($scope.selectedMovementItemCoordinate
                    && $scope.selectedMovementItemCoordinate.x == x
                    && $scope.selectedMovementItemCoordinate.y == y) {
                    baseClass = (baseClass ? baseClass + ' ' : '') + 'movementItemSelected';
                }

                if (jumpOffText && !displayField) {
                    baseClass = (baseClass ? baseClass + ' ' : '') + 'jumpOffPoint';
                }

                if (routeCandidate) {
                    baseClass = (baseClass ? baseClass + ' ' : '') + $scope.getRouteCandidateClass(state);
                }

                return baseClass;
            };

            $scope.filterMapFn = function (col) {
                if (col.x == 0 || (col.x >= $scope.selectedMapChoice.minX && col.x <= $scope.selectedMapChoice.maxX)) {
                    if (col.y == 0) return true;
                    if (col.y >= $scope.selectedMapChoice.minY && col.y <= $scope.selectedMapChoice.maxY) return true;
                }

                return false;
            };
        }
    };
});
