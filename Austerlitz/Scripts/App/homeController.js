'use strict';

function sendFile(file) {
    console.log(file.type);

    var data = new FormData();
    data.append("file1", file);

    $.ajax({
        type: 'post',
        url: '/Austerlitz/api/FileLoadApi/FilePost',
        data: data,
        success: function (results) {

            var scope = angular.element($("#mapPanel")).scope();
            scope.$apply(function () {
                //                console.log(JSON.stringify(results, null, 2));
                if (!results.armyA.state) {
                    results = "";
                } else {
                    scope.results = results;
                    scope.toggleHostArmy();
                }
            });
        },
        error: function () {
            alert("Error while invoking the Web API");
        },
        contentType: false,
        processData: false
    });
};

austerlitzModule.factory('homeFactory', function ($http, $q) {
    return {
        postNewSimBattle: function (data) {
            var deferred = $q.defer();
            $http.post('/Austerlitz/api/FileSaveApi/PostNewSimBattle', JSON.stringify(data),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        }
    }
});


austerlitzModule.controller("homeController", function ($scope, $routeParams, homeFactory) {
    //http://stackoverflow.com/questions/17270109/how-to-refresh-ng-grid-when-griddata-has-different-number-of-columns-from-previo
    //http://stackoverflow.com/questions/18504761/angular-nggrid-select-row-on-page-load SMELLY AND NON_SMELLY! :)


    $scope.saveNewSimBattle = function () {
        homeFactory.postNewSimBattle($scope.results);
        $scope.saveturnNow = true;
    };

    $scope.bgSelections = [];
    $scope.columnDefs = [];
    $scope.saveturnNow = false;

    $scope.init = function () {
        $scope.columnDefs = $scope.columnDefsMap;
        $scope.results = "";
        $scope.fedDestNo = 0;
        $scope.armyASelected = true;
        $scope.army = [];
        $scope.toggleArmy();
        $scope.displayMap = false;
        $scope.toggleSimSheet_Map();
    };

    $scope.toggleSimSheet_Map = function () {
        $scope.displayMap = !$scope.displayMap;

        if ($scope.displayMap) {
            $scope.lhsColWidth = "col-md-4";
            $scope.rhsColWidth = "col-md-8";
            $scope.columnDefs = $scope.columnDefsMap;
        } else {
            $scope.lhsColWidth = "col-md-12";
            $scope.rhsColWidth = "col-md-0";
            $scope.columnDefs = $scope.columnDefsTurnSheet;

        }
    };

    $scope.gridOptions = {
        data: 'army.battalionGroups',
        headerRowHeight: 50,
        columnDefs: 'columnDefs',
        selectedItems: $scope.bgSelections,
        enableCellSelection: true,
        enableRowSelection: true,
        enableCellEdit: true,
        multiSelect: true, //also true!
        rowTemplate: '<div ng-dblclick="onDblClickRow(row)" ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>',
    };

    $scope.columnDefsMap = [
    { field: 'federation', displayName: 'Fd', width: '30px', cellClass: 'grid-center-align' },
    { field: 'type', displayName: 'Tp', width: '35px', cellClass: 'grid-center-align' },
    { field: 'totalEF', displayName: 'EF', width: '40px', cellClass: 'grid-center-align' },
    //{ field: 'percentMaxSize', displayName: '% Max', width: '50px' },
    //{ field: 'totalSize', displayName: 'Size', width: '45px', cellClass: 'grid-center-align' },
    { field: 'battGroup', displayName: 'Bg', width: '30px', cellClass: 'grid-center-align' },
    { field: 'dest0.x', displayName: 'X 0', width: '30px', cellClass: 'grid-center-align' },
    { field: 'dest0.y', displayName: 'Y 0', width: '30px', cellClass: 'grid-center-align' },
    { field: 'startAttack', displayName: 'St Att', width: '30px', cellClass: 'grid-center-align' },
    { field: 'order', displayName: 'Ord', width: '38px', cellClass: 'grid-center-align' },
    { field: 'additionalOrder', displayName: 'Add Ord', width: '38px', cellClass: 'grid-center-align' },
    { field: 'formation', displayName: 'Fm', width: '34px', cellClass: 'grid-center-align' },
    { field: 'dest1.x', displayName: 'X 1', width: '30px', cellClass: 'grid-center-align' },
    { field: 'dest1.y', displayName: 'Y 1', width: '30px', cellClass: 'grid-center-align' },
    { field: 'dest2.x', displayName: 'X 2', width: '30px', cellClass: 'grid-center-align' },
    { field: 'dest2.y', displayName: 'Y 2', width: '30px', cellClass: 'grid-center-align' },
    ];



    $scope.toggleArmy = function () {
        console.log("switching army");
        console.log("Grid Options " + $scope.gridOptions);
        $scope.armyASelected = !$scope.armyASelected;

        if ($scope.armyASelected)
            $scope.army = $scope.results.armyA;
        else
            $scope.army = $scope.results.armyB;
    };

    $scope.toggleHostArmy = function () {
        $scope.armyASelected = ($scope.results.armyA.state == $scope.results.state);

        if ($scope.armyASelected)
            $scope.army = $scope.results.armyA;
        else
            $scope.army = $scope.results.armyB;
    };

    $scope.columnDefsTurnSheet =  [
            { field: 'federation', displayName: 'Fd', width: '30px', cellClass: 'grid-center-align' },
            { field: 'type', displayName: 'Tp', width: '35px', cellClass: 'grid-center-align' },
            { field: 'totalEF', displayName: 'EF', width: '40px', cellClass: 'grid-center-align' },
            //{ field: 'percentMaxSize', displayName: '% Max', width: '50px' },
            { field: 'totalSize', displayName: 'Size', width: '45px', cellClass: 'grid-center-align' },
            { field: 'battGroup', displayName: 'Bg', width: '30px', cellClass: 'grid-center-align' },
            { field: 'dest0.x', displayName: 'Dest0 X', width: '60px', cellClass: 'grid-center-align' },
            { field: 'dest0.y', displayName: 'Dest0 Y', width: '60px', cellClass: 'grid-center-align' },
            { field: 'startAttack', displayName: 'Start Attack', width: '60px', cellClass: 'grid-center-align'},
            { field: 'order', displayName: 'Order', width: '60px', cellClass: 'grid-center-align' },
            { field: 'additionalOrder', displayName: 'Add Ord', width: '50px', cellClass: 'grid-center-align' },
            { field: 'formation', displayName: 'Formation', width: '90px', cellClass: 'grid-center-align' },
            { field: 'dest1.x', displayName: 'Dest1 X', width: '60px', cellClass: 'grid-center-align' },
            { field: 'dest1.y', displayName: 'Dest1 Y', width: '60px', cellClass: 'grid-center-align' },
            { field: 'dest2.x', displayName: 'Dest2 X', width: '60px', cellClass: 'grid-center-align' },
            { field: 'dest2.y', displayName: 'Dest2 Y', width: '60px', cellClass: 'grid-center-align' },

            { field: 'altCondition', displayName: 'Alt Condition', width: '100px', cellClass: 'grid-center-align-altcondition' },
            { field: 'altOrder', displayName: 'Order', width: '60px', cellClass: 'grid-center-align' },
            { field: 'altAdditionalOrder', displayName: 'Add Ord', width: '50px', cellClass: 'grid-center-align' },
            { field: 'altFormation', displayName: 'Formation', width: '90px', cellClass: 'grid-center-align' },
            { field: 'altDest1.x', displayName: 'Dest1 X', width: '60px', cellClass: 'grid-center-align' },
            { field: 'altDest1.y', displayName: 'Dest1 Y', width: '60px', cellClass: 'grid-center-align' },
            { field: 'altDest2.x', displayName: 'Dest2 X', width: '60px', cellClass: 'grid-center-align' },
            { field: 'altDest2.y', displayName: 'Dest2 Y', width: '60px', cellClass: 'grid-center-align' },
    ];

    $scope.populateSelectedRows = function () {

        if ($scope.bgSelections.length > 0) {

            angular.forEach($scope.bgSelections, function (selectedBg, index) {

                angular.forEach($scope.army.battalionGroups, function (bg, index) { // populate the bg with the selected value from the model
                    if (selectedBg.federation == bg.federation) {
                        if ($scope.selectedOrder >= 0)
                            bg.order = $scope.selectedOrder;

                        if ($scope.selectedAdditionalOrder >= 0)
                            bg.additionalOrder = $scope.selectedAdditionalOrder;

                        if ($scope.selectedFormation >= 0)
                            bg.formation = $scope.selectedFormation;

                        if ($scope.selectedAltOrder >= 0)
                            bg.altOrder = $scope.selectedAltOrder;

                        if ($scope.selectedAltAdditionalOrder >= 0)
                            bg.altAdditionalOrder = $scope.selectedAltAdditionalOrder;

                        if ($scope.selectedAltFormation >= 0)
                            bg.altFormation = $scope.selectedAltFormation;
                    }
                });
            });

            $scope.gridOptions.selectAll(false)
        }
    }

    $scope.$on('populateBGGrid', function (populateBGGrid, selectedItem, chosenList) {
        console.log(selectedItem.itemNo + " Chosen List: " + chosenList);

        if (chosenList == 'order')
            $scope.selectedOrder = selectedItem.itemNo;
        else if (chosenList == 'additionalOrder')
            $scope.selectedAdditionalOrder = selectedItem.itemNo;
        else if (chosenList == 'formation')
            $scope.selectedFormation = selectedItem.itemNo;
        else if (chosenList == 'altOrder')
            $scope.selectedAltOrder = selectedItem.itemNo;
        else if (chosenList == 'altAdditionalOrder')
            $scope.selectedAltAdditionalOrder = selectedItem.itemNo;
        else if (chosenList == 'altFormation')
            $scope.selectedAltFormation = selectedItem.itemNo;

        $scope.populateSelectedRows();
    });

    $scope.onDblClickRow = function (ngRow) {
        $scope.populateSelectedRows();
    }



    $scope.changeFedDestNo = function (fedDestNo) {
        var breakLoop = false;

        angular.forEach($scope.results.map, function (mapcol, index) { // reset all federation values on the map
            angular.forEach(mapcol, function (coordinate, index) {
                coordinate.federation = 0;
            });
        });

        angular.forEach($scope.army.battalionGroups, function (bg, index) { 
            breakLoop = false;
            angular.forEach($scope.results.map, function (mapcol, index) { // update the federation of the coordinate
                angular.forEach(mapcol, function (coordinate, index) {

                    if (!breakLoop && $scope.BGAndMapCoordinatesMatch(coordinate, bg)) {
                        coordinate.federation = bg.federation;
                        breakLoop = true;
                    };

                });
            });
        });
    }

    $scope.coordinateClick = function (x, y) {
        $scope.selectedCoordinate = "(X " + x + ", Y " + y + ")";

        if (x > 0 && y > 0) {
            var clickedCoordinate = $scope.getCoordinateByXY(x, y);  // get the clickedcoordinate
            var clickedCoordinateBG = $scope.getBattalionGroupByFederation(clickedCoordinate.federation); // get the BG of the clicked coordinate IF ANY
            var selectedBG = $scope.bgSelections.shift();
            // && clickedCoordinate.federation != selectedBG
            if (clickedCoordinate.federation > 0) { // 1. coordinate clicked has a federation already allocated, remove and add back to BG list, clearing its Dest coordinate
                clickedCoordinate.federation = 0;
                $scope.setBattalionGroupXY(0, 0, clickedCoordinateBG);
                $scope.selectBgGridByBg(clickedCoordinateBG, true);
            }

            if (selectedBG) { // selections exist on the BG list
                var existingFedCoordinate = $scope.getCoordinateByFederation(selectedBG.federation); // 2. Clear the federation if it exists on another coordinate

                if (existingFedCoordinate) existingFedCoordinate.federation = 0;

                clickedCoordinate.federation = selectedBG.federation; // 3. set federation of clicked coordinate
                $scope.setBattalionGroupXY(x, y, selectedBG);  // & set clicked coordinate on battalion group
                $scope.selectBgGridByBg(selectedBG, false);  // remove from BG list
            }
        }
    };

    $scope.selectBgGridByBg = function (bg, selectRow) {
        var indexOfBG = $scope.army.battalionGroups.indexOf(bg);
        $scope.gridOptions.selectItem(indexOfBG, selectRow);
    };

    $scope.getBattalionGroupByFederation = function (federation) {
        var breakLoop = false;
        var rtnBg = null;

        angular.forEach($scope.army.battalionGroups, function (bg, index) {
            if (breakLoop == false && bg.federation == federation) {
                rtnBg = bg;
                breakLoop = true;
            }
        });
        return rtnBg;
    };

    $scope.getCoordinateByXY = function (x, y) {
        var breakLoop = false;
        var rtnCoordinate = null;

        angular.forEach($scope.results.map, function (mapcol, index) {
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

    $scope.getCoordinateByFederation = function (federation) {
        var breakLoop = false;
        var rtnCoordinate = null;

        angular.forEach($scope.results.map, function (mapcol, index) {
            if (breakLoop == false) {
                angular.forEach(mapcol, function (coordinate, index) {
                    if (coordinate.federation == federation) {
                        rtnCoordinate = coordinate;
                        breakLoop = true;
                    }

                });
            }
        });
        return rtnCoordinate;
    };

    $scope.setBattalionGroupXY = function (x, y, bg) {
        if ($scope.fedDestNo == 0) {
            bg.dest0.x = x;
            bg.dest0.y = y;

        } else if ($scope.fedDestNo == 1) {
            bg.dest1.x = x;
            bg.dest1.y = y;

        } else if ($scope.fedDestNo == 2) {
            bg.dest2.x = x;
            bg.dest2.y = y;
        }
    };

    $scope.HaveBGAndMapXYMatch = function (coordinate, bg) {
        if ($scope.fedDestNo == 0) {
            return (coordinate.x == bg.dest0.x && coordinate.y == bg.dest0.y);

        } else if ($scope.fedDestNo == 1) {
            return (coordinate.x == bg.dest1.x && coordinate.y == bg.dest1.y);

        } else if ($scope.fedDestNo == 2) {
            return (coordinate.x == bg.dest2.x && coordinate.y == bg.dest2.y);
        }
    };
    


    //$scope.coordinateClick = function (x, y, selectedFederationNo) {

    //    if (x > 0 && y > 0) {
    //        $scope.selectedCoordinate = "(X " + x + ", Y " + y + ")";

    //        if ($scope.bgSelections.length == 0) { // remove from map, reselect BG on ng-grid
    //            var newCoordinate = $scope.getCoordinateByXY(x, y);
    //            newCoordinate.federation = 0;

    //            selectedBG = $scope.getBattalionGroupByFederation(selectedFederationNo);
    //            selectBgGridByBg(selectedBG);
    //        } else {
    //            if ($scope.bgSelections.length > 0) {
    //                var selectedBG = $scope.bgSelections.shift();

    //                $scope.gridOptions.selectItem($scope.army.battalionGroups.indexOf(selectedBG));

    //                angular.forEach($scope.army.battalionGroups, function (bg, index) { // update the battalion group list
    //                    if (bg.federation == selectedBG.federation) {

    //                        angular.forEach($scope.results.map, function (mapcol, index) { // update the federation on the selected coordinate
    //                            angular.forEach(mapcol, function (coordinate, index) {

    //                                if (coordinate.x == x && coordinate.y == y) {
    //                                    if (coordinate.federation != 0) { // coordinate already has a federation on it
    //                                        angular.forEach($scope.army.battalionGroups, function (bg, index) {  // so clear that battalion group coordinate by setting to 0
    //                                            if (bg.federation == coordinate.federation) {
    //                                                $scope.setBattalionGroupXY(0, 0, bg);

    //                                                var indexOfBG = $scope.army.battalionGroups.indexOf(bg); // re-select the battalion group in the list
    //                                                $scope.gridOptions.selectItem(indexOfBG, true);
    //                                            }
    //                                        });
    //                                    }

    //                                    coordinate.federation = selectedBG.federation;
    //                                } else if ($scope.HaveBGAndMapXYMatch(coordinate, bg)) { // if the selected federation already in another coordinate
    //                                    coordinate.federation = 0;
    //                                };

    //                            });
    //                        });

    //                        $scope.setBattalionGroupXY(x, y, bg);
    //                    }
    //                });
    //            };
    //        }
    //    }
    //};

    
    $scope.results2 = {
        "map": [
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 1,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 2,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 3,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 4,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 5,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 6,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 7,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 8,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 9,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 10,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 11,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 12,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 13,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 14,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 15,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 16,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 17,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 18,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 19,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 20,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 21,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 22,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 23,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 24,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 25,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 26,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 27,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 28,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 29,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 30,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 31,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 32,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 33,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 34,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 35,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 36,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 37,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 38,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 39,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 40,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 41,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 42,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 43,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 44,
                "y": 0
            },
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 45,
                "y": 0
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 1,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 2,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 3,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 4,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 5,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 13,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 14,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 15,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 16,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 1
            },
            {
                "terrain": "$",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 23,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 24,
                "y": 1
            },
            {
                "terrain": "$",
                "height": 4,
                "federation": 0,
                "x": 25,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 26,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 27,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 28,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 29,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 30,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 31,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 32,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 33,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 1
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 1
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 1,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 2,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 3,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 4,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 5,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 13,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 15,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 2
            },
            {
                "terrain": "$",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 2
            },
            {
                "terrain": "$",
                "height": 4,
                "federation": 0,
                "x": 25,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 27,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 28,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 31,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 2
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 2
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 1,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 2,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 3,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 4,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 5,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 3
            },
            {
                "terrain": "$",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 4,
                "federation": 0,
                "x": 24,
                "y": 3
            },
            {
                "terrain": "$",
                "height": 4,
                "federation": 0,
                "x": 25,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 3
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 3
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 3
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 3
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 1,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 2,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 3,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 4,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 5,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 4
            },
            {
                "terrain": "$",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 4
            },
            {
                "terrain": "$",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 4
            },
            {
                "terrain": "$",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 4
            },
            {
                "terrain": "$",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 4
            },
            {
                "terrain": "$",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 4
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 4
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 4
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 4
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 1,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 2,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 3,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 4,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 5,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 5
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 5
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 5
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 5
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 1,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 2,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 3,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 4,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 5,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 6
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 6
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 6
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 6
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 6
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 6
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 4,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 5,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 7
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 7
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 7
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 7
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 7
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 7
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 7
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 7
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 4,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 5,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 8
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 8
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 8
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 8
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 8
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 8
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 8
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 8
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 8
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 8
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 8
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 8
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 8
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 8
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 4,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 5,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 9
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 9
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 9
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 9
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 9
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 9
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 9
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 9
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 9
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 9
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 9
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 9
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 9
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 9
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 9
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 10
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 10
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 10
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 10
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 10
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 10
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 10
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 10
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 10
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 10
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 10
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 10
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 11
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 11
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 11
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 11
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 11
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 11
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 11
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 11
            },
            {
                "terrain": "W",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 11
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 45,
                "y": 11
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 12
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 12
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 12
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 12
            },
            {
                "terrain": "b",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 12
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 12
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 13
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 13
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 9,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 13
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 13
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 14
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 14
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 14
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 6,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 7,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 8,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 42,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 15
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 15
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 16
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 16
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 12,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 17
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 17
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 43,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 18
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 18
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 44,
                "y": 19
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 19
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 20
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 20
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 21
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 21
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 21
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 21
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 21
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 21
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 22
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 22
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 22
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 22
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 22
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 22
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 22
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 6,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 23
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 23
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 23
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 1,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 2,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 3,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 4,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 5,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 6,
                "y": 24
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 24
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 24
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 24
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 24
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 24
            },
            {
                "terrain": "b",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 24
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 24
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 1,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 2,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 3,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 4,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 5,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 6,
                "y": 25
            },
            {
                "terrain": "#",
                "height": 1,
                "federation": 0,
                "x": 7,
                "y": 25
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 25
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 25
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 25
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 25
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 1,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 2,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 3,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 4,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 5,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 6,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 7,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 26
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 26
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 1,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 2,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 3,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 4,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 5,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 6,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 7,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 8,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 15,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 16,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 27
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 27
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 4,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 5,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 6,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 13,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 14,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 15,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 16,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 28
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 28
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 6,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 13,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 14,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 15,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 16,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 29
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 29
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 6,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 13,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 1,
                "federation": 0,
                "x": 14,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 30
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 30
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 23,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 24,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 25,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 31
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 31
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 34,
                "y": 31
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 35,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 36,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 31
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 31
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 19,
                "y": 32
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 20,
                "y": 32
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 22,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 32
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 33,
                "y": 32
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 32
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 32
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 32
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 18,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 33
            },
            {
                "terrain": "#",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 33
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 26,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 27,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 29,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 31,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 32,
                "y": 33
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 33
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 33
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 33
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 33
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 17,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 21,
                "y": 34
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 34
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 28,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 37,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 34
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 34
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 35
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 35
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 30,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 38,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 35
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 35
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 15,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 16,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 39,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 36
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 36
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 1,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 14,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 37
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 37
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 40,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 37
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 37
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 1,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 38
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 38
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 41,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 38
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 38
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 1,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 10,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 11,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 13,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 39
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 39
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 39
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 39
            }
          ],
          [
            {
                "terrain": null,
                "height": 0,
                "federation": 0,
                "x": 0,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 1,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 2,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 3,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 4,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 5,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 6,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 7,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 8,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 9,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 10,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 11,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 12,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 13,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 14,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 15,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 16,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 17,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 18,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 19,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 20,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 21,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 22,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 23,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 24,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 25,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 26,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 27,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 28,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 29,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 30,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 31,
                "y": 40
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 32,
                "y": 40
            },
            {
                "terrain": "#",
                "height": 3,
                "federation": 0,
                "x": 33,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 34,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 35,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 36,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 37,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 38,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 39,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 40,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 3,
                "federation": 0,
                "x": 41,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 42,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 43,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 44,
                "y": 40
            },
            {
                "terrain": ".",
                "height": 2,
                "federation": 0,
                "x": 45,
                "y": 40
            }
          ]
        ],
        "strategicPointsA": null,
        "strategicPointsB": null,
        "state": "Conf. of the Rhine",
        "armyA": {
            "state": "France",
            "playerAccountNo": null,
            "commander": {
                "commanderName": "Field Marshal MURAT",
                "capability": 19,
                "commandIsInFed": 0
            },
            "fortressEntrenchments": null,
            "battalionGroups": [
              {
                  "federation": 1,
                  "battGroup": 1,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Og",
                  "battalions": [
                    {
                        "ef": 12,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    }
                  ],
                  "totalEF": 10.5,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 2,
                  "battGroup": 2,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Og",
                  "battalions": [
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    }
                  ],
                  "totalEF": 10,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 3,
                  "battGroup": 3,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Og",
                  "battalions": [
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 368
                    },
                    {
                        "ef": 8,
                        "size": 368
                    }
                  ],
                  "totalEF": 9.4,
                  "totalSize": 2316,
                  "percentMaxSize": 72,
                  "isDeployed": false
              },
              {
                  "federation": 4,
                  "battGroup": 4,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gc",
                  "battalions": [
                    {
                        "ef": 11,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 10,
                        "size": 790
                    }
                  ],
                  "totalEF": 10.2,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 5,
                  "battGroup": 5,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gc",
                  "battalions": [
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 9,
                        "size": 790
                    },
                    {
                        "ef": 9,
                        "size": 790
                    },
                    {
                        "ef": 9,
                        "size": 790
                    }
                  ],
                  "totalEF": 9.2,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 6,
                  "battGroup": 6,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Cr",
                  "battalions": [
                    {
                        "ef": 9,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    }
                  ],
                  "totalEF": 8.2,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 7,
                  "battGroup": 7,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Cr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 8,
                  "battGroup": 8,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ln",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7.2,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 9,
                  "battGroup": 9,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 10,
                        "size": 790
                    },
                    {
                        "ef": 9,
                        "size": 790
                    },
                    {
                        "ef": 9,
                        "size": 790
                    },
                    {
                        "ef": 9,
                        "size": 755
                    }
                  ],
                  "totalEF": 9.3,
                  "totalSize": 3125,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 10,
                  "battGroup": 10,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 9,
                        "size": 709
                    },
                    {
                        "ef": 9,
                        "size": 706
                    },
                    {
                        "ef": 9,
                        "size": 706
                    },
                    {
                        "ef": 8,
                        "size": 790
                    }
                  ],
                  "totalEF": 8.7,
                  "totalSize": 2911,
                  "percentMaxSize": 91,
                  "isDeployed": false
              },
              {
                  "federation": 11,
                  "battGroup": 11,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 12,
                  "battGroup": 12,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 776
                    },
                    {
                        "ef": 9,
                        "size": 685
                    },
                    {
                        "ef": 9,
                        "size": 685
                    },
                    {
                        "ef": 8,
                        "size": 758
                    }
                  ],
                  "totalEF": 8.5,
                  "totalSize": 2904,
                  "percentMaxSize": 91,
                  "isDeployed": false
              },
              {
                  "federation": 13,
                  "battGroup": 13,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 755
                    },
                    {
                        "ef": 8,
                        "size": 755
                    },
                    {
                        "ef": 8,
                        "size": 755
                    },
                    {
                        "ef": 8,
                        "size": 734
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 2999,
                  "percentMaxSize": 94,
                  "isDeployed": false
              },
              {
                  "federation": 14,
                  "battGroup": 14,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 734
                    },
                    {
                        "ef": 8,
                        "size": 734
                    },
                    {
                        "ef": 8,
                        "size": 734
                    },
                    {
                        "ef": 8,
                        "size": 709
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 2911,
                  "percentMaxSize": 91,
                  "isDeployed": false
              },
              {
                  "federation": 15,
                  "battGroup": 15,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 709
                    },
                    {
                        "ef": 8,
                        "size": 709
                    },
                    {
                        "ef": 8,
                        "size": 706
                    },
                    {
                        "ef": 8,
                        "size": 706
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 2830,
                  "percentMaxSize": 88,
                  "isDeployed": false
              },
              {
                  "federation": 16,
                  "battGroup": 16,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 10,
                        "size": 562
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7.6,
                  "totalSize": 2932,
                  "percentMaxSize": 92,
                  "isDeployed": false
              },
              {
                  "federation": 17,
                  "battGroup": 17,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 18,
                  "battGroup": 18,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 785
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3155,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 19,
                  "battGroup": 19,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 20,
                  "battGroup": 20,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 21,
                  "battGroup": 21,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 22,
                  "battGroup": 22,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 23,
                  "battGroup": 23,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 24,
                  "battGroup": 24,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 8,
                        "size": 685
                    }
                  ],
                  "totalEF": 7.2,
                  "totalSize": 3040,
                  "percentMaxSize": 95,
                  "isDeployed": false
              },
              {
                  "federation": 25,
                  "battGroup": 25,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 685
                    },
                    {
                        "ef": 7,
                        "size": 776
                    },
                    {
                        "ef": 7,
                        "size": 763
                    },
                    {
                        "ef": 7,
                        "size": 763
                    }
                  ],
                  "totalEF": 7.2,
                  "totalSize": 2987,
                  "percentMaxSize": 93,
                  "isDeployed": false
              },
              {
                  "federation": 26,
                  "battGroup": 26,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 763
                    },
                    {
                        "ef": 7,
                        "size": 763
                    },
                    {
                        "ef": 7,
                        "size": 758
                    },
                    {
                        "ef": 7,
                        "size": 758
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3042,
                  "percentMaxSize": 95,
                  "isDeployed": false
              },
              {
                  "federation": 27,
                  "battGroup": 27,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 758
                    },
                    {
                        "ef": 8,
                        "size": 644
                    },
                    {
                        "ef": 8,
                        "size": 644
                    },
                    {
                        "ef": 8,
                        "size": 644
                    }
                  ],
                  "totalEF": 7.7,
                  "totalSize": 2690,
                  "percentMaxSize": 84,
                  "isDeployed": false
              },
              {
                  "federation": 28,
                  "battGroup": 28,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 644
                    },
                    {
                        "ef": 7,
                        "size": 725
                    },
                    {
                        "ef": 7,
                        "size": 725
                    },
                    {
                        "ef": 7,
                        "size": 725
                    }
                  ],
                  "totalEF": 7.2,
                  "totalSize": 2819,
                  "percentMaxSize": 88,
                  "isDeployed": false
              },
              {
                  "federation": 29,
                  "battGroup": 29,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 725
                    },
                    {
                        "ef": 9,
                        "size": 562
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6.8,
                  "totalSize": 2867,
                  "percentMaxSize": 90,
                  "isDeployed": false
              },
              {
                  "federation": 30,
                  "battGroup": 30,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 31,
                  "battGroup": 31,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 785
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3155,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 32,
                  "battGroup": 32,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 33,
                  "battGroup": 33,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 34,
                  "battGroup": 34,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 35,
                  "battGroup": 35,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 36,
                  "battGroup": 36,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 8,
                        "size": 575
                    }
                  ],
                  "totalEF": 6.4,
                  "totalSize": 2930,
                  "percentMaxSize": 92,
                  "isDeployed": false
              },
              {
                  "federation": 37,
                  "battGroup": 37,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 561
                    },
                    {
                        "ef": 8,
                        "size": 561
                    },
                    {
                        "ef": 8,
                        "size": 561
                    },
                    {
                        "ef": 8,
                        "size": 561
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 2244,
                  "percentMaxSize": 70,
                  "isDeployed": false
              },
              {
                  "federation": 38,
                  "battGroup": 38,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 615
                    },
                    {
                        "ef": 7,
                        "size": 615
                    },
                    {
                        "ef": 7,
                        "size": 615
                    },
                    {
                        "ef": 7,
                        "size": 615
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 2460,
                  "percentMaxSize": 77,
                  "isDeployed": false
              },
              {
                  "federation": 39,
                  "battGroup": 39,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 575
                    },
                    {
                        "ef": 7,
                        "size": 575
                    },
                    {
                        "ef": 7,
                        "size": 575
                    },
                    {
                        "ef": 5,
                        "size": 795
                    }
                  ],
                  "totalEF": 6.4,
                  "totalSize": 2520,
                  "percentMaxSize": 79,
                  "isDeployed": false
              },
              {
                  "federation": 40,
                  "battGroup": 40,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 5,
                        "size": 795
                    },
                    {
                        "ef": 5,
                        "size": 795
                    },
                    {
                        "ef": 5,
                        "size": 785
                    },
                    {
                        "ef": 5,
                        "size": 785
                    }
                  ],
                  "totalEF": 5,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 41,
                  "battGroup": 41,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 536
                    },
                    {
                        "ef": 7,
                        "size": 536
                    },
                    {
                        "ef": 7,
                        "size": 536
                    },
                    {
                        "ef": 7,
                        "size": 536
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 2144,
                  "percentMaxSize": 67,
                  "isDeployed": false
              },
              {
                  "federation": 42,
                  "battGroup": 42,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 423
                    },
                    {
                        "ef": 8,
                        "size": 423
                    },
                    {
                        "ef": 8,
                        "size": 423
                    },
                    {
                        "ef": 8,
                        "size": 423
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 1692,
                  "percentMaxSize": 53,
                  "isDeployed": false
              },
              {
                  "federation": 43,
                  "battGroup": 43,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 4,
                        "size": 795
                    },
                    {
                        "ef": 4,
                        "size": 795
                    },
                    {
                        "ef": 4,
                        "size": 795
                    },
                    {
                        "ef": 4,
                        "size": 795
                    }
                  ],
                  "totalEF": 4,
                  "totalSize": 3180,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 44,
                  "battGroup": 44,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 4,
                        "size": 795
                    },
                    {
                        "ef": 4,
                        "size": 790
                    },
                    {
                        "ef": 4,
                        "size": 785
                    },
                    {
                        "ef": 4,
                        "size": 785
                    }
                  ],
                  "totalEF": 4,
                  "totalSize": 3155,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 45,
                  "battGroup": 45,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 4,
                        "size": 785
                    },
                    {
                        "ef": 4,
                        "size": 785
                    },
                    {
                        "ef": 4,
                        "size": 785
                    },
                    {
                        "ef": 4,
                        "size": 785
                    }
                  ],
                  "totalEF": 4,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 46,
                  "battGroup": 46,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Gr",
                  "battalions": [
                    {
                        "ef": 4,
                        "size": 754
                    },
                    {
                        "ef": 4,
                        "size": 754
                    },
                    {
                        "ef": 8,
                        "size": 368
                    },
                    {
                        "ef": 8,
                        "size": 368
                    }
                  ],
                  "totalEF": 5.3,
                  "totalSize": 2244,
                  "percentMaxSize": 70,
                  "isDeployed": false
              },
              {
                  "federation": 47,
                  "battGroup": 47,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ti",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 48,
                  "battGroup": 48,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ti",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 49,
                  "battGroup": 49,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ti",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 50,
                  "battGroup": 50,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ti",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 51,
                  "battGroup": 51,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ti",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 52,
                  "battGroup": 52,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ti",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3145,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 53,
                  "battGroup": 53,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ti",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3145,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 54,
                  "battGroup": 54,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 800
                    },
                    {
                        "ef": 7,
                        "size": 800
                    },
                    {
                        "ef": 7,
                        "size": 800
                    },
                    {
                        "ef": 7,
                        "size": 795
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3195,
                  "percentMaxSize": 100,
                  "isDeployed": false
              },
              {
                  "federation": 55,
                  "battGroup": 55,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 795
                    },
                    {
                        "ef": 7,
                        "size": 795
                    },
                    {
                        "ef": 7,
                        "size": 795
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3175,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 56,
                  "battGroup": 56,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 7,
                        "size": 785
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3150,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 57,
                  "battGroup": 57,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 784
                    },
                    {
                        "ef": 6,
                        "size": 800
                    },
                    {
                        "ef": 6,
                        "size": 800
                    },
                    {
                        "ef": 6,
                        "size": 800
                    }
                  ],
                  "totalEF": 6.2,
                  "totalSize": 3184,
                  "percentMaxSize": 100,
                  "isDeployed": false
              },
              {
                  "federation": 58,
                  "battGroup": 58,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 800
                    },
                    {
                        "ef": 6,
                        "size": 800
                    },
                    {
                        "ef": 6,
                        "size": 800
                    },
                    {
                        "ef": 6,
                        "size": 800
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3200,
                  "percentMaxSize": 100,
                  "isDeployed": false
              },
              {
                  "federation": 59,
                  "battGroup": 59,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 800
                    },
                    {
                        "ef": 6,
                        "size": 800
                    },
                    {
                        "ef": 6,
                        "size": 800
                    },
                    {
                        "ef": 6,
                        "size": 795
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3195,
                  "percentMaxSize": 100,
                  "isDeployed": false
              },
              {
                  "federation": 60,
                  "battGroup": 60,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3180,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 61,
                  "battGroup": 61,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3180,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 62,
                  "battGroup": 62,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3180,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 63,
                  "battGroup": 63,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 795
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3175,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 64,
                  "battGroup": 64,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 65,
                  "battGroup": 65,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 66,
                  "battGroup": 66,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 67,
                  "battGroup": 67,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 68,
                  "battGroup": 68,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 69,
                  "battGroup": 69,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 70,
                  "battGroup": 70,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 71,
                  "battGroup": 71,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 784
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3139,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 72,
                  "battGroup": 72,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 784
                    },
                    {
                        "ef": 6,
                        "size": 784
                    },
                    {
                        "ef": 6,
                        "size": 784
                    },
                    {
                        "ef": 6,
                        "size": 784
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3136,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 73,
                  "battGroup": 73,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 784
                    },
                    {
                        "ef": 6,
                        "size": 784
                    },
                    {
                        "ef": 6,
                        "size": 784
                    },
                    {
                        "ef": 6,
                        "size": 764
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3116,
                  "percentMaxSize": 97,
                  "isDeployed": false
              },
              {
                  "federation": 74,
                  "battGroup": 74,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 764
                    },
                    {
                        "ef": 6,
                        "size": 764
                    },
                    {
                        "ef": 6,
                        "size": 764
                    },
                    {
                        "ef": 6,
                        "size": 764
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3056,
                  "percentMaxSize": 96,
                  "isDeployed": false
              },
              {
                  "federation": 75,
                  "battGroup": 75,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 764
                    },
                    {
                        "ef": 6,
                        "size": 764
                    },
                    {
                        "ef": 6,
                        "size": 764
                    },
                    {
                        "ef": 6,
                        "size": 755
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3047,
                  "percentMaxSize": 95,
                  "isDeployed": false
              },
              {
                  "federation": 76,
                  "battGroup": 76,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 755
                    },
                    {
                        "ef": 6,
                        "size": 728
                    },
                    {
                        "ef": 6,
                        "size": 728
                    },
                    {
                        "ef": 5,
                        "size": 784
                    }
                  ],
                  "totalEF": 5.7,
                  "totalSize": 2995,
                  "percentMaxSize": 94,
                  "isDeployed": false
              },
              {
                  "federation": 77,
                  "battGroup": 77,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mi",
                  "battalions": [
                    {
                        "ef": 5,
                        "size": 784
                    },
                    {
                        "ef": 5,
                        "size": 784
                    },
                    {
                        "ef": 5,
                        "size": 784
                    },
                    {
                        "ef": 5,
                        "size": 784
                    }
                  ],
                  "totalEF": 5,
                  "totalSize": 3136,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 78,
                  "battGroup": 78,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Pi",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 79,
                  "battGroup": 79,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Pi",
                  "battalions": [
                    {
                        "ef": 5,
                        "size": 785
                    },
                    {
                        "ef": 4,
                        "size": 785
                    },
                    {
                        "ef": 4,
                        "size": 785
                    },
                    {
                        "ef": 4,
                        "size": 785
                    }
                  ],
                  "totalEF": 4.2,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 80,
                  "battGroup": 80,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Cl",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 81,
                  "battGroup": 81,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Cl",
                  "battalions": [
                    {
                        "ef": 5,
                        "size": 790
                    },
                    {
                        "ef": 5,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 558
                    },
                    {
                        "ef": 6,
                        "size": 558
                    }
                  ],
                  "totalEF": 5.4,
                  "totalSize": 2696,
                  "percentMaxSize": 84,
                  "isDeployed": false
              },
              {
                  "federation": 82,
                  "battGroup": 82,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Cl",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 558
                    },
                    {
                        "ef": 6,
                        "size": 558
                    },
                    {
                        "ef": 4,
                        "size": 790
                    },
                    {
                        "ef": 4,
                        "size": 790
                    }
                  ],
                  "totalEF": 4.8,
                  "totalSize": 2696,
                  "percentMaxSize": 84,
                  "isDeployed": false
              },
              {
                  "federation": 83,
                  "battGroup": 83,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Cl",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 402
                    },
                    {
                        "ef": 6,
                        "size": 402
                    },
                    {
                        "ef": 6,
                        "size": 402
                    },
                    {
                        "ef": 6,
                        "size": 402
                    }
                  ],
                  "totalEF": 6.2,
                  "totalSize": 1608,
                  "percentMaxSize": 50,
                  "isDeployed": false
              },
              {
                  "federation": 84,
                  "battGroup": 84,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Dr",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 380
                    },
                    {
                        "ef": 7,
                        "size": 380
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6.3,
                  "totalSize": 2340,
                  "percentMaxSize": 73,
                  "isDeployed": false
              },
              {
                  "federation": 85,
                  "battGroup": 85,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Hu",
                  "battalions": [
                    {
                        "ef": 5,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    },
                    {
                        "ef": 0,
                        "size": 0
                    }
                  ],
                  "totalEF": 5.7,
                  "totalSize": 2370,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 86,
                  "battGroup": 86,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "La",
                  "battalions": [
                    {
                        "ef": 9,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 87,
                  "battGroup": 87,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "La",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 88,
                  "battGroup": 88,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "La",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 89,
                  "battGroup": 89,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "La",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    },
                    {
                        "ef": 6,
                        "size": 785
                    }
                  ],
                  "totalEF": 6.2,
                  "totalSize": 3140,
                  "percentMaxSize": 98,
                  "isDeployed": false
              },
              {
                  "federation": 90,
                  "battGroup": 90,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ma",
                  "battalions": [
                    {
                        "ef": 9,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    },
                    {
                        "ef": 8,
                        "size": 790
                    }
                  ],
                  "totalEF": 8.2,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 91,
                  "battGroup": 91,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ma",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 7,
                        "size": 790
                    },
                    {
                        "ef": 6,
                        "size": 790
                    }
                  ],
                  "totalEF": 6.8,
                  "totalSize": 3160,
                  "percentMaxSize": 99,
                  "isDeployed": false
              }
            ]
        },
        "armyB": {
            "state": "Conf. of the Rhine",
            "playerAccountNo": null,
            "commander": {
                "commanderName": "Field Marshal WREDE",
                "capability": 19,
                "commandIsInFed": 0
            },
            "fortressEntrenchments": null,
            "battalionGroups": [
              {
                  "federation": 1,
                  "battGroup": 1,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Fu",
                  "battalions": [
                    {
                        "ef": 9,
                        "size": 590
                    },
                    {
                        "ef": 7,
                        "size": 672
                    },
                    {
                        "ef": 7,
                        "size": 672
                    },
                    {
                        "ef": 8,
                        "size": 588
                    }
                  ],
                  "totalEF": 7.7,
                  "totalSize": 2522,
                  "percentMaxSize": 79,
                  "isDeployed": false
              },
              {
                  "federation": 2,
                  "battGroup": 2,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Fu",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 672
                    },
                    {
                        "ef": 7,
                        "size": 671
                    },
                    {
                        "ef": 8,
                        "size": 587
                    },
                    {
                        "ef": 7,
                        "size": 588
                    }
                  ],
                  "totalEF": 7.2,
                  "totalSize": 2518,
                  "percentMaxSize": 79,
                  "isDeployed": false
              },
              {
                  "federation": 3,
                  "battGroup": 3,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Fu",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 581
                    },
                    {
                        "ef": 7,
                        "size": 581
                    },
                    {
                        "ef": 7,
                        "size": 581
                    },
                    {
                        "ef": 7,
                        "size": 580
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 2323,
                  "percentMaxSize": 73,
                  "isDeployed": false
              },
              {
                  "federation": 4,
                  "battGroup": 4,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Fu",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 540
                    },
                    {
                        "ef": 7,
                        "size": 540
                    },
                    {
                        "ef": 7,
                        "size": 540
                    },
                    {
                        "ef": 7,
                        "size": 539
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 2159,
                  "percentMaxSize": 67,
                  "isDeployed": false
              },
              {
                  "federation": 5,
                  "battGroup": 5,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Fu",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 465
                    },
                    {
                        "ef": 7,
                        "size": 445
                    },
                    {
                        "ef": 6,
                        "size": 362
                    },
                    {
                        "ef": 6,
                        "size": 362
                    }
                  ],
                  "totalEF": 6.6,
                  "totalSize": 1634,
                  "percentMaxSize": 51,
                  "isDeployed": false
              },
              {
                  "federation": 6,
                  "battGroup": 6,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 696
                    },
                    {
                        "ef": 7,
                        "size": 694
                    },
                    {
                        "ef": 7,
                        "size": 693
                    },
                    {
                        "ef": 7,
                        "size": 665
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 2748,
                  "percentMaxSize": 86,
                  "isDeployed": false
              },
              {
                  "federation": 7,
                  "battGroup": 7,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 665
                    },
                    {
                        "ef": 7,
                        "size": 665
                    },
                    {
                        "ef": 7,
                        "size": 665
                    },
                    {
                        "ef": 8,
                        "size": 550
                    }
                  ],
                  "totalEF": 7.2,
                  "totalSize": 2545,
                  "percentMaxSize": 80,
                  "isDeployed": false
              },
              {
                  "federation": 8,
                  "battGroup": 8,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 550
                    },
                    {
                        "ef": 8,
                        "size": 549
                    },
                    {
                        "ef": 8,
                        "size": 549
                    },
                    {
                        "ef": 7,
                        "size": 620
                    }
                  ],
                  "totalEF": 7.7,
                  "totalSize": 2268,
                  "percentMaxSize": 71,
                  "isDeployed": false
              },
              {
                  "federation": 9,
                  "battGroup": 9,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 620
                    },
                    {
                        "ef": 7,
                        "size": 620
                    },
                    {
                        "ef": 6,
                        "size": 720
                    },
                    {
                        "ef": 6,
                        "size": 720
                    }
                  ],
                  "totalEF": 6.5,
                  "totalSize": 2680,
                  "percentMaxSize": 84,
                  "isDeployed": false
              },
              {
                  "federation": 10,
                  "battGroup": 10,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 720
                    },
                    {
                        "ef": 6,
                        "size": 720
                    },
                    {
                        "ef": 6,
                        "size": 720
                    },
                    {
                        "ef": 6,
                        "size": 720
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 2880,
                  "percentMaxSize": 90,
                  "isDeployed": false
              },
              {
                  "federation": 11,
                  "battGroup": 11,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 720
                    },
                    {
                        "ef": 6,
                        "size": 720
                    },
                    {
                        "ef": 7,
                        "size": 614
                    },
                    {
                        "ef": 7,
                        "size": 614
                    }
                  ],
                  "totalEF": 6.5,
                  "totalSize": 2668,
                  "percentMaxSize": 83,
                  "isDeployed": false
              },
              {
                  "federation": 12,
                  "battGroup": 12,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 614
                    },
                    {
                        "ef": 7,
                        "size": 614
                    },
                    {
                        "ef": 7,
                        "size": 614
                    },
                    {
                        "ef": 6,
                        "size": 716
                    }
                  ],
                  "totalEF": 6.7,
                  "totalSize": 2558,
                  "percentMaxSize": 80,
                  "isDeployed": false
              },
              {
                  "federation": 13,
                  "battGroup": 13,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 716
                    },
                    {
                        "ef": 6,
                        "size": 716
                    },
                    {
                        "ef": 6,
                        "size": 716
                    },
                    {
                        "ef": 6,
                        "size": 712
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 2860,
                  "percentMaxSize": 89,
                  "isDeployed": false
              },
              {
                  "federation": 14,
                  "battGroup": 14,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 712
                    },
                    {
                        "ef": 6,
                        "size": 712
                    },
                    {
                        "ef": 6,
                        "size": 712
                    },
                    {
                        "ef": 6,
                        "size": 711
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 2847,
                  "percentMaxSize": 89,
                  "isDeployed": false
              },
              {
                  "federation": 15,
                  "battGroup": 15,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 708
                    },
                    {
                        "ef": 6,
                        "size": 708
                    },
                    {
                        "ef": 6,
                        "size": 708
                    },
                    {
                        "ef": 6,
                        "size": 708
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 2832,
                  "percentMaxSize": 88,
                  "isDeployed": false
              },
              {
                  "federation": 16,
                  "battGroup": 16,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 530
                    },
                    {
                        "ef": 8,
                        "size": 530
                    },
                    {
                        "ef": 8,
                        "size": 530
                    },
                    {
                        "ef": 8,
                        "size": 529
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 2119,
                  "percentMaxSize": 66,
                  "isDeployed": false
              },
              {
                  "federation": 17,
                  "battGroup": 17,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 704
                    },
                    {
                        "ef": 6,
                        "size": 704
                    },
                    {
                        "ef": 6,
                        "size": 704
                    },
                    {
                        "ef": 6,
                        "size": 704
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 2816,
                  "percentMaxSize": 88,
                  "isDeployed": false
              },
              {
                  "federation": 18,
                  "battGroup": 18,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 682
                    },
                    {
                        "ef": 6,
                        "size": 682
                    },
                    {
                        "ef": 6,
                        "size": 682
                    },
                    {
                        "ef": 6,
                        "size": 682
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 2728,
                  "percentMaxSize": 85,
                  "isDeployed": false
              },
              {
                  "federation": 19,
                  "battGroup": 19,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 675
                    },
                    {
                        "ef": 6,
                        "size": 675
                    },
                    {
                        "ef": 6,
                        "size": 675
                    },
                    {
                        "ef": 6,
                        "size": 675
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 2700,
                  "percentMaxSize": 84,
                  "isDeployed": false
              },
              {
                  "federation": 20,
                  "battGroup": 20,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 503
                    },
                    {
                        "ef": 8,
                        "size": 502
                    },
                    {
                        "ef": 8,
                        "size": 502
                    },
                    {
                        "ef": 8,
                        "size": 501
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 2008,
                  "percentMaxSize": 63,
                  "isDeployed": false
              },
              {
                  "federation": 21,
                  "battGroup": 21,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 563
                    },
                    {
                        "ef": 7,
                        "size": 563
                    },
                    {
                        "ef": 7,
                        "size": 563
                    },
                    {
                        "ef": 7,
                        "size": 563
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 2252,
                  "percentMaxSize": 70,
                  "isDeployed": false
              },
              {
                  "federation": 22,
                  "battGroup": 22,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 631
                    },
                    {
                        "ef": 6,
                        "size": 631
                    },
                    {
                        "ef": 6,
                        "size": 631
                    },
                    {
                        "ef": 6,
                        "size": 631
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 2524,
                  "percentMaxSize": 79,
                  "isDeployed": false
              },
              {
                  "federation": 23,
                  "battGroup": 23,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 439
                    },
                    {
                        "ef": 8,
                        "size": 439
                    },
                    {
                        "ef": 8,
                        "size": 439
                    },
                    {
                        "ef": 8,
                        "size": 438
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 1755,
                  "percentMaxSize": 55,
                  "isDeployed": false
              },
              {
                  "federation": 24,
                  "battGroup": 24,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 492
                    },
                    {
                        "ef": 7,
                        "size": 492
                    },
                    {
                        "ef": 7,
                        "size": 492
                    },
                    {
                        "ef": 7,
                        "size": 492
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 1968,
                  "percentMaxSize": 62,
                  "isDeployed": false
              },
              {
                  "federation": 25,
                  "battGroup": 25,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 9,
                        "size": 381
                    },
                    {
                        "ef": 9,
                        "size": 379
                    },
                    {
                        "ef": 9,
                        "size": 379
                    },
                    {
                        "ef": 9,
                        "size": 379
                    }
                  ],
                  "totalEF": 9,
                  "totalSize": 1518,
                  "percentMaxSize": 47,
                  "isDeployed": false
              },
              {
                  "federation": 26,
                  "battGroup": 26,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 447
                    },
                    {
                        "ef": 7,
                        "size": 447
                    },
                    {
                        "ef": 7,
                        "size": 445
                    },
                    {
                        "ef": 7,
                        "size": 445
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 1784,
                  "percentMaxSize": 56,
                  "isDeployed": false
              },
              {
                  "federation": 27,
                  "battGroup": 27,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 384
                    },
                    {
                        "ef": 8,
                        "size": 384
                    },
                    {
                        "ef": 8,
                        "size": 383
                    },
                    {
                        "ef": 8,
                        "size": 383
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 1534,
                  "percentMaxSize": 48,
                  "isDeployed": false
              },
              {
                  "federation": 28,
                  "battGroup": 28,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 436
                    },
                    {
                        "ef": 7,
                        "size": 436
                    },
                    {
                        "ef": 7,
                        "size": 436
                    },
                    {
                        "ef": 7,
                        "size": 436
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 1744,
                  "percentMaxSize": 54,
                  "isDeployed": false
              },
              {
                  "federation": 29,
                  "battGroup": 29,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 372
                    },
                    {
                        "ef": 8,
                        "size": 372
                    },
                    {
                        "ef": 8,
                        "size": 372
                    },
                    {
                        "ef": 8,
                        "size": 372
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 1488,
                  "percentMaxSize": 46,
                  "isDeployed": false
              },
              {
                  "federation": 30,
                  "battGroup": 30,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 372
                    },
                    {
                        "ef": 8,
                        "size": 372
                    },
                    {
                        "ef": 8,
                        "size": 372
                    },
                    {
                        "ef": 8,
                        "size": 360
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 1476,
                  "percentMaxSize": 46,
                  "isDeployed": false
              },
              {
                  "federation": 31,
                  "battGroup": 31,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 360
                    },
                    {
                        "ef": 8,
                        "size": 360
                    },
                    {
                        "ef": 8,
                        "size": 359
                    },
                    {
                        "ef": 7,
                        "size": 397
                    }
                  ],
                  "totalEF": 7.7,
                  "totalSize": 1476,
                  "percentMaxSize": 46,
                  "isDeployed": false
              },
              {
                  "federation": 32,
                  "battGroup": 32,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 397
                    },
                    {
                        "ef": 7,
                        "size": 397
                    },
                    {
                        "ef": 7,
                        "size": 397
                    },
                    {
                        "ef": 7,
                        "size": 358
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 1549,
                  "percentMaxSize": 48,
                  "isDeployed": false
              },
              {
                  "federation": 33,
                  "battGroup": 33,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 416
                    },
                    {
                        "ef": 6,
                        "size": 415
                    },
                    {
                        "ef": 6,
                        "size": 362
                    },
                    {
                        "ef": 6,
                        "size": 362
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 1555,
                  "percentMaxSize": 49,
                  "isDeployed": false
              },
              {
                  "federation": 34,
                  "battGroup": 34,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GR",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 353
                    },
                    {
                        "ef": 7,
                        "size": 373
                    },
                    {
                        "ef": 6,
                        "size": 416
                    },
                    {
                        "ef": 7,
                        "size": 491
                    }
                  ],
                  "totalEF": 6.5,
                  "totalSize": 1633,
                  "percentMaxSize": 51,
                  "isDeployed": false
              },
              {
                  "federation": 35,
                  "battGroup": 35,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Rm",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 710
                    },
                    {
                        "ef": 7,
                        "size": 710
                    },
                    {
                        "ef": 7,
                        "size": 709
                    },
                    {
                        "ef": 7,
                        "size": 707
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 2836,
                  "percentMaxSize": 89,
                  "isDeployed": false
              },
              {
                  "federation": 36,
                  "battGroup": 36,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Rm",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 706
                    },
                    {
                        "ef": 7,
                        "size": 705
                    },
                    {
                        "ef": 7,
                        "size": 704
                    },
                    {
                        "ef": 7,
                        "size": 507
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 2622,
                  "percentMaxSize": 82,
                  "isDeployed": false
              },
              {
                  "federation": 37,
                  "battGroup": 37,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Rm",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 507
                    },
                    {
                        "ef": 7,
                        "size": 500
                    },
                    {
                        "ef": 8,
                        "size": 430
                    },
                    {
                        "ef": 8,
                        "size": 427
                    }
                  ],
                  "totalEF": 7.5,
                  "totalSize": 1864,
                  "percentMaxSize": 58,
                  "isDeployed": false
              },
              {
                  "federation": 38,
                  "battGroup": 38,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Rm",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 435
                    },
                    {
                        "ef": 7,
                        "size": 434
                    },
                    {
                        "ef": 7,
                        "size": 379
                    },
                    {
                        "ef": 7,
                        "size": 378
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 1626,
                  "percentMaxSize": 51,
                  "isDeployed": false
              },
              {
                  "federation": 39,
                  "battGroup": 39,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Rm",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 378
                    },
                    {
                        "ef": 7,
                        "size": 378
                    },
                    {
                        "ef": 7,
                        "size": 378
                    },
                    {
                        "ef": 7,
                        "size": 377
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 1511,
                  "percentMaxSize": 47,
                  "isDeployed": false
              },
              {
                  "federation": 40,
                  "battGroup": 40,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Mu",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 572
                    },
                    {
                        "ef": 6,
                        "size": 459
                    },
                    {
                        "ef": 6,
                        "size": 457
                    },
                    {
                        "ef": 6,
                        "size": 457
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 1945,
                  "percentMaxSize": 61,
                  "isDeployed": false
              },
              {
                  "federation": 41,
                  "battGroup": 41,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Pi",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 720
                    },
                    {
                        "ef": 8,
                        "size": 491
                    },
                    {
                        "ef": 7,
                        "size": 491
                    },
                    {
                        "ef": 7,
                        "size": 491
                    }
                  ],
                  "totalEF": 7.2,
                  "totalSize": 2193,
                  "percentMaxSize": 69,
                  "isDeployed": false
              },
              {
                  "federation": 42,
                  "battGroup": 42,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Cu",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 678
                    },
                    {
                        "ef": 8,
                        "size": 678
                    },
                    {
                        "ef": 8,
                        "size": 678
                    },
                    {
                        "ef": 7,
                        "size": 678
                    }
                  ],
                  "totalEF": 7.8,
                  "totalSize": 2712,
                  "percentMaxSize": 85,
                  "isDeployed": false
              },
              {
                  "federation": 43,
                  "battGroup": 43,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Cu",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 642
                    },
                    {
                        "ef": 7,
                        "size": 642
                    },
                    {
                        "ef": 7,
                        "size": 642
                    },
                    {
                        "ef": 7,
                        "size": 638
                    }
                  ],
                  "totalEF": 7,
                  "totalSize": 2564,
                  "percentMaxSize": 80,
                  "isDeployed": false
              },
              {
                  "federation": 44,
                  "battGroup": 44,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GC",
                  "battalions": [
                    {
                        "ef": 9,
                        "size": 720
                    },
                    {
                        "ef": 8,
                        "size": 720
                    },
                    {
                        "ef": 8,
                        "size": 720
                    },
                    {
                        "ef": 8,
                        "size": 720
                    }
                  ],
                  "totalEF": 8.2,
                  "totalSize": 2880,
                  "percentMaxSize": 90,
                  "isDeployed": false
              },
              {
                  "federation": 45,
                  "battGroup": 45,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GC",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 720
                    },
                    {
                        "ef": 8,
                        "size": 720
                    },
                    {
                        "ef": 8,
                        "size": 720
                    },
                    {
                        "ef": 8,
                        "size": 720
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 2880,
                  "percentMaxSize": 90,
                  "isDeployed": false
              },
              {
                  "federation": 46,
                  "battGroup": 46,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "GC",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 653
                    },
                    {
                        "ef": 8,
                        "size": 651
                    },
                    {
                        "ef": 8,
                        "size": 651
                    },
                    {
                        "ef": 8,
                        "size": 650
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 2605,
                  "percentMaxSize": 81,
                  "isDeployed": false
              },
              {
                  "federation": 47,
                  "battGroup": 47,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "La",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 708
                    },
                    {
                        "ef": 8,
                        "size": 705
                    },
                    {
                        "ef": 7,
                        "size": 714
                    },
                    {
                        "ef": 7,
                        "size": 713
                    }
                  ],
                  "totalEF": 7.5,
                  "totalSize": 2840,
                  "percentMaxSize": 89,
                  "isDeployed": false
              },
              {
                  "federation": 48,
                  "battGroup": 48,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "La",
                  "battalions": [
                    {
                        "ef": 7,
                        "size": 712
                    },
                    {
                        "ef": 7,
                        "size": 707
                    },
                    {
                        "ef": 7,
                        "size": 704
                    },
                    {
                        "ef": 6,
                        "size": 720
                    }
                  ],
                  "totalEF": 6.7,
                  "totalSize": 2843,
                  "percentMaxSize": 89,
                  "isDeployed": false
              },
              {
                  "federation": 49,
                  "battGroup": 49,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "La",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 662
                    },
                    {
                        "ef": 6,
                        "size": 662
                    },
                    {
                        "ef": 6,
                        "size": 659
                    },
                    {
                        "ef": 6,
                        "size": 659
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 2642,
                  "percentMaxSize": 83,
                  "isDeployed": false
              },
              {
                  "federation": 50,
                  "battGroup": 50,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "La",
                  "battalions": [
                    {
                        "ef": 6,
                        "size": 624
                    },
                    {
                        "ef": 6,
                        "size": 624
                    },
                    {
                        "ef": 6,
                        "size": 624
                    },
                    {
                        "ef": 0,
                        "size": 0
                    }
                  ],
                  "totalEF": 6,
                  "totalSize": 1872,
                  "percentMaxSize": 78,
                  "isDeployed": false
              },
              {
                  "federation": 51,
                  "battGroup": 51,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ha",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 663
                    },
                    {
                        "ef": 7,
                        "size": 668
                    },
                    {
                        "ef": 7,
                        "size": 668
                    },
                    {
                        "ef": 7,
                        "size": 667
                    }
                  ],
                  "totalEF": 7.2,
                  "totalSize": 2666,
                  "percentMaxSize": 83,
                  "isDeployed": false
              },
              {
                  "federation": 52,
                  "battGroup": 52,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ma",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 792
                    },
                    {
                        "ef": 8,
                        "size": 791
                    },
                    {
                        "ef": 8,
                        "size": 787
                    },
                    {
                        "ef": 8,
                        "size": 785
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 3155,
                  "percentMaxSize": 99,
                  "isDeployed": false
              },
              {
                  "federation": 53,
                  "battGroup": 53,
                  "dest0": {
                      "x": 0,
                      "y": 0
                  },
                  "startAttack": 0,
                  "order": 0,
                  "addOrder": 0,
                  "formation": 1,
                  "dest1": {
                      "x": 0,
                      "y": 0
                  },
                  "dest2": {
                      "x": 0,
                      "y": 0
                  },
                  "altCondition": 0,
                  "altOrder": 0,
                  "altAddOrder": 0,
                  "altFormation": 0,
                  "altDest1": null,
                  "altDest2": null,
                  "type": "Ma",
                  "battalions": [
                    {
                        "ef": 8,
                        "size": 785
                    },
                    {
                        "ef": 8,
                        "size": 785
                    },
                    {
                        "ef": 8,
                        "size": 784
                    },
                    {
                        "ef": 8,
                        "size": 783
                    }
                  ],
                  "totalEF": 8,
                  "totalSize": 3137,
                  "percentMaxSize": 98,
                  "isDeployed": false
              }
            ]
        }
    }



});

