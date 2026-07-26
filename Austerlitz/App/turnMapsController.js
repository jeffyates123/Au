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
    $q,
    $routeParams,
    $timeout,
    $window,
    turnReportFactory,
    rulesCatalogFactory,
    turnSheetFactory,
    turnHistoryFactory,
    masterData,
    turnMapsConfigFactory,
    turnMapsSharedFactory,
    turnMapsMovementFactory,
    turnMapsProductionSitesFactory,
    turnMapsSpyLookupFactory,
    turnMapsOrderNavigationFactory,
    turnMapsMapSelectionFactory) {

    $scope.masterData = masterData;
    $scope.autoSavePromises = {};

    angular.extend($scope, turnMapsConfigFactory.createInitialState());

    turnMapsProductionSitesFactory.attach($scope);
    turnMapsSharedFactory.attach($scope);
    turnMapsMovementFactory.attach($scope);
    turnMapsSpyLookupFactory.attach($scope);
    turnMapsOrderNavigationFactory.attach($scope);
    turnMapsMapSelectionFactory.attach($scope);

    $scope.orderUi = {
        movementIndex: 0,
        productionIndex: 0,
        movementInitialAutoSelectionDone: false,
        suppressCoordinatePickerOpenUntil: 0,
        movementPickerDisplayMode: 'modal',
        allOrdersModal: {
            isOpen: false,
            mode: ''
        },
        movementPickerModal: {
            isOpen: false
        }
    };
    $scope.spyCoordinateReportByKey = {};
    $scope.armyCoordinateByKey = {};
    $scope.epidemicCoordinateByKey = {};
    $scope.spyTurnReportCacheByTurnId = {};
    $scope.spyLookupRequestId = 0;
    $scope.previousMapCoordinatesByKey = {};
    $scope.movementXModalMode = true;
    $scope.movementXPickerPositionFilter = null;
    $scope.movementXPickerSphereFilter = null;
    $scope.movementXPickerShowCurrentSelection = false;
    $scope.movementXSelectedItemNo = null;
    $scope.movementXSelectedType = null;

    $scope.getViewportWidth = function () {
        if ($window && $window.innerWidth) {
            return $window.innerWidth;
        }

        if ($window && $window.document && $window.document.documentElement && $window.document.documentElement.clientWidth) {
            return $window.document.documentElement.clientWidth;
        }

        return 0;
    };

    $scope.isWideScreenEnabled = function () {
        if ($scope.masterData && $scope.masterData.getWideScreenEnabled) {
            return $scope.masterData.getWideScreenEnabled();
        }

        return $scope.masterData ? $scope.masterData.wideScreenEnabled !== false : true;
    };

    $scope.refreshMovementPickerDisplayMode = function () {
        var shouldUsePanel = $scope.isWideScreenEnabled()
            && !$scope.isProductionSiteMode()
            && $scope.getViewportWidth() >= $scope.wideScreenMinViewportWidth;

        $scope.orderUi.movementPickerDisplayMode = shouldUsePanel ? 'panel' : 'modal';

        if ($scope.orderUi.movementPickerDisplayMode === 'panel') {
            if (!$scope.isMovementXMode()) {
                $scope.orderUi.movementPickerModal.isOpen = true;
            }
            return;
        }

        if ($scope.isProductionSiteMode()) {
            $scope.orderUi.movementPickerModal.isOpen = false;
        }
    };

    $scope.isMovementPickerPanelMode = function () {
        return $scope.orderUi.movementPickerDisplayMode === 'panel';
    };

    $scope.shouldUseMovementPickerPanelLayout = function () {
        return $scope.isMovementPickerPanelMode()
            && (!$scope.isMovementXMode() || $scope.orderUi.movementPickerModal.isOpen);
    };

    $scope.shouldShowMovementPickerModal = function () {
        return $scope.orderUi.movementPickerModal.isOpen && !$scope.isMovementPickerPanelMode();
    };

    $scope.shouldShowMovementPickerPanel = function () {
        return $scope.orderUi.movementPickerModal.isOpen && $scope.isMovementPickerPanelMode();
    };

    $scope.shouldShowMovementXPickerModal = function () {
        return $scope.orderUi.movementPickerModal.isOpen
            && $scope.isMovementXMode()
            && !$scope.isMovementPickerPanelMode();
    };

    $scope.shouldShowMovementXPickerPanel = function () {
        return $scope.orderUi.movementPickerModal.isOpen
            && $scope.isMovementXMode()
            && $scope.isMovementPickerPanelMode();
    };

    $scope.hasMovementXArmyUnitAtCoordinate = function (x, y) {
        return ($scope.filteredMovementItemsForMap || []).some(function (item) {
            return (item.itemTypeName === "Brigade" || item.itemTypeName === "Commander")
                && item.x == x
                && item.y == y;
        });
    };

    $scope.selectMovementXArmyUnit = function (unit, selectionType) {
        if (!unit || unit.id == null) {
            return;
        }

        var movementItem = null;
        angular.forEach($scope.filteredMovementItemsForMap || [], function (item) {
            if (movementItem) {
                return;
            }

            var itemNo = item.originalItemNo != null ? item.originalItemNo : item.itemNo;
            if (itemNo == unit.id) {
                movementItem = item;
            }
        });

        if (!movementItem) {
            $scope.selectedCoordinateDetails =
                "Movement item " + unit.id + " is not available.";
            return;
        }

        if (selectionType === "fed") {
            $scope.movementXPickerPositionFilter = null;
            $scope.movementXPickerSphereFilter = "All";
            $scope.movementXSelectedItemNo = unit.fed;
            $scope.movementXSelectedType = "Fed";
        } else {
            $scope.movementXSelectedItemNo = unit.id;
            $scope.movementXSelectedType = "Item";
        }

        $scope.movementXPickerShowCurrentSelection = true;
        $scope.selectMovementOrderItem(
            movementItem,
            selectionType === "fed" ? "fed" : "item",
        );
    };

    $scope.isMovementXArmyUnitMoved = function (unit) {
        if (!unit || unit.id == null) {
            return false;
        }

        var movementItem = null;
        angular.forEach($scope.filteredMovementItemsForMap || [], function (item) {
            if (movementItem) {
                return;
            }

            var itemNo = item.originalItemNo != null ? item.originalItemNo : item.itemNo;
            if (itemNo == unit.id) {
                movementItem = item;
            }
        });

        var effectiveFederationNo = movementItem
            ? $scope.getEffectiveMovementFederationNoForItem(movementItem)
            : unit.fed;
        var hasMovementOrder = false;
        angular.forEach($scope.tsMovementList || [], function (movementRow) {
            if (hasMovementOrder
                || !$scope.hasMovementItemNo(movementRow)
                || !$scope.hasAnyMovementDirectionOrDistance(movementRow)) {
                return;
            }

            var movementItemNo = parseInt(movementRow.itemNo, 10);
            var isLandFederationOrder = movementItemNo >= 61
                && movementItemNo <= 90
                && effectiveFederationNo != null
                && effectiveFederationNo !== ""
                && movementRow.itemNo == effectiveFederationNo;
            var isUnitOrder = !isLandFederationOrder
                && movementRow.itemNo == unit.id;

            hasMovementOrder = isUnitOrder || isLandFederationOrder;
        });

        return hasMovementOrder;
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


    $scope.refreshItemGridRows = function () {
        if (!$scope.filteredMovementItemsForMap) {
            $scope.itemGridRows = [];
            return;
        }

        var sphereList = $scope.filteredMovementItemsForMap;
        if ($scope.selectedItemGridSphere) {
            sphereList = sphereList.filter(function (item) {
                return $scope.getMovementPickerSphereFromCoordinates(item.x, item.y) === $scope.selectedItemGridSphere;
            });
        }

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

    $scope.isFederationAlreadyInMovementGrid = function (federationNo) {
        if (federationNo == null || federationNo === '' || !$scope.tsMovementList) return false;

        return $scope.tsMovementList.some(function (movementRow) {
            if (!$scope.hasMovementItemNo(movementRow)) return false;

            return movementRow.itemNo == federationNo;
        });
    };

    $scope.isItemRowAlreadyInMovementGrid = function (itemRow) {
        if (!itemRow) return false;
        var itemNo = itemRow.originalItemNo != null ? itemRow.originalItemNo : itemRow.itemNo;
        return $scope.isItemAlreadyInMovementGrid(itemNo);
    };

    $scope.isFederationRowAlreadyInMovementGrid = function (itemRow) {
        if (!itemRow || itemRow.fed == null || itemRow.fed === '') return false;
        return $scope.isFederationAlreadyInMovementGrid(itemRow.fed);
    };

    $scope.isItemOrFederationAlreadyInMovementGrid = function (itemRow) {
        if (!itemRow) return false;

        return $scope.isItemRowAlreadyInMovementGrid(itemRow) || $scope.isFederationRowAlreadyInMovementGrid(itemRow);
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

    $scope.$watch('masterData.turnsList', function () {
        $scope.loadPreviousMapCoordinates();
        $scope.rebuildSpyCoordinateReportLookup();
    }, true);

    $scope.$watch('masterData.turnReport.movementItemList', function () {
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
    }, true);

    $scope.$watch('movementFormFederationRows', function () {
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
    }, true);

    $scope.$watch('movementBoardingRows', function () {
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
        $scope.rebuildSpyCoordinateReportLookup();
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

    $scope.$on('userSettings:wideScreenChanged', function (event, payload) {
        if (payload && payload.isEnabled !== undefined) {
            $scope.masterData.wideScreenEnabled = payload.isEnabled === true;
        }
        $scope.refreshMovementPickerDisplayMode();
    });

    var onViewportResize = function () {
        $scope.$applyAsync(function () {
            $scope.refreshMovementPickerDisplayMode();
        });
    };

    angular.element($window).on('resize', onViewportResize);

    $scope.$on('$destroy', function () {
        angular.element($window).off('resize', onViewportResize);
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
        $scope.spyTurnReportCacheByTurnId[$scope.masterData.turnId] = turnReport;
        $scope.rebuildArmyCoordinateLookup();
        $scope.rebuildEpidemicCoordinateLookup();
        $scope.attachUnitsToMapCoordinates();
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
        $scope.rebuildSpyCoordinateReportLookup();
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

    turnSheetFactory.getTSFormFederations($scope.masterData.turnId).then(function (rows) {
        $scope.movementFormFederationRows = rows || [];
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
    });

    turnSheetFactory.getTSBoarding($scope.masterData.turnId).then(function (rows) {
        $scope.movementBoardingRows = rows || [];
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
        $scope.tryApplyInitialMovementOrderSelection();
        $scope.rebuildSpyCoordinateReportLookup();
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
        $scope.applyMapChoiceForSelectedState();
        if (typeof $scope.recalculateTransferGoodsForSetUpBrigades === 'function') {
            $scope.recalculateTransferGoodsForSetUpBrigades();
        }
    });

    rulesCatalogFactory.getRefTerrain().then(function (terrainList) {
        $scope.terrainList = terrainList;
        $scope.refreshMovementGridTypeValues();
    });

    $scope.refreshMovementPickerDisplayMode();
    $scope.refreshFilteredMovementItemsForMap();
    $scope.loadPreviousMapCoordinates();
});
