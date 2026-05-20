'use strict';

austerlitzModule.factory('turnMapsBoardingFactory', function () {
    return {
        attach: function ($scope) {
            $scope.boardingSummary = {
                war: 0,
                merchant: 0,
                loadCapacity: 0,
                brigades: 0,
                otherUnits: 0,
                weight: 0
            };

            $scope.boardingSelectedLookup = {};
            $scope.boardingLoadLookup = {};

            $scope.getShipCatalogByType = function () {
                var lookup = {};
                var ships = ($scope.masterData && $scope.masterData.rulesCatalog && ($scope.masterData.rulesCatalog.ships || $scope.masterData.rulesCatalog.Ships)) || [];

                angular.forEach(ships, function (ship) {
                    var shipType = ship.type != null ? ship.type : ship.Type;
                    if (shipType != null) {
                        lookup[shipType] = ship;
                    }
                });

                return lookup;
            };

            $scope.getShipConditionByItemNo = function (itemNo) {
                if (!$scope.masterData || !$scope.masterData.turnReport) {
                    return null;
                }

                var warships = $scope.masterData.turnReport.warships || $scope.masterData.turnReport.Warships || [];
                for (var i = 0; i < warships.length; i++) {
                    var warItemNo = warships[i].itemNo != null ? warships[i].itemNo : warships[i].ItemNo;
                    if (warItemNo == itemNo) {
                        return warships[i].condition != null ? warships[i].condition : warships[i].Condition;
                    }
                }

                var merchantShips = $scope.masterData.turnReport.merchantShips || $scope.masterData.turnReport.MerchantShips || [];
                for (var j = 0; j < merchantShips.length; j++) {
                    var merchantItemNo = merchantShips[j].itemNo != null ? merchantShips[j].itemNo : merchantShips[j].ItemNo;
                    if (merchantItemNo == itemNo) {
                        return merchantShips[j].condition != null ? merchantShips[j].condition : merchantShips[j].Condition;
                    }
                }

                return null;
            };

            $scope.getSeaFleetNoByItemNo = function (itemNo, itemType) {
                if (!$scope.masterData || !$scope.masterData.turnReport) {
                    return null;
                }

                var parsedType = parseInt(itemType, 10);
                if (parsedType === 2) {
                    var warships = $scope.masterData.turnReport.warships || $scope.masterData.turnReport.Warships || [];
                    for (var i = 0; i < warships.length; i++) {
                        var warItemNo = warships[i].itemNo != null ? warships[i].itemNo : warships[i].ItemNo;
                        if (warItemNo == itemNo) {
                            return warships[i].fleetNo != null ? warships[i].fleetNo : warships[i].FleetNo;
                        }
                    }
                }

                if (parsedType === 3) {
                    var merchantShips = $scope.masterData.turnReport.merchantShips || $scope.masterData.turnReport.MerchantShips || [];
                    for (var j = 0; j < merchantShips.length; j++) {
                        var merchantItemNo = merchantShips[j].itemNo != null ? merchantShips[j].itemNo : merchantShips[j].ItemNo;
                        if (merchantItemNo == itemNo) {
                            return merchantShips[j].fleetNo != null ? merchantShips[j].fleetNo : merchantShips[j].FleetNo;
                        }
                    }
                }

                return null;
            };

            $scope.getSelectionFedValue = function (item, itemNo, itemType) {
                var parsedType = parseInt(itemType, 10);
                if (parsedType === 2 || parsedType === 3) {
                    var fleetNo = $scope.getSeaFleetNoByItemNo(itemNo, parsedType);
                    if (fleetNo != null && fleetNo !== '') {
                        return fleetNo;
                    }
                }

                return item.federationNo != null ? item.federationNo : item.FederationNo;
            };

            $scope.getArmyListLookupByShortName = function () {
                var lookup = {};
                var allArmyItems = ($scope.masterData && $scope.masterData.rulesCatalog && ($scope.masterData.rulesCatalog.armyList || $scope.masterData.rulesCatalog.ArmyList)) || [];

                angular.forEach(allArmyItems, function (armyItem) {
                    var shortName = (armyItem.shortName != null ? armyItem.shortName : armyItem.ShortName);
                    if (shortName != null) {
                        lookup[shortName.toString().trim().toUpperCase()] = armyItem;
                    }
                });

                return lookup;
            };

            $scope.getBattalionWeightPerMan = function (armyItem) {
                if (!armyItem) {
                    return 200;
                }

                var isCavalry = !!(armyItem.isCavalry != null ? armyItem.isCavalry : armyItem.IsCavalry);
                var itemNo = parseInt(armyItem.itemNo != null ? armyItem.itemNo : armyItem.ItemNo, 10);

                if (isCavalry) return 400;
                if (!isNaN(itemNo) && itemNo >= 30) return 600;

                return 200;
            };

            $scope.getBrigadeWeight = function (itemNo) {
                if (!$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.brigades) {
                    return 0;
                }

                var brigades = $scope.masterData.turnReport.brigades;
                var armyLookup = $scope.getArmyListLookupByShortName();

                for (var i = 0; i < brigades.length; i++) {
                    if (brigades[i].itemNo == itemNo || brigades[i].ItemNo == itemNo) {
                        var totalWeight = 0;

                        for (var b = 1; b <= 7; b++) {
                            var typeField = 'batt' + b + 'Type';
                            var sizeField = 'batt' + b + 'Size';
                            var pascalTypeField = 'Batt' + b + 'Type';
                            var pascalSizeField = 'Batt' + b + 'Size';
                            var battType = brigades[i][typeField] != null ? brigades[i][typeField] : brigades[i][pascalTypeField];
                            var battSize = parseInt(brigades[i][sizeField] != null ? brigades[i][sizeField] : brigades[i][pascalSizeField], 10) || 0;

                            if (!battType || battType.toString().trim() === '--' || battSize <= 0) {
                                continue;
                            }

                            totalWeight += (battSize * $scope.getBattalionWeightPerMan(armyLookup[battType.toString().trim().toUpperCase()]));
                        }

                        return totalWeight;
                    }
                }

                return 0;
            };

            $scope.getBaggageTrainWeight = function (itemNo) {
                if (!$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.baggageTrains) {
                    return 0;
                }

                var baggageTrains = $scope.masterData.turnReport.baggageTrains;
                for (var i = 0; i < baggageTrains.length; i++) {
                    var bagItemNo = baggageTrains[i].itemNo != null ? baggageTrains[i].itemNo : baggageTrains[i].ItemNo;
                    if (bagItemNo == itemNo) {
                        var qty1 = parseInt(baggageTrains[i].quantity1 != null ? baggageTrains[i].quantity1 : baggageTrains[i].Quantity1, 10) || 0;
                        var qty2 = parseInt(baggageTrains[i].quantity2 != null ? baggageTrains[i].quantity2 : baggageTrains[i].Quantity2, 10) || 0;
                        return 500000 + qty1 + qty2;
                    }
                }

                return 500000;
            };

            $scope.getLoadedUnitWeight = function (item) {
                if (!item) return 0;

                var itemType = parseInt(item.itemType, 10);
                var itemNo = item.originalItemNo != null ? item.originalItemNo : item.itemNo;

                if (itemType === 0 || itemType === 5) return 0;
                if (itemType === 1) return $scope.getBrigadeWeight(itemNo);
                if (itemType === 4) return $scope.getBaggageTrainWeight(itemNo);

                return 0;
            };

            $scope.isWarshipBoardingItem = function (item) {
                if (!item) return false;

                var itemType = parseInt(item.itemType, 10);
                if (!isNaN(itemType)) return itemType === 2;

                return $scope.getItemTypeName(item.itemType) === 'Warship';
            };

            $scope.isMerchantBoardingItem = function (item) {
                if (!item) return false;

                var itemType = parseInt(item.itemType, 10);
                if (!isNaN(itemType)) return itemType === 3;

                return $scope.getItemTypeName(item.itemType) === 'MerchantShip';
            };

            $scope.recalculateBoardingSummary = function () {
                var summary = {
                    war: 0,
                    merchant: 0,
                    loadCapacity: 0,
                    brigades: 0,
                    otherUnits: 0,
                    weight: 0
                };
                var shipCatalogByType = $scope.getShipCatalogByType();

                angular.forEach($scope.boardingItemRows || [], function (item) {
                    if (!item || !item.isSelected) return;

                    if ($scope.isWarshipBoardingItem(item)) {
                        summary.war++;
                        var warShip = shipCatalogByType[item.shipTypeNo];
                        summary.loadCapacity += parseInt(warShip && (warShip.loadCapacity != null ? warShip.loadCapacity : warShip.LoadCapacity), 10) || 0;
                    } else if ($scope.isMerchantBoardingItem(item)) {
                        summary.merchant++;
                        var merchantShip = shipCatalogByType[item.shipTypeNo];
                        summary.loadCapacity += parseInt(merchantShip && (merchantShip.loadCapacity != null ? merchantShip.loadCapacity : merchantShip.LoadCapacity), 10) || 0;
                    }

                    if (item.load) {
                        if (item.itemTypeName === 'Bg') {
                            summary.brigades++;
                            summary.weight += $scope.getLoadedUnitWeight(item);
                        } else if (!$scope.isWarshipBoardingItem(item) && !$scope.isMerchantBoardingItem(item)) {
                            summary.otherUnits++;
                            summary.weight += $scope.getLoadedUnitWeight(item);
                        }
                    }
                });

                summary.weight = Math.round((summary.weight / 1000) * 100) / 100;
                $scope.boardingSummary = summary;
            };

            $scope.normalizeBoardingRows = function (rows) {
                return (rows || []).map(function (row) {
                    row.orderNo = row.orderNo != null ? row.orderNo : row.OrderNo;
                    row.command = row.command != null ? row.command : row.Command;
                    row.itemNo = row.itemNo != null ? row.itemNo : row.ItemNo;
                    row.fleetNo = row.fleetNo != null ? row.fleetNo : row.FleetNo;
                    row.fleetOwner = row.fleetOwner != null ? row.fleetOwner : row.FleetOwner;

                    row.OrderNo = row.orderNo;
                    row.Command = row.command;
                    row.ItemNo = row.itemNo;
                    row.FleetNo = row.fleetNo;
                    row.FleetOwner = row.fleetOwner;
                    return row;
                });
            };

            $scope.getFirstSelectedShipFleetNo = function () {
                var fleetNo = null;

                angular.forEach($scope.boardingItemRows || [], function (item) {
                    if (fleetNo != null || !item || !item.isSelected) return;
                    if (!$scope.isWarshipBoardingItem(item) && !$scope.isMerchantBoardingItem(item)) return;
                    if (item.fed != null && item.fed !== '') fleetNo = item.fed;
                });

                return fleetNo;
            };

            $scope.getBoardingUnitsToLoad = function () {
                return ($scope.boardingItemRows || []).filter(function (item) {
                    return item && item.isSelected && item.load && !$scope.isWarshipBoardingItem(item) && !$scope.isMerchantBoardingItem(item);
                });
            };

            $scope.loadSelectedBoardingUnits = function () {
                if (!$scope.tsBoardingList || !$scope.tsBoardingList.length) return;

                var unitsToLoad = $scope.getBoardingUnitsToLoad();
                if (!unitsToLoad.length) return;

                var emptyRows = $scope.tsBoardingList.filter(function (row) {
                    var rowItemNo = row.itemNo != null ? row.itemNo : row.ItemNo;
                    return rowItemNo == null || rowItemNo === '';
                });

                if (emptyRows.length < unitsToLoad.length) {
                    alert('Not enough empty TS_20 rows to load all selected units.');
                    return;
                }

                var fleetNo = $scope.getFirstSelectedShipFleetNo();

                for (var i = 0; i < unitsToLoad.length; i++) {
                    var row = emptyRows[i];
                    var unit = unitsToLoad[i];
                    var unitNo = unit.originalItemNo != null ? unit.originalItemNo : unit.itemNo;

                    row.command = null;
                    row.Command = null;
                    row.itemNo = unitNo;
                    row.ItemNo = unitNo;
                    row.fleetNo = fleetNo != null ? fleetNo : null;
                    row.FleetNo = fleetNo != null ? fleetNo : null;
                    row.fleetOwner = null;
                    row.FleetOwner = null;
                }

                angular.forEach($scope.boardingItemRows || [], function (unit) {
                    if (!unit || !unit.isSelected) return;

                    var unitNo = unit.originalItemNo != null ? unit.originalItemNo : unit.itemNo;
                    unit.isSelected = false;
                    unit.load = false;
                    delete $scope.boardingSelectedLookup[unitNo];
                    delete $scope.boardingLoadLookup[unitNo];
                });

                $scope.recalculateBoardingSummary();
                $scope.queueAutoSaveTsGrid('Boarding');
            };

            $scope.hasBoardingData = function (boardingRow) {
                if (!boardingRow) return false;

                var command = boardingRow.command != null ? boardingRow.command : boardingRow.Command;
                var itemNo = boardingRow.itemNo != null ? boardingRow.itemNo : boardingRow.ItemNo;
                var fleetNo = boardingRow.fleetNo != null ? boardingRow.fleetNo : boardingRow.FleetNo;

                return command != null || itemNo != null || fleetNo != null;
            };

            $scope.removeBoardingRow = function (row) {
                if (!row || !row.entity) return;

                row.entity.command = null;
                row.entity.Command = null;
                row.entity.itemNo = null;
                row.entity.ItemNo = null;
                row.entity.fleetNo = null;
                row.entity.FleetNo = null;
                row.entity.fleetOwner = null;
                row.entity.FleetOwner = null;

                $scope.queueAutoSaveTsGrid('Boarding');
            };

            $scope.boardingItemGridClickRow = function (row) {
                if (!row || !row.entity) return;
                $scope.setBoardingItemSelected(row.entity, !row.entity.isSelected);
            };

            $scope.setBoardingItemSelected = function (item, isSelected) {
                if (!item) return;

                var itemNo = item.originalItemNo != null ? item.originalItemNo : item.itemNo;
                var selected = !!isSelected;

                item.isSelected = selected;
                item.load = selected;

                if (selected) {
                    $scope.boardingSelectedLookup[itemNo] = true;
                    $scope.boardingLoadLookup[itemNo] = true;
                } else {
                    delete $scope.boardingSelectedLookup[itemNo];
                    delete $scope.boardingLoadLookup[itemNo];
                }

                $scope.recalculateBoardingSummary();
            };

            $scope.onBoardingLoadChanged = function (item) {
                if (!item) return;
                $scope.setBoardingItemSelected(item, !item.isSelected);
            };
        }
    };
});
