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
        var maxMp = (selectedItem && selectedItem.mp) || 0;
        var bestStateByKey = {};
        var queue = [];

        if (!startCoord || maxMp <= 0) return routesByCoord;
        if (typeof opts.getNextCoordinate !== 'function') return routesByCoord;
        if (typeof opts.getTerrainMPForItem !== 'function') return routesByCoord;

        function makeStateKey(x, y, lastDir, segmentCount) {
            return x + '_' + y + '_' + lastDir + '_' + segmentCount;
        }

        function queueCompare(a, b) {
            if (a.usedMp !== b.usedMp) return a.usedMp - b.usedMp;
            if (a.segmentCount !== b.segmentCount) return a.segmentCount - b.segmentCount;
            return a.segments.length - b.segments.length;
        }

        function queuePush(state) {
            queue.push(state);

            var idx = queue.length - 1;
            while (idx > 0) {
                var parentIdx = Math.floor((idx - 1) / 2);
                if (queueCompare(queue[parentIdx], queue[idx]) <= 0) break;

                var tmp = queue[parentIdx];
                queue[parentIdx] = queue[idx];
                queue[idx] = tmp;
                idx = parentIdx;
            }
        }

        function queuePop() {
            if (queue.length === 0) return null;
            if (queue.length === 1) return queue.pop();

            var first = queue[0];
            queue[0] = queue.pop();

            var idx = 0;
            while (true) {
                var left = idx * 2 + 1;
                var right = idx * 2 + 2;
                var smallest = idx;

                if (left < queue.length && queueCompare(queue[left], queue[smallest]) < 0) {
                    smallest = left;
                }
                if (right < queue.length && queueCompare(queue[right], queue[smallest]) < 0) {
                    smallest = right;
                }
                if (smallest === idx) break;

                var tmp = queue[idx];
                queue[idx] = queue[smallest];
                queue[smallest] = tmp;
                idx = smallest;
            }

            return first;
        }

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

        function tryQueueState(coord, usedMp, lastDir, segmentCount, segments) {
            if (!coord || usedMp > maxMp || segmentCount > 3) return;

            var stateKey = makeStateKey(coord.x, coord.y, lastDir, segmentCount);
            if (Object.prototype.hasOwnProperty.call(bestStateByKey, stateKey) && bestStateByKey[stateKey] <= usedMp) {
                return;
            }

            bestStateByKey[stateKey] = usedMp;
            queuePush({
                coord: coord,
                usedMp: usedMp,
                lastDir: lastDir,
                segmentCount: segmentCount,
                segments: segments
            });
        }

        tryQueueState(startCoord, 0, 0, 0, []);

        while (queue.length > 0) {
            var state = queuePop();
            if (!state || !state.coord) continue;

            var stateKey = makeStateKey(state.coord.x, state.coord.y, state.lastDir, state.segmentCount);
            if (!Object.prototype.hasOwnProperty.call(bestStateByKey, stateKey) || bestStateByKey[stateKey] !== state.usedMp) {
                continue;
            }

            for (var dir = 1; dir <= 8; dir++) {
                var nextCoord = opts.getNextCoordinate(dir, state.coord);
                if (!nextCoord || !isCoordInSelectedMap(nextCoord, opts.selectedMapChoice)) continue;

                var moveCost = opts.getTerrainMPForItem(nextCoord, selectedItem);
                if (moveCost <= 0) continue;

                var nextUsedMp = state.usedMp + moveCost;
                if (nextUsedMp > maxMp) continue;

                var nextSegmentCount = state.segmentCount;
                var nextSegments = state.segments;

                if (state.segmentCount === 0) {
                    nextSegmentCount = 1;
                    nextSegments = [{ dir: dir, dist: 1 }];
                } else if (dir === state.lastDir) {
                    var lastSegmentIndex = state.segments.length - 1;
                    nextSegments = state.segments.slice(0, lastSegmentIndex);
                    nextSegments.push({
                        dir: state.segments[lastSegmentIndex].dir,
                        dist: state.segments[lastSegmentIndex].dist + 1
                    });
                } else {
                    nextSegmentCount = state.segmentCount + 1;
                    if (nextSegmentCount > 3) continue;
                    nextSegments = state.segments.concat([{ dir: dir, dist: 1 }]);
                }

                recordRoute(nextCoord, nextSegments, nextUsedMp);
                tryQueueState(nextCoord, nextUsedMp, dir, nextSegmentCount, nextSegments);
            }
        }

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
