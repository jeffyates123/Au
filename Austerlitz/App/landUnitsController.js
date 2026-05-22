'use strict';

austerlitzModule.controller('landUnitsController', function ($scope, masterData, turnDataLoaderService, rulesCatalogFactory, turnSheetFactory) {
    $scope.masterData = masterData;
    $scope.brigadeRows = [];
    $scope.isLoading = false;
    $scope.loadError = null;
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
            $scope.loadArmyListForHeadcountCosts();
            return;
        }

        $scope.isLoading = true;
        $scope.loadError = null;
        turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId).then(function () {
            $scope.refreshBrigadeRows();
            $scope.loadArmyListForHeadcountCosts();
        }, function (error) {
            $scope.loadError = (error && error.data) ? error.data : 'Unable to load turn report.';
            $scope.brigadeRows = [];
        }).finally(function () {
            $scope.isLoading = false;
        });
    };

    $scope.loadArmyListForHeadcountCosts = function () {
        var stateCode = getTurnStateCode();
        rulesCatalogFactory.getArmyList(stateCode).then(function (armyList) {
            $scope.armyListByShortName = buildArmyListLookup(armyList);
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

        angular.forEach(affectedBrigades, function (affectedBrigade) {
            applyHeadcountPlanToBrigade(affectedBrigade, targetHeadcount, scope, brigade.id);
        });

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

        $scope.closeHeadcountModal();
    };

    $scope.openTrainModal = function (brigade) {
        if (!brigade) {
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

        angular.forEach(affectedBrigades, function (affectedBrigade) {
            applyTrainPlanToBrigade(affectedBrigade, scope, brigade.id);
        });

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

        $scope.battalionAction = {
            type: actionType,
            source: { brigade: brigade, battalion: battalion },
            eligibleKeys: buildEligibleBattalionKeyMap(actionType, brigade, battalion)
        };
    };

    $scope.onBattalionLozengeClick = function ($event, brigade, battalion) {
        if ($event && $event.preventDefault) $event.preventDefault();

        if (!$scope.battalionAction.type) {
            return;
        }

        if (!isBattalionEligibleTarget(brigade, battalion)) {
            $scope.resetBattalionAction();
            return;
        }

        var source = $scope.battalionAction.source;
        if (!source || isSameBattalionSlot(source.brigade, source.battalion, brigade, battalion)) {
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

    function buildEligibleBattalionKeyMap(actionType, sourceBrigade, sourceBattalion) {
        var eligible = {};
        angular.forEach($scope.brigadeRows, function (brigade) {
            angular.forEach(brigade.battalions, function (battalion) {
                if (isSameBattalionSlot(sourceBrigade, sourceBattalion, brigade, battalion)) {
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

    function isBattalionEligibleTarget(brigade, battalion) {
        if (!$scope.battalionAction.type) {
            return false;
        }

        return !!$scope.battalionAction.eligibleKeys[getBattalionKey(brigade, battalion)];
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
        var leftSnapshot = copyBattalionBaseline(leftBattalion);
        copyBattalionBaselineInto(leftBattalion, rightBattalion);
        copyBattalionBaselineInto(rightBattalion, leftSnapshot);

        recalculateBrigadeEffects(leftBrigade);
        if (leftBrigade.id !== rightBrigade.id) {
            recalculateBrigadeEffects(rightBrigade);
        }
    }

    function mergeBattalions(sourceBrigade, sourceBattalion, targetBrigade, targetBattalion) {
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
    }

    function persistExchangeBattalionOrder(leftBrigade, leftBattalion, rightBrigade, rightBattalion) {
        turnSheetFactory.getTSExchangeBattalions($scope.masterData.turnId).then(function (rows) {
            var targetRow = findMatchingExchangeRow(rows, leftBrigade, leftBattalion, rightBrigade, rightBattalion)
                || findNextEmptyTurnSheetRow(rows, ['brigadeA', 'battA', 'brigadeB', 'battB']);

            if (!targetRow) {
                targetRow = { turnId: $scope.masterData.turnId, orderNo: (rows || []).length + 1 };
                rows.push(targetRow);
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
                || findNextEmptyTurnSheetRow(rows, ['bridageA', 'battA', 'brigadeB', 'battB']);

            if (!targetRow) {
                targetRow = { turnId: $scope.masterData.turnId, orderNo: (rows || []).length + 1 };
                rows.push(targetRow);
            }

            targetRow.turnId = $scope.masterData.turnId;
            targetRow.bridageA = sourceBrigade.id;
            targetRow.battA = sourceBattalion.slot;
            targetRow.brigadeB = targetBrigade.id;
            targetRow.battB = targetBattalion.slot;

            return turnSheetFactory.postTSRecords(rows, 'MergeBattalions').then(angular.noop, showTurnSheetOrderError);
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

    function sameNullableInt(left, right) {
        return parseInt(left, 10) === parseInt(right, 10);
    }

    function showTurnSheetOrderError(error) {
        var detail = (error && error.data) ? error.data : 'Unable to save turn-sheet order.';
        alert(detail);
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
                efIncrease: 0
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
            efIncrease: 0
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

            var armyItem = getArmyItemForBattalion(battalion);
            var headcount = getEffectiveTrainingHeadcount(brigade, battalion);
            var cost = parseFloat(armyItem.cost);
            var ecPtsPer25 = parseFloat(armyItem.ecPtsPer25);
            if (isNaN(cost)) cost = 0;
            if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;

            resources.ld += Math.round((headcount * cost) / 10);
            resources.ecPts += Math.round((Math.ceil(headcount / 25) * ecPtsPer25) / 8);
        });

        return {
            ld: resources.ld || '',
            citizens: '',
            ecPts: resources.ecPts || '',
            horses: ''
        };
    }

    function calculateTrainPreview(affectedBrigades) {
        var preview = calculateEmptyTrainPreview();
        preview.affectedBrigades = affectedBrigades.length;

        angular.forEach(affectedBrigades, function (brigade) {
            var resources = calculateTrainResources(brigade);
            preview.ld += parseInt(resources.ld, 10) || 0;
            preview.ecPts += parseInt(resources.ecPts, 10) || 0;

            angular.forEach(brigade.battalions, function (battalion) {
                if (canTrainBattalion(battalion)) {
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
