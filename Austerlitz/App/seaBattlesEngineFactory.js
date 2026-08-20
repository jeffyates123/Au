"use strict";

austerlitzModule.factory("seaBattlesEngineFactory", function () {
    var ROUND_DEFINITIONS = [
        { no: 1, action: "Long-Range combat of all ships", type: "longRangeAll" },
        { no: 2, action: "Long-Range combat of all ships", type: "longRangeAll" },
        { no: 3, action: "Long-Range combat of all ships", type: "longRangeAll" },
        { no: 4, action: "Hand-to-Hand combat of the boarding ships", type: "handToHand" },
        { no: 5, action: "Hand-to-Hand combat of the boarding ships", type: "handToHand" },
        { no: 6, action: "Long-Range combat of all non-boarding ships", type: "longRangeNonBoarding" },
        { no: 7, action: "Long-Range combat of all ships", type: "longRangeAll" },
        { no: 8, action: "Capturing of merchant ships", type: "merchantCapture" }
    ];

    var MORALE_BY_NATION = {
        G: 8,
        F: 7,
        H: 7,
        D: 6,
        E: 6,
        K: 6,
        S: 6,
        M: 5,
        R: 5,
        T: 5,
        A: 4,
        B: 4,
        I: 4,
        N: 4,
        P: 4,
        W: 4
    };

    function toPositiveNumber(value) {
        var parsed = parseFloat(value);
        return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    }

    function toPositiveInt(value) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    }

    function roundNearest(value) {
        return Math.round(toPositiveNumber(value));
    }

    function clamp(value, min, max) {
        var n = toPositiveNumber(value);
        if (n < min) return min;
        if (n > max) return max;
        return n;
    }

    function getMorale(stateCode, shipType) {
        var state = ((stateCode || "") + "").trim().toUpperCase();
        if (state === "M" && (shipType === 3 || shipType === 9)) {
            return 6;
        }
        return MORALE_BY_NATION[state] || 4;
    }

    function parseCannonCount(shipName) {
        var match = ((shipName || "") + "").match(/(\d+)/);
        return match ? toPositiveInt(match[1]) : 0;
    }

    function getFleetSideKey(side) {
        return side === "A" ? "fleetA" : "fleetB";
    }

    function createShipFactoryEntry(side, nation, shipRef, shipIndex, overrides) {
        var shipClass = toPositiveInt(shipRef.shipClass) || 1;
        var typeNo = toPositiveInt(shipRef.type);
        var overrideName = ((overrides && overrides.importedName) || "").trim();
        var displayName = overrideName || shipRef.name;
        var wood = toPositiveNumber((overrides && overrides.importedTonnage) || shipRef.wood);
        var baseMarines = toPositiveInt((overrides && overrides.importedMarines) || shipRef.citizens);
        var cannons = parseCannonCount(displayName);
        var tonnage = roundNearest(wood);

        return {
            id: side + "-" + typeNo + "-" + shipIndex,
            side: side,
            originalSide: side,
            nation: nation,
            type: typeNo,
            name: displayName,
            shipClass: shipClass,
            cannons: cannons,
            wood: wood,
            initialTonnage: tonnage,
            tonnage: tonnage,
            conditionPct: 100,
            initialMarines: baseMarines,
            marines: baseMarines,
            status: "active", // active|sunk|captured
            capturedBy: null,
            wasBoardingShip: false
        };
    }

    function getActiveShipsBySide(simState, side) {
        return simState.ships.filter(function (ship) {
            return ship.side === side && ship.status === "active";
        });
    }

    function canShipFireInRound(ship, roundType) {
        if (!ship || ship.status !== "active") return false;
        if (roundType === "longRangeNonBoarding") {
            return !ship.wasBoardingShip;
        }
        return true;
    }

    function getSmallShipCount(ships) {
        return ships.filter(function (ship) {
            return ship.shipClass === 1 || ship.shipClass === 2;
        }).length;
    }

    function getLargeShipCount(ships) {
        return ships.filter(function (ship) {
            return ship.shipClass === 4 || ship.shipClass === 5;
        }).length;
    }

    function buildTargetingExceptionMap(simState) {
        var sideAActive = getActiveShipsBySide(simState, "A");
        var sideBActive = getActiveShipsBySide(simState, "B");

        var sideASmalls = getSmallShipCount(sideAActive);
        var sideBSmalls = getSmallShipCount(sideBActive);
        var sideALarges = getLargeShipCount(sideAActive);
        var sideBLarges = getLargeShipCount(sideBActive);

        return {
            A: sideASmalls === 0 && sideBSmalls >= (3 * sideALarges) && sideALarges > 0,
            B: sideBSmalls === 0 && sideASmalls >= (3 * sideBLarges) && sideBLarges > 0
        };
    }

    function canTargetShip(attacker, target, exceptionMap) {
        if (!attacker || !target || attacker.side === target.side || target.status !== "active") {
            return false;
        }

        var attackerClass = attacker.shipClass;
        var targetClass = target.shipClass;

        if (attackerClass === 1 || attackerClass === 2) {
            if (targetClass <= 3) return true;
            return !!exceptionMap[attacker.side] && (targetClass === 4 || targetClass === 5);
        }
        if (attackerClass === 3) {
            return true;
        }
        return true;
    }

    function getLongRangeEffectivenessModifier(attacker, target) {
        if (!attacker || !target) return 1;
        if ((attacker.shipClass === 4 || attacker.shipClass === 5) && (target.shipClass === 1 || target.shipClass === 2)) {
            return 0.5;
        }
        return 1;
    }

    function pickLongRangeTarget(attacker, simState, exceptionMap) {
        var targets = simState.ships.filter(function (target) {
            return canTargetShip(attacker, target, exceptionMap);
        });
        if (!targets.length) {
            return null;
        }

        targets.sort(function (left, right) {
            if (left.shipClass !== right.shipClass) return left.shipClass - right.shipClass;
            if (left.tonnage !== right.tonnage) return left.tonnage - right.tonnage;
            return left.id < right.id ? -1 : 1;
        });
        return targets[0];
    }

    function applyTonnageLoss(ship, tonnageLost) {
        var beforeTonnage = ship.tonnage;
        var loss = roundNearest(tonnageLost);
        ship.tonnage = clamp(ship.tonnage - loss, 0, ship.initialTonnage);
        ship.conditionPct = ship.wood > 0 ? roundNearest((ship.tonnage / ship.wood) * 100) : 0;
        if (ship.tonnage <= 0) {
            ship.status = "sunk";
        }
        return beforeTonnage - ship.tonnage;
    }

    function applyMarineLoss(ship, marinesLost) {
        var beforeMarines = ship.marines;
        var loss = roundNearest(marinesLost);
        ship.marines = clamp(ship.marines - loss, 0, ship.initialMarines);
        return beforeMarines - ship.marines;
    }

    function calculateLongRangeAttack(attacker, target) {
        var morale = getMorale(attacker.nation, attacker.type);
        var conditionFactor = clamp(attacker.conditionPct, 0, 100) / 100;
        var cpRaw = (attacker.cannons / 2) * 2 * Math.sqrt(morale) * conditionFactor * Math.sqrt(attacker.shipClass);
        var modifier = getLongRangeEffectivenessModifier(attacker, target);
        var cpAdjusted = cpRaw * modifier;
        var cpRounded = roundNearest(cpAdjusted);
        var tonnageLost = roundNearest(cpAdjusted / Math.sqrt(target.shipClass));
        var marinesLost = roundNearest(cpAdjusted / 6);

        return {
            morale: morale,
            conditionFactor: conditionFactor,
            cpRaw: cpRaw,
            effectivenessModifier: modifier,
            cpRounded: cpRounded,
            tonnageLost: tonnageLost,
            marinesLost: marinesLost
        };
    }

    function createRoundAccumulator(roundDef) {
        return {
            roundNo: roundDef.no,
            action: roundDef.action,
            type: roundDef.type,
            fleetA: {
                side: "A",
                shots: 0,
                cp: 0,
                ownTonnageLost: 0,
                ownMarinesLost: 0
            },
            fleetB: {
                side: "B",
                shots: 0,
                cp: 0,
                ownTonnageLost: 0,
                ownMarinesLost: 0
            },
            details: {
                fleetA: [],
                fleetB: []
            }
        };
    }

    function applyLongRangeRound(roundDef, simState) {
        var roundReport = createRoundAccumulator(roundDef);
        var exceptionMap = buildTargetingExceptionMap(simState);
        var attackers = simState.ships.filter(function (ship) {
            return canShipFireInRound(ship, roundDef.type);
        });

        attackers.sort(function (left, right) {
            if (left.shipClass !== right.shipClass) return left.shipClass - right.shipClass;
            return left.id < right.id ? -1 : 1;
        });

        angular.forEach(attackers, function (attacker) {
            if (!canShipFireInRound(attacker, roundDef.type)) return;

            var target = pickLongRangeTarget(attacker, simState, exceptionMap);
            if (!target) return;

            var attack = calculateLongRangeAttack(attacker, target);
            var targetTonnageLoss = applyTonnageLoss(target, attack.tonnageLost);
            var targetMarinesLoss = applyMarineLoss(target, attack.marinesLost);

            var attackerFleet = roundReport[getFleetSideKey(attacker.side)];
            var targetFleet = roundReport[getFleetSideKey(target.side)];
            attackerFleet.shots += 1;
            attackerFleet.cp += attack.cpRounded;
            targetFleet.ownTonnageLost += targetTonnageLoss;
            targetFleet.ownMarinesLost += targetMarinesLoss;

            roundReport.details[getFleetSideKey(attacker.side)].push({
                attackerId: attacker.id,
                attackerName: attacker.name,
                attackerClass: attacker.shipClass,
                attackerCannons: attacker.cannons,
                attackerConditionPct: attacker.conditionPct,
                attackerMorale: attack.morale,
                targetId: target.id,
                targetName: target.name,
                targetClass: target.shipClass,
                cpRounded: attack.cpRounded,
                tonnageLost: targetTonnageLoss,
                marinesLost: targetMarinesLoss,
                formula: "CP=(cannon/2)*2*sqrt(morale)*cond%*sqrt(class)",
                formulaValues: "(" + attacker.cannons + "/2)*2*sqrt(" + attack.morale + ")*" + attack.conditionFactor.toFixed(2) + "*sqrt(" + attacker.shipClass + ") = " + attack.cpRounded
            });
        });

        return roundReport;
    }

    function getBoardingCandidates(attacker, enemies) {
        var attackerClass = attacker.shipClass;
        var candidates = enemies.filter(function (enemy) {
            if (enemy.status !== "active") return false;
            if (attackerClass === 3 && (enemy.shipClass === 4 || enemy.shipClass === 5)) return true;
            return Math.abs(enemy.shipClass - attackerClass) <= 1;
        });

        candidates.sort(function (left, right) {
            var leftClassDiff = Math.abs(left.shipClass - attackerClass);
            var rightClassDiff = Math.abs(right.shipClass - attackerClass);
            if (leftClassDiff !== rightClassDiff) return leftClassDiff - rightClassDiff;
            return left.id < right.id ? -1 : 1;
        });
        return candidates;
    }

    function chooseBoardingTarget(attacker, enemies, engagedTargets) {
        var candidates = getBoardingCandidates(attacker, enemies);
        if (!candidates.length) return null;

        var unengaged = candidates.filter(function (enemy) {
            return !engagedTargets[enemy.id];
        });
        if (unengaged.length > 0) {
            return unengaged[0];
        }
        return candidates[0];
    }

    function resolveCaptureOutcome(attacker, defender) {
        if (attacker.marines > (defender.marines * 3) && defender.marines > 0) {
            return { winner: attacker, loser: defender };
        }
        if (defender.marines > (attacker.marines * 3) && attacker.marines > 0) {
            return { winner: defender, loser: attacker };
        }
        return null;
    }

    function applyCapture(result) {
        if (!result || !result.winner || !result.loser) return;
        var winner = result.winner;
        var loser = result.loser;

        loser.status = "captured";
        loser.capturedBy = winner.side;
        loser.side = winner.side;
        loser.wasBoardingShip = true;
        winner.wasBoardingShip = true;

        var redistributed = roundNearest(winner.marines / 2);
        winner.marines = redistributed;
        loser.marines = redistributed;
    }

    function applyHandToHandRound(roundDef, simState) {
        var roundReport = createRoundAccumulator(roundDef);
        var sideAAttackers = getActiveShipsBySide(simState, "A");
        var sideBAttackers = getActiveShipsBySide(simState, "B");
        var engagedShips = {};
        var engagements = [];

        angular.forEach(sideAAttackers, function (attacker) {
            if (engagedShips[attacker.id]) return;
            var target = chooseBoardingTarget(attacker, sideBAttackers, engagedShips);
            if (!target) return;
            engagedShips[attacker.id] = true;
            engagedShips[target.id] = true;
            attacker.wasBoardingShip = true;
            target.wasBoardingShip = true;
            engagements.push({ attacker: attacker, defender: target });
        });
        angular.forEach(sideBAttackers, function (attacker) {
            if (engagedShips[attacker.id]) return;
            var target = chooseBoardingTarget(attacker, sideAAttackers, engagedShips);
            if (!target) return;
            engagedShips[attacker.id] = true;
            engagedShips[target.id] = true;
            attacker.wasBoardingShip = true;
            target.wasBoardingShip = true;
            engagements.push({ attacker: attacker, defender: target });
        });

        angular.forEach(engagements, function (engagement) {
            var shipA = engagement.attacker;
            var shipB = engagement.defender;
            var statusSymbol = "-";
            var attackLogs = [];

            for (var i = 1; i <= 3; i++) {
                if (shipA.status !== "active" || shipB.status !== "active") break;

                var cpA = roundNearest((shipA.marines * 1.5) / 6);
                var cpB = roundNearest((shipB.marines * 1.5) / 6);
                var aLoss = applyMarineLoss(shipA, cpB);
                var bLoss = applyMarineLoss(shipB, cpA);

                roundReport[getFleetSideKey(shipA.side)].cp += cpA;
                roundReport[getFleetSideKey(shipB.side)].cp += cpB;
                roundReport[getFleetSideKey(shipA.side)].ownMarinesLost += aLoss;
                roundReport[getFleetSideKey(shipB.side)].ownMarinesLost += bLoss;

                attackLogs.push({
                    attackNo: i,
                    cpA: cpA,
                    cpB: cpB,
                    marinesALoss: aLoss,
                    marinesBLoss: bLoss,
                    marinesAAfter: shipA.marines,
                    marinesBAfter: shipB.marines,
                    formula: "CP=(marines*1.5)/6"
                });

                var capture = resolveCaptureOutcome(shipA, shipB);
                if (capture) {
                    applyCapture(capture);
                    statusSymbol = capture.winner.id === shipA.id ? "*" : "!";
                    break;
                }
            }

            roundReport.details[getFleetSideKey(shipA.originalSide)].push({
                ownShipId: shipA.id,
                ownShipName: shipA.name,
                enemyShipId: shipB.id,
                enemyShipName: shipB.name,
                symbol: statusSymbol,
                formula: "CP=(marines*1.5)/6",
                attacks: attackLogs
            });
            roundReport.details[getFleetSideKey(shipB.originalSide)].push({
                ownShipId: shipB.id,
                ownShipName: shipB.name,
                enemyShipId: shipA.id,
                enemyShipName: shipA.name,
                symbol: statusSymbol === "*" ? "!" : (statusSymbol === "!" ? "*" : statusSymbol),
                formula: "CP=(marines*1.5)/6",
                attacks: attackLogs
            });
        });

        roundReport.fleetA.shots = roundReport.details.fleetA.length;
        roundReport.fleetB.shots = roundReport.details.fleetB.length;

        return roundReport;
    }

    function applyMerchantCaptureRound(roundDef) {
        var roundReport = createRoundAccumulator(roundDef);
        roundReport.details.fleetA.push({
            message: "Merchant capture skipped in v1 (warships-only fleet builder)."
        });
        roundReport.details.fleetB.push({
            message: "Merchant capture skipped in v1 (warships-only fleet builder)."
        });
        return roundReport;
    }

    function summarizeFleetLosses(simState, side) {
        var originalShips = simState.ships.filter(function (ship) {
            return ship.originalSide === side;
        });
        var beforeTonnage = originalShips.reduce(function (sum, ship) { return sum + ship.initialTonnage; }, 0);
        var beforeMarines = originalShips.reduce(function (sum, ship) { return sum + ship.initialMarines; }, 0);
        var afterTonnage = originalShips.reduce(function (sum, ship) {
            if (ship.status === "captured" && ship.capturedBy && ship.capturedBy !== side) return sum;
            if (ship.status === "sunk") return sum;
            return sum + ship.tonnage;
        }, 0);
        var afterMarines = originalShips.reduce(function (sum, ship) {
            if (ship.status === "captured" && ship.capturedBy && ship.capturedBy !== side) return sum;
            if (ship.status === "sunk") return sum;
            return sum + ship.marines;
        }, 0);

        var tonnageLossPct = beforeTonnage > 0 ? ((beforeTonnage - afterTonnage) / beforeTonnage) * 100 : 0;
        var marinesLossPct = beforeMarines > 0 ? ((beforeMarines - afterMarines) / beforeMarines) * 100 : 0;
        var averageLossPct = (tonnageLossPct + marinesLossPct) / 2;

        return {
            side: side,
            beforeTonnage: beforeTonnage,
            afterTonnage: afterTonnage,
            tonnageLossPct: roundNearest(tonnageLossPct * 100) / 100,
            beforeMarines: beforeMarines,
            afterMarines: afterMarines,
            marinesLossPct: roundNearest(marinesLossPct * 100) / 100,
            averageLossPct: roundNearest(averageLossPct * 100) / 100
        };
    }

    function calculateWinner(fleetAStats, fleetBStats, nationA, nationB) {
        var difference = roundNearest(Math.abs(fleetAStats.averageLossPct - fleetBStats.averageLossPct) * 100) / 100;
        if (difference < 8) {
            return {
                winnerCode: "DRAW",
                winnerText: "Draw",
                lossDifferencePct: difference
            };
        }

        var winnerIsA = fleetAStats.averageLossPct < fleetBStats.averageLossPct;
        return {
            winnerCode: winnerIsA ? "A" : "B",
            winnerText: winnerIsA ? ("Fleet A (" + nationA + ")") : ("Fleet B (" + nationB + ")"),
            lossDifferencePct: difference
        };
    }

    function mapRefShipRows(refShips) {
        return (refShips || []).map(function (row) {
            return {
                type: toPositiveInt(row.type != null ? row.type : row.Type),
                name: (row.name != null ? row.name : row.Name) || "",
                wood: toPositiveNumber(row.wood != null ? row.wood : row.Wood),
                citizens: toPositiveInt(row.citizens != null ? row.citizens : row.Citizens),
                shipClass: toPositiveInt(row.shipClass != null ? row.shipClass : row.ShipClass)
            };
        }).filter(function (row) {
            return row.type > 0 && row.shipClass > 0;
        });
    }

    function buildFleetShips(fleetConfig, side, nation, refShipsByType) {
        var ships = [];
        var nextShipIndexByType = {};
        angular.forEach(fleetConfig || [], function (line) {
            var typeNo = toPositiveInt(line.type);
            var qty = toPositiveInt(line.quantity);
            if (!typeNo || !qty) return;
            var ref = refShipsByType[typeNo];
            if (!ref) return;
            for (var i = 1; i <= qty; i++) {
                nextShipIndexByType[typeNo] = (nextShipIndexByType[typeNo] || 0) + 1;
                ships.push(createShipFactoryEntry(side, nation, ref, nextShipIndexByType[typeNo], line));
            }
        });
        return ships;
    }

    function simulate(input) {
        var refShipRows = mapRefShipRows(input.refShips);
        var refShipsByType = {};
        angular.forEach(refShipRows, function (row) {
            refShipsByType[row.type] = row;
        });

        var nationA = ((input.nationA || "") + "").trim().toUpperCase();
        var nationB = ((input.nationB || "") + "").trim().toUpperCase();

        var simState = {
            nationA: nationA,
            nationB: nationB,
            ships: []
        };

        simState.ships = simState.ships.concat(buildFleetShips(input.fleetA, "A", nationA, refShipsByType));
        simState.ships = simState.ships.concat(buildFleetShips(input.fleetB, "B", nationB, refShipsByType));

        var rounds = [];
        angular.forEach(ROUND_DEFINITIONS, function (roundDef) {
            if (roundDef.type === "longRangeAll" || roundDef.type === "longRangeNonBoarding") {
                rounds.push(applyLongRangeRound(roundDef, simState));
                return;
            }
            if (roundDef.type === "handToHand") {
                rounds.push(applyHandToHandRound(roundDef, simState));
                return;
            }
            rounds.push(applyMerchantCaptureRound(roundDef, simState));
        });

        var fleetAStats = summarizeFleetLosses(simState, "A");
        var fleetBStats = summarizeFleetLosses(simState, "B");
        var victory = calculateWinner(fleetAStats, fleetBStats, nationA, nationB);

        return {
            nationA: nationA,
            nationB: nationB,
            rounds: rounds,
            fleetAStats: fleetAStats,
            fleetBStats: fleetBStats,
            victory: victory
        };
    }

    return {
        simulate: simulate,
        getMorale: getMorale
    };
});
