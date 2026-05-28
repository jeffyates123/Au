'use strict';

//https://www.youtube.com/playlist?list=PL5586336C26BDB324 JAVASCRIPT VIDEOS

function sendRegionalMapFile(file) {
    console.log(file.type);

    var data = new FormData();
    data.append('file1', file);

    $.ajax({
        type: 'post',
        url: '/Api/RulesCatalogApi/RegionalMapFilePost',
        data: data,
        success: function () {
            alert('Succesfully loaded Regional Map');
        },
        error: function () {
            alert('Error while invoking the Web API');
        },
        contentType: false,
        processData: false
    });
}

austerlitzModule.controller('turnMapsController', function (
    $scope,
    $routeParams,
    $timeout,
    turnReportFactory,
    rulesCatalogFactory,
    turnSheetFactory,
    masterData,
    turnMapsConfigFactory,
    turnMapsSharedFactory,
    turnMapsMovementFactory,
    turnMapsBoardingFactory,
    turnMapsProductionSitesFactory,
    turnMapsFormFederationsFactory,
    turnMapsGridConfigFactory) {

    $scope.masterData = masterData;
    $scope.autoSavePromises = {};

    angular.extend($scope, turnMapsConfigFactory.createInitialState());

    turnMapsBoardingFactory.attach($scope);
    turnMapsProductionSitesFactory.attach($scope);
    turnMapsSharedFactory.attach($scope);
    turnMapsFormFederationsFactory.attach($scope);
    turnMapsMovementFactory.attach($scope);
    turnMapsGridConfigFactory.attach($scope);

    $scope.queueAutoSaveTsGrid = function (tsType) {
        if ($scope.autoSavePromises[tsType]) {
            $timeout.cancel($scope.autoSavePromises[tsType]);
        }

        $scope.autoSavePromises[tsType] = $timeout(function () {
            var records = null;
            if (tsType === 'Movement') records = $scope.tsMovementList;
            if (tsType === 'BuildProductionSites') records = $scope.tsBuildProductionSitesList;
            if (tsType === 'FormFederations') records = $scope.tsFormFederationsList;
            if (tsType === 'TransferGoods') records = $scope.tsTransferGoodsList;
            if (tsType === 'Boarding') records = $scope.tsBoardingList;

            if (!records) return;

            turnSheetFactory.postTSRecords(records, tsType).then(function (savedRows) {
                if (tsType === 'BuildProductionSites') $scope.tsBuildProductionSitesList = $scope.normalizeBuildProductionSiteRows(savedRows);
                if (tsType === 'FormFederations') $scope.tsFormFederationsList = $scope.normalizeFormFederationRows(savedRows);
                if (tsType === 'TransferGoods') {
                    $scope.tsTransferGoodsList = $scope.normalizeTransferGoodsRows(savedRows);
                    $scope.refreshTransferGoodsCostRows();
                }
                if (tsType === 'Boarding') {
                    $scope.tsBoardingList = $scope.normalizeBoardingRows(savedRows);
                }
                if (tsType === 'Movement') $scope.tsMovementList = savedRows;
            });
        }, 100);
    };

    $scope.$on('ngGridEventEndCellEdit', function () {
        if ($scope.isProductionSiteMode()) {
            $scope.queueAutoSaveTsGrid('BuildProductionSites');
            return;
        }
        if ($scope.isFormFederationMode()) {
            $scope.queueAutoSaveTsGrid('FormFederations');
            return;
        }
        if ($scope.isBoardingMode()) {
            $scope.queueAutoSaveTsGrid('Boarding');
            return;
        }
        $scope.queueAutoSaveTsGrid('Movement');
    });

    $scope.changeDisplayOption = function () {
        $scope.selectedMapOptions = turnMapsConfigFactory.getSelectedOptions($scope.selectedDisplayOption);
        $scope.selectedItemGridCoordinate = null;
        $scope.refreshItemGridRows();

    };

    $scope.isProductionSiteMode = function () {
        return turnMapsConfigFactory.isMode($scope.selectedDisplayOption, 'ProductionSite');
    };

    $scope.isFormFederationMode = function () {
        return turnMapsConfigFactory.isMode($scope.selectedDisplayOption, 'FormFederation');
    };

    $scope.isBoardingMode = function () {
        return turnMapsConfigFactory.isMode($scope.selectedDisplayOption, 'Boarding');
    };

    $scope.toggleSelection = function toggleSelection(mapOption) {
        var idx = $scope.selectedMapOptions.indexOf(mapOption);
        if (idx > -1) {
            $scope.selectedMapOptions.splice(idx, 1);
        } else {
            $scope.selectedMapOptions.push(mapOption);
        }
    };

    $scope.coordinateClick = function (x, y) {
        if ($scope.pendingRouteSelection) {
            var routeKey = x + '_' + y;
            var selectedRoute = $scope.pendingRouteSelection.routesByCoord[routeKey];
            var movementRow = $scope.pendingRouteSelection.row;

            if (selectedRoute) {
                $scope.applyRouteToMovementRow(movementRow, selectedRoute.segments);
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

    $scope.refreshItemGridRows = function () {
        if ($scope.isFormFederationMode()) {
            var federationCandidates = $scope.getFormFederationCandidateItems();

            if ($scope.selectedItemGridCoordinate) {
                var selectedCoordItems = federationCandidates.filter(function (item) {
                    return item.x == $scope.selectedItemGridCoordinate.x && item.y == $scope.selectedItemGridCoordinate.y;
                });

                $scope.itemGridRows = selectedCoordItems.length > 0 ? selectedCoordItems : federationCandidates;
                return;
            }

            $scope.itemGridRows = federationCandidates;
            return;
        }

        if ($scope.isBoardingMode()) {
            if (!$scope.filteredMovementItemsForMap) {
                $scope.boardingItemRows = [];
                return;
            }

            var boardingSphereList = $scope.filteredMovementItemsForMap;

            if ($scope.selectedItemGridCoordinate) {
                var selectedCoordBoardingItems = boardingSphereList.filter(function (item) {
                    return item.x == $scope.selectedItemGridCoordinate.x && item.y == $scope.selectedItemGridCoordinate.y;
                });

                $scope.boardingItemRows = selectedCoordBoardingItems.length > 0 ? selectedCoordBoardingItems : boardingSphereList;
                $scope.recalculateBoardingSummary();
                return;
            }

            $scope.boardingItemRows = boardingSphereList;
            $scope.recalculateBoardingSummary();
            return;
        }

        if (!$scope.filteredMovementItemsForMap) {
            $scope.itemGridRows = [];
            return;
        }

        var sphereList = $scope.filteredMovementItemsForMap;

        if ($scope.selectedItemGridCoordinate) {
            var selectedCoordItems = sphereList.filter(function (item) {
                return item.x == $scope.selectedItemGridCoordinate.x && item.y == $scope.selectedItemGridCoordinate.y;
            });

            $scope.itemGridRows = selectedCoordItems.length > 0 ? selectedCoordItems : sphereList;
            return;
        }

        $scope.itemGridRows = sphereList;
    };

    $scope.itemGridClickRow = function (row, col) {
        var clickedFederationColumn = $scope.isFederationColumnClick(col);

        if ($scope.isFormFederationMode()) {
            $scope.addItemToFormFederationGrid(row, clickedFederationColumn);
            return;
        }

        if (!row || !row.entity || !row.entity.itemNo || !$scope.tsMovementList) return;

        var selectedItemNo = row.entity.originalItemNo != null ? row.entity.originalItemNo : row.entity.itemNo;
        var selectedType = row.entity.itemTypeName;
        var selectedMp = row.entity.mp;
        var selectedXy = row.entity.xy;

        if (clickedFederationColumn && row.entity.fed != null && row.entity.fed !== '') {
            selectedItemNo = row.entity.fed;
            selectedType = 'Fed';

            var federationSummary = $scope.getFederationMovementSummary(row.entity.fed);
            if (!federationSummary || federationSummary.itemNo == null) return;

            selectedMp = federationSummary.mp;
            selectedXy = federationSummary.x + '/' + federationSummary.y;
        }

        var alreadyExists = $scope.tsMovementList.some(function (movementRow) {
            return movementRow.itemNo == selectedItemNo;
        });

        if (alreadyExists) return;

        var firstAvailableRow = null;
        angular.forEach($scope.tsMovementList, function (movementRow) {
            if (firstAvailableRow == null && (movementRow.itemNo == null || movementRow.itemNo === '')) {
                firstAvailableRow = movementRow;
            }
        });

        if (firstAvailableRow != null) {
            firstAvailableRow.itemNo = selectedItemNo;
            firstAvailableRow.type = selectedType;
            firstAvailableRow.mp = selectedMp;
            firstAvailableRow.mpUsed = 0;
            firstAvailableRow.xy = selectedXy;
            $scope.queueAutoSaveTsGrid('Movement');
        }
    };

    $scope.isItemAlreadyInMovementGrid = function (itemNo) {
        if ($scope.isFormFederationMode()) {
            return $scope.isItemAlreadyInFormFederationGrid(itemNo);
        }

        if (!itemNo || !$scope.tsMovementList) return false;

        return $scope.tsMovementList.some(function (movementRow) {
            return movementRow.itemNo == itemNo;
        });
    };

    $scope.saveTSFormFederations = function () {
        turnSheetFactory.postTSRecords($scope.tsFormFederationsList, 'FormFederations').then(function (returnTsFormFederationsList) {
            $scope.tsFormFederationsList = $scope.normalizeFormFederationRows(returnTsFormFederationsList);
            alert('Turnsheet form federations saved and Excel federation section updated successfully.');
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            alert('Form federations save failed.' + (detail ? ' ' + detail : ''));
        });
    };

    $scope.saveTSMovement = function () {
        turnSheetFactory.postTSRecords($scope.tsMovementList, 'Movement').then(function (returnTsMovementList) {
            $scope.tsMovementList = returnTsMovementList;
            alert('Turnsheet movement saved and Excel movement section updated successfully.');
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            alert('Movement save failed.' + (detail ? ' ' + detail : ''));
        });
    };

    $scope.saveTSBuildProductionSites = function () {
        turnSheetFactory.postTSRecords($scope.tsBuildProductionSitesList, 'BuildProductionSites').then(function (returnTsBuildProductionSitesList) {
            $scope.tsBuildProductionSitesList = $scope.normalizeBuildProductionSiteRows(returnTsBuildProductionSitesList);
            alert('Turnsheet production site records saved and Excel production site section updated successfully.');
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            alert('Production site save failed.' + (detail ? ' ' + detail : ''));
        });
    };

    $scope.$watch('selectedMapChoice', function () {
        $scope.refreshFilteredMovementItemsForMap();
    }, true);

    $scope.$watch('masterData.turnReport.movementItemList', function () {
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
    }, true);

    $scope.$watch('tsMovementList', function () {
        $scope.refreshMovementGridTypeValues();
    }, true);

    turnReportFactory.getMapCoordinates($scope.masterData.turnId).then(function (mapCoordinates) {
        $scope.mapCoordinates = mapCoordinates;
        $scope.markJumpOffPoints();
        $scope.attachUnitsToMapCoordinates();
        $scope.refreshMovementGridTypeValues();
    });

    turnReportFactory.getTRFullTurnDetails($scope.masterData.turnId).then(function (turnReport) {
        $scope.masterData.turnReport = turnReport;
        $scope.attachUnitsToMapCoordinates();
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
    });

    turnSheetFactory.getTSMovement($scope.masterData.turnId).then(function (tsMovementList) {
        $scope.tsMovementList = tsMovementList;
        $scope.refreshMovementGridTypeValues();
    });

    turnSheetFactory.getTSBuildProductionSites($scope.masterData.turnId).then(function (tsBuildProductionSitesList) {
        $scope.tsBuildProductionSitesList = $scope.normalizeBuildProductionSiteRows(tsBuildProductionSitesList);
    });

    turnSheetFactory.getTSFormFederations($scope.masterData.turnId).then(function (tsFormFederationsList) {
        $scope.tsFormFederationsList = $scope.normalizeFormFederationRows(tsFormFederationsList);
    });

    turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(function (tsBoardingList) {
        $scope.tsBoardingList = $scope.normalizeBoardingRows(tsBoardingList);
    });

    rulesCatalogFactory.getRefProductionSites().then(function (productionSiteList) {
        $scope.productionSiteList = productionSiteList;
        $scope.selectedProductionSite = productionSiteList[5];
    });

    rulesCatalogFactory.getRefStates().then(function (stateList) {
        $scope.stateList = stateList;

        var selectedStateCode = ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : '').toString().trim().toUpperCase();
        var selectedState = null;

        if (selectedStateCode) {
            angular.forEach($scope.stateList, function (state) {
                var stateCode = (state.state || state.State || '').toString().trim().toUpperCase();
                if (!selectedState && stateCode === selectedStateCode) {
                    selectedState = state;
                }
            });
        }

        $scope.selectedState = selectedState || $scope.stateList[3];
        if (typeof $scope.recalculateTransferGoodsForSetUpBrigades === 'function') {
            $scope.recalculateTransferGoodsForSetUpBrigades();
        }
    });

    rulesCatalogFactory.getRefTerrain().then(function (terrainList) {
        $scope.terrainList = terrainList;
        $scope.refreshMovementGridTypeValues();
    });

    $scope.refreshFilteredMovementItemsForMap();
});
