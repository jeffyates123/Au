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

austerlitzModule.controller("turnMapsController", function ($scope, $routeParams, turnReportFactory, rulesCatalogFactory, turnSheetFactory, masterData) {

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

    turnReportFactory.getMapCoordinates($scope.masterData.turnId).then(function (mapCoordinates) {
        $scope.mapCoordinates = mapCoordinates;
        $scope.attachUnitsToMapCoordinates();
    });

    turnSheetFactory.getTSMovement($scope.masterData.turnId).then(function (tsMovementList) {
        $scope.tsMovementList = tsMovementList;
    });

    rulesCatalogFactory.getRefProductionSites().then(function (productionSiteList) {
        $scope.productionSiteList = productionSiteList;
        $scope.selectedProductionSite = productionSiteList[5];
    });

    rulesCatalogFactory.getRefStates().then(function (stateList) {
        $scope.stateList = stateList;
        $scope.selectedState = $scope.stateList[3];
    });

    rulesCatalogFactory.getRefTerrain().then(function (terrainList) {
        $scope.terrainList = terrainList;
    });

    $scope.saveTSMovement = function () {
        turnSheetFactory.postTSRecords($scope.tsMovementList, 'Movement').then(function (returnTsMovementList) {
            $scope.tsMovementList = returnTsMovementList;
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
                             { name: 'Movement', state: true, population: true, productionSite: true, owner: false, terrain: true, bonus: false }];
    $scope.selectedDisplayOption = $scope.displayOptions[3];

    $scope.changeDisplayOption = function () {
        var selectedOptions = [];

        if ($scope.selectedDisplayOption.state) selectedOptions.push('State');
        if ($scope.selectedDisplayOption.population) selectedOptions.push('Population');
        if ($scope.selectedDisplayOption.productionSite) selectedOptions.push('ProductionSite');
        if ($scope.selectedDisplayOption.owner) selectedOptions.push('Owner');
        if ($scope.selectedDisplayOption.terrain) selectedOptions.push('Terrain');
        if ($scope.selectedDisplayOption.bonus) selectedOptions.push('Bonus');

        $scope.selectedMapOptions = selectedOptions;
    };

    $scope.toggleSelection = function toggleSelection(mapOption) {
        var idx = $scope.selectedMapOptions.indexOf(mapOption);

        // is currently selected
        if (idx > -1)
            $scope.selectedMapOptions.splice(idx, 1);
        else
            $scope.selectedMapOptions.push(mapOption);
    };

    $scope.coordinateClick = function (x, y) {
        if ($scope.pendingRouteSelection) {
            var routeKey = x + '_' + y;
            var selectedRoute = $scope.pendingRouteSelection.routesByCoord[routeKey];

            if (selectedRoute) {
                $scope.applyRouteToMovementRow($scope.pendingRouteSelection.row, selectedRoute.segments);
            }

            $scope.pendingRouteSelection = null;
            $scope.clearRouteCandidates();
        }

        var coord = $scope.getCoordinateByXY(x, y);
        $scope.selectedCoordinateDetails = "(X:" + x + ",Y: " + y + ") " + coord.state + coord.population + coord.productionSite + " - " + coord.owner + coord.terrain + coord.bonus;
        $scope.selectedItemGridCoordinate = { x: x, y: y };
        $scope.refreshItemGridRows();
    }

    $scope.coordinateDblClick = function (x, y) {
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
            var item = { itemNo: selectedItem.itemNo, mpUsed: 0, mp: selectedItem.mp, x: selectedItem.x, y: selectedItem.y };

            var initialCoord = $scope.getCoordinateByXY(item.x, item.y); // get from the item

            if (initialCoord != null) {
                $scope.selectedMovementItemCoordinate = { x: item.x, y: item.y };
                row.entity.itemNo = item.itemNo;
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

    $scope.isShipItem = function (item) {
        if (!item) return false;

        var itemTypeName = item.itemTypeName || $scope.getItemTypeName(item.itemType);
        return itemTypeName === 'Warship' || itemTypeName === 'MerchantShip';
    };

    $scope.isShipyardCoordinate = function (coord) {
        if (!coord || !coord.productionSite) return false;

        return coord.productionSite.toString().toUpperCase() === 'S';
    };

    $scope.getTerrainMPForItem = function (coord, item) {
        var terrain = coord.terrain;
        var isSea = '*+.'.indexOf(terrain) > -1;
        var isShip = $scope.isShipItem(item);

        if (isShip) {
            if (isSea || $scope.isShipyardCoordinate(coord)) {
                return 1;
            }
            return 999;
        }

        if (isSea) {
            return 999;
        }

        return $scope.getTerrainMP(terrain);
    };

    $scope.getItemFromItemNo = function (itemNo) {
        var rtnItem = {};

        angular.forEach($scope.masterData.turnReport.movementItemList, function (item, index) {
            if (item.itemNo == itemNo)
                rtnItem = item;
        });

        return rtnItem;
    }

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
                item.itemTypeName = $scope.getItemTypeName(item.itemType);
                item.xy = item.x + '/' + item.y;
                return item;
            });

        $scope.refreshItemGridRows();
    };

    $scope.refreshItemGridRows = function () {
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

    $scope.itemGridClickRow = function (row) {
        if (!row || !row.entity || !row.entity.itemNo || !$scope.tsMovementList) {
            return;
        }

        var selectedItemNo = row.entity.itemNo;
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
            firstAvailableRow.type = row.entity.itemTypeName;
            firstAvailableRow.mp = row.entity.mp;
            firstAvailableRow.mpUsed = 0;
            firstAvailableRow.xy = row.entity.xy;
        }
    };

    $scope.isItemAlreadyInMovementGrid = function (itemNo) {
        if (!itemNo || !$scope.tsMovementList) {
            return false;
        }

        return $scope.tsMovementList.some(function (movementRow) {
            return movementRow.itemNo == itemNo;
        });
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

    $scope.$watch('selectedMapChoice', function () {
        $scope.refreshFilteredMovementItemsForMap();
    }, true);

    $scope.$watch('masterData.turnReport.movementItemList', function () {
        $scope.refreshFilteredMovementItemsForMap();
    }, true);

    $scope.getCoordinatesInADirection = function (requiredDirection, requiredDistance, beginCoordinate, item, className) {
        var nextCoordinate = beginCoordinate;
        var travelledDistance = 0;
        var travelledMP = 0;

        while (travelledDistance < requiredDistance && nextCoordinate.x >= $scope.selectedMapChoice.rangeMinX && nextCoordinate.x <= $scope.selectedMapChoice.rangeMaxX && nextCoordinate.y >= $scope.selectedMapChoice.rangeMinY && nextCoordinate.y <= $scope.selectedMapChoice.rangeMaxY) {
            var nextCoordinate = $scope.getNextCoordinate(requiredDirection, nextCoordinate);
            var nextMoveCostMP = $scope.getTerrainMP(nextCoordinate.terrain);

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

    $scope.defineCoordClass = function (terrain, state, population, productionSite, bonusSymbol, displayField, units, x, y, routeCandidate) {
        var baseClass = '';

        switch ($scope.selectedDisplayOption.name) {
            case 'Movement':
                baseClass = (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea' : 'terrain_' + terrain;
                if (displayField) {
                    baseClass = baseClass + ' ' + displayField;
                }
                break;
            case 'Terrain':
                baseClass = (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea unitExists' : 'terrain_' + terrain;
                break;
            case 'State':
                baseClass = 'state_' + state;
                break;
            case 'ProductionSite':
                if ($scope.selectedState == null || state == $scope.selectedState.state) {

                    if (".+*".indexOf(terrain) > -1)
                        baseClass = 'terrain_sea';
                    else if ($scope.selectedProductionSite.bonusSymbol == bonusSymbol) {
                        if (productionSite.trim().length > 0) baseClass = 'prodSite_Existing';
                        else if (population < $scope.selectedProductionSite.minPopulation) baseClass = 'prodSite_TooFew';
                        else if (population > $scope.selectedProductionSite.maxPopulation) baseClass = 'prodSite_TooMany';
                        else baseClass = 'prodSite_Yes';
                    }
                    else if ($scope.selectedProductionSite.terrain.indexOf(terrain) > -1) {
                        if (population < $scope.selectedProductionSite.minPopulation) baseClass = 'prodSite_TooFew';
                        else if (population > $scope.selectedProductionSite.maxPopulation) baseClass = 'prodSite_TooMany';
                        if ($scope.selectedProductionSite.siteTypeNo == "1") {
                            if (productionSite.trim().length > 0)
                                baseClass = 'prodSite_Yes';
                            else
                                baseClass = ' ';
                        }
                        if (productionSite.trim().length > 0) baseClass = 'prodSite_Existing';
                        else baseClass = 'prodSite_Yes';

                    } else if ($scope.selectedProductionSite.siteTypeNo == "21") {
                        if (productionSite.trim().length > 0 && $scope.selectedProductionSite.terrain.indexOf(productionSite) > -1)
                            baseClass = 'prodSite_Yes';
                        else
                            baseClass = ' ';
                    }
                }
                break;
        }

        if (units && units.length > 0) {
            baseClass = (baseClass ? baseClass + ' ' : '') + 'unit_Exists';
        }

        if ($scope.selectedMovementItemCoordinate
            && $scope.selectedMovementItemCoordinate.x == x
            && $scope.selectedMovementItemCoordinate.y == y) {
            baseClass = (baseClass ? baseClass + ' ' : '') + 'movementItemSelected';
        }

        if (routeCandidate) {
            baseClass = (baseClass ? baseClass + ' ' : '') + 'routeCandidate';
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
        rowTemplate: '<div ng-click="itemGridClickRow(row)" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}} {{isItemAlreadyInMovementGrid(row.entity.itemNo) ? \"itemGridRowAlreadyAdded\" : \"\"}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>'
    };

    $scope.movementColumnDefsMap = [
        { field: 'orderNo', displayName: 'No', width: '30px', cellClass: 'grid-center-align' },

        {
            field: 'itemNo', displayName: 'Item No', width: '55px', cellClass: 'grid-center-align',
            enableFocusedCellEdit: true, editableCellTemplate: '/Templates/itemSelectTemplate.html'
        },
        { field: 'type', displayName: 'Type', width: '80px', cellClass: 'grid-center-align' },

        { field: 'direction1', displayName: 'Dir1', width: '40px', cellClass: 'grid-center-align' },
        { field: 'distance1', displayName: 'Dist1', width: '40px', cellClass: 'grid-center-align' },
        { field: 'direction2', displayName: 'Dir2', width: '40px', cellClass: 'grid-center-align' },
        { field: 'distance2', displayName: 'Dist2', width: '40px', cellClass: 'grid-center-align' },
        { field: 'direction3', displayName: 'Dir3', width: '40px', cellClass: 'grid-center-align' },
        { field: 'distance3', displayName: 'Dist3', width: '40px', cellClass: 'grid-center-align' },
        { field: 'mp', displayName: 'MP', width: '35px', cellClass: 'grid-center-align' },
        { field: 'mpUsed', displayName: 'Used', width: '40px', cellClass: 'grid-center-align' },
        { field: 'xy', displayName: 'X/Y', width: '50px', cellClass: 'grid-center-align' },
    ];

    $scope.itemColumnDefsMap = [
        { field: 'itemNo', displayName: 'Item No', width: '55px', cellClass: 'grid-center-align' },
        { field: 'itemTypeName', displayName: 'Type', width: '80px', cellClass: 'grid-center-align' },
        { field: 'xy', displayName: 'X/Y', width: '60px', cellClass: 'grid-center-align' },
        { field: 'description', displayName: 'Description', cellClass: 'grid-left-align' }
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