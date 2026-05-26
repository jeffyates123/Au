'use strict';

austerlitzModule.factory('turnMapsTsTransferBuilderFactory', function () {
    function createEmptyGoods() {
        return { louisdore: 0, citizens: 0, ecPts: 0, horses: 0, wood: 0, textiles: 0 };
    }

    function getOrCreateTotalsForLocation(totalsByLocation, locationKey, fromWarehouse, toLocationItemNo, locationLabel) {
        if (!totalsByLocation[locationKey]) {
            totalsByLocation[locationKey] = {
                from: fromWarehouse,
                to: toLocationItemNo,
                locationLabel: locationLabel,
                goods: createEmptyGoods()
            };
        }
        return totalsByLocation[locationKey];
    }

    function buildTs03TransferLines(ctx) {
        var totalsByDepot = {};
        var depotOrder = [];
        var battalionFields = ['batt1', 'batt2', 'batt3', 'batt4', 'batt5', 'batt6', 'batt7'];
        var foreignEuropeBrigadesAccepted = 0;
        var rows = (ctx.tsSetUpBrigadesList || []).slice().sort(function (left, right) {
            return ctx.toInt(left && left.orderNo, 0) - ctx.toInt(right && right.orderNo, 0);
        });

        angular.forEach(rows, function (setUpRow) {
            if (!setUpRow.depot) return;
            var hasAnyBattalionSelected = battalionFields.some(function (field) {
                return !!setUpRow[field];
            });
            if (!hasAnyBattalionSelected) return;

            var europeRule = ctx.getTs03EuropeCostRule ? (ctx.getTs03EuropeCostRule(setUpRow.depot) || null) : null;
            var moneyMultiplier = europeRule && ctx.toFloat(europeRule.moneyMultiplier, 0) > 0
                ? ctx.toFloat(europeRule.moneyMultiplier, 1)
                : 1;
            var isForeignEuropeOutsideSphere = !!(europeRule && europeRule.isForeignEuropeOutsideSphere);
            if (isForeignEuropeOutsideSphere && foreignEuropeBrigadesAccepted >= 1) {
                if (ctx.addTsCostWarning) {
                    var rowNo = ctx.toInt(setUpRow.orderNo, 0);
                    ctx.addTsCostWarning('TS03 row ' + (rowNo || '?') + ' is in Europe outside home/political sphere and is excluded (max 1 brigade per month).');
                }
                return;
            }

            var sphere = ctx.getSphereFromDepotItemNo(setUpRow.depot);
            var warehouseNo = ctx.getWarehouseNoFromSphere(sphere);
            if (!warehouseNo) return;

            var depotKey = setUpRow.depot.toString();
            if (!totalsByDepot[depotKey]) {
                totalsByDepot[depotKey] = { from: warehouseNo, to: setUpRow.depot, money: 0, citizens: 0, ecPts: 0, horses: 0 };
                depotOrder.push(depotKey);
            }

            if (isForeignEuropeOutsideSphere) foreignEuropeBrigadesAccepted += 1;

            angular.forEach(battalionFields, function (field) {
                var battItemNo = setUpRow[field];
                if (!battItemNo) return;
                var armyItem = ctx.getArmyListItemByItemNo(battItemNo);
                if (!armyItem) return;

                var recruits = 800;
                totalsByDepot[depotKey].citizens += recruits;
                totalsByDepot[depotKey].money += (recruits * ctx.toFloat(armyItem.cost, 0) * moneyMultiplier);
                totalsByDepot[depotKey].ecPts += (Math.ceil(recruits / 25) * ctx.toFloat(armyItem.ecPtsPer25, 0));
                if (ctx.isMountedArmyItem(armyItem)) totalsByDepot[depotKey].horses += recruits;
            });
        });

        return depotOrder.map(function (depotKey) {
            var totals = totalsByDepot[depotKey];
            return {
                tsType: 'TS03',
                tsLabel: ctx.tsCostLabels.TS03,
                from: totals.from,
                to: totals.to,
                locationLabel: ctx.getLocationLabel(totals.to),
                goods: {
                    louisdore: Math.round(totals.money),
                    citizens: totals.citizens,
                    ecPts: Math.round(totals.ecPts),
                    horses: totals.horses,
                    wood: 0,
                    textiles: 0
                }
            };
        }).filter(function (line) {
            return ctx.hasAnyGoods(line.goods);
        });
    }

    function buildBrigadeStateMapForCosting(ctx) {
        var result = {};
        var brigades = (ctx.masterData && ctx.masterData.turnReport && ctx.masterData.turnReport.brigades) ? ctx.masterData.turnReport.brigades : [];
        angular.forEach(brigades, function (brigade) {
            if (!brigade || brigade.itemNo == null) return;
            var battalions = [];
            for (var i = 1; i <= 7; i++) {
                var type = brigade['batt' + i + 'Type'];
                var normalizedType = type == null ? '' : type.toString().trim();
                if (!normalizedType || normalizedType === '--') {
                    battalions.push({ slot: i, type: '', size: null, originalEf: null });
                } else {
                    battalions.push({
                        slot: i,
                        type: normalizedType,
                        size: ctx.toInt(brigade['batt' + i + 'Size'], 0),
                        originalEf: ctx.toInt(brigade['batt' + i + 'EF'], 0)
                    });
                }
            }

            result[ctx.toInt(brigade.itemNo, 0)] = {
                id: ctx.toInt(brigade.itemNo, 0),
                federation: ctx.toInt(brigade.federation, 0),
                x: ctx.toInt(brigade.x_OrState, 0),
                y: ctx.toInt(brigade.y_OrFleet, 0),
                battalions: battalions,
                headcountPlan: null,
                trainPlan: null
            };
        });
        return result;
    }

    function getBrigadesByScopeValue(ctx, brigadeStateById, brigadeOrFederation) {
        var numeric = ctx.toInt(brigadeOrFederation, 0);
        if (!numeric) return [];
        if (brigadeStateById[numeric]) return [brigadeStateById[numeric]];
        return Object.keys(brigadeStateById).map(function (key) {
            return brigadeStateById[key];
        }).filter(function (brigadeState) {
            return ctx.toInt(brigadeState.federation, 0) === numeric;
        });
    }

    function applyTs04ToBrigadeState(ctx, brigadeStateById) {
        angular.forEach(ctx.getSortedFilledRows(ctx.tsSetUpAdditionalBrigadesList, ['brigadeNo', 'battType']), function (row) {
            var brigadeState = brigadeStateById[ctx.toInt(row.brigadeNo, 0)];
            var armyItem = ctx.getArmyListItemByItemNo(row.battType);
            if (!brigadeState || !armyItem) return;

            for (var i = 0; i < brigadeState.battalions.length; i++) {
                if (!brigadeState.battalions[i].type) {
                    brigadeState.battalions[i] = {
                        slot: brigadeState.battalions[i].slot,
                        type: (armyItem.shortName || '').toString().trim(),
                        size: 800,
                        originalEf: ctx.toInt(armyItem.ef, 0)
                    };
                    break;
                }
            }
        });
    }

    function applyTs05Ts06PlansToBrigadeState(ctx, brigadeStateById) {
        angular.forEach(ctx.getSortedFilledRows(ctx.tsIncreaseHeadcountList, ['brigadeOrFederation', 'increaseAmount']), function (row) {
            var targetHeadcount = Math.max(1, Math.min(800, ctx.toInt(row.increaseAmount, 800)));
            angular.forEach(getBrigadesByScopeValue(ctx, brigadeStateById, row.brigadeOrFederation), function (brigadeState) {
                brigadeState.headcountPlan = { targetHeadcount: targetHeadcount };
            });
        });

        angular.forEach(ctx.getSortedFilledRows(ctx.tsIncreaseBrigadeXpList, ['brigadeOrFederation']), function (row) {
            angular.forEach(getBrigadesByScopeValue(ctx, brigadeStateById, row.brigadeOrFederation), function (brigadeState) {
                brigadeState.trainPlan = { selected: true };
            });
        });
    }

    function buildTs04TransferLines(ctx, brigadeStateById) {
        var totalsByLocation = {};
        var rows = ctx.getSortedFilledRows(ctx.tsSetUpAdditionalBrigadesList, ['brigadeNo', 'battType']);
        angular.forEach(rows, function (row) {
            var brigadeState = brigadeStateById[ctx.toInt(row.brigadeNo, 0)];
            var armyItem = ctx.getArmyListItemByItemNo(row.battType);
            if (!brigadeState || !armyItem) return;

            var location = ctx.getLineLocationContext(ctx.getDepotForBrigadeState(brigadeState));
            if (!location) return;

            var entry = getOrCreateTotalsForLocation(totalsByLocation, location.toLocation.toString(), location.fromWarehouse, location.toLocation, location.locationLabel);
            var recruits = 800;
            entry.goods.citizens += recruits;
            entry.goods.louisdore += Math.round(recruits * ctx.toFloat(armyItem.cost, 0) * 2);
            entry.goods.ecPts += Math.round(Math.ceil(recruits / 25) * ctx.toFloat(armyItem.ecPtsPer25, 0));
            if (ctx.isMountedArmyItem(armyItem)) entry.goods.horses += recruits;
        });

        return Object.keys(totalsByLocation).map(function (key) {
            var entry = totalsByLocation[key];
            return { tsType: 'TS04', tsLabel: ctx.tsCostLabels.TS04, from: entry.from, to: entry.to, locationLabel: entry.locationLabel, goods: entry.goods };
        }).filter(function (line) {
            return ctx.hasAnyGoods(line.goods);
        });
    }

    function buildTs05TransferLines(ctx, brigadeStateById) {
        var totalsByLocation = {};
        angular.forEach(Object.keys(brigadeStateById), function (idKey) {
            var brigadeState = brigadeStateById[idKey];
            if (!brigadeState || !brigadeState.headcountPlan) return;

            var location = ctx.getLineLocationContext(ctx.getDepotForBrigadeState(brigadeState));
            if (!location) return;

            var targetHeadcount = Math.max(1, Math.min(800, ctx.toInt(brigadeState.headcountPlan.targetHeadcount, 800)));
            var entry = getOrCreateTotalsForLocation(totalsByLocation, location.toLocation.toString(), location.fromWarehouse, location.toLocation, location.locationLabel);
            angular.forEach(brigadeState.battalions, function (battalion) {
                if (!battalion || !battalion.type) return;
                var armyItem = ctx.getArmyListItemByShortName(battalion.type);
                if (!armyItem) return;

                var currentSize = Math.max(0, ctx.toInt(battalion.size, 0));
                var missingMen = Math.max(0, targetHeadcount - currentSize);
                if (missingMen <= 0) return;

                entry.goods.louisdore += Math.round(missingMen * ctx.toFloat(armyItem.cost, 0));
                entry.goods.citizens += missingMen;
                entry.goods.ecPts += Math.round(Math.ceil(missingMen / 25) * ctx.toFloat(armyItem.ecPtsPer25, 0));
                if (ctx.isMountedArmyItem(armyItem)) entry.goods.horses += missingMen;
            });
        });

        return Object.keys(totalsByLocation).map(function (key) {
            var entry = totalsByLocation[key];
            return { tsType: 'TS05', tsLabel: ctx.tsCostLabels.TS05, from: entry.from, to: entry.to, locationLabel: entry.locationLabel, goods: entry.goods };
        }).filter(function (line) {
            return ctx.hasAnyGoods(line.goods);
        });
    }

    function buildTs06TransferLines(ctx, brigadeStateById) {
        var totalsByLocation = {};
        angular.forEach(Object.keys(brigadeStateById), function (idKey) {
            var brigadeState = brigadeStateById[idKey];
            if (!brigadeState || !brigadeState.trainPlan) return;

            var location = ctx.getLineLocationContext(ctx.getDepotForBrigadeState(brigadeState));
            if (!location) return;

            var entry = getOrCreateTotalsForLocation(totalsByLocation, location.toLocation.toString(), location.fromWarehouse, location.toLocation, location.locationLabel);
            angular.forEach(brigadeState.battalions, function (battalion) {
                if (!battalion || !battalion.type) return;
                var armyItem = ctx.getArmyListItemByShortName(battalion.type);
                if (!armyItem) return;

                var currentSize = Math.max(0, ctx.toInt(battalion.size, 0));
                var originalEf = Math.max(0, ctx.toInt(battalion.originalEf, 0));
                var maxEf = ctx.toInt(armyItem.ef, 0);
                if (maxEf <= 0) maxEf = ctx.toInt(armyItem.EF, 0);
                if (maxEf <= 0) return;

                var currentEf = originalEf;
                if (brigadeState.headcountPlan) {
                    var targetHeadcount = Math.max(1, Math.min(800, ctx.toInt(brigadeState.headcountPlan.targetHeadcount, 800)));
                    var missingMen = Math.max(0, targetHeadcount - currentSize);
                    currentEf = Math.max(0, originalEf - ctx.calculateHeadcountEfDrop(missingMen, currentSize));
                }

                if (currentEf >= maxEf) return;

                var headcount = brigadeState.headcountPlan
                    ? Math.min(800, Math.max(currentSize, ctx.toInt(brigadeState.headcountPlan.targetHeadcount, 800)))
                    : Math.min(800, currentSize);
                var setupLd = headcount * ctx.toFloat(armyItem.cost, 0);
                var setupEcPts = Math.ceil(headcount / 25) * ctx.toFloat(armyItem.ecPtsPer25, 0);
                entry.goods.louisdore += Math.round(setupLd / 10);
                entry.goods.ecPts += Math.round(setupEcPts / 8);
            });
        });

        return Object.keys(totalsByLocation).map(function (key) {
            var entry = totalsByLocation[key];
            return { tsType: 'TS06', tsLabel: ctx.tsCostLabels.TS06, from: entry.from, to: entry.to, locationLabel: entry.locationLabel, goods: entry.goods };
        }).filter(function (line) {
            return ctx.hasAnyGoods(line.goods);
        });
    }

    function calculateTsCostTransferLines(ctx) {
        var brigadeStateById = buildBrigadeStateMapForCosting(ctx);
        applyTs04ToBrigadeState(ctx, brigadeStateById);
        applyTs05Ts06PlansToBrigadeState(ctx, brigadeStateById);

        var allLines = [];
        allLines = allLines.concat(buildTs03TransferLines(ctx));
        allLines = allLines.concat(buildTs04TransferLines(ctx, brigadeStateById));
        allLines = allLines.concat(buildTs05TransferLines(ctx, brigadeStateById));
        allLines = allLines.concat(buildTs06TransferLines(ctx, brigadeStateById));
        allLines.sort(function (left, right) {
            var tsOrderCompare = ctx.getTsTypeSortOrder(left.tsType) - ctx.getTsTypeSortOrder(right.tsType);
            if (tsOrderCompare !== 0) return tsOrderCompare;
            return ctx.toInt(left.to, 0) - ctx.toInt(right.to, 0);
        });
        return allLines;
    }

    return {
        buildTs03TransferLines: buildTs03TransferLines,
        getBrigadesByScopeValue: getBrigadesByScopeValue,
        buildBrigadeStateMapForCosting: buildBrigadeStateMapForCosting,
        applyTs04ToBrigadeState: applyTs04ToBrigadeState,
        applyTs05Ts06PlansToBrigadeState: applyTs05Ts06PlansToBrigadeState,
        buildTs04TransferLines: buildTs04TransferLines,
        buildTs05TransferLines: buildTs05TransferLines,
        buildTs06TransferLines: buildTs06TransferLines,
        calculateTsCostTransferLines: calculateTsCostTransferLines
    };
});
