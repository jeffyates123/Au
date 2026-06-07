austerlitzModule.controller("mathBattlesController", function ($scope, $q, masterData, turnReportFactory, rulesCatalogFactory) {
    $scope.masterData = masterData;
    $scope.mathBattles = [];
    $scope.selectedBattleNo = null;
    $scope.activeBattleTab = "initial";
    $scope.selectedState = "";
    $scope.mathBattleLoadError = "";
    $scope.mathBattleLoading = false;
    $scope.mathBattleCalcBusy = false;
    $scope.mathBattleCalcError = "";
    $scope.mathBattleEstimateBusy = false;
    $scope.mathBattleEstimateError = "";
    $scope.armyListLookupByState = {};
    $scope.mathBattleCalcConfig = {
        terrainFactor: 1,
        randomFactor: 1.5,
        longRangeDivisor: 333,
        handToHandDivisor: 250,
        artilleryItemNoMin: 41,
        artilleryItemNoMax: 45
    };

    $scope.getSelectedBattle = function () {
        for (var i = 0; i < $scope.mathBattles.length; i++) {
            if ($scope.mathBattles[i].mathBattleNo === $scope.selectedBattleNo) {
                return $scope.mathBattles[i];
            }
        }

        return null;
    };

    $scope.normalizeStateCode = function (value) {
        return ((value || "") + "").trim().toUpperCase();
    };

    $scope.selectBattle = function (battleNo) {
        $scope.selectedBattleNo = battleNo;
        $scope.ensureSelectedState();
        $scope.activeBattleTab = "initial";
    };

    $scope.selectBattleTab = function (tabName) {
        $scope.activeBattleTab = tabName;
    };

    $scope.getBattleSides = function () {
        var battle = $scope.getSelectedBattle();
        if (!battle) {
            return [];
        }

        var sides = [];
        if (battle.stateA) {
            sides.push(battle.stateA);
        }
        if (battle.stateB && battle.stateB !== battle.stateA) {
            sides.push(battle.stateB);
        }
        return sides;
    };

    $scope.isSelectedBattleEstimated = function () {
        var battle = $scope.getSelectedBattle();
        return !!(battle && battle.isEstimated);
    };

    $scope.shouldShowCalculateBattle = function () {
        return $scope.activeBattleTab === "initial" && $scope.isSelectedBattleEstimated();
    };

    $scope.canCreateEstimatedBattle = function () {
        if ($scope.activeBattleTab !== "initial" && $scope.activeBattleTab !== "final") {
            return false;
        }

        if ($scope.isSelectedBattleEstimated()) {
            return false;
        }

        return $scope.getBattleSides().length >= 2;
    };

    $scope.ensureSelectedState = function () {
        var sides = $scope.getBattleSides();
        if (!sides.length) {
            $scope.selectedState = "";
            return;
        }

        var normalizedSelectedState = $scope.normalizeStateCode($scope.selectedState);
        var normalizedSides = sides.map(function (side) { return $scope.normalizeStateCode(side); });
        if (normalizedSides.indexOf(normalizedSelectedState) === -1) {
            $scope.selectedState = sides[0];
        }
    };

    $scope.setSelectedState = function (stateCode) {
        $scope.selectedState = stateCode;
    };

    $scope.getActivePhase = function () {
        return $scope.activeBattleTab === "final" ? "POST" : "PRE";
    };

    $scope.getBrigadeKey = function (brigade, index) {
        return ((brigade.phase || "") + ":" + (brigade.state || "") + ":" + (brigade.name || "") + ":" + index);
    };

    $scope.getVisibleBrigades = function () {
        var battle = $scope.getSelectedBattle();
        if (!battle || !battle.brigades || !$scope.selectedState) {
            $scope.ensureSelectedState();
        }

        if (!battle || !battle.brigades || !$scope.selectedState) {
            return [];
        }

        var phase = $scope.getActivePhase();
        var selectedState = $scope.normalizeStateCode($scope.selectedState);
        return battle.brigades.filter(function (brigade) {
            return $scope.normalizeStateCode(brigade.state) === selectedState && ((brigade.phase || "") + "").trim().toUpperCase() === phase;
        });
    };

    $scope.getSelectedBattlePhase = function (phaseKey) {
        var battle = $scope.getSelectedBattle();
        if (!battle || !phaseKey) {
            return {};
        }

        // Handle WebApi/JSON casing differences for acronym-heavy keys (LR1/H2H1/etc.).
        var keyOptions = {
            art: ["art", "Art"],
            lr1: ["lr1", "lR1", "LR1"],
            h2h1: ["h2h1", "h2H1", "H2H1"],
            h2h2: ["h2h2", "h2H2", "H2H2"],
            lr2: ["lr2", "lR2", "LR2"]
        };

        var candidates = keyOptions[phaseKey] || [phaseKey];
        for (var i = 0; i < candidates.length; i++) {
            if (battle[candidates[i]]) {
                return battle[candidates[i]];
            }
        }

        return {};
    };

    $scope.formatBattalionDisplay = function (brigade, battalionNo) {
        var type = ((brigade["batt" + battalionNo + "Type"] || "") + "").trim();
        if (!type || type === "--") {
            return "- -- ---";
        }

        var parts = [type];
        var ef = brigade["batt" + battalionNo + "EF"];
        var size = brigade["batt" + battalionNo + "Size"];
        if (ef != null && ef !== "") {
            parts.push(ef);
        }
        if (size != null && size !== "") {
            parts.push(size);
        }
        return parts.join(" ");
    };

    $scope.buildArmyLookup = function (armyList) {
        var lookup = {};
        angular.forEach(armyList || [], function (armyItem) {
            if (!armyItem || armyItem.shortName == null) {
                return;
            }
            var key = armyItem.shortName.toString().trim().toUpperCase();
            if (key && !lookup[key]) {
                lookup[key] = armyItem;
            }
        });
        return lookup;
    };

    $scope.getArmyLookupForState = function (stateCode) {
        var normalized = $scope.normalizeStateCode(stateCode);
        if (!normalized) {
            return $q.when({});
        }

        if ($scope.armyListLookupByState[normalized]) {
            return $q.when($scope.armyListLookupByState[normalized]);
        }

        return rulesCatalogFactory.getArmyList(normalized).then(function (armyList) {
            var lookup = $scope.buildArmyLookup(armyList);
            $scope.armyListLookupByState[normalized] = lookup;
            return lookup;
        }, function () {
            $scope.armyListLookupByState[normalized] = {};
            return {};
        });
    };

    $scope.toPositiveNumber = function (value) {
        var parsed = parseFloat(value);
        return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    };

    $scope.isArtilleryArmyItem = function (armyItem) {
        if (!armyItem) {
            return false;
        }

        var itemNo = parseInt(armyItem.itemNo != null ? armyItem.itemNo : armyItem.ItemNo, 10);
        return itemNo >= $scope.mathBattleCalcConfig.artilleryItemNoMin && itemNo <= $scope.mathBattleCalcConfig.artilleryItemNoMax;
    };

    $scope.calculateLongRangePoints = function (ef, lr, rg, men) {
        var cfg = $scope.mathBattleCalcConfig;
        return (ef * Math.sqrt(lr * rg) * men * cfg.terrainFactor * cfg.randomFactor) / cfg.longRangeDivisor;
    };

    $scope.calculateHandToHandPoints = function (ef, hc, men) {
        var cfg = $scope.mathBattleCalcConfig;
        return (ef * Math.sqrt(hc) * men * cfg.terrainFactor * cfg.randomFactor) / cfg.handToHandDivisor;
    };

    $scope.getBattalionStats = function (brigade, battalionNo, armyLookup) {
        var type = ((brigade["batt" + battalionNo + "Type"] || "") + "").trim();
        if (!type || type === "--") {
            return null;
        }

        var lookupKey = type.toUpperCase();
        var armyItem = armyLookup[lookupKey];
        var ef = $scope.toPositiveNumber(brigade["batt" + battalionNo + "EF"]);
        if (!ef && armyItem) {
            ef = $scope.toPositiveNumber(armyItem.ef != null ? armyItem.ef : armyItem.EF);
        }
        var men = $scope.toPositiveNumber(brigade["batt" + battalionNo + "Size"]);
        if (!ef || !men) {
            return null;
        }

        var lr = armyItem ? $scope.toPositiveNumber(armyItem.lr != null ? armyItem.lr : armyItem.LR) : 0;
        var rg = armyItem ? $scope.toPositiveNumber(armyItem.rg != null ? armyItem.rg : armyItem.RG) : 0;
        var hc = armyItem ? $scope.toPositiveNumber(armyItem.hc != null ? armyItem.hc : armyItem.HC) : 0;
        var isArtillery = $scope.isArtilleryArmyItem(armyItem);

        return {
            ef: ef,
            men: men,
            lr: lr,
            rg: rg,
            hc: hc,
            isArtillery: isArtillery
        };
    };

    $scope.calculateBrigadeMathValues = function (brigade, armyLookup) {
        var lrTotal = 0;
        var artilleryTotal = 0;
        var hcTotal = 0;

        for (var i = 1; i <= 7; i++) {
            var battalion = $scope.getBattalionStats(brigade, i, armyLookup);
            if (!battalion) {
                continue;
            }

            if (battalion.lr > 0 && battalion.rg > 0) {
                var longRangePoints = $scope.calculateLongRangePoints(battalion.ef, battalion.lr, battalion.rg, battalion.men);
                lrTotal += longRangePoints;
                if (battalion.isArtillery) {
                    artilleryTotal += longRangePoints;
                }
            }

            if (battalion.hc > 0) {
                var handToHandPoints = $scope.calculateHandToHandPoints(battalion.ef, battalion.hc, battalion.men);
                hcTotal += handToHandPoints;
            }
        }

        var calcLR = Math.round(lrTotal);
        var calcArtillery = Math.round(artilleryTotal);
        var calcHC = Math.round(hcTotal);
        var calcTotal = (calcLR * 2) + (calcHC * 2) + calcArtillery;

        brigade.calcLR = calcLR;
        brigade.calcArtillery = calcArtillery;
        brigade.calcArtileery = calcArtillery;
        brigade.calcHC = calcHC;
        brigade.calcTotal = calcTotal;
    };

    $scope.calculateInitialBrigadeValues = function () {
        $scope.mathBattleCalcError = "";
        if (!$scope.shouldShowCalculateBattle()) {
            return;
        }

        var battle = $scope.getSelectedBattle();
        var selectedBattleNo = battle && battle.mathBattleNo;
        var brigades = $scope.getVisibleBrigades();
        if (!brigades.length) {
            return;
        }

        $scope.mathBattleCalcBusy = true;
        $scope.getArmyLookupForState($scope.selectedState).then(function (armyLookup) {
            angular.forEach(brigades, function (brigade) {
                $scope.calculateBrigadeMathValues(brigade, armyLookup || {});
            });

            var calcRows = brigades.map(function (brigade) {
                return {
                    mathBattleBrigadeId: brigade.mathBattleBrigadeId,
                    calcLR: brigade.calcLR,
                    calcArtileery: brigade.calcArtillery,
                    calcHC: brigade.calcHC,
                    calcTotal: brigade.calcTotal
                };
            });

            return turnReportFactory.saveTRMathBattleBrigadeCalcs($scope.masterData.turnId, calcRows, selectedBattleNo).then(function () {
                return $scope.loadMathBattles(selectedBattleNo);
            });
        }, function () {
            $scope.mathBattleCalcError = "Could not calculate brigade values right now.";
        }).then(null, function () {
            $scope.mathBattleCalcError = "Calculated values shown, but could not save to database.";
        }).finally(function () {
            $scope.mathBattleCalcBusy = false;
        });
    };

    $scope.createEstimatedBattle = function () {
        $scope.mathBattleEstimateError = "";

        var battle = $scope.getSelectedBattle();
        if (!battle || !battle.mathBattleNo) {
            $scope.mathBattleEstimateError = "Select a battle first.";
            return;
        }

        if (!$scope.canCreateEstimatedBattle()) {
            $scope.mathBattleEstimateError = "Estimated battles require two armies on the Initial or Final tab.";
            return;
        }

        var sourcePhase = $scope.activeBattleTab === "final" ? "POST" : "PRE";
        $scope.mathBattleEstimateBusy = true;

        turnReportFactory.createTREstimatedMathBattle($scope.masterData.turnId, battle.mathBattleNo, sourcePhase).then(function (response) {
            var createdBattleNo = response && response.mathBattleNo;
            return $scope.loadMathBattles(createdBattleNo);
        }, function () {
            $scope.mathBattleEstimateError = "Could not create estimated battle.";
        }).finally(function () {
            $scope.mathBattleEstimateBusy = false;
        });
    };

    $scope.normalizeLoadedCalcFields = function (battles) {
        angular.forEach(battles || [], function (battle) {
            angular.forEach((battle && battle.brigades) || [], function (brigade) {
                if (!brigade) {
                    return;
                }

                if (brigade.calcArtillery == null && brigade.calcArtileery != null) {
                    brigade.calcArtillery = brigade.calcArtileery;
                }
            });
        });
    };

    $scope.loadMathBattles = function (preferredBattleNo) {
        if (!$scope.masterData.turnId || $scope.masterData.turnId === "Unknown") {
            $scope.mathBattles = [];
            $scope.selectedBattleNo = null;
            return $q.when([]);
        }

        $scope.mathBattleLoading = true;
        $scope.mathBattleLoadError = "";
        $scope.mathBattleEstimateError = "";
        return turnReportFactory.getTRMathBattles($scope.masterData.turnId).then(function (battles) {
            $scope.mathBattles = battles || [];
            $scope.normalizeLoadedCalcFields($scope.mathBattles);
            $scope.armyListLookupByState = {};
            if ($scope.mathBattles.length > 0) {
                var selectedNo = preferredBattleNo;
                if (selectedNo == null) {
                    selectedNo = $scope.mathBattles[0].mathBattleNo;
                }

                var hasSelectedNo = $scope.mathBattles.some(function (item) {
                    return item.mathBattleNo === selectedNo;
                });

                $scope.selectBattle(hasSelectedNo ? selectedNo : $scope.mathBattles[0].mathBattleNo);
            } else {
                $scope.selectedBattleNo = null;
                $scope.selectedState = "";
            }
        }, function () {
            $scope.mathBattleLoadError = "Could not load mathematical battle data.";
            $scope.mathBattles = [];
            $scope.selectedBattleNo = null;
            $scope.selectedState = "";
        }).finally(function () {
            $scope.mathBattleLoading = false;
        });
    };

    $scope.$watch(function () {
        return $scope.masterData.turnId;
    }, function (newTurnId, oldTurnId) {
        if (newTurnId && newTurnId !== oldTurnId) {
            $scope.loadMathBattles();
        }
    });

    $scope.loadMathBattles();
});
