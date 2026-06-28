'use strict';

austerlitzModule.factory('turnMapsMovementRouteFactory', function () {
    function applyRouteToMovementRow(movementRow, segments) {
        if (!movementRow) return;

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
    }

    function clearRouteCandidates(mapCoordinates) {
        if (!mapCoordinates) return;

        angular.forEach(mapCoordinates, function (mapRow) {
            angular.forEach(mapRow, function (coordinate) {
                coordinate.routeCandidate = false;
            });
        });
    }

    function markRouteCandidates(mapCoordinates, routesByCoord) {
        clearRouteCandidates(mapCoordinates);

        angular.forEach(routesByCoord || {}, function (route) {
            if (mapCoordinates[route.y] && mapCoordinates[route.y][route.x]) {
                mapCoordinates[route.y][route.x].routeCandidate = true;
            }
        });
    }

    function isCoordInSelectedMap(coord, selectedMapChoice) {
        if (!coord || !selectedMapChoice) return false;

        return coord.x >= selectedMapChoice.rangeMinX
            && coord.x <= selectedMapChoice.rangeMaxX
            && coord.y >= selectedMapChoice.rangeMinY
            && coord.y <= selectedMapChoice.rangeMaxY;
    }

    function calculateReachableRoutes(startCoord, selectedItem, options) {
        var opts = options || {};
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
                    if (typeof opts.getNextCoordinate !== 'function') return;
                    var nextCoord = opts.getNextCoordinate(dir, currentCoord);
                    if (!nextCoord || !isCoordInSelectedMap(nextCoord, opts.selectedMapChoice)) break;

                    if (typeof opts.getTerrainMPForItem !== 'function') return;
                    var moveCost = opts.getTerrainMPForItem(nextCoord, selectedItem);
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

        explore(startCoord, (selectedItem && selectedItem.mp) || 0, 0, []);
        return routesByCoord;
    }

    function getCurrentTurnState(masterData) {
        if (!masterData) return '';

        var tsTurnDetails = (masterData.turnSheet && masterData.turnSheet.tSTurnDetails) || null;
        if (tsTurnDetails && tsTurnDetails.length > 0) {
            return tsTurnDetails[0].state || '';
        }

        if (masterData.turnId && masterData.turnId.length >= 4) {
            return masterData.turnId.substr(3, 1);
        }

        return '';
    }

    function getRouteCandidateClass(coordState, currentTurnState) {
        var ownState = (currentTurnState || '').toString().trim().toUpperCase();
        var targetState = (coordState || '').toString().trim().toUpperCase();

        if (!targetState || targetState === '?') return 'routeCandidateNeutral';
        if (ownState && targetState === ownState) return 'routeCandidateOwn';

        return 'routeCandidateEnemy';
    }

    function calculateMovementRowUsedMp(movementRow, selectedItem, options) {
        var opts = options || {};
        if (!movementRow || !selectedItem || !opts.mapCoordinates || !opts.terrainList) {
            return movementRow ? movementRow.mpUsed : null;
        }
        if (typeof opts.getCoordinateByXY !== 'function' || typeof opts.getNextCoordinate !== 'function' || typeof opts.getTerrainMPForItem !== 'function') {
            return movementRow ? movementRow.mpUsed : null;
        }

        var currentCoord = opts.getCoordinateByXY(selectedItem.x, selectedItem.y);
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
                currentCoord = opts.getNextCoordinate(direction, currentCoord);
                if (!currentCoord) {
                    return usedMp;
                }

                usedMp += opts.getTerrainMPForItem(currentCoord, selectedItem);
            }
        }

        return usedMp;
    }

    return {
        applyRouteToMovementRow: applyRouteToMovementRow,
        clearRouteCandidates: clearRouteCandidates,
        markRouteCandidates: markRouteCandidates,
        isCoordInSelectedMap: isCoordInSelectedMap,
        calculateReachableRoutes: calculateReachableRoutes,
        getCurrentTurnState: getCurrentTurnState,
        getRouteCandidateClass: getRouteCandidateClass,
        calculateMovementRowUsedMp: calculateMovementRowUsedMp
    };
});
