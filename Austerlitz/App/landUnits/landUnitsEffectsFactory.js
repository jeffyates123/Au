'use strict';

austerlitzModule.factory('landUnitsEffectsFactory', function () {
    return {
        attach: function ($scope) {
            $scope.calculateHeadcountResources = function (brigade, targetHeadcount) {
                    var resources = {
                        ld: 0,
                        citizens: 0,
                        ecPts: 0,
                        horses: 0
                    };
            
                    angular.forEach(brigade.battalions, function (battalion) {
                        var missingMen = $scope.getMissingHeadcount(battalion, targetHeadcount);
                        if (missingMen <= 0) {
                            return;
                        }
            
                        var armyItem = $scope.getArmyItemForBattalion(battalion);
                        if (!armyItem) {
                            return;
                        }
            
                        var cost = parseFloat(armyItem.cost);
                        var ecPtsPer25 = parseFloat(armyItem.ecPtsPer25);
                        if (isNaN(cost)) cost = 0;
                        if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;
            
                        resources.ld += Math.round(missingMen * cost);
                        resources.citizens += missingMen;
                        resources.ecPts += Math.round(Math.ceil(missingMen / 25) * ecPtsPer25);
                        if ($scope.isMountedArmyItem(armyItem)) {
                            resources.horses += missingMen;
                        }
                    });
            
                    return {
                        ld: resources.ld || '',
                        citizens: resources.citizens || '',
                        ecPts: resources.ecPts || '',
                        horses: resources.horses || ''
                    };
                };

            $scope.applyHeadcountEfChanges = function (brigade, targetHeadcount) {
                    angular.forEach(brigade.battalions, function (battalion) {
                        var originalEf = parseInt(battalion.originalEf, 10);
                        var missingMen = $scope.getMissingHeadcount(battalion, targetHeadcount);
                        var drop = $scope.getEfDrop(missingMen, battalion.size);
            
                        if (!battalion.display || isNaN(originalEf) || drop <= 0) {
                            battalion.currentEf = battalion.originalEf;
                            $scope.updateBattalionDisplayState(battalion);
                            return;
                        }
            
                        battalion.currentEf = Math.max(0, originalEf - drop);
                        $scope.updateBattalionDisplayState(battalion);
                    });
                };

            $scope.applyHeadcountPlanToBrigade = function (brigade, targetHeadcount, scope, sourceBrigadeId) {
                    brigade.headcountPlan = {
                        targetHeadcount: targetHeadcount,
                        scope: scope,
                        sourceBrigadeId: sourceBrigadeId
                    };
                    brigade.headcountSelected = true;
                    $scope.recalculateBrigadeEffects(brigade);
                };

            $scope.clearHeadcountPlanFromBrigade = function (brigade) {
                    brigade.headcountPlan = null;
                    brigade.headcountSelected = false;
                    $scope.recalculateBrigadeEffects(brigade);
                };

            $scope.applyTrainPlanToBrigade = function (brigade, scope, sourceBrigadeId) {
                    brigade.trainPlan = {
                        scope: scope,
                        sourceBrigadeId: sourceBrigadeId
                    };
                    brigade.trainSelected = true;
                    $scope.recalculateBrigadeEffects(brigade);
                };

            $scope.clearTrainPlanFromBrigade = function (brigade) {
                    brigade.trainPlan = null;
                    brigade.trainSelected = false;
                    $scope.recalculateBrigadeEffects(brigade);
                };

            $scope.recalculateBrigadeEffects = function (brigade) {
                    var resources = {
                        ld: 0,
                        citizens: 0,
                        ecPts: 0,
                        horses: 0
                    };
            
                    $scope.resetBattalionDisplays(brigade);
            
                    // H/C must run before Train because it can change EF and effective headcount.
                    if (brigade.headcountPlan) {
                        $scope.addResources(resources, $scope.calculateHeadcountResources(brigade, brigade.headcountPlan.targetHeadcount));
                        $scope.applyHeadcountEfChanges(brigade, brigade.headcountPlan.targetHeadcount);
                    }
            
                    if (brigade.trainPlan) {
                        $scope.addResources(resources, $scope.calculateTrainResources(brigade));
                        $scope.applyTrainEfChanges(brigade);
                    }
            
                    brigade.resources = {
                        ld: resources.ld || '',
                        citizens: resources.citizens || '',
                        ecPts: resources.ecPts || '',
                        horses: resources.horses || ''
                    };
                };

            $scope.resetBattalionDisplays = function (brigade) {
                    angular.forEach(brigade.battalions, function (battalion) {
                        battalion.currentEf = battalion.originalEf;
                        battalion.isEfChanged = false;
                        battalion.efDrop = 0;
                        battalion.efIncrease = 0;
                        battalion.display = battalion.type ? $scope.formatBattalionParts(battalion.type, battalion.originalEf, battalion.size) : '';
                    });
                };

            $scope.applyTrainEfChanges = function (brigade) {
                    angular.forEach(brigade.battalions, function (battalion) {
                        var currentEf = parseInt(battalion.currentEf, 10);
                        var originalEf = parseInt(battalion.originalEf, 10);
                        var maxEf = $scope.getBattalionMaxEf(battalion);
            
                        if (!battalion.display || isNaN(currentEf) || isNaN(originalEf) || maxEf == null || currentEf >= maxEf) {
                            $scope.updateBattalionDisplayState(battalion);
                            return;
                        }
            
                        battalion.currentEf = Math.min(maxEf, currentEf + 1);
                        $scope.updateBattalionDisplayState(battalion);
                    });
                };

            $scope.updateBattalionDisplayState = function (battalion) {
                    var originalEf = parseInt(battalion.originalEf, 10);
                    var currentEf = parseInt(battalion.currentEf, 10);
            
                    battalion.efDrop = 0;
                    battalion.efIncrease = 0;
                    battalion.isEfChanged = !isNaN(originalEf) && !isNaN(currentEf) && currentEf !== originalEf;
            
                    if (battalion.isEfChanged && currentEf < originalEf) {
                        battalion.efDrop = Math.min(2, originalEf - currentEf);
                    }
                    else if (battalion.isEfChanged && currentEf > originalEf) {
                        battalion.efIncrease = currentEf - originalEf;
                    }
            
                    battalion.display = battalion.type ? $scope.formatBattalionParts(battalion.type, battalion.currentEf, battalion.size) : '';
                };

            $scope.getMissingHeadcount = function (battalion, targetHeadcount) {
                    if (!battalion || !battalion.type) {
                        return 0;
                    }
            
                    var currentSize = parseInt(battalion.size, 10);
                    if (isNaN(currentSize)) {
                        currentSize = 0;
                    }
            
                    return Math.max(0, targetHeadcount - currentSize);
                };

            $scope.getEfDrop = function (missingMen, currentSize) {
                    var size = parseInt(currentSize, 10);
                    if (isNaN(size)) {
                        size = 0;
                    }
            
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

            $scope.getArmyItemForBattalion = function (battalion) {
                    if (!battalion || !battalion.type) {
                        return null;
                    }
            
                    return $scope.armyListByShortName[battalion.type.toString().trim().toUpperCase()] || null;
                };

            $scope.canTrainBattalion = function (battalion) {
                    if (!battalion || !battalion.type) {
                        return false;
                    }
            
                    var currentEf = parseInt(battalion.currentEf, 10);
                    var maxEf = $scope.getBattalionMaxEf(battalion);
                    return !isNaN(currentEf) && maxEf != null && currentEf < maxEf;
                };

            $scope.getBattalionMaxEf = function (battalion) {
                    var armyItem = $scope.getArmyItemForBattalion(battalion);
                    if (!armyItem) {
                        return null;
                    }
            
                    var maxEf = parseInt(armyItem.ef, 10);
                    if (isNaN(maxEf)) {
                        maxEf = parseInt(armyItem.EF, 10);
                    }
            
                    return isNaN(maxEf) ? null : maxEf;
                };

            $scope.getEffectiveTrainingHeadcount = function (brigade, battalion) {
                    var currentSize = parseInt(battalion.size, 10);
                    if (isNaN(currentSize)) {
                        currentSize = 0;
                    }
            
                    if (brigade.headcountPlan) {
                        return Math.min(800, Math.max(currentSize, brigade.headcountPlan.targetHeadcount));
                    }
            
                    return Math.min(800, Math.max(0, currentSize));
                };

            $scope.addResources = function (total, resources) {
                    total.ld += parseInt(resources.ld, 10) || 0;
                    total.citizens += parseInt(resources.citizens, 10) || 0;
                    total.ecPts += parseInt(resources.ecPts, 10) || 0;
                    total.horses += parseInt(resources.horses, 10) || 0;
                };

            $scope.normalizeTargetHeadcount = function (value) {
                    var parsed = parseInt(value, 10);
                    if (isNaN(parsed)) {
                        parsed = 800;
                    }
            
                    if (parsed < 1) return 1;
                    if (parsed > 800) return 800;
                    return parsed;
                };

            $scope.canApplyFederationScope = function (brigade) {
                    return !!(brigade && brigade.fed && parseInt(brigade.fed, 10) > 0);
                };

            $scope.getHeadcountAffectedBrigades = function (brigade, scope) {
                    if (!brigade) {
                        return [];
                    }
            
                    if (scope !== 'federation' || !$scope.canApplyFederationScope(brigade)) {
                        return [brigade];
                    }
            
                    var federationNo = parseInt(brigade.fed, 10);
                    return $scope.brigadeRows.filter(function (row) {
                        return parseInt(row.fed, 10) === federationNo;
                    });
                };

            $scope.calculateHeadcountPreview = function (affectedBrigades, targetHeadcount) {
                    var preview = $scope.calculateEmptyHeadcountPreview();
                    preview.affectedBrigades = affectedBrigades.length;
            
                    angular.forEach(affectedBrigades, function (brigade) {
                        var resources = $scope.calculateHeadcountResources(brigade, targetHeadcount);
                        preview.ld += parseInt(resources.ld, 10) || 0;
                        preview.citizens += parseInt(resources.citizens, 10) || 0;
                        preview.ecPts += parseInt(resources.ecPts, 10) || 0;
                        preview.horses += parseInt(resources.horses, 10) || 0;
            
                        angular.forEach(brigade.battalions, function (battalion) {
                            var originalEf = parseInt(battalion.originalEf, 10);
                            var missingMen = $scope.getMissingHeadcount(battalion, targetHeadcount);
                            if (!isNaN(originalEf) && $scope.getEfDrop(missingMen, battalion.size) > 0) {
                                preview.efChanges += 1;
                            }
                        });
                    });
            
                    return preview;
                };

            $scope.calculateTrainResources = function (brigade) {
                    var resources = {
                        ld: 0,
                        citizens: 0,
                        ecPts: 0,
                        horses: 0
                    };
            
                    angular.forEach(brigade.battalions, function (battalion) {
                        if (!$scope.canTrainBattalion(battalion)) {
                            return;
                        }
            
                        $scope.addResources(resources, $scope.calculateBattalionTrainingResources(brigade, battalion));
                    });
            
                    return {
                        ld: resources.ld || '',
                        citizens: '',
                        ecPts: resources.ecPts || '',
                        horses: ''
                    };
                };

            $scope.calculateBattalionTrainingResources = function (brigade, battalion) {
                    var resources = $scope.calculatePlaceholderResources();
                    if (!$scope.canTrainBattalion(battalion)) {
                        return resources;
                    }
            
                    var armyItem = $scope.getArmyItemForBattalion(battalion);
                    if (!armyItem) {
                        return resources;
                    }
            
                    var headcount = $scope.getEffectiveTrainingHeadcount(brigade, battalion);
                    var setupCost = $scope.calculateBattalionSetupCost(armyItem, headcount);
            
                    resources.ld = Math.round(setupCost.ld / 10) || '';
                    resources.ecPts = Math.round(setupCost.ecPts / 8) || '';
                    return resources;
                };

            $scope.calculateBattalionSetupCost = function (armyItem, headcount) {
                    var cost = parseFloat(armyItem && armyItem.cost);
                    var ecPtsPer25 = parseFloat(armyItem && armyItem.ecPtsPer25);
                    if (isNaN(cost)) cost = 0;
                    if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;
            
                    return {
                        ld: headcount * cost,
                        ecPts: Math.ceil(headcount / 25) * ecPtsPer25
                    };
                };

            $scope.calculateTrainPreview = function (affectedBrigades) {
                    var preview = $scope.calculateEmptyTrainPreview();
                    preview.affectedBrigades = affectedBrigades.length;
            
                    angular.forEach(affectedBrigades, function (brigade) {
                        angular.forEach(brigade.battalions, function (battalion) {
                            if ($scope.canTrainBattalion(battalion)) {
                                var resources = $scope.calculateBattalionTrainingResources(brigade, battalion);
                                preview.ld += parseInt(resources.ld, 10) || 0;
                                preview.ecPts += parseInt(resources.ecPts, 10) || 0;
                                preview.trainableBattalions += 1;
                                preview.efChanges += 1;
                            }
                            else if (battalion && battalion.type) {
                                preview.skippedBattalions += 1;
                            }
                        });
                    });
            
                    return preview;
                };

            $scope.calculateEmptyTrainPreview = function () {
                    return {
                        affectedBrigades: 0,
                        trainableBattalions: 0,
                        skippedBattalions: 0,
                        ld: 0,
                        ecPts: 0,
                        efChanges: 0
                    };
                };

            $scope.calculateEmptyHeadcountPreview = function () {
                    return {
                        affectedBrigades: 0,
                        ld: 0,
                        citizens: 0,
                        ecPts: 0,
                        horses: 0,
                        efChanges: 0
                    };
                };

            $scope.isMountedArmyItem = function (armyItem) {
                    if (!armyItem) {
                        return false;
                    }
            
                    var shortName = (armyItem.shortName || '').toString();
                    var name = (armyItem.name || '').toString();
                    return !!armyItem.isCavalry || /mounted/i.test(name) || /^mc$/i.test(shortName);
                };

            $scope.isBrigadeAtBarracks = function (brigade) {
                    if (!brigade || !$scope.masterData || !$scope.masterData.turnReport) {
                        return false;
                    }
            
                    var x = parseInt(brigade.source.x_OrState, 10);
                    var y = parseInt(brigade.source.y_OrFleet, 10);
                    if (isNaN(x) || isNaN(y)) {
                        return false;
                    }
            
                    var barracks = $scope.masterData.turnReport.barracks || [];
                    for (var i = 0; i < barracks.length; i++) {
                        if (parseInt(barracks[i].x, 10) === x && parseInt(barracks[i].y, 10) === y) {
                            return true;
                        }
                    }
            
                    return false;
                };


        }
    };
});
