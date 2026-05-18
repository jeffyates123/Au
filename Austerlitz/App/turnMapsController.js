'use strict';

//https://www.youtube.com/playlist?list=PL5586336C26BDB324 JAVASCRIPT VIDEOS

function sendRegionalMapFile(file) {
    console.log(file.type);

    var data = new FormData();
    data.append("file1", file);

    $.ajax({
        type: 'post',
        url: '/Api/RulesCatalogApi/RegionalMapFilePost',
        data: data,
        success: function () {
            alert("Succesfully loaded Regional Map");
        },
        error: function () {
            alert("Error while invoking the Web API");
        },
        contentType: false,
        processData: false
    });
};

austerlitzModule.controller("turnMapsController", function ($scope, $routeParams, $timeout, turnReportFactory, rulesCatalogFactory, turnSheetFactory, masterData) {

    $scope.masterData = masterData;

    $scope.attachUnitsToMapCoordinates = function () {
        if (!$scope.mapCoordinates || !$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
            return;
        }

        angular.forEach($scope.mapCoordinates, function (mapRow) {
            angular.forEach(mapRow, function (coordinate) {
                coordinate.units = [];
            });
        });

        angular.forEach($scope.masterData.turnReport.movementItemList, function (item) {
            if ($scope.mapCoordinates[item.y] && $scope.mapCoordinates[item.y][item.x]) {
                $scope.mapCoordinates[item.y][item.x].units.push(item.itemNo);
            }
        });
    };

    $scope.autoSavePromises = {};

    $scope.normalizeBuildProductionSiteRows = function (rows) {
        return (rows || []).map(function (row) {
            row.orderNo = row.orderNo != null ? row.orderNo : row.OrderNo;
            row.prodSiteType = row.prodSiteType != null ? row.prodSiteType : row.ProdSiteType;
            row.x = row.x != null ? row.x : row.X;
            row.y = row.y != null ? row.y : row.Y;

            row.OrderNo = row.orderNo;
            row.ProdSiteType = row.prodSiteType;
            row.X = row.x;
            row.Y = row.y;
            return row;
        });
    };

    $scope.refreshSetUpBrigadesRows = function () {
        if (!$scope.tsSetUpBrigadesList) {
            $scope.tsSetUpBrigadesRows = [];
            return;
        }

        $scope.tsSetUpBrigadesRows = $scope.tsSetUpBrigadesList.filter(function (row) {
            var orderNo = row.orderNo != null ? row.orderNo : row.OrderNo;
            return orderNo != null && parseInt(orderNo, 10) <= 8;
        });
    };

    $scope.normalizeFormFederationRows = function (rows) {
        return (rows || []).map(function (row) {
            row.orderNo = row.orderNo != null ? row.orderNo : row.OrderNo;
            row.itemNo = row.itemNo != null ? row.itemNo : row.ItemNo;
            row.federation_Fleet = row.federation_Fleet != null ? row.federation_Fleet : row.Federation_Fleet;

            row.OrderNo = row.orderNo;
            row.ItemNo = row.itemNo;
            row.Federation_Fleet = row.federation_Fleet;
            return row;
        });
    };

    $scope.normalizeSetUpBrigadesRows = function (rows) {
        return (rows || []).map(function (row) {
            row.orderNo = row.orderNo != null ? row.orderNo : row.OrderNo;
            row.depot = row.depot != null ? row.depot : row.Depot;
            row.brigadeName = row.brigadeName != null ? row.brigadeName : row.BrigadeName;

            if (row.depot == null || row.depot === '') {
                row.brigadeName = '';
            }

            row.OrderNo = row.orderNo;
            row.Depot = row.depot;
            row.BrigadeName = row.brigadeName;
            return row;
        });
    };

    $scope.normalizeTransferGoodsRows = function (rows) {
        return (rows || []).map(function (row) {
            row.orderNo = row.orderNo != null ? row.orderNo : row.OrderNo;
            row.OrderNo = row.orderNo;
            return row;
        });
    };

    $scope.refreshTransferGoodsCostRows = function () {
        if (!$scope.tsTransferGoodsList) {
            $scope.tsTransferGoodsCostRows = [];
            return;
        }

        $scope.tsTransferGoodsCostRows = $scope.tsTransferGoodsList.filter(function (row) {
            var from = row.from != null ? row.from : row.From;
            var to = row.to != null ? row.to : row.To;
            var louisdore = row.louisdore != null ? row.louisdore : row.Louisdore;
            var citizens = row.citizens != null ? row.citizens : row.Citizens;
            var ecPts = row.ecPts != null ? row.ecPts : row.EcPts;
            var horses = row.horses != null ? row.horses : row.Horses;

            return from != null || to != null || louisdore != null || citizens != null || ecPts != null || horses != null;
        });
    };

    $scope.getTransferCostRow = function (warehouseNo) {
        if (!$scope.tsTransferGoodsList) {
            return null;
        }

        for (var i = 0; i < $scope.tsTransferGoodsList.length; i++) {
            var orderNo = $scope.tsTransferGoodsList[i].orderNo != null ? $scope.tsTransferGoodsList[i].orderNo : $scope.tsTransferGoodsList[i].OrderNo;
            if (orderNo == warehouseNo) {
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
            $scope.armyListRows = (armyList || []).filter(function (item) {
                var itemNo = item.itemNo != null ? item.itemNo : item.ItemNo;
                var parsedItemNo = parseInt(itemNo, 10);
                if (itemNo == null || isNaN(parsedItemNo) || parsedItemNo % 2 === 0) {
                    return false;
                }

                if (isEuropeSphere && (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39)) {
                    return false;
                }

                if (!isEuropeSphere && parsedItemNo === 19) {
                    return false;
                }

                return true;
            });

            $scope.recalculateTransferGoodsForSetUpBrigades();
        });
    };

    $scope.getSphereFromCoordinate = function (x, y) {
        var px = parseInt(x, 10);
        var py = parseInt(y, 10);

        if (isNaN(px) || isNaN(py)) {
            return null;
        }

        if (px <= 80 && py <= 65) return 'Europe';
        if (px <= 40 && py <= 99) return 'Carribbean';
        if (px <= 90 && py <= 99) return 'India';
        return null;
    };

    $scope.getDepotReferenceByItemNo = function (depotItemNo) {
        if (!$scope.masterData || !$scope.masterData.turnReport || depotItemNo == null) {
            return null;
        }

        var barracks = $scope.masterData.turnReport.barracks || $scope.masterData.turnReport.Barracks || [];
        for (var i = 0; i < barracks.length; i++) {
            var itemNo = barracks[i].itemNo != null ? barracks[i].itemNo : barracks[i].ItemNo;
            if (itemNo == depotItemNo) {
                return barracks[i];
            }
        }

        var ports = $scope.masterData.turnReport.tradingPortsAndCities || $scope.masterData.turnReport.TradingPortsAndCities || [];
        for (var j = 0; j < ports.length; j++) {
            var portNo = ports[j].itemNo != null ? ports[j].itemNo : ports[j].ItemNo;
            if (portNo == depotItemNo) {
                return ports[j];
            }
        }

        return null;
    };

    $scope.getSphereFromDepotItemNo = function (depotItemNo) {
        var depotRef = $scope.getDepotReferenceByItemNo(depotItemNo);
        if (!depotRef) {
            return null;
        }

        var x = depotRef.x != null ? depotRef.x : depotRef.X;
        var y = depotRef.y != null ? depotRef.y : depotRef.Y;
        return $scope.getSphereFromCoordinate(x, y);
    };

    $scope.getArmyListItemByItemNo = function (itemNo) {
        if (!$scope.armyListRows || itemNo == null) {
            return null;
        }

        for (var i = 0; i < $scope.armyListRows.length; i++) {
            var armyItemNo = $scope.armyListRows[i].itemNo != null ? $scope.armyListRows[i].itemNo : $scope.armyListRows[i].ItemNo;
            if (armyItemNo == itemNo) {
                return $scope.armyListRows[i];
            }
        }

        return null;
    };

    $scope.canAddArmyItemToDepotSphere = function (armyItemNo, sphere) {
        var parsedItemNo = parseInt(armyItemNo, 10);
        if (isNaN(parsedItemNo)) {
            return false;
        }

        if (parsedItemNo === 19) {
            return sphere === 'Europe';
        }

        if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39) {
            return sphere === 'Carribbean' || sphere === 'India';
        }

        return true;
    };

    $scope.recalculateTransferGoodsForSetUpBrigades = function () {
        if (!$scope.tsSetUpBrigadesList || !$scope.tsTransferGoodsList) {
            return;
        }

        var totalsByDepot = {};
        var depotOrder = [];
        var battalionFields = ['batt1', 'batt2', 'batt3', 'batt4', 'batt5', 'batt6', 'batt7'];

        angular.forEach($scope.tsSetUpBrigadesList, function (setUpRow) {
            var depotItemNo = setUpRow.depot != null ? setUpRow.depot : setUpRow.Depot;
            if (depotItemNo == null || depotItemNo === '') {
                return;
            }

            var sphere = $scope.getSphereFromDepotItemNo(depotItemNo);
            var warehouseNo = sphere === 'Europe' ? 1 : (sphere === 'Carribbean' ? 2 : (sphere === 'India' ? 3 : null));
            if (!warehouseNo) {
                return;
            }

            var depotKey = depotItemNo.toString();
            if (!totalsByDepot[depotKey]) {
                totalsByDepot[depotKey] = {
                    from: warehouseNo,
                    to: depotItemNo,
                    money: 0,
                    citizens: 0,
                    ecPts: 0,
                    horses: 0
                };
                depotOrder.push(depotKey);
            }

            angular.forEach(battalionFields, function (field) {
                var battItemNo = setUpRow[field] != null ? setUpRow[field] : setUpRow[field.charAt(0).toUpperCase() + field.substr(1)];
                if (!battItemNo) {
                    return;
                }

                var armyItem = $scope.getArmyListItemByItemNo(battItemNo);
                if (!armyItem) {
                    return;
                }

                var recruits = 800;
                var coCost = parseFloat(armyItem.cost != null ? armyItem.cost : armyItem.Cost);
                var ecPtsPer25 = parseFloat(armyItem.ecPtsPer25 != null ? armyItem.ecPtsPer25 : armyItem.EcPtsPer25);
                var isCavalry = !!(armyItem.isCavalry != null ? armyItem.isCavalry : armyItem.IsCavalry);
                var shortName = (armyItem.shortName || armyItem.ShortName || '').toString();
                var name = (armyItem.name || armyItem.Name || '').toString();
                var isMounted = isCavalry || /mounted/i.test(name) || /^mc$/i.test(shortName);

                if (isNaN(coCost)) coCost = 0;
                if (isNaN(ecPtsPer25)) ecPtsPer25 = 0;

                totalsByDepot[depotKey].citizens += recruits;
                totalsByDepot[depotKey].money += (recruits * coCost);
                totalsByDepot[depotKey].ecPts += (Math.ceil(recruits / 25) * ecPtsPer25);
                if (isMounted) {
                    totalsByDepot[depotKey].horses += recruits;
                }
            });
        });

        var transferLines = depotOrder.map(function (depotKey) {
            var totals = totalsByDepot[depotKey];
            return {
                from: totals.from,
                to: totals.to,
                louisdore: Math.round(totals.money),
                citizens: totals.citizens,
                ecPts: Math.round(totals.ecPts),
                horses: totals.horses
            };
        }).filter(function (line) {
            return line.louisdore > 0 || line.citizens > 0 || line.ecPts > 0 || line.horses > 0;
        });

        for (var i = 0; i < $scope.tsTransferGoodsList.length; i++) {
            var transferRow = $scope.tsTransferGoodsList[i];
            var line = i < transferLines.length ? transferLines[i] : null;

            if (line) {
                transferRow.from = line.from;
                transferRow.From = line.from;
                transferRow.to = line.to;
                transferRow.To = line.to;
                transferRow.louisdore = line.louisdore;
                transferRow.Louisdore = line.louisdore;
                transferRow.citizens = line.citizens;
                transferRow.Citizens = line.citizens;
                transferRow.ecPts = line.ecPts;
                transferRow.EcPts = line.ecPts;
                transferRow.horses = line.horses;
                transferRow.Horses = line.horses;
                transferRow.wood = null;
                transferRow.Wood = null;
                transferRow.textiles = null;
                transferRow.Textiles = null;
            } else {
                transferRow.from = null;
                transferRow.From = null;
                transferRow.to = null;
                transferRow.To = null;
                transferRow.louisdore = null;
                transferRow.Louisdore = null;
                transferRow.citizens = null;
                transferRow.Citizens = null;
                transferRow.ecPts = null;
                transferRow.EcPts = null;
                transferRow.horses = null;
                transferRow.Horses = null;
                transferRow.wood = null;
                transferRow.Wood = null;
                transferRow.textiles = null;
                transferRow.Textiles = null;
            }
        }

        $scope.refreshTransferGoodsCostRows();

        $scope.queueAutoSaveTsGrid('TransferGoods');
    };

    $scope.queueAutoSaveTsGrid = function (tsType) {
        if ($scope.autoSavePromises[tsType]) {
            $timeout.cancel($scope.autoSavePromises[tsType]);
        }

        $scope.autoSavePromises[tsType] = $timeout(function () {
            var records = null;
            if (tsType === 'Movement') records = $scope.tsMovementList;
            if (tsType === 'BuildProductionSites') records = $scope.tsBuildProductionSitesList;
            if (tsType === 'FormFederations') records = $scope.tsFormFederationsList;
            if (tsType === 'SetUpBrigades') records = $scope.tsSetUpBrigadesList;
            if (tsType === 'TransferGoods') records = $scope.tsTransferGoodsList;

            if (!records) return;

            turnSheetFactory.postTSRecords(records, tsType).then(function (savedRows) {
                if (tsType === 'BuildProductionSites') $scope.tsBuildProductionSitesList = $scope.normalizeBuildProductionSiteRows(savedRows);
                if (tsType === 'FormFederations') $scope.tsFormFederationsList = $scope.normalizeFormFederationRows(savedRows);
                if (tsType === 'SetUpBrigades') {
                    $scope.tsSetUpBrigadesList = $scope.normalizeSetUpBrigadesRows(savedRows);
                    $scope.refreshSetUpBrigadesRows();
                }
                if (tsType === 'TransferGoods') {
                    $scope.tsTransferGoodsList = $scope.normalizeTransferGoodsRows(savedRows);
                    $scope.refreshTransferGoodsCostRows();
                }
                if (tsType === 'Movement') $scope.tsMovementList = savedRows;
            });
        }, 100);
    };

    $scope.$on('ngGridEventEndCellEdit', function () {
        if ($scope.isProductionSiteMode()) {
            $scope.queueAutoSaveTsGrid('BuildProductionSites');
            return;
        }
        if ($scope.isFormFederationMode()) {
            $scope.queueAutoSaveTsGrid('FormFederations');
            return;
        }
        if ($scope.isSetUpBrigadesMode()) {
            $scope.queueAutoSaveTsGrid('SetUpBrigades');
            $scope.queueAutoSaveTsGrid('TransferGoods');
            $scope.recalculateTransferGoodsForSetUpBrigades();
            return;
        }
        $scope.queueAutoSaveTsGrid('Movement');
    });

    $scope.getJumpOffPointText = function (coord) {
        if (!coord) return '';

        var x = parseInt(coord.x);
        var y = parseInt(coord.y);
        var terrain = coord.terrain || '';
        var isSea = '*+.'.indexOf(terrain) > -1;

        if (!isSea) return '';

        if (x === 1 && y >= 11 && y <= 20) return 'Europe -> Caribbean';
        if (x === 40 && y >= 71 && y <= 80) return 'Caribbean -> Europe';

        if (x === 1 && y >= 41 && y <= 50) return 'Europe -> India';
        if (x === 51 && y >= 81 && y <= 90) return 'India -> Europe';

        if (x >= 65 && x <= 66 && y === 65) return 'Red Sea -> India';
        if (x === 51 && y >= 75 && y <= 76) return 'India -> Red Sea';

        if (x === 40 && y >= 86 && y <= 90) return 'Caribbean (E) -> India (SW)';
        if (x >= 56 && x <= 60 && y === 99) return 'India (SW) -> Caribbean (E)';

        if (x === 1 && y >= 91 && y <= 95) return 'Caribbean (W) -> India (NE)';
        if (x === 90 && y >= 71 && y <= 75) return 'India (NE) -> Caribbean (W)';

        if (x >= 8 && x <= 12 && y === 99) return 'Caribbean (SW) -> India (SE)';
        if (x === 90 && y >= 88 && y <= 92) return 'India (SE) -> Caribbean (SW)';

        return '';
    };

    $scope.markJumpOffPoints = function () {
        if (!$scope.mapCoordinates) return;

        angular.forEach($scope.mapCoordinates, function (mapRow) {
            angular.forEach(mapRow, function (coordinate) {
                coordinate.jumpOffText = $scope.getJumpOffPointText(coordinate);
            });
        });
    };

    turnReportFactory.getMapCoordinates($scope.masterData.turnId).then(function (mapCoordinates) {
        $scope.mapCoordinates = mapCoordinates;
        $scope.markJumpOffPoints();
        $scope.attachUnitsToMapCoordinates();
    });

    turnReportFactory.getTRFullTurnDetails($scope.masterData.turnId).then(function (turnReport) {
        $scope.masterData.turnReport = turnReport;
        $scope.attachUnitsToMapCoordinates();
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
    });

    turnSheetFactory.getTSMovement($scope.masterData.turnId).then(function (tsMovementList) {
        $scope.tsMovementList = tsMovementList;
    });

    turnSheetFactory.getTSBuildProductionSites($scope.masterData.turnId).then(function (tsBuildProductionSitesList) {
        $scope.tsBuildProductionSitesList = $scope.normalizeBuildProductionSiteRows(tsBuildProductionSitesList);
    });

    turnSheetFactory.getTSFormFederations($scope.masterData.turnId).then(function (tsFormFederationsList) {
        $scope.tsFormFederationsList = $scope.normalizeFormFederationRows(tsFormFederationsList);
    });

    turnSheetFactory.getTSSetUpBrigades($scope.masterData.turnId).then(function (tsSetUpBrigadesList) {
        $scope.tsSetUpBrigadesList = $scope.normalizeSetUpBrigadesRows(tsSetUpBrigadesList);
        $scope.refreshSetUpBrigadesRows();
        $scope.recalculateTransferGoodsForSetUpBrigades();
    });

    turnSheetFactory.getTSTransferGoods($scope.masterData.turnId).then(function (tsTransferGoodsList) {
        $scope.tsTransferGoodsList = $scope.normalizeTransferGoodsRows(tsTransferGoodsList);
        $scope.refreshTransferGoodsCostRows();
        $scope.recalculateTransferGoodsForSetUpBrigades();
    });

    rulesCatalogFactory.getRefProductionSites().then(function (productionSiteList) {
        $scope.productionSiteList = productionSiteList;
        $scope.selectedProductionSite = productionSiteList[5];
    });

    rulesCatalogFactory.getRefStates().then(function (stateList) {
        $scope.stateList = stateList;

        var selectedStateCode = ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : '').toString().trim().toUpperCase();
        var selectedState = null;

        if (selectedStateCode) {
            angular.forEach($scope.stateList, function (state) {
                var stateCode = (state.state || state.State || '').toString().trim().toUpperCase();
                if (!selectedState && stateCode === selectedStateCode) {
                    selectedState = state;
                }
            });
        }

        $scope.selectedState = selectedState || $scope.stateList[3];
        $scope.loadArmyListForTurnState();
    });

    rulesCatalogFactory.getRefTerrain().then(function (terrainList) {
        $scope.terrainList = terrainList;
    });

    $scope.saveTSFormFederations = function () {
        turnSheetFactory.postTSRecords($scope.tsFormFederationsList, 'FormFederations').then(function (returnTsFormFederationsList) {
            $scope.tsFormFederationsList = $scope.normalizeFormFederationRows(returnTsFormFederationsList);
            alert('Turnsheet form federations saved and Excel federation section updated successfully.');
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            alert('Form federations save failed.' + (detail ? ' ' + detail : ''));
        });
    }

    $scope.saveTSMovement = function () {
        turnSheetFactory.postTSRecords($scope.tsMovementList, 'Movement').then(function (returnTsMovementList) {
            $scope.tsMovementList = returnTsMovementList;
            alert('Turnsheet movement saved and Excel movement section updated successfully.');
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            alert('Movement save failed.' + (detail ? ' ' + detail : ''));
        });
    }

    $scope.saveTSBuildProductionSites = function () {
        turnSheetFactory.postTSRecords($scope.tsBuildProductionSitesList, 'BuildProductionSites').then(function (returnTsBuildProductionSitesList) {
            $scope.tsBuildProductionSitesList = (returnTsBuildProductionSitesList || []).map(function (row) {
                row.orderNo = row.orderNo != null ? row.orderNo : row.OrderNo;
                row.prodSiteType = row.prodSiteType != null ? row.prodSiteType : row.ProdSiteType;
                row.x = row.x != null ? row.x : row.X;
                row.y = row.y != null ? row.y : row.Y;

                row.OrderNo = row.orderNo;
                row.ProdSiteType = row.prodSiteType;
                row.X = row.x;
                row.Y = row.y;

                return row;
            });
            alert('Turnsheet production site records saved and Excel production site section updated successfully.');
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            alert('Production site save failed.' + (detail ? ' ' + detail : ''));
        });
    }

    $scope.rhsColWidth = "col-md-12";

    $scope.mapChoice = [{ mapName: 'Europe Full', mapId: 'E', rangeMinX: 1, rangeMaxX: 80, minX: 1, maxX: 80, rangeMinY: 1, rangeMaxY: 65, minY: 1, maxY: 65 },
                        { mapName: 'Europe West', mapId: 'EW', rangeMinX: 1, rangeMaxX: 40, minX: 1, maxX: 40, rangeMinY: 1, rangeMaxY: 65, minY: 20, maxY: 65 },
                        { mapName: 'Europe East', mapId: 'EE', rangeMinX: 41, rangeMaxX: 80, minX: 41, maxX: 80, rangeMinY: 1, rangeMaxY: 65, minY: 1, maxY: 65 },
                        { mapName: 'Caribbean', mapId: 'C', rangeMinX: 1, rangeMaxX: 40, minX: 1, maxX: 40, rangeMinY: 70, rangeMaxY: 99, minY: 70, maxY: 99 },
                        { mapName: 'India', mapId: 'I', rangeMinX: 51, rangeMaxX: 90, minX: 51, maxX: 90, rangeMinY: 70, rangeMaxY: 99, minY: 70, maxY: 99 }
    ];
    $scope.selectedMapChoice = $scope.mapChoice[1];

    $scope.mapOptions = ['State', 'Population', 'ProductionSite', 'Owner', 'Terrain', 'Bonus'];
    $scope.selectedMapOptions = ['State', 'Population', 'ProductionSite'];

    $scope.displayOptions = [{ name: 'Terrain', state: false, population: false, productionSite: false, owner: false, terrain: true, bonus: true },
                             { name: 'State', state: true, population: true, productionSite: true, owner: false, terrain: false, bonus: false },
                             { name: 'ProductionSite', state: false, population: false, productionSite: true, owner: false, terrain: true, bonus: true },
                             { name: 'SetUpBrigades', state: true, population: true, productionSite: true, owner: false, terrain: false, bonus: false },
                             { name: 'FormFederation', state: true, population: true, productionSite: true, owner: false, terrain: false, bonus: false },
                             { name: 'Movement', state: true, population: true, productionSite: true, owner: false, terrain: false, bonus: false }];
    $scope.selectedDisplayOption = $scope.displayOptions[5];

    $scope.changeDisplayOption = function () {
        var selectedOptions = [];

        if ($scope.selectedDisplayOption.state) selectedOptions.push('State');
        if ($scope.selectedDisplayOption.population) selectedOptions.push('Population');
        if ($scope.selectedDisplayOption.productionSite) selectedOptions.push('ProductionSite');
        if ($scope.selectedDisplayOption.owner) selectedOptions.push('Owner');
        if ($scope.selectedDisplayOption.terrain) selectedOptions.push('Terrain');
        if ($scope.selectedDisplayOption.bonus) selectedOptions.push('Bonus');

        $scope.selectedMapOptions = selectedOptions;

        $scope.selectedItemGridCoordinate = null;
        $scope.refreshItemGridRows();

        if ($scope.isSetUpBrigadesMode()) {
            $scope.loadArmyListForTurnState();
        }
    };

    $scope.$watch('selectedMapChoice.mapId', function () {
        if ($scope.isSetUpBrigadesMode()) {
            $scope.loadArmyListForTurnState();
        }
    });

    $scope.isProductionSiteMode = function () {
        return $scope.selectedDisplayOption && $scope.selectedDisplayOption.name === 'ProductionSite';
    };

    $scope.isFormFederationMode = function () {
        return $scope.selectedDisplayOption && $scope.selectedDisplayOption.name === 'FormFederation';
    };

    $scope.isSetUpBrigadesMode = function () {
        return $scope.selectedDisplayOption && $scope.selectedDisplayOption.name === 'SetUpBrigades';
    };

    $scope.toggleSelection = function toggleSelection(mapOption) {
        var idx = $scope.selectedMapOptions.indexOf(mapOption);

        // is currently selected
        if (idx > -1)
            $scope.selectedMapOptions.splice(idx, 1);
        else
            $scope.selectedMapOptions.push(mapOption);
    };

    $scope.pendingDepotSourceItemNo = null;
    $scope.selectedArmyListItem = null;

    $scope.getDepotSourceItemNoAtCoordinate = function (x, y) {
        if (!$scope.masterData || !$scope.masterData.turnReport) {
            return null;
        }

        var barracks = $scope.masterData.turnReport.barracks || $scope.masterData.turnReport.Barracks || [];
        for (var i = 0; i < barracks.length; i++) {
            if (barracks[i].x == x && barracks[i].y == y) {
                return barracks[i].itemNo || barracks[i].ItemNo;
            }
            if (barracks[i].X == x && barracks[i].Y == y) {
                return barracks[i].ItemNo || barracks[i].itemNo;
            }
        }

        var ports = $scope.masterData.turnReport.tradingPortsAndCities || $scope.masterData.turnReport.TradingPortsAndCities || [];
        for (var j = 0; j < ports.length; j++) {
            if ((ports[j].x == x && ports[j].y == y) || (ports[j].X == x && ports[j].Y == y)) {
                return ports[j].itemNo || ports[j].ItemNo;
            }
        }

        return null;
    };

    $scope.coordinateClick = function (x, y) {
        if ($scope.pendingRouteSelection) {
            var routeKey = x + '_' + y;
            var selectedRoute = $scope.pendingRouteSelection.routesByCoord[routeKey];
            var movementRow = $scope.pendingRouteSelection.row;

            if (selectedRoute) {
                $scope.applyRouteToMovementRow(movementRow, selectedRoute.segments);
            }

            $scope.pendingRouteSelection = null;
            $scope.clearRouteCandidates();

            if (selectedRoute) {
                $scope.movementClickRow({ entity: movementRow });
            }
        }

        if ($scope.isSetUpBrigadesMode()) {
            var depotSourceNo = $scope.getDepotSourceItemNoAtCoordinate(x, y);
            if (depotSourceNo) {
                $scope.pendingDepotSourceItemNo = depotSourceNo;
            }
        }

        var coord = $scope.getCoordinateByXY(x, y);
        $scope.selectedCoordinateDetails = "(X:" + x + ",Y: " + y + ") " + coord.state + coord.population + coord.productionSite + " - " + coord.owner + coord.terrain + coord.bonus;
        $scope.selectedItemGridCoordinate = { x: x, y: y };
        $scope.refreshItemGridRows();
    }

    $scope.coordinateDblClick = function (x, y) {
        if ($scope.isProductionSiteMode()) {
            var prodCoord = $scope.getCoordinateByXY(x, y);
            if (!prodCoord) {
                return;
            }

            $scope.selectedCoordinateDetails = "(X:" + x + ",Y: " + y + ") " + prodCoord.state + prodCoord.population + prodCoord.productionSite + " - " + prodCoord.owner + prodCoord.terrain + prodCoord.bonus;

            var productionSiteClass = $scope.defineCoordClass(
                prodCoord.terrain,
                prodCoord.state,
                prodCoord.population,
                prodCoord.productionSite,
                prodCoord.bonus,
                prodCoord.displayField,
                prodCoord.units,
                prodCoord.x,
                prodCoord.y,
                prodCoord.routeCandidate,
                prodCoord.jumpOffText
            );
            productionSiteClass = (productionSiteClass || '').split(' ')[0];

            if (!$scope.canAddProductionSiteAtCoordinate(prodCoord, productionSiteClass)) {
                return;
            }

            $scope.addOrUpdateProductionSiteRecord(x, y, productionSiteClass);
            return;
        }

        if ($scope.selectedMovementItemCoordinate
            && $scope.selectedMovementRow
            && $scope.selectedMovementItemCoordinate.x == x
            && $scope.selectedMovementItemCoordinate.y == y) {
            $scope.selectedMovementRow.direction1 = null;
            $scope.selectedMovementRow.distance1 = null;
            $scope.selectedMovementRow.direction2 = null;
            $scope.selectedMovementRow.distance2 = null;
            $scope.selectedMovementRow.direction3 = null;
            $scope.selectedMovementRow.distance3 = null;
            $scope.selectedMovementRow.mpUsed = 0;

            $scope.clearDisplayField();
            $scope.clearRouteCandidates();
            $scope.pendingRouteSelection = null;
            return;
        }

        var startCoord = $scope.getCoordinateByXY(x, y);
        $scope.selectedCoordinateDetails = "(X:" + x + ",Y: " + y + ") " + startCoord.state + startCoord.population + startCoord.productionSite + " - " + startCoord.owner + startCoord.terrain + startCoord.bonus;
        $scope.selectedItemGridCoordinate = { x: x, y: y };
        $scope.refreshItemGridRows();

        var maxDistance = 32;

        for (var dir = 1; dir < 9; dir++) {
            $scope.getCoordinatesInADirection(dir, startCoord, maxDistance);
        }
    }


    $scope.movementClickRow = function (row) {
        $scope.clearDisplayField();
        $scope.clearRouteCandidates();
        $scope.pendingRouteSelection = null;
        $scope.selectedMovementItemCoordinate = null;

        if (row.entity.itemNo != null) {
            var selectedItem = $scope.getItemFromItemNo(row.entity.itemNo); // could be any moveable item
            var item = {
                itemNo: selectedItem.itemNo,
                mpUsed: 0,
                mp: selectedItem.mp,
                x: selectedItem.x,
                y: selectedItem.y,
                itemType: selectedItem.itemType,
                itemTypeName: selectedItem.itemTypeName,
                shipTypeNo: selectedItem.shipTypeNo
            };

            var initialCoord = $scope.getCoordinateByXY(item.x, item.y); // get from the item

            if (initialCoord != null) {
                $scope.selectedMovementRow = row.entity;
                $scope.selectedMovementItemCoordinate = { x: item.x, y: item.y };
                row.entity.type = $scope.getItemTypeAbbrev(selectedItem);
                row.entity.mp = item.mp;

                initialCoord.displayField = 'moveStart';

                if (row.entity.direction1 > 0 && row.entity.distance1 > 0) {
                    var beginCoordinate = $scope.getCoordinatesInADirection(row.entity.direction1, row.entity.distance1, initialCoord, item, 'moveDir1');

                    if (row.entity.direction2 > 0 && row.entity.distance2 > 0) {
                        beginCoordinate = $scope.getCoordinatesInADirection(row.entity.direction2, row.entity.distance2, beginCoordinate, item, 'moveDir2');

                        if (row.entity.direction3 > 0 && row.entity.distance3 > 0) {
                            beginCoordinate = $scope.getCoordinatesInADirection(row.entity.direction3, row.entity.distance3, beginCoordinate, item, 'moveDir3');
                        }
                    }
                } else {
                    if (!item.x || !item.y || item.x <= 0 || item.y <= 0) {
                        $scope.selectedCoordinateDetails = 'Selected unit has no valid map coordinate (possibly boarded).';
                        return;
                    }

                    var routesByCoord = $scope.calculateReachableRoutes(initialCoord, selectedItem);
                    if (Object.keys(routesByCoord).length === 0) {
                        $scope.selectedCoordinateDetails = 'No reachable coordinates found for this unit with current movement allowance.';
                        return;
                    }

                    $scope.markRouteCandidates(routesByCoord);
                    $scope.pendingRouteSelection = { row: row.entity, routesByCoord: routesByCoord };
                }

                row.entity.mpUsed = item.mpUsed;
                row.entity.xy = item.x + '/' + item.y;
                row.entity.mp = item.mp;
            }
        }
    }

    $scope.applyRouteToMovementRow = function (movementRow, segments) {
        movementRow.direction1 = null;
        movementRow.distance1 = null;
        movementRow.direction2 = null;
        movementRow.distance2 = null;
        movementRow.direction3 = null;
        movementRow.distance3 = null;

        if (segments && segments.length > 0) {
            movementRow.direction1 = segments[0].dir;
            movementRow.distance1 = segments[0].dist;
        }
        if (segments && segments.length > 1) {
            movementRow.direction2 = segments[1].dir;
            movementRow.distance2 = segments[1].dist;
        }
        if (segments && segments.length > 2) {
            movementRow.direction3 = segments[2].dir;
            movementRow.distance3 = segments[2].dist;
        }
    };

    $scope.getSelectedProductionSiteTypeNo = function () {
        if (!$scope.selectedProductionSite) {
            return null;
        }

        var selectedTypeNo = $scope.selectedProductionSite.siteTypeNo;
        if (selectedTypeNo == null) {
            selectedTypeNo = $scope.selectedProductionSite.sitezTypeNo;
        }

        var parsed = parseInt(selectedTypeNo, 10);
        return isNaN(parsed) ? null : parsed;
    };

    $scope.getProductionSiteEligibilityClass = function (coord) {
        if (!coord || !$scope.selectedProductionSite) {
            return '';
        }

        var coordState = (coord.state || '').toString();
        var coordTerrain = (coord.terrain || '').toString();
        var coordProdSite = (coord.productionSite || '').toString();
        var coordBonus = (coord.bonus || '').toString();
        var coordPopulation = parseInt(coord.population, 10);
        var minPopulation = parseInt($scope.selectedProductionSite.minPopulation, 10);
        var maxPopulation = parseInt($scope.selectedProductionSite.maxPopulation, 10);
        var selectedSiteTypeNo = ($scope.selectedProductionSite.siteTypeNo || $scope.selectedProductionSite.sitezTypeNo || '').toString();
        var selectedStateCode = $scope.selectedState ? ($scope.selectedState.state || $scope.selectedState.State || '') : '';

        if (isNaN(coordPopulation)) coordPopulation = 0;
        if (isNaN(minPopulation)) minPopulation = 0;
        if (isNaN(maxPopulation)) maxPopulation = 0;

        if ($scope.selectedState != null && coordState != selectedStateCode) {
            return '';
        }

        if (".+*".indexOf(coordTerrain) > -1) {
            return 'terrain_sea';
        }

        if ($scope.selectedProductionSite.bonusSymbol == coordBonus) {
            if (coordProdSite.trim().length > 0) return 'prodSite_Existing';
            if (coordPopulation < minPopulation) return 'prodSite_TooFew';
            if (coordPopulation > maxPopulation) return 'prodSite_TooMany';
            return 'prodSite_Yes';
        }

        if (($scope.selectedProductionSite.terrain || '').indexOf(coordTerrain) > -1) {
            if (coordPopulation < minPopulation) return 'prodSite_TooFew';
            if (coordPopulation > maxPopulation) return 'prodSite_TooMany';

            if (selectedSiteTypeNo == "1") {
                if (coordProdSite.trim().length > 0)
                    return 'prodSite_Yes';
                return ' ';
            }

            if (coordProdSite.trim().length > 0) return 'prodSite_Existing';
            return 'prodSite_Yes';
        }

        if (selectedSiteTypeNo == "21") {
            if (coordProdSite.trim().length > 0 && ($scope.selectedProductionSite.terrain || '').indexOf(coordProdSite) > -1)
                return 'prodSite_Yes';
            return ' ';
        }

        return '';
    };

    $scope.isAllowedProductionSiteClass = function (productionSiteClass) {
        var className = (productionSiteClass || '').toString().trim();
        if (!className) {
            return false;
        }

        if (className === 'terrain_sea') {
            return false;
        }

        return className.indexOf('prodSite_') === 0;
    };

    $scope.canAddProductionSiteAtCoordinate = function (coord, productionSiteClass) {
        var coordClass = productionSiteClass || $scope.getProductionSiteEligibilityClass(coord);
        return $scope.isAllowedProductionSiteClass(coordClass);
    };

    $scope.getProductionSiteRowTypeNo = function (row) {
        var rowTypeNo = row.prodSiteType != null ? row.prodSiteType : row.ProdSiteType;
        var parsed = parseInt(rowTypeNo, 10);
        return isNaN(parsed) ? null : parsed;
    };

    $scope.setProductionSiteRowValues = function (row, prodSiteTypeNo, x, y, productionSiteClass) {
        row.prodSiteType = prodSiteTypeNo;
        row.ProdSiteType = prodSiteTypeNo;
        row.x = x;
        row.X = x;
        row.y = y;
        row.Y = y;
        row.prodSiteStatusClass = productionSiteClass || '';
    };

    $scope.addOrUpdateProductionSiteRecord = function (x, y, productionSiteClass) {
        if (!$scope.tsBuildProductionSitesList) {
            return;
        }

        var prodSiteTypeNo = $scope.getSelectedProductionSiteTypeNo();
        if (prodSiteTypeNo == null) {
            return;
        }

        var rowsAtCoord = [];
        angular.forEach($scope.tsBuildProductionSitesList, function (row) {
            var rowX = row.x != null ? row.x : row.X;
            var rowY = row.y != null ? row.y : row.Y;

            if (rowX == x && rowY == y) {
                rowsAtCoord.push(row);
            }
        });

        var selectedTypeRow = null;
        angular.forEach(rowsAtCoord, function (row) {
            if (!selectedTypeRow && $scope.getProductionSiteRowTypeNo(row) === prodSiteTypeNo) {
                selectedTypeRow = row;
            }
        });

        if (selectedTypeRow) {
            $scope.setProductionSiteRowValues(selectedTypeRow, prodSiteTypeNo, x, y, productionSiteClass);
            return;
        }

        var hasDemolitionRow = rowsAtCoord.some(function (row) {
            return $scope.getProductionSiteRowTypeNo(row) === 1;
        });

        var canAddSecondRow = rowsAtCoord.length < 2 && (prodSiteTypeNo === 1 || hasDemolitionRow);

        if (!canAddSecondRow && rowsAtCoord.length > 0) {
            var rowToUpdate = rowsAtCoord[0];
            angular.forEach(rowsAtCoord, function (row) {
                if ($scope.getProductionSiteRowTypeNo(row) !== 1) {
                    rowToUpdate = row;
                }
            });

            $scope.setProductionSiteRowValues(rowToUpdate, prodSiteTypeNo, x, y, productionSiteClass);
            return;
        }

        var firstAvailableRow = null;
        angular.forEach($scope.tsBuildProductionSitesList, function (row) {
            if (firstAvailableRow) {
                return;
            }

            var rowX = row.x != null ? row.x : row.X;
            var rowY = row.y != null ? row.y : row.Y;
            if ((rowX == null || rowX === '') && (rowY == null || rowY === '')) {
                firstAvailableRow = row;
            }
        });

        if (firstAvailableRow) {
            $scope.setProductionSiteRowValues(firstAvailableRow, prodSiteTypeNo, x, y, productionSiteClass);
        }
    };

    $scope.getProductionSiteRowClass = function (row) {
        if (!row) {
            return '';
        }

        var rowClass = row.prodSiteStatusClass || '';
        return $scope.isAllowedProductionSiteClass(rowClass) ? rowClass : '';
    };

    $scope.clearRouteCandidates = function () {
        if (!$scope.mapCoordinates) return;

        angular.forEach($scope.mapCoordinates, function (mapRow) {
            angular.forEach(mapRow, function (coordinate) {
                coordinate.routeCandidate = false;
            });
        });
    };

    $scope.markRouteCandidates = function (routesByCoord) {
        $scope.clearRouteCandidates();

        angular.forEach(routesByCoord, function (route) {
            if ($scope.mapCoordinates[route.y] && $scope.mapCoordinates[route.y][route.x]) {
                $scope.mapCoordinates[route.y][route.x].routeCandidate = true;
            }
        });
    };

    $scope.calculateReachableRoutes = function (startCoord, selectedItem) {
        var routesByCoord = {};

        var recordRoute = function (coord, segments, usedMp) {
            if (!coord || segments.length === 0 || segments.length > 3) return;

            var key = coord.x + '_' + coord.y;
            var existing = routesByCoord[key];

            if (!existing || usedMp < existing.usedMp || (usedMp === existing.usedMp && segments.length < existing.segments.length)) {
                routesByCoord[key] = {
                    x: coord.x,
                    y: coord.y,
                    usedMp: usedMp,
                    segments: segments.map(function (s) { return { dir: s.dir, dist: s.dist }; })
                };
            }
        };

        var explore = function (fromCoord, remainingMp, usedMp, segments) {
            if (segments.length >= 3 || remainingMp <= 0) {
                return;
            }

            for (var dir = 1; dir <= 8; dir++) {
                var currentCoord = fromCoord;
                var segmentDistance = 0;
                var segmentCost = 0;

                while (true) {
                    var nextCoord = $scope.getNextCoordinate(dir, currentCoord);
                    if (!nextCoord || !$scope.isCoordInSelectedMap(nextCoord)) {
                        break;
                    }

                    var moveCost = $scope.getTerrainMPForItem(nextCoord, selectedItem);
                    if (moveCost <= 0 || segmentCost + moveCost > remainingMp) {
                        break;
                    }

                    segmentDistance++;
                    segmentCost += moveCost;
                    currentCoord = nextCoord;

                    var nextSegments = segments.concat([{ dir: dir, dist: segmentDistance }]);
                    var nextUsedMp = usedMp + segmentCost;

                    recordRoute(currentCoord, nextSegments, nextUsedMp);
                    explore(currentCoord, remainingMp - segmentCost, nextUsedMp, nextSegments);
                }
            }
        };

        explore(startCoord, selectedItem.mp || 0, 0, []);
        return routesByCoord;
    };

    $scope.isCoordInSelectedMap = function (coord) {
        if (!coord || !$scope.selectedMapChoice) return false;

        return coord.x >= $scope.selectedMapChoice.rangeMinX
            && coord.x <= $scope.selectedMapChoice.rangeMaxX
            && coord.y >= $scope.selectedMapChoice.rangeMinY
            && coord.y <= $scope.selectedMapChoice.rangeMaxY;
    };

    $scope.getCurrentTurnState = function () {
        if (!$scope.masterData) return '';

        var tsTurnDetails = ($scope.masterData.turnSheet && ($scope.masterData.turnSheet.tSTurnDetails || $scope.masterData.turnSheet.TSTurnDetails)) || null;
        if (tsTurnDetails && tsTurnDetails.length > 0) {
            return tsTurnDetails[0].state || tsTurnDetails[0].State || '';
        }

        if ($scope.masterData.turnId && $scope.masterData.turnId.length >= 4) {
            return $scope.masterData.turnId.substr(3, 1);
        }

        return '';
    };

    $scope.getRouteCandidateClass = function (coordState) {
        var ownState = ($scope.getCurrentTurnState() || '').toString().trim().toUpperCase();
        var targetState = (coordState || '').toString().trim().toUpperCase();

        if (!targetState || targetState === '?') {
            return 'routeCandidateNeutral';
        }

        if (ownState && targetState === ownState) {
            return 'routeCandidateOwn';
        }

        return 'routeCandidateEnemy';
    };

    $scope.isColonialCoordinate = function (coord) {
        if (!coord || coord.y == null) return false;

        return parseInt(coord.y) >= 70;
    };

    $scope.isShipItem = function (item) {
        if (!item) return false;

        var itemTypeName = item.itemTypeName || $scope.getItemTypeName(item.itemType);
        return itemTypeName === 'Warship' || itemTypeName === 'MerchantShip';
    };

    $scope.isShipyardCoordinate = function (coord) {
        if (!coord || !coord.productionSite) return false;

        var site = coord.productionSite.toString().toUpperCase();
        return site === '&' || site === '$';
    };
    $scope.getTerrainMPForItem = function (coord, item) {
        var terrain = coord.terrain;
        var isSea = '*+.'.indexOf(terrain) > -1;
        var isShip = $scope.isShipItem(item);
        var moveCost = 0;

        if (isShip) {
            if (isSea || $scope.isShipyardCoordinate(coord)) {
                moveCost = 1;
            } else {
                return 999;
            }
        } else {
            if (isSea) {
                return 999;
            }

            moveCost = $scope.getTerrainMP(terrain);
        }

        if ($scope.isColonialCoordinate(coord) && moveCost > 0 && moveCost < 999) {
            moveCost = moveCost * 2;
        }

        return moveCost;
    };

    $scope.getItemFromItemNo = function (itemNo) {
        var rtnItem = {};
        var parsedItemNo = parseInt(itemNo, 10);

        angular.forEach($scope.masterData.turnReport.movementItemList, function (item, index) {
            var originalItemNo = item.originalItemNo != null ? item.originalItemNo : item.OriginalItemNo;
            if (originalItemNo == parsedItemNo) {
                rtnItem = item;
                return;
            }
        });

        if (!rtnItem || rtnItem.itemNo == null) {
            angular.forEach($scope.masterData.turnReport.movementItemList, function (item, index) {
                var memberMatch = item.memberItemNos && item.memberItemNos.indexOf(parsedItemNo) > -1;
                if (item.itemNo == parsedItemNo || item.ItemNo == parsedItemNo || memberMatch)
                    rtnItem = item;
            });
        }

        if (!rtnItem || rtnItem.itemNo == null) {
            rtnItem = $scope.getFederationMovementSummary(itemNo);
        }

        return rtnItem;
    }

    $scope.getFederationMovementSummary = function (federationNo) {
        if (!$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
            return {};
        }

        var parsedFederationNo = parseInt(federationNo, 10);
        if (isNaN(parsedFederationNo)) {
            return {};
        }

        var federationItems = $scope.masterData.turnReport.movementItemList.filter(function (item) {
            var itemFedNo = item.federationNo != null ? item.federationNo : item.FederationNo;
            return itemFedNo == parsedFederationNo;
        });

        if (!federationItems.length) {
            return {};
        }

        var slowestItem = federationItems[0];
        angular.forEach(federationItems, function (item) {
            var itemMp = item.originalMP != null ? item.originalMP : item.mp;
            var slowestMp = slowestItem.originalMP != null ? slowestItem.originalMP : slowestItem.mp;
            if (itemMp < slowestMp) {
                slowestItem = item;
            }
        });

        return {
            itemNo: parsedFederationNo,
            itemTypeName: 'Federation',
            itemType: slowestItem.itemType,
            shipTypeNo: slowestItem.shipTypeNo,
            mp: slowestItem.originalMP != null ? slowestItem.originalMP : slowestItem.mp,
            x: slowestItem.x,
            y: slowestItem.y,
            federationNo: parsedFederationNo,
            isFederation: true
        };
    };

    $scope.refreshMovementGridTypeValues = function () {
        if (!$scope.tsMovementList || !$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
            return;
        }

        angular.forEach($scope.tsMovementList, function (movementRow) {
            if (movementRow.itemNo != null) {
                var selectedItem = $scope.getItemFromItemNo(movementRow.itemNo);
                if (selectedItem && selectedItem.itemNo != null) {
                    movementRow.type = $scope.getItemTypeAbbrev(selectedItem);
                }
            }
        });
    };

    $scope.filterMovementItemBySelectedMap = function (item) {
        if (!item || !$scope.selectedMapChoice) return false;

        return item.x >= $scope.selectedMapChoice.rangeMinX
            && item.x <= $scope.selectedMapChoice.rangeMaxX
            && item.y >= $scope.selectedMapChoice.rangeMinY
            && item.y <= $scope.selectedMapChoice.rangeMaxY;
    }

    $scope.refreshFilteredMovementItemsForMap = function () {
        if (!$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
            $scope.filteredMovementItemsForMap = [];
            $scope.itemGridRows = [];
            return;
        }

        $scope.filteredMovementItemsForMap = $scope.masterData.turnReport.movementItemList
            .filter(function (item) {
                return $scope.filterMovementItemBySelectedMap(item);
            })
            .map(function (item) {
                var originalItemNo = item.originalItemNo != null ? item.originalItemNo : item.OriginalItemNo;
                var itemNo = originalItemNo != null ? originalItemNo : (item.itemNo != null ? item.itemNo : item.ItemNo);
                var x = item.x != null ? item.x : item.X;
                var y = item.y != null ? item.y : item.Y;

                return {
                    itemNo: itemNo,
                    originalItemNo: itemNo,
                    fed: item.federationNo != null ? item.federationNo : item.FederationNo,
                    itemType: item.itemType != null ? item.itemType : item.ItemType,
                    shipTypeNo: item.shipTypeNo != null ? item.shipTypeNo : item.ShipTypeNo,
                    itemTypeName: $scope.getItemTypeAbbrev(item),
                    description: item.description || item.Description,
                    mp: item.originalMP != null ? item.originalMP : (item.OriginalMP != null ? item.OriginalMP : item.mp),
                    x: x,
                    y: y,
                    xy: x + '/' + y
                };
            })
            .sort(function (a, b) {
                var fedA = a.fed != null ? a.fed : 999999;
                var fedB = b.fed != null ? b.fed : 999999;

                if (fedA !== fedB) return fedA - fedB;
                return a.itemNo - b.itemNo;
            });

        $scope.refreshItemGridRows();
    };

    $scope.refreshItemGridRows = function () {
        if ($scope.isFormFederationMode()) {
            var federationCandidates = $scope.getFormFederationCandidateItems();

            if ($scope.selectedItemGridCoordinate) {
                var selectedCoordItems = federationCandidates.filter(function (item) {
                    return item.x == $scope.selectedItemGridCoordinate.x && item.y == $scope.selectedItemGridCoordinate.y;
                });

                $scope.itemGridRows = selectedCoordItems.length > 0 ? selectedCoordItems : federationCandidates;
                return;
            }

            $scope.itemGridRows = federationCandidates;
            return;
        }

        if (!$scope.filteredMovementItemsForMap) {
            $scope.itemGridRows = [];
            return;
        }

        var sphereList = $scope.filteredMovementItemsForMap;

        if ($scope.selectedItemGridCoordinate) {
            var selectedCoordItems = sphereList.filter(function (item) {
                return item.x == $scope.selectedItemGridCoordinate.x && item.y == $scope.selectedItemGridCoordinate.y;
            });

            $scope.itemGridRows = selectedCoordItems.length > 0 ? selectedCoordItems : sphereList;
            return;
        }

        $scope.itemGridRows = sphereList;
    };

    $scope.isFederationColumnClick = function (col) {
        if (!col) {
            return false;
        }

        var fieldName = col.field || (col.colDef && col.colDef.field) || '';
        return fieldName === 'fed';
    };

    $scope.itemGridClickRow = function (row, col) {
        var clickedFederationColumn = $scope.isFederationColumnClick(col);

        if ($scope.isFormFederationMode()) {
            $scope.addItemToFormFederationGrid(row, clickedFederationColumn);
            return;
        }

        if (!row || !row.entity || !row.entity.itemNo || !$scope.tsMovementList) {
            return;
        }

        var selectedItemNo = row.entity.originalItemNo != null ? row.entity.originalItemNo : row.entity.itemNo;
        var selectedType = row.entity.itemTypeName;
        var selectedMp = row.entity.mp;
        var selectedXy = row.entity.xy;

        if (clickedFederationColumn && row.entity.fed != null && row.entity.fed !== '') {
            selectedItemNo = row.entity.fed;
            selectedType = 'Fed';

            var federationSummary = $scope.getFederationMovementSummary(row.entity.fed);
            if (!federationSummary || federationSummary.itemNo == null) {
                return;
            }

            selectedMp = federationSummary.mp;
            selectedXy = federationSummary.x + '/' + federationSummary.y;
        }

        var alreadyExists = $scope.tsMovementList.some(function (movementRow) {
            return movementRow.itemNo == selectedItemNo;
        });

        if (alreadyExists) {
            return;
        }

        var firstAvailableRow = null;
        angular.forEach($scope.tsMovementList, function (movementRow) {
            if (firstAvailableRow == null && (movementRow.itemNo == null || movementRow.itemNo === '')) {
                firstAvailableRow = movementRow;
            }
        });

        if (firstAvailableRow != null) {
            firstAvailableRow.itemNo = selectedItemNo;
            firstAvailableRow.type = selectedType;
            firstAvailableRow.mp = selectedMp;
            firstAvailableRow.mpUsed = 0;
            firstAvailableRow.xy = selectedXy;
            $scope.queueAutoSaveTsGrid('Movement');
        }
    };

    $scope.isItemAlreadyInMovementGrid = function (itemNo) {
        if ($scope.isFormFederationMode()) {
            return $scope.isItemAlreadyInFormFederationGrid(itemNo);
        }

        if (!itemNo || !$scope.tsMovementList) {
            return false;
        }

        return $scope.tsMovementList.some(function (movementRow) {
            return movementRow.itemNo == itemNo;
        });
    };

    $scope.isValueAlreadyUsedInMovementOrFormFederation = function (itemOrFedNo) {
        if (itemOrFedNo == null || itemOrFedNo === '') {
            return false;
        }

        var inMovement = $scope.tsMovementList && $scope.tsMovementList.some(function (movementRow) {
            return movementRow.itemNo == itemOrFedNo;
        });

        if (inMovement) {
            return true;
        }

        var inFormFederation = $scope.tsFormFederationsList && $scope.tsFormFederationsList.some(function (row) {
            var rowItemNo = row.itemNo != null ? row.itemNo : row.ItemNo;
            return rowItemNo == itemOrFedNo;
        });

        return !!inFormFederation;
    };

    $scope.getCurrentStateCode = function () {
        return ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : '').toString().trim().toUpperCase();
    };

    $scope.isSeaItemType = function (item) {
        if (!item) return false;

        var typeName = $scope.getItemTypeName(item.itemType);
        if (!typeName && item.itemTypeName) {
            typeName = item.itemTypeName;
        }

        return typeName === 'Warship' || typeName === 'MerchantShip';
    };

    $scope.isFederationEligibleItem = function (item) {
        if (!item) return false;

        var typeName = $scope.getItemTypeName(item.itemType);
        if (!typeName && item.itemTypeName) {
            typeName = item.itemTypeName;
        }

        return typeName === 'Commander'
            || typeName === 'Brigade'
            || typeName === 'BaggageTrain'
            || typeName === 'Warship'
            || typeName === 'MerchantShip';
    };

    $scope.getFormFederationCandidateItems = function () {
        if (!$scope.filteredMovementItemsForMap || !$scope.mapCoordinates) {
            return [];
        }

        var currentStateCode = $scope.getCurrentStateCode();

        return $scope.filteredMovementItemsForMap.filter(function (item) {
            if (!item || item.itemNo == null) {
                return false;
            }

            if (!$scope.isFederationEligibleItem(item)) {
                return false;
            }

            var coord = $scope.getCoordinateByXY(item.x, item.y);
            if (!coord) {
                return false;
            }

            var coordState = (coord.state || '').toString().trim().toUpperCase();
            return coordState === currentStateCode;
        });
    };

    $scope.isItemAlreadyInFormFederationGrid = function (itemNo) {
        if (!itemNo || !$scope.tsFormFederationsList) {
            return false;
        }

        return $scope.tsFormFederationsList.some(function (row) {
            var rowItemNo = row.itemNo != null ? row.itemNo : row.ItemNo;
            return rowItemNo == itemNo;
        });
    };

    $scope.getUsedFederationNumbers = function () {
        var used = {};

        if ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.movementItemList) {
            angular.forEach($scope.masterData.turnReport.movementItemList, function (item) {
                var federationNo = item.federationNo != null ? item.federationNo : item.FederationNo;
                if (federationNo != null && federationNo !== '') {
                    used[parseInt(federationNo, 10)] = true;
                }
            });
        }

        if ($scope.tsFormFederationsList) {
            angular.forEach($scope.tsFormFederationsList, function (row) {
                var federationNo = row.federation_Fleet != null ? row.federation_Fleet : row.Federation_Fleet;
                if (federationNo != null && federationNo !== '') {
                    used[parseInt(federationNo, 10)] = true;
                }
            });
        }

        return used;
    };

    $scope.getNextAvailableFederationNo = function (isSeaUnit) {
        var rangeStart = isSeaUnit ? 11 : 61;
        var rangeEnd = isSeaUnit ? 60 : 90;
        var used = $scope.getUsedFederationNumbers();

        for (var fedNo = rangeStart; fedNo <= rangeEnd; fedNo++) {
            if (!used[fedNo]) {
                return fedNo;
            }
        }

        return null;
    };

    $scope.getExistingFederationForCoordinateAndType = function (x, y, isSeaUnit) {
        if (!$scope.tsFormFederationsList || !$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
            return null;
        }

        for (var i = $scope.tsFormFederationsList.length - 1; i >= 0; i--) {
            var federationRow = $scope.tsFormFederationsList[i];
            var rowItemNo = federationRow.itemNo != null ? federationRow.itemNo : federationRow.ItemNo;
            var rowFederationNo = federationRow.federation_Fleet != null ? federationRow.federation_Fleet : federationRow.Federation_Fleet;

            if (rowItemNo == null || rowItemNo === '' || rowFederationNo == null || rowFederationNo === '') {
                continue;
            }

            var existingItem = $scope.getItemFromItemNo(rowItemNo);
            if (!existingItem || existingItem.itemNo == null) {
                continue;
            }

            if (existingItem.x == x
                && existingItem.y == y
                && $scope.isSeaItemType(existingItem) === isSeaUnit) {
                var parsedFed = parseInt(rowFederationNo, 10);
                return isNaN(parsedFed) ? null : parsedFed;
            }
        }

        return null;
    };

    $scope.addItemToFormFederationGrid = function (row, clickedFederationColumn) {
        if (!row || !row.entity || !row.entity.itemNo || !$scope.tsFormFederationsList) {
            return;
        }

        var sourceItemNo = row.entity.originalItemNo != null ? row.entity.originalItemNo : row.entity.itemNo;
        if (clickedFederationColumn && row.entity.fed != null && row.entity.fed !== '') {
            sourceItemNo = row.entity.fed;
        }

        if (!$scope.isFederationEligibleItem(row.entity)) {
            return;
        }

        if ($scope.isItemAlreadyInFormFederationGrid(sourceItemNo)) {
            alert('This unit/federation is already used in Form Federation grid.');
            return;
        }

        var isSeaUnit = $scope.isSeaItemType(row.entity);
        var federationNo = $scope.getExistingFederationForCoordinateAndType(row.entity.x, row.entity.y, isSeaUnit);

        if (federationNo == null) {
            federationNo = $scope.getNextAvailableFederationNo(isSeaUnit);
            if (federationNo == null) {
                alert(isSeaUnit ? 'No available fleet federation numbers (11-60).' : 'No available land federation numbers (61-90).');
                return;
            }
        }

        var firstAvailableRow = null;
        angular.forEach($scope.tsFormFederationsList, function (federationRow) {
            var existingItemNo = federationRow.itemNo != null ? federationRow.itemNo : federationRow.ItemNo;
            if (firstAvailableRow == null && (existingItemNo == null || existingItemNo === '')) {
                firstAvailableRow = federationRow;
            }
        });

        if (!firstAvailableRow) {
            alert('No empty TS_14 row is available.');
            return;
        }

        firstAvailableRow.itemNo = sourceItemNo;
        firstAvailableRow.ItemNo = sourceItemNo;
        firstAvailableRow.federation_Fleet = federationNo;
        firstAvailableRow.Federation_Fleet = federationNo;
    };

    $scope.getItemTypeName = function (itemType) {
        if (itemType === null || itemType === undefined) return '';

        if (typeof itemType === 'string') return itemType;

        switch (parseInt(itemType)) {
            case 0: return 'Commander';
            case 1: return 'Brigade';
            case 2: return 'Warship';
            case 3: return 'MerchantShip';
            case 4: return 'BaggageTrain';
            case 5: return 'Spy';
            default: return '';
        }
    };

    $scope.getItemTypeAbbrev = function (item) {
        if (!item) return '';

        var typeName = $scope.getItemTypeName(item.itemType);
        if (!typeName && (item.itemTypeName === 'Brigade' || item.itemTypeName === 'Commander' || item.itemTypeName === 'Warship' || item.itemTypeName === 'MerchantShip' || item.itemTypeName === 'BaggageTrain' || item.itemTypeName === 'Spy')) {
            typeName = item.itemTypeName;
        }

        switch (typeName) {
            case 'Brigade': return 'Bg';
            case 'Commander': return 'Cmd';
            case 'Warship': return item.shipTypeNo != null ? item.shipTypeNo.toString() : 'War';
            case 'Spy': return 'Spy';
            case 'BaggageTrain': return 'BagT';
            case 'MerchantShip': return item.shipTypeNo != null ? item.shipTypeNo.toString() : 'Mer';
            case 'Federation': return 'Fed';
            default: return typeName;
        }
    };

    $scope.getSelectedProductionSiteTypeNo = function () {
        if (!$scope.selectedProductionSite) {
            return null;
        }

        var selectedTypeNo = $scope.selectedProductionSite.siteTypeNo;
        if (selectedTypeNo == null) {
            selectedTypeNo = $scope.selectedProductionSite.sitezTypeNo;
        }

        var parsed = parseInt(selectedTypeNo, 10);
        return isNaN(parsed) ? null : parsed;
    };

    $scope.getProductionSiteEligibilityClass = function (coord) {
        if (!coord || !$scope.selectedProductionSite) {
            return '';
        }

        var coordState = (coord.state || '').toString();
        var coordTerrain = (coord.terrain || '').toString();
        var coordProdSite = (coord.productionSite || '').toString();
        var coordBonus = (coord.bonus || '').toString();
        var coordPopulation = parseInt(coord.population, 10);
        var minPopulation = parseInt($scope.selectedProductionSite.minPopulation, 10);
        var maxPopulation = parseInt($scope.selectedProductionSite.maxPopulation, 10);
        var selectedSiteTypeNo = ($scope.selectedProductionSite.siteTypeNo || $scope.selectedProductionSite.sitezTypeNo || '').toString();
        var selectedStateCode = $scope.selectedState ? ($scope.selectedState.state || $scope.selectedState.State || '') : '';

        if (isNaN(coordPopulation)) coordPopulation = 0;
        if (isNaN(minPopulation)) minPopulation = 0;
        if (isNaN(maxPopulation)) maxPopulation = 0;

        if ($scope.selectedState != null && coordState != selectedStateCode) {
            return '';
        }

        if (".+*".indexOf(coordTerrain) > -1) {
            return 'terrain_sea';
        }

        if ($scope.selectedProductionSite.bonusSymbol == coordBonus) {
            if (coordProdSite.trim().length > 0) return 'prodSite_Existing';
            if (coordPopulation < minPopulation) return 'prodSite_TooFew';
            if (coordPopulation > maxPopulation) return 'prodSite_TooMany';
            return 'prodSite_Yes';
        }

        if (($scope.selectedProductionSite.terrain || '').indexOf(coordTerrain) > -1) {
            if (coordPopulation < minPopulation) return 'prodSite_TooFew';
            if (coordPopulation > maxPopulation) return 'prodSite_TooMany';

            if (selectedSiteTypeNo == "1") {
                if (coordProdSite.trim().length > 0)
                    return 'prodSite_Yes';
                return ' ';
            }

            if (coordProdSite.trim().length > 0) return 'prodSite_Existing';
            return 'prodSite_Yes';
        }

        if (selectedSiteTypeNo == "21") {
            if (coordProdSite.trim().length > 0 && ($scope.selectedProductionSite.terrain || '').indexOf(coordProdSite) > -1)
                return 'prodSite_Yes';
            return ' ';
        }

        return '';
    };

    $scope.isAllowedProductionSiteClass = function (productionSiteClass) {
        var className = (productionSiteClass || '').toString().trim();
        if (!className) {
            return false;
        }

        if (className === 'terrain_sea') {
            return false;
        }

        return className.indexOf('prodSite_') === 0;
    };

    $scope.canAddProductionSiteAtCoordinate = function (coord, productionSiteClass) {
        var coordClass = productionSiteClass || $scope.getProductionSiteEligibilityClass(coord);
        return $scope.isAllowedProductionSiteClass(coordClass);
    };

    $scope.getProductionSiteRowTypeNo = function (row) {
        var rowTypeNo = row.prodSiteType != null ? row.prodSiteType : row.ProdSiteType;
        var parsed = parseInt(rowTypeNo, 10);
        return isNaN(parsed) ? null : parsed;
    };

    $scope.setProductionSiteRowValues = function (row, prodSiteTypeNo, x, y, productionSiteClass) {
        row.prodSiteType = prodSiteTypeNo;
        row.ProdSiteType = prodSiteTypeNo;
        row.x = x;
        row.X = x;
        row.y = y;
        row.Y = y;
        row.prodSiteStatusClass = productionSiteClass || '';
    };

    $scope.addOrUpdateProductionSiteRecord = function (x, y, productionSiteClass) {
        if (!$scope.tsBuildProductionSitesList) {
            return;
        }

        var prodSiteTypeNo = $scope.getSelectedProductionSiteTypeNo();
        if (prodSiteTypeNo == null) {
            return;
        }

        var rowsAtCoord = [];
        angular.forEach($scope.tsBuildProductionSitesList, function (row) {
            var rowX = row.x != null ? row.x : row.X;
            var rowY = row.y != null ? row.y : row.Y;

            if (rowX == x && rowY == y) {
                rowsAtCoord.push(row);
            }
        });

        var selectedTypeRow = null;
        angular.forEach(rowsAtCoord, function (row) {
            if (!selectedTypeRow && $scope.getProductionSiteRowTypeNo(row) === prodSiteTypeNo) {
                selectedTypeRow = row;
            }
        });

        if (selectedTypeRow) {
            $scope.setProductionSiteRowValues(selectedTypeRow, prodSiteTypeNo, x, y, productionSiteClass);
            $scope.queueAutoSaveTsGrid('BuildProductionSites');
            return;
        }

        var hasDemolitionRow = rowsAtCoord.some(function (row) {
            return $scope.getProductionSiteRowTypeNo(row) === 1;
        });

        var canAddSecondRow = rowsAtCoord.length < 2 && (prodSiteTypeNo === 1 || hasDemolitionRow);

        if (!canAddSecondRow && rowsAtCoord.length > 0) {
            var rowToUpdate = rowsAtCoord[0];
            angular.forEach(rowsAtCoord, function (row) {
                if ($scope.getProductionSiteRowTypeNo(row) !== 1) {
                    rowToUpdate = row;
                }
            });

            $scope.setProductionSiteRowValues(rowToUpdate, prodSiteTypeNo, x, y, productionSiteClass);
            $scope.queueAutoSaveTsGrid('BuildProductionSites');
            return;
        }

        var firstAvailableRow = null;
        angular.forEach($scope.tsBuildProductionSitesList, function (row) {
            if (firstAvailableRow) {
                return;
            }

            var rowX = row.x != null ? row.x : row.X;
            var rowY = row.y != null ? row.y : row.Y;
            if ((rowX == null || rowX === '') && (rowY == null || rowY === '')) {
                firstAvailableRow = row;
            }
        });

        if (firstAvailableRow) {
            $scope.setProductionSiteRowValues(firstAvailableRow, prodSiteTypeNo, x, y, productionSiteClass);
            $scope.queueAutoSaveTsGrid('BuildProductionSites');
        }
    };

    $scope.getProductionSiteRowClass = function (row) {
        if (!row) {
            return '';
        }

        var rowClass = row.prodSiteStatusClass || '';
        return $scope.isAllowedProductionSiteClass(rowClass) ? rowClass : '';
    };

    $scope.$watch('selectedMapChoice', function () {
        $scope.refreshFilteredMovementItemsForMap();
    }, true);

    $scope.$watch('masterData.turnReport.movementItemList', function () {
        $scope.refreshFilteredMovementItemsForMap();
        $scope.refreshMovementGridTypeValues();
    }, true);

    $scope.$watch('tsMovementList', function () {
        $scope.refreshMovementGridTypeValues();
    }, true);

    $scope.getCoordinatesInADirection = function (requiredDirection, requiredDistance, beginCoordinate, item, className) {
        var nextCoordinate = beginCoordinate;
        var travelledDistance = 0;
        var travelledMP = 0;

        while (travelledDistance < requiredDistance && nextCoordinate.x >= $scope.selectedMapChoice.rangeMinX && nextCoordinate.x <= $scope.selectedMapChoice.rangeMaxX && nextCoordinate.y >= $scope.selectedMapChoice.rangeMinY && nextCoordinate.y <= $scope.selectedMapChoice.rangeMaxY) {
            var nextCoordinate = $scope.getNextCoordinate(requiredDirection, nextCoordinate);
            var nextMoveCostMP = $scope.getTerrainMPForItem(nextCoordinate, item);

            //travelledMP = travelledMP + nextMoveCostMP;

            if (nextMoveCostMP <= (item.mp - item.mpUsed)) {
                nextCoordinate.displayField = className;
            } else {
                nextCoordinate.displayField = 'moveInvalid';
            }

            item.mpUsed = item.mpUsed + nextMoveCostMP;
            travelledDistance++;
        }

        return nextCoordinate;
    }

    $scope.clearDisplayField = function () {
        angular.forEach($scope.mapCoordinates, function (mapcol, index) {
            angular.forEach(mapcol, function (coordinate, index) {
                coordinate.displayField = '';
            });
        });
    }

    $scope.getTerrainMP = function (terrain) {
        var breakLoop = false;
        var rtnMP = 0;

        if ('*+.'.indexOf(terrain) > -1) return 99;

        angular.forEach($scope.terrainList, function (terrainItem, index) {
            if (!breakLoop && terrainItem.terrainId == terrain) {
                rtnMP = parseInt(terrainItem.mp);
                breakLoop = true;
            }
        });
        return rtnMP;
    };

    $scope.getNextCoordinate = function (dir, currentCoord) {
        var newX = currentCoord.x;
        var newY = currentCoord.y;

        switch (parseInt(dir)) {
            case 1:
                newY--;
                break;
            case 2:
                newY--;
                newX++;
                break;
            case 3:
                newX++;
                break;
            case 4:
                newY++;
                newX++;
                break;
            case 5:
                newY++;
                break;
            case 6:
                newY++;
                newX--;
                break;
            case 7:
                newX--;
                break;
            case 8:
                newY--;
                newX--;
                break;
        }
        return $scope.getCoordinateByXY(newX, newY);
    }

    $scope.getCoordinateByXY = function (x, y) {
        var breakLoop = false;
        var rtnCoordinate = null;

        angular.forEach($scope.mapCoordinates, function (mapcol, index) {
            if (breakLoop == false) {
                angular.forEach(mapcol, function (coordinate, index) {
                    if (coordinate.x == x && coordinate.y == y) {
                        rtnCoordinate = coordinate;
                        breakLoop = true;
                    }
                });
            }
        });
        return rtnCoordinate;
    };

    $scope.defineCoordClass = function (terrain, state, population, productionSite, bonusSymbol, displayField, units, x, y, routeCandidate, jumpOffText) {
        var baseClass = '';

        switch ($scope.selectedDisplayOption.name) {
            case 'Movement':
                baseClass = (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea' : 'terrain_' + terrain;
                if (displayField) {
                    baseClass = baseClass + ' ' + displayField;
                }
                break;
            case 'SetUpBrigades':
                baseClass = (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea' : 'terrain_' + terrain;
                break;
            case 'FormFederation':
                baseClass = (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea' : 'terrain_' + terrain;
                break;
            case 'Terrain':
                baseClass = (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea unitExists' : 'terrain_' + terrain;
                break;
            case 'State':
                baseClass = 'state_' + state;
                break;
            case 'ProductionSite':
                baseClass = $scope.getProductionSiteEligibilityClass({
                    terrain: terrain,
                    state: state,
                    population: population,
                    productionSite: productionSite,
                    bonus: bonusSymbol
                });
                break;
        }

        if (x > 0 && y > 0 && units && units.length > 0) {
            baseClass = (baseClass ? baseClass + ' ' : '') + 'unit_Exists';
        }

        if ($scope.selectedMovementItemCoordinate
            && $scope.selectedMovementItemCoordinate.x == x
            && $scope.selectedMovementItemCoordinate.y == y) {
            baseClass = (baseClass ? baseClass + ' ' : '') + 'movementItemSelected';
        }

        if (jumpOffText && !displayField) {
            baseClass = (baseClass ? baseClass + ' ' : '') + 'jumpOffPoint';
        }

        if (routeCandidate) {
            baseClass = (baseClass ? baseClass + ' ' : '') + $scope.getRouteCandidateClass(state);
        }

        return baseClass;
    };

    $scope.filterMapFn = function (col) {

        //if (col.x<5) 
        //    return true;
        //else
        //    return false;

        if (col.x == 0 || (col.x >= $scope.selectedMapChoice.minX && col.x <= $scope.selectedMapChoice.maxX)) {
            if (col.y == 0)
                return true;
            if (col.y >= $scope.selectedMapChoice.minY && col.y <= $scope.selectedMapChoice.maxY) {

                return true; // this will be listed in the results
            }
        }

        return false; // otherwise it won't be within the results
    };

    $scope.hasMovementItemNo = function (movementRow) {
        if (!movementRow || movementRow.itemNo == null) {
            return false;
        }

        return movementRow.itemNo.toString().trim() !== '';
    };

    $scope.removeMovementRow = function (row) {
        if (!row || !row.entity) {
            return;
        }

        var movementRow = row.entity;

        movementRow.itemNo = null;
        movementRow.type = null;
        movementRow.mp = null;
        movementRow.mpUsed = null;
        movementRow.xy = null;
        movementRow.direction1 = null;
        movementRow.distance1 = null;
        movementRow.direction2 = null;
        movementRow.distance2 = null;
        movementRow.direction3 = null;
        movementRow.distance3 = null;

        if ($scope.selectedMovementRow === movementRow) {
            $scope.selectedMovementRow = null;
            $scope.selectedMovementItemCoordinate = null;
            $scope.pendingRouteSelection = null;
            $scope.clearDisplayField();
            $scope.clearRouteCandidates();
        }

        $scope.queueAutoSaveTsGrid('Movement');
    };

    $scope.hasProductionSiteData = function (productionSiteRow) {
        if (!productionSiteRow) {
            return false;
        }

        var prodSiteType = productionSiteRow.prodSiteType != null ? productionSiteRow.prodSiteType : productionSiteRow.ProdSiteType;
        var x = productionSiteRow.x != null ? productionSiteRow.x : productionSiteRow.X;
        var y = productionSiteRow.y != null ? productionSiteRow.y : productionSiteRow.Y;

        return prodSiteType != null || x != null || y != null;
    };

    $scope.removeProductionSiteRow = function (row) {
        if (!row || !row.entity) {
            return;
        }

        row.entity.prodSiteType = null;
        row.entity.ProdSiteType = null;
        row.entity.x = null;
        row.entity.X = null;
        row.entity.y = null;
        row.entity.Y = null;

        $scope.queueAutoSaveTsGrid('BuildProductionSites');
    };

    $scope.hasFormFederationItemNo = function (federationRow) {
        if (!federationRow) {
            return false;
        }

        var itemNo = federationRow.itemNo != null ? federationRow.itemNo : federationRow.ItemNo;
        return itemNo != null && itemNo.toString().trim() !== '';
    };

    $scope.removeFormFederationRow = function (row) {
        if (!row || !row.entity) {
            return;
        }

        row.entity.itemNo = null;
        row.entity.ItemNo = null;
        row.entity.federation_Fleet = null;
        row.entity.Federation_Fleet = null;

        $scope.queueAutoSaveTsGrid('FormFederations');
    };

    $scope.hasSetUpBrigadesData = function (setUpRow) {
        if (!setUpRow) {
            return false;
        }

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
        if (!setUpRow) {
            return false;
        }

        var depot = setUpRow.depot != null ? setUpRow.depot : setUpRow.Depot;
        var batt1 = setUpRow.batt1 != null ? setUpRow.batt1 : setUpRow.Batt1;
        var batt2 = setUpRow.batt2 != null ? setUpRow.batt2 : setUpRow.Batt2;
        var batt3 = setUpRow.batt3 != null ? setUpRow.batt3 : setUpRow.Batt3;
        var batt4 = setUpRow.batt4 != null ? setUpRow.batt4 : setUpRow.Batt4;
        var batt5 = setUpRow.batt5 != null ? setUpRow.batt5 : setUpRow.Batt5;
        var batt6 = setUpRow.batt6 != null ? setUpRow.batt6 : setUpRow.Batt6;
        var batt7 = setUpRow.batt7 != null ? setUpRow.batt7 : setUpRow.Batt7;

        // If depot is set, require all first 5 battalions
        if (depot != null && depot !== '') {
            if (!batt1 || !batt2 || !batt3 || !batt4 || !batt5) {
                return true;
            }

            // If Batt7 is set, require Batt6 also
            if (batt7 && !batt6) {
                return true;
            }
        }

        return false;
    };

    $scope.removeSetUpBrigadesRow = function (row) {
        if (!row || !row.entity) {
            return;
        }

        row.entity.depot = null;
        row.entity.Depot = null;
        row.entity.batt1 = null;
        row.entity.Batt1 = null;
        row.entity.batt2 = null;
        row.entity.Batt2 = null;
        row.entity.batt3 = null;
        row.entity.Batt3 = null;
        row.entity.batt4 = null;
        row.entity.Batt4 = null;
        row.entity.batt5 = null;
        row.entity.Batt5 = null;
        row.entity.batt6 = null;
        row.entity.Batt6 = null;
        row.entity.batt7 = null;
        row.entity.Batt7 = null;
        row.entity.brigadeName = '';
        row.entity.BrigadeName = '';

        $scope.queueAutoSaveTsGrid('SetUpBrigades');
        $scope.recalculateTransferGoodsForSetUpBrigades();
    };

    $scope.hasTransferGoodsData = function (transferRow) {
        if (!transferRow) {
            return false;
        }

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
        if (!row || !row.entity) {
            return;
        }

        row.entity.from = null;
        row.entity.From = null;
        row.entity.to = null;
        row.entity.To = null;
        row.entity.louisdore = null;
        row.entity.Louisdore = null;
        row.entity.citizens = null;
        row.entity.Citizens = null;
        row.entity.ecPts = null;
        row.entity.EcPts = null;
        row.entity.wood = null;
        row.entity.Wood = null;
        row.entity.horses = null;
        row.entity.Horses = null;
        row.entity.textiles = null;
        row.entity.Textiles = null;

        $scope.queueAutoSaveTsGrid('TransferGoods');
    };

    $scope.armyListClickRow = function (row) {
        if (!row || !row.entity) {
            return;
        }

        $scope.selectedArmyListItem = row.entity;
    };

    $scope.isArmyListItemSelected = function (armyItem) {
        if (!armyItem || !$scope.selectedArmyListItem) {
            return false;
        }

        return armyItem.itemNo == $scope.selectedArmyListItem.itemNo
            || armyItem.ItemNo == $scope.selectedArmyListItem.ItemNo;
    };

    $scope.setUpBrigadesGridClick = function (row, col) {
        if (!row || !row.entity || !col) {
            return;
        }

        var field = (col.field || '').toLowerCase();

        if (field === 'depot') {
            if (!$scope.pendingDepotSourceItemNo) {
                alert('Select a barracks/shipyard coordinate first.');
                return;
            }

            row.entity.depot = $scope.pendingDepotSourceItemNo;
            row.entity.Depot = $scope.pendingDepotSourceItemNo;
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

            var unitItemNo = $scope.selectedArmyListItem.itemNo != null ? $scope.selectedArmyListItem.itemNo : $scope.selectedArmyListItem.ItemNo;
            var depotItemNo = row.entity.depot != null ? row.entity.depot : row.entity.Depot;
            var sphere = $scope.getSphereFromDepotItemNo(depotItemNo);
            if (!sphere) {
                alert('Select a depot in this TS_03 row before adding battalions.');
                return;
            }

            if (!$scope.canAddArmyItemToDepotSphere(unitItemNo, sphere)) {
                alert('This troop type cannot be built in the selected sphere.');
                return;
            }

            row.entity[field] = unitItemNo;

            var pascalField = field.charAt(0).toUpperCase() + field.substr(1);
            row.entity[pascalField] = unitItemNo;

            var brigadeName = row.entity.brigadeName != null ? row.entity.brigadeName : row.entity.BrigadeName;
            if (!brigadeName || brigadeName === '<Brigade Name>') {
                var unitName = $scope.selectedArmyListItem.name || $scope.selectedArmyListItem.Name;
                row.entity.brigadeName = unitName;
                row.entity.BrigadeName = unitName;
            }

            $scope.queueAutoSaveTsGrid('SetUpBrigades');
            $scope.recalculateTransferGoodsForSetUpBrigades();
        }
    };

    $scope.movementGridOptions = {
        data: 'tsMovementList',
        headerRowHeight: 30,
        rowHeight: 25,
        columnDefs: 'movementColumnDefsMap',
        //selectedItems: $scope.bgSelections,
        enableCellSelection: true,
        enableRowSelection: true,
        enableCellEdit: true,
        enabledCellEditOnFocus: true,
        multiSelect: false,
        rowTemplate: '<div ng-click="movementClickRow(row)" ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>',
    };

    $scope.itemGridOptions = {
        data: 'itemGridRows',
        headerRowHeight: 30,
        rowHeight: 25,
        columnDefs: 'itemColumnDefsMap',
        enableCellSelection: false,
        enableRowSelection: true,
        enableCellEdit: false,
        multiSelect: false,
        rowTemplate: '<div ng-click="itemGridClickRow(row, col)" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}} {{isItemAlreadyInMovementGrid(row.entity.itemNo) ? \"itemGridRowAlreadyAdded\" : \"\"}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>'
    };

    $scope.productionSiteGridOptions = {
        data: 'tsBuildProductionSitesList',
        headerRowHeight: 30,
        rowHeight: 25,
        columnDefs: 'productionSiteColumnDefsMap',
        enableCellSelection: true,
        enableRowSelection: true,
        enableCellEdit: true,
        enabledCellEditOnFocus: true,
        multiSelect: false,
        rowTemplate: '<div ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}} {{getProductionSiteRowClass(row.entity)}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>'
    };

    $scope.formFederationGridOptions = {
        data: 'tsFormFederationsList',
        headerRowHeight: 30,
        rowHeight: 25,
        columnDefs: 'formFederationColumnDefsMap',
        enableCellSelection: true,
        enableRowSelection: true,
        enableCellEdit: true,
        enabledCellEditOnFocus: true,
        multiSelect: false
    };

    $scope.setUpBrigadesGridOptions = {
        data: 'tsSetUpBrigadesRows',
        headerRowHeight: 30,
        rowHeight: 25,
        columnDefs: 'setUpBrigadesColumnDefsMap',
        enableCellSelection: true,
        enableRowSelection: true,
        enableCellEdit: true,
        enabledCellEditOnFocus: true,
        multiSelect: false,
        rowTemplate: '<div ng-click="setUpBrigadesGridClick(row, col)" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}} {{isBrigadeSetupIncomplete(row.entity) ? \"setUpBrigadesIncompleteRow\" : \"\"}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>'
    };

    $scope.transferGoodsGridOptions = {
        data: 'tsTransferGoodsCostRows',
        headerRowHeight: 30,
        rowHeight: 25,
        columnDefs: 'transferGoodsColumnDefsMap',
        enableCellSelection: true,
        enableRowSelection: true,
        enableCellEdit: true,
        enabledCellEditOnFocus: true,
        multiSelect: false
    };

    $scope.armyListGridOptions = {
        data: 'armyListRows',
        headerRowHeight: 30,
        rowHeight: 25,
        columnDefs: 'armyListColumnDefsMap',
        enableCellSelection: false,
        enableRowSelection: true,
        enableCellEdit: false,
        multiSelect: false,
        rowTemplate: '<div ng-click="armyListClickRow(row)" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}} {{isArmyListItemSelected(row.entity) ? "itemGridRowSelected" : ""}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>'
    };

    $scope.movementColumnDefsMap = [
        { field: 'orderNo', displayName: 'No', width: '30px', cellClass: 'grid-center-align' },

        {
            field: 'itemNo', displayName: 'Item No', width: '55px', cellClass: 'grid-center-align',
            enableFocusedCellEdit: true, editableCellTemplate: '/Templates/itemSelectTemplate.html'
        },
        { field: 'type', displayName: 'Type', width: '40px', cellClass: 'grid-center-align' },

        { field: 'mp', displayName: 'MP', width: '35px', cellClass: 'grid-center-align' },
        { field: 'mpUsed', displayName: 'Used', width: '40px', cellClass: 'grid-center-align' },
        { field: 'xy', displayName: 'X/Y', width: '50px', cellClass: 'grid-center-align' },

        { field: 'direction1', displayName: 'Dir1', width: '40px', cellClass: 'grid-center-align' },
        { field: 'distance1', displayName: 'Dist1', width: '40px', cellClass: 'grid-center-align' },
        { field: 'direction2', displayName: 'Dir2', width: '40px', cellClass: 'grid-center-align' },
        { field: 'distance2', displayName: 'Dist2', width: '40px', cellClass: 'grid-center-align' },
        { field: 'direction3', displayName: 'Dir3', width: '40px', cellClass: 'grid-center-align' },
        { field: 'distance3', displayName: 'Dist3', width: '40px', cellClass: 'grid-center-align' },
        { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasMovementItemNo(row.entity)" ng-click="removeMovementRow(row)"></span></div>' },
    ];

    $scope.itemColumnDefsMap = [
        { field: 'itemNo', displayName: 'Item No', width: '55px', cellClass: 'grid-center-align' },
        { field: 'fed', displayName: 'Fed', width: '45px', cellClass: 'grid-center-align' },
        { field: 'itemTypeName', displayName: 'Type', width: '40px', cellClass: 'grid-center-align' },
        { field: 'mp', displayName: 'MP', width: '35px', cellClass: 'grid-center-align' },
        { field: 'xy', displayName: 'X/Y', width: '60px', cellClass: 'grid-center-align' },
        { field: 'description', displayName: 'Description', cellClass: 'grid-left-align' }
    ];

    $scope.productionSiteColumnDefsMap = [
        { field: 'orderNo', displayName: 'No', width: '35px', cellClass: 'grid-center-align' },
        { field: 'prodSiteType', displayName: 'Type', width: '65px', cellClass: 'grid-center-align' },
        { field: 'x', displayName: 'X', width: '55px', cellClass: 'grid-center-align' },
        { field: 'y', displayName: 'Y', width: '55px', cellClass: 'grid-center-align' },
        { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasProductionSiteData(row.entity)" ng-click="removeProductionSiteRow(row)"></span></div>' }
    ];

    $scope.formFederationColumnDefsMap = [
        { field: 'orderNo', displayName: 'No', width: '35px', cellClass: 'grid-center-align' },
        { field: 'itemNo', displayName: 'Item No', width: '70px', cellClass: 'grid-center-align' },
        { field: 'federation_Fleet', displayName: 'Federation', width: '95px', cellClass: 'grid-center-align' },
        { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasFormFederationItemNo(row.entity)" ng-click="removeFormFederationRow(row)"></span></div>' }
    ];

    $scope.setUpBrigadesColumnDefsMap = [
        { field: 'orderNo', displayName: 'No', width: '35px', cellClass: 'grid-center-align' },
        { field: 'depot', displayName: 'Depot', width: '60px', cellClass: 'grid-center-align' },
        { field: 'batt1', displayName: 'Batt1', width: '55px', cellClass: 'grid-center-align' },
        { field: 'batt2', displayName: 'Batt2', width: '55px', cellClass: 'grid-center-align' },
        { field: 'batt3', displayName: 'Batt3', width: '55px', cellClass: 'grid-center-align' },
        { field: 'batt4', displayName: 'Batt4', width: '55px', cellClass: 'grid-center-align' },
        { field: 'batt5', displayName: 'Batt5', width: '55px', cellClass: 'grid-center-align' },
        { field: 'batt6', displayName: 'Batt6', width: '55px', cellClass: 'grid-center-align' },
        { field: 'batt7', displayName: 'Batt7', width: '55px', cellClass: 'grid-center-align' },
        { field: 'brigadeName', displayName: 'Brigade Name', cellClass: 'grid-left-align', enableCellEdit: true, editableCellTemplate: '<input class="inlineEditBox" ng-model="row.entity[col.field]" ng-keypress="$event.keyCode !== 13 || $event.stopPropagation()" maxlength="15" title="Maximum 15 characters" />' },
        { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasSetUpBrigadesData(row.entity)" ng-click="removeSetUpBrigadesRow(row)"></span></div>' }
    ];

    $scope.transferGoodsColumnDefsMap = [
        { field: 'orderNo', displayName: 'No', width: '35px', cellClass: 'grid-center-align' },
        { field: 'from', displayName: 'From', width: '55px', cellClass: 'grid-center-align' },
        { field: 'to', displayName: 'To', width: '55px', cellClass: 'grid-center-align' },
        { field: 'louisdore', displayName: 'Louisdore', width: '75px', cellClass: 'grid-center-align' },
        { field: 'citizens', displayName: 'Citizens', width: '65px', cellClass: 'grid-center-align' },
        { field: 'ecPts', displayName: 'EcPts', width: '55px', cellClass: 'grid-center-align' },
        { field: 'wood', displayName: 'Wood', width: '55px', cellClass: 'grid-center-align' },
        { field: 'horses', displayName: 'Horses', width: '60px', cellClass: 'grid-center-align' },
        { field: 'textiles', displayName: 'Textiles', width: '60px', cellClass: 'grid-center-align' },
        { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasTransferGoodsData(row.entity)" ng-click="removeTransferGoodsRow(row)"></span></div>' }
    ];

    $scope.armyListColumnDefsMap = [
        { field: 'itemNo', displayName: 'Item No', width: '70px', cellClass: 'grid-center-align' },
        { field: 'name', displayName: 'Name', width: '120px', cellClass: 'grid-left-align' },
        { field: 'shortName', displayName: 'Short', width: '55px', cellClass: 'grid-center-align' },
        { field: 'lr', displayName: 'LR', width: '45px', cellClass: 'grid-center-align' },
        { field: 'rg', displayName: 'RG', width: '45px', cellClass: 'grid-center-align' },
        { field: 'simMP', displayName: 'SimMP', width: '60px', cellClass: 'grid-center-align' },
        { field: 'mp', displayName: 'MP', width: '45px', cellClass: 'grid-center-align' },
        { field: 'ef', displayName: 'EF', width: '45px', cellClass: 'grid-center-align' },
        { field: 'hc', displayName: 'HC', width: '45px', cellClass: 'grid-center-align' },
        { field: 'formation', displayName: 'Formation', width: '80px', cellClass: 'grid-center-align' },
        { field: 'troopSpecification', displayName: 'Spec', cellClass: 'grid-left-align' }
    ];

    $scope.refreshFilteredMovementItemsForMap();

})

.filter('filterBrigade', function () {
    return function (input) {

        var brigades = [{ itemNo: 4081 },
                        { itemNo: 4082 },
                        { itemNo: 4083 }];

        if (input != null) {
            var itemsMatched = brigades.filter(function (brigade) {
                return brigade.itemNo == input;
            });
        };

        if (itemsMatched.length == 1)
            return itemsMatched[0].itemNo;
        else
            return '*unknown language*'

        return text;
    }
});