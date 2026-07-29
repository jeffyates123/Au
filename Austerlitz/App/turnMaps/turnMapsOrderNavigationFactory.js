'use strict';

austerlitzModule.factory('turnMapsOrderNavigationFactory', function () {
    return {
        attach: function ($scope) {
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

        if (mode === 'movement') {
            var currentIndex = $scope.ensureCurrentOrderIndexForMode('movement');
            if (currentIndex !== nextIndex) {
                var currentRow = list[currentIndex];
                if ($scope.shouldAutoClearUnroutedMovementOrder(currentRow)) {
                    $scope.clearMovementOrderRowValues(currentRow);
                    $scope.queueAutoSaveTsGrid('Movement');
                }
            }
        }

        $scope.setCurrentOrderIndexForMode(mode, nextIndex);

        if (mode === 'production') {
            $scope.focusCurrentProductionOrder();
            return;
        }

        $scope.focusCurrentMovementOrder();
    };

    $scope.hasAnyMovementDirectionOrDistance = function (movementRow) {
        if (!movementRow) return false;

        for (var segmentNo = 1; segmentNo <= 3; segmentNo++) {
            var directionValue = movementRow['direction' + segmentNo];
            var distanceValue = movementRow['distance' + segmentNo];
            var parsedDirection = parseInt(directionValue, 10);
            var parsedDistance = parseInt(distanceValue, 10);

            if (!isNaN(parsedDirection) && parsedDirection > 0) return true;
            if (!isNaN(parsedDistance) && parsedDistance > 0) return true;

            if (directionValue != null && directionValue.toString().trim() !== '') return true;
            if (distanceValue != null && distanceValue.toString().trim() !== '') return true;
        }

        return false;
    };

    $scope.shouldAutoClearUnroutedMovementOrder = function (movementRow) {
        return $scope.hasMovementItemNo(movementRow)
            && !$scope.hasAnyMovementDirectionOrDistance(movementRow);
    };

    $scope.clearMovementOrderRowValues = function (movementRow) {
        if (!movementRow) return;

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

    $scope.openMovementPickerModal = function (preserveCoordinateFilter) {
        if ($scope.isProductionSiteMode()) return;

        if ($scope.isMovementXMode() && !preserveCoordinateFilter) {
            $scope.movementXPickerPositionFilter = null;
            $scope.movementXPickerShowCurrentSelection = false;
            if ($scope.selectedMapChoice) {
                $scope.movementXPickerSphereFilter =
                    $scope.getMovementPickerSphereFromCoordinates(
                        $scope.selectedMapChoice.minX,
                        $scope.selectedMapChoice.minY
                    );
            }
        }

        $scope.refreshMovementPickerDisplayMode();
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

    $scope.findMovementOrderIndexByItemNo = function (itemNo) {
        if (itemNo == null || itemNo === '' || !$scope.tsMovementList || !$scope.tsMovementList.length) return -1;

        var foundIndex = -1;
        angular.forEach($scope.tsMovementList, function (movementRow, idx) {
            if (foundIndex !== -1) return;
            if (!$scope.hasMovementItemNo(movementRow)) return;
            if (!$scope.hasAnyMovementDirectionOrDistance(movementRow)) return;

            if (movementRow.itemNo == itemNo) {
                foundIndex = idx;
            }
        });

        return foundIndex;
    };

    $scope.getNextEmptyMovementOrderIndex = function () {
        if (!$scope.tsMovementList || !$scope.tsMovementList.length) return -1;

        var listLength = $scope.tsMovementList.length;
        var currentIndex = parseInt($scope.getCurrentOrderIndexForMode('movement'), 10);
        if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= listLength) {
            currentIndex = -1;
        }

        for (var offset = 1; offset <= listLength; offset++) {
            var candidateIndex = (currentIndex + offset) % listLength;
            if (!$scope.hasMovementItemNo($scope.tsMovementList[candidateIndex])) {
                return candidateIndex;
            }
        }

        return -1;
    };

    $scope.getCurrentOrNextEmptyMovementOrderIndex = function () {
        if (!$scope.tsMovementList || !$scope.tsMovementList.length) return -1;

        var currentIndex = parseInt($scope.getCurrentOrderIndexForMode('movement'), 10);
        if (!isNaN(currentIndex)
            && currentIndex >= 0
            && currentIndex < $scope.tsMovementList.length
            && (!$scope.hasMovementItemNo($scope.tsMovementList[currentIndex])
                || $scope.shouldAutoClearUnroutedMovementOrder($scope.tsMovementList[currentIndex]))) {
            return currentIndex;
        }

        return $scope.getNextEmptyMovementOrderIndex();
    };

    $scope.findNextEmptyMovementOrder = function () {
        var emptyIndex = $scope.getNextEmptyMovementOrderIndex();
        if (emptyIndex < 0) {
            alert('No empty movement order found.');
            return false;
        }

        $scope.selectOrderByIndex('movement', emptyIndex);
        return true;
    };

    $scope.selectMovementOrderItem = function (itemRow, selectionType) {
        if (!itemRow) return;
        if (itemRow.isSelectable === false) return;
        $scope.orderUi.suppressCoordinatePickerOpenUntil = new Date().getTime() + 400;

        var selectedItemNo = itemRow.originalItemNo != null ? itemRow.originalItemNo : itemRow.itemNo;
        var selectedType = itemRow.itemTypeName;
        var selectedMp = itemRow.mp;
        var selectedXy = itemRow.xy;
        var selectedFederationNo = itemRow.fed;

        if (selectionType === 'fed' && itemRow.fed != null && itemRow.fed !== '') {
            var federationSummary = $scope.getFederationMovementSummary(itemRow.fed);
            if (!federationSummary || federationSummary.itemNo == null) return;

            selectedItemNo = federationSummary.itemNo;
            selectedType = 'Fed';
            selectedMp = federationSummary.mp;
            selectedXy = federationSummary.x + '/' + federationSummary.y;
            selectedFederationNo = federationSummary.itemNo;
        }

        var exactMatchIndex = $scope.findMovementOrderIndexByItemNo(selectedItemNo);
        if (exactMatchIndex >= 0) {
            $scope.selectOrderByIndex('movement', exactMatchIndex);
            if (!$scope.isMovementPickerPanelMode()) {
                $scope.closeMovementPickerModal();
            }
            return;
        }

        if (selectedFederationNo != null && selectedFederationNo !== '') {
            var federationMatchIndex = $scope.findMovementOrderIndexByItemNo(selectedFederationNo);
            if (federationMatchIndex >= 0) {
                $scope.selectOrderByIndex('movement', federationMatchIndex);
                if (!$scope.isMovementPickerPanelMode()) {
                    $scope.closeMovementPickerModal();
                }
                return;
            }
        }

        var emptyIndex = $scope.getCurrentOrNextEmptyMovementOrderIndex();
        if (emptyIndex < 0) {
            alert('No empty movement order found.');
            return;
        }
        $scope.selectOrderByIndex('movement', emptyIndex);

        var targetRow = $scope.getCurrentMovementOrderRow();
        if (!targetRow) {
            alert('Unable to select a movement order.');
            return;
        }

        targetRow.itemNo = selectedItemNo;
        targetRow.type = selectedType;
        targetRow.mp = selectedMp;
        targetRow.xy = selectedXy;
        $scope.clearMovementRouteSegments(targetRow);

        if (!$scope.isMovementPickerPanelMode()) {
            $scope.closeMovementPickerModal();
        }
        $scope.focusCurrentMovementOrder();
        $scope.queueAutoSaveTsGrid('Movement');
    };

    $scope.selectMovementOrderItemFromPickerRow = function (itemRow) {
        if (!itemRow) return;
        if (itemRow.isSelectable === false) {
            if (itemRow.disableReasonTooltip) {
                $scope.selectedCoordinateDetails = itemRow.disableReasonTooltip;
            }
            return;
        }

        if ($scope.isItemRowAlreadyInMovementGrid(itemRow)) {
            $scope.selectMovementOrderItem(itemRow, 'item');
            return;
        }

        if ($scope.isFederationRowAlreadyInMovementGrid(itemRow)) {
            $scope.selectMovementOrderItem(itemRow, 'fed');
            return;
        }

        $scope.selectMovementOrderItem(itemRow, 'item');
    };

        }
    };
});
