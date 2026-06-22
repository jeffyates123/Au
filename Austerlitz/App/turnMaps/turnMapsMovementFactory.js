'use strict';

austerlitzModule.factory('turnMapsMovementFactory', function (turnAssignmentResolverFactory) {
    return {
        attach: function ($scope) {
            $scope.movementClickRow = function (row) {
                $scope.clearDisplayField();
                $scope.clearRouteCandidates();
                $scope.pendingRouteSelection = null;
                $scope.selectedMovementItemCoordinate = null;

                if (row.entity.itemNo != null) {
                    var selectedItem = $scope.getItemFromItemNo(row.entity.itemNo, row.entity.type === 'Fed');
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
                        if (typeof $scope.syncMovementOrderIndexToRow === 'function') {
                            $scope.syncMovementOrderIndexToRow(row.entity);
                        }
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

            $scope.getItemFromItemNo = function (itemNo, preferFederation) {
                var rtnItem = {};
                var parsedItemNo = parseInt(itemNo, 10);

                if (preferFederation) {
                    rtnItem = $scope.getFederationMovementSummary(parsedItemNo);
                    if (rtnItem && rtnItem.itemNo != null) {
                        return rtnItem;
                    }
                }

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
                    return $scope.getEffectiveMovementFederationNoForItem(item) == parsedFederationNo;
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
                        var selectedItem = $scope.getItemFromItemNo(movementRow.itemNo, movementRow.type === 'Fed');
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

            $scope.getMovementPickerUnitKind = function (itemTypeName) {
                switch ((itemTypeName || '').toString()) {
                    case 'Brigade': return 'brigade';
                    case 'Commander': return 'commander';
                    case 'Warship': return 'warship';
                    case 'MerchantShip': return 'merchant';
                    default: return 'other';
                }
            };

            $scope.toMovementPickerItemId = function (value) {
                var parsed = parseInt(value, 10);
                return isNaN(parsed) ? null : parsed;
            };

            $scope.formatMovementPickerPosition = function (x, y) {
                var px = parseInt(x, 10);
                var py = parseInt(y, 10);
                if (isNaN(px) || isNaN(py) || px <= 0 || py <= 0) return '-';
                return px + '/' + py;
            };

            $scope.buildMovementPickerBattalionSummary = function (brigade) {
                if (!brigade) return '-';

                var parts = [];
                for (var i = 1; i <= 7; i++) {
                    var type = (brigade['batt' + i + 'Type'] || '').toString().trim();
                    if (!type || type === '--') continue;

                    var ef = brigade['batt' + i + 'EF'];
                    var size = brigade['batt' + i + 'Size'];
                    var section = type;
                    if (ef != null && ef !== '') section += ' ' + ef;
                    if (size != null && size !== '') section += ' ' + size;
                    parts.push(section);
                }

                return parts.length ? parts.join(' | ') : '-';
            };

            $scope.getMovementPickerMainDescription = function (itemRow) {
                if (!itemRow) return '-';
                var detail = itemRow.movementDetail || {};

                if (detail.unitKind === 'brigade') {
                    var name = (detail.name || '').toString().trim();
                    var battalions = (detail.battalions || '').toString().trim();
                    if (name && battalions && battalions !== '-') return name + ' | ' + battalions;
                    if (name) return name;
                    if (battalions && battalions !== '-') return battalions;
                }

                return itemRow.description || '-';
            };

            $scope.getMovementPickerTypeSortRank = function (itemTypeName) {
                var normalized = (itemTypeName || '').toString().trim();
                switch (normalized) {
                    case 'Commander': return 1;
                    case 'Brigade': return 2;
                    case 'Warship': return 3;
                    case 'MerchantShip': return 4;
                    case 'BaggageTrain':
                    case 'Bagagge':
                        return 5;
                    case 'Spy': return 6;
                    default: return 99;
                }
            };

            $scope.buildMovementPickerDetailLookups = function () {
                var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
                var lookups = {
                    brigadesById: {},
                    commandersById: {},
                    warshipsById: {},
                    merchantsById: {}
                };

                angular.forEach(turnReport.brigades || [], function (brigade) {
                    var id = $scope.toMovementPickerItemId(brigade && brigade.itemNo);
                    if (id == null) return;
                    lookups.brigadesById[id] = brigade;
                });

                angular.forEach(turnReport.commanders || [], function (commander) {
                    var id = $scope.toMovementPickerItemId(commander && commander.itemNo);
                    if (id == null) return;
                    lookups.commandersById[id] = commander;
                });

                angular.forEach(turnReport.warships || [], function (warship) {
                    var id = $scope.toMovementPickerItemId(warship && warship.itemNo);
                    if (id == null) return;
                    lookups.warshipsById[id] = warship;
                });

                angular.forEach(turnReport.merchantShips || [], function (merchant) {
                    var id = $scope.toMovementPickerItemId(merchant && merchant.itemNo);
                    if (id == null) return;
                    lookups.merchantsById[id] = merchant;
                });

                return lookups;
            };

            $scope.buildMovementPickerEffectiveFederationLookup = function () {
                var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
                var movementItems = turnReport.movementItemList || [];
                var shipsByItemNo = {};
                angular.forEach((turnReport.warships || []).concat(turnReport.merchantShips || []), function (ship) {
                    var shipId = $scope.toMovementPickerItemId(ship && ship.itemNo);
                    if (shipId == null) return;
                    shipsByItemNo[shipId] = ship;
                });

                return turnAssignmentResolverFactory.buildEffectiveMovementFederationLookup(
                    movementItems,
                    $scope.movementFormFederationRows || [],
                    function (item) {
                        return $scope.getMovementPickerUnitKind($scope.getItemTypeName(item && item.itemType));
                    },
                    shipsByItemNo,
                );
            };

            $scope.getEffectiveMovementFederationNoForItem = function (item) {
                var itemNo = $scope.toMovementPickerItemId(item && (item.originalItemNo != null ? item.originalItemNo : item.itemNo));
                if (itemNo != null
                    && $scope.movementEffectiveFederationByItemNo
                    && Object.prototype.hasOwnProperty.call($scope.movementEffectiveFederationByItemNo, itemNo)) {
                    return $scope.movementEffectiveFederationByItemNo[itemNo];
                }
                return item && item.federationNo != null ? item.federationNo : null;
            };

            $scope.buildMovementPickerBoardingLookups = function (effectiveFedLookupByItemNo, detailLookups) {
                var unitBoardingByItemNo = {};
                var loadedFleetLookup = {};

                angular.forEach($scope.movementBoardingRows || [], function (row) {
                    var boardedUnitNo = $scope.toMovementPickerItemId(row && row.itemNo);
                    var boardedFleetNo = $scope.toMovementPickerItemId(row && row.fleetNo);
                    if (boardedUnitNo != null) {
                        unitBoardingByItemNo[boardedUnitNo] = true;
                    }
                    if (boardedFleetNo != null && boardedFleetNo > 0) {
                        loadedFleetLookup[boardedFleetNo] = true;
                    }
                });

                angular.forEach(detailLookups.warshipsById || {}, function (warship, warshipId) {
                    var brigade1 = parseInt(warship && warship.brigade1, 10) || 0;
                    var brigade2 = parseInt(warship && warship.brigade2, 10) || 0;
                    if (brigade1 + brigade2 <= 0) return;

                    var parsedWarshipId = $scope.toMovementPickerItemId(warshipId);
                    if (parsedWarshipId != null) {
                        loadedFleetLookup[parsedWarshipId] = true;
                        if (Object.prototype.hasOwnProperty.call(effectiveFedLookupByItemNo, parsedWarshipId)) {
                            var fleetNo = $scope.toMovementPickerItemId(effectiveFedLookupByItemNo[parsedWarshipId]);
                            if (fleetNo != null && fleetNo > 0) {
                                loadedFleetLookup[fleetNo] = true;
                            }
                        }
                    }
                });

                return {
                    unitBoardingByItemNo: unitBoardingByItemNo,
                    loadedFleetLookup: loadedFleetLookup
                };
            };

            $scope.hasMovementPickerBoardingStatus = function (itemRow, detail, boardingLookups, effectiveFedLookupByItemNo) {
                var unitKind = (detail && detail.unitKind) || $scope.getMovementPickerUnitKind(itemRow && itemRow.itemTypeName);
                var itemId = $scope.toMovementPickerItemId(itemRow && itemRow.itemNo);
                if (itemId == null) return false;

                if (unitKind === 'brigade' || unitKind === 'commander') {
                    if (boardingLookups.unitBoardingByItemNo[itemId]) return true;
                    var boarded = detail && detail.boarded != null ? detail.boarded : null;
                    var boardedNo = parseInt(boarded, 10);
                    return !isNaN(boardedNo) && boardedNo > 0;
                }

                if (unitKind === 'warship' || unitKind === 'merchant') {
                    if (detail && detail.hasBrigadeLoad) return true;
                    if (boardingLookups.loadedFleetLookup[itemId]) return true;

                    var effectiveFleetNo = Object.prototype.hasOwnProperty.call(effectiveFedLookupByItemNo, itemId)
                        ? $scope.toMovementPickerItemId(effectiveFedLookupByItemNo[itemId])
                        : null;
                    return effectiveFleetNo != null && boardingLookups.loadedFleetLookup[effectiveFleetNo];
                }

                return false;
            };

            $scope.resolveMovementPickerDetail = function (itemRow, detailLookups, effectiveFedLookupByItemNo) {
                var unitKind = $scope.getMovementPickerUnitKind(itemRow && itemRow.itemTypeName);
                var itemId = $scope.toMovementPickerItemId(itemRow && itemRow.itemNo);
                var effectiveFed = itemId != null
                    && effectiveFedLookupByItemNo
                    && Object.prototype.hasOwnProperty.call(effectiveFedLookupByItemNo, itemId)
                    ? effectiveFedLookupByItemNo[itemId]
                    : (itemRow && itemRow.fed != null ? itemRow.fed : null);

                if (!itemRow || itemId == null) {
                    return {
                        unitKind: unitKind,
                        description: '-'
                    };
                }

                if (unitKind === 'brigade') {
                    var brigade = detailLookups.brigadesById[itemId];
                    if (brigade) {
                        return {
                            unitKind: unitKind,
                            id: brigade.itemNo,
                            name: brigade.name || '-',
                            position: $scope.formatMovementPickerPosition(brigade.x_OrState, brigade.y_OrFleet),
                            fed: effectiveFed != null ? effectiveFed : (brigade.federation != null ? brigade.federation : '-'),
                            mp: brigade.mp != null ? brigade.mp : itemRow.mp,
                            battalions: $scope.buildMovementPickerBattalionSummary(brigade),
                            boarded: brigade.boarded != null && brigade.boarded !== '' ? brigade.boarded : '-'
                        };
                    }
                } else if (unitKind === 'commander') {
                    var commander = detailLookups.commandersById[itemId];
                    if (commander) {
                        return {
                            unitKind: unitKind,
                            id: commander.itemNo,
                            name: commander.name || '-',
                            rank: commander.rank || '-',
                            position: $scope.formatMovementPickerPosition(commander.x, commander.y),
                            fed: effectiveFed != null ? effectiveFed : (commander.federation != null ? commander.federation : '-'),
                            mp: commander.mp != null ? commander.mp : itemRow.mp,
                            commandCapacity: commander.commandCapacity != null ? commander.commandCapacity : '-',
                            boarded: commander.boarded != null && commander.boarded !== '' ? commander.boarded : '-'
                        };
                    }
                } else if (unitKind === 'warship') {
                    var warship = detailLookups.warshipsById[itemId];
                    if (warship) {
                        return {
                            unitKind: unitKind,
                            id: warship.itemNo,
                            shipType: warship.type || '-',
                            name: warship.name || '-',
                            position: $scope.formatMovementPickerPosition(warship.x, warship.y),
                            fleet: effectiveFed != null ? effectiveFed : (warship.fleetNo != null ? warship.fleetNo : '-'),
                            mp: warship.mp != null ? warship.mp : itemRow.mp,
                            condition: warship.condition != null ? warship.condition : '-',
                            age: warship.age != null ? warship.age : '-',
                            marines: warship.marines != null ? warship.marines : '-',
                            brigadeLoad: (warship.brigade1 || 0) + ' ' + (warship.brigade2 || 0),
                            hasBrigadeLoad: ((parseInt(warship.brigade1, 10) || 0) + (parseInt(warship.brigade2, 10) || 0)) > 0
                        };
                    }
                } else if (unitKind === 'merchant') {
                    var merchant = detailLookups.merchantsById[itemId];
                    if (merchant) {
                        return {
                            unitKind: unitKind,
                            id: merchant.itemNo,
                            shipType: merchant.type || '-',
                            position: $scope.formatMovementPickerPosition(merchant.x, merchant.y),
                            fleet: effectiveFed != null ? effectiveFed : (merchant.fleetNo != null ? merchant.fleetNo : '-'),
                            mp: merchant.mp != null ? merchant.mp : itemRow.mp,
                            condition: merchant.condition != null ? merchant.condition : '-',
                            age: merchant.age != null ? merchant.age : '-',
                            goods1: merchant.goods1 || '-',
                            qty1: merchant.quantity1 != null ? merchant.quantity1 : '-',
                            goods2: merchant.goods2 || '-',
                            qty2: merchant.quantity2 != null ? merchant.quantity2 : '-',
                            money: merchant.money != null ? merchant.money : '-'
                        };
                    }
                }

                return {
                    unitKind: unitKind,
                    id: itemRow.itemNo,
                    position: itemRow.xy || '-',
                    fed: itemRow.fed != null ? itemRow.fed : '-',
                    mp: itemRow.mp != null ? itemRow.mp : '-',
                    description: itemRow.description || '-'
                };
            };

            $scope.refreshFilteredMovementItemsForMap = function () {
                if (!$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
                    $scope.filteredMovementItemsForMap = [];
                    $scope.itemGridRows = [];
                    return;
                }

                var detailLookups = $scope.buildMovementPickerDetailLookups();
                var effectiveFedLookupByItemNo = $scope.buildMovementPickerEffectiveFederationLookup();
                $scope.movementEffectiveFederationByItemNo = effectiveFedLookupByItemNo;
                var boardingLookups = $scope.buildMovementPickerBoardingLookups(
                    effectiveFedLookupByItemNo,
                    detailLookups,
                );

                $scope.filteredMovementItemsForMap = $scope.masterData.turnReport.movementItemList
                    .filter(function (item) {
                        return $scope.filterMovementItemBySelectedMap(item);
                    })
                    .map(function (item) {
                        var itemNo = item.originalItemNo != null ? item.originalItemNo : item.itemNo;
                        var itemTypeName = $scope.getItemTypeName(item.itemType);
                        if (itemTypeName === 'BaggageTrain') itemTypeName = 'Bagagge';

                        var row = {
                            itemNo: itemNo,
                            originalItemNo: itemNo,
                            fed: Object.prototype.hasOwnProperty.call(effectiveFedLookupByItemNo, itemNo)
                                ? effectiveFedLookupByItemNo[itemNo]
                                : item.federationNo,
                            itemType: item.itemType,
                            shipTypeNo: item.shipTypeNo,
                            itemTypeName: itemTypeName,
                            description: item.description,
                            mp: item.originalMP != null ? item.originalMP : item.mp,
                            x: item.x,
                            y: item.y,
                            xy: item.x + '/' + item.y
                        };

                        row.movementDetail = $scope.resolveMovementPickerDetail(row, detailLookups, effectiveFedLookupByItemNo);
                        row.mainDescription = $scope.getMovementPickerMainDescription(row);
                        row.hasBoarding = $scope.hasMovementPickerBoardingStatus(
                            row,
                            row.movementDetail,
                            boardingLookups,
                            effectiveFedLookupByItemNo,
                        );
                        return row;
                    })
                    .sort(function (a, b) {
                        var ax = parseInt(a.x, 10);
                        var ay = parseInt(a.y, 10);
                        var bx = parseInt(b.x, 10);
                        var by = parseInt(b.y, 10);

                        if (isNaN(ax)) ax = 999999;
                        if (isNaN(ay)) ay = 999999;
                        if (isNaN(bx)) bx = 999999;
                        if (isNaN(by)) by = 999999;

                        if (ax !== bx) return ax - bx;
                        if (ay !== by) return ay - by;

                        var typeRankA = $scope.getMovementPickerTypeSortRank(a.itemTypeName);
                        var typeRankB = $scope.getMovementPickerTypeSortRank(b.itemTypeName);
                        if (typeRankA !== typeRankB) return typeRankA - typeRankB;

                        return a.itemNo - b.itemNo;
                    });

                $scope.refreshItemGridRows();
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
