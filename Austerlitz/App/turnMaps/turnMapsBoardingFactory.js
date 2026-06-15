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
                var ships = ($scope.masterData && $scope.masterData.rulesCatalog && $scope.masterData.rulesCatalog.ships) || [];

                angular.forEach(ships, function (ship) {
                    if (ship.type != null) {
                        lookup[ship.type] = ship;
                    }
                });

                return lookup;
            };

            $scope.getShipConditionByItemNo = function (itemNo) {
                if (!$scope.masterData || !$scope.masterData.turnReport) {
                    return null;
                }

                var warships = $scope.masterData.turnReport.warships || [];
                for (var i = 0; i < warships.length; i++) {
                    if (warships[i].itemNo == itemNo) {
                        return warships[i].condition;
                    }
                }

                var merchantShips = $scope.masterData.turnReport.merchantShips || [];
                for (var j = 0; j < merchantShips.length; j++) {
                    if (merchantShips[j].itemNo == itemNo) {
                        return merchantShips[j].condition;
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
                    var warships = $scope.masterData.turnReport.warships || [];
                    for (var i = 0; i < warships.length; i++) {
                        if (warships[i].itemNo == itemNo) {
                            return warships[i].fleetNo;
                        }
                    }
                }

                if (parsedType === 3) {
                    var merchantShips = $scope.masterData.turnReport.merchantShips || [];
                    for (var j = 0; j < merchantShips.length; j++) {
                        if (merchantShips[j].itemNo == itemNo) {
                            return merchantShips[j].fleetNo;
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

                return item.federationNo;
            };

            $scope.getArmyListLookupByShortName = function () {
                var lookup = {};
                var allArmyItems = ($scope.masterData && $scope.masterData.rulesCatalog && $scope.masterData.rulesCatalog.armyList) || [];

                angular.forEach(allArmyItems, function (armyItem) {
                    if (armyItem.shortName != null) {
                        lookup[armyItem.shortName.toString().trim().toUpperCase()] = armyItem;
                    }
                });

                return lookup;
            };

            $scope.getBattalionWeightPerMan = function (armyItem) {
                if (!armyItem) {
                    return 0;
                }

                var isCavalry = !!armyItem.isCavalry;
                var itemNo = parseInt(armyItem.itemNo, 10);

                if (isCavalry) return 400;
                if (!isNaN(itemNo) && itemNo >= 40) return 600;

                return 200;
            };

            $scope.getBrigadeWeight = function (itemNo) {
                if (!$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.brigades) {
                    return 0;
                }

                var brigades = $scope.masterData.turnReport.brigades;
                var armyLookup = $scope.getArmyListLookupByShortName();

                for (var i = 0; i < brigades.length; i++) {
                    if (brigades[i].itemNo == itemNo) {
                        var totalWeight = 0;

                        for (var b = 1; b <= 7; b++) {
                            var battType = brigades[i]['batt' + b + 'Type'];
                            var battSize = parseInt(brigades[i]['batt' + b + 'Size'], 10) || 0;

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
                    if (baggageTrains[i].itemNo == itemNo) {
                        var qty1 = parseInt(baggageTrains[i].quantity1, 10) || 0;
                        var qty2 = parseInt(baggageTrains[i].quantity2, 10) || 0;
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
                        summary.loadCapacity += parseInt(warShip && warShip.loadCapacity, 10) || 0;
                    } else if ($scope.isMerchantBoardingItem(item)) {
                        summary.merchant++;
                        var merchantShip = shipCatalogByType[item.shipTypeNo];
                        summary.loadCapacity += parseInt(merchantShip && merchantShip.loadCapacity, 10) || 0;
                    }

                    if (item.load) {
                        if (parseInt(item.itemType, 10) === 1 || item.itemTypeName === 'Bgd') {
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
                return rows || [];
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

            $scope.getSelectedBoardingShips = function () {
                return ($scope.boardingItemRows || []).filter(function (item) {
                    return item && item.isSelected && ($scope.isWarshipBoardingItem(item) || $scope.isMerchantBoardingItem(item));
                });
            };

            $scope.isCommanderBoardingItem = function (item) {
                if (!item) return false;

                var itemType = parseInt(item.itemType, 10);
                if (!isNaN(itemType)) return itemType === 0;

                var typeName = (item.itemTypeName || '').toString().trim().toUpperCase();
                return typeName === 'COM' || typeName === 'COMMANDER';
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
                    return row.itemNo == null || row.itemNo === '';
                });

                if (emptyRows.length < unitsToLoad.length) {
                    alert('Not enough empty TS_20 rows to load all selected units.');
                    return;
                }

                var selectedShips = $scope.getSelectedBoardingShips();
                if (!selectedShips.length) {
                    alert('Select at least one ship before loading units.');
                    return;
                }

                var fleetNo = $scope.getFirstSelectedShipFleetNo();
                var hasCommander = unitsToLoad.some(function (unit) {
                    return $scope.isCommanderBoardingItem(unit);
                });
                var commanderShipNo = null;

                if (hasCommander) {
                    if (selectedShips.length !== 1) {
                        alert('Commanders can only load onto one individual ship. Select exactly one ship.');
                        return;
                    }

                    commanderShipNo = parseInt(selectedShips[0].itemNo, 10);
                    if (isNaN(commanderShipNo) || commanderShipNo <= 0) {
                        alert('Selected ship is invalid for commander boarding.');
                        return;
                    }
                }

                for (var i = 0; i < unitsToLoad.length; i++) {
                    var row = emptyRows[i];
                    var unit = unitsToLoad[i];
                    var unitNo = unit.originalItemNo != null ? unit.originalItemNo : unit.itemNo;

                    row.command = null;
                    row.itemNo = unitNo;
                    row.fleetNo = $scope.isCommanderBoardingItem(unit)
                        ? commanderShipNo
                        : (fleetNo != null ? fleetNo : null);
                    row.fleetOwner = null;
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

                return boardingRow.command != null || boardingRow.itemNo != null || boardingRow.fleetNo != null;
            };

            $scope.removeBoardingRow = function (row) {
                if (!row || !row.entity) return;

                row.entity.command = null;
                row.entity.itemNo = null;
                row.entity.fleetNo = null;
                row.entity.fleetOwner = null;

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
