'use strict';

austerlitzModule.controller('landUnitsController', function ($scope, $q, masterData, turnDataLoaderService, rulesCatalogFactory, turnSheetFactory) {
    $scope.masterData = masterData;
    $scope.brigadeRows = [];
    $scope.isLoading = false;
    $scope.loadError = null;
    $scope.replayWarnings = [];
    $scope.armyListRows = [];
    $scope.armyListByShortName = {};
    $scope.headcountModal = {
        isOpen: false,
        brigade: null,
        targetHeadcount: 800,
        scope: 'brigade',
        preview: calculateEmptyHeadcountPreview()
    };
    $scope.trainModal = {
        isOpen: false,
        brigade: null,
        scope: 'brigade',
        preview: calculateEmptyTrainPreview()
    };
    $scope.battalionAction = {
        type: null,
        source: null,
        eligibleKeys: {}
    };
    $scope.addBattalionModal = {
        isOpen: false,
        brigade: null,
        selectedArmyItem: null,
        cost: calculateEmptyAdditionalBattalionCost()
    };
    $scope.formFederationModal = {
        isOpen: false,
        brigade: null,
        targetFederationNo: null,
        validationError: '',
        coordinateBrigades: [],
        stagedOrders: []
    };
    $scope.sphereOptions = ['All', 'Europe', 'Caribbean', 'India'];
    $scope.selectedSphere = getInitialSphereFilter();

    $scope.brigadeActions = [
        'Movement',
        'Rename',
        'Add Battalion',
        'Headcount',
        'Experience',
        'Exchange Battalions',
        'Merge Battalions',
        'Form Federation',
        'Boarding',
        'Demolish'
    ];

    $scope.initLandUnits = function () {
        if (!$scope.masterData || !$scope.masterData.turnId || $scope.masterData.turnId === 'Unknown') {
            $scope.brigadeRows = [];
            return;
        }

        if ($scope.masterData.turnReport && $scope.masterData.turnReport.brigades) {
            $scope.refreshBrigadeRows();
            $scope.loadArmyListForHeadcountCosts().then($scope.replayBrigadeTurnOrders);
            return;
        }

        $scope.isLoading = true;
        $scope.loadError = null;
        turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId).then(function () {
            $scope.refreshBrigadeRows();
            return $scope.loadArmyListForHeadcountCosts().then($scope.replayBrigadeTurnOrders);
        }, function (error) {
            $scope.loadError = (error && error.data) ? error.data : 'Unable to load turn report.';
            $scope.brigadeRows = [];
        }).finally(function () {
            $scope.isLoading = false;
        });
    };

    $scope.loadArmyListForHeadcountCosts = function () {
        var stateCode = getTurnStateCode();
        return rulesCatalogFactory.getArmyList(stateCode).then(function (armyList) {
            $scope.armyListRows = armyList || [];
            $scope.armyListByShortName = buildArmyListLookup(armyList);
        }, function () {
            $scope.armyListRows = [];
            $scope.armyListByShortName = {};
        });
    };

    $scope.replayBrigadeTurnOrders = function () {
        if (!$scope.masterData || !$scope.masterData.turnId || $scope.masterData.turnId === 'Unknown') {
            return;
        }

        $scope.replayWarnings = [];

        return $q.all([
            turnSheetFactory.getTSSetUpAdditionalBrigades($scope.masterData.turnId),
            turnSheetFactory.getTSIncreaseHeadcount($scope.masterData.turnId),
            turnSheetFactory.getTSIncreaseBrigadeXP($scope.masterData.turnId),
            turnSheetFactory.getTSExchangeBattalions($scope.masterData.turnId),
            turnSheetFactory.getTSMergeBattalions($scope.masterData.turnId),
            turnSheetFactory.getTSFormFederations($scope.masterData.turnId)
        ]).then(function (results) {
            var warnings = [];

            replaySetUpAdditionalBrigades(results[0], warnings);
            replayIncreaseHeadcount(results[1], warnings);
            replayIncreaseBrigadeXP(results[2], warnings);
            replayExchangeBattalions(results[3], warnings);
            replayMergeBattalions(results[4], warnings);
            replayFormFederations(results[5], warnings);

            $scope.replayWarnings = warnings;
        }, function (error) {
            $scope.replayWarnings = [(error && error.data) ? error.data : 'Unable to load saved brigade turn orders.'];
        });
    };

    $scope.refreshBrigadeRows = function () {
        var brigades = ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.brigades)
            ? $scope.masterData.turnReport.brigades
            : [];

        $scope.brigadeRows = brigades.map(function (brigade) {
            return {
                id: brigade.itemNo,
                name: trimValue(brigade.name),
                position: formatPosition(brigade),
                fed: formatFederation(brigade.federation),
                originalFed: formatFederation(brigade.federation),
                fedChanged: false,
                mp: brigade.mp,
                battalions: buildBattalionDisplays(brigade),
                trainSelected: false,
                trainPlan: null,
                headcountSelected: false,
                headcountPlan: null,
                resources: calculatePlaceholderResources(),
                source: brigade
            };
        }).sort(function (left, right) {
            return (parseInt(left.id, 10) || 0) - (parseInt(right.id, 10) || 0);
        });
    };

    $scope.filteredBrigadeRows = function () {
        if (!$scope.selectedSphere || $scope.selectedSphere === 'All') {
            return $scope.brigadeRows;
        }

        return $scope.brigadeRows.filter(function (brigade) {
            return getBrigadeSphere(brigade) === $scope.selectedSphere;
        });
    };

    $scope.onSphereChanged = function () {
        try {
            window.localStorage.setItem('austerlitz.landUnits.selectedSphere', $scope.selectedSphere || 'All');
        }
        catch (e) {
        }
    };

    $scope.openFormFederationModal = function (brigade, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();
        if (!brigade) {
            return;
        }

        var targetFederationNo = parseInt(brigade.fed, 10);
        if (isNaN(targetFederationNo)) {
            targetFederationNo = getNextAvailableLandFederationNo();
            if (targetFederationNo == null) {
                alert('No available land federation numbers (61-90).');
                targetFederationNo = '';
            }
        }

        $scope.formFederationModal.isOpen = true;
        $scope.formFederationModal.brigade = brigade;
        $scope.formFederationModal.targetFederationNo = targetFederationNo;
        $scope.formFederationModal.validationError = '';
        $scope.formFederationModal.coordinateBrigades = getSameCoordinateBrigades(brigade);
        $scope.formFederationModal.stagedOrders = [];

        stageFormFederationBrigade(brigade, true);
    };

    $scope.closeFormFederationModal = function () {
        $scope.formFederationModal.isOpen = false;
        $scope.formFederationModal.brigade = null;
        $scope.formFederationModal.targetFederationNo = null;
        $scope.formFederationModal.validationError = '';
        $scope.formFederationModal.coordinateBrigades = [];
        $scope.formFederationModal.stagedOrders = [];
    };

    $scope.selectNextAvailableFederationNo = function () {
        if ($scope.isFormFederationTargetLocked()) {
            return;
        }

        var nextFederationNo = getNextAvailableLandFederationNo();
        if (nextFederationNo == null) {
            alert('No available land federation numbers (61-90).');
            return;
        }

        $scope.formFederationModal.targetFederationNo = nextFederationNo;
        $scope.onFormFederationTargetChanged();
    };

    $scope.onFormFederationTargetChanged = function () {
        if ($scope.isFormFederationTargetLocked()) {
            return;
        }

        var targetFederationNo = getFormFederationTargetNo();
        if (!isValidTargetFederationNo(targetFederationNo)) {
            return;
        }

        angular.forEach($scope.formFederationModal.stagedOrders, function (order) {
            order.federation_Fleet = targetFederationNo;
        });
        removeNoOpFormFederationOrders();
    };

    $scope.stageFormFederationBrigade = function (brigade) {
        stageFormFederationBrigade(brigade, false);
    };

    $scope.canStageFormFederationBrigade = function (brigade) {
        var targetFederationNo = getFormFederationTargetNo();
        return !!brigade
            && isValidTargetFederationNo(targetFederationNo)
            && getEffectiveFederationNo(brigade) !== targetFederationNo;
    };

    $scope.stageFormFederationFed = function (brigade) {
        if (!$scope.canStageFormFederationFed(brigade)) {
            if (!brigade || !brigade.fed) {
                alert('This brigade is not currently in a federation.');
            }
            return;
        }

        var sourceFederationNo = parseInt(brigade.fed, 10);
        if (isNaN(sourceFederationNo)) {
            return;
        }

        stageFormFederationOrder({
            type: 'federation',
            itemNo: sourceFederationNo,
            federation_Fleet: getFormFederationTargetNo(),
            sourceFederationNo: sourceFederationNo,
            sourceBrigadeId: brigade.id,
            affectedBrigadeIds: getBrigadesByFederation(sourceFederationNo).map(function (row) { return row.id; })
        });
    };

    $scope.canStageFormFederationFed = function (brigade) {
        if (!brigade || !brigade.fed) {
            return false;
        }

        var targetFederationNo = getFormFederationTargetNo();
        var sourceFederationNo = parseInt(brigade.fed, 10);
        return !isNaN(sourceFederationNo)
            && isValidTargetFederationNo(targetFederationNo)
            && getEffectiveFederationNo(brigade) !== targetFederationNo
            && sourceFederationNo !== targetFederationNo;
    };

    $scope.isFormFederationTargetLocked = function () {
        return ($scope.formFederationModal.stagedOrders || []).length > 0;
    };

    $scope.getFormFederationDisplayFed = function (brigade) {
        var federationNo = getEffectiveFederationNo(brigade);
        return federationNo > 0 ? federationNo : '-';
    };

    $scope.isFormFederationOriginal = function (brigade) {
        return !!($scope.formFederationModal.brigade && brigade && sameNullableInt($scope.formFederationModal.brigade.id, brigade.id));
    };

    $scope.isFormFederationStaged = function (brigade) {
        if (!brigade) {
            return false;
        }

        var stagedIds = getFormFederationStagedBrigadeIds();
        return !!stagedIds[brigade.id];
    };

    $scope.saveFormFederationModal = function () {
        if (!isValidTargetFederationNo(getFormFederationTargetNo())) {
            return;
        }

        var stagedOrders = $scope.formFederationModal.stagedOrders || [];
        if (!stagedOrders.length) {
            alert('No federation changes are staged.');
            return;
        }

        persistFormFederationOrders(stagedOrders);
    };

    $scope.beginRenameBrigade = function (brigade) {
        if (!brigade) {
            return;
        }

        brigade.isRenaming = true;
        brigade.pendingName = brigade.name;
    };

    $scope.onRenameKeydown = function ($event, brigade) {
        if ($event.keyCode === 13) {
            $event.preventDefault();
            $scope.applyRenameBrigade(brigade);
        }
        else if ($event.keyCode === 27) {
            $event.preventDefault();
            $scope.cancelRenameBrigade(brigade);
        }
    };

    $scope.applyRenameBrigade = function (brigade) {
        if (!brigade || !brigade.isRenaming) {
            return;
        }

        var newName = trimValue(brigade.pendingName).substr(0, 15);
        if (!newName) {
            newName = brigade.name;
        }

        brigade.name = newName;
        brigade.isRenaming = false;
        brigade.pendingName = null;
        persistRenameOrder(brigade, newName);
    };

    $scope.cancelRenameBrigade = function (brigade) {
        if (!brigade) {
            return;
        }

        brigade.isRenaming = false;
        brigade.pendingName = null;
    };

    $scope.toggleBrigadeFlag = function (brigade, flagName) {
        if (!brigade) {
            return;
        }

        brigade[flagName] = !brigade[flagName];
        brigade.resources = calculatePlaceholderResources(brigade);
    };

    $scope.openHeadcountModal = function (brigade) {
        if (!brigade) {
            return;
        }

        if (brigadeHasLockedBattalion(brigade)) {
            alertLockedTurnOrder('Increase headcount', brigade);
            return;
        }

        if (!isBrigadeAtBarracks(brigade)) {
            alert('Headcount can only be increased when the brigade is at one of your barracks.');
            return;
        }

        $scope.headcountModal.isOpen = true;
        $scope.headcountModal.brigade = brigade;
        $scope.headcountModal.targetHeadcount = brigade.headcountPlan ? brigade.headcountPlan.targetHeadcount : 800;
        $scope.headcountModal.scope = brigade.headcountPlan ? brigade.headcountPlan.scope : 'brigade';

        if ($scope.headcountModal.scope === 'federation' && !canApplyFederationScope(brigade)) {
            $scope.headcountModal.scope = 'brigade';
        }

        $scope.refreshHeadcountPreview();
    };

    $scope.closeHeadcountModal = function () {
        $scope.headcountModal.isOpen = false;
        $scope.headcountModal.brigade = null;
        $scope.headcountModal.preview = calculateEmptyHeadcountPreview();
    };

    $scope.canApplyFederationScope = function (brigade) {
        return canApplyFederationScope(brigade);
    };

    $scope.onHeadcountScopeChanged = function () {
        if ($scope.headcountModal.scope === 'federation' && !canApplyFederationScope($scope.headcountModal.brigade)) {
            $scope.headcountModal.scope = 'brigade';
        }
        $scope.refreshHeadcountPreview();
    };

    $scope.refreshHeadcountPreview = function () {
        var brigade = $scope.headcountModal.brigade;
        if (!brigade) {
            $scope.headcountModal.preview = calculateEmptyHeadcountPreview();
            return;
        }

        var targetHeadcount = normalizeTargetHeadcount($scope.headcountModal.targetHeadcount);
        var affectedBrigades = getHeadcountAffectedBrigades(brigade, $scope.headcountModal.scope);
        $scope.headcountModal.preview = calculateHeadcountPreview(affectedBrigades, targetHeadcount);
    };

    $scope.applyHeadcountPlan = function () {
        var brigade = $scope.headcountModal.brigade;
        if (!brigade) {
            return;
        }

        var targetHeadcount = normalizeTargetHeadcount($scope.headcountModal.targetHeadcount);
        var scope = $scope.headcountModal.scope === 'federation' && canApplyFederationScope(brigade) ? 'federation' : 'brigade';
        var affectedBrigades = getHeadcountAffectedBrigades(brigade, scope);
        if (hasAnyLockedBrigade(affectedBrigades, 'Increase headcount')) {
            return;
        }

        angular.forEach(affectedBrigades, function (affectedBrigade) {
            applyHeadcountPlanToBrigade(affectedBrigade, targetHeadcount, scope, brigade.id);
        });

        persistHeadcountOrder(brigade, scope, targetHeadcount);
        $scope.closeHeadcountModal();
    };

    $scope.clearHeadcountPlan = function () {
        var brigade = $scope.headcountModal.brigade;
        if (!brigade) {
            return;
        }

        var scope = $scope.headcountModal.scope === 'federation' && canApplyFederationScope(brigade) ? 'federation' : 'brigade';
        var affectedBrigades = getHeadcountAffectedBrigades(brigade, scope);
        angular.forEach(affectedBrigades, clearHeadcountPlanFromBrigade);

        clearHeadcountOrder(brigade, scope);
        $scope.closeHeadcountModal();
    };

    $scope.openTrainModal = function (brigade) {
        if (!brigade) {
            return;
        }

        if (brigadeHasLockedBattalion(brigade)) {
            alertLockedTurnOrder('Training', brigade);
            return;
        }

        if (!isBrigadeAtBarracks(brigade)) {
            alert('Training can only be done when the brigade is at one of your barracks.');
            return;
        }

        $scope.trainModal.isOpen = true;
        $scope.trainModal.brigade = brigade;
        $scope.trainModal.scope = brigade.trainPlan ? brigade.trainPlan.scope : 'brigade';

        if ($scope.trainModal.scope === 'federation' && !canApplyFederationScope(brigade)) {
            $scope.trainModal.scope = 'brigade';
        }

        $scope.refreshTrainPreview();
    };

    $scope.closeTrainModal = function () {
        $scope.trainModal.isOpen = false;
        $scope.trainModal.brigade = null;
        $scope.trainModal.preview = calculateEmptyTrainPreview();
    };

    $scope.onTrainScopeChanged = function () {
        if ($scope.trainModal.scope === 'federation' && !canApplyFederationScope($scope.trainModal.brigade)) {
            $scope.trainModal.scope = 'brigade';
        }
        $scope.refreshTrainPreview();
    };

    $scope.refreshTrainPreview = function () {
        var brigade = $scope.trainModal.brigade;
        if (!brigade) {
            $scope.trainModal.preview = calculateEmptyTrainPreview();
            return;
        }

        var affectedBrigades = getHeadcountAffectedBrigades(brigade, $scope.trainModal.scope);
        $scope.trainModal.preview = calculateTrainPreview(affectedBrigades);
    };

    $scope.applyTrainPlan = function () {
        var brigade = $scope.trainModal.brigade;
        if (!brigade) {
            return;
        }

        var scope = $scope.trainModal.scope === 'federation' && canApplyFederationScope(brigade) ? 'federation' : 'brigade';
        var affectedBrigades = getHeadcountAffectedBrigades(brigade, scope);
        if (hasAnyLockedBrigade(affectedBrigades, 'Training')) {
            return;
        }

        angular.forEach(affectedBrigades, function (affectedBrigade) {
            applyTrainPlanToBrigade(affectedBrigade, scope, brigade.id);
        });

        persistTrainOrder(brigade, scope);
        $scope.closeTrainModal();
    };

    $scope.clearTrainPlan = function () {
        var brigade = $scope.trainModal.brigade;
        if (!brigade) {
            return;
        }

        var scope = $scope.trainModal.scope === 'federation' && canApplyFederationScope(brigade) ? 'federation' : 'brigade';
        var affectedBrigades = getHeadcountAffectedBrigades(brigade, scope);
        angular.forEach(affectedBrigades, clearTrainPlanFromBrigade);

        clearTrainOrder(brigade, scope);
        $scope.closeTrainModal();
    };

    $scope.getBrigadeToggleStyle = function (isSelected) {
        if (!isSelected) {
            return {};
        }

        var stateColor = getStateColor();
        return {
            'background-color': stateColor.backgroundColor,
            color: stateColor.textColor,
            'border-color': stateColor.backgroundColor
        };
    };

    $scope.selectBrigadeAction = function (actionName, brigade) {
        if (actionName === 'Form Federation') {
            $scope.openFormFederationModal(brigade);
            return;
        }

        var brigadeName = brigade && brigade.name ? brigade.name : 'selected brigade';
        alert(actionName + ' for ' + brigadeName + ' is not implemented yet.');
    };

    $scope.startBattalionAction = function (actionType, brigade, battalion, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if (!brigade || !battalion) {
            $scope.resetBattalionAction();
            return;
        }

        if (!hasNumericCoordinate(brigade)) {
            alert('Battalion actions require a brigade at a map coordinate.');
            $scope.resetBattalionAction();
            return;
        }

        if (actionType === 'merge' && !battalion.type) {
            alert('Choose a non-empty battalion to start a merge.');
            $scope.resetBattalionAction();
            return;
        }

        if (battalion.isNewAddition) {
            alert('A newly added additional battalion cannot be exchanged or merged in the same turn.');
            $scope.resetBattalionAction();
            return;
        }

        if (isBattalionLockedForOrders(battalion)) {
            alertLockedTurnOrder(actionType === 'merge' ? 'Merge' : 'Exchange', brigade);
            $scope.resetBattalionAction();
            return;
        }

        $scope.battalionAction = {
            type: actionType,
            source: { brigade: brigade, battalion: battalion },
            eligibleKeys: buildEligibleBattalionKeyMap(actionType, brigade, battalion)
        };
    };

    $scope.onBattalionLozengeClick = function ($event, brigade, battalion) {
        if (!$scope.battalionAction.type) {
            return;
        }

        if ($event && $event.preventDefault) $event.preventDefault();

        if (!isBattalionEligibleTarget(brigade, battalion)) {
            $scope.resetBattalionAction();
            return;
        }

        var source = $scope.battalionAction.source;
        if (!source || isSameBattalionSlot(source.brigade, source.battalion, brigade, battalion)) {
            $scope.resetBattalionAction();
            return;
        }

        if (isBattalionLockedForOrders(source.battalion) || isBattalionLockedForOrders(battalion)) {
            alertLockedTurnOrder($scope.battalionAction.type === 'merge' ? 'Merge' : 'Exchange', isBattalionLockedForOrders(source.battalion) ? source.brigade : brigade);
            $scope.resetBattalionAction();
            return;
        }

        if ($scope.battalionAction.type === 'exchange') {
            exchangeBattalions(source.brigade, source.battalion, brigade, battalion);
            persistExchangeBattalionOrder(source.brigade, source.battalion, brigade, battalion);
        }
        else if ($scope.battalionAction.type === 'merge') {
            mergeBattalions(source.brigade, source.battalion, brigade, battalion);
            persistMergeBattalionOrder(source.brigade, source.battalion, brigade, battalion);
        }

        $scope.resetBattalionAction();
    };

    $scope.resetBattalionAction = function () {
        $scope.battalionAction = {
            type: null,
            source: null,
            eligibleKeys: {}
        };
    };

    $scope.isBattalionActionSource = function (brigade, battalion) {
        var source = $scope.battalionAction.source;
        return !!(source && isSameBattalionSlot(source.brigade, source.battalion, brigade, battalion));
    };

    $scope.isBattalionEligibleTarget = function (brigade, battalion) {
        return isBattalionEligibleTarget(brigade, battalion);
    };

    $scope.canStartMerge = function (battalion) {
        return !!(battalion && battalion.type);
    };

    $scope.isBattalionLockedForOrders = function (battalion) {
        return isBattalionLockedForOrders(battalion);
    };

    $scope.brigadeHasLockedBattalion = function (brigade) {
        return brigadeHasLockedBattalion(brigade);
    };

    $scope.getBattalionTitle = function (battalion) {
        if (isBattalionLockedForOrders(battalion)) {
            return 'This battalion has already been used in Exchange Battalions or Merge Battalions this turn.';
        }

        return battalion && battalion.isEfChanged ? 'EF changed from ' + battalion.originalEf + ' to ' + battalion.currentEf : '';
    };

    $scope.clearBattalionTurnOrder = function (brigade, battalion, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if (!brigade || !battalion || !isBattalionLockedForOrders(battalion)) {
            return;
        }

        if (!window.confirm('Clear the Exchange Battalions or Merge Battalions order for this battalion?')) {
            return;
        }

        var clearedOrders = [];
        $q.all([
            clearExchangeBattalionOrders(brigade, battalion, clearedOrders),
            clearMergeBattalionOrders(brigade, battalion, clearedOrders)
        ]).then(function () {
            if (!clearedOrders.length) {
                alert('No matching Exchange Battalions or Merge Battalions order was found for this battalion.');
                return;
            }

            $scope.resetBattalionAction();
            $scope.refreshBrigadeRows();
            $scope.loadArmyListForHeadcountCosts().then(function () {
                $scope.replayBrigadeTurnOrders();
            });
            alert('Cleared ' + clearedOrders.join(', ') + '.');
        }, showTurnSheetOrderError);
    };

    $scope.openAddBattalionModal = function (brigade, battalion, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();

        if (!brigade || !battalion || battalion.type) {
            return;
        }

        if (brigadeHasLockedBattalion(brigade)) {
            alertLockedTurnOrder('Set up additional battalion', brigade);
            return;
        }

        if (!findFirstFreeBattalion(brigade)) {
            alert("can't be done as no space");
            return;
        }

        $scope.addBattalionModal.isOpen = true;
        $scope.addBattalionModal.brigade = brigade;
        $scope.addBattalionModal.selectedArmyItem = null;
        $scope.addBattalionModal.cost = calculateEmptyAdditionalBattalionCost();
    };

    $scope.closeAddBattalionModal = function () {
        $scope.addBattalionModal.isOpen = false;
        $scope.addBattalionModal.brigade = null;
        $scope.addBattalionModal.selectedArmyItem = null;
        $scope.addBattalionModal.cost = calculateEmptyAdditionalBattalionCost();
    };

    $scope.getAdditionalBattalionOptions = function () {
        var brigade = $scope.addBattalionModal.brigade;
        if (!brigade) {
            return [];
        }

        var sphere = getBrigadeSphere(brigade);
        return ($scope.armyListRows || []).filter(function (armyItem) {
            return isArmyItemValidForAdditionalBattalion(armyItem, sphere);
        });
    };

    $scope.selectAdditionalBattalion = function (armyItem) {
        $scope.addBattalionModal.selectedArmyItem = armyItem;
        $scope.addBattalionModal.cost = calculateAdditionalBattalionCost(armyItem);
    };

    $scope.saveAdditionalBattalion = function () {
        var brigade = $scope.addBattalionModal.brigade;
        var armyItem = $scope.addBattalionModal.selectedArmyItem;
        var targetBattalion = findFirstFreeBattalion(brigade);

        if (brigadeHasLockedBattalion(brigade)) {
            alertLockedTurnOrder('Set up additional battalion', brigade);
            return;
        }

        if (!brigade || !armyItem || !targetBattalion) {
            alert("can't be done as no space");
            return;
        }

        turnSheetFactory.getTSSetUpAdditionalBrigades($scope.masterData.turnId).then(function (rows) {
            var targetRow = findMatchingAdditionalBattalionRow(rows, brigade.id)
                || findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeNo', 'battType'], 6);

            if (!targetRow) {
                alert("can't be done as no space");
                return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.brigadeNo = brigade.id;
            targetRow.battType = armyItem.itemNo;

            turnSheetFactory.postTSRecords(rows, 'SetUpAdditionalBrigades').then(function () {
                applyAdditionalBattalionPreview(brigade, targetBattalion, armyItem);
                $scope.closeAddBattalionModal();
            }, showTurnSheetOrderError);
        }, showTurnSheetOrderError);
    };

    function buildEligibleBattalionKeyMap(actionType, sourceBrigade, sourceBattalion) {
        var eligible = {};
        angular.forEach($scope.brigadeRows, function (brigade) {
            angular.forEach(brigade.battalions, function (battalion) {
                if (isSameBattalionSlot(sourceBrigade, sourceBattalion, brigade, battalion)) {
                    return;
                }

                if (battalion.isNewAddition) {
                    return;
                }

                if (isBattalionLockedForOrders(battalion)) {
                    return;
                }

                if (actionType === 'exchange' && isSameCoordinate(sourceBrigade, brigade)) {
                    eligible[getBattalionKey(brigade, battalion)] = true;
                    return;
                }

                if (actionType === 'merge'
                    && sourceBattalion.type
                    && battalion.type
                    && sourceBattalion.type === battalion.type
                    && isSameCoordinate(sourceBrigade, brigade)) {
                    eligible[getBattalionKey(brigade, battalion)] = true;
                }
            });
        });

        return eligible;
    }

    function replaySetUpAdditionalBrigades(rows, warnings) {
        angular.forEach(getFilledRowsInOrder(rows, ['brigadeNo', 'battType']), function (row) {
            var brigade = getBrigadeById(row.brigadeNo);
            var armyItem = getArmyItemByItemNo(row.battType);
            if (!brigade) {
                addReplayWarning(warnings, 'TS04', row, 'brigade not found: ' + row.brigadeNo);
                return;
            }
            if (!armyItem) {
                addReplayWarning(warnings, 'TS04', row, 'army item not found: ' + row.battType);
                return;
            }

            var targetBattalion = findFirstFreeBattalion(brigade);
            if (!targetBattalion) {
                addReplayWarning(warnings, 'TS04', row, 'no free battalion slot for brigade ' + row.brigadeNo);
                return;
            }

            applyAdditionalBattalionPreview(brigade, targetBattalion, armyItem);
        });
    }

    function replayIncreaseHeadcount(rows, warnings) {
        angular.forEach(getFilledRowsInOrder(rows, ['brigadeOrFederation', 'increaseAmount']), function (row) {
            var targetHeadcount = normalizeTargetHeadcount(row.increaseAmount);
            var affectedBrigades = getBrigadeOrFederationAffectedBrigades(row.brigadeOrFederation);
            if (!affectedBrigades.length) {
                addReplayWarning(warnings, 'TS05', row, 'brigade/federation not found: ' + row.brigadeOrFederation);
                return;
            }

            var scope = getReplayScope(row.brigadeOrFederation);
            angular.forEach(affectedBrigades, function (brigade) {
                applyHeadcountPlanToBrigade(brigade, targetHeadcount, scope, row.brigadeOrFederation);
            });
        });
    }

    function replayIncreaseBrigadeXP(rows, warnings) {
        angular.forEach(getFilledRowsInOrder(rows, ['brigadeOrFederation']), function (row) {
            var affectedBrigades = getBrigadeOrFederationAffectedBrigades(row.brigadeOrFederation);
            if (!affectedBrigades.length) {
                addReplayWarning(warnings, 'TS06', row, 'brigade/federation not found: ' + row.brigadeOrFederation);
                return;
            }

            var scope = getReplayScope(row.brigadeOrFederation);
            angular.forEach(affectedBrigades, function (brigade) {
                applyTrainPlanToBrigade(brigade, scope, row.brigadeOrFederation);
            });
        });
    }

    function replayExchangeBattalions(rows, warnings) {
        angular.forEach(getFilledRowsInOrder(rows, ['brigadeA', 'battA', 'brigadeB', 'battB']), function (row) {
            var left = getReplayBattalionRef(row.brigadeA, row.battA);
            var right = getReplayBattalionRef(row.brigadeB, row.battB);
            if (!left || !right) {
                addReplayWarning(warnings, 'Exchange Battalions', row, 'brigade or battalion slot not found');
                return;
            }
            if (!isSameCoordinate(left.brigade, right.brigade)) {
                addReplayWarning(warnings, 'Exchange Battalions', row, 'brigades are not at the same coordinate');
                return;
            }
            if (left.battalion.isNewAddition || right.battalion.isNewAddition) {
                addReplayWarning(warnings, 'Exchange Battalions', row, 'newly added battalions cannot be exchanged in the same turn');
                return;
            }
            if (isBattalionLockedForOrders(left.battalion) || isBattalionLockedForOrders(right.battalion)) {
                addReplayWarning(warnings, 'Exchange Battalions', row, 'battalion already used by Exchange Battalions or Merge Battalions this turn');
                return;
            }

            exchangeBattalions(left.brigade, left.battalion, right.brigade, right.battalion);
        });
    }

    function replayMergeBattalions(rows, warnings) {
        angular.forEach(getFilledRowsInOrder(rows, ['bridageA', 'battA', 'brigadeB', 'battB']), function (row) {
            var source = getReplayBattalionRef(row.bridageA, row.battA);
            var target = getReplayBattalionRef(row.brigadeB, row.battB);
            if (!source || !target) {
                addReplayWarning(warnings, 'Merge Battalions', row, 'brigade or battalion slot not found');
                return;
            }
            if (!isSameCoordinate(source.brigade, target.brigade)) {
                addReplayWarning(warnings, 'Merge Battalions', row, 'brigades are not at the same coordinate');
                return;
            }
            if (source.battalion.isNewAddition || target.battalion.isNewAddition) {
                addReplayWarning(warnings, 'Merge Battalions', row, 'newly added battalions cannot be merged in the same turn');
                return;
            }
            if (isBattalionLockedForOrders(source.battalion) || isBattalionLockedForOrders(target.battalion)) {
                addReplayWarning(warnings, 'Merge Battalions', row, 'battalion already used by Exchange Battalions or Merge Battalions this turn');
                return;
            }
            if (!source.battalion.type || !target.battalion.type || source.battalion.type !== target.battalion.type) {
                addReplayWarning(warnings, 'Merge Battalions', row, 'battalion types do not match');
                return;
            }

            mergeBattalions(source.brigade, source.battalion, target.brigade, target.battalion);
        });
    }

    function replayFormFederations(rows, warnings) {
        angular.forEach(getFilledRowsInOrder(rows, ['itemNo', 'federation_Fleet']), function (row) {
            var brigade = getBrigadeById(row.itemNo);
            if (brigade) {
                setBrigadeFederation(brigade, row.federation_Fleet);
                return;
            }

            var affectedBrigades = getBrigadesByFederation(row.itemNo);
            if (!affectedBrigades.length) {
                addReplayWarning(warnings, 'TS14', row, 'brigade/federation not found: ' + row.itemNo);
                return;
            }

            angular.forEach(affectedBrigades, function (affectedBrigade) {
                setBrigadeFederation(affectedBrigade, row.federation_Fleet);
            });
        });
    }

    function isBattalionEligibleTarget(brigade, battalion) {
        if (!$scope.battalionAction.type) {
            return false;
        }

        return !!$scope.battalionAction.eligibleKeys[getBattalionKey(brigade, battalion)];
    }

    function isBattalionLockedForOrders(battalion) {
        return !!(battalion && battalion.isLockedByTurnOrder);
    }

    function brigadeHasLockedBattalion(brigade) {
        if (!brigade || !brigade.battalions) {
            return false;
        }

        for (var i = 0; i < brigade.battalions.length; i++) {
            if (isBattalionLockedForOrders(brigade.battalions[i])) {
                return true;
            }
        }

        return false;
    }

    function hasAnyLockedBrigade(brigades, actionName) {
        for (var i = 0; brigades && i < brigades.length; i++) {
            if (brigadeHasLockedBattalion(brigades[i])) {
                alertLockedTurnOrder(actionName, brigades[i]);
                return true;
            }
        }

        return false;
    }

    function alertLockedTurnOrder(actionName, brigade) {
        var brigadeLabel = brigade && brigade.id ? ' Brigade ' + brigade.id + ' contains' : ' This action uses';
        alert(actionName + ' is not possible.' + brigadeLabel + ' a battalion already used in an Exchange Battalions or Merge Battalions order this turn.');
    }

    function markBattalionLockedForOrders(battalion) {
        if (battalion) {
            battalion.isLockedByTurnOrder = true;
        }
    }

    function getBattalionKey(brigade, battalion) {
        return brigade.id + ':' + battalion.slot;
    }

    function isSameBattalionSlot(leftBrigade, leftBattalion, rightBrigade, rightBattalion) {
        return !!(leftBrigade && rightBrigade && leftBattalion && rightBattalion
            && leftBrigade.id === rightBrigade.id
            && leftBattalion.slot === rightBattalion.slot);
    }

    function isSameCoordinate(leftBrigade, rightBrigade) {
        if (!hasNumericCoordinate(leftBrigade) || !hasNumericCoordinate(rightBrigade)) {
            return false;
        }

        return parseInt(leftBrigade.source.x_OrState, 10) === parseInt(rightBrigade.source.x_OrState, 10)
            && parseInt(leftBrigade.source.y_OrFleet, 10) === parseInt(rightBrigade.source.y_OrFleet, 10);
    }

    function hasNumericCoordinate(brigade) {
        if (!brigade || !brigade.source) {
            return false;
        }

        return !isNaN(parseInt(brigade.source.x_OrState, 10))
            && !isNaN(parseInt(brigade.source.y_OrFleet, 10));
    }

    function exchangeBattalions(leftBrigade, leftBattalion, rightBrigade, rightBattalion) {
        if (isBattalionLockedForOrders(leftBattalion) || isBattalionLockedForOrders(rightBattalion)) {
            return;
        }

        var leftSnapshot = copyBattalionBaseline(leftBattalion);
        copyBattalionBaselineInto(leftBattalion, rightBattalion);
        copyBattalionBaselineInto(rightBattalion, leftSnapshot);
        markBattalionLockedForOrders(leftBattalion);
        markBattalionLockedForOrders(rightBattalion);

        recalculateBrigadeEffects(leftBrigade);
        if (leftBrigade.id !== rightBrigade.id) {
            recalculateBrigadeEffects(rightBrigade);
        }
    }

    function mergeBattalions(sourceBrigade, sourceBattalion, targetBrigade, targetBattalion) {
        if (isBattalionLockedForOrders(sourceBattalion) || isBattalionLockedForOrders(targetBattalion)) {
            return;
        }

        if (!sourceBattalion.type || !targetBattalion.type || sourceBattalion.type !== targetBattalion.type) {
            return;
        }

        var sourceSize = parseInt(sourceBattalion.size, 10) || 0;
        var targetSize = parseInt(targetBattalion.size, 10) || 0;
        var sourceEf = parseInt(sourceBattalion.originalEf, 10) || 0;
        var targetEf = parseInt(targetBattalion.originalEf, 10) || 0;
        var combinedSize = sourceSize + targetSize;
        var mergedEf = combinedSize > 0 ? Math.floor(((sourceSize * sourceEf) + (targetSize * targetEf)) / combinedSize) : targetEf;

        targetBattalion.type = targetBattalion.type || sourceBattalion.type;
        targetBattalion.originalEf = mergedEf;
        targetBattalion.currentEf = mergedEf;
        targetBattalion.size = Math.min(800, combinedSize);
        targetBattalion.display = formatBattalionParts(targetBattalion.type, targetBattalion.originalEf, targetBattalion.size);

        clearBattalionBaseline(sourceBattalion);
        markBattalionLockedForOrders(sourceBattalion);
        markBattalionLockedForOrders(targetBattalion);

        recalculateBrigadeEffects(sourceBrigade);
        if (sourceBrigade.id !== targetBrigade.id) {
            recalculateBrigadeEffects(targetBrigade);
        }
    }

    function copyBattalionBaseline(battalion) {
        return {
            type: battalion.type,
            originalEf: battalion.originalEf,
            currentEf: battalion.originalEf,
            size: battalion.size
        };
    }

    function copyBattalionBaselineInto(target, source) {
        target.type = source.type;
        target.originalEf = source.originalEf;
        target.currentEf = source.originalEf;
        target.size = source.size;
        target.display = target.type ? formatBattalionParts(target.type, target.originalEf, target.size) : '';
    }

    function clearBattalionBaseline(battalion) {
        battalion.type = '';
        battalion.originalEf = null;
        battalion.currentEf = null;
        battalion.size = null;
        battalion.display = '';
        battalion.isEfChanged = false;
        battalion.efDrop = 0;
        battalion.efIncrease = 0;
        battalion.isNewAddition = false;
    }

    function findFirstFreeBattalion(brigade) {
        if (!brigade || !brigade.battalions) {
            return null;
        }

        for (var i = 0; i < brigade.battalions.length; i++) {
            if (!brigade.battalions[i].type) {
                return brigade.battalions[i];
            }
        }

        return null;
    }

    function applyAdditionalBattalionPreview(brigade, battalion, armyItem) {
        battalion.type = trimValue(armyItem.shortName);
        battalion.originalEf = armyItem.ef;
        battalion.currentEf = armyItem.ef;
        battalion.size = 800;
        battalion.isNewAddition = true;
        battalion.display = formatBattalionParts(battalion.type, battalion.originalEf, battalion.size);
        recalculateBrigadeEffects(brigade);
    }

    function calculateEmptyAdditionalBattalionCost() {
        return {
            ld: '',
            citizens: '',
            ecPts: '',
            horses: ''
        };
    }

    function calculateAdditionalBattalionCost(armyItem) {
        if (!armyItem) {
            return calculateEmptyAdditionalBattalionCost();
        }

        var cost = parseFloat(armyItem.cost);
        var ecPtsPer25 = parseFloat(armyItem.ecPtsPer25);
        if (isNaN(cost)) cost = 0;
        if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;

        return {
            ld: Math.round(800 * cost * 2),
            citizens: 800,
            ecPts: Math.round(Math.ceil(800 / 25) * ecPtsPer25),
            horses: isMountedArmyItem(armyItem) ? 800 : ''
        };
    }

    function isArmyItemValidForAdditionalBattalion(armyItem, sphere) {
        var parsedItemNo = parseInt(armyItem && armyItem.itemNo, 10);
        if (isNaN(parsedItemNo)) {
            return false;
        }

        if (sphere === 'Europe') {
            if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39) return false;
            return true;
        }

        if (parsedItemNo % 2 === 0) return false;
        if (parsedItemNo === 19) return false;
        if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39) return sphere === 'Caribbean' || sphere === 'India';

        return true;
    }

    function persistExchangeBattalionOrder(leftBrigade, leftBattalion, rightBrigade, rightBattalion) {
        turnSheetFactory.getTSExchangeBattalions($scope.masterData.turnId).then(function (rows) {
            var targetRow = findMatchingExchangeRow(rows, leftBrigade, leftBattalion, rightBrigade, rightBattalion)
                || findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeA', 'battA', 'brigadeB', 'battB'], 4);

            if (!targetRow) {
                alert('No empty Exchange Battalions row is available.');
                return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.brigadeA = leftBrigade.id;
            targetRow.battA = leftBattalion.slot;
            targetRow.brigadeB = rightBrigade.id;
            targetRow.battB = rightBattalion.slot;

            return turnSheetFactory.postTSRecords(rows, 'ExchangeBattalions').then(angular.noop, showTurnSheetOrderError);
        }, showTurnSheetOrderError);
    }

    function persistMergeBattalionOrder(sourceBrigade, sourceBattalion, targetBrigade, targetBattalion) {
        turnSheetFactory.getTSMergeBattalions($scope.masterData.turnId).then(function (rows) {
            var targetRow = findMatchingMergeRow(rows, sourceBrigade, sourceBattalion, targetBrigade, targetBattalion)
                || findNextEmptyTurnSheetRowWithinLimit(rows, ['bridageA', 'battA', 'brigadeB', 'battB'], 8);

            if (!targetRow) {
                alert('No empty Merge Battalions row is available.');
                return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.bridageA = sourceBrigade.id;
            targetRow.battA = sourceBattalion.slot;
            targetRow.brigadeB = targetBrigade.id;
            targetRow.battB = targetBattalion.slot;

            return turnSheetFactory.postTSRecords(rows, 'MergeBattalions').then(angular.noop, showTurnSheetOrderError);
        }, showTurnSheetOrderError);
    }

    function clearExchangeBattalionOrders(brigade, battalion, clearedOrders) {
        return turnSheetFactory.getTSExchangeBattalions($scope.masterData.turnId).then(function (rows) {
            var changed = false;
            angular.forEach(getFilledRowsInOrder(rows, ['brigadeA', 'battA', 'brigadeB', 'battB']), function (row) {
                if (!turnSheetPairIncludesBattalion(row, brigade, battalion, 'brigadeA', 'battA', 'brigadeB', 'battB')) {
                    return;
                }

                clearTurnSheetPairRow(row, ['brigadeA', 'battA', 'brigadeB', 'battB']);
                changed = true;
                clearedOrders.push('Exchange Battalions row ' + ((row && row.orderNo) || '?'));
            });

            if (changed) {
                return turnSheetFactory.postTSRecords(rows, 'ExchangeBattalions');
            }

            return null;
        });
    }

    function clearMergeBattalionOrders(brigade, battalion, clearedOrders) {
        return turnSheetFactory.getTSMergeBattalions($scope.masterData.turnId).then(function (rows) {
            var changed = false;
            angular.forEach(getFilledRowsInOrder(rows, ['bridageA', 'battA', 'brigadeB', 'battB']), function (row) {
                if (!turnSheetPairIncludesBattalion(row, brigade, battalion, 'bridageA', 'battA', 'brigadeB', 'battB')) {
                    return;
                }

                clearTurnSheetPairRow(row, ['bridageA', 'battA', 'brigadeB', 'battB']);
                changed = true;
                clearedOrders.push('Merge Battalions row ' + ((row && row.orderNo) || '?'));
            });

            if (changed) {
                return turnSheetFactory.postTSRecords(rows, 'MergeBattalions');
            }

            return null;
        });
    }

    function turnSheetPairIncludesBattalion(row, brigade, battalion, brigadeAField, battAField, brigadeBField, battBField) {
        return !!(row && brigade && battalion)
            && ((sameNullableInt(row[brigadeAField], brigade.id) && sameNullableInt(row[battAField], battalion.slot))
                || (sameNullableInt(row[brigadeBField], brigade.id) && sameNullableInt(row[battBField], battalion.slot)));
    }

    function clearTurnSheetPairRow(row, fields) {
        row.turnId = $scope.masterData.turnId;
        angular.forEach(fields, function (field) {
            row[field] = null;
        });
    }

    function persistFormFederationOrders(stagedOrders) {
        turnSheetFactory.getTSFormFederations($scope.masterData.turnId).then(function (rows) {
            rows = rows || [];

            var conflicts = stagedOrders.filter(function (order) {
                return !!findMatchingFormFederationRow(rows, order.itemNo);
            });

            if (conflicts.length && !window.confirm('One or more TS14 orders already exist for these brigade/federation numbers. Overwrite them?')) {
                return;
            }

            for (var i = 0; i < stagedOrders.length; i++) {
                var order = stagedOrders[i];
                var targetRow = findMatchingFormFederationRow(rows, order.itemNo)
                    || findNextEmptyTurnSheetRowWithinLimit(rows, ['itemNo', 'federation_Fleet'], 21);

                if (!targetRow) {
                    alert('No empty TS_14 row is available.');
                    return;
                }

                targetRow.turnId = $scope.masterData.turnId;
                targetRow.itemNo = order.itemNo;
                targetRow.federation_Fleet = order.federation_Fleet;
            }

            return turnSheetFactory.postTSRecords(rows, 'FormFederations').then(function () {
                applyStagedFormFederationChanges(stagedOrders);
                $scope.closeFormFederationModal();
            }, showTurnSheetOrderError);
        }, showTurnSheetOrderError);
    }

    function stageFormFederationBrigade(brigade, isOriginal) {
        if (!$scope.canStageFormFederationBrigade(brigade)) {
            return;
        }

        var brigadeId = parseInt(brigade.id, 10);
        if (isNaN(brigadeId)) {
            return;
        }

        stageFormFederationOrder({
            type: 'brigade',
            itemNo: brigadeId,
            federation_Fleet: getFormFederationTargetNo(),
            sourceBrigadeId: brigade.id,
            affectedBrigadeIds: [brigade.id],
            isOriginal: !!isOriginal
        });
    }

    function stageFormFederationOrder(order) {
        if (!order || order.itemNo == null || !isValidTargetFederationNo(order.federation_Fleet)) {
            return;
        }

        var stagedOrders = $scope.formFederationModal.stagedOrders || [];
        for (var i = 0; i < stagedOrders.length; i++) {
            if (sameNullableInt(stagedOrders[i].itemNo, order.itemNo)) {
                stagedOrders[i].federation_Fleet = order.federation_Fleet;
                stagedOrders[i].affectedBrigadeIds = order.affectedBrigadeIds || stagedOrders[i].affectedBrigadeIds;
                stagedOrders[i].type = order.type || stagedOrders[i].type;
                stagedOrders[i].sourceFederationNo = order.sourceFederationNo;
                stagedOrders[i].sourceBrigadeId = order.sourceBrigadeId || stagedOrders[i].sourceBrigadeId;
                stagedOrders[i].isOriginal = stagedOrders[i].isOriginal || !!order.isOriginal;
                return;
            }
        }

        stagedOrders.push(order);
        $scope.formFederationModal.stagedOrders = stagedOrders;
    }

    function removeNoOpFormFederationOrders() {
        var targetFederationNo = getFormFederationTargetNo();
        $scope.formFederationModal.stagedOrders = ($scope.formFederationModal.stagedOrders || []).filter(function (order) {
            if (!order) {
                return false;
            }

            if (order.type === 'federation') {
                return parseInt(order.sourceFederationNo, 10) !== targetFederationNo;
            }

            var brigade = getBrigadeById(order.itemNo);
            return brigade && getCurrentFederationNo(brigade) !== targetFederationNo;
        });
    }

    function applyStagedFormFederationChanges(stagedOrders) {
        angular.forEach(stagedOrders || [], function (order) {
            if (order.type === 'federation') {
                angular.forEach(getBrigadesByFederation(order.sourceFederationNo), function (brigade) {
                    setBrigadeFederation(brigade, order.federation_Fleet);
                });
                return;
            }

            var brigade = getBrigadeById(order.itemNo);
            setBrigadeFederation(brigade, order.federation_Fleet);
        });
    }

    function setBrigadeFederation(brigade, federationNo) {
        if (!brigade) {
            return;
        }

        var parsed = parseInt(federationNo, 10);
        var formatted = !isNaN(parsed) && parsed > 0 ? parsed : '';
        brigade.fed = formatted;
        brigade.fedChanged = true;

        if (brigade.source) {
            brigade.source.federation = formatted || 0;
        }
    }

    function getFormFederationTargetNo() {
        var parsed = parseInt($scope.formFederationModal.targetFederationNo, 10);
        return isNaN(parsed) ? null : parsed;
    }

    function getCurrentFederationNo(brigade) {
        var parsed = parseInt(brigade && brigade.fed, 10);
        return isNaN(parsed) ? 0 : parsed;
    }

    function getEffectiveFederationNo(brigade) {
        if (!brigade) {
            return 0;
        }

        var brigadeId = parseInt(brigade.id, 10);
        var currentFederationNo = getCurrentFederationNo(brigade);
        var stagedOrders = $scope.formFederationModal.stagedOrders || [];

        for (var i = stagedOrders.length - 1; i >= 0; i--) {
            var order = stagedOrders[i];
            if (!order) {
                continue;
            }

            if (order.type === 'brigade' && sameNullableInt(order.itemNo, brigadeId)) {
                return parseInt(order.federation_Fleet, 10) || 0;
            }

            if (order.type === 'federation' && sameNullableInt(order.sourceFederationNo, currentFederationNo)) {
                return parseInt(order.federation_Fleet, 10) || 0;
            }
        }

        return currentFederationNo;
    }

    function isValidTargetFederationNo(targetFederationNo) {
        if (targetFederationNo === 0) {
            $scope.formFederationModal.validationError = '';
            return true;
        }

        if (targetFederationNo >= 61 && targetFederationNo <= 90) {
            $scope.formFederationModal.validationError = '';
            return true;
        }

        if (isFederationNoOnModalCoordinate(targetFederationNo)) {
            $scope.formFederationModal.validationError = '';
            return true;
        }

        $scope.formFederationModal.validationError = 'Enter 0, a land federation number from 61 to 90, or a federation number already on this coordinate.';
        return false;
    }

    function getSameCoordinateBrigades(brigade) {
        if (!brigade) {
            return [];
        }

        return $scope.brigadeRows.filter(function (row) {
            return isSameCoordinate(brigade, row);
        });
    }

    function getNextAvailableLandFederationNo() {
        var used = {};
        angular.forEach($scope.brigadeRows || [], function (brigade) {
            var federationNo = parseInt(brigade.fed, 10);
            if (!isNaN(federationNo)) {
                used[federationNo] = true;
            }
        });

        angular.forEach(($scope.formFederationModal && $scope.formFederationModal.stagedOrders) || [], function (order) {
            var federationNo = parseInt(order.federation_Fleet, 10);
            if (!isNaN(federationNo) && federationNo > 0) {
                used[federationNo] = true;
            }
        });

        for (var federationNo = 61; federationNo <= 90; federationNo++) {
            if (!used[federationNo]) {
                return federationNo;
            }
        }

        return null;
    }

    function getBrigadesByFederation(federationNo) {
        return ($scope.brigadeRows || []).filter(function (brigade) {
            return sameNullableInt(brigade.fed, federationNo);
        });
    }

    function getBrigadeById(id) {
        for (var i = 0; i < $scope.brigadeRows.length; i++) {
            if (sameNullableInt($scope.brigadeRows[i].id, id)) {
                return $scope.brigadeRows[i];
            }
        }

        return null;
    }

    function isFederationNoOnModalCoordinate(federationNo) {
        if (federationNo == null) {
            return false;
        }

        return ($scope.formFederationModal.coordinateBrigades || []).some(function (brigade) {
            return sameNullableInt(brigade.fed, federationNo);
        });
    }

    function isFormFederationBrigadeStaged(brigade) {
        if (!brigade) {
            return false;
        }

        return !!getFormFederationStagedBrigadeIds()[brigade.id];
    }

    function getFormFederationStagedBrigadeIds() {
        var staged = {};
        angular.forEach($scope.formFederationModal.stagedOrders || [], function (order) {
            angular.forEach(order.affectedBrigadeIds || [], function (brigadeId) {
                staged[brigadeId] = true;
            });
        });
        return staged;
    }

    function findMatchingFormFederationRow(rows, itemNo) {
        for (var i = 0; rows && i < rows.length; i++) {
            if (sameNullableInt(rows[i].itemNo, itemNo)) {
                return rows[i];
            }
        }

        return null;
    }

    function persistHeadcountOrder(brigade, scope, targetHeadcount) {
        var brigadeOrFederation = getTurnSheetBrigadeOrFederationValue(brigade, scope);
        if (brigadeOrFederation == null) {
            return;
        }

        turnSheetFactory.getTSIncreaseHeadcount($scope.masterData.turnId).then(function (rows) {
            rows = rows || [];
            var targetRow = findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation)
                || findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeOrFederation', 'increaseAmount'], 12);

            if (!targetRow) {
                alert('No empty TS_05 row is available.');
                return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.brigadeOrFederation = brigadeOrFederation;
            targetRow.increaseAmount = targetHeadcount;

            return turnSheetFactory.postTSRecords(rows, 'IncreaseHeadcount').then(angular.noop, showTurnSheetOrderError);
        }, showTurnSheetOrderError);
    }

    function clearHeadcountOrder(brigade, scope) {
        var brigadeOrFederation = getTurnSheetBrigadeOrFederationValue(brigade, scope);
        if (brigadeOrFederation == null) {
            return;
        }

        turnSheetFactory.getTSIncreaseHeadcount($scope.masterData.turnId).then(function (rows) {
            rows = rows || [];
            var targetRow = findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation);
            if (!targetRow) {
                return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.brigadeOrFederation = null;
            targetRow.increaseAmount = null;

            return turnSheetFactory.postTSRecords(rows, 'IncreaseHeadcount').then(angular.noop, showTurnSheetOrderError);
        }, showTurnSheetOrderError);
    }

    function persistTrainOrder(brigade, scope) {
        var brigadeOrFederation = getTurnSheetBrigadeOrFederationValue(brigade, scope);
        if (brigadeOrFederation == null) {
            return;
        }

        turnSheetFactory.getTSIncreaseBrigadeXP($scope.masterData.turnId).then(function (rows) {
            rows = rows || [];
            var targetRow = findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation)
                || findNextEmptyTurnSheetRowWithinLimit(rows, ['brigadeOrFederation'], 16);

            if (!targetRow) {
                alert('No empty TS_06 row is available.');
                return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.brigadeOrFederation = brigadeOrFederation;

            return turnSheetFactory.postTSRecords(rows, 'IncreaseBrigadeXP').then(angular.noop, showTurnSheetOrderError);
        }, showTurnSheetOrderError);
    }

    function clearTrainOrder(brigade, scope) {
        var brigadeOrFederation = getTurnSheetBrigadeOrFederationValue(brigade, scope);
        if (brigadeOrFederation == null) {
            return;
        }

        turnSheetFactory.getTSIncreaseBrigadeXP($scope.masterData.turnId).then(function (rows) {
            rows = rows || [];
            var targetRow = findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation);
            if (!targetRow) {
                return;
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.brigadeOrFederation = null;

            return turnSheetFactory.postTSRecords(rows, 'IncreaseBrigadeXP').then(angular.noop, showTurnSheetOrderError);
        }, showTurnSheetOrderError);
    }

    function findMatchingExchangeRow(rows, leftBrigade, leftBattalion, rightBrigade, rightBattalion) {
        return findMatchingPairRow(rows, leftBrigade.id, leftBattalion.slot, rightBrigade.id, rightBattalion.slot, 'brigadeA', 'battA', 'brigadeB', 'battB');
    }

    function findMatchingMergeRow(rows, sourceBrigade, sourceBattalion, targetBrigade, targetBattalion) {
        return findMatchingPairRow(rows, sourceBrigade.id, sourceBattalion.slot, targetBrigade.id, targetBattalion.slot, 'bridageA', 'battA', 'brigadeB', 'battB');
    }

    function findMatchingPairRow(rows, brigadeA, battA, brigadeB, battB, brigadeAField, battAField, brigadeBField, battBField) {
        for (var i = 0; rows && i < rows.length; i++) {
            var row = rows[i];
            var directMatch = sameNullableInt(row[brigadeAField], brigadeA)
                && sameNullableInt(row[battAField], battA)
                && sameNullableInt(row[brigadeBField], brigadeB)
                && sameNullableInt(row[battBField], battB);
            var reverseMatch = sameNullableInt(row[brigadeAField], brigadeB)
                && sameNullableInt(row[battAField], battB)
                && sameNullableInt(row[brigadeBField], brigadeA)
                && sameNullableInt(row[battBField], battA);

            if (directMatch || reverseMatch) {
                return row;
            }
        }

        return null;
    }

    function findNextEmptyTurnSheetRow(rows, fields) {
        for (var i = 0; rows && i < rows.length; i++) {
            var row = rows[i];
            var hasValue = false;
            for (var f = 0; f < fields.length; f++) {
                if (row[fields[f]] != null && row[fields[f]] !== '') {
                    hasValue = true;
                    break;
                }
            }
            if (!hasValue) {
                return row;
            }
        }

        return null;
    }

    function findMatchingBrigadeOrFederationRow(rows, brigadeOrFederation) {
        for (var i = 0; rows && i < rows.length; i++) {
            if (sameNullableInt(rows[i].brigadeOrFederation, brigadeOrFederation)) {
                return rows[i];
            }
        }

        return null;
    }

    function getTurnSheetBrigadeOrFederationValue(brigade, scope) {
        if (!brigade) {
            return null;
        }

        var value = scope === 'federation' ? brigade.fed : brigade.id;
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }

    function getFilledRowsInOrder(rows, fields) {
        return (rows || []).filter(function (row) {
            return hasAnyTurnSheetValue(row, fields);
        }).sort(function (left, right) {
            return (parseInt(left.orderNo, 10) || 0) - (parseInt(right.orderNo, 10) || 0);
        });
    }

    function hasAnyTurnSheetValue(row, fields) {
        if (!row) {
            return false;
        }

        for (var i = 0; i < fields.length; i++) {
            if (row[fields[i]] != null && row[fields[i]] !== '') {
                return true;
            }
        }

        return false;
    }

    function addReplayWarning(warnings, sectionName, row, detail) {
        warnings.push(sectionName + ' row ' + ((row && row.orderNo) || '?') + ': ' + detail + '.');
    }

    function getBrigadeOrFederationAffectedBrigades(value) {
        var parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
            return [];
        }

        var brigade = getBrigadeById(parsed);
        if (brigade) {
            return [brigade];
        }

        return getBrigadesByFederation(parsed);
    }

    function getReplayScope(value) {
        return getBrigadeById(value) ? 'brigade' : 'federation';
    }

    function getReplayBattalionRef(brigadeNo, battalionSlot) {
        var brigade = getBrigadeById(brigadeNo);
        var slot = parseInt(battalionSlot, 10);
        if (!brigade || isNaN(slot) || slot < 1 || slot > brigade.battalions.length) {
            return null;
        }

        return {
            brigade: brigade,
            battalion: brigade.battalions[slot - 1]
        };
    }

    function getArmyItemByItemNo(itemNo) {
        var parsed = parseInt(itemNo, 10);
        if (isNaN(parsed)) {
            return null;
        }

        for (var i = 0; i < $scope.armyListRows.length; i++) {
            if (parseInt($scope.armyListRows[i].itemNo, 10) === parsed) {
                return $scope.armyListRows[i];
            }
        }

        return null;
    }

    function findNextEmptyTurnSheetRowWithinLimit(rows, fields, maxRows) {
        rows = rows || [];
        for (var orderNo = 1; orderNo <= maxRows; orderNo++) {
            var row = findTurnSheetRowByOrderNo(rows, orderNo);
            if (!row) {
                row = { turnId: $scope.masterData.turnId, orderNo: orderNo };
                rows.push(row);
                return row;
            }

            if (!hasAnyTurnSheetValue(row, fields)) {
                return row;
            }
        }

        return null;
    }

    function findTurnSheetRowByOrderNo(rows, orderNo) {
        for (var i = 0; rows && i < rows.length; i++) {
            if (sameNullableInt(rows[i].orderNo, orderNo)) {
                return rows[i];
            }
        }

        return null;
    }

    function sameNullableInt(left, right) {
        return parseInt(left, 10) === parseInt(right, 10);
    }

    function showTurnSheetOrderError(error) {
        var detail = (error && error.data) ? error.data : 'Unable to save turn-sheet order.';
        alert(detail);
    }

    function persistRenameOrder(brigade, newName) {
        turnSheetFactory.getTSChangeNames($scope.masterData.turnId).then(function (rows) {
            var targetRow = findMatchingRenameRow(rows, brigade.id)
                || findNextEmptyTurnSheetRow(rows, ['itemNo', 'name']);

            if (!targetRow) {
                targetRow = { turnId: $scope.masterData.turnId, orderNo: (rows || []).length + 1 };
                rows.push(targetRow);
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.itemNo = brigade.id;
            targetRow.name = newName;

            return turnSheetFactory.postTSRecords(rows, 'ChangeNames').then(angular.noop, showTurnSheetOrderError);
        }, showTurnSheetOrderError);
    }

    function findMatchingRenameRow(rows, itemNo) {
        for (var i = 0; rows && i < rows.length; i++) {
            if (sameNullableInt(rows[i].itemNo, itemNo)) {
                return rows[i];
            }
        }

        return null;
    }

    function findMatchingAdditionalBattalionRow(rows, brigadeNo) {
        for (var i = 0; rows && i < rows.length; i++) {
            if (sameNullableInt(rows[i].brigadeNo, brigadeNo)) {
                return rows[i];
            }
        }

        return null;
    }

    function buildBattalionDisplays(brigade) {
        var battalions = [];
        for (var i = 1; i <= 7; i++) {
            battalions.push(buildBattalionDisplay(brigade, i));
        }
        return battalions;
    }

    function buildBattalionDisplay(brigade, index) {
        var type = trimValue(brigade['batt' + index + 'Type']);
        var ef = brigade['batt' + index + 'EF'];
        var size = brigade['batt' + index + 'Size'];

        if (!type || type === '--') {
            return {
                slot: index,
                type: '',
                originalEf: null,
                currentEf: null,
                size: null,
                display: '',
                isEfChanged: false,
                efDrop: 0,
                efIncrease: 0,
                isNewAddition: false,
                isLockedByTurnOrder: false
            };
        }

        return {
            slot: index,
            type: type,
            originalEf: ef,
            currentEf: ef,
            size: size,
            display: formatBattalionParts(type, ef, size),
            isEfChanged: false,
            efDrop: 0,
            efIncrease: 0,
            isNewAddition: false,
            isLockedByTurnOrder: false
        };
    }

    function formatBattalionParts(type, ef, size) {
        var parts = [type];
        if (ef != null && ef !== '') parts.push(ef);
        if (size != null && size !== '') parts.push(size);
        return parts.join(' ');
    }

    function calculatePlaceholderResources() {
        return {
            ld: '',
            citizens: '',
            ecPts: '',
            horses: ''
        };
    }

    function calculateHeadcountResources(brigade, targetHeadcount) {
        var resources = {
            ld: 0,
            citizens: 0,
            ecPts: 0,
            horses: 0
        };

        angular.forEach(brigade.battalions, function (battalion) {
            var missingMen = getMissingHeadcount(battalion, targetHeadcount);
            if (missingMen <= 0) {
                return;
            }

            var armyItem = getArmyItemForBattalion(battalion);
            if (!armyItem) {
                return;
            }

            var cost = parseFloat(armyItem.cost);
            var ecPtsPer25 = parseFloat(armyItem.ecPtsPer25);
            if (isNaN(cost)) cost = 0;
            if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;

            resources.ld += Math.round(missingMen * cost);
            resources.citizens += missingMen;
            resources.ecPts += Math.round(Math.ceil(missingMen / 25) * ecPtsPer25);
            if (isMountedArmyItem(armyItem)) {
                resources.horses += missingMen;
            }
        });

        return {
            ld: resources.ld || '',
            citizens: resources.citizens || '',
            ecPts: resources.ecPts || '',
            horses: resources.horses || ''
        };
    }

    function applyHeadcountEfChanges(brigade, targetHeadcount) {
        angular.forEach(brigade.battalions, function (battalion) {
            var originalEf = parseInt(battalion.originalEf, 10);
            var missingMen = getMissingHeadcount(battalion, targetHeadcount);
            var drop = getEfDrop(missingMen, battalion.size);

            if (!battalion.display || isNaN(originalEf) || drop <= 0) {
                battalion.currentEf = battalion.originalEf;
                updateBattalionDisplayState(battalion);
                return;
            }

            battalion.currentEf = Math.max(0, originalEf - drop);
            updateBattalionDisplayState(battalion);
        });
    }

    function applyHeadcountPlanToBrigade(brigade, targetHeadcount, scope, sourceBrigadeId) {
        brigade.headcountPlan = {
            targetHeadcount: targetHeadcount,
            scope: scope,
            sourceBrigadeId: sourceBrigadeId
        };
        brigade.headcountSelected = true;
        recalculateBrigadeEffects(brigade);
    }

    function clearHeadcountPlanFromBrigade(brigade) {
        brigade.headcountPlan = null;
        brigade.headcountSelected = false;
        recalculateBrigadeEffects(brigade);
    }

    function applyTrainPlanToBrigade(brigade, scope, sourceBrigadeId) {
        brigade.trainPlan = {
            scope: scope,
            sourceBrigadeId: sourceBrigadeId
        };
        brigade.trainSelected = true;
        recalculateBrigadeEffects(brigade);
    }

    function clearTrainPlanFromBrigade(brigade) {
        brigade.trainPlan = null;
        brigade.trainSelected = false;
        recalculateBrigadeEffects(brigade);
    }

    function recalculateBrigadeEffects(brigade) {
        var resources = {
            ld: 0,
            citizens: 0,
            ecPts: 0,
            horses: 0
        };

        resetBattalionDisplays(brigade);

        // H/C must run before Train because it can change EF and effective headcount.
        if (brigade.headcountPlan) {
            addResources(resources, calculateHeadcountResources(brigade, brigade.headcountPlan.targetHeadcount));
            applyHeadcountEfChanges(brigade, brigade.headcountPlan.targetHeadcount);
        }

        if (brigade.trainPlan) {
            addResources(resources, calculateTrainResources(brigade));
            applyTrainEfChanges(brigade);
        }

        brigade.resources = {
            ld: resources.ld || '',
            citizens: resources.citizens || '',
            ecPts: resources.ecPts || '',
            horses: resources.horses || ''
        };
    }

    function resetBattalionDisplays(brigade) {
        angular.forEach(brigade.battalions, function (battalion) {
            battalion.currentEf = battalion.originalEf;
            battalion.isEfChanged = false;
            battalion.efDrop = 0;
            battalion.efIncrease = 0;
            battalion.display = battalion.type ? formatBattalionParts(battalion.type, battalion.originalEf, battalion.size) : '';
        });
    }

    function applyTrainEfChanges(brigade) {
        angular.forEach(brigade.battalions, function (battalion) {
            var currentEf = parseInt(battalion.currentEf, 10);
            var originalEf = parseInt(battalion.originalEf, 10);
            var maxEf = getBattalionMaxEf(battalion);

            if (!battalion.display || isNaN(currentEf) || isNaN(originalEf) || maxEf == null || currentEf >= maxEf) {
                updateBattalionDisplayState(battalion);
                return;
            }

            battalion.currentEf = Math.min(maxEf, currentEf + 1);
            updateBattalionDisplayState(battalion);
        });
    }

    function updateBattalionDisplayState(battalion) {
        var originalEf = parseInt(battalion.originalEf, 10);
        var currentEf = parseInt(battalion.currentEf, 10);

        battalion.efDrop = 0;
        battalion.efIncrease = 0;
        battalion.isEfChanged = !isNaN(originalEf) && !isNaN(currentEf) && currentEf !== originalEf;

        if (battalion.isEfChanged && currentEf < originalEf) {
            battalion.efDrop = Math.min(2, originalEf - currentEf);
        }
        else if (battalion.isEfChanged && currentEf > originalEf) {
            battalion.efIncrease = currentEf - originalEf;
        }

        battalion.display = battalion.type ? formatBattalionParts(battalion.type, battalion.currentEf, battalion.size) : '';
    }

    function getMissingHeadcount(battalion, targetHeadcount) {
        if (!battalion || !battalion.type) {
            return 0;
        }

        var currentSize = parseInt(battalion.size, 10);
        if (isNaN(currentSize)) {
            currentSize = 0;
        }

        return Math.max(0, targetHeadcount - currentSize);
    }

    function getEfDrop(missingMen, currentSize) {
        var size = parseInt(currentSize, 10);
        if (isNaN(size)) {
            size = 0;
        }

        if (missingMen <= 0) {
            return 0;
        }

        if (missingMen > size) {
            return 2;
        }

        if (missingMen > (size * 0.5)) {
            return 1;
        }

        return 0;
    }

    function getArmyItemForBattalion(battalion) {
        if (!battalion || !battalion.type) {
            return null;
        }

        return $scope.armyListByShortName[battalion.type.toString().trim().toUpperCase()] || null;
    }

    function canTrainBattalion(battalion) {
        if (!battalion || !battalion.type) {
            return false;
        }

        var currentEf = parseInt(battalion.currentEf, 10);
        var maxEf = getBattalionMaxEf(battalion);
        return !isNaN(currentEf) && maxEf != null && currentEf < maxEf;
    }

    function getBattalionMaxEf(battalion) {
        var armyItem = getArmyItemForBattalion(battalion);
        if (!armyItem) {
            return null;
        }

        var maxEf = parseInt(armyItem.ef, 10);
        if (isNaN(maxEf)) {
            maxEf = parseInt(armyItem.EF, 10);
        }

        return isNaN(maxEf) ? null : maxEf;
    }

    function getEffectiveTrainingHeadcount(brigade, battalion) {
        var currentSize = parseInt(battalion.size, 10);
        if (isNaN(currentSize)) {
            currentSize = 0;
        }

        if (brigade.headcountPlan) {
            return Math.min(800, Math.max(currentSize, brigade.headcountPlan.targetHeadcount));
        }

        return Math.min(800, Math.max(0, currentSize));
    }

    function addResources(total, resources) {
        total.ld += parseInt(resources.ld, 10) || 0;
        total.citizens += parseInt(resources.citizens, 10) || 0;
        total.ecPts += parseInt(resources.ecPts, 10) || 0;
        total.horses += parseInt(resources.horses, 10) || 0;
    }

    function normalizeTargetHeadcount(value) {
        var parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
            parsed = 800;
        }

        if (parsed < 1) return 1;
        if (parsed > 800) return 800;
        return parsed;
    }

    function canApplyFederationScope(brigade) {
        return !!(brigade && brigade.fed && parseInt(brigade.fed, 10) > 0);
    }

    function getHeadcountAffectedBrigades(brigade, scope) {
        if (!brigade) {
            return [];
        }

        if (scope !== 'federation' || !canApplyFederationScope(brigade)) {
            return [brigade];
        }

        var federationNo = parseInt(brigade.fed, 10);
        return $scope.brigadeRows.filter(function (row) {
            return parseInt(row.fed, 10) === federationNo;
        });
    }

    function calculateHeadcountPreview(affectedBrigades, targetHeadcount) {
        var preview = calculateEmptyHeadcountPreview();
        preview.affectedBrigades = affectedBrigades.length;

        angular.forEach(affectedBrigades, function (brigade) {
            var resources = calculateHeadcountResources(brigade, targetHeadcount);
            preview.ld += parseInt(resources.ld, 10) || 0;
            preview.citizens += parseInt(resources.citizens, 10) || 0;
            preview.ecPts += parseInt(resources.ecPts, 10) || 0;
            preview.horses += parseInt(resources.horses, 10) || 0;

            angular.forEach(brigade.battalions, function (battalion) {
                var originalEf = parseInt(battalion.originalEf, 10);
                var missingMen = getMissingHeadcount(battalion, targetHeadcount);
                if (!isNaN(originalEf) && getEfDrop(missingMen, battalion.size) > 0) {
                    preview.efChanges += 1;
                }
            });
        });

        return preview;
    }

    function calculateTrainResources(brigade) {
        var resources = {
            ld: 0,
            citizens: 0,
            ecPts: 0,
            horses: 0
        };

        angular.forEach(brigade.battalions, function (battalion) {
            if (!canTrainBattalion(battalion)) {
                return;
            }

            addResources(resources, calculateBattalionTrainingResources(brigade, battalion));
        });

        return {
            ld: resources.ld || '',
            citizens: '',
            ecPts: resources.ecPts || '',
            horses: ''
        };
    }

    function calculateBattalionTrainingResources(brigade, battalion) {
        var resources = calculatePlaceholderResources();
        if (!canTrainBattalion(battalion)) {
            return resources;
        }

        var armyItem = getArmyItemForBattalion(battalion);
        if (!armyItem) {
            return resources;
        }

        var headcount = getEffectiveTrainingHeadcount(brigade, battalion);
        var setupCost = calculateBattalionSetupCost(armyItem, headcount);

        resources.ld = Math.round(setupCost.ld / 10) || '';
        resources.ecPts = Math.round(setupCost.ecPts / 8) || '';
        return resources;
    }

    function calculateBattalionSetupCost(armyItem, headcount) {
        var cost = parseFloat(armyItem && armyItem.cost);
        var ecPtsPer25 = parseFloat(armyItem && armyItem.ecPtsPer25);
        if (isNaN(cost)) cost = 0;
        if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;

        return {
            ld: headcount * cost,
            ecPts: Math.ceil(headcount / 25) * ecPtsPer25
        };
    }

    function calculateTrainPreview(affectedBrigades) {
        var preview = calculateEmptyTrainPreview();
        preview.affectedBrigades = affectedBrigades.length;

        angular.forEach(affectedBrigades, function (brigade) {
            angular.forEach(brigade.battalions, function (battalion) {
                if (canTrainBattalion(battalion)) {
                    var resources = calculateBattalionTrainingResources(brigade, battalion);
                    preview.ld += parseInt(resources.ld, 10) || 0;
                    preview.ecPts += parseInt(resources.ecPts, 10) || 0;
                    preview.trainableBattalions += 1;
                    preview.efChanges += 1;
                }
                else if (battalion && battalion.type) {
                    preview.skippedBattalions += 1;
                }
            });
        });

        return preview;
    }

    function calculateEmptyTrainPreview() {
        return {
            affectedBrigades: 0,
            trainableBattalions: 0,
            skippedBattalions: 0,
            ld: 0,
            ecPts: 0,
            efChanges: 0
        };
    }

    function calculateEmptyHeadcountPreview() {
        return {
            affectedBrigades: 0,
            ld: 0,
            citizens: 0,
            ecPts: 0,
            horses: 0,
            efChanges: 0
        };
    }

    function isMountedArmyItem(armyItem) {
        if (!armyItem) {
            return false;
        }

        var shortName = (armyItem.shortName || '').toString();
        var name = (armyItem.name || '').toString();
        return !!armyItem.isCavalry || /mounted/i.test(name) || /^mc$/i.test(shortName);
    }

    function buildArmyListLookup(armyList) {
        var lookup = {};
        angular.forEach(armyList || [], function (armyItem) {
            if (armyItem.shortName != null) {
                var key = armyItem.shortName.toString().trim().toUpperCase();
                if (key && !lookup[key]) {
                    lookup[key] = armyItem;
                }
            }
        });
        return lookup;
    }

    function isBrigadeAtBarracks(brigade) {
        if (!brigade || !$scope.masterData || !$scope.masterData.turnReport) {
            return false;
        }

        var x = parseInt(brigade.source.x_OrState, 10);
        var y = parseInt(brigade.source.y_OrFleet, 10);
        if (isNaN(x) || isNaN(y)) {
            return false;
        }

        var barracks = $scope.masterData.turnReport.barracks || [];
        for (var i = 0; i < barracks.length; i++) {
            if (parseInt(barracks[i].x, 10) === x && parseInt(barracks[i].y, 10) === y) {
                return true;
            }
        }

        return false;
    }

    function getTurnStateCode() {
        if ($scope.masterData && $scope.masterData.selectedState) {
            return $scope.masterData.selectedState;
        }

        if ($scope.masterData && $scope.masterData.turnId && $scope.masterData.turnId.length >= 4) {
            return $scope.masterData.turnId.substr(3, 1);
        }

        return null;
    }

    function getInitialSphereFilter() {
        var stored = null;
        try {
            stored = window.localStorage.getItem('austerlitz.landUnits.selectedSphere');
        }
        catch (e) {
        }

        return $scope.sphereOptions && $scope.sphereOptions.indexOf(stored) >= 0 ? stored : 'All';
    }

    function getBrigadeSphere(brigade) {
        if (!brigade || !brigade.source) {
            return 'Unknown';
        }

        var x = parseInt(brigade.source.x_OrState, 10);
        var y = parseInt(brigade.source.y_OrFleet, 10);
        if (isNaN(x) || isNaN(y)) {
            return 'Unknown';
        }

        if (x <= 80 && y <= 65) return 'Europe';
        if (x <= 40 && y <= 99) return 'Caribbean';
        if (x <= 90 && y <= 99) return 'India';
        return 'Unknown';
    }

    function formatPosition(brigade) {
        var x = trimValue(brigade.x_OrState);
        var y = trimValue(brigade.y_OrFleet);
        if (!x && !y) {
            return '';
        }
        return x + '/' + y;
    }

    function formatFederation(federation) {
        return federation && federation !== 0 ? federation : '';
    }

    function getStateColor() {
        var stateCode = ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : '').toString().trim().toUpperCase();
        var stateColors = {
            'A': 'rgb(198, 23, 23)',
            'B': 'rgb(51,153,102)',
            'D': 'rgb(255, 204, 153)',
            'E': 'rgb(234, 230, 21)',
            'F': 'rgb(47, 164, 231)',
            'G': 'rgb(135, 219, 106)',
            'H': 'rgb(255, 106, 0)',
            'I': 'rgb(0, 255, 0)',
            'K': 'rgb(181, 36, 165)',
            'M': 'rgb(206, 203, 83)',
            'N': 'rgb(128, 128, 0)',
            'P': 'rgb(128, 128, 128)',
            'R': 'rgb(192, 192, 192)',
            'S': 'rgb(255, 255, 153)',
            'T': 'black',
            'W': 'rgb(0, 128, 0)'
        };

        return {
            backgroundColor: stateColors[stateCode] || '#777777',
            textColor: stateCode === 'T' ? 'rgb(192, 192, 192)' : '#111111'
        };
    }

    function trimValue(value) {
        return value == null ? '' : value.toString().trim();
    }
});
