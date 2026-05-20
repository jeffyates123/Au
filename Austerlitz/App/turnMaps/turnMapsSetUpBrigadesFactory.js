'use strict';

austerlitzModule.factory('turnMapsSetUpBrigadesFactory', function () {
    return {
        attach: function ($scope, rulesCatalogFactory) {
            $scope.pendingDepotSourceItemNo = null;
            $scope.selectedArmyListItem = null;

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
                if (!$scope.tsTransferGoodsList) return null;

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
                        if (itemNo == null || isNaN(parsedItemNo) || parsedItemNo % 2 === 0) return false;
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

                var barracks = $scope.masterData.turnReport.barracks || $scope.masterData.turnReport.Barracks || [];
                for (var i = 0; i < barracks.length; i++) {
                    var itemNo = barracks[i].itemNo != null ? barracks[i].itemNo : barracks[i].ItemNo;
                    if (itemNo == depotItemNo) return barracks[i];
                }

                var ports = $scope.masterData.turnReport.tradingPortsAndCities || $scope.masterData.turnReport.TradingPortsAndCities || [];
                for (var j = 0; j < ports.length; j++) {
                    var portNo = ports[j].itemNo != null ? ports[j].itemNo : ports[j].ItemNo;
                    if (portNo == depotItemNo) return ports[j];
                }

                return null;
            };

            $scope.getSphereFromDepotItemNo = function (depotItemNo) {
                var depotRef = $scope.getDepotReferenceByItemNo(depotItemNo);
                if (!depotRef) return null;

                var x = depotRef.x != null ? depotRef.x : depotRef.X;
                var y = depotRef.y != null ? depotRef.y : depotRef.Y;
                return $scope.getSphereFromCoordinate(x, y);
            };

            $scope.getArmyListItemByItemNo = function (itemNo) {
                if (!$scope.armyListRows || itemNo == null) return null;

                for (var i = 0; i < $scope.armyListRows.length; i++) {
                    var armyItemNo = $scope.armyListRows[i].itemNo != null ? $scope.armyListRows[i].itemNo : $scope.armyListRows[i].ItemNo;
                    if (armyItemNo == itemNo) return $scope.armyListRows[i];
                }

                return null;
            };

            $scope.canAddArmyItemToDepotSphere = function (armyItemNo, sphere) {
                var parsedItemNo = parseInt(armyItemNo, 10);
                if (isNaN(parsedItemNo)) return false;
                if (parsedItemNo === 19) return sphere === 'Europe';
                if (parsedItemNo === 17 || parsedItemNo === 37 || parsedItemNo === 39) return sphere === 'Carribbean' || sphere === 'India';

                return true;
            };

            $scope.recalculateTransferGoodsForSetUpBrigades = function () {
                if (!$scope.tsSetUpBrigadesList || !$scope.tsTransferGoodsList) return;

                var totalsByDepot = {};
                var depotOrder = [];
                var battalionFields = ['batt1', 'batt2', 'batt3', 'batt4', 'batt5', 'batt6', 'batt7'];

                angular.forEach($scope.tsSetUpBrigadesList, function (setUpRow) {
                    var depotItemNo = setUpRow.depot != null ? setUpRow.depot : setUpRow.Depot;
                    if (depotItemNo == null || depotItemNo === '') return;

                    var sphere = $scope.getSphereFromDepotItemNo(depotItemNo);
                    var warehouseNo = sphere === 'Europe' ? 1 : (sphere === 'Carribbean' ? 2 : (sphere === 'India' ? 3 : null));
                    if (!warehouseNo) return;

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
                        if (!battItemNo) return;

                        var armyItem = $scope.getArmyListItemByItemNo(battItemNo);
                        if (!armyItem) return;

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
                        if (isMounted) totalsByDepot[depotKey].horses += recruits;
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

                    transferRow.from = line ? line.from : null;
                    transferRow.From = line ? line.from : null;
                    transferRow.to = line ? line.to : null;
                    transferRow.To = line ? line.to : null;
                    transferRow.louisdore = line ? line.louisdore : null;
                    transferRow.Louisdore = line ? line.louisdore : null;
                    transferRow.citizens = line ? line.citizens : null;
                    transferRow.Citizens = line ? line.citizens : null;
                    transferRow.ecPts = line ? line.ecPts : null;
                    transferRow.EcPts = line ? line.ecPts : null;
                    transferRow.horses = line ? line.horses : null;
                    transferRow.Horses = line ? line.horses : null;
                    transferRow.wood = null;
                    transferRow.Wood = null;
                    transferRow.textiles = null;
                    transferRow.Textiles = null;
                }

                $scope.refreshTransferGoodsCostRows();
                $scope.queueAutoSaveTsGrid('TransferGoods');
            };

            $scope.getDepotSourceItemNoAtCoordinate = function (x, y) {
                if (!$scope.masterData || !$scope.masterData.turnReport) return null;

                var barracks = $scope.masterData.turnReport.barracks || $scope.masterData.turnReport.Barracks || [];
                for (var i = 0; i < barracks.length; i++) {
                    if (barracks[i].x == x && barracks[i].y == y) return barracks[i].itemNo || barracks[i].ItemNo;
                    if (barracks[i].X == x && barracks[i].Y == y) return barracks[i].ItemNo || barracks[i].itemNo;
                }

                var ports = $scope.masterData.turnReport.tradingPortsAndCities || $scope.masterData.turnReport.TradingPortsAndCities || [];
                for (var j = 0; j < ports.length; j++) {
                    if ((ports[j].x == x && ports[j].y == y) || (ports[j].X == x && ports[j].Y == y)) {
                        return ports[j].itemNo || ports[j].ItemNo;
                    }
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

                var depot = setUpRow.depot != null ? setUpRow.depot : setUpRow.Depot;
                var batt1 = setUpRow.batt1 != null ? setUpRow.batt1 : setUpRow.Batt1;
                var batt2 = setUpRow.batt2 != null ? setUpRow.batt2 : setUpRow.Batt2;
                var batt3 = setUpRow.batt3 != null ? setUpRow.batt3 : setUpRow.Batt3;
                var batt4 = setUpRow.batt4 != null ? setUpRow.batt4 : setUpRow.Batt4;
                var batt5 = setUpRow.batt5 != null ? setUpRow.batt5 : setUpRow.Batt5;
                var batt6 = setUpRow.batt6 != null ? setUpRow.batt6 : setUpRow.Batt6;
                var batt7 = setUpRow.batt7 != null ? setUpRow.batt7 : setUpRow.Batt7;

                if (depot != null && depot !== '') {
                    if (!batt1 || !batt2 || !batt3 || !batt4 || !batt5) return true;
                    if (batt7 && !batt6) return true;
                }

                return false;
            };

            $scope.removeSetUpBrigadesRow = function (row) {
                if (!row || !row.entity) return;

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
                if (!row || !row.entity) return;
                $scope.selectedArmyListItem = row.entity;
            };

            $scope.isArmyListItemSelected = function (armyItem) {
                if (!armyItem || !$scope.selectedArmyListItem) return false;

                return armyItem.itemNo == $scope.selectedArmyListItem.itemNo
                    || armyItem.ItemNo == $scope.selectedArmyListItem.ItemNo;
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
        }
    };
});
