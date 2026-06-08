"use strict";

austerlitzModule.controller("mathBattlesStatsController", function ($scope, rulesCatalogFactory, mathBattlesCombatHelperFactory) {
    var RECRUITS_PER_BATTALION = 800;
    var RECRUITS_PER_EC_BLOCK = 25;

    $scope.armyStatsRows = [];
    $scope.armyStatsLoading = false;
    $scope.armyStatsLoadError = "";
    $scope.statsStateCode = "";

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

    $scope.isArtilleryItemNo = function (itemNo) {
        return mathBattlesCombatHelperFactory.isArtilleryArmyItem({ itemNo: itemNo });
    };

    $scope.mapArmyItemToStatsRow = function (armyItem) {
        var ef = $scope.toPositiveNumber(armyItem.ef != null ? armyItem.ef : armyItem.EF);
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
            calcArtillery: calcArtillery,
            calcLR: calcLR,
            calcHC: calcHC,
            calcTotal: calcTotal,
            pointsPerLouisdore: calcTotal > 0
                ? Math.round(louisdorePerBattalion / calcTotal)
                : null
        };
    };

    $scope.loadStatsRows = function () {
        var stateCode = $scope.resolveLoadedStateCode();
        $scope.statsStateCode = stateCode;
        $scope.armyStatsLoadError = "";

        if (!stateCode) {
            $scope.armyStatsRows = [];
            return;
        }

        $scope.armyStatsLoading = true;
        rulesCatalogFactory.getArmyList(stateCode).then(function (armyList) {
            $scope.armyStatsRows = (armyList || []).map(function (item) {
                return $scope.mapArmyItemToStatsRow(item || {});
            });
        }, function () {
            $scope.armyStatsRows = [];
            $scope.armyStatsLoadError = "Could not load army stats for the selected state.";
        }).finally(function () {
            $scope.armyStatsLoading = false;
        });
    };

    $scope.$watch(function () {
        var state = $scope.masterData ? $scope.masterData.selectedState : "";
        var turnId = $scope.masterData ? $scope.masterData.turnId : "";
        return $scope.normalizeStateCode(state) + "|" + (turnId || "");
    }, function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.loadStatsRows();
        }
    });

    $scope.loadStatsRows();
});
