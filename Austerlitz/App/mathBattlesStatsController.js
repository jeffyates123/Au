"use strict";

austerlitzModule.controller("mathBattlesStatsController", function ($scope, rulesCatalogFactory, mathBattlesCombatHelperFactory) {
    var RECRUITS_PER_BATTALION = 800;
    var RECRUITS_PER_EC_BLOCK = 25;
    var TRAINING_START_EF = 3;
    var TRAINING_COST_DIVISOR = 10;

    $scope.armyStatsRows = [];
    $scope.armyStatsLoading = false;
    $scope.armyStatsLoadError = "";
    $scope.statsStateCode = "";
    $scope.availableStatsNations = [];
    $scope.selectedStatsNation = "";
    $scope.hasUserSelectedStatsNation = false;

    $scope.normalizeStateCode = function (value) {
        return ((value || "") + "").trim().toUpperCase();
    };

    $scope.toPositiveNumber = function (value) {
        var parsed = parseFloat(value);
        return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    };

    $scope.toPositiveInt = function (value) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    };

    $scope.getArmyItemPointValue = function (armyItem, propertyNames) {
        if (!armyItem || !propertyNames || !propertyNames.length) {
            return 0;
        }

        for (var i = 0; i < propertyNames.length; i++) {
            var value = $scope.toPositiveNumber(armyItem[propertyNames[i]]);
            if (value > 0) {
                return value;
            }
        }

        return 0;
    };

    $scope.resolveLoadedStateCode = function () {
        var selectedState = $scope.normalizeStateCode($scope.masterData && $scope.masterData.selectedState);
        if (selectedState) {
            return selectedState;
        }

        var turnId = ($scope.masterData && $scope.masterData.turnId) || "";
        return turnId.length >= 4 ? $scope.normalizeStateCode(turnId.substr(3, 1)) : "";
    };

    $scope.getStateField = function (stateItem, lowerName, upperName) {
        if (!stateItem) {
            return "";
        }

        var value = stateItem[lowerName] != null ? stateItem[lowerName] : stateItem[upperName];
        return ((value || "") + "").trim();
    };

    $scope.extractStateCatalogRows = function () {
        var rulesCatalog = $scope.masterData ? $scope.masterData.rulesCatalog : null;
        return rulesCatalog ? (rulesCatalog.States || rulesCatalog.states || []) : [];
    };

    $scope.mapStateCatalogToNationOptions = function (states) {
        var seen = {};
        var options = [];

        for (var i = 0; i < (states || []).length; i++) {
            var state = states[i] || {};
            var code = $scope.normalizeStateCode($scope.getStateField(state, "state", "State"));
            if (!code || seen[code]) {
                continue;
            }

            seen[code] = true;
            var stateName = $scope.getStateField(state, "stateName", "StateName");
            options.push({
                code: code,
                label: stateName ? (code + " - " + stateName) : code
            });
        }

        options.sort(function (left, right) {
            return left.label.localeCompare(right.label);
        });

        return options;
    };

    $scope.hasNationOption = function (stateCode) {
        var normalized = $scope.normalizeStateCode(stateCode);
        if (!normalized || !$scope.availableStatsNations.length) {
            return false;
        }

        for (var i = 0; i < $scope.availableStatsNations.length; i++) {
            if ($scope.availableStatsNations[i].code === normalized) {
                return true;
            }
        }

        return false;
    };

    $scope.resolveInitialSelectedNation = function () {
        var currentSelected = $scope.normalizeStateCode($scope.selectedStatsNation);
        if ($scope.hasNationOption(currentSelected)) {
            return currentSelected;
        }

        var preferredLoaded = $scope.resolveLoadedStateCode();
        if ($scope.hasNationOption(preferredLoaded)) {
            return preferredLoaded;
        }

        return $scope.availableStatsNations.length ? $scope.availableStatsNations[0].code : "";
    };

    $scope.isArtilleryItemNo = function (itemNo) {
        return mathBattlesCombatHelperFactory.isArtilleryArmyItem({ itemNo: itemNo });
    };

    $scope.mapArmyItemToStatsRow = function (armyItem) {
        var ef = $scope.toPositiveNumber(armyItem.ef != null ? armyItem.ef : armyItem.EF);
        var totalEf = $scope.toPositiveInt(armyItem.ef != null ? armyItem.ef : armyItem.EF);
        var lr = $scope.toPositiveNumber(armyItem.lr != null ? armyItem.lr : armyItem.LR);
        var rg = $scope.toPositiveNumber(armyItem.rg != null ? armyItem.rg : armyItem.RG);
        var hc = $scope.toPositiveNumber(armyItem.hc != null ? armyItem.hc : armyItem.HC);
        var itemNo = $scope.toPositiveInt(armyItem.itemNo != null ? armyItem.itemNo : armyItem.ItemNo);
        var cost = $scope.toPositiveNumber(armyItem.cost != null ? armyItem.cost : armyItem.Cost);
        var ecPtsPer25 = $scope.toPositiveNumber(armyItem.ecPtsPer25 != null ? armyItem.ecPtsPer25 : armyItem.EcPtsPer25);
        var calcLR = Math.round($scope.getArmyItemPointValue(armyItem, ["LR_Points", "lR_Points", "lr_Points", "lrPoints", "LRPoints"]));
        var calcHC = Math.round($scope.getArmyItemPointValue(armyItem, ["HC_Points", "hC_Points", "hc_Points", "hcPoints", "HCPoints"]));
        var calcTotal = Math.round($scope.getArmyItemPointValue(armyItem, ["Total_Points", "total_Points", "totalPoints", "TotalPoints"]));

        var calcArtillery = $scope.isArtilleryItemNo(itemNo) ? calcLR : 0;

        var louisdorePerBattalion = Math.round(RECRUITS_PER_BATTALION * cost);
        var trainingSteps = Math.max(0, totalEf - TRAINING_START_EF);
        var trainingCostPerTraining = Math.round(louisdorePerBattalion / TRAINING_COST_DIVISOR);
        var totalTrainingCost = Math.round(trainingCostPerTraining * trainingSteps);
        var louisdorePerBattalionWithTraining = louisdorePerBattalion + totalTrainingCost;
        var ectsPerBattalion = Math.round(
            Math.ceil(RECRUITS_PER_BATTALION / RECRUITS_PER_EC_BLOCK) * ecPtsPer25
        );

        return {
            itemNo: armyItem.itemNo != null ? armyItem.itemNo : armyItem.ItemNo,
            name: armyItem.name != null ? armyItem.name : armyItem.Name,
            shortName: armyItem.shortName != null ? armyItem.shortName : armyItem.ShortName,
            lr: lr,
            rg: rg,
            simMP: armyItem.simMP != null ? armyItem.simMP : armyItem.SimMP,
            mp: armyItem.mp != null ? armyItem.mp : armyItem.MP,
            ef: ef,
            hc: hc,
            formation: armyItem.formation != null ? armyItem.formation : armyItem.Formation,
            cost: cost,
            ecPtsPer25: ecPtsPer25,
            ectsPerBattalion: ectsPerBattalion,
            louisdorePerBattalion: louisdorePerBattalion,
            louisdorePerBattalionWithTraining: louisdorePerBattalionWithTraining,
            calcArtillery: calcArtillery,
            calcLR: calcLR,
            calcHC: calcHC,
            calcTotal: calcTotal,
            pointsPerLouisdore: calcTotal > 0
                ? Math.round(louisdorePerBattalion / calcTotal)
                : null,
            pointsPerLouisdoreWithTraining: calcTotal > 0
                ? Math.round(louisdorePerBattalionWithTraining / calcTotal)
                : null
        };
    };

    $scope.loadStatsRows = function (stateCode) {
        var normalizedStateCode = $scope.normalizeStateCode(stateCode);
        $scope.statsStateCode = normalizedStateCode;
        $scope.armyStatsLoadError = "";

        if (!normalizedStateCode) {
            $scope.armyStatsRows = [];
            return;
        }

        $scope.armyStatsLoading = true;
        rulesCatalogFactory.getArmyList(normalizedStateCode).then(function (armyList) {
            $scope.armyStatsRows = (armyList || []).map(function (item) {
                return $scope.mapArmyItemToStatsRow(item || {});
            });
        }, function () {
            $scope.armyStatsRows = [];
            $scope.armyStatsLoadError = "Could not load army stats for the selected nation.";
        }).finally(function () {
            $scope.armyStatsLoading = false;
        });
    };

    $scope.applyNationOptions = function (options) {
        $scope.availableStatsNations = options || [];

        var selectedNation = $scope.resolveInitialSelectedNation();
        if (!selectedNation) {
            $scope.selectedStatsNation = "";
            $scope.loadStatsRows("");
            return;
        }

        $scope.selectedStatsNation = selectedNation;
        $scope.loadStatsRows(selectedNation);
    };

    $scope.loadNationOptions = function () {
        var existingStateCatalogRows = $scope.extractStateCatalogRows();
        if (existingStateCatalogRows.length) {
            $scope.applyNationOptions($scope.mapStateCatalogToNationOptions(existingStateCatalogRows));
            return;
        }

        rulesCatalogFactory.getRefStates().then(function (states) {
            $scope.applyNationOptions($scope.mapStateCatalogToNationOptions(states || []));
        }, function () {
            var fallbackStateCode = $scope.resolveLoadedStateCode();
            $scope.availableStatsNations = fallbackStateCode ? [{ code: fallbackStateCode, label: fallbackStateCode }] : [];
            $scope.selectedStatsNation = fallbackStateCode;
            $scope.loadStatsRows(fallbackStateCode);
        });
    };

    $scope.onSelectedStatsNationChanged = function () {
        $scope.hasUserSelectedStatsNation = true;
        $scope.selectedStatsNation = $scope.normalizeStateCode($scope.selectedStatsNation);
        $scope.loadStatsRows($scope.selectedStatsNation);
    };

    $scope.trySetPreferredNationFromLoadedState = function () {
        if ($scope.hasUserSelectedStatsNation || !$scope.availableStatsNations.length) {
            return;
        }

        var preferredLoaded = $scope.resolveLoadedStateCode();
        if (!preferredLoaded || preferredLoaded === $scope.selectedStatsNation || !$scope.hasNationOption(preferredLoaded)) {
            return;
        }

        $scope.selectedStatsNation = preferredLoaded;
        $scope.loadStatsRows(preferredLoaded);
    };

    $scope.$watch(function () {
        var state = $scope.masterData ? $scope.masterData.selectedState : "";
        var turnId = $scope.masterData ? $scope.masterData.turnId : "";
        return $scope.normalizeStateCode(state) + "|" + (turnId || "");
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.trySetPreferredNationFromLoadedState();
        }
    });

    $scope.$watch(function () {
        return $scope.extractStateCatalogRows().length;
    }, function (newValue, oldValue) {
        if (newValue > 0 && newValue !== oldValue && !$scope.availableStatsNations.length) {
            $scope.applyNationOptions($scope.mapStateCatalogToNationOptions($scope.extractStateCatalogRows()));
        }
    });

    $scope.loadNationOptions();
});
