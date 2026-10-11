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
    turnMapsPopulationDensityFactory,
    turnMapsSpyLookupFactory,
    turnMapsOrderNavigationFactory,
    turnMapsMapSelectionFactory) {

    $scope.masterData = masterData;
    $scope.autoSavePromises = {};

    angular.extend($scope, turnMapsConfigFactory.createInitialState());

    turnMapsProductionSitesFactory.attach($scope);
    turnMapsPopulationDensityFactory.attach($scope);
    turnMapsSharedFactory.attach($scope);
    turnMapsMovementFactory.attach($scope);
    turnMapsSpyLookupFactory.attach($scope);
    turnMapsOrderNavigationFactory.attach($scope);
    turnMapsMapSelectionFactory.attach($scope);

    $scope.orderUi = {
        movementIndex: 0,
        productionIndex: 0,
        populationDensityIndex: 0,
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
    $scope.spyCoordinatePresenceByKey = {};
    $scope.spyCoordinateStateByKey = {};
    $scope.armyCoordinateByKey = {};
    $scope.navyCoordinateByKey = {};
    $scope.epidemicCoordinateByKey = {};
    $scope.spyTurnReportCacheByTurnId = {};
    $scope.spyLookupRequestId = 0;
    $scope.unitLookupRequestId = 0;
    $scope.previousMapCoordinatesByKey = {};
    $scope.movementXModalMode = true;
    $scope.movementXPickerPositionFilter = null;
    $scope.movementXPickerSphereFilter = null;
    $scope.movementXPickerShowCurrentSelection = false;
    $scope.movementXSelectedItemNo = null;
    $scope.movementXSelectedType = null;
    $scope.movementXPickerView = 'army';
    $scope.movementXPickerIsShipyard = false;

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
        if ($scope.isIntelligenceMode && $scope.isIntelligenceMode()) {
            $scope.orderUi.movementPickerDisplayMode = 'modal';
            $scope.orderUi.movementPickerModal.isOpen = false;
            return;
        }

        var shouldUsePanel = $scope.isWideScreenEnabled()
            && $scope.isMovementXMode()
            && !$scope.isProductionSiteMode()
            && $scope.getViewportWidth() >= $scope.wideScreenMinViewportWidth;

        $scope.orderUi.movementPickerDisplayMode = shouldUsePanel ? 'panel' : 'modal';

        if ($scope.orderUi.movementPickerDisplayMode === 'panel') {
            return;
        }

        if ($scope.isProductionSiteMode()) {
            $scope.orderUi.movementPickerModal.isOpen = false;
        }
    };

    $scope.isMovementPickerPanelMode = function () {
        return $scope.orderUi.movementPickerDisplayMode === 'panel';
    };

    $scope.shouldShowMovementXPickerModal = function () {
        if ($scope.isIntelligenceMode && $scope.isIntelligenceMode()) return false;
        return $scope.orderUi.movementPickerModal.isOpen
            && $scope.isMovementXMode()
            && !$scope.isMovementPickerPanelMode();
    };

    $scope.shouldShowMovementXPickerPanel = function () {
        if ($scope.isIntelligenceMode && $scope.isIntelligenceMode()) return false;
        return $scope.orderUi.movementPickerModal.isOpen
            && $scope.isMovementXMode()
            && $scope.isMovementPickerPanelMode();
    };

    function readMovementXCoordinate(item, fieldNames) {
        if (!item) return null;

        for (var i = 0; i < fieldNames.length; i++) {
            var parsed = parseInt(item[fieldNames[i]], 10);
            if (!isNaN(parsed)) return parsed;
        }

        return null;
    }

    function isMovementXRecordAtCoordinate(item, x, y, xFields, yFields) {
        var px = parseInt(x, 10);
        var py = parseInt(y, 10);
        if (isNaN(px) || isNaN(py)) return false;

        return readMovementXCoordinate(item, xFields) === px
            && readMovementXCoordinate(item, yFields) === py;
    }

    $scope.hasMovementXArmyUnitAtCoordinate = function (x, y) {
        var report = ($scope.masterData && $scope.masterData.turnReport) || {};
        var landCollections = [
            { name: 'brigades', xFields: ['x_OrState', 'X_OrState', 'x', 'X'], yFields: ['y_OrFleet', 'Y_OrFleet', 'y', 'Y'] },
            { name: 'commanders', xFields: ['x', 'X'], yFields: ['y', 'Y'] },
            { name: 'spies', xFields: ['x', 'X'], yFields: ['y', 'Y'] },
            { name: 'baggageTrains', xFields: ['x', 'X'], yFields: ['y', 'Y'] }
        ];

        var hasLandUnit = landCollections.some(function (collection) {
            return (report[collection.name] || []).some(function (item) {
                return isMovementXRecordAtCoordinate(item, x, y, collection.xFields, collection.yFields);
            });
        });
        if (hasLandUnit) return true;

        return (report.movementItemList || []).some(function (item) {
            return isMovementXRecordAtCoordinate(item, x, y, ['x', 'X'], ['y', 'Y'])
                && !$scope.isNavalMovementItem(item);
        });
    };

    $scope.hasMovementXShipAtCoordinate = function (x, y) {
        var report = ($scope.masterData && $scope.masterData.turnReport) || {};
        var hasShip = ['warships', 'merchantShips'].some(function (collectionName) {
            return (report[collectionName] || []).some(function (ship) {
                return isMovementXRecordAtCoordinate(ship, x, y, ['x', 'X'], ['y', 'Y']);
            });
        });
        if (hasShip) return true;

        return (report.movementItemList || []).some(function (item) {
            return isMovementXRecordAtCoordinate(item, x, y, ['x', 'X'], ['y', 'Y'])
                && $scope.isNavalMovementItem(item);
        });
    };

    $scope.isMovementXArmyUnitDisabled = function (unit) {
        if (!unit || unit.id == null) return false;

        return ($scope.filteredMovementItemsForMap || []).some(function (item) {
            var itemNo = item.originalItemNo != null ? item.originalItemNo : item.itemNo;
            return itemNo == unit.id && item.isSelectable === false;
        });
    };

    $scope.refreshMovementXFormFederations = function () {
        return turnSheetFactory.getTSFormFederations($scope.masterData.turnId).then(function (rows) {
            $scope.movementFormFederationRows = rows || [];
            $scope.refreshFilteredMovementItemsForMap();
            $scope.refreshMovementGridTypeValues();
        });
    };

    function findMovementXItemById(itemId) {
        var movementItem = null;
        angular.forEach($scope.filteredMovementItemsForMap || [], function (item) {
            if (movementItem) {
                return;
            }

            var itemNo = item.originalItemNo != null ? item.originalItemNo : item.itemNo;
            if (itemNo == itemId) {
                movementItem = item;
            }
        });
        return movementItem;
    }

    function toMovementXAssignmentNo(value) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) || parsed <= 0 ? null : parsed;
    }

    function withMovementXAssignment(movementItem, assignmentNo) {
        return angular.extend({}, movementItem, {
            fed: assignmentNo
        });
    }

    $scope.selectMovementXNavyShip = function (ship, selectionType) {
        if (!ship || ship.id == null) return;

        var movementItem = findMovementXItemById(ship.id);
        if (!movementItem) {
            $scope.selectedCoordinateDetails = "Movement ship " + ship.id + " is not available.";
            return;
        }

        var effectiveFleetNo = toMovementXAssignmentNo(ship.fleet);
        var selectedItem = withMovementXAssignment(movementItem, effectiveFleetNo);

        if (selectionType === 'fleet') {
            if (effectiveFleetNo == null || effectiveFleetNo < 11 || effectiveFleetNo > 30) return;
            $scope.movementXSelectedItemNo = effectiveFleetNo;
            $scope.movementXSelectedType = 'Fleet';
            $scope.movementXPickerShowCurrentSelection = true;

            var federationSummary = $scope.getFederationMovementSummary(effectiveFleetNo);
            if (federationSummary && federationSummary.itemNo != null) {
                $scope.selectMovementOrderItem(selectedItem, 'fed');
                return;
            }

            selectedItem = angular.extend({}, selectedItem, {
                itemNo: effectiveFleetNo,
                originalItemNo: effectiveFleetNo,
                itemTypeName: 'Fed'
            });
            $scope.selectMovementOrderItem(selectedItem, 'item');
            return;
        }

        $scope.movementXSelectedItemNo = ship.id;
        $scope.movementXSelectedType = 'Item';
        $scope.movementXPickerShowCurrentSelection = true;
        $scope.selectMovementOrderItem(selectedItem, 'item');
    };

    $scope.isMovementXNavyShipMoved = function (ship) {
        if (!ship || ship.id == null) return false;

        var effectiveFleetNo = toMovementXAssignmentNo(ship.fleet);
        return ($scope.tsMovementList || []).some(function (movementRow) {
            if (!$scope.hasMovementItemNo(movementRow)
                || !$scope.hasAnyMovementDirectionOrDistance(movementRow)) {
                return false;
            }

            var movementItemNo = parseInt(movementRow.itemNo, 10);
            var isFleetOrder = movementItemNo >= 11
                && movementItemNo <= 30
                && effectiveFleetNo != null
                && movementRow.itemNo == effectiveFleetNo;
            return isFleetOrder || movementRow.itemNo == ship.id;
        });
    };

    $scope.selectMovementXArmyUnit = function (unit, selectionType) {
        if (!unit || unit.id == null) {
            return;
        }

        var movementItem = findMovementXItemById(unit.id);
        if (!movementItem) {
            $scope.selectedCoordinateDetails =
                "Movement item " + unit.id + " is not available.";
            return;
        }

        var effectiveFederationNo = toMovementXAssignmentNo(unit.fed);
        var selectedItem = withMovementXAssignment(movementItem, effectiveFederationNo);

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
            selectedItem,
            selectionType === "fed" ? "fed" : "item",
        );
    };

    $scope.isMovementXArmyUnitMoved = function (unit) {
        if (!unit || unit.id == null) {
            return false;
        }

        var effectiveFederationNo = toMovementXAssignmentNo(unit.fed);
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
            if (tsType === 'IncreasePopulationDensity') records = $scope.tsIncreasePopulationDensityList;
            if (tsType === 'TransferGoods') records = $scope.tsTransferGoodsList;

            if (!records) return;

            turnSheetFactory.postTSRecords(records, tsType).then(function (savedRows) {
                if (tsType === 'BuildProductionSites') $scope.tsBuildProductionSitesList = $scope.normalizeBuildProductionSiteRows(savedRows);
                if (tsType === 'IncreasePopulationDensity') $scope.tsIncreasePopulationDensityList = $scope.normalizeIncreasePopulationDensityRows(savedRows);
                if (tsType === 'TransferGoods') {
                    $scope.tsTransferGoodsList = $scope.normalizeTransferGoodsRows(savedRows);
                    $scope.refreshTransferGoodsCostRows();
                }
                if (tsType === 'Movement') $scope.tsMovementList = savedRows;
            });
        }, 100);
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

    $scope.clearCurrentPopulationDensityOrder = function () {
        var currentRow = $scope.currentPopulationDensityOrderRow || $scope.getCurrentPopulationDensityOrderRow();
        if (!currentRow) return;

        $scope.removePopulationDensityRow({ entity: currentRow });
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
        $scope.focusCurrentOrder();
    }, true);

    $scope.$watch('masterData.turnsList', function () {
        $scope.loadPreviousMapCoordinates();
        $scope.rebuildSpyCoordinateReportLookup();
        $scope.rebuildArmyCoordinateLookup();
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
        if (!$scope.isProductionSiteMode() && !($scope.isPopulationDensityMode && $scope.isPopulationDensityMode())) {
            $scope.focusCurrentMovementOrder();
        }
    }, true);

    $scope.$watch('tsBuildProductionSitesList', function () {
        $scope.ensureCurrentOrderIndexForMode('production');
        if ($scope.isProductionSiteMode()) {
            $scope.focusCurrentProductionOrder();
        }
    }, true);

    $scope.$watch('tsIncreasePopulationDensityList', function () {
        $scope.ensureCurrentOrderIndexForMode('populationDensity');
        if ($scope.isPopulationDensityMode()) {
            $scope.focusCurrentPopulationDensityOrder();
        }
    }, true);

    $scope.$watch('selectedProductionSiteRow', function (row) {
        if (!row) return;
        $scope.syncProductionOrderIndexToRow(row);
    });

    $scope.$watch('selectedPopulationDensityRow', function (row) {
        if (!row) return;
        $scope.syncPopulationDensityOrderIndexToRow(row);
    });

    $scope.$on('userSettings:wideScreenChanged', function (event, payload) {
        if (payload && payload.isEnabled !== undefined) {
            $scope.masterData.wideScreenEnabled = payload.isEnabled === true;
        }
        $scope.refreshMovementPickerDisplayMode();
    });

    var onViewportResize = function () {
        $scope.$evalAsync(function () {
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

    turnSheetFactory.getTSIncreasePopulationDensity($scope.masterData.turnId).then(function (tsIncreasePopulationDensityList) {
        $scope.tsIncreasePopulationDensityList = $scope.normalizeIncreasePopulationDensityRows(tsIncreasePopulationDensityList);
        $scope.ensureCurrentOrderIndexForMode('populationDensity');
        $scope.focusCurrentPopulationDensityOrder();
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
