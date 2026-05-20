'use strict';

austerlitzModule.factory('turnMapsGridConfigFactory', function () {
    return {
        attach: function ($scope) {
            var deleteAllHeaderTemplate = '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" title="Delete all visible rows" style="cursor:pointer;color:red;" ng-show="hasVisibleRowsToDelete(col.colDef.deleteAllType)" ng-click="$event.stopPropagation(); deleteVisibleRows(col.colDef.deleteAllType)"></span></div>';

            $scope.getVisibleRowsForDeleteAll = function (deleteAllType) {
                if (deleteAllType === 'Movement') return $scope.tsMovementList || [];
                if (deleteAllType === 'BuildProductionSites') return $scope.tsBuildProductionSitesList || [];
                if (deleteAllType === 'FormFederations') return $scope.tsFormFederationsList || [];
                if (deleteAllType === 'SetUpBrigades') return $scope.tsSetUpBrigadesRows || [];
                if (deleteAllType === 'TransferGoods') return $scope.tsTransferGoodsCostRows || [];
                if (deleteAllType === 'Boarding') return $scope.tsBoardingList || [];

                return [];
            };

            $scope.hasVisibleRowsToDelete = function (deleteAllType) {
                var rows = $scope.getVisibleRowsForDeleteAll(deleteAllType);

                return rows.some(function (row) {
                    if (deleteAllType === 'Movement') return $scope.hasMovementItemNo(row);
                    if (deleteAllType === 'BuildProductionSites') return $scope.hasProductionSiteData(row);
                    if (deleteAllType === 'FormFederations') return $scope.hasFormFederationItemNo(row);
                    if (deleteAllType === 'SetUpBrigades') return $scope.hasSetUpBrigadesData(row);
                    if (deleteAllType === 'TransferGoods') return $scope.hasTransferGoodsData(row);
                    if (deleteAllType === 'Boarding') return $scope.hasBoardingData(row);

                    return false;
                });
            };

            $scope.deleteVisibleRows = function (deleteAllType) {
                if (!$scope.hasVisibleRowsToDelete(deleteAllType)) return;
                if (!confirm('Delete all visible rows in this grid?')) return;

                angular.forEach($scope.getVisibleRowsForDeleteAll(deleteAllType), function (row) {
                    if (deleteAllType === 'Movement' && $scope.hasMovementItemNo(row)) $scope.removeMovementRow({ entity: row });
                    if (deleteAllType === 'BuildProductionSites' && $scope.hasProductionSiteData(row)) $scope.removeProductionSiteRow({ entity: row });
                    if (deleteAllType === 'FormFederations' && $scope.hasFormFederationItemNo(row)) $scope.removeFormFederationRow({ entity: row });
                    if (deleteAllType === 'SetUpBrigades' && $scope.hasSetUpBrigadesData(row)) $scope.removeSetUpBrigadesRow({ entity: row });
                    if (deleteAllType === 'TransferGoods' && $scope.hasTransferGoodsData(row)) $scope.removeTransferGoodsRow({ entity: row });
                    if (deleteAllType === 'Boarding' && $scope.hasBoardingData(row)) $scope.removeBoardingRow({ entity: row });
                });
            };

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
                rowTemplate: '<div ng-click="selectProductionSiteRow(row.entity)" ng-repeat="col in renderedColumns" ng-class="col.colIndex()" class="ngCell {{col.cellClass}} {{getProductionSiteRowClass(row.entity)}}"><div class="ngVerticalBar" ng-style="{height: rowHeight}" ng-class="{ ngVerticalBarVisible: !$last }">&nbsp;</div><div ng-cell></div></div>'
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
                { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, deleteAllType: 'Movement', headerCellTemplate: deleteAllHeaderTemplate, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasMovementItemNo(row.entity)" ng-click="removeMovementRow(row)"></span></div>' }
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
                { field: 'description', displayName: 'Description', width: '120px', cellClass: 'grid-left-align', enableCellEdit: false, sortable: false, cellTemplate: '<div class="ngCellText">{{getProductionSiteDescription(row.entity)}}</div>' },
                { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, deleteAllType: 'BuildProductionSites', headerCellTemplate: deleteAllHeaderTemplate, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasProductionSiteData(row.entity)" ng-click="removeProductionSiteRow(row)"></span></div>' }
            ];

            $scope.formFederationColumnDefsMap = [
                { field: 'orderNo', displayName: 'No', width: '35px', cellClass: 'grid-center-align' },
                { field: 'itemNo', displayName: 'Item No', width: '70px', cellClass: 'grid-center-align' },
                { field: 'federation_Fleet', displayName: 'Federation', width: '95px', cellClass: 'grid-center-align' },
                { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, deleteAllType: 'FormFederations', headerCellTemplate: deleteAllHeaderTemplate, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasFormFederationItemNo(row.entity)" ng-click="removeFormFederationRow(row)"></span></div>' }
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
                { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, deleteAllType: 'SetUpBrigades', headerCellTemplate: deleteAllHeaderTemplate, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasSetUpBrigadesData(row.entity)" ng-click="removeSetUpBrigadesRow(row)"></span></div>' }
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
                { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, deleteAllType: 'TransferGoods', headerCellTemplate: deleteAllHeaderTemplate, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasTransferGoodsData(row.entity)" ng-click="removeTransferGoodsRow(row)"></span></div>' }
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
                { field: 'removeRow', displayName: '', width: '28px', enableCellEdit: false, sortable: false, deleteAllType: 'Boarding', headerCellTemplate: deleteAllHeaderTemplate, cellTemplate: '<div class="ngCellText grid-center-align"><span class="glyphicon glyphicon-minus-sign" style="cursor:pointer;color:red;" ng-show="hasBoardingData(row.entity)" ng-click="removeBoardingRow(row)"></span></div>' }
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
