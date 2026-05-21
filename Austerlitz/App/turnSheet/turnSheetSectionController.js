'use strict';

austerlitzModule.controller('turnSheetSectionController', function ($scope, $routeParams, turnSheetFactory, masterData) {
    $scope.masterData = masterData;
    $scope.rows = [];
    $scope.isSaving = false;
    $scope.saveMessage = '';
    $scope.saveError = '';
    $scope.loadError = '';

    var sections = {
        'TransferGoods': {
            title: 'TS_01 \u2014 Transfer Goods',
            load: turnSheetFactory.getTSTransferGoods,
            postType: 'TransferGoods',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'from', displayName: 'From', width: '60px' },
                { field: 'to', displayName: 'To', width: '60px' },
                { field: 'louisdore', displayName: 'Louisdore', width: '85px' },
                { field: 'citizens', displayName: 'Citizens', width: '75px' },
                { field: 'ecPts', displayName: 'EcPts', width: '65px' },
                { field: 'wood', displayName: 'Wood', width: '65px' },
                { field: 'horses', displayName: 'Horses', width: '70px' },
                { field: 'textiles', displayName: 'Textiles' }
            ]
        },
        'DemolishItems': {
            title: 'TS_02 \u2014 Demolish Items',
            load: turnSheetFactory.getTSDemolishItems,
            postType: 'DemolishItems',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'itemNo', displayName: 'Item No' }
            ]
        },
        'SetUpBrigades': {
            title: 'TS_03 \u2014 Set Up Brigades',
            load: turnSheetFactory.getTSSetUpBrigades,
            postType: 'SetUpBrigades',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'depot', displayName: 'Depot', width: '65px' },
                { field: 'batt1', displayName: 'Batt1', width: '60px' },
                { field: 'batt2', displayName: 'Batt2', width: '60px' },
                { field: 'batt3', displayName: 'Batt3', width: '60px' },
                { field: 'batt4', displayName: 'Batt4', width: '60px' },
                { field: 'batt5', displayName: 'Batt5', width: '60px' },
                { field: 'batt6', displayName: 'Batt6', width: '60px' },
                { field: 'batt7', displayName: 'Batt7', width: '60px' },
                { field: 'brigadeName', displayName: 'Brigade Name' }
            ]
        },
        'SetUpAdditionalBrigades': {
            title: 'TS_04 \u2014 Set Up Additional Brigades',
            load: turnSheetFactory.getTSSetUpAdditionalBrigades,
            postType: 'SetUpAdditionalBrigades',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'brigadeNo', displayName: 'Brigade No', width: '100px' },
                { field: 'battType', displayName: 'Battalion Type' }
            ]
        },
        'IncreaseHeadcount': {
            title: 'TS_05 \u2014 Increase Headcount',
            load: turnSheetFactory.getTSIncreaseHeadcount,
            postType: 'IncreaseHeadcount',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'brigadeOrFederation', displayName: 'Brigade/Federation', width: '150px' },
                { field: 'increaseAmount', displayName: 'Increase Amount' }
            ]
        },
        'IncreaseBrigadeXP': {
            title: 'TS_06 \u2014 Increase Brigade XP',
            load: turnSheetFactory.getTSIncreaseBrigadeXP,
            postType: 'IncreaseBrigadeXP',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'brigadeOrFederation', displayName: 'Brigade/Federation' }
            ]
        },
        'ExchangeBattalions': {
            title: 'TS_07 \u2014 Exchange Battalions',
            load: turnSheetFactory.getTSExchangeBattalions,
            postType: 'ExchangeBattalions',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'brigadeA', displayName: 'Brigade A', width: '90px' },
                { field: 'battA', displayName: 'Batt A', width: '70px' },
                { field: 'brigadeB', displayName: 'Brigade B', width: '90px' },
                { field: 'battB', displayName: 'Batt B' }
            ]
        },
        'MergeBattalions': {
            title: 'TS_08 \u2014 Merge Battalions',
            load: turnSheetFactory.getTSMergeBattalions,
            postType: 'MergeBattalions',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'bridageA', displayName: 'Brigade A', width: '90px' },
                { field: 'battA', displayName: 'Batt A', width: '70px' },
                { field: 'brigadeB', displayName: 'Brigade B', width: '90px' },
                { field: 'battB', displayName: 'Batt B' }
            ]
        },
        'RepairShips_BaggageTrains': {
            title: 'TS_09 \u2014 Repair Ships & Baggage Trains',
            load: turnSheetFactory.getTSRepairShips_BaggageTrains,
            postType: 'RepairShips_BaggageTrains',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'itemNo', displayName: 'Item No' }
            ]
        },
        'BuildShips': {
            title: 'TS_10 \u2014 Build Ships',
            load: turnSheetFactory.getTSBuildShips,
            postType: 'BuildShips',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'shipyard', displayName: 'Shipyard', width: '90px' },
                { field: 'shipType', displayName: 'Ship Type', width: '90px' },
                { field: 'name_WarshipOnly', displayName: 'Name (Warship only)' }
            ]
        },
        'BuildBaggageTrain': {
            title: 'TS_11 \u2014 Build Baggage Train',
            load: turnSheetFactory.getTSBuildBaggageTrain,
            postType: 'BuildBaggageTrain',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'barracks', displayName: 'Barracks' }
            ]
        },
        'IncreasePopulationDensity': {
            title: 'TS_12 \u2014 Increase Population Density',
            load: turnSheetFactory.getTSIncreasePopulationDensity,
            postType: 'IncreasePopulationDensity',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'x', displayName: 'X', width: '80px' },
                { field: 'y', displayName: 'Y' }
            ]
        },
        'BuildProductionSites': {
            title: 'TS_13 \u2014 Build Production Sites',
            load: turnSheetFactory.getTSBuildProductionSites,
            postType: 'BuildProductionSites',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'prodSiteType', displayName: 'Site Type', width: '80px' },
                { field: 'x', displayName: 'X', width: '80px' },
                { field: 'y', displayName: 'Y' }
            ]
        },
        'FormFederations': {
            title: 'TS_14 \u2014 Form Federations',
            load: turnSheetFactory.getTSFormFederations,
            postType: 'FormFederations',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'itemNo', displayName: 'Item No', width: '90px' },
                { field: 'federation_Fleet', displayName: 'Federation/Fleet' }
            ]
        },
        'CoastalDefence': {
            title: 'TS_15 \u2014 Coastal Defence',
            load: turnSheetFactory.getTSCoastalDefence,
            postType: 'CoastalDefence',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'fleetNo', displayName: 'Fleet No' }
            ]
        },
        'SeaBlockade': {
            title: 'TS_16 \u2014 Sea Blockade',
            load: turnSheetFactory.getTSSeaBlockade,
            postType: 'SeaBlockade',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'fleetNo', displayName: 'Fleet No', width: '80px' },
                { field: 'stateA_Or_Fleet0', displayName: 'State A/Fleet 0', width: '120px' },
                { field: 'stateB', displayName: 'State B', width: '80px' },
                { field: 'stateC', displayName: 'State C', width: '80px' },
                { field: 'stateD', displayName: 'State D', width: '80px' },
                { field: 'stateE', displayName: 'State E' }
            ]
        },
        'TradeAndLoading1': {
            title: 'TS_17 \u2014 Trade & Loading (Part 1)',
            load: turnSheetFactory.getTSTradeAndLoading1,
            postType: 'TradeAndLoading1',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'goods', displayName: 'Goods', width: '80px' },
                { field: 'quantity', displayName: 'Quantity', width: '85px' },
                { field: 'from', displayName: 'From', width: '70px' },
                { field: 'to', displayName: 'To' }
            ]
        },
        'Movement': {
            title: 'TS_18 \u2014 Movement',
            load: turnSheetFactory.getTSMovement,
            postType: 'Movement',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'itemNo', displayName: 'Item No', width: '80px' },
                { field: 'direction1', displayName: 'Dir1', width: '50px' },
                { field: 'distance1', displayName: 'Dist1', width: '55px' },
                { field: 'direction2', displayName: 'Dir2', width: '50px' },
                { field: 'distance2', displayName: 'Dist2', width: '55px' },
                { field: 'direction3', displayName: 'Dir3', width: '50px' },
                { field: 'distance3', displayName: 'Dist3' }
            ]
        },
        'TradeAndLoading2': {
            title: 'TS_19 \u2014 Trade & Loading (Part 2)',
            load: turnSheetFactory.getTSTradeAndLoading2,
            postType: 'TradeAndLoading2',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'goods', displayName: 'Goods', width: '80px' },
                { field: 'quantity', displayName: 'Quantity', width: '85px' },
                { field: 'source', displayName: 'Source', width: '80px' },
                { field: 'destination', displayName: 'Destination' }
            ]
        },
        'Boarding': {
            title: 'TS_20 \u2014 Boarding',
            load: turnSheetFactory.getTSBoarding,
            postType: 'Boarding',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'command', displayName: 'Command', width: '85px' },
                { field: 'itemNo', displayName: 'Item No', width: '80px' },
                { field: 'fleetNo', displayName: 'Fleet No', width: '80px' },
                { field: 'fleetOwner', displayName: 'Fleet Owner' }
            ]
        },
        'HandOverTerritory': {
            title: 'TS_21 \u2014 Hand Over Territory',
            load: turnSheetFactory.getTSHandOverTerritory,
            postType: 'HandOverTerritory',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'state', displayName: 'State', width: '70px' },
                { field: 'shipNumber', displayName: 'Ship No', width: '80px' },
                { field: 'x', displayName: 'X', width: '65px' },
                { field: 'y', displayName: 'Y' }
            ]
        },
        'ChangeNames': {
            title: 'TS_22 \u2014 Change Names',
            load: turnSheetFactory.getTSChangeNames,
            postType: 'ChangeNames',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'itemNo', displayName: 'Item No', width: '90px' },
                { field: 'name', displayName: 'New Name' }
            ]
        },
        'ChangeStateRelationships': {
            title: 'TS_23 \u2014 Change State Relationships',
            load: turnSheetFactory.getTSChangeStateRelationships,
            postType: 'ChangeStateRelationships',
            columns: [
                { field: 'orderNo', displayName: 'No', width: '40px', enableCellEdit: false },
                { field: 'state', displayName: 'State', width: '80px' },
                { field: 'relationship', displayName: 'Relationship' }
            ]
        }
    };

    var section = sections[$routeParams.section];

    if (!section) {
        $scope.title = 'Unknown Section';
        $scope.loadError = 'Unknown turn sheet section: ' + $routeParams.section;
        return;
    }

    $scope.title = section.title;

    $scope.columnDefs = section.columns.map(function (col) {
        return angular.extend({
            cellClass: 'grid-center-align',
            enableCellEdit: true
        }, col);
    });

    $scope.gridOptions = {
        data: 'rows',
        columnDefs: 'columnDefs',
        headerRowHeight: 30,
        rowHeight: 25,
        enableCellSelection: true,
        enableRowSelection: true,
        enableCellEdit: true,
        enabledCellEditOnFocus: true,
        multiSelect: false
    };

    $scope.loadData = function () {
        var turnId = masterData && masterData.turnId;
        if (!turnId || turnId === 'Unknown') {
            $scope.loadError = 'No turn selected. Select a turn on the home page first.';
            return;
        }

        $scope.loadError = '';
        section.load(turnId).then(function (data) {
            $scope.rows = data || [];
        }, function () {
            $scope.loadError = 'Failed to load data for this section.';
        });
    };

    $scope.saveData = function () {
        $scope.isSaving = true;
        $scope.saveMessage = '';
        $scope.saveError = '';

        turnSheetFactory.postTSRecords($scope.rows, section.postType).then(function (savedRows) {
            $scope.rows = savedRows || $scope.rows;
            $scope.saveMessage = 'Saved successfully.';
            $scope.isSaving = false;
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            $scope.saveError = 'Save failed.' + (detail ? ' ' + detail : '');
            $scope.isSaving = false;
        });
    };

    $scope.loadData();
});
