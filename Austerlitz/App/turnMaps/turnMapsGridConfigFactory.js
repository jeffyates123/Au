'use strict';

austerlitzModule.factory('turnMapsGridConfigFactory', function () {
    return {
        attach: function ($scope) {
            $scope.movementGridOptions = {
                data: 'tsMovementList',
                headerRowHeight: 30,
                rowHeight: 25,
                columnDefs: 'movementColumnDefsMap',
                enableCellSelection: true,
                enableRowSelection: true,
                enableCellEdit: true,
                enabledCellEditOnFocus: true,
                multiSelect: false,
                rowTemplate: '<div ng-click="movementClickRow(row)" ng-style="{ \'cursor\': row.cursor }" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>'
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
                rowTemplate: '<div ng-click="armyListClickRow(row)" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}} {{isArmyListItemSelected(row.entity) ? \"itemGridRowSelected\" : \"\"}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>'
            };

            $scope.boardingGridOptions = {
                data: 'tsBoardingList',
                headerRowHeight: 30,
                rowHeight: 25,
                columnDefs: 'boardingColumnDefsMap',
                enableCellSelection: true,
                enableRowSelection: true,
                enableCellEdit: true,
                enabledCellEditOnFocus: true,
                multiSelect: false
            };

            $scope.boardingItemGridOptions = {
                data: 'boardingItemRows',
                headerRowHeight: 30,
                rowHeight: 25,
                columnDefs: 'boardingItemColumnDefsMap',
                enableCellSelection: false,
                enableRowSelection: true,
                enableCellEdit: false,
                multiSelect: false,
                rowTemplate: '<div ng-click="boardingItemGridClickRow(row)" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>'
            };

            $scope.movementColumnDefsMap = [
                { field: 'orderNo', displayName: 'No', width: '30px', cellClass: 'grid-center-align' },
                { field: 'itemNo', displayName: 'Item No', width: '55px', cellClass: 'grid-center-align', enableFocusedCellEdit: true, editableCellTemplate: '/Templates/itemSelectTemplate.html' },
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
                { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasMovementItemNo(row.entity)" ng-click="removeMovementRow(row)"></span></div>' }
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

            $scope.boardingColumnDefsMap = [
                { field: 'orderNo', displayName: 'No', width: '35px', cellClass: 'grid-center-align' },
                { field: 'command', displayName: 'Command', width: '70px', cellClass: 'grid-center-align' },
                { field: 'itemNo', displayName: 'Item No', width: '70px', cellClass: 'grid-center-align' },
                { field: 'fleetNo', displayName: 'Fleet No', width: '70px', cellClass: 'grid-center-align' },
                { field: 'fleetOwner', displayName: 'Fleet Owner', width: '80px', cellClass: 'grid-center-align' },
                { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasBoardingData(row.entity)" ng-click="removeBoardingRow(row)"></span></div>' }
            ];

            $scope.boardingItemColumnDefsMap = [
                { field: 'itemNo', displayName: 'Item No', width: '55px', cellClass: 'grid-center-align' },
                { field: 'fed', displayName: 'Fed', width: '45px', cellClass: 'grid-center-align' },
                { field: 'itemTypeName', displayName: 'Type', width: '40px', cellClass: 'grid-center-align' },
                { field: 'capacity', displayName: 'Capacity', width: '65px', cellClass: 'grid-center-align' },
                { field: 'cond', displayName: 'Cond%', width: '60px', cellClass: 'grid-center-align' },
                { field: 'mp', displayName: 'MP', width: '35px', cellClass: 'grid-center-align' },
                { field: 'xy', displayName: 'X/Y', width: '60px', cellClass: 'grid-center-align' },
                { field: 'description', displayName: 'Description', width: '160px', cellClass: 'grid-left-align' },
                { field: 'load', displayName: 'Load?', width: '50px', cellClass: 'grid-center-align', enableCellEdit: false, sortable: false, cellTemplate: '<div class="ngCellText grid-center-align"><input type="checkbox" ng-checked="row.entity.load" ng-click="$event.stopPropagation(); onBoardingLoadChanged(row.entity);" /></div>' }
            ];
        }
    };
});
