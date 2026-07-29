'use strict';

austerlitzModule.factory('turnMapsMovementFactory', function (
    turnMapsMovementRouteFactory,
    turnMapsMovementCostFactory,
    turnMapsMovementItemFactory,
    turnMapsMovementPickerFactory) {
    return {
        attach: function ($scope) {
            $scope.movementClickRow = function (row) {
                $scope.clearDisplayField();
                $scope.clearRouteCandidates();
                $scope.pendingRouteSelection = null;
                $scope.selectedMovementItemCoordinate = null;

                if (row.entity.itemNo != null) {
                    var selectedItem = $scope.getItemFromItemNo(
                        row.entity.itemNo,
                        row.entity.type === 'Fed' || row.entity.type === 'Fleet'
                    );
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
                turnMapsMovementRouteFactory.applyRouteToMovementRow(movementRow, segments);
            };

            $scope.clearRouteCandidates = function () {
                turnMapsMovementRouteFactory.clearRouteCandidates($scope.mapCoordinates);
            };

            $scope.markRouteCandidates = function (routesByCoord) {
                turnMapsMovementRouteFactory.markRouteCandidates($scope.mapCoordinates, routesByCoord);
            };

            $scope.calculateReachableRoutes = function (startCoord, selectedItem) {
                return turnMapsMovementRouteFactory.calculateReachableRoutes(startCoord, selectedItem, {
                    selectedMapChoice: $scope.selectedMapChoice,
                    getNextCoordinate: $scope.getNextCoordinate,
                    getTerrainMPForItem: $scope.getTerrainMPForItem
                });
            };

            $scope.isCoordInSelectedMap = function (coord) {
                return turnMapsMovementRouteFactory.isCoordInSelectedMap(coord, $scope.selectedMapChoice);
            };

            $scope.getCurrentTurnState = function () {
                return turnMapsMovementRouteFactory.getCurrentTurnState($scope.masterData);
            };

            $scope.getRouteCandidateClass = function (coordState) {
                return turnMapsMovementRouteFactory.getRouteCandidateClass(coordState, $scope.getCurrentTurnState());
            };

            $scope.isColonialCoordinate = function (coord) {
                return turnMapsMovementCostFactory.isColonialCoordinate(coord);
            };

            $scope.isShipItem = function (item) {
                return turnMapsMovementCostFactory.isShipItem(item, $scope.isNavalMovementItem);
            };

            $scope.isShipyardCoordinate = function (coord) {
                return turnMapsMovementCostFactory.isShipyardCoordinate(coord);
            };

            $scope.getTerrainMPForItem = function (coord, item) {
                return turnMapsMovementCostFactory.getTerrainMPForItem(coord, item, {
                    isNavalMovementItem: $scope.isNavalMovementItem,
                    getTerrainMP: $scope.getTerrainMP
                });
            };

            $scope.getItemFromItemNo = function (itemNo, preferFederation) {
                var movementItemList = (($scope.masterData || {}).turnReport || {}).movementItemList || [];
                return turnMapsMovementItemFactory.getItemFromItemNo(itemNo, preferFederation, movementItemList, $scope.movementEffectiveFederationByItemNo);
            };

            $scope.getFederationMovementSummary = function (federationNo) {
                var movementItemList = (($scope.masterData || {}).turnReport || {}).movementItemList || [];
                return turnMapsMovementItemFactory.getFederationMovementSummary(federationNo, movementItemList, $scope.movementEffectiveFederationByItemNo);
            };

            $scope.calculateMovementRowUsedMp = function (movementRow, selectedItem) {
                return turnMapsMovementRouteFactory.calculateMovementRowUsedMp(movementRow, selectedItem, {
                    mapCoordinates: $scope.mapCoordinates,
                    terrainList: $scope.terrainList,
                    getCoordinateByXY: $scope.getCoordinateByXY,
                    getNextCoordinate: $scope.getNextCoordinate,
                    getTerrainMPForItem: $scope.getTerrainMPForItem
                });
            };

            $scope.refreshMovementGridTypeValues = function () {
                if (!$scope.tsMovementList || !$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) return;

                angular.forEach($scope.tsMovementList, function (movementRow) {
                    if (movementRow.itemNo != null) {
                        var selectedItem = $scope.getItemFromItemNo(
                            movementRow.itemNo,
                            movementRow.type === 'Fed' || movementRow.type === 'Fleet'
                        );
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
                return turnMapsMovementPickerFactory.filterMovementItemBySelectedMap(item, $scope.selectedMapChoice);
            };

            $scope.getMovementPickerUnitKind = function (itemTypeName) {
                return turnMapsMovementPickerFactory.getMovementPickerUnitKind(itemTypeName, {
                    normalizeItemTypeName: $scope.normalizeItemTypeName,
                    isNavalItemTypeName: $scope.isNavalItemTypeName
                });
            };

            $scope.toMovementPickerItemId = function (value) {
                return turnMapsMovementItemFactory.toMovementPickerItemId(value);
            };

            $scope.formatMovementPickerPosition = function (x, y) {
                return turnMapsMovementPickerFactory.formatMovementPickerPosition(x, y);
            };

            $scope.buildMovementPickerBattalionSummary = function (brigade) {
                return turnMapsMovementPickerFactory.buildMovementPickerBattalionSummary(brigade);
            };

            $scope.getMovementPickerMainDescription = function (itemRow) {
                return turnMapsMovementPickerFactory.getMovementPickerMainDescription(itemRow);
            };

            $scope.getMovementPickerTypeSortRank = function (itemTypeName) {
                return turnMapsMovementPickerFactory.getMovementPickerTypeSortRank(itemTypeName);
            };

            $scope.buildMovementPickerDetailLookups = function () {
                var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
                return turnMapsMovementPickerFactory.buildMovementPickerDetailLookups(turnReport, $scope.toMovementPickerItemId);
            };

            $scope.buildMovementPickerEffectiveFederationLookup = function () {
                var turnReport = ($scope.masterData && $scope.masterData.turnReport) || {};
                return turnMapsMovementPickerFactory.buildMovementPickerEffectiveFederationLookup(
                    turnReport,
                    $scope.movementFormFederationRows || [],
                    $scope.toMovementPickerItemId,
                    $scope.resolveItemTypeName,
                    $scope.getMovementPickerUnitKind
                );
            };

            $scope.getEffectiveMovementFederationNoForItem = function (item) {
                return turnMapsMovementItemFactory.getEffectiveMovementFederationNoForItem(item, $scope.movementEffectiveFederationByItemNo);
            };

            $scope.buildMovementPickerBoardingLookups = function (effectiveFedLookupByItemNo, detailLookups) {
                return turnMapsMovementPickerFactory.buildMovementPickerBoardingLookups(
                    $scope.movementBoardingRows || [],
                    effectiveFedLookupByItemNo,
                    detailLookups,
                    $scope.toMovementPickerItemId
                );
            };

            $scope.hasMovementPickerBoardingStatus = function (itemRow, detail, boardingLookups, effectiveFedLookupByItemNo) {
                return turnMapsMovementPickerFactory.hasMovementPickerBoardingStatus(
                    itemRow,
                    detail,
                    boardingLookups,
                    effectiveFedLookupByItemNo,
                    $scope.toMovementPickerItemId,
                    $scope.getMovementPickerUnitKind
                );
            };

            $scope.resolveMovementPickerDetail = function (itemRow, detailLookups, effectiveFedLookupByItemNo) {
                return turnMapsMovementPickerFactory.resolveMovementPickerDetail(itemRow, detailLookups, effectiveFedLookupByItemNo, {
                    getMovementPickerUnitKind: $scope.getMovementPickerUnitKind,
                    toMovementPickerItemId: $scope.toMovementPickerItemId,
                    buildMovementPickerBattalionSummary: $scope.buildMovementPickerBattalionSummary,
                    formatMovementPickerPosition: $scope.formatMovementPickerPosition
                });
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

                $scope.filteredMovementItemsForMap = turnMapsMovementPickerFactory.buildFilteredMovementItemsForMap({
                    turnReport: $scope.masterData.turnReport,
                    selectedMapChoice: $scope.selectedMapChoice,
                    effectiveFedLookupByItemNo: effectiveFedLookupByItemNo,
                    detailLookups: detailLookups,
                    boardingLookups: boardingLookups,
                    getItemTypeName: $scope.getItemTypeName,
                    getMovementPickerUnitKind: $scope.getMovementPickerUnitKind,
                    toMovementPickerItemId: $scope.toMovementPickerItemId,
                    resolveMovementPickerDetail: $scope.resolveMovementPickerDetail,
                    hasMovementPickerBoardingStatus: $scope.hasMovementPickerBoardingStatus
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
