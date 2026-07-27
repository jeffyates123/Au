'use strict';

austerlitzModule.factory('turnMapsMapSelectionFactory', function (turnMapsConfigFactory) {
    return {
        attach: function ($scope) {
    $scope.changeDisplayOption = function () {
        $scope.selectedMapOptions = turnMapsConfigFactory.getSelectedOptions($scope.selectedDisplayOption);
        $scope.selectedItemGridCoordinate = null;
        $scope.refreshItemGridRows();
        $scope.refreshMovementPickerDisplayMode();

        if ($scope.isMovementXMode()) {
            $scope.closeMovementPickerModal();
        }

        if ($scope.isProductionSiteMode()) {
            $scope.pendingRouteSelection = null;
            $scope.selectedMovementRow = null;
            $scope.selectedMovementItemCoordinate = null;
            $scope.clearDisplayField();
            $scope.clearRouteCandidates();
        }

        if (!$scope.isProductionSiteMode()) {
            $scope.tryApplyInitialMovementOrderSelection();
        }
        $scope.focusCurrentOrder();

    };

    $scope.isProductionSiteMode = function () {
        return turnMapsConfigFactory.isMode($scope.selectedDisplayOption, 'ProductionSite');
    };

    $scope.isIntelligenceMode = function () {
        return turnMapsConfigFactory.isMode($scope.selectedDisplayOption, 'Intelligence');
    };

    $scope.isMovementXMode = function () {
        return turnMapsConfigFactory.isMode($scope.selectedDisplayOption, 'Movement X');
    };

    $scope.toggleSelection = function toggleSelection(mapOption) {
        var idx = $scope.selectedMapOptions.indexOf(mapOption);
        if (idx > -1) {
            $scope.selectedMapOptions.splice(idx, 1);
        } else {
            $scope.selectedMapOptions.push(mapOption);
        }
    };

    $scope.getStateCodeFromSelection = function (selectedState) {
        return (selectedState && (selectedState.state || selectedState.State) ? (selectedState.state || selectedState.State) : '')
            .toString()
            .trim()
            .toUpperCase();
    };

    $scope.getPreferredMapIdForStateCode = function (stateCode) {
        var normalizedStateCode = (stateCode || '').toString().trim().toUpperCase();
        var eastStateCodes = { S: true, P: true, A: true, W: true, R: true, T: true };

        return eastStateCodes[normalizedStateCode] ? 'EE' : 'EW';
    };

    $scope.findMapChoiceById = function (mapId) {
        if (!$scope.mapChoice || !$scope.mapChoice.length) return null;

        for (var i = 0; i < $scope.mapChoice.length; i++) {
            if ($scope.mapChoice[i].mapId === mapId) return $scope.mapChoice[i];
        }

        return null;
    };

    $scope.applyMapChoiceForSelectedState = function () {
        var preferredMapId = $scope.getPreferredMapIdForStateCode($scope.getStateCodeFromSelection($scope.selectedState));
        var preferredMapChoice = $scope.findMapChoiceById(preferredMapId);

        if (preferredMapChoice) {
            $scope.selectedMapChoice = preferredMapChoice;
        }
    };

    $scope.handleSelectedStateChange = function () {
        if ($scope.masterData) {
            $scope.masterData.selectedState = $scope.getStateCodeFromSelection($scope.selectedState);
        }

        $scope.applyMapChoiceForSelectedState();
        $scope.loadPreviousMapCoordinates();
        $scope.rebuildSpyCoordinateReportLookup();
    };

    function isSeaCoordinate(coord) {
        var terrain = coord && (coord.terrain || coord.Terrain);
        if (terrain == null) return false;

        terrain = terrain.toString().trim().toUpperCase();
        return terrain === '*' ||
            terrain === '+' ||
            terrain === '.' ||
            terrain === 'SEA' ||
            terrain === 'WATER';
    }

    function isCoastalBarracks(x, y) {
        var report = $scope.masterData && $scope.masterData.turnReport;
        var hasBarracks = (report && report.barracks || []).some(function (barracks) {
            return barracks.x == x && barracks.y == y;
        });
        if (!hasBarracks) return false;

        return [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]
            .some(function (position) {
                return isSeaCoordinate(
                    $scope.getCoordinateByXY(position[0], position[1]),
                );
            });
    }

    $scope.selectMovementXPickerView = function (view) {
        if (!$scope.movementXPickerIsShipyard) return;
        $scope.movementXPickerView = view === 'navy' ? 'navy' : 'army';
    };

    $scope.coordinateClick = function (x, y) {
        if ($scope.pendingRouteSelection && !$scope.isProductionSiteMode()) {
            var routeKey = x + '_' + y;
            var selectedRoute = $scope.pendingRouteSelection.routesByCoord[routeKey];
            var movementRow = $scope.pendingRouteSelection.row;

            if (selectedRoute) {
                $scope.applyRouteToMovementRow(movementRow, selectedRoute.segments);
                $scope.queueAutoSaveTsGrid('Movement');
            }

            $scope.pendingRouteSelection = null;
            $scope.clearRouteCandidates();

            if (selectedRoute) {
                $scope.movementClickRow({ entity: movementRow });
            }
        }

        if ($scope.isProductionSiteMode()) {
            $scope.selectProductionSiteRowAtCoordinate(x, y);
        }

        var coord = $scope.getCoordinateByXY(x, y);
        $scope.selectedCoordinateDetails = '(X:' + x + ',Y: ' + y + ') ' + coord.state + coord.population + coord.productionSite + ' - ' + coord.owner + coord.terrain + coord.bonus;
        $scope.selectedItemGridCoordinate = { x: x, y: y };
        $scope.refreshItemGridRows();

        if ($scope.isMovementXMode()) {
            var isSea = isSeaCoordinate(coord);
            var isShipyard = !isSea && isCoastalBarracks(x, y);
            var hasArmyAtCoordinate =
                $scope.hasMovementXArmyUnitAtCoordinate(x, y);
            var hasShipsAtCoordinate =
                $scope.hasMovementXShipAtCoordinate(x, y);
            var hasRelevantUnits = isSea
                ? hasShipsAtCoordinate
                : hasArmyAtCoordinate || (isShipyard && hasShipsAtCoordinate);

            $scope.movementXPickerIsShipyard = isShipyard;
            $scope.movementXPickerView = isSea
                ? 'navy'
                : isShipyard && !hasArmyAtCoordinate && hasShipsAtCoordinate
                    ? 'navy'
                    : 'army';
            $scope.movementXPickerPositionFilter = hasRelevantUnits
                ? x + '/' + y
                : null;
            $scope.movementXPickerSphereFilter =
                $scope.getMovementPickerSphereFromCoordinates(x, y);
            $scope.movementXPickerShowCurrentSelection = false;
        }

        if (!$scope.isProductionSiteMode()
            && coord
            && ($scope.isMovementXMode() || (coord.units && coord.units.length > 0))) {
            if ($scope.orderUi.suppressCoordinatePickerOpenUntil > new Date().getTime()) {
                return;
            }
            $scope.openMovementPickerModal($scope.isMovementXMode());
        }
    };

    $scope.coordinateDblClick = function (x, y) {
        if ($scope.isProductionSiteMode()) {
            var prodCoord = $scope.getCoordinateByXY(x, y);
            if (!prodCoord) return;

            $scope.selectedCoordinateDetails = '(X:' + x + ',Y: ' + y + ') ' + prodCoord.state + prodCoord.population + prodCoord.productionSite + ' - ' + prodCoord.owner + prodCoord.terrain + prodCoord.bonus;

            var productionSiteClass = $scope.defineCoordClass(
                prodCoord.terrain,
                prodCoord.state,
                prodCoord.population,
                prodCoord.productionSite,
                prodCoord.owner,
                prodCoord.bonus,
                prodCoord.displayField,
                prodCoord.units,
                prodCoord.x,
                prodCoord.y,
                prodCoord.routeCandidate,
                prodCoord.jumpOffText
            );
            productionSiteClass = (productionSiteClass || '').split(' ')[0];

            if (!$scope.canAddProductionSiteAtCoordinate(prodCoord, productionSiteClass)) return;

            $scope.addOrUpdateProductionSiteRecord(x, y, productionSiteClass);
            return;
        }

        if ($scope.selectedMovementItemCoordinate
            && $scope.selectedMovementRow
            && $scope.selectedMovementItemCoordinate.x == x
            && $scope.selectedMovementItemCoordinate.y == y) {
            $scope.selectedMovementRow.direction1 = null;
            $scope.selectedMovementRow.distance1 = null;
            $scope.selectedMovementRow.direction2 = null;
            $scope.selectedMovementRow.distance2 = null;
            $scope.selectedMovementRow.direction3 = null;
            $scope.selectedMovementRow.distance3 = null;
            $scope.selectedMovementRow.mpUsed = 0;

            $scope.clearDisplayField();
            $scope.clearRouteCandidates();
            $scope.pendingRouteSelection = null;
            $scope.queueAutoSaveTsGrid('Movement');
            return;
        }

        var startCoord = $scope.getCoordinateByXY(x, y);
        $scope.selectedCoordinateDetails = '(X:' + x + ',Y: ' + y + ') ' + startCoord.state + startCoord.population + startCoord.productionSite + ' - ' + startCoord.owner + startCoord.terrain + startCoord.bonus;
        $scope.selectedItemGridCoordinate = { x: x, y: y };
        $scope.refreshItemGridRows();

        var maxDistance = 32;
        for (var dir = 1; dir < 9; dir++) {
            $scope.getCoordinatesInADirection(dir, startCoord, maxDistance);
        }
    };

    $scope.getMovementPickerSphereFromCoordinates = function (x, y) {
        var parsedX = parseInt(x, 10);
        var parsedY = parseInt(y, 10);
        if (isNaN(parsedX) || isNaN(parsedY)) return 'Unknown';

        if (parsedX <= 80 && parsedY <= 65) return 'Europe';
        if (parsedX <= 40 && parsedY <= 99) return 'Caribbean';
        if (parsedX <= 90 && parsedY <= 99) return 'India';
        return 'Unknown';
    };

    $scope.toggleMovementPickerCoordinateFilter = function (itemRow, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();
        if (!itemRow) return;

        var x = parseInt(itemRow.x, 10);
        var y = parseInt(itemRow.y, 10);
        if (isNaN(x) || isNaN(y)) return;

        var sphere = $scope.getMovementPickerSphereFromCoordinates(x, y);
        var sphereKey = sphere && sphere !== 'Unknown' ? sphere : null;

        if ($scope.selectedItemGridCoordinate
            && $scope.selectedItemGridCoordinate.x == x
            && $scope.selectedItemGridCoordinate.y == y) {
            $scope.selectedItemGridCoordinate = null;
            $scope.selectedItemGridSphere = sphereKey;
            $scope.refreshItemGridRows();
            return;
        }

        if (!$scope.selectedItemGridCoordinate
            && sphereKey
            && $scope.selectedItemGridSphere === sphereKey) {
            $scope.selectedItemGridCoordinate = { x: x, y: y };
            $scope.selectedItemGridSphere = null;
            $scope.refreshItemGridRows();
            return;
        }

        $scope.selectedItemGridCoordinate = { x: x, y: y };
        $scope.selectedItemGridSphere = null;
        $scope.refreshItemGridRows();
    };
        }
    };
});
