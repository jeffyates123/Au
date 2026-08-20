"use strict";

austerlitzModule.controller(
    "seaBattlesController",
    function ($scope, $q, masterData, rulesCatalogFactory, turnReportFactory, seaBattlesEngineFactory) {
        $scope.masterData = masterData;
        $scope.seaBattleLoadError = "";
        $scope.seaBattleValidationError = "";
        $scope.seaBattleSimError = "";
        $scope.importedSeaBattleLoadError = "";
        $scope.importedSeaBattleLoading = false;
        $scope.seaBattleBusy = false;
        $scope.refWarshipOptions = [];
        $scope.nationOptions = [];
        $scope.nationA = "";
        $scope.nationB = "";
        $scope.fleetA = [];
        $scope.fleetB = [];
        $scope.result = null;
        $scope.expandedRounds = {};
        $scope.importedSeaBattles = [];
        $scope.selectedImportedBattleNo = null;
        $scope.selectedImportedBattle = null;

        function toPositiveInt(value) {
            var parsed = parseInt(value, 10);
            return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
        }

        function toPositiveNumber(value) {
            var parsed = parseFloat(value);
            return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
        }

        function normalizeStateCode(value) {
            return ((value || "") + "").trim().toUpperCase();
        }

        function createFleetLine(type, quantity, importedName, importedTonnage, importedMarines) {
            return {
                type: type || "",
                quantity: quantity || 1,
                importedName: importedName || "",
                importedTonnage: toPositiveInt(importedTonnage),
                importedMarines: toPositiveInt(importedMarines)
            };
        }

        function mapShipOption(ship) {
            var type = toPositiveInt(ship.type != null ? ship.type : ship.Type);
            var name = (ship.name != null ? ship.name : ship.Name) || "";
            var shipClass = toPositiveInt(ship.shipClass != null ? ship.shipClass : ship.ShipClass);
            var citizens = toPositiveInt(ship.citizens != null ? ship.citizens : ship.Citizens);
            return {
                type: type,
                name: name,
                shipClass: shipClass,
                citizens: citizens,
                label: type + " - " + name + " (Class " + shipClass + ", Marines " + citizens + ")"
            };
        }

        function buildNationOptions(rulesCatalog) {
            var states = (rulesCatalog && (rulesCatalog.States || rulesCatalog.states)) || [];
            var options = [];
            angular.forEach(states, function (state) {
                var code = normalizeStateCode(state.State || state.state);
                if (!code) return;
                options.push({
                    code: code,
                    label: code + " - " + ((state.StateName || state.stateName || "").toString().trim() || code)
                });
            });
            options.sort(function (left, right) {
                return left.code < right.code ? -1 : 1;
            });
            return options;
        }

        function getDistinctWarshipOptions(rulesCatalog) {
            var ships = (rulesCatalog && (rulesCatalog.Ships || rulesCatalog.ships)) || [];
            var seenTypes = {};
            var mapped = [];
            angular.forEach(ships, function (ship) {
                var opt = mapShipOption(ship);
                if (!opt.type || opt.shipClass <= 0 || opt.type > 25 || seenTypes[opt.type]) {
                    return;
                }
                seenTypes[opt.type] = true;
                mapped.push(opt);
            });
            mapped.sort(function (left, right) {
                return left.type - right.type;
            });
            return mapped;
        }

        $scope.addFleetLine = function (fleetKey) {
            if (fleetKey === "A") {
                $scope.fleetA.push(createFleetLine("", 1));
                return;
            }
            $scope.fleetB.push(createFleetLine("", 1));
        };

        $scope.removeFleetLine = function (fleetKey, index) {
            if (fleetKey === "A") {
                $scope.fleetA.splice(index, 1);
                return;
            }
            $scope.fleetB.splice(index, 1);
        };

        $scope.getMoraleForNation = function (nationCode, shipType) {
            return seaBattlesEngineFactory.getMorale(nationCode, shipType);
        };

        $scope.toggleRoundExpanded = function (roundNo) {
            $scope.expandedRounds[roundNo] = !$scope.expandedRounds[roundNo];
        };

        $scope.isRoundExpanded = function (roundNo) {
            return !!$scope.expandedRounds[roundNo];
        };

        $scope.buildSimulationInput = function () {
            function normalizeFleetRows(rows) {
                var normalized = [];
                angular.forEach(rows || [], function (row) {
                    var typeNo = toPositiveInt(row.type);
                    var quantity = toPositiveInt(row.quantity);
                    if (!typeNo || !quantity) return;
                    var normalizedLine = {
                        type: typeNo,
                        quantity: quantity
                    };
                    var importedName = ((row.importedName || "") + "").trim();
                    if (importedName) {
                        normalizedLine.importedName = importedName;
                    }

                    var importedTonnage = toPositiveInt(row.importedTonnage);
                    if (importedTonnage > 0) {
                        normalizedLine.importedTonnage = importedTonnage;
                    }

                    var importedMarines = toPositiveInt(row.importedMarines);
                    if (importedMarines > 0) {
                        normalizedLine.importedMarines = importedMarines;
                    }

                    normalized.push(normalizedLine);
                });
                return normalized;
            }

            return {
                nationA: normalizeStateCode($scope.nationA),
                nationB: normalizeStateCode($scope.nationB),
                fleetA: normalizeFleetRows($scope.fleetA),
                fleetB: normalizeFleetRows($scope.fleetB),
                refShips: ($scope.masterData && $scope.masterData.rulesCatalog && ($scope.masterData.rulesCatalog.Ships || $scope.masterData.rulesCatalog.ships)) || []
            };
        };

        $scope.validateInput = function (input) {
            if (!input.nationA || !input.nationB) {
                return "Select both nations.";
            }
            if (input.nationA === input.nationB) {
                return "Select two different nations.";
            }
            if (!input.fleetA.length || !input.fleetB.length) {
                return "Both fleets need at least one valid ship line.";
            }
            return "";
        };

        $scope.selectImportedBattle = function (battleNo) {
            $scope.selectedImportedBattleNo = battleNo;
            $scope.selectedImportedBattle = null;
            angular.forEach($scope.importedSeaBattles || [], function (battle) {
                if (battle.seaBattleNo === battleNo) {
                    $scope.selectedImportedBattle = battle;
                }
            });
        };

        $scope.getImportedShips = function (groupSide, phase, shipKind) {
            var battle = $scope.selectedImportedBattle;
            if (!battle || !battle.ships) return [];
            return battle.ships.filter(function (ship) {
                var sideOk = !groupSide || (ship.groupSide || "").toUpperCase() === groupSide;
                var phaseOk = !phase || (ship.phase || "").toUpperCase() === phase;
                var kindOk = !shipKind || (ship.shipKind || "").toUpperCase() === shipKind;
                return sideOk && phaseOk && kindOk;
            });
        };

        $scope.getImportedLongRange = function (roundNo, groupSide) {
            var battle = $scope.selectedImportedBattle;
            if (!battle || !battle.longRangeActions) return [];
            return battle.longRangeActions.filter(function (action) {
                return action.roundNo === roundNo && (action.groupSide || "").toUpperCase() === groupSide;
            });
        };

        $scope.getImportedBoarding = function (roundNo) {
            var battle = $scope.selectedImportedBattle;
            if (!battle || !battle.boardingActions) return [];
            return battle.boardingActions.filter(function (action) {
                return action.roundNo === roundNo;
            });
        };

        $scope.getImportedMerchantCaptures = function () {
            var battle = $scope.selectedImportedBattle;
            return battle && battle.merchantCaptures ? battle.merchantCaptures : [];
        };

        $scope.getImportedRounds = function () {
            var battle = $scope.selectedImportedBattle;
            var seen = {};
            var rounds = [];
            angular.forEach((battle && battle.longRangeActions) || [], function (action) {
                if (!seen[action.roundNo]) {
                    seen[action.roundNo] = true;
                    rounds.push(action.roundNo);
                }
            });
            angular.forEach((battle && battle.boardingActions) || [], function (action) {
                if (!seen[action.roundNo]) {
                    seen[action.roundNo] = true;
                    rounds.push(action.roundNo);
                }
            });
            rounds.sort(function (left, right) { return left - right; });
            return rounds;
        };

        function mapImportedPreFleetToSimulatorLines(groupSide) {
            var lines = [];
            angular.forEach($scope.getImportedShips(groupSide, "PRE", "WARSHIP"), function (ship) {
                var shipType = toPositiveInt(ship.type);
                if (!shipType) return;
                lines.push(createFleetLine(
                    shipType,
                    1,
                    ship.name || "",
                    toPositiveInt(ship.tonnage),
                    toPositiveInt(ship.marines)
                ));
            });

            return lines;
        }

        $scope.loadImportedInitialWarshipsIntoSimulator = function () {
            if (!$scope.selectedImportedBattle) return;

            $scope.nationA = normalizeStateCode($scope.selectedImportedBattle.stateA);
            $scope.nationB = normalizeStateCode($scope.selectedImportedBattle.stateB);
            $scope.fleetA = mapImportedPreFleetToSimulatorLines("A");
            $scope.fleetB = mapImportedPreFleetToSimulatorLines("B");

            if (!$scope.fleetA.length) {
                $scope.fleetA = [createFleetLine("", 1)];
            }
            if (!$scope.fleetB.length) {
                $scope.fleetB = [createFleetLine("", 1)];
            }

            $scope.seaBattleValidationError = "";
            $scope.seaBattleSimError = "";
            $scope.result = null;
            $scope.expandedRounds = {};
        };

        $scope.loadImportedSeaBattles = function (preferredBattleNo) {
            if (!$scope.masterData.turnId || $scope.masterData.turnId === "Unknown") {
                $scope.importedSeaBattles = [];
                $scope.selectedImportedBattleNo = null;
                $scope.selectedImportedBattle = null;
                return $q.when([]);
            }

            $scope.importedSeaBattleLoading = true;
            $scope.importedSeaBattleLoadError = "";
            return turnReportFactory.getTRSeaBattles($scope.masterData.turnId).then(function (battles) {
                $scope.importedSeaBattles = (battles || []).sort(function (left, right) {
                    return left.seaBattleNo - right.seaBattleNo;
                });

                if ($scope.importedSeaBattles.length === 0) {
                    $scope.selectedImportedBattleNo = null;
                    $scope.selectedImportedBattle = null;
                    return;
                }

                var selectedNo = preferredBattleNo;
                if (selectedNo == null) {
                    selectedNo = $scope.selectedImportedBattleNo != null
                        ? $scope.selectedImportedBattleNo
                        : $scope.importedSeaBattles[0].seaBattleNo;
                }

                var hasSelected = $scope.importedSeaBattles.some(function (battle) {
                    return battle.seaBattleNo === selectedNo;
                });
                $scope.selectImportedBattle(hasSelected ? selectedNo : $scope.importedSeaBattles[0].seaBattleNo);
            }, function () {
                $scope.importedSeaBattleLoadError = "Could not load imported sea battles.";
                $scope.importedSeaBattles = [];
                $scope.selectedImportedBattleNo = null;
                $scope.selectedImportedBattle = null;
            }).finally(function () {
                $scope.importedSeaBattleLoading = false;
            });
        };

        $scope.simulateSeaBattle = function () {
            $scope.seaBattleValidationError = "";
            $scope.seaBattleSimError = "";
            $scope.result = null;
            $scope.expandedRounds = {};

            var input = $scope.buildSimulationInput();
            var validation = $scope.validateInput(input);
            if (validation) {
                $scope.seaBattleValidationError = validation;
                return;
            }

            $scope.seaBattleBusy = true;
            try {
                $scope.result = seaBattlesEngineFactory.simulate(input);
            } catch (e) {
                $scope.seaBattleSimError = "Sea battle simulation failed. " + (e && e.message ? e.message : "");
            } finally {
                $scope.seaBattleBusy = false;
            }
        };

        $scope.initSeaBattles = function () {
            $scope.seaBattleLoadError = "";

            function initializeFromCatalog(rulesCatalog) {
                $scope.nationOptions = buildNationOptions(rulesCatalog);
                $scope.refWarshipOptions = getDistinctWarshipOptions(rulesCatalog);

                var preferredNation = normalizeStateCode(masterData && masterData.selectedState);
                if (preferredNation) {
                    $scope.nationA = preferredNation;
                } else if ($scope.nationOptions.length > 0) {
                    $scope.nationA = $scope.nationOptions[0].code;
                }

                var fallbackNation = "";
                for (var i = 0; i < $scope.nationOptions.length; i++) {
                    if ($scope.nationOptions[i].code !== $scope.nationA) {
                        fallbackNation = $scope.nationOptions[i].code;
                        break;
                    }
                }
                $scope.nationB = fallbackNation;

                $scope.fleetA = [createFleetLine("", 1)];
                $scope.fleetB = [createFleetLine("", 1)];
            }

            function initializeImportedBattles() {
                $scope.loadImportedSeaBattles();
            }

            if (masterData && masterData.rulesCatalog && (masterData.rulesCatalog.Ships || masterData.rulesCatalog.ships)) {
                initializeFromCatalog(masterData.rulesCatalog);
                initializeImportedBattles();
                return;
            }

            rulesCatalogFactory.getRulesCatalog().then(function (rulesCatalog) {
                masterData.rulesCatalog = rulesCatalog;
                initializeFromCatalog(rulesCatalog);
                initializeImportedBattles();
            }, function () {
                $scope.seaBattleLoadError = "Unable to load ship list and states from rules catalog.";
            });
        };

        $scope.$watch(function () {
            return $scope.masterData.turnId;
        }, function (newTurnId, oldTurnId) {
            if (newTurnId && newTurnId !== oldTurnId) {
                $scope.loadImportedSeaBattles();
            }
        });
    }
);
