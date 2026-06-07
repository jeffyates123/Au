"use strict";

austerlitzModule.controller("mathBattlesStatsController", function ($scope, rulesCatalogFactory) {
    var RECRUITS_PER_BATTALION = 800;
    var RECRUITS_PER_EC_BLOCK = 25;
    var calcConfig = {
        terrainFactor: 1,
        randomFactor: 1.5,
        longRangeDivisor: 333,
        handToHandDivisor: 250,
        artilleryItemNoMin: 41,
        artilleryItemNoMax: 45
    };

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

    $scope.resolveLoadedStateCode = function () {
        var selectedState = $scope.normalizeStateCode($scope.masterData && $scope.masterData.selectedState);
        if (selectedState) {
            return selectedState;
        }

        var turnId = ($scope.masterData && $scope.masterData.turnId) || "";
        return turnId.length >= 4 ? $scope.normalizeStateCode(turnId.substr(3, 1)) : "";
    };

    $scope.isArtilleryItemNo = function (itemNo) {
        return itemNo >= calcConfig.artilleryItemNoMin && itemNo <= calcConfig.artilleryItemNoMax;
    };

    $scope.calculateLongRangePoints = function (ef, lr, rg, men) {
        return (ef * Math.sqrt(lr * rg) * men * calcConfig.terrainFactor * calcConfig.randomFactor) / calcConfig.longRangeDivisor;
    };

    $scope.calculateHandToHandPoints = function (ef, hc, men) {
        return (ef * Math.sqrt(hc) * men * calcConfig.terrainFactor * calcConfig.randomFactor) / calcConfig.handToHandDivisor;
    };

    $scope.mapArmyItemToStatsRow = function (armyItem) {
        var ef = $scope.toPositiveNumber(armyItem.ef != null ? armyItem.ef : armyItem.EF);
        var lr = $scope.toPositiveNumber(armyItem.lr != null ? armyItem.lr : armyItem.LR);
        var rg = $scope.toPositiveNumber(armyItem.rg != null ? armyItem.rg : armyItem.RG);
        var hc = $scope.toPositiveNumber(armyItem.hc != null ? armyItem.hc : armyItem.HC);
        var itemNo = $scope.toPositiveInt(armyItem.itemNo != null ? armyItem.itemNo : armyItem.ItemNo);
        var cost = $scope.toPositiveNumber(armyItem.cost != null ? armyItem.cost : armyItem.Cost);
        var ecPtsPer25 = $scope.toPositiveNumber(armyItem.ecPtsPer25 != null ? armyItem.ecPtsPer25 : armyItem.EcPtsPer25);

        var calcLR = (ef > 0 && lr > 0 && rg > 0)
            ? Math.round($scope.calculateLongRangePoints(ef, lr, rg, RECRUITS_PER_BATTALION))
            : 0;
        var calcHC = (ef > 0 && hc > 0)
            ? Math.round($scope.calculateHandToHandPoints(ef, hc, RECRUITS_PER_BATTALION))
            : 0;
        var calcArtillery = $scope.isArtilleryItemNo(itemNo) ? calcLR : 0;
        var calcTotal = (calcLR * 2) + (calcHC * 2) + calcArtillery;

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
