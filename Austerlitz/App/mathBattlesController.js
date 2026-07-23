austerlitzModule.controller("mathBattlesController", function ($scope, $q, masterData, turnReportFactory, rulesCatalogFactory, mathBattlesCombatHelperFactory) {
    var RECRUITS_PER_BATTALION = 800;
    var MODEL_BATTLE_NAME = "MODEL BATTLE";
    var MODEL_BATTLE_BATT_SLOTS = [1, 2, 3, 4, 5, 6, 7];
    var MODEL_BATTLE_EMPTY_BATT = "--";
    var MODEL_BATTLE_MIN_EMPTY_ROWS = 4;

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
        selectedCandidateKeys: {},
        sourceMathBattleNo: null,
        sourcePhase: "PRE",
        flowType: "fight",
        replaceState: "",
        opponentState: ""
    };
    $scope.modelBattleCreate = {
        isCreating: false,
        error: "",
        sideBState: "",
        isArming: false
    };
    $scope.modelBattleSideBOptions = [];
    $scope.modelBattleBuilder = {
        sourceBattleNo: null,
        rows: [],
        isDirty: false,
        isSaving: false,
        saveError: ""
    };
    $scope.modelBattleArmyRows = [];
    $scope.modelBattleArmyLoadError = "";
    $scope.modelBattleArmyLoading = false;
    $scope.selectedModelBattleArmyItem = null;

    $scope.normalizeStateCode = function (value) {
        return ((value || "") + "").trim().toUpperCase();
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
        $scope.ensureModelBattleBuilder();
        $scope.refreshModelBattleArmyRows();
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

    $scope.isSelectedBattleModelBattle = function () {
        var battle = $scope.getSelectedBattle();
        var winnerText = (battle && battle.winner ? battle.winner : "");
        return !!(battle && battle.isEstimated && winnerText.toString().trim().toUpperCase() === MODEL_BATTLE_NAME);
    };

    $scope.getRulesCatalogStates = function () {
        var rulesCatalog = ($scope.masterData && $scope.masterData.rulesCatalog) || {};
        return rulesCatalog.States || rulesCatalog.states || [];
    };

    $scope.getModelBattleSideAState = function () {
        return $scope.normalizeStateCode($scope.masterData && $scope.masterData.selectedState);
    };

    $scope.rebuildModelBattleSideBOptions = function () {
        var sideA = $scope.getModelBattleSideAState();
        var options = [];
        angular.forEach($scope.getRulesCatalogStates(), function (stateRow) {
            var stateCode = $scope.normalizeStateCode(stateRow && (stateRow.State || stateRow.state));
            if (!stateCode || stateCode === sideA) {
                return;
            }

            var stateName = ((stateRow && (stateRow.StateName || stateRow.stateName)) || stateCode).toString().trim();
            options.push({
                state: stateCode,
                label: stateCode + " - " + stateName
            });
        });
        options.sort(function (left, right) {
            return left.label.localeCompare(right.label);
        });
        $scope.modelBattleSideBOptions = options;
    };

    $scope.syncModelBattleSideBSelection = function () {
        var selectedBattle = $scope.getSelectedBattle();
        if (selectedBattle && $scope.isSelectedBattleModelBattle()) {
            var selectedBattleStateB = $scope.normalizeStateCode(selectedBattle.stateB);
            if (selectedBattleStateB) {
                $scope.modelBattleCreate.sideBState = selectedBattleStateB;
                return;
            }
        }

        var options = $scope.modelBattleSideBOptions || [];
        if (!options.length) {
            $scope.modelBattleCreate.sideBState = "";
            return;
        }

        var selected = $scope.normalizeStateCode($scope.modelBattleCreate.sideBState);
        var hasSelected = options.some(function (option) {
            return option.state === selected;
        });
        if (!hasSelected) {
            $scope.modelBattleCreate.sideBState = options[0].state;
        }
    };

    $scope.canCreateModelBattle = function () {
        var sideA = $scope.getModelBattleSideAState();
        var sideB = $scope.normalizeStateCode($scope.modelBattleCreate.sideBState);
        var terrain = (($scope.selectedCalcTerrainId || "") + "").trim().toUpperCase();
        return !!(sideA && sideB && sideA !== sideB && terrain);
    };

    $scope.resetModelBattleBuilder = function () {
        $scope.modelBattleBuilder.sourceBattleNo = null;
        $scope.modelBattleBuilder.rows = [];
        $scope.modelBattleBuilder.isDirty = false;
        $scope.modelBattleBuilder.isSaving = false;
        $scope.modelBattleBuilder.saveError = "";
        $scope.modelBattleArmyRows = [];
        $scope.modelBattleArmyLoadError = "";
        $scope.modelBattleArmyLoading = false;
        $scope.selectedModelBattleArmyItem = null;
    };

    $scope.readBrigadeSlotField = function (row, slot, suffix) {
        return row["batt" + slot + suffix];
    };

    $scope.writeBrigadeSlotField = function (row, slot, suffix, value) {
        row["batt" + slot + suffix] = value;
    };

    $scope.createEmptyModelBattleBrigadeRow = function (stateCode, brigadeName) {
        var row = {
            isModelBuilder: true,
            state: stateCode,
            phase: "PRE",
            name: brigadeName
        };
        angular.forEach(MODEL_BATTLE_BATT_SLOTS, function (slot) {
            $scope.writeBrigadeSlotField(row, slot, "Type", MODEL_BATTLE_EMPTY_BATT);
            $scope.writeBrigadeSlotField(row, slot, "EF", null);
            $scope.writeBrigadeSlotField(row, slot, "Size", null);
        });
        return row;
    };

    $scope.cloneModelBattleBrigadeFromDb = function (brigade) {
        var cloned = {
            isModelBuilder: true,
            state: brigade.state,
            phase: "PRE",
            name: brigade.name
        };
        angular.forEach(MODEL_BATTLE_BATT_SLOTS, function (slot) {
            var type = $scope.readBrigadeSlotField(brigade, slot, "Type");
            $scope.writeBrigadeSlotField(cloned, slot, "Type", type || MODEL_BATTLE_EMPTY_BATT);
            $scope.writeBrigadeSlotField(cloned, slot, "EF", $scope.readBrigadeSlotField(brigade, slot, "EF"));
            $scope.writeBrigadeSlotField(cloned, slot, "Size", $scope.readBrigadeSlotField(brigade, slot, "Size"));
        });
        return cloned;
    };

    $scope.getModelBattleRowsForState = function (stateCode) {
        var normalizedState = $scope.normalizeStateCode(stateCode);
        return ($scope.modelBattleBuilder.rows || []).filter(function (row) {
            return row && $scope.normalizeStateCode(row.state) === normalizedState;
        });
    };

    $scope.getNextModelBattleBrigadeName = function (stateCode) {
        var rows = $scope.getModelBattleRowsForState(stateCode);
        return "Brigade " + (rows.length + 1);
    };

    $scope.hasAnyModelBattleBattalion = function (row) {
        if (!row) {
            return false;
        }

        for (var i = 1; i <= 7; i++) {
            var type = (($scope.readBrigadeSlotField(row, i, "Type") || "") + "").trim();
            if (type && type !== MODEL_BATTLE_EMPTY_BATT) {
                return true;
            }
        }

        return false;
    };

    $scope.ensureModelBattleInputRowsForState = function (stateCode) {
        var normalizedState = $scope.normalizeStateCode(stateCode);
        if (!normalizedState) {
            return;
        }

        var rows = $scope.getModelBattleRowsForState(normalizedState);
        var emptyCount = rows.filter(function (row) {
            return !$scope.hasAnyModelBattleBattalion(row);
        }).length;

        while (emptyCount < MODEL_BATTLE_MIN_EMPTY_ROWS) {
            $scope.modelBattleBuilder.rows.push($scope.createEmptyModelBattleBrigadeRow(normalizedState, $scope.getNextModelBattleBrigadeName(normalizedState)));
            emptyCount++;
        }
    };

    $scope.ensureModelBattleInputRows = function () {
        var battle = $scope.getSelectedBattle();
        if (!battle || !$scope.isSelectedBattleModelBattle()) {
            return;
        }

        var stateA = $scope.normalizeStateCode(battle.stateA);
        var stateB = $scope.normalizeStateCode(battle.stateB);
        $scope.ensureModelBattleInputRowsForState(stateA);
        $scope.ensureModelBattleInputRowsForState(stateB);
    };

    $scope.ensureModelBattleBuilder = function () {
        var battle = $scope.getSelectedBattle();
        if (!battle || !$scope.isSelectedBattleModelBattle()) {
            $scope.resetModelBattleBuilder();
            return;
        }

        if ($scope.modelBattleBuilder.sourceBattleNo === battle.mathBattleNo) {
            return;
        }

        var preBrigades = (battle.brigades || []).filter(function (brigade) {
            return ((brigade.phase || "") + "").trim().toUpperCase() === "PRE";
        });
        $scope.modelBattleBuilder.sourceBattleNo = battle.mathBattleNo;
        $scope.modelBattleBuilder.rows = preBrigades.map($scope.cloneModelBattleBrigadeFromDb);
        $scope.ensureModelBattleInputRows();
        $scope.modelBattleBuilder.isDirty = false;
        $scope.modelBattleBuilder.saveError = "";
        $scope.refreshModelBattleArmyRows();
        $scope.modelBattleCreate.sideBState = $scope.normalizeStateCode(battle.stateB);
        $scope.modelBattleCreate.isArming = false;
    };

    $scope.isSelectedBattleEstimated = function () {
        var battle = $scope.getSelectedBattle();
        return !!(battle && battle.isEstimated);
    };

    $scope.shouldShowCalculateBattle = function () {
        return $scope.activeBattleTab === "initial" && $scope.isSelectedBattleEstimated();
    };

    $scope.canCalculateInitialBrigadeValues = function () {
        if (!$scope.shouldShowCalculateBattle()) {
            return false;
        }

        if ($scope.isSelectedBattleModelBattle() && $scope.modelBattleBuilder.isDirty) {
            return false;
        }

        return !!$scope.selectedCalcTerrainId;
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

    $scope.shouldShowModelBattlePicker = function () {
        return $scope.modelBattleCreate.isArming || $scope.isSelectedBattleModelBattle();
    };

    $scope.isModelBattleEnemyStateLocked = function () {
        if (!$scope.isSelectedBattleModelBattle()) {
            return false;
        }

        var battle = $scope.getSelectedBattle();
        if (!battle) {
            return false;
        }

        var enemyState = $scope.normalizeStateCode(battle.stateB);
        if (!enemyState) {
            return false;
        }

        var enemyRows = $scope.getModelBattleRowsForState(enemyState);
        for (var i = 0; i < enemyRows.length; i++) {
            if ($scope.hasAnyModelBattleBattalion(enemyRows[i])) {
                return true;
            }
        }

        return false;
    };

    $scope.getModelBattleButtonLabel = function () {
        if ($scope.modelBattleCreate.isCreating) {
            return "Creating Model New Battle...";
        }
        if ($scope.modelBattleCreate.isArming && !$scope.isSelectedBattleModelBattle()) {
            return "Create Model New Battle";
        }

        return "Model New Battle";
    };

    $scope.onModelBattleButtonClick = function () {
        if (!$scope.modelBattleCreate.isArming && !$scope.isSelectedBattleModelBattle()) {
            $scope.modelBattleCreate.isArming = true;
            $scope.modelBattleCreate.error = "";
            $scope.rebuildModelBattleSideBOptions();
            $scope.syncModelBattleSideBSelection();
            return;
        }

        $scope.createModelBattle();
    };

    $scope.createModelBattle = function () {
        $scope.modelBattleCreate.error = "";
        var sourceBattle = $scope.getSelectedBattle();
        if (!sourceBattle || !sourceBattle.mathBattleNo) {
            $scope.modelBattleCreate.error = "Select a source battle first.";
            return;
        }
        var sideA = $scope.getModelBattleSideAState();
        var sideB = $scope.normalizeStateCode($scope.modelBattleCreate.sideBState);
        var terrain = (($scope.selectedCalcTerrainId || "") + "").trim().toUpperCase();
        if (!sideA) {
            $scope.modelBattleCreate.error = "Select a current state before creating a model battle.";
            return;
        }
        if (!sideB || sideA === sideB) {
            $scope.modelBattleCreate.error = "Pick one different state for Side B.";
            return;
        }
        if (!terrain) {
            $scope.modelBattleCreate.error = "Pick terrain before creating a model battle.";
            return;
        }

        $scope.openEstimateFederationModal(sourceBattle, "PRE", "model", sideA, sideB);
    };

    $scope.shouldShowModelBattleBuilder = function () {
        return $scope.activeBattleTab === "initial" && $scope.isSelectedBattleModelBattle();
    };

    $scope.isModelBattleBuilderRow = function (brigade) {
        return $scope.shouldShowModelBattleBuilder() && !!(brigade && brigade.isModelBuilder);
    };

    $scope.removeModelBattleBrigade = function (brigade) {
        if (!$scope.isModelBattleBuilderRow(brigade)) {
            return;
        }

        var idx = ($scope.modelBattleBuilder.rows || []).indexOf(brigade);
        if (idx < 0) {
            return;
        }

        $scope.modelBattleBuilder.rows.splice(idx, 1);
        $scope.modelBattleBuilder.isDirty = true;
        $scope.ensureModelBattleInputRowsForState(brigade.state);
    };

    $scope.refreshModelBattleArmyRows = function () {
        $scope.modelBattleArmyLoadError = "";
        $scope.modelBattleArmyRows = [];
        $scope.selectedModelBattleArmyItem = null;

        if (!$scope.shouldShowModelBattleBuilder() || !$scope.selectedState) {
            return $q.when([]);
        }

        $scope.modelBattleArmyLoading = true;
        return rulesCatalogFactory.getArmyList($scope.selectedState).then(function (rows) {
            var mapped = (rows || []).map(function (row) {
                return {
                    itemNo: row.itemNo != null ? row.itemNo : row.ItemNo,
                    name: row.name != null ? row.name : row.Name,
                    shortName: row.shortName != null ? row.shortName : row.ShortName,
                    rg: row.rg != null ? row.rg : row.RG,
                    simMP: row.simMP != null ? row.simMP : row.SimMP,
                    mp: row.mp != null ? row.mp : row.MP,
                    ef: row.ef != null ? row.ef : row.EF,
                    hc: row.hc != null ? row.hc : row.HC,
                    lr: row.lr != null ? row.lr : row.LR,
                    formation: row.formation != null ? row.formation : row.Formation,
                    troopSpecification: row.troopSpecification != null ? row.troopSpecification : row.TroopSpecification
                };
            }).filter(function (row) {
                return row.shortName;
            });
            mapped.sort(function (left, right) {
                return ((left.itemNo || 0) - (right.itemNo || 0));
            });
            $scope.modelBattleArmyRows = mapped;
            if (mapped.length > 0) {
                $scope.selectedModelBattleArmyItem = mapped[0];
            }
            return mapped;
        }, function () {
            $scope.modelBattleArmyLoadError = "Could not load army list for selected side.";
            return [];
        }).finally(function () {
            $scope.modelBattleArmyLoading = false;
        });
    };

    $scope.pickModelBattleArmyItem = function (armyItem) {
        if (!armyItem) {
            return;
        }

        $scope.selectedModelBattleArmyItem = armyItem;
    };

    $scope.onModelBattleArmyItemSelectionChanged = function () {
        if (!$scope.selectedModelBattleArmyItem) {
            return;
        }
    };

    $scope.isModelBattleArmyItemSelected = function (armyItem) {
        return $scope.selectedModelBattleArmyItem === armyItem;
    };

    $scope.paintModelBattleBattalion = function (brigade, battalionNo) {
        if (!$scope.isModelBattleBuilderRow(brigade) || !$scope.selectedModelBattleArmyItem) {
            return;
        }

        var type = (($scope.selectedModelBattleArmyItem.shortName || "") + "").trim();
        if (!type) {
            return;
        }

        var ef = parseInt($scope.selectedModelBattleArmyItem.ef, 10);
        if (isNaN(ef) || ef <= 0) {
            ef = 3;
        }

        $scope.writeBrigadeSlotField(brigade, battalionNo, "Type", type);
        $scope.writeBrigadeSlotField(brigade, battalionNo, "EF", ef);
        $scope.writeBrigadeSlotField(brigade, battalionNo, "Size", RECRUITS_PER_BATTALION);
        $scope.modelBattleBuilder.isDirty = true;
        $scope.ensureModelBattleInputRowsForState(brigade.state);
    };

    $scope.clearModelBattleBattalion = function (brigade, battalionNo, $event) {
        if ($event && $event.stopPropagation) {
            $event.stopPropagation();
        }
        if (!$scope.isModelBattleBuilderRow(brigade)) {
            return;
        }

        $scope.writeBrigadeSlotField(brigade, battalionNo, "Type", MODEL_BATTLE_EMPTY_BATT);
        $scope.writeBrigadeSlotField(brigade, battalionNo, "EF", null);
        $scope.writeBrigadeSlotField(brigade, battalionNo, "Size", null);
        $scope.modelBattleBuilder.isDirty = true;
    };

    $scope.addModelBattleBrigade = function () {
        if (!$scope.shouldShowModelBattleBuilder() || !$scope.selectedState) {
            return;
        }

        $scope.modelBattleBuilder.rows.push($scope.createEmptyModelBattleBrigadeRow($scope.selectedState, $scope.getNextModelBattleBrigadeName($scope.selectedState)));
        $scope.modelBattleBuilder.isDirty = true;
    };

    $scope.buildModelBattleSaveRows = function () {
        return ($scope.modelBattleBuilder.rows || []).filter(function (row) {
            return $scope.hasAnyModelBattleBattalion(row);
        }).map(function (row) {
            return {
                state: row.state,
                name: row.name,
                batt1Type: (row.batt1Type && row.batt1Type !== MODEL_BATTLE_EMPTY_BATT) ? row.batt1Type : null,
                batt2Type: (row.batt2Type && row.batt2Type !== MODEL_BATTLE_EMPTY_BATT) ? row.batt2Type : null,
                batt3Type: (row.batt3Type && row.batt3Type !== MODEL_BATTLE_EMPTY_BATT) ? row.batt3Type : null,
                batt4Type: (row.batt4Type && row.batt4Type !== MODEL_BATTLE_EMPTY_BATT) ? row.batt4Type : null,
                batt5Type: (row.batt5Type && row.batt5Type !== MODEL_BATTLE_EMPTY_BATT) ? row.batt5Type : null,
                batt6Type: (row.batt6Type && row.batt6Type !== MODEL_BATTLE_EMPTY_BATT) ? row.batt6Type : null,
                batt7Type: (row.batt7Type && row.batt7Type !== MODEL_BATTLE_EMPTY_BATT) ? row.batt7Type : null
            };
        });
    };

    $scope.onModelBattleSideBChanged = function () {
        var selectedStateB = $scope.normalizeStateCode($scope.modelBattleCreate.sideBState);
        if (!selectedStateB) {
            return;
        }

        if ($scope.modelBattleCreate.isArming && !$scope.isSelectedBattleModelBattle()) {
            $scope.createModelBattle();
            return;
        }

        var battle = $scope.getSelectedBattle();
        if (!battle || !$scope.isSelectedBattleModelBattle()) {
            return;
        }
        if ($scope.isModelBattleEnemyStateLocked()) {
            $scope.modelBattleCreate.sideBState = $scope.normalizeStateCode(battle.stateB);
            return;
        }

        var stateA = $scope.normalizeStateCode(battle.stateA);
        var oldStateB = $scope.normalizeStateCode(battle.stateB);
        if (!stateA || selectedStateB === stateA) {
            return;
        }
        if (selectedStateB === oldStateB) {
            return;
        }

        battle.stateB = selectedStateB;
        angular.forEach($scope.modelBattleBuilder.rows || [], function (row) {
            if ($scope.normalizeStateCode(row && row.state) === oldStateB) {
                row.state = selectedStateB;
            }
        });

        if ($scope.normalizeStateCode($scope.selectedState) === oldStateB) {
            $scope.selectedState = selectedStateB;
        }

        $scope.ensureModelBattleInputRowsForState(selectedStateB);
        $scope.modelBattleBuilder.isDirty = true;
        $scope.refreshModelBattleArmyRows();
    };

    $scope.canSaveModelBattleBrigades = function () {
        return $scope.shouldShowModelBattleBuilder() && !$scope.modelBattleBuilder.isSaving;
    };

    $scope.saveModelBattleBrigades = function () {
        $scope.modelBattleBuilder.saveError = "";
        if (!$scope.canSaveModelBattleBrigades()) {
            return $q.when();
        }

        var battle = $scope.getSelectedBattle();
        if (!battle || !battle.mathBattleNo) {
            $scope.modelBattleBuilder.saveError = "Select model battle first.";
            return $q.when();
        }

        $scope.modelBattleBuilder.isSaving = true;
        return turnReportFactory.saveTRModelBattleBrigades(
            $scope.masterData.turnId,
            battle.mathBattleNo,
            battle.stateA,
            battle.stateB,
            $scope.buildModelBattleSaveRows()
        ).then(function () {
            $scope.modelBattleBuilder.isDirty = false;
            return $scope.loadMathBattles(battle.mathBattleNo);
        }, function (error) {
            $scope.modelBattleBuilder.saveError = (error && error.data) ? error.data : "Could not save model battle brigades.";
        }).finally(function () {
            $scope.modelBattleBuilder.isSaving = false;
        });
    };

    $scope.saveAndCalculateModelBattle = function () {
        if (!$scope.canSaveModelBattleBrigades()) {
            return $q.when();
        }

        return $scope.saveModelBattleBrigades().then(function () {
            $scope.calculateInitialBrigadeValues();
        });
    };

    $scope.ensureSelectedState = function () {
        var sides = $scope.getBattleSides();
        if (!sides.length) {
            if ($scope.selectedState) {
                $scope.selectedState = "";
            }
            return;
        }

        var normalizedSelectedState = $scope.selectedState || "";
        var normalizedSides = sides.map(function (side) { return side || ""; });
        if (normalizedSides.indexOf(normalizedSelectedState) === -1) {
            $scope.selectedState = sides[0];
        }
    };

    $scope.setSelectedState = function (stateCode) {
        var nextState = stateCode || "";
        if (($scope.selectedState || "") === nextState) {
            return;
        }

        $scope.selectedState = nextState;
        $scope.refreshModelBattleArmyRows();
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
        if (!battle || !$scope.selectedState) {
            return [];
        }

        if ($scope.shouldShowModelBattleBuilder()) {
            return $scope.getModelBattleRowsForState($scope.selectedState);
        }

        if (!battle.brigades) {
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

        if ($scope.isSelectedBattleModelBattle() && $scope.modelBattleBuilder.isDirty) {
            $scope.mathBattleCalcError = "Save model battle brigades before calculating.";
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
        $scope.estimateFederationModal.selectedCandidateKeys = {};
        $scope.estimateFederationModal.sourceMathBattleNo = null;
        $scope.estimateFederationModal.sourcePhase = "PRE";
        $scope.estimateFederationModal.flowType = "fight";
        $scope.estimateFederationModal.replaceState = "";
        $scope.estimateFederationModal.opponentState = "";
    };

    $scope.getEstimateForcesModalTitle = function () {
        return $scope.estimateFederationModal.flowType === "model"
            ? "Model Battle: Choose Own Forces"
            : "Estimate Battle: Choose Own Forces";
    };

    $scope.closeEstimateFederationModal = function () {
        $scope.resetEstimateFederationModal();
    };

    $scope.toggleEstimateFederationCandidate = function (candidate, forceChecked) {
        if (!candidate || !candidate.candidateKey || $scope.estimateFederationModal.isCreating) {
            return;
        }

        var current = !!$scope.estimateFederationModal.selectedCandidateKeys[candidate.candidateKey];
        var next = forceChecked == null ? !current : !!forceChecked;
        $scope.estimateFederationModal.selectedCandidateKeys[candidate.candidateKey] = next;
    };

    $scope.isEstimateFederationCandidateSelected = function (candidate) {
        if (!candidate || !candidate.candidateKey) {
            return false;
        }

        return !!$scope.estimateFederationModal.selectedCandidateKeys[candidate.candidateKey];
    };

    $scope.getEstimateFederationCandidatesByType = function (candidateType) {
        var normalized = ((candidateType || "") + "").trim().toUpperCase();
        return ($scope.estimateFederationModal.candidates || []).filter(function (candidate) {
            return (((candidate && candidate.candidateType) || "") + "").trim().toUpperCase() === normalized;
        });
    };

    $scope.hasSelectedEstimateFederationCandidates = function () {
        var candidates = $scope.estimateFederationModal.candidates || [];
        for (var i = 0; i < candidates.length; i++) {
            if ($scope.isEstimateFederationCandidateSelected(candidates[i])) {
                return true;
            }
        }

        return false;
    };

    $scope.buildEstimateFederationSelections = function () {
        return ($scope.estimateFederationModal.candidates || []).filter(function (candidate) {
            return $scope.isEstimateFederationCandidateSelected(candidate);
        }).map(function (candidate) {
            return {
                candidateType: candidate.candidateType,
                federationNo: candidate.federationNo > 0 ? candidate.federationNo : null,
                brigadeItemNo: candidate.brigadeItemNo || null
            };
        });
    };

    $scope.openEstimateFederationModal = function (battle, sourcePhase, flowType, replaceStateOverride, opponentStateOverride) {
        var preferredState = (($scope.masterData && $scope.masterData.selectedState) || "").toString().trim().toUpperCase();
        var replaceState = $scope.selectedState || "";
        if (replaceStateOverride) {
            replaceState = replaceStateOverride;
        }
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
        if (opponentStateOverride !== undefined && opponentStateOverride !== null) {
            opponentState = opponentStateOverride;
        }

        $scope.estimateFederationModal.isOpen = true;
        $scope.estimateFederationModal.isLoading = true;
        $scope.estimateFederationModal.isCreating = false;
        $scope.estimateFederationModal.error = "";
        $scope.estimateFederationModal.candidates = [];
        $scope.estimateFederationModal.selectedCandidateKeys = {};
        $scope.estimateFederationModal.sourceMathBattleNo = battle.mathBattleNo;
        $scope.estimateFederationModal.sourcePhase = sourcePhase;
        $scope.estimateFederationModal.flowType = flowType || "fight";
        $scope.estimateFederationModal.replaceState = replaceState;
        $scope.estimateFederationModal.opponentState = opponentState;

        turnReportFactory.getTRMathBattleFederationCandidates(
            $scope.masterData.turnId,
            battle.mathBattleNo,
            replaceState
        ).then(function (candidates) {
            $scope.estimateFederationModal.candidates = candidates || [];
            if ($scope.estimateFederationModal.candidates.length > 0) {
                angular.forEach($scope.estimateFederationModal.candidates, function (candidate) {
                    if (candidate && candidate.candidateKey) {
                        $scope.estimateFederationModal.selectedCandidateKeys[candidate.candidateKey] = false;
                    }
                });
            } else {
                $scope.estimateFederationModal.error = "No selectable federations or brigades were found in this sphere.";
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

        var selections = $scope.buildEstimateFederationSelections();
        if (!selections.length) {
            $scope.estimateFederationModal.error = "Select at least one federation or brigade to continue.";
            return;
        }

        var isModelFlow = $scope.estimateFederationModal.flowType === "model";
        $scope.estimateFederationModal.isCreating = true;
        $scope.mathBattleEstimateBusy = true;
        if (isModelFlow) {
            $scope.modelBattleCreate.isCreating = true;
        }

        var createPromise;
        if (isModelFlow) {
            createPromise = turnReportFactory.createTRModelEstimatedMathBattle(
                $scope.masterData.turnId,
                $scope.estimateFederationModal.replaceState,
                $scope.modelBattleCreate.sideBState,
                $scope.selectedCalcTerrainId,
                $scope.estimateFederationModal.sourceMathBattleNo,
                selections
            );
        } else {
            createPromise = turnReportFactory.createTRFederationEstimatedMathBattle(
                $scope.masterData.turnId,
                $scope.estimateFederationModal.sourceMathBattleNo,
                $scope.estimateFederationModal.sourcePhase,
                $scope.estimateFederationModal.replaceState,
                0,
                selections
            );
        }

        createPromise.then(function (response) {
            var createdBattleNo = response && response.mathBattleNo;
            return $scope.loadMathBattles(createdBattleNo).then(function () {
                $scope.activeBattleTab = "initial";
                if (isModelFlow) {
                    $scope.modelBattleCreate.isArming = false;
                    $scope.ensureModelBattleBuilder();
                } else {
                    $scope.calculateInitialBrigadeValues();
                }
                $scope.closeEstimateFederationModal();
            });
        }, function (error) {
            var message = (error && error.data) ? error.data : "Could not create estimated battle.";
            $scope.estimateFederationModal.error = message;
            if (isModelFlow) {
                $scope.modelBattleCreate.error = message;
            } else {
                $scope.mathBattleEstimateError = message;
            }
        }).finally(function () {
            $scope.estimateFederationModal.isCreating = false;
            $scope.mathBattleEstimateBusy = false;
            if (isModelFlow) {
                $scope.modelBattleCreate.isCreating = false;
            }
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
        if (battle.isEstimated) {
            $scope.mathBattleEstimateError = "Fight same enemy requires a real (non-estimated) source battle.";
            return;
        }

        var sourcePhase = $scope.activeBattleTab === "final" ? "POST" : "PRE";
        $scope.openEstimateFederationModal(battle, sourcePhase, "fight");
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
        $scope.modelBattleCreate.error = "";
        $scope.rebuildModelBattleSideBOptions();
        $scope.syncModelBattleSideBSelection();
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
                $scope.resetModelBattleBuilder();
            }
        }, function () {
            $scope.mathBattleLoadError = "Could not load mathematical battle data.";
            $scope.mathBattles = [];
            $scope.selectedBattleNo = null;
            $scope.selectedState = "";
            $scope.resetModelBattleBuilder();
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

    $scope.$watch(function () {
        return $scope.masterData && $scope.masterData.selectedState;
    }, function () {
        $scope.rebuildModelBattleSideBOptions();
        $scope.syncModelBattleSideBSelection();
    });

    $scope.$watch(function () {
        var states = $scope.getRulesCatalogStates();
        return states ? states.length : 0;
    }, function () {
        $scope.rebuildModelBattleSideBOptions();
        $scope.syncModelBattleSideBSelection();
    });

    $scope.loadMathBattles();
    $scope.resetEstimateFederationModal();
    $scope.rebuildModelBattleSideBOptions();
    $scope.syncModelBattleSideBSelection();
});
