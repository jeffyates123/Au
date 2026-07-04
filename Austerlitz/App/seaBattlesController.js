"use strict";

austerlitzModule.controller(
    "seaBattlesController",
    function ($scope, masterData, rulesCatalogFactory, seaBattlesEngineFactory) {
        $scope.masterData = masterData;
        $scope.seaBattleLoadError = "";
        $scope.seaBattleValidationError = "";
        $scope.seaBattleSimError = "";
        $scope.seaBattleBusy = false;
        $scope.refWarshipOptions = [];
        $scope.nationOptions = [];
        $scope.nationA = "";
        $scope.nationB = "";
        $scope.fleetA = [];
        $scope.fleetB = [];
        $scope.result = null;
        $scope.expandedRounds = {};

        function toPositiveInt(value) {
            var parsed = parseInt(value, 10);
            return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
        }

        function normalizeStateCode(value) {
            return ((value || "") + "").trim().toUpperCase();
        }

        function createFleetLine(type, quantity) {
            return {
                type: type || "",
                quantity: quantity || 1
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
                    normalized.push({
                        type: typeNo,
                        quantity: quantity
                    });
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

            if (masterData && masterData.rulesCatalog && (masterData.rulesCatalog.Ships || masterData.rulesCatalog.ships)) {
                initializeFromCatalog(masterData.rulesCatalog);
                return;
            }

            rulesCatalogFactory.getRulesCatalog().then(function (rulesCatalog) {
                masterData.rulesCatalog = rulesCatalog;
                initializeFromCatalog(rulesCatalog);
            }, function () {
                $scope.seaBattleLoadError = "Unable to load ship list and states from rules catalog.";
            });
        };
    }
);
