'use strict';

//https://www.youtube.com/playlist?list=PL5586336C26BDB324 JAVASCRIPT VIDEOS

function sendRegionalMapFile(file) {
    console.log(file.type);

    var data = new FormData();
    data.append("file1", file);

    $.ajax({
        type: 'post',
        url: '/Austerlitz/api/RulesCatalogApi/RegionalMapFilePost',
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

austerlitzModule.controller("turnMapsController", function ($scope, $routeParams, turnReportFactory, rulesCatalogFactory, turnSheetFactory) {

    turnReportFactory.getMapCoordinates().then(function (mapCoordinates) {
        $scope.mapCoordinates = mapCoordinates;
    });

    turnSheetFactory.getTSMovement().then(function (tsMovementList) {
        $scope.tsMovementList = tsMovementList;
    });

    $scope.saveTSMovement = function () {
        turnSheetFactory.postTSRecords($scope.tsMovementList, 'Movement').then(function (returnTsMovementList) {
            $scope.tsMovementList = returnTsMovementList;
        });
    }

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



    $scope.rhsColWidth = "col-md-12";

    $scope.mapChoice = [{ mapName: 'Europe Full', mapId: 'E', rangeMinX: 1, rangeMaxX: 80, minX: 1, maxX: 80, rangeMinY: 1, rangeMaxY: 65, minY: 1, maxY: 65 },
                        { mapName: 'Europe West', mapId: 'EW', rangeMinX: 1, rangeMaxX: 40, minX: 1, maxX: 40, rangeMinY: 1, rangeMaxY: 65, minY: 20, maxY: 65 },
                        { mapName: 'Europe East', mapId: 'EE', rangeMinX: 41, rangeMaxX: 80, minX: 41, maxX: 80, rangeMinY: 1, rangeMaxY: 65, minY: 1, maxY: 65 },
                        { mapName: 'Caribbean', mapId: 'C', rangeMinX: 1, rangeMaxX: 40, minX: 1, maxX: 40, rangeMinY: 70, rangeMaxY: 99, minY: 70, maxY: 99 },
                        { mapName: 'India', mapId: 'I', rangeMinX: 51, rangeMaxX: 90, minX: 51, maxX: 90, rangeMinY: 70, rangeMaxY: 99, minY: 70, maxY: 99 }
                        ];
    $scope.selectedMapChoice = $scope.mapChoice[1];

    $scope.mapOptions = ['State', 'Population', 'ProductionSite', 'Owner', 'Terrain', 'Bonus'];
    $scope.selectedMapOptions = ['State', 'Terrain'];

    $scope.displayOptions = [{name: 'Terrain', state: false, population: false, productionSite : false, owner : false, terrain : true, bonus : true},
                             {name: 'State', state: true, population: true, productionSite : true, owner : false, terrain : false, bonus : false},
                             {name: 'ProductionSite', state: false, population: false, productionSite: true, owner: false, terrain: true, bonus: true },
                             {name: 'Movement', state: true, population: false, productionSite : false, owner : false, terrain : true, bonus : false}];
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
        var coord = $scope.getCoordinateByXY(x, y);
        $scope.selectedCoordinateDetails = "(X:" + x + ",Y: " + y + ") " + coord.state + coord.population + coord.productionSite + " - " + coord.owner + coord.terrain + coord.bonus;
    }

    $scope.coordinateDblClick = function (x, y) {
        var startCoord = $scope.getCoordinateByXY(x, y);
        var maxDistance = 32;

        for (var dir = 1; dir < 9; dir++) {
            $scope.getCoordinatesInADirection(dir, startCoord, maxDistance);
        }
    }


    $scope.movementClickRow = function (row) {
        $scope.clearDisplayField();

        var item = { itemNo: 61, mpUsed: 0, mp: 40, x: 13, y: 14 };

        var initialCoord = $scope.getCoordinateByXY(item.x, item.y); // get from the item
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
        }

        row.entity.mpUsed = item.mpUsed;
    }

    $scope.getCoordinatesInADirection = function (requiredDirection, requiredDistance, beginCoordinate, item, className) {
        var nextCoordinate = beginCoordinate;
        var travelledDistance = 0;
        var travelledMP = 0;

        while (travelledDistance < requiredDistance && nextCoordinate.x >= $scope.selectedMapChoice.rangeMinX && nextCoordinate.x <= $scope.selectedMapChoice.rangeMaxX && nextCoordinate.y >= $scope.selectedMapChoice.rangeMinY && nextCoordinate.y <= $scope.selectedMapChoice.rangeMaxY) {
            var nextCoordinate = $scope.getNextCoordinate(requiredDirection, nextCoordinate);
            var nextMoveCostMP = $scope.getTerrainMP(nextCoordinate.terrain);

            travelledMP = travelledMP + nextMoveCostMP;
            item.mpUsed = item.mpUsed + nextMoveCostMP;
            travelledDistance++;

            if (nextMoveCostMP <= (item.mp - item.mpUsed)) {
                nextCoordinate.displayField = className;
            } else {
                nextCoordinate.displayField = 'moveInvalid';
            }
        }

        return nextCoordinate;
    }

    $scope.clearDisplayField = function() {
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

    $scope.defineCoordClass = function (terrain, state, population, productionSite, bonusSymbol, displayField) {
        switch ($scope.selectedDisplayOption.name) {
            case 'Movement':
                return displayField;
            case 'Terrain' : 
                return (terrain == '.' || terrain == '*' || terrain == '+') ? 'terrain_sea' : 'terrain_' + terrain;
            case 'State':
                return 'state_' + state;
            case 'ProductionSite':
                if ($scope.selectedState == null || state == $scope.selectedState.state) {

                    if (".+*".indexOf(terrain) > -1 )
                        return 'terrain_sea';
                    else if ($scope.selectedProductionSite.bonusSymbol == bonusSymbol) {
                        if (productionSite.trim().length > 0) return 'prodSite_Existing';
                        if (population < $scope.selectedProductionSite.minPopulation) return 'prodSite_TooFew';
                        if (population > $scope.selectedProductionSite.maxPopulation) return 'prodSite_TooMany';
                        return 'prodSite_Yes';
                    } 
                    else if ($scope.selectedProductionSite.terrain.indexOf(terrain) > -1) {
                        if (population < $scope.selectedProductionSite.minPopulation) return 'prodSite_TooFew';
                        if (population > $scope.selectedProductionSite.maxPopulation) return 'prodSite_TooMany';
                        if ($scope.selectedProductionSite.siteTypeNo == "1") {
                            if (productionSite.trim().length > 0)
                                return 'prodSite_Yes';
                            else
                                return ' ';
                        }
                        if (productionSite.trim().length > 0) return 'prodSite_Existing';

                        return 'prodSite_Yes';

                    } else if ($scope.selectedProductionSite.siteTypeNo == "21") {
                        if (productionSite.trim().length > 0 && $scope.selectedProductionSite.terrain.indexOf(productionSite) > -1)
                            return 'prodSite_Yes';
                        else
                            return ' ';
                    }
                }
        }
    };
        
    $scope.filterMapFn = function (col) {

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
        rowHeight : 25,
        columnDefs: 'movementColumnDefsMap',
        //selectedItems: $scope.bgSelections,
        enableCellSelection: true,
        enableRowSelection: true,
        enableCellEdit: true,
        multiSelect: false, 
        rowTemplate: '<div ng-click="movementClickRow(row)" ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>',
    };



    $scope.movementColumnDefsMap = [
    { field: 'orderNo', displayName: 'No', width: '30px', cellClass: 'grid-center-align' },
    { field: 'itemNo', displayName: 'Item No', width: '55px', cellClass: 'grid-center-align' },
    { field: 'direction1', displayName: 'Dir1', width: '40px', cellClass: 'grid-center-align' },
    { field: 'distance1', displayName: 'Dist1', width: '40px', cellClass: 'grid-center-align' },
    { field: 'direction2', displayName: 'Dir2', width: '40px', cellClass: 'grid-center-align' },
    { field: 'distance2', displayName: 'Dist2', width: '40px', cellClass: 'grid-center-align' },
    { field: 'direction3', displayName: 'Dir3', width: '40px', cellClass: 'grid-center-align' },
    { field: 'distance3', displayName: 'Dist3', width: '40px', cellClass: 'grid-center-align' },
    { field: 'mp', displayName: 'MP', width: '35px', cellClass: 'grid-center-align' },
    { field: 'mpUsed', displayName: 'Used', width: '55px', cellClass: 'grid-center-align' },
    { field: 'xy', displayName: 'X/Y', width: '40px', cellClass: 'grid-center-align' },

    ];

});