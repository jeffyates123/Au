//'use strict';

//function sendFile(file) {
//    console.log(file.type);

//    var data = new FormData();
//    data.append("file1", file);

//    $.ajax({
//        type: 'post',
//        url: '/Austerlitz/api/FileLoadApi/FilePost',
//        data: data,
//        success: function (results) {

//            var scope = angular.element($("#mapPanel")).scope();
//            scope.$apply(function () {
//                //                console.log(JSON.stringify(results, null, 2));
//                if (!results.armyA.state) {
//                    results = "";
//                } else {
//                    scope.results = results;
//                    scope.toggleHostArmy();
//                }
//            });
//        },
//        error: function () {
//            alert("Error while invoking the Web API");
//        },
//        contentType: false,
//        processData: false
//    });
//};


austerlitzModule.controller("simBattleController", function ($scope, $routeParams, homeFactory) {
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

    $scope.columnDefsTurnSheet = [
            { field: 'federation', displayName: 'Fd', width: '30px', cellClass: 'grid-center-align' },
            { field: 'type', displayName: 'Tp', width: '35px', cellClass: 'grid-center-align' },
            { field: 'totalEF', displayName: 'EF', width: '40px', cellClass: 'grid-center-align' },
            //{ field: 'percentMaxSize', displayName: '% Max', width: '50px' },
            { field: 'totalSize', displayName: 'Size', width: '45px', cellClass: 'grid-center-align' },
            { field: 'battGroup', displayName: 'Bg', width: '30px', cellClass: 'grid-center-align' },
            { field: 'dest0.x', displayName: 'Dest0 X', width: '60px', cellClass: 'grid-center-align' },
            { field: 'dest0.y', displayName: 'Dest0 Y', width: '60px', cellClass: 'grid-center-align' },
            { field: 'startAttack', displayName: 'Start Attack', width: '60px', cellClass: 'grid-center-align' },
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

});

