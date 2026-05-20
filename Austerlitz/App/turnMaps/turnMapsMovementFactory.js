'use strict';

austerlitzModule.factory('turnMapsMovementFactory', function () {
    return {
        attach: function ($scope) {
            $scope.movementClickRow = function (row) {
                $scope.clearDisplayField();
                $scope.clearRouteCandidates();
                $scope.pendingRouteSelection = null;
                $scope.selectedMovementItemCoordinate = null;

                if (row.entity.itemNo != null) {
                    var selectedItem = $scope.getItemFromItemNo(row.entity.itemNo);
                    var item = {
                        itemNo: selectedItem.itemNo,
                        mpUsed: 0,
                        mp: selectedItem.mp,
                        x: selectedItem.x,
                        y: selectedItem.y,
                        itemType: selectedItem.itemType,
                        itemTypeName: selectedItem.itemTypeName,
                        shipTypeNo: selectedItem.shipTypeNo
                    };

                    var initialCoord = $scope.getCoordinateByXY(item.x, item.y);

                    if (initialCoord != null) {
                        $scope.selectedMovementRow = row.entity;
                        $scope.selectedMovementItemCoordinate = { x: item.x, y: item.y };
                        row.entity.type = $scope.getItemTypeAbbrev(selectedItem);
                        row.entity.mp = item.mp;
                        initialCoord.displayField = 'moveStart';

                        if (row.entity.direction1 > 0 && row.entity.distance1 > 0) {
                            var beginCoordinate = $scope.getCoordinatesInADirection(row.entity.direction1, row.entity.distance1, initialCoord, item, 'moveDir1');

                            if (row.entity.direction2 > 0 && row.entity.distance2 > 0) {
                                beginCoordinate = $scope.getCoordinatesInADirection(row.entity.direction2, row.entity.distance2, beginCoordinate, item, 'moveDir2');

                                if (row.entity.direction3 > 0 && row.entity.distance3 > 0) {
                                    beginCoordinate = $scope.getCoordinatesInADirection(row.entity.direction3, row.entity.distance3, beginCoordinate, item, 'moveDir3');
                                }
                            }
                        } else {
                            if (!item.x || !item.y || item.x <= 0 || item.y <= 0) {
                                $scope.selectedCoordinateDetails = 'Selected unit has no valid map coordinate (possibly boarded).';
                                return;
                            }

                            var routesByCoord = $scope.calculateReachableRoutes(initialCoord, selectedItem);
                            if (Object.keys(routesByCoord).length === 0) {
                                $scope.selectedCoordinateDetails = 'No reachable coordinates found for this unit with current movement allowance.';
                                return;
                            }

                            $scope.markRouteCandidates(routesByCoord);
                            $scope.pendingRouteSelection = { row: row.entity, routesByCoord: routesByCoord };
                        }

                        row.entity.mpUsed = item.mpUsed;
                        row.entity.xy = item.x + '/' + item.y;
                        row.entity.mp = item.mp;
                    }
                }
            };

            $scope.applyRouteToMovementRow = function (movementRow, segments) {
                movementRow.direction1 = null;
                movementRow.distance1 = null;
                movementRow.direction2 = null;
                movementRow.distance2 = null;
                movementRow.direction3 = null;
                movementRow.distance3 = null;

                if (segments && segments.length > 0) {
                    movementRow.direction1 = segments[0].dir;
                    movementRow.distance1 = segments[0].dist;
                }
                if (segments && segments.length > 1) {
                    movementRow.direction2 = segments[1].dir;
                    movementRow.distance2 = segments[1].dist;
                }
                if (segments && segments.length > 2) {
                    movementRow.direction3 = segments[2].dir;
                    movementRow.distance3 = segments[2].dist;
                }
            };

            $scope.clearRouteCandidates = function () {
                if (!$scope.mapCoordinates) return;

                angular.forEach($scope.mapCoordinates, function (mapRow) {
                    angular.forEach(mapRow, function (coordinate) {
                        coordinate.routeCandidate = false;
                    });
                });
            };

            $scope.markRouteCandidates = function (routesByCoord) {
                $scope.clearRouteCandidates();

                angular.forEach(routesByCoord, function (route) {
                    if ($scope.mapCoordinates[route.y] && $scope.mapCoordinates[route.y][route.x]) {
                        $scope.mapCoordinates[route.y][route.x].routeCandidate = true;
                    }
                });
            };

            $scope.calculateReachableRoutes = function (startCoord, selectedItem) {
                var routesByCoord = {};

                var recordRoute = function (coord, segments, usedMp) {
                    if (!coord || segments.length === 0 || segments.length > 3) return;

                    var key = coord.x + '_' + coord.y;
                    var existing = routesByCoord[key];

                    if (!existing || usedMp < existing.usedMp || (usedMp === existing.usedMp && segments.length < existing.segments.length)) {
                        routesByCoord[key] = {
                            x: coord.x,
                            y: coord.y,
                            usedMp: usedMp,
                            segments: segments.map(function (s) { return { dir: s.dir, dist: s.dist }; })
                        };
                    }
                };

                var explore = function (fromCoord, remainingMp, usedMp, segments) {
                    if (segments.length >= 3 || remainingMp <= 0) return;

                    for (var dir = 1; dir <= 8; dir++) {
                        var currentCoord = fromCoord;
                        var segmentDistance = 0;
                        var segmentCost = 0;

                        while (true) {
                            var nextCoord = $scope.getNextCoordinate(dir, currentCoord);
                            if (!nextCoord || !$scope.isCoordInSelectedMap(nextCoord)) break;

                            var moveCost = $scope.getTerrainMPForItem(nextCoord, selectedItem);
                            if (moveCost <= 0 || segmentCost + moveCost > remainingMp) break;

                            segmentDistance++;
                            segmentCost += moveCost;
                            currentCoord = nextCoord;

                            var nextSegments = segments.concat([{ dir: dir, dist: segmentDistance }]);
                            var nextUsedMp = usedMp + segmentCost;

                            recordRoute(currentCoord, nextSegments, nextUsedMp);
                            explore(currentCoord, remainingMp - segmentCost, nextUsedMp, nextSegments);
                        }
                    }
                };

                explore(startCoord, selectedItem.mp || 0, 0, []);
                return routesByCoord;
            };

            $scope.isCoordInSelectedMap = function (coord) {
                if (!coord || !$scope.selectedMapChoice) return false;

                return coord.x >= $scope.selectedMapChoice.rangeMinX
                    && coord.x <= $scope.selectedMapChoice.rangeMaxX
                    && coord.y >= $scope.selectedMapChoice.rangeMinY
                    && coord.y <= $scope.selectedMapChoice.rangeMaxY;
            };

            $scope.getCurrentTurnState = function () {
                if (!$scope.masterData) return '';

                var tsTurnDetails = ($scope.masterData.turnSheet && $scope.masterData.turnSheet.tSTurnDetails) || null;
                if (tsTurnDetails && tsTurnDetails.length > 0) {
                    return tsTurnDetails[0].state || '';
                }

                if ($scope.masterData.turnId && $scope.masterData.turnId.length >= 4) {
                    return $scope.masterData.turnId.substr(3, 1);
                }

                return '';
            };

            $scope.getRouteCandidateClass = function (coordState) {
                var ownState = ($scope.getCurrentTurnState() || '').toString().trim().toUpperCase();
                var targetState = (coordState || '').toString().trim().toUpperCase();

                if (!targetState || targetState === '?') return 'routeCandidateNeutral';
                if (ownState && targetState === ownState) return 'routeCandidateOwn';

                return 'routeCandidateEnemy';
            };

            $scope.isColonialCoordinate = function (coord) {
                if (!coord || coord.y == null) return false;
                return parseInt(coord.y) >= 70;
            };

            $scope.isShipItem = function (item) {
                if (!item) return false;

                var itemTypeName = item.itemTypeName || $scope.getItemTypeName(item.itemType);
                return itemTypeName === 'Warship' || itemTypeName === 'MerchantShip';
            };

            $scope.isShipyardCoordinate = function (coord) {
                if (!coord || !coord.productionSite) return false;

                var site = coord.productionSite.toString().toUpperCase();
                return site === '&' || site === '$';
            };

            $scope.getTerrainMPForItem = function (coord, item) {
                var terrain = coord.terrain;
                var isSea = '*+.'.indexOf(terrain) > -1;
                var isShip = $scope.isShipItem(item);
                var moveCost = 0;

                if (isShip) {
                    if (isSea || $scope.isShipyardCoordinate(coord)) {
                        moveCost = 1;
                    } else {
                        return 999;
                    }
                } else {
                    if (isSea) return 999;
                    moveCost = $scope.getTerrainMP(terrain);
                }

                if ($scope.isColonialCoordinate(coord) && moveCost > 0 && moveCost < 999) {
                    moveCost = moveCost * 2;
                }

                return moveCost;
            };

            $scope.getItemFromItemNo = function (itemNo) {
                var rtnItem = {};
                var parsedItemNo = parseInt(itemNo, 10);

                angular.forEach($scope.masterData.turnReport.movementItemList, function (item) {
                    if (item.originalItemNo == parsedItemNo) {
                        rtnItem = item;
                    }
                });

                if (!rtnItem || rtnItem.itemNo == null) {
                    angular.forEach($scope.masterData.turnReport.movementItemList, function (item) {
                        var memberMatch = item.memberItemNos && item.memberItemNos.indexOf(parsedItemNo) > -1;
                        if (item.itemNo == parsedItemNo || memberMatch) {
                            rtnItem = item;
                        }
                    });
                }

                if (!rtnItem || rtnItem.itemNo == null) {
                    rtnItem = $scope.getFederationMovementSummary(itemNo);
                }

                return rtnItem;
            };

            $scope.getFederationMovementSummary = function (federationNo) {
                if (!$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
                    return {};
                }

                var parsedFederationNo = parseInt(federationNo, 10);
                if (isNaN(parsedFederationNo)) return {};

                var federationItems = $scope.masterData.turnReport.movementItemList.filter(function (item) {
                    return item.federationNo == parsedFederationNo;
                });

                if (!federationItems.length) return {};

                var slowestItem = federationItems[0];
                angular.forEach(federationItems, function (item) {
                    var itemMp = item.originalMP != null ? item.originalMP : item.mp;
                    var slowestMp = slowestItem.originalMP != null ? slowestItem.originalMP : slowestItem.mp;
                    if (itemMp < slowestMp) {
                        slowestItem = item;
                    }
                });

                return {
                    itemNo: parsedFederationNo,
                    itemTypeName: 'Federation',
                    itemType: slowestItem.itemType,
                    shipTypeNo: slowestItem.shipTypeNo,
                    mp: slowestItem.originalMP != null ? slowestItem.originalMP : slowestItem.mp,
                    x: slowestItem.x,
                    y: slowestItem.y,
                    federationNo: parsedFederationNo,
                    isFederation: true
                };
            };

            $scope.calculateMovementRowUsedMp = function (movementRow, selectedItem) {
                if (!movementRow || !selectedItem || !$scope.mapCoordinates || !$scope.terrainList) {
                    return movementRow ? movementRow.mpUsed : null;
                }

                var currentCoord = $scope.getCoordinateByXY(selectedItem.x, selectedItem.y);
                if (!currentCoord) {
                    return movementRow.mpUsed;
                }

                var usedMp = 0;
                for (var segmentNo = 1; segmentNo <= 3; segmentNo++) {
                    var direction = parseInt(movementRow['direction' + segmentNo], 10);
                    var distance = parseInt(movementRow['distance' + segmentNo], 10);

                    if (!direction || !distance || isNaN(direction) || isNaN(distance)) {
                        continue;
                    }

                    for (var step = 0; step < distance; step++) {
                        currentCoord = $scope.getNextCoordinate(direction, currentCoord);
                        if (!currentCoord) {
                            return usedMp;
                        }

                        usedMp += $scope.getTerrainMPForItem(currentCoord, selectedItem);
                    }
                }

                return usedMp;
            };

            $scope.refreshMovementGridTypeValues = function () {
                if (!$scope.tsMovementList || !$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) return;

                angular.forEach($scope.tsMovementList, function (movementRow) {
                    if (movementRow.itemNo != null) {
                        var selectedItem = $scope.getItemFromItemNo(movementRow.itemNo);
                        if (selectedItem && selectedItem.itemNo != null) {
                            movementRow.type = $scope.getItemTypeAbbrev(selectedItem);
                            movementRow.mp = selectedItem.originalMP != null ? selectedItem.originalMP : selectedItem.mp;
                            movementRow.xy = selectedItem.x + '/' + selectedItem.y;
                            movementRow.mpUsed = $scope.calculateMovementRowUsedMp(movementRow, selectedItem);
                        }
                    }
                });
            };

            $scope.filterMovementItemBySelectedMap = function (item) {
                if (!item || !$scope.selectedMapChoice) return false;

                return item.x >= $scope.selectedMapChoice.rangeMinX
                    && item.x <= $scope.selectedMapChoice.rangeMaxX
                    && item.y >= $scope.selectedMapChoice.rangeMinY
                    && item.y <= $scope.selectedMapChoice.rangeMaxY;
            };

            $scope.refreshFilteredMovementItemsForMap = function () {
                if (!$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
                    $scope.filteredMovementItemsForMap = [];
                    $scope.itemGridRows = [];
                    $scope.boardingItemRows = [];
                    return;
                }

                var shipCatalogByType = $scope.getShipCatalogByType();

                $scope.filteredMovementItemsForMap = $scope.masterData.turnReport.movementItemList
                    .filter(function (item) {
                        return $scope.filterMovementItemBySelectedMap(item);
                    })
                    .map(function (item) {
                        var itemNo = item.originalItemNo != null ? item.originalItemNo : item.itemNo;
                        var shipDef = shipCatalogByType[item.shipTypeNo];
                        var isShip = parseInt(item.itemType, 10) === 2 || parseInt(item.itemType, 10) === 3;
                        var baseCapacity = parseInt(shipDef && shipDef.loadCapacity, 10) || 0;
                        var condition = isShip ? $scope.getShipConditionByItemNo(itemNo) : null;
                        var actualCapacity = null;

                        if (isShip) {
                            var condPct = parseFloat(condition);
                            if (isNaN(condPct)) condPct = 100;
                            actualCapacity = Math.floor(baseCapacity * (condPct / 100));
                        }

                        return {
                            itemNo: itemNo,
                            originalItemNo: itemNo,
                            fed: $scope.getSelectionFedValue(item, itemNo, item.itemType),
                            itemType: item.itemType,
                            shipTypeNo: item.shipTypeNo,
                            itemTypeName: $scope.getItemTypeAbbrev(item),
                            description: item.description,
                            mp: item.originalMP != null ? item.originalMP : item.mp,
                            capacity: actualCapacity,
                            cond: condition,
                            x: item.x,
                            y: item.y,
                            xy: item.x + '/' + item.y,
                            isSelected: !!$scope.boardingSelectedLookup[itemNo],
                            load: !!$scope.boardingLoadLookup[itemNo]
                        };
                    })
                    .sort(function (a, b) {
                        var fedA = a.fed != null ? a.fed : 999999;
                        var fedB = b.fed != null ? b.fed : 999999;

                        if (fedA !== fedB) return fedA - fedB;
                        return a.itemNo - b.itemNo;
                    });

                $scope.refreshItemGridRows();
                $scope.recalculateBoardingSummary();
            };

            $scope.hasMovementItemNo = function (movementRow) {
                if (!movementRow || movementRow.itemNo == null) return false;
                return movementRow.itemNo.toString().trim() !== '';
            };

            $scope.removeMovementRow = function (row) {
                if (!row || !row.entity) return;

                var movementRow = row.entity;
                movementRow.itemNo = null;
                movementRow.type = null;
                movementRow.mp = null;
                movementRow.mpUsed = null;
                movementRow.xy = null;
                movementRow.direction1 = null;
                movementRow.distance1 = null;
                movementRow.direction2 = null;
                movementRow.distance2 = null;
                movementRow.direction3 = null;
                movementRow.distance3 = null;

                if ($scope.selectedMovementRow === movementRow) {
                    $scope.selectedMovementRow = null;
                    $scope.selectedMovementItemCoordinate = null;
                    $scope.pendingRouteSelection = null;
                    $scope.clearDisplayField();
                    $scope.clearRouteCandidates();
                }

                $scope.queueAutoSaveTsGrid('Movement');
            };
        }
    };
});
