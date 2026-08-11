'use strict';

austerlitzModule.factory('turnMapsSpyLookupFactory', function ($q, turnReportFactory, turnHistoryFactory, turnMapsConfigFactory) {
    return {
        attach: function ($scope) {
    $scope.toMapCoordinateInt = function (value) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    };

    $scope.toMapCoordinateKey = function (x, y) {
        var parsedX = $scope.toMapCoordinateInt(x);
        var parsedY = $scope.toMapCoordinateInt(y);
        if (parsedX == null || parsedY == null || parsedX <= 0 || parsedY <= 0) {
            return null;
        }

        return parsedX + '_' + parsedY;
    };

    $scope.getPreviousTurnId = function () {
        var currentTurnId = ($scope.masterData && $scope.masterData.turnId ? $scope.masterData.turnId : '').toString().trim();
        if (!currentTurnId) {
            return null;
        }

        var comparisonTurnId = $scope.getComparisonTurnIdForSelectedState
            ? $scope.getComparisonTurnIdForSelectedState(currentTurnId)
            : currentTurnId;

        var strictPreviousMonthTurnId = turnHistoryFactory.getPreviousMonthTurnIdFromTurnId
            ? turnHistoryFactory.getPreviousMonthTurnIdFromTurnId(comparisonTurnId)
            : null;

        if (!strictPreviousMonthTurnId) {
            return null;
        }

        var turnsList = $scope.masterData && $scope.masterData.turnsList ? $scope.masterData.turnsList : null;
        if (!turnsList || !turnsList.length) {
            return strictPreviousMonthTurnId;
        }

        if (turnHistoryFactory.containsTurnId && turnHistoryFactory.containsTurnId(turnsList, strictPreviousMonthTurnId)) {
            return strictPreviousMonthTurnId;
        }

        return null;
    };

    $scope.getComparisonStateCode = function () {
        var fromSelection = $scope.getStateCodeFromSelection ? $scope.getStateCodeFromSelection($scope.selectedState) : '';
        if (fromSelection) return fromSelection;

        var fromMasterData = ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : '').toString().trim().toUpperCase();
        if (fromMasterData) return fromMasterData;

        var currentTurnId = ($scope.masterData && $scope.masterData.turnId ? $scope.masterData.turnId : '').toString().trim();
        return currentTurnId.length >= 4 ? currentTurnId.substr(3, 1).toUpperCase() : '';
    };

    $scope.getComparisonTurnIdForSelectedState = function (currentTurnId) {
        var normalizedTurnId = (currentTurnId || '').toString().trim();
        if (!normalizedTurnId || normalizedTurnId.length < 8) return normalizedTurnId;

        var comparisonStateCode = $scope.getComparisonStateCode();
        if (!comparisonStateCode) return normalizedTurnId;

        var candidateTurnId = normalizedTurnId.substr(0, 3) + comparisonStateCode + normalizedTurnId.substring(4);
        var turnsList = $scope.masterData && $scope.masterData.turnsList ? $scope.masterData.turnsList : null;

        if (turnsList && turnsList.length && turnHistoryFactory.containsTurnId && !turnHistoryFactory.containsTurnId(turnsList, candidateTurnId)) {
            return normalizedTurnId;
        }

        return candidateTurnId;
    };

    $scope.buildCoordinateLookup = function (mapCoordinates) {
        var lookup = {};

        angular.forEach(mapCoordinates || [], function (mapRow) {
            angular.forEach(mapRow || [], function (coord) {
                var key = $scope.toMapCoordinateKey(coord && coord.x, coord && coord.y);
                if (key) lookup[key] = coord;
            });
        });

        return lookup;
    };

    $scope.loadPreviousMapCoordinates = function () {
        $scope.previousMapCoordinatesByKey = {};

        var previousTurnId = $scope.getPreviousTurnId();
        if (!previousTurnId) return;

        turnReportFactory.getMapCoordinates(previousTurnId).then(function (previousMapCoordinates) {
            $scope.previousMapCoordinatesByKey = $scope.buildCoordinateLookup(previousMapCoordinates);
        }, function () {
            $scope.previousMapCoordinatesByKey = {};
        });
    };

    $scope.buildSpyTransportCoordinateLookup = function (turnReport) {
        var report = turnReport || {};
        var byShipItemNo = {};
        var byFleetNo = {};
        var shipRows = (report.warships || report.Warships || []).concat(report.merchantShips || report.MerchantShips || []);

        angular.forEach(shipRows, function (ship) {
            var x = $scope.toMapCoordinateInt(ship && (ship.x != null ? ship.x : ship.X));
            var y = $scope.toMapCoordinateInt(ship && (ship.y != null ? ship.y : ship.Y));
            if (x == null || y == null || x <= 0 || y <= 0) return;

            var coordinate = { x: x, y: y };
            var shipItemNo = $scope.toMapCoordinateInt(ship && (ship.itemNo != null ? ship.itemNo : ship.ItemNo));
            var fleetNo = $scope.toMapCoordinateInt(ship && (ship.fleetNo != null ? ship.fleetNo : ship.FleetNo));

            if (shipItemNo != null && shipItemNo > 0 && !Object.prototype.hasOwnProperty.call(byShipItemNo, shipItemNo)) {
                byShipItemNo[shipItemNo] = coordinate;
            }

            if (fleetNo != null && fleetNo > 0 && !Object.prototype.hasOwnProperty.call(byFleetNo, fleetNo)) {
                byFleetNo[fleetNo] = coordinate;
            }
        });

        return {
            byShipItemNo: byShipItemNo,
            byFleetNo: byFleetNo
        };
    };

    $scope.getTransportCoordinateByNo = function (transportNo, transportLookups) {
        var parsedTransportNo = $scope.toMapCoordinateInt(transportNo);
        if (parsedTransportNo == null || parsedTransportNo <= 0 || !transportLookups) return null;

        if (Object.prototype.hasOwnProperty.call(transportLookups.byShipItemNo || {}, parsedTransportNo)) {
            return transportLookups.byShipItemNo[parsedTransportNo];
        }

        if (Object.prototype.hasOwnProperty.call(transportLookups.byFleetNo || {}, parsedTransportNo)) {
            return transportLookups.byFleetNo[parsedTransportNo];
        }

        return null;
    };

    $scope.buildTs20SpyTransportLookup = function (boardingRows) {
        var bySpyItemNo = {};

        angular.forEach(boardingRows || [], function (row) {
            var spyItemNo = $scope.toMapCoordinateInt(row && row.itemNo);
            var transportNo = $scope.toMapCoordinateInt(row && row.fleetNo);
            if (spyItemNo == null || spyItemNo <= 0 || transportNo == null || transportNo <= 0) return;

            if (!Object.prototype.hasOwnProperty.call(bySpyItemNo, spyItemNo)) {
                bySpyItemNo[spyItemNo] = transportNo;
            }
        });

        return bySpyItemNo;
    };

    $scope.resolveSpyReportCoordinate = function (spy, ts20TransportBySpyItemNo, transportLookups) {
        var spyItemNo = $scope.toMapCoordinateInt(spy && (spy.itemNo != null ? spy.itemNo : spy.ItemNo));
        var ts20TransportNo = spyItemNo != null && ts20TransportBySpyItemNo
            && Object.prototype.hasOwnProperty.call(ts20TransportBySpyItemNo, spyItemNo)
            ? ts20TransportBySpyItemNo[spyItemNo]
            : null;

        var ts20TransportCoordinate = $scope.getTransportCoordinateByNo(ts20TransportNo, transportLookups);
        if (ts20TransportCoordinate) return ts20TransportCoordinate;

        var reportBoardedCoordinate = $scope.getTransportCoordinateByNo(spy && (spy.boarded != null ? spy.boarded : spy.Boarded), transportLookups);
        if (reportBoardedCoordinate) return reportBoardedCoordinate;

        var spyX = $scope.toMapCoordinateInt(spy && (spy.x != null ? spy.x : spy.X));
        var spyY = $scope.toMapCoordinateInt(spy && (spy.y != null ? spy.y : spy.Y));
        if (spyX == null || spyY == null || spyX <= 0 || spyY <= 0) return null;

        return {
            x: spyX,
            y: spyY
        };
    };

    $scope.appendSpyReportText = function (lookup, key, reportText) {
        if (!lookup || !key || !reportText) return;

        if (!Object.prototype.hasOwnProperty.call(lookup, key) || !lookup[key]) {
            lookup[key] = reportText;
            return;
        }

        var existing = lookup[key].toString();
        if (existing.indexOf(reportText) > -1) return;
        lookup[key] = existing + ' || ' + reportText;
    };

    $scope.markSpyCoordinatePresence = function (lookup, key) {
        if (!lookup || !key) return;
        lookup[key] = true;
    };

    $scope.markSpyCoordinateState = function (lookup, key, stateCode) {
        if (!lookup || !key || !stateCode) return;
        if (!Object.prototype.hasOwnProperty.call(lookup, key) || !lookup[key]) {
            lookup[key] = [];
        }

        if (lookup[key].indexOf(stateCode) === -1) {
            lookup[key].push(stateCode);
        }
    };

    $scope.getStateCodeFromTurnId = function (turnId) {
        var normalizedTurnId = (turnId || '').toString().trim();
        if (normalizedTurnId.length < 4) return '';
        var stateCode = normalizedTurnId.charAt(3).toUpperCase();
        return /^[A-Z]$/.test(stateCode) ? stateCode : '';
    };

    $scope.addSpyReportsFromTurnReport = function (turnReport, sourceTurnId, spyCoordinateReportByKey, spyCoordinatePresenceByKey, spyCoordinateStateByKey, ts20TransportBySpyItemNo) {
        var report = turnReport || {};
        var transportLookups = $scope.buildSpyTransportCoordinateLookup(report);
        var ts20Lookup = ts20TransportBySpyItemNo || null;
        var spies = report.spies || report.Spies || [];
        var sourceStateCode = $scope.getStateCodeFromTurnId(sourceTurnId);

        angular.forEach(spies, function (spy) {
            var coordinate = $scope.resolveSpyReportCoordinate(spy, ts20Lookup, transportLookups);
            if (!coordinate) return;

            var key = $scope.toMapCoordinateKey(coordinate.x, coordinate.y);
            if (!key) return;

            $scope.markSpyCoordinatePresence(spyCoordinatePresenceByKey, key);
            var spyState = (spy && (spy.state != null ? spy.state : spy.State)
                ? (spy.state != null ? spy.state : spy.State)
                : sourceStateCode).toString().trim().toUpperCase();
            $scope.markSpyCoordinateState(spyCoordinateStateByKey, key, spyState);

            var reportValue = spy ? (spy.report != null ? spy.report : spy.Report) : '';
            var reportText = (reportValue != null ? reportValue : '').toString().trim();
            if (!reportText) return;
            $scope.appendSpyReportText(spyCoordinateReportByKey, key, reportText);
        });
    };

    $scope.getAllStateTurnIdsForCurrentTurn = function () {
        var currentTurnId = ($scope.masterData && $scope.masterData.turnId ? $scope.masterData.turnId : '').toString().trim();
        if (!currentTurnId) return [];

        var baseTurnId = $scope.getComparisonTurnIdForSelectedState
            ? $scope.getComparisonTurnIdForSelectedState(currentTurnId)
            : currentTurnId;
        var baseParsed = turnHistoryFactory.parseTurnSummary
            ? turnHistoryFactory.parseTurnSummary({ turnId: baseTurnId })
            : null;

        if (!baseParsed) return [baseTurnId];

        var turnsList = ($scope.masterData && $scope.masterData.turnsList) || [];
        var collectedByUpper = {};
        var turnIds = [];

        angular.forEach(turnsList, function (turnRow) {
            var parsed = turnHistoryFactory.parseTurnSummary
                ? turnHistoryFactory.parseTurnSummary(turnRow)
                : null;
            if (!parsed) return;
            if (parsed.gameNo !== baseParsed.gameNo) return;
            if (parsed.turnSortKey !== baseParsed.turnSortKey) return;

            var parsedTurnId = (parsed.turnId || '').toString().trim();
            if (!parsedTurnId) return;

            var upperTurnId = parsedTurnId.toUpperCase();
            if (Object.prototype.hasOwnProperty.call(collectedByUpper, upperTurnId)) return;

            collectedByUpper[upperTurnId] = true;
            turnIds.push(parsedTurnId);
        });

        var baseTurnIdUpper = baseTurnId.toUpperCase();
        if (!Object.prototype.hasOwnProperty.call(collectedByUpper, baseTurnIdUpper)) {
            turnIds.push(baseTurnId);
        }

        return turnIds;
    };

    $scope.loadTurnReportsForTurnIds = function (turnIds, currentTurnId) {
        var reportPromises = (turnIds || []).map(function (turnId) {
            var normalizedTurnId = (turnId || '').toString().trim();
            if (!normalizedTurnId) return $q.when({ turnId: '', report: null });

            var cachedReport = $scope.spyTurnReportCacheByTurnId[normalizedTurnId];
            if (cachedReport) {
                return $q.when({ turnId: normalizedTurnId, report: cachedReport });
            }

            if (currentTurnId && normalizedTurnId.toUpperCase() === currentTurnId.toUpperCase()
                && $scope.masterData && $scope.masterData.turnReport) {
                $scope.spyTurnReportCacheByTurnId[normalizedTurnId] = $scope.masterData.turnReport;
                return $q.when({ turnId: normalizedTurnId, report: $scope.masterData.turnReport });
            }

            return turnReportFactory.getTRFullTurnDetails(normalizedTurnId).then(function (report) {
                $scope.spyTurnReportCacheByTurnId[normalizedTurnId] = report || {};
                return { turnId: normalizedTurnId, report: report || {} };
            }, function () {
                return { turnId: normalizedTurnId, report: {} };
            });
        });

        return $q.all(reportPromises);
    };

    $scope.rebuildSpyCoordinateReportLookup = function () {
        var requestId = ++$scope.spyLookupRequestId;
        var spyCoordinateReportByKey = {};
        var spyCoordinatePresenceByKey = {};
        var spyCoordinateStateByKey = {};
        var ts20TransportBySpyItemNo = $scope.buildTs20SpyTransportLookup($scope.movementBoardingRows || []);
        var currentTurnId = ($scope.masterData && $scope.masterData.turnId ? $scope.masterData.turnId : '').toString().trim();
        var currentStateTurnId = $scope.getComparisonTurnIdForSelectedState
            ? $scope.getComparisonTurnIdForSelectedState(currentTurnId)
            : currentTurnId;
        var turnIds = $scope.getAllStateTurnIdsForCurrentTurn();

        if (!turnIds.length) {
            $scope.spyCoordinateReportByKey = {};
            $scope.spyCoordinatePresenceByKey = {};
            $scope.spyCoordinateStateByKey = {};
            return;
        }

        $scope.loadTurnReportsForTurnIds(turnIds, currentTurnId).then(function (results) {
            if (requestId !== $scope.spyLookupRequestId) return;

            angular.forEach(results || [], function (resultRow) {
                if (!resultRow || !resultRow.report) return;
                var useTs20Lookup = resultRow.turnId
                    && currentStateTurnId
                    && resultRow.turnId.toUpperCase() === currentStateTurnId.toUpperCase()
                    ? ts20TransportBySpyItemNo
                    : null;
                $scope.addSpyReportsFromTurnReport(
                    resultRow.report,
                    resultRow.turnId,
                    spyCoordinateReportByKey,
                    spyCoordinatePresenceByKey,
                    spyCoordinateStateByKey,
                    useTs20Lookup
                );
            });

            $scope.spyCoordinateReportByKey = spyCoordinateReportByKey;
            $scope.spyCoordinatePresenceByKey = spyCoordinatePresenceByKey;
            $scope.spyCoordinateStateByKey = spyCoordinateStateByKey;
        }, function () {
            if (requestId !== $scope.spyLookupRequestId) return;
            $scope.spyCoordinateReportByKey = spyCoordinateReportByKey;
            $scope.spyCoordinatePresenceByKey = spyCoordinatePresenceByKey;
            $scope.spyCoordinateStateByKey = spyCoordinateStateByKey;
        });
    };

    $scope.rebuildArmyCoordinateLookup = function () {
        var requestId = ++$scope.unitLookupRequestId;
        var armyLookup = {};
        var navyLookup = {};
        var turnIds = $scope.getAllStateTurnIdsForCurrentTurn();
        var currentTurnId = ($scope.masterData && $scope.masterData.turnId ? $scope.masterData.turnId : '').toString().trim();

        if (!turnIds.length) {
            $scope.armyCoordinateByKey = {};
            $scope.navyCoordinateByKey = {};
            return;
        }

        $scope.loadTurnReportsForTurnIds(turnIds, currentTurnId).then(function (results) {
            if (requestId !== $scope.unitLookupRequestId) return;

            angular.forEach(results || [], function (resultRow) {
                var report = (resultRow && resultRow.report) || {};
                var armyRows = report.armyPositions || report.ArmyPositions || [];
                var shipRows = (report.warships || report.Warships || []).concat(report.merchantShips || report.MerchantShips || []);

                angular.forEach(armyRows, function (row) {
                    var x = $scope.toMapCoordinateInt(row && row.x);
                    var y = $scope.toMapCoordinateInt(row && row.y);
                    var key = $scope.toMapCoordinateKey(x, y);
                    if (!key) return;

                    var state = (row && (row.state || row.State) ? (row.state || row.State) : '').toString().trim().toUpperCase();
                    var bats = $scope.toMapCoordinateInt(row && (row.bat || row.Bat));

                    if (!Object.prototype.hasOwnProperty.call(armyLookup, key)) {
                        armyLookup[key] = [];
                    }

                    armyLookup[key].push({
                        state: state,
                        bats: bats == null ? 0 : bats
                    });
                });

                angular.forEach(shipRows, function (ship) {
                    var x = $scope.toMapCoordinateInt(ship && ship.x);
                    var y = $scope.toMapCoordinateInt(ship && ship.y);
                    var key = $scope.toMapCoordinateKey(x, y);
                    if (!key) return;

                    var state = (ship && (ship.state || ship.State) ? (ship.state || ship.State) : '').toString().trim().toUpperCase();
                    var fleetNo = $scope.toMapCoordinateInt(ship && (ship.fleetNo || ship.FleetNo));
                    var shipType = (ship && (ship.shipType || ship.ShipType || ship.itemTypeName || ship.ItemTypeName)
                        ? (ship.shipType || ship.ShipType || ship.itemTypeName || ship.ItemTypeName)
                        : '').toString().trim();

                    if (!Object.prototype.hasOwnProperty.call(navyLookup, key)) {
                        navyLookup[key] = [];
                    }

                    navyLookup[key].push({
                        state: state,
                        fleetNo: fleetNo,
                        shipType: shipType || 'Ship'
                    });
                });
            });

            $scope.armyCoordinateByKey = armyLookup;
            $scope.navyCoordinateByKey = navyLookup;
        }, function () {
            if (requestId !== $scope.unitLookupRequestId) return;
            $scope.armyCoordinateByKey = {};
            $scope.navyCoordinateByKey = {};
        });
    };

    $scope.rebuildEpidemicCoordinateLookup = function () {
        var report = ($scope.masterData && $scope.masterData.turnReport) || {};
        var rows = report.epidemics || report.Epidemics || [];
        var lookup = {};

        angular.forEach(rows, function (row) {
            var x = $scope.toMapCoordinateInt(row && row.x);
            var y = $scope.toMapCoordinateInt(row && row.y);
            var key = $scope.toMapCoordinateKey(x, y);
            if (!key) return;

            var state = (row && (row.state || row.State) ? (row.state || row.State) : '').toString().trim().toUpperCase();

            if (!Object.prototype.hasOwnProperty.call(lookup, key)) {
                lookup[key] = [];
            }

            lookup[key].push({
                state: state
            });
        });

        $scope.epidemicCoordinateByKey = lookup;
    };

    $scope.getCoordinateHoverTooltip = function (coord) {
        if (!coord) return '';

        var key = $scope.toMapCoordinateKey(coord.x, coord.y);
        var spyReport = key && $scope.spyCoordinateReportByKey
            && Object.prototype.hasOwnProperty.call($scope.spyCoordinateReportByKey, key)
            ? $scope.spyCoordinateReportByKey[key]
            : '';
        var jumpOffText = (coord.jumpOffText || '').toString().trim();
        var intelligenceText = '';

        if ($scope.isIntelligenceMode() && $scope.getIntelligenceTooltip) {
            intelligenceText = ($scope.getIntelligenceTooltip(coord) || '').toString().trim();
        }

        // Intelligence tooltip now includes spy-report details directly.
        if ($scope.isIntelligenceMode()) {
            if (jumpOffText && intelligenceText) return jumpOffText + ' | ' + intelligenceText;
            if (intelligenceText) return intelligenceText;
            if (jumpOffText) return jumpOffText;
            return '';
        }

        if (spyReport && jumpOffText && intelligenceText) return spyReport + ' | ' + jumpOffText + ' | ' + intelligenceText;
        if (spyReport && jumpOffText) return spyReport + ' | ' + jumpOffText;
        if (spyReport && intelligenceText) return spyReport + ' | ' + intelligenceText;
        if (jumpOffText && intelligenceText) return jumpOffText + ' | ' + intelligenceText;
        if (intelligenceText) return intelligenceText;
        if (spyReport) return spyReport;
        if (jumpOffText) return jumpOffText;
        return '';
    };

    $scope.wideScreenMinViewportWidth = turnMapsConfigFactory.getWideScreenMinViewportWidth
        ? turnMapsConfigFactory.getWideScreenMinViewportWidth()
        : ($scope.wideScreenMinViewportWidth || 1500);

        }
    };
});
