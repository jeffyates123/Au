austerlitzModule.controller("mathBattlesController", function ($scope, $q, masterData, turnReportFactory, rulesCatalogFactory, mathBattlesCombatHelperFactory) {
    var RECRUITS_PER_BATTALION = 800;

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
    $scope.availableTerrainIds = ['B', 'Q', 'H', 'K', 'T', 'W', 'G', 'D', 'S'];
    $scope.selectedCalcTerrainId = "";
    $scope.terrainFactorLookup = {};
    $scope.terrainFactorLoaded = false;
    $scope.estimateFederationModal = {
        isOpen: false,
        isLoading: false,
        isCreating: false,
        error: "",
        candidates: [],
        selectedFederationNo: null,
        sourceMathBattleNo: null,
        sourcePhase: "PRE",
        replaceState: "",
        opponentState: ""
    };
    $scope.getSelectedBattle = function () {
        for (var i = 0; i < $scope.mathBattles.length; i++) {
            if ($scope.mathBattles[i].mathBattleNo === $scope.selectedBattleNo) {
                return $scope.mathBattles[i];
            }
        }

        return null;
    };

    $scope.selectBattle = function (battleNo) {
        $scope.selectedBattleNo = battleNo;
        $scope.ensureSelectedState();
        $scope.activeBattleTab = "initial";
        $scope.ensureSelectedCalcTerrain();
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

        var normalizedSelectedState = $scope.selectedState || "";
        var normalizedSides = sides.map(function (side) { return side || ""; });
        if (normalizedSides.indexOf(normalizedSelectedState) === -1) {
            $scope.selectedState = sides[0];
        }
    };

    $scope.setSelectedState = function (stateCode) {
        $scope.selectedState = stateCode;
    };

    $scope.onCalcTerrainSelectionChanged = function (selectedCalcTerrainId) {
        $scope.selectedCalcTerrainId = selectedCalcTerrainId || "";
    };

    $scope.ensureSelectedCalcTerrain = function () {
        var selectedTerrain = $scope.selectedCalcTerrainId || "";
        if (selectedTerrain && selectedTerrain !== "." && ($scope.availableTerrainIds || []).indexOf(selectedTerrain) >= 0) {
            return;
        }

        $scope.selectedCalcTerrainId = ($scope.availableTerrainIds && $scope.availableTerrainIds.length > 0)
            ? $scope.availableTerrainIds[0]
            : "";
    };

    $scope.getTerrainFactorLookupKey = function (terrainId, troopType) {
        return (terrainId || "") + "|" + (troopType || "");
    };

    $scope.getTerrainFactorLookup = function () {
        if ($scope.terrainFactorLoaded) {
            return $q.when($scope.terrainFactorLookup || {});
        }

        return rulesCatalogFactory.getRefTerrainFactor().then(function (rows) {
            var lookup = {};
            angular.forEach(rows || [], function (row) {
                var terrainId = (row && (row.terrainId != null ? row.terrainId : row.TerrainId)) || "";
                var troopType = (row && (row.troopType != null ? row.troopType : row.TroopType)) || "";
                if (!terrainId || !troopType) {
                    return;
                }

                var tf = $scope.toPositiveNumber(row && (row.tf != null ? row.tf : row.TF));
                if (!tf) {
                    return;
                }

                lookup[$scope.getTerrainFactorLookupKey(terrainId, troopType)] = tf;
            });

            $scope.terrainFactorLookup = lookup;
            $scope.terrainFactorLoaded = true;
            return lookup;
        }, function () {
            $scope.terrainFactorLookup = {};
            $scope.terrainFactorLoaded = true;
            return {};
        });
    };

    $scope.getTerrainFactorMultiplier = function (terrainId, troopType) {
        var tf = $scope.toPositiveNumber(($scope.terrainFactorLookup || {})[$scope.getTerrainFactorLookupKey(terrainId, troopType)]);
        if (!tf) {
            return 1;
        }

        return tf > 2 ? (tf / 100) : tf;
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
        return battle.brigades.filter(function (brigade) {
            return brigade.state === $scope.selectedState && ((brigade.phase || "") + "").trim().toUpperCase() === phase;
        });
    };

    $scope.getBattleBrigadesByStateAndPhase = function (battle, stateCode, phase) {
        if (!battle || !battle.brigades || !stateCode || !phase) {
            return [];
        }

        var normalizedPhase = ((phase || "") + "").trim().toUpperCase();
        return (battle.brigades || []).filter(function (brigade) {
            return brigade
                && brigade.state === stateCode
                && ((brigade.phase || "") + "").trim().toUpperCase() === normalizedPhase;
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
            if (!armyItem) {
                return;
            }

            var shortName = armyItem.shortName != null ? armyItem.shortName : armyItem.ShortName;
            if (shortName == null) {
                return;
            }

            var key = shortName.toString().trim().toUpperCase();
            if (key && !lookup[key]) {
                lookup[key] = armyItem;
            }
        });
        return lookup;
    };

    $scope.getArmyLookupForState = function (stateCode) {
        var normalized = stateCode || "";
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
        return mathBattlesCombatHelperFactory.isArtilleryArmyItem(armyItem);
    };

    $scope.getArmyItemPointValue = function (armyItem, propertyNames) {
        if (!armyItem || !propertyNames || !propertyNames.length) {
            return 0;
        }

        for (var i = 0; i < propertyNames.length; i++) {
            var value = armyItem[propertyNames[i]];
            var parsed = $scope.toPositiveNumber(value);
            if (parsed > 0) {
                return parsed;
            }
        }

        return 0;
    };

    $scope.scalePointsForBattalionSize = function (basePointsFor800, men) {
        var basePoints = $scope.toPositiveNumber(basePointsFor800);
        var battalionMen = $scope.toPositiveNumber(men);
        if (!basePoints || !battalionMen || !RECRUITS_PER_BATTALION) {
            return 0;
        }

        return basePoints * (battalionMen / RECRUITS_PER_BATTALION);
    };

    $scope.getBattalionEfFactor = function (brigade, battalionNo, armyItem) {
        var EF_MIN_FALLBACK = 3;
        var actualEf = $scope.toPositiveNumber(brigade["batt" + battalionNo + "EF"]);
        var armyTableEf = $scope.toPositiveNumber(armyItem ? (armyItem.ef != null ? armyItem.ef : armyItem.EF) : 0);

        if (!actualEf) {
            actualEf = EF_MIN_FALLBACK;
        }

        if (!armyTableEf) {
            armyTableEf = EF_MIN_FALLBACK;
        }

        return actualEf / armyTableEf;
    };

    $scope.getBattalionStats = function (brigade, battalionNo, armyLookup) {
        var type = ((brigade["batt" + battalionNo + "Type"] || "") + "").trim();
        if (!type || type === "--") {
            return null;
        }

        var lookupKey = type.toUpperCase();
        var armyItem = armyLookup[lookupKey];
        var men = $scope.toPositiveNumber(brigade["batt" + battalionNo + "Size"]);
        if (!men) {
            return null;
        }

        var lrPoints = $scope.getArmyItemPointValue(armyItem, ["LR_Points", "lR_Points", "lr_Points", "lrPoints", "LRPoints"]);
        var hcPoints = $scope.getArmyItemPointValue(armyItem, ["HC_Points", "hC_Points", "hc_Points", "hcPoints", "HCPoints"]);
        var totalPoints = $scope.getArmyItemPointValue(armyItem, ["Total_Points", "total_Points", "totalPoints", "TotalPoints"]);
        var isArtillery = $scope.isArtilleryArmyItem(armyItem);
        var efFactor = $scope.getBattalionEfFactor(brigade, battalionNo, armyItem);
        var terrainTroopType = mathBattlesCombatHelperFactory.resolveTerrainTroopType(armyItem);

        return {
            men: men,
            lrPoints: lrPoints,
            hcPoints: hcPoints,
            totalPoints: totalPoints,
            efFactor: efFactor,
            terrainTroopType: terrainTroopType,
            isArtillery: isArtillery
        };
    };

    $scope.calculateBrigadeMathValues = function (brigade, armyLookup, selectedTerrainId) {
        var lrTotal = 0;
        var artilleryTotal = 0;
        var hcTotal = 0;
        var totalPoints = 0;

        for (var i = 1; i <= 7; i++) {
            var battalion = $scope.getBattalionStats(brigade, i, armyLookup);
            if (!battalion) {
                continue;
            }

            var terrainMultiplier = $scope.getTerrainFactorMultiplier(selectedTerrainId, battalion.terrainTroopType);
            var battalionLR = $scope.scalePointsForBattalionSize(battalion.lrPoints, battalion.men) * battalion.efFactor * terrainMultiplier;
            var battalionHC = $scope.scalePointsForBattalionSize(battalion.hcPoints, battalion.men) * battalion.efFactor * terrainMultiplier;
            var battalionTotal = $scope.scalePointsForBattalionSize(battalion.totalPoints, battalion.men) * battalion.efFactor * terrainMultiplier;

            lrTotal += battalionLR;
            hcTotal += battalionHC;
            if (battalion.isArtillery) {
                artilleryTotal += battalionLR;
            }
            totalPoints += battalionTotal;
        }

        var calcLR = Math.round(lrTotal);
        var calcArtillery = Math.round(artilleryTotal);
        var calcHC = Math.round(hcTotal);
        var calcTotal = Math.round(totalPoints);

        brigade.calcLR = calcLR;
        brigade.calcArtillery = calcArtillery;
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
        var sides = $scope.getBattleSides();
        if (!battle || !sides.length) {
            return;
        }
        var brigades = [];
        angular.forEach(sides, function (sideCode) {
            brigades = brigades.concat($scope.getBattleBrigadesByStateAndPhase(battle, sideCode, "PRE"));
        });
        if (!brigades.length) {
            $scope.mathBattleCalcError = "No initial brigades found to calculate.";
            return;
        }

        var selectedTerrainId = $scope.selectedCalcTerrainId || "";
        if (!selectedTerrainId || selectedTerrainId === ".") {
            $scope.mathBattleCalcError = "Select a terrain before calculating battle points.";
            return;
        }

        $scope.mathBattleCalcBusy = true;
        var lookupPromises = [
            $scope.getTerrainFactorLookup()
        ].concat(sides.map(function (sideCode) {
            return $scope.getArmyLookupForState(sideCode);
        }));
        $q.all(lookupPromises).then(function (results) {
            var armyLookupByState = {};
            for (var i = 0; i < sides.length; i++) {
                armyLookupByState[sides[i]] = results[i + 1] || {};
            }

            angular.forEach(brigades, function (brigade) {
                var armyLookup = armyLookupByState[brigade.state] || {};
                $scope.calculateBrigadeMathValues(brigade, armyLookup, selectedTerrainId);
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

    $scope.resetEstimateFederationModal = function () {
        $scope.estimateFederationModal.isOpen = false;
        $scope.estimateFederationModal.isLoading = false;
        $scope.estimateFederationModal.isCreating = false;
        $scope.estimateFederationModal.error = "";
        $scope.estimateFederationModal.candidates = [];
        $scope.estimateFederationModal.selectedFederationNo = null;
        $scope.estimateFederationModal.sourceMathBattleNo = null;
        $scope.estimateFederationModal.sourcePhase = "PRE";
        $scope.estimateFederationModal.replaceState = "";
        $scope.estimateFederationModal.opponentState = "";
    };

    $scope.closeEstimateFederationModal = function () {
        $scope.resetEstimateFederationModal();
    };

    $scope.selectEstimateFederationCandidate = function (candidate) {
        if (!candidate || candidate.federationNo == null || $scope.estimateFederationModal.isCreating) {
            return;
        }

        $scope.estimateFederationModal.selectedFederationNo = candidate.federationNo;
    };

    $scope.openEstimateFederationModal = function (battle, sourcePhase) {
        var preferredState = (($scope.masterData && $scope.masterData.selectedState) || "").toString().trim().toUpperCase();
        var replaceState = $scope.selectedState || "";
        if (battle && preferredState && (preferredState === battle.stateA || preferredState === battle.stateB)) {
            replaceState = preferredState;
        }
        var opponentState = "";
        if (battle) {
            if (battle.stateA === replaceState) {
                opponentState = battle.stateB || "";
            } else if (battle.stateB === replaceState) {
                opponentState = battle.stateA || "";
            } else if (battle.stateA) {
                replaceState = battle.stateA;
                opponentState = battle.stateB || "";
            }
        }

        $scope.estimateFederationModal.isOpen = true;
        $scope.estimateFederationModal.isLoading = true;
        $scope.estimateFederationModal.isCreating = false;
        $scope.estimateFederationModal.error = "";
        $scope.estimateFederationModal.candidates = [];
        $scope.estimateFederationModal.selectedFederationNo = null;
        $scope.estimateFederationModal.sourceMathBattleNo = battle.mathBattleNo;
        $scope.estimateFederationModal.sourcePhase = sourcePhase;
        $scope.estimateFederationModal.replaceState = replaceState;
        $scope.estimateFederationModal.opponentState = opponentState;

        turnReportFactory.getTRMathBattleFederationCandidates(
            $scope.masterData.turnId,
            battle.mathBattleNo,
            replaceState
        ).then(function (candidates) {
            $scope.estimateFederationModal.candidates = candidates || [];
            if ($scope.estimateFederationModal.candidates.length > 0) {
                $scope.estimateFederationModal.selectedFederationNo = $scope.estimateFederationModal.candidates[0].federationNo;
            } else {
                $scope.estimateFederationModal.error = "No federation candidates were found in this sphere.";
            }
        }, function () {
            $scope.estimateFederationModal.error = "Could not load federation candidates.";
        }).finally(function () {
            $scope.estimateFederationModal.isLoading = false;
        });
    };

    $scope.confirmEstimateFederationSelection = function () {
        $scope.mathBattleEstimateError = "";
        $scope.estimateFederationModal.error = "";

        var federationNo = parseInt($scope.estimateFederationModal.selectedFederationNo, 10);
        if (isNaN(federationNo) || federationNo <= 0) {
            $scope.estimateFederationModal.error = "Select a federation to continue.";
            return;
        }

        $scope.estimateFederationModal.isCreating = true;
        $scope.mathBattleEstimateBusy = true;

        turnReportFactory.createTRFederationEstimatedMathBattle(
            $scope.masterData.turnId,
            $scope.estimateFederationModal.sourceMathBattleNo,
            $scope.estimateFederationModal.sourcePhase,
            $scope.estimateFederationModal.replaceState,
            federationNo
        ).then(function (response) {
            var createdBattleNo = response && response.mathBattleNo;
            return $scope.loadMathBattles(createdBattleNo).then(function () {
                $scope.activeBattleTab = "initial";
                $scope.calculateInitialBrigadeValues();
                $scope.closeEstimateFederationModal();
            });
        }, function (error) {
            var message = (error && error.data) ? error.data : "Could not create estimated battle.";
            $scope.estimateFederationModal.error = message;
            $scope.mathBattleEstimateError = message;
        }).finally(function () {
            $scope.estimateFederationModal.isCreating = false;
            $scope.mathBattleEstimateBusy = false;
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
        $scope.openEstimateFederationModal(battle, sourcePhase);
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
    $scope.resetEstimateFederationModal();
});
