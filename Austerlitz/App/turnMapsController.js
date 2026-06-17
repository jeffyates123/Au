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
    turnMapsProductionSitesFactory) {

    $scope.masterData = masterData;
    $scope.autoSavePromises = {};

    angular.extend($scope, turnMapsConfigFactory.createInitialState());

    turnMapsProductionSitesFactory.attach($scope);
    turnMapsSharedFactory.attach($scope);
    turnMapsMovementFactory.attach($scope);

    $scope.orderUi = {
        movementIndex: 0,
        productionIndex: 0,
        movementInitialAutoSelectionDone: false,
        suppressCoordinatePickerOpenUntil: 0,
        allOrdersModal: {
            isOpen: false,
            mode: ''
        },
        movementPickerModal: {
            isOpen: false
        }
    };

    $scope.getOrderListForMode = function (mode) {
        return mode === 'production'
            ? ($scope.tsBuildProductionSitesList || [])
            : ($scope.tsMovementList || []);
    };

    $scope.getCurrentOrderIndexForMode = function (mode) {
        return mode === 'production' ? $scope.orderUi.productionIndex : $scope.orderUi.movementIndex;
    };

    $scope.setCurrentOrderIndexForMode = function (mode, index) {
        if (mode === 'production') {
            $scope.orderUi.productionIndex = index;
            return;
        }

        $scope.orderUi.movementIndex = index;
    };

    $scope.ensureCurrentOrderIndexForMode = function (mode) {
        var orderList = $scope.getOrderListForMode(mode);
        if (!orderList.length) {
            $scope.setCurrentOrderIndexForMode(mode, 0);
            return 0;
        }

        var currentIndex = parseInt($scope.getCurrentOrderIndexForMode(mode), 10);
        if (isNaN(currentIndex)) currentIndex = 0;

        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex >= orderList.length) currentIndex = orderList.length - 1;

        $scope.setCurrentOrderIndexForMode(mode, currentIndex);
        return currentIndex;
    };

    $scope.getCurrentMovementOrderRow = function () {
        var list = $scope.getOrderListForMode('movement');
        if (!list.length) return null;

        var index = $scope.ensureCurrentOrderIndexForMode('movement');
        return list[index] || null;
    };

    $scope.getCurrentProductionOrderRow = function () {
        var list = $scope.getOrderListForMode('production');
        if (!list.length) return null;

        var index = $scope.ensureCurrentOrderIndexForMode('production');
        return list[index] || null;
    };

    $scope.getCurrentOrderMode = function () {
        return $scope.isProductionSiteMode() ? 'production' : 'movement';
    };

    $scope.getCurrentOrderRow = function () {
        return $scope.getCurrentOrderMode() === 'production'
            ? $scope.getCurrentProductionOrderRow()
            : $scope.getCurrentMovementOrderRow();
    };

    $scope.syncMovementOrderIndexToRow = function (row) {
        if (!row || !$scope.tsMovementList) return;

        var rowIndex = $scope.tsMovementList.indexOf(row);
        if (rowIndex >= 0) {
            $scope.orderUi.movementIndex = rowIndex;
        }
    };

    $scope.syncProductionOrderIndexToRow = function (row) {
        if (!row || !$scope.tsBuildProductionSitesList) return;

        var rowIndex = $scope.tsBuildProductionSitesList.indexOf(row);
        if (rowIndex >= 0) {
            $scope.orderUi.productionIndex = rowIndex;
        }
    };

    $scope.focusCurrentMovementOrder = function () {
        var row = $scope.getCurrentMovementOrderRow();
        $scope.currentMovementOrderRow = row || null;
        $scope.movementOrderPickerIndex = $scope.getCurrentOrderIndexForMode('movement');
        if (row) {
            $scope.movementClickRow({ entity: row });
        } else {
            $scope.selectedMovementRow = null;
            $scope.selectedMovementItemCoordinate = null;
            $scope.pendingRouteSelection = null;
            $scope.clearDisplayField();
            $scope.clearRouteCandidates();
        }
    };

    $scope.focusCurrentProductionOrder = function () {
        var row = $scope.getCurrentProductionOrderRow();
        $scope.currentProductionOrderRow = row || null;
        $scope.productionOrderPickerIndex = $scope.getCurrentOrderIndexForMode('production');
        $scope.selectProductionSiteRow(row || null);
    };

    $scope.focusCurrentOrder = function () {
        if ($scope.getCurrentOrderMode() === 'production') {
            $scope.focusCurrentProductionOrder();
            return;
        }

        $scope.focusCurrentMovementOrder();
    };

    $scope.selectOrderByIndex = function (mode, index) {
        var list = $scope.getOrderListForMode(mode);
        if (!list.length) return;

        var nextIndex = parseInt(index, 10);
        if (isNaN(nextIndex) || nextIndex < 0 || nextIndex >= list.length) return;

        $scope.setCurrentOrderIndexForMode(mode, nextIndex);

        if (mode === 'production') {
            $scope.focusCurrentProductionOrder();
            return;
        }

        $scope.focusCurrentMovementOrder();
    };

    $scope.navigateCurrentOrder = function (direction) {
        var mode = $scope.getCurrentOrderMode();
        var list = $scope.getOrderListForMode(mode);
        if (!list.length) return;

        var step = direction < 0 ? -1 : 1;
        var currentIndex = $scope.ensureCurrentOrderIndexForMode(mode);
        var nextIndex = (currentIndex + step + list.length) % list.length;

        $scope.selectOrderByIndex(mode, nextIndex);
    };

    $scope.isMovementRowActionableOnSelectedMap = function (movementRow) {
        if (!movementRow || movementRow.itemNo == null || movementRow.itemNo === '') return false;
        if (!$scope.selectedMapChoice) return false;

        var selectedItem = $scope.getItemFromItemNo(movementRow.itemNo, movementRow.type === 'Fed');
        if (!selectedItem || selectedItem.x == null || selectedItem.y == null) return false;

        return selectedItem.x >= $scope.selectedMapChoice.rangeMinX
            && selectedItem.x <= $scope.selectedMapChoice.rangeMaxX
            && selectedItem.y >= $scope.selectedMapChoice.rangeMinY
            && selectedItem.y <= $scope.selectedMapChoice.rangeMaxY;
    };

    $scope.getFirstActionableMovementOrderIndex = function () {
        if (!$scope.tsMovementList || !$scope.tsMovementList.length) return -1;

        for (var idx = 0; idx < $scope.tsMovementList.length; idx++) {
            if ($scope.isMovementRowActionableOnSelectedMap($scope.tsMovementList[idx])) {
                return idx;
            }
        }

        return -1;
    };

    $scope.tryApplyInitialMovementOrderSelection = function () {
        if ($scope.orderUi.movementInitialAutoSelectionDone) return;
        if (!$scope.tsMovementList || !$scope.tsMovementList.length) return;
        if (!$scope.mapCoordinates || !$scope.mapCoordinates.length) return;
        if (!$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) return;

        var currentRow = $scope.getCurrentMovementOrderRow();
        var hasActionableSelection = $scope.isMovementRowActionableOnSelectedMap(currentRow);

        if (!hasActionableSelection) {
            var firstActionableIndex = $scope.getFirstActionableMovementOrderIndex();
            if (firstActionableIndex >= 0) {
                $scope.selectOrderByIndex('movement', firstActionableIndex);
                hasActionableSelection = true;
            }
        }

        if (hasActionableSelection) {
            $scope.orderUi.movementInitialAutoSelectionDone = true;
        }

        if (hasActionableSelection && !$scope.isProductionSiteMode()) {
            $scope.focusCurrentMovementOrder();
        }
    };

    $scope.pickMovementOrderByIndex = function () {
        $scope.selectOrderByIndex('movement', $scope.movementOrderPickerIndex);
    };

    $scope.pickProductionOrderByIndex = function () {
        $scope.selectOrderByIndex('production', $scope.productionOrderPickerIndex);
    };

    $scope.getOrderSummaryText = function (mode, row) {
        if (!row) return '(empty)';

        if (mode === 'production') {
            var hasProductionData = row.prodSiteType != null || row.x != null || row.y != null;
            if (!hasProductionData) return '(empty)';

            var parts = [];
            if (row.prodSiteType != null && row.prodSiteType !== '') parts.push('Type ' + row.prodSiteType);
            if (row.x != null && row.y != null) parts.push('X/Y ' + row.x + '/' + row.y);
            var desc = $scope.getProductionSiteDescription(row);
            if (desc) parts.push(desc);

            return parts.join(' | ');
        }

        if (!$scope.hasMovementItemNo(row)) return '(empty)';

        var moveParts = [];
        moveParts.push('Item ' + row.itemNo);
        if (row.type) moveParts.push(row.type);
        if (row.mp != null) moveParts.push('MP ' + row.mp);
        if (row.xy) moveParts.push('X/Y ' + row.xy);

        return moveParts.join(' | ');
    };

    $scope.openAllOrdersModal = function () {
        $scope.orderUi.allOrdersModal.mode = $scope.getCurrentOrderMode();
        $scope.orderUi.allOrdersModal.isOpen = true;
    };

    $scope.closeAllOrdersModal = function () {
        $scope.orderUi.allOrdersModal.isOpen = false;
    };

    $scope.getAllOrdersModalRows = function () {
        var mode = $scope.orderUi.allOrdersModal.mode || $scope.getCurrentOrderMode();
        return $scope.getOrderListForMode(mode);
    };

    $scope.selectOrderFromAllOrdersModal = function (index) {
        var mode = $scope.orderUi.allOrdersModal.mode || $scope.getCurrentOrderMode();
        $scope.selectOrderByIndex(mode, index);
        $scope.closeAllOrdersModal();
    };

    $scope.isAllOrdersModalCurrentSelection = function (index) {
        var mode = $scope.orderUi.allOrdersModal.mode || $scope.getCurrentOrderMode();
        return $scope.getCurrentOrderIndexForMode(mode) === index;
    };

    $scope.openMovementPickerModal = function () {
        if ($scope.isProductionSiteMode()) return;
        $scope.orderUi.movementPickerModal.isOpen = true;
    };

    $scope.closeMovementPickerModal = function () {
        $scope.orderUi.movementPickerModal.isOpen = false;
    };

    $scope.clearMovementRouteSegments = function (movementRow) {
        if (!movementRow) return;

        movementRow.direction1 = null;
        movementRow.distance1 = null;
        movementRow.direction2 = null;
        movementRow.distance2 = null;
        movementRow.direction3 = null;
        movementRow.distance3 = null;
        movementRow.mpUsed = 0;
    };

    $scope.selectMovementOrderItem = function (itemRow, selectionType) {
        if (!itemRow || !$scope.tsMovementList || !$scope.tsMovementList.length) return;
        $scope.orderUi.suppressCoordinatePickerOpenUntil = new Date().getTime() + 400;

        var selectedItemNo = itemRow.originalItemNo != null ? itemRow.originalItemNo : itemRow.itemNo;
        var selectedType = itemRow.itemTypeName;
        var selectedMp = itemRow.mp;
        var selectedXy = itemRow.xy;

        if (selectionType === 'fed' && itemRow.fed != null && itemRow.fed !== '') {
            var federationSummary = $scope.getFederationMovementSummary(itemRow.fed);
            if (!federationSummary || federationSummary.itemNo == null) return;

            selectedItemNo = federationSummary.itemNo;
            selectedType = 'Fed';
            selectedMp = federationSummary.mp;
            selectedXy = federationSummary.x + '/' + federationSummary.y;
        }

        var existingIndex = -1;
        angular.forEach($scope.tsMovementList, function (movementRow, idx) {
            if (existingIndex === -1 && movementRow.itemNo == selectedItemNo) {
                existingIndex = idx;
            }
        });

        if (existingIndex >= 0) {
            $scope.selectOrderByIndex('movement', existingIndex);
            $scope.closeMovementPickerModal();
            return;
        }

        var currentRow = $scope.getCurrentMovementOrderRow();
        if (!currentRow) return;

        currentRow.itemNo = selectedItemNo;
        currentRow.type = selectedType;
        currentRow.mp = selectedMp;
        currentRow.xy = selectedXy;
        $scope.clearMovementRouteSegments(currentRow);

        $scope.queueAutoSaveTsGrid('Movement');
        $scope.closeMovementPickerModal();
        $scope.focusCurrentMovementOrder();
    };

    $scope.queueAutoSaveTsGrid = function (tsType) {
        if ($scope.autoSavePromises[tsType]) {
            $timeout.cancel($scope.autoSavePromises[tsType]);
        }

        $scope.autoSavePromises[tsType] = $timeout(function () {
            var records = null;
            if (tsType === 'Movement') records = $scope.tsMovementList;
            if (tsType === 'BuildProductionSites') records = $scope.tsBuildProductionSitesList;
            if (tsType === 'TransferGoods') records = $scope.tsTransferGoodsList;

            if (!records) return;

            turnSheetFactory.postTSRecords(records, tsType).then(function (savedRows) {
                if (tsType === 'BuildProductionSites') $scope.tsBuildProductionSitesList = $scope.normalizeBuildProductionSiteRows(savedRows);
                if (tsType === 'TransferGoods') {
                    $scope.tsTransferGoodsList = $scope.normalizeTransferGoodsRows(savedRows);
                    $scope.refreshTransferGoodsCostRows();
                }
                if (tsType === 'Movement') $scope.tsMovementList = savedRows;
            });
        }, 100);
    };

    $scope.changeDisplayOption = function () {
        $scope.selectedMapOptions = turnMapsConfigFactory.getSelectedOptions($scope.selectedDisplayOption);
        $scope.selectedItemGridCoordinate = null;
        $scope.refreshItemGridRows();

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

    $scope.toggleSelection = function toggleSelection(mapOption) {
        var idx = $scope.selectedMapOptions.indexOf(mapOption);
        if (idx > -1) {
            $scope.selectedMapOptions.splice(idx, 1);
        } else {
            $scope.selectedMapOptions.push(mapOption);
        }
    };

    $scope.coordinateClick = function (x, y) {
        if ($scope.pendingRouteSelection && !$scope.isProductionSiteMode()) {
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

        if (!$scope.isProductionSiteMode() && coord && coord.units && coord.units.length > 0) {
            if ($scope.orderUi.suppressCoordinatePickerOpenUntil > new Date().getTime()) {
                return;
            }
            $scope.openMovementPickerModal();
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

    $scope.handleCurrentMovementFieldChange = function () {
        var currentRow = $scope.currentMovementOrderRow || $scope.getCurrentMovementOrderRow();
        if (!currentRow || currentRow.itemNo == null || currentRow.itemNo === '') {
            return;
        }

        var selectedItem = $scope.getItemFromItemNo(currentRow.itemNo, currentRow.type === 'Fed');
        if (selectedItem && selectedItem.itemNo != null) {
            currentRow.type = $scope.getItemTypeAbbrev(selectedItem);
            currentRow.mp = selectedItem.originalMP != null ? selectedItem.originalMP : selectedItem.mp;
            currentRow.xy = selectedItem.x + '/' + selectedItem.y;
            currentRow.mpUsed = $scope.calculateMovementRowUsedMp(currentRow, selectedItem);
        }

        $scope.queueAutoSaveTsGrid('Movement');
        $scope.focusCurrentMovementOrder();
    };

    $scope.handleCurrentProductionFieldChange = function () {
        $scope.queueAutoSaveTsGrid('BuildProductionSites');
        $scope.focusCurrentProductionOrder();
    };

    $scope.clearCurrentMovementOrder = function () {
        var currentRow = $scope.currentMovementOrderRow || $scope.getCurrentMovementOrderRow();
        if (!currentRow) return;

        $scope.removeMovementRow({ entity: currentRow });
    };

    $scope.clearCurrentProductionOrder = function () {
        var currentRow = $scope.currentProductionOrderRow || $scope.getCurrentProductionOrderRow();
        if (!currentRow) return;

        $scope.removeProductionSiteRow({ entity: currentRow });
    };

    $scope.isItemAlreadyInMovementGrid = function (itemNo) {
        if (!itemNo || !$scope.tsMovementList) return false;

        return $scope.tsMovementList.some(function (movementRow) {
            return movementRow.itemNo == itemNo;
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
        $scope.tryApplyInitialMovementOrderSelection();
        if (!$scope.isProductionSiteMode()) {
            $scope.focusCurrentMovementOrder();
        }
    }, true);

    $scope.$watch('masterData.turnReport.movementItemList', function () {
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
    }, true);

    $scope.$watch('tsMovementList', function () {
        $scope.ensureCurrentOrderIndexForMode('movement');
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
        if (!$scope.isProductionSiteMode()) {
            $scope.focusCurrentMovementOrder();
        }
    }, true);

    $scope.$watch('tsBuildProductionSitesList', function () {
        $scope.ensureCurrentOrderIndexForMode('production');
        if ($scope.isProductionSiteMode()) {
            $scope.focusCurrentProductionOrder();
        }
    }, true);

    $scope.$watch('selectedProductionSiteRow', function (row) {
        if (!row) return;
        $scope.syncProductionOrderIndexToRow(row);
    });

    turnReportFactory.getMapCoordinates($scope.masterData.turnId).then(function (mapCoordinates) {
        $scope.mapCoordinates = mapCoordinates;
        $scope.markJumpOffPoints();
        $scope.attachUnitsToMapCoordinates();
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
    });

    turnReportFactory.getTRFullTurnDetails($scope.masterData.turnId).then(function (turnReport) {
        $scope.masterData.turnReport = turnReport;
        $scope.attachUnitsToMapCoordinates();
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
    });

    turnSheetFactory.getTSMovement($scope.masterData.turnId).then(function (tsMovementList) {
        $scope.tsMovementList = tsMovementList;
        $scope.refreshMovementGridTypeValues();
        $scope.ensureCurrentOrderIndexForMode('movement');
        $scope.tryApplyInitialMovementOrderSelection();
        $scope.focusCurrentMovementOrder();
    });

    turnSheetFactory.getTSBuildProductionSites($scope.masterData.turnId).then(function (tsBuildProductionSitesList) {
        $scope.tsBuildProductionSitesList = $scope.normalizeBuildProductionSiteRows(tsBuildProductionSitesList);
        $scope.ensureCurrentOrderIndexForMode('production');
        $scope.focusCurrentProductionOrder();
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
