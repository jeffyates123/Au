'use strict';

austerlitzModule.factory('turnMapsSetUpBrigadesFactory', function () {
    var TS_COST_TYPE_ORDER = ['TS03', 'TS04', 'TS05', 'TS06'];
    var TS_COST_LABELS = {
        TS03: 'Set Up Brigades',
        TS04: 'Set Up Additional Battalions',
        TS05: 'Increase Headcount',
        TS06: 'Increase Brigade XP (Train)'
    };
    var MANAGED_TS01_ROW_LIMIT = 12;
    var MANAGED_TS01_STORAGE_KEY_PREFIX = 'austerlitz.turnMaps.managedTs01Rows.';

    function toInt(value, fallback) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? (fallback || 0) : parsed;
    }

    function toFloat(value, fallback) {
        var parsed = parseFloat(value);
        return isNaN(parsed) ? (fallback || 0) : parsed;
    }

    function createEmptyGoods() {
        return {
            louisdore: 0,
            citizens: 0,
            ecPts: 0,
            horses: 0,
            wood: 0,
            textiles: 0
        };
    }

    function hasAnyGoods(goods) {
        if (!goods) {
            return false;
        }

        return toInt(goods.louisdore, 0) > 0
            || toInt(goods.citizens, 0) > 0
            || toInt(goods.ecPts, 0) > 0
            || toInt(goods.horses, 0) > 0
            || toInt(goods.wood, 0) > 0
            || toInt(goods.textiles, 0) > 0;
    }

    function getManagedStorageKey(scope) {
        var turnId = (scope && scope.masterData && scope.masterData.turnId) ? scope.masterData.turnId : '';
        return MANAGED_TS01_STORAGE_KEY_PREFIX + turnId;
    }

    return {
        attach: function ($scope, rulesCatalogFactory) {
            $scope.pendingDepotSourceItemNo = null;
            $scope.selectedArmyListItem = null;
            $scope.economyTsCostSummarySections = [];
            $scope.economyTsCostWarnings = [];
            $scope.managedTransferGoodsRowOrderNos = [];
            $scope.armyListCostRows = [];
            $scope.armyListCostByItemNo = {};
            $scope.armyListCostByShortName = {};

            $scope.refreshSetUpBrigadesRows = function () {
                if (!$scope.tsSetUpBrigadesList) {
                    $scope.tsSetUpBrigadesRows = [];
                    return;
                }

                $scope.tsSetUpBrigadesRows = $scope.tsSetUpBrigadesList.filter(function (row) {
                    return row.orderNo != null && parseInt(row.orderNo, 10) <= 8;
                });
            };

            $scope.normalizeSetUpBrigadesRows = function (rows) {
                return (rows || []).map(function (row) {
                    if (!row.depot) {
                        row.brigadeName = '';
                    }
                    return row;
                });
            };

            $scope.normalizeTransferGoodsRows = function (rows) {
                return rows || [];
            };

            $scope.refreshTransferGoodsCostRows = function () {
                if (!$scope.tsTransferGoodsList) {
                    $scope.tsTransferGoodsCostRows = [];
                    return;
                }

                $scope.tsTransferGoodsCostRows = $scope.tsTransferGoodsList.filter(function (row) {
                    return row.from != null || row.to != null || row.louisdore != null || row.citizens != null || row.ecPts != null || row.horses != null;
                });
            };

            $scope.getTsTypeSortOrder = function (tsType) {
                var idx = TS_COST_TYPE_ORDER.indexOf(tsType);
                return idx >= 0 ? idx : TS_COST_TYPE_ORDER.length + 99;
            };

            $scope.getWarehouseNoFromSphere = function (sphere) {
                if (sphere === 'Europe') return 1;
                if (sphere === 'Carribbean') return 2;
                if (sphere === 'India') return 3;
                return null;
            };

            $scope.getSortedFilledRows = function (rows, requiredFields) {
                return (rows || []).filter(function (row) {
                    return requiredFields.every(function (field) {
                        return row && row[field] != null && row[field] !== '';
                    });
                }).sort(function (left, right) {
                    return toInt(left && left.orderNo, 0) - toInt(right && right.orderNo, 0);
                });
            };

            $scope.getTransferGoodsRowByOrderNo = function (orderNo) {
                if (!$scope.tsTransferGoodsList) {
                    return null;
                }

                for (var i = 0; i < $scope.tsTransferGoodsList.length; i++) {
                    if (toInt($scope.tsTransferGoodsList[i].orderNo, 0) === toInt(orderNo, 0)) {
                        return $scope.tsTransferGoodsList[i];
                    }
                }

                return null;
            };

            $scope.getTransferCostRow = function (warehouseNo) {
                if (!$scope.tsTransferGoodsList) return null;

                for (var i = 0; i < $scope.tsTransferGoodsList.length; i++) {
                    if ($scope.tsTransferGoodsList[i].orderNo == warehouseNo) {
                        return $scope.tsTransferGoodsList[i];
                    }
                }

                return $scope.tsTransferGoodsList[warehouseNo - 1] || null;
            };

            $scope.getTurnStateCodeForArmyList = function () {
                if ($scope.masterData && $scope.masterData.turnId && $scope.masterData.turnId.length >= 4) {
                    return $scope.masterData.turnId.substr(3, 1);
                }
                return ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : 'E');
            };

            $scope.loadArmyListForTurnState = function () {
                var stateCode = ($scope.getTurnStateCodeForArmyList() || 'E').toString().trim().toUpperCase();
                var mapId = ($scope.selectedMapChoice && $scope.selectedMapChoice.mapId ? $scope.selectedMapChoice.mapId : '').toString().toUpperCase();
                var isEuropeSphere = mapId === 'E' || mapId === 'EW' || mapId === 'EE';

                rulesCatalogFactory.getArmyList(stateCode).then(function (armyList) {
                    $scope.armyListCostRows = armyList || [];
                    $scope.armyListCostByItemNo = {};
                    $scope.armyListCostByShortName = {};
                    angular.forEach($scope.armyListCostRows, function (armyItem) {
                        var itemNo = toInt(armyItem && armyItem.itemNo, 0);
                        if (itemNo > 0 && !$scope.armyListCostByItemNo[itemNo]) {
                            $scope.armyListCostByItemNo[itemNo] = armyItem;
                        }

                        var shortName = (armyItem && armyItem.shortName != null ? armyItem.shortName : '').toString().trim().toUpperCase();
                        if (shortName && !$scope.armyListCostByShortName[shortName]) {
                            $scope.armyListCostByShortName[shortName] = armyItem;
                        }
                    });

                    $scope.armyListRows = (armyList || []).filter(function (item) {
                        var parsedItemNo = parseInt(item.itemNo, 10);
                        if (item.itemNo == null || isNaN(parsedItemNo) || parsedItemNo % 2 === 0) return false;
                        if (isEuropeSphere && (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39)) return false;
                        if (!isEuropeSphere && parsedItemNo === 19) return false;

                        return true;
                    });

                    $scope.recalculateTransferGoodsForSetUpBrigades();
                });
            };

            $scope.getSphereFromCoordinate = function (x, y) {
                var px = parseInt(x, 10);
                var py = parseInt(y, 10);

                if (isNaN(px) || isNaN(py)) return null;
                if (px <= 80 && py <= 65) return 'Europe';
                if (px <= 40 && py <= 99) return 'Carribbean';
                if (px <= 90 && py <= 99) return 'India';

                return null;
            };

            $scope.getDepotReferenceByItemNo = function (depotItemNo) {
                if (!$scope.masterData || !$scope.masterData.turnReport || depotItemNo == null) return null;

                var barracks = $scope.masterData.turnReport.barracks || [];
                for (var i = 0; i < barracks.length; i++) {
                    if (barracks[i].itemNo == depotItemNo) return barracks[i];
                }

                var ports = $scope.masterData.turnReport.tradingPortsAndCities || [];
                for (var j = 0; j < ports.length; j++) {
                    if (ports[j].itemNo == depotItemNo) return ports[j];
                }

                return null;
            };

            $scope.getSphereFromDepotItemNo = function (depotItemNo) {
                var depotRef = $scope.getDepotReferenceByItemNo(depotItemNo);
                if (!depotRef) return null;

                return $scope.getSphereFromCoordinate(depotRef.x, depotRef.y);
            };

            $scope.getArmyListItemByItemNo = function (itemNo) {
                if (itemNo == null) return null;
                return $scope.armyListCostByItemNo[toInt(itemNo, 0)] || null;
            };

            $scope.getArmyListItemByShortName = function (shortName) {
                var key = (shortName || '').toString().trim().toUpperCase();
                if (!key) {
                    return null;
                }
                return $scope.armyListCostByShortName[key] || null;
            };

            $scope.canAddArmyItemToDepotSphere = function (armyItemNo, sphere) {
                var parsedItemNo = parseInt(armyItemNo, 10);
                if (isNaN(parsedItemNo)) return false;
                if (parsedItemNo === 19) return sphere === 'Europe';
                if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39) return sphere === 'Carribbean' || sphere === 'India';

                return true;
            };

            $scope.getLocationLabel = function (locationItemNo) {
                var location = $scope.getDepotReferenceByItemNo(locationItemNo);
                var rawName = location && location.name ? location.name.toString().trim() : '';
                if (rawName) {
                    return locationItemNo + ' ' + rawName;
                }
                return locationItemNo != null ? locationItemNo.toString() : '';
            };

            $scope.getLineLocationContext = function (depotItemNo) {
                if (!depotItemNo) {
                    return null;
                }

                var sphere = $scope.getSphereFromDepotItemNo(depotItemNo);
                var fromWarehouse = $scope.getWarehouseNoFromSphere(sphere);
                if (!fromWarehouse) {
                    return null;
                }

                return {
                    fromWarehouse: fromWarehouse,
                    toLocation: depotItemNo,
                    locationLabel: $scope.getLocationLabel(depotItemNo)
                };
            };

            $scope.getOrCreateTotalsForLocation = function (totalsByLocation, locationKey, fromWarehouse, toLocationItemNo, locationLabel) {
                if (!totalsByLocation[locationKey]) {
                    totalsByLocation[locationKey] = {
                        from: fromWarehouse,
                        to: toLocationItemNo,
                        locationLabel: locationLabel,
                        goods: createEmptyGoods()
                    };
                }

                return totalsByLocation[locationKey];
            };

            $scope.calculateHeadcountEfDrop = function (missingMen, size) {
                if (missingMen <= 0) {
                    return 0;
                }

                if (missingMen > size) {
                    return 2;
                }

                if (missingMen > (size * 0.5)) {
                    return 1;
                }

                return 0;
            };

            $scope.isMountedArmyItem = function (armyItem) {
                if (!armyItem) {
                    return false;
                }

                var shortName = (armyItem.shortName || '').toString();
                var name = (armyItem.name || '').toString();
                return !!armyItem.isCavalry || /mounted/i.test(name) || /^mc$/i.test(shortName);
            };

            $scope.buildTs03TransferLines = function () {
                var totalsByDepot = {};
                var depotOrder = [];
                var battalionFields = ['batt1', 'batt2', 'batt3', 'batt4', 'batt5', 'batt6', 'batt7'];

                angular.forEach($scope.tsSetUpBrigadesList || [], function (setUpRow) {
                    if (!setUpRow.depot) return;

                    var sphere = $scope.getSphereFromDepotItemNo(setUpRow.depot);
                    var warehouseNo = $scope.getWarehouseNoFromSphere(sphere);
                    if (!warehouseNo) return;

                    var depotKey = setUpRow.depot.toString();
                    if (!totalsByDepot[depotKey]) {
                        totalsByDepot[depotKey] = {
                            from: warehouseNo,
                            to: setUpRow.depot,
                            money: 0,
                            citizens: 0,
                            ecPts: 0,
                            horses: 0
                        };
                        depotOrder.push(depotKey);
                    }

                    angular.forEach(battalionFields, function (field) {
                        var battItemNo = setUpRow[field];
                        if (!battItemNo) return;

                        var armyItem = $scope.getArmyListItemByItemNo(battItemNo);
                        if (!armyItem) return;

                        var recruits = 800;
                        var coCost = toFloat(armyItem.cost, 0);
                        var ecPtsPer25 = toFloat(armyItem.ecPtsPer25, 0);

                        totalsByDepot[depotKey].citizens += recruits;
                        totalsByDepot[depotKey].money += (recruits * coCost);
                        totalsByDepot[depotKey].ecPts += (Math.ceil(recruits / 25) * ecPtsPer25);
                        if ($scope.isMountedArmyItem(armyItem)) totalsByDepot[depotKey].horses += recruits;
                    });
                });

                return depotOrder.map(function (depotKey) {
                    var totals = totalsByDepot[depotKey];
                    return {
                        tsType: 'TS03',
                        tsLabel: TS_COST_LABELS.TS03,
                        from: totals.from,
                        to: totals.to,
                        locationLabel: $scope.getLocationLabel(totals.to),
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
                    return hasAnyGoods(line.goods);
                });
            };

            $scope.buildBrigadeStateMapForCosting = function () {
                var result = {};
                var brigades = ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.brigades) ? $scope.masterData.turnReport.brigades : [];

                angular.forEach(brigades, function (brigade) {
                    if (!brigade || brigade.itemNo == null) {
                        return;
                    }

                    var battalions = [];
                    for (var i = 1; i <= 7; i++) {
                        var type = brigade['batt' + i + 'Type'];
                        var normalizedType = type == null ? '' : type.toString().trim();
                        if (!normalizedType || normalizedType === '--') {
                            battalions.push({ slot: i, type: '', size: null, originalEf: null });
                        }
                        else {
                            battalions.push({
                                slot: i,
                                type: normalizedType,
                                size: toInt(brigade['batt' + i + 'Size'], 0),
                                originalEf: toInt(brigade['batt' + i + 'EF'], 0)
                            });
                        }
                    }

                    result[toInt(brigade.itemNo, 0)] = {
                        id: toInt(brigade.itemNo, 0),
                        federation: toInt(brigade.federation, 0),
                        x: toInt(brigade.x_OrState, 0),
                        y: toInt(brigade.y_OrFleet, 0),
                        battalions: battalions,
                        headcountPlan: null,
                        trainPlan: null
                    };
                });

                return result;
            };

            $scope.getBrigadesByScopeValue = function (brigadeStateById, brigadeOrFederation) {
                var numeric = toInt(brigadeOrFederation, 0);
                if (!numeric) {
                    return [];
                }

                if (brigadeStateById[numeric]) {
                    return [brigadeStateById[numeric]];
                }

                return Object.keys(brigadeStateById).map(function (key) {
                    return brigadeStateById[key];
                }).filter(function (brigadeState) {
                    return toInt(brigadeState.federation, 0) === numeric;
                });
            };

            $scope.applyTs04ToBrigadeState = function (brigadeStateById) {
                angular.forEach($scope.getSortedFilledRows($scope.tsSetUpAdditionalBrigadesList, ['brigadeNo', 'battType']), function (row) {
                    var brigadeState = brigadeStateById[toInt(row.brigadeNo, 0)];
                    var armyItem = $scope.getArmyListItemByItemNo(row.battType);
                    if (!brigadeState || !armyItem) {
                        return;
                    }

                    for (var i = 0; i < brigadeState.battalions.length; i++) {
                        if (!brigadeState.battalions[i].type) {
                            brigadeState.battalions[i] = {
                                slot: brigadeState.battalions[i].slot,
                                type: (armyItem.shortName || '').toString().trim(),
                                size: 800,
                                originalEf: toInt(armyItem.ef, 0)
                            };
                            break;
                        }
                    }
                });
            };

            $scope.applyTs05Ts06PlansToBrigadeState = function (brigadeStateById) {
                angular.forEach($scope.getSortedFilledRows($scope.tsIncreaseHeadcountList, ['brigadeOrFederation', 'increaseAmount']), function (row) {
                    var targetHeadcount = Math.max(1, Math.min(800, toInt(row.increaseAmount, 800)));
                    angular.forEach($scope.getBrigadesByScopeValue(brigadeStateById, row.brigadeOrFederation), function (brigadeState) {
                        brigadeState.headcountPlan = { targetHeadcount: targetHeadcount };
                    });
                });

                angular.forEach($scope.getSortedFilledRows($scope.tsIncreaseBrigadeXpList, ['brigadeOrFederation']), function (row) {
                    angular.forEach($scope.getBrigadesByScopeValue(brigadeStateById, row.brigadeOrFederation), function (brigadeState) {
                        brigadeState.trainPlan = { selected: true };
                    });
                });
            };

            $scope.getDepotForBrigadeState = function (brigadeState) {
                return $scope.getDepotSourceItemNoAtCoordinate(brigadeState.x, brigadeState.y);
            };

            $scope.buildTs04TransferLines = function (brigadeStateById) {
                var totalsByLocation = {};
                var rows = $scope.getSortedFilledRows($scope.tsSetUpAdditionalBrigadesList, ['brigadeNo', 'battType']);

                angular.forEach(rows, function (row) {
                    var brigadeState = brigadeStateById[toInt(row.brigadeNo, 0)];
                    var armyItem = $scope.getArmyListItemByItemNo(row.battType);
                    if (!brigadeState || !armyItem) {
                        return;
                    }

                    var location = $scope.getLineLocationContext($scope.getDepotForBrigadeState(brigadeState));
                    if (!location) {
                        return;
                    }

                    var entry = $scope.getOrCreateTotalsForLocation(totalsByLocation, location.toLocation.toString(), location.fromWarehouse, location.toLocation, location.locationLabel);
                    var recruits = 800;
                    entry.goods.citizens += recruits;
                    entry.goods.louisdore += Math.round(recruits * toFloat(armyItem.cost, 0) * 2);
                    entry.goods.ecPts += Math.round(Math.ceil(recruits / 25) * toFloat(armyItem.ecPtsPer25, 0));
                    if ($scope.isMountedArmyItem(armyItem)) {
                        entry.goods.horses += recruits;
                    }
                });

                return Object.keys(totalsByLocation).map(function (key) {
                    var entry = totalsByLocation[key];
                    return {
                        tsType: 'TS04',
                        tsLabel: TS_COST_LABELS.TS04,
                        from: entry.from,
                        to: entry.to,
                        locationLabel: entry.locationLabel,
                        goods: entry.goods
                    };
                }).filter(function (line) {
                    return hasAnyGoods(line.goods);
                });
            };

            $scope.buildTs05TransferLines = function (brigadeStateById) {
                var totalsByLocation = {};

                angular.forEach(Object.keys(brigadeStateById), function (idKey) {
                    var brigadeState = brigadeStateById[idKey];
                    if (!brigadeState || !brigadeState.headcountPlan) {
                        return;
                    }

                    var location = $scope.getLineLocationContext($scope.getDepotForBrigadeState(brigadeState));
                    if (!location) {
                        return;
                    }

                    var targetHeadcount = Math.max(1, Math.min(800, toInt(brigadeState.headcountPlan.targetHeadcount, 800)));
                    var entry = $scope.getOrCreateTotalsForLocation(totalsByLocation, location.toLocation.toString(), location.fromWarehouse, location.toLocation, location.locationLabel);

                    angular.forEach(brigadeState.battalions, function (battalion) {
                        if (!battalion || !battalion.type) {
                            return;
                        }

                        var armyItem = $scope.getArmyListItemByShortName(battalion.type);
                        if (!armyItem) {
                            return;
                        }

                        var currentSize = Math.max(0, toInt(battalion.size, 0));
                        var missingMen = Math.max(0, targetHeadcount - currentSize);
                        if (missingMen <= 0) {
                            return;
                        }

                        entry.goods.louisdore += Math.round(missingMen * toFloat(armyItem.cost, 0));
                        entry.goods.citizens += missingMen;
                        entry.goods.ecPts += Math.round(Math.ceil(missingMen / 25) * toFloat(armyItem.ecPtsPer25, 0));
                        if ($scope.isMountedArmyItem(armyItem)) {
                            entry.goods.horses += missingMen;
                        }
                    });
                });

                return Object.keys(totalsByLocation).map(function (key) {
                    var entry = totalsByLocation[key];
                    return {
                        tsType: 'TS05',
                        tsLabel: TS_COST_LABELS.TS05,
                        from: entry.from,
                        to: entry.to,
                        locationLabel: entry.locationLabel,
                        goods: entry.goods
                    };
                }).filter(function (line) {
                    return hasAnyGoods(line.goods);
                });
            };

            $scope.buildTs06TransferLines = function (brigadeStateById) {
                var totalsByLocation = {};

                angular.forEach(Object.keys(brigadeStateById), function (idKey) {
                    var brigadeState = brigadeStateById[idKey];
                    if (!brigadeState || !brigadeState.trainPlan) {
                        return;
                    }

                    var location = $scope.getLineLocationContext($scope.getDepotForBrigadeState(brigadeState));
                    if (!location) {
                        return;
                    }

                    var entry = $scope.getOrCreateTotalsForLocation(totalsByLocation, location.toLocation.toString(), location.fromWarehouse, location.toLocation, location.locationLabel);

                    angular.forEach(brigadeState.battalions, function (battalion) {
                        if (!battalion || !battalion.type) {
                            return;
                        }

                        var armyItem = $scope.getArmyListItemByShortName(battalion.type);
                        if (!armyItem) {
                            return;
                        }

                        var currentSize = Math.max(0, toInt(battalion.size, 0));
                        var originalEf = Math.max(0, toInt(battalion.originalEf, 0));
                        var maxEf = toInt(armyItem.ef, 0);
                        if (maxEf <= 0) {
                            maxEf = toInt(armyItem.EF, 0);
                        }
                        if (maxEf <= 0) {
                            return;
                        }

                        var currentEf = originalEf;
                        if (brigadeState.headcountPlan) {
                            var targetHeadcount = Math.max(1, Math.min(800, toInt(brigadeState.headcountPlan.targetHeadcount, 800)));
                            var missingMen = Math.max(0, targetHeadcount - currentSize);
                            currentEf = Math.max(0, originalEf - $scope.calculateHeadcountEfDrop(missingMen, currentSize));
                        }

                        if (currentEf >= maxEf) {
                            return;
                        }

                        var headcount = brigadeState.headcountPlan
                            ? Math.min(800, Math.max(currentSize, toInt(brigadeState.headcountPlan.targetHeadcount, 800)))
                            : Math.min(800, currentSize);
                        var setupLd = headcount * toFloat(armyItem.cost, 0);
                        var setupEcPts = Math.ceil(headcount / 25) * toFloat(armyItem.ecPtsPer25, 0);
                        entry.goods.louisdore += Math.round(setupLd / 10);
                        entry.goods.ecPts += Math.round(setupEcPts / 8);
                    });
                });

                return Object.keys(totalsByLocation).map(function (key) {
                    var entry = totalsByLocation[key];
                    return {
                        tsType: 'TS06',
                        tsLabel: TS_COST_LABELS.TS06,
                        from: entry.from,
                        to: entry.to,
                        locationLabel: entry.locationLabel,
                        goods: entry.goods
                    };
                }).filter(function (line) {
                    return hasAnyGoods(line.goods);
                });
            };

            $scope.calculateTsCostTransferLines = function () {
                var brigadeStateById = $scope.buildBrigadeStateMapForCosting();
                $scope.applyTs04ToBrigadeState(brigadeStateById);
                $scope.applyTs05Ts06PlansToBrigadeState(brigadeStateById);

                var allLines = [];
                allLines = allLines.concat($scope.buildTs03TransferLines());
                allLines = allLines.concat($scope.buildTs04TransferLines(brigadeStateById));
                allLines = allLines.concat($scope.buildTs05TransferLines(brigadeStateById));
                allLines = allLines.concat($scope.buildTs06TransferLines(brigadeStateById));

                allLines.sort(function (left, right) {
                    var tsOrderCompare = $scope.getTsTypeSortOrder(left.tsType) - $scope.getTsTypeSortOrder(right.tsType);
                    if (tsOrderCompare !== 0) {
                        return tsOrderCompare;
                    }
                    var leftTo = toInt(left.to, 0);
                    var rightTo = toInt(right.to, 0);
                    if (leftTo !== rightTo) {
                        return leftTo - rightTo;
                    }
                    return 0;
                });

                return allLines;
            };

            $scope.getTransferGoodsRowSignature = function (row) {
                return [
                    toInt(row && row.orderNo, 0),
                    row && row.from != null ? row.from : '',
                    row && row.to != null ? row.to : '',
                    row && row.louisdore != null ? row.louisdore : '',
                    row && row.citizens != null ? row.citizens : '',
                    row && row.ecPts != null ? row.ecPts : '',
                    row && row.wood != null ? row.wood : '',
                    row && row.horses != null ? row.horses : '',
                    row && row.textiles != null ? row.textiles : ''
                ].join('|');
            };

            $scope.clearTransferGoodsRowValues = function (row) {
                if (!row) {
                    return;
                }
                row.from = null;
                row.to = null;
                row.louisdore = null;
                row.citizens = null;
                row.ecPts = null;
                row.wood = null;
                row.horses = null;
                row.textiles = null;
            };

            $scope.isTransferGoodsRowEmpty = function (row) {
                return !row || !$scope.hasTransferGoodsData(row);
            };

            $scope.loadManagedTransferGoodsRowsFromStorage = function () {
                $scope.managedTransferGoodsRowOrderNos = [];
                try {
                    var raw = window.localStorage.getItem(getManagedStorageKey($scope));
                    var parsed = raw ? JSON.parse(raw) : [];
                    if (Array.isArray(parsed)) {
                        $scope.managedTransferGoodsRowOrderNos = parsed.map(function (value) {
                            return toInt(value, 0);
                        }).filter(function (value) {
                            return value > 0;
                        });
                    }
                }
                catch (e) {
                    $scope.managedTransferGoodsRowOrderNos = [];
                }
            };

            $scope.saveManagedTransferGoodsRowsToStorage = function () {
                try {
                    window.localStorage.setItem(getManagedStorageKey($scope), JSON.stringify($scope.managedTransferGoodsRowOrderNos || []));
                }
                catch (e) {
                }
            };

            $scope.buildEconomyTsCostSummary = function (lines) {
                var grouped = {};
                angular.forEach(lines || [], function (line) {
                    if (!line || !line.tsType || !hasAnyGoods(line.goods)) {
                        return;
                    }

                    if (!grouped[line.tsType]) {
                        grouped[line.tsType] = {
                            tsType: line.tsType,
                            tsLabel: line.tsLabel || TS_COST_LABELS[line.tsType] || line.tsType,
                            rows: []
                        };
                    }

                    grouped[line.tsType].rows.push({
                        from: line.from,
                        to: line.to,
                        locationLabel: line.locationLabel || line.to,
                        goods: line.goods
                    });
                });

                $scope.economyTsCostSummarySections = Object.keys(grouped).map(function (tsType) {
                    var section = grouped[tsType];
                    section.rows.sort(function (left, right) {
                        return toInt(left.to, 0) - toInt(right.to, 0);
                    });
                    return section;
                }).sort(function (left, right) {
                    return $scope.getTsTypeSortOrder(left.tsType) - $scope.getTsTypeSortOrder(right.tsType);
                });
            };

            $scope.writeManagedTransferGoodsRows = function (lines) {
                if (!$scope.tsTransferGoodsList) {
                    return;
                }

                $scope.economyTsCostWarnings = [];
                var previousManaged = ($scope.managedTransferGoodsRowOrderNos || []).slice();
                var existingManagedRows = previousManaged.map(function (orderNo) {
                    return $scope.getTransferGoodsRowByOrderNo(orderNo);
                }).filter(function (row) {
                    return !!row;
                }).sort(function (left, right) {
                    return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
                });

                var availableEmptyRows = ($scope.tsTransferGoodsList || []).filter(function (row) {
                    var orderNo = toInt(row && row.orderNo, 0);
                    if (!orderNo || previousManaged.indexOf(orderNo) >= 0) {
                        return false;
                    }

                    return $scope.isTransferGoodsRowEmpty(row);
                }).sort(function (left, right) {
                    return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
                });

                var targetRows = [];
                for (var i = 0; i < lines.length; i++) {
                    if (i < existingManagedRows.length) {
                        targetRows.push(existingManagedRows[i]);
                    }
                    else if (availableEmptyRows.length && targetRows.length < MANAGED_TS01_ROW_LIMIT) {
                        targetRows.push(availableEmptyRows.shift());
                    }
                    else {
                        break;
                    }
                }

                var overflowCount = lines.length - targetRows.length;
                if (overflowCount > 0) {
                    $scope.economyTsCostWarnings.push('TS01 managed rows are full. ' + overflowCount + ' cost line(s) could not be written.');
                }

                var changed = false;
                var managedOrderNos = [];
                var used = {};

                angular.forEach(targetRows, function (row, idx) {
                    var line = lines[idx];
                    var before = $scope.getTransferGoodsRowSignature(row);
                    row.from = line.from;
                    row.to = line.to;
                    row.louisdore = toInt(line.goods.louisdore, 0) || null;
                    row.citizens = toInt(line.goods.citizens, 0) || null;
                    row.ecPts = toInt(line.goods.ecPts, 0) || null;
                    row.horses = toInt(line.goods.horses, 0) || null;
                    row.wood = toInt(line.goods.wood, 0) || null;
                    row.textiles = toInt(line.goods.textiles, 0) || null;
                    var after = $scope.getTransferGoodsRowSignature(row);
                    if (before !== after) {
                        changed = true;
                    }

                    var orderNo = toInt(row.orderNo, 0);
                    if (orderNo > 0) {
                        managedOrderNos.push(orderNo);
                        used[orderNo] = true;
                    }
                });

                angular.forEach(existingManagedRows, function (row) {
                    var orderNo = toInt(row.orderNo, 0);
                    if (!orderNo || used[orderNo]) {
                        return;
                    }
                    var before = $scope.getTransferGoodsRowSignature(row);
                    $scope.clearTransferGoodsRowValues(row);
                    var after = $scope.getTransferGoodsRowSignature(row);
                    if (before !== after) {
                        changed = true;
                    }
                });

                managedOrderNos.sort(function (left, right) { return left - right; });
                if ((managedOrderNos.join(',')) !== (($scope.managedTransferGoodsRowOrderNos || []).join(','))) {
                    changed = true;
                }
                $scope.managedTransferGoodsRowOrderNos = managedOrderNos;
                $scope.saveManagedTransferGoodsRowsToStorage();

                $scope.refreshTransferGoodsCostRows();
                if (changed) {
                    $scope.queueAutoSaveTsGrid('TransferGoods');
                }
            };

            $scope.recalculateTransferGoodsForSetUpBrigades = function () {
                if (!$scope.tsTransferGoodsList) return;
                var lines = $scope.calculateTsCostTransferLines();
                $scope.buildEconomyTsCostSummary(lines);
                $scope.writeManagedTransferGoodsRows(lines);
            };

            $scope.getDepotSourceItemNoAtCoordinate = function (x, y) {
                if (!$scope.masterData || !$scope.masterData.turnReport) return null;

                var barracks = $scope.masterData.turnReport.barracks || [];
                for (var i = 0; i < barracks.length; i++) {
                    if (barracks[i].x == x && barracks[i].y == y) return barracks[i].itemNo;
                }

                var ports = $scope.masterData.turnReport.tradingPortsAndCities || [];
                for (var j = 0; j < ports.length; j++) {
                    if (ports[j].x == x && ports[j].y == y) return ports[j].itemNo;
                }

                return null;
            };

            $scope.hasSetUpBrigadesData = function (setUpRow) {
                if (!setUpRow) return false;

                return (setUpRow.depot != null && setUpRow.depot !== '')
                    || (setUpRow.batt1 != null && setUpRow.batt1 !== '')
                    || (setUpRow.batt2 != null && setUpRow.batt2 !== '')
                    || (setUpRow.batt3 != null && setUpRow.batt3 !== '')
                    || (setUpRow.batt4 != null && setUpRow.batt4 !== '')
                    || (setUpRow.batt5 != null && setUpRow.batt5 !== '')
                    || (setUpRow.batt6 != null && setUpRow.batt6 !== '')
                    || (setUpRow.batt7 != null && setUpRow.batt7 !== '')
                    || (!!setUpRow.brigadeName && setUpRow.brigadeName !== '<Brigade Name>');
            };

            $scope.isBrigadeSetupIncomplete = function (setUpRow) {
                if (!setUpRow) return false;

                if (setUpRow.depot != null && setUpRow.depot !== '') {
                    if (!setUpRow.batt1 || !setUpRow.batt2 || !setUpRow.batt3 || !setUpRow.batt4 || !setUpRow.batt5) return true;
                    if (setUpRow.batt7 && !setUpRow.batt6) return true;
                }

                return false;
            };

            $scope.removeSetUpBrigadesRow = function (row) {
                if (!row || !row.entity) return;

                row.entity.depot = null;
                row.entity.batt1 = null;
                row.entity.batt2 = null;
                row.entity.batt3 = null;
                row.entity.batt4 = null;
                row.entity.batt5 = null;
                row.entity.batt6 = null;
                row.entity.batt7 = null;
                row.entity.brigadeName = '';

                $scope.queueAutoSaveTsGrid('SetUpBrigades');
                $scope.recalculateTransferGoodsForSetUpBrigades();
            };

            $scope.hasTransferGoodsData = function (transferRow) {
                if (!transferRow) return false;

                return (transferRow.from != null && transferRow.from !== '')
                    || (transferRow.to != null && transferRow.to !== '')
                    || (transferRow.louisdore != null && transferRow.louisdore !== '')
                    || (transferRow.citizens != null && transferRow.citizens !== '')
                    || (transferRow.ecPts != null && transferRow.ecPts !== '')
                    || (transferRow.wood != null && transferRow.wood !== '')
                    || (transferRow.horses != null && transferRow.horses !== '')
                    || (transferRow.textiles != null && transferRow.textiles !== '');
            };

            $scope.removeTransferGoodsRow = function (row) {
                if (!row || !row.entity) return;
                var orderNo = toInt(row.entity.orderNo, 0);

                row.entity.from = null;
                row.entity.to = null;
                row.entity.louisdore = null;
                row.entity.citizens = null;
                row.entity.ecPts = null;
                row.entity.wood = null;
                row.entity.horses = null;
                row.entity.textiles = null;

                if (orderNo > 0 && ($scope.managedTransferGoodsRowOrderNos || []).indexOf(orderNo) >= 0) {
                    $scope.managedTransferGoodsRowOrderNos = ($scope.managedTransferGoodsRowOrderNos || []).filter(function (value) {
                        return toInt(value, 0) !== orderNo;
                    });
                    $scope.saveManagedTransferGoodsRowsToStorage();
                }

                $scope.queueAutoSaveTsGrid('TransferGoods');
            };

            $scope.armyListClickRow = function (row) {
                if (!row || !row.entity) return;
                $scope.selectedArmyListItem = row.entity;
            };

            $scope.isArmyListItemSelected = function (armyItem) {
                if (!armyItem || !$scope.selectedArmyListItem) return false;

                return armyItem.itemNo == $scope.selectedArmyListItem.itemNo;
            };

            $scope.setUpBrigadesGridClick = function (row, col) {
                if (!row || !row.entity || !col) return;

                var field = (col.field || '').toLowerCase();

                if (field === 'depot') {
                    if (!$scope.pendingDepotSourceItemNo) {
                        alert('Select a barracks/shipyard coordinate first.');
                        return;
                    }

                    row.entity.depot = $scope.pendingDepotSourceItemNo;
                    $scope.queueAutoSaveTsGrid('SetUpBrigades');
                    $scope.recalculateTransferGoodsForSetUpBrigades();
                    return;
                }

                var battFields = ['batt1', 'batt2', 'batt3', 'batt4', 'batt5', 'batt6', 'batt7'];
                if (battFields.indexOf(field) > -1) {
                    if (!$scope.selectedArmyListItem) {
                        alert('Select an army list row first.');
                        return;
                    }

                    var unitItemNo = $scope.selectedArmyListItem.itemNo;
                    var sphere = $scope.getSphereFromDepotItemNo(row.entity.depot);
                    if (!sphere) {
                        alert('Select a depot in this TS_03 row before adding battalions.');
                        return;
                    }

                    if (!$scope.canAddArmyItemToDepotSphere(unitItemNo, sphere)) {
                        alert('This troop type cannot be built in the selected sphere.');
                        return;
                    }

                    row.entity[field] = unitItemNo;

                    if (!row.entity.brigadeName || row.entity.brigadeName === '<Brigade Name>') {
                        row.entity.brigadeName = $scope.selectedArmyListItem.name;
                    }

                    $scope.queueAutoSaveTsGrid('SetUpBrigades');
                    $scope.recalculateTransferGoodsForSetUpBrigades();
                }
            };

            $scope.loadManagedTransferGoodsRowsFromStorage();
        }
    };
});
