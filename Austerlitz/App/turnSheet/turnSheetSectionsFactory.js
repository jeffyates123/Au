'use strict';

austerlitzModule.factory('turnSheetSectionsFactory', function (turnSheetFactory, turnSheetValueRulesFactory) {
    var sections = [
        {
            key: 'TransferGoods',
            shortTitle: 'TS_01',
            title: 'TS_01 - Transfer Goods',
            maxRows: 10,
            load: turnSheetFactory.getTSTransferGoods,
            postType: 'TransferGoods',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'turnSheetSectionNo', displayName: 'Section' },
                { field: 'from', displayName: 'From' },
                { field: 'to', displayName: 'To' },
                { field: 'louisdore', displayName: 'Louisdore' },
                { field: 'citizens', displayName: 'Citizens' },
                { field: 'ecPts', displayName: 'EcPts' },
                { field: 'wood', displayName: 'Wood' },
                { field: 'horses', displayName: 'Horses' },
                { field: 'textiles', displayName: 'Textiles' }
            ]
        },
        {
            key: 'DemolishItems',
            shortTitle: 'TS_02',
            title: 'TS_02 - Demolish Items',
            maxRows: 6,
            load: turnSheetFactory.getTSDemolishItems,
            postType: 'DemolishItems',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'itemNo', displayName: 'Item No' }
            ]
        },
        {
            key: 'SetUpBrigades',
            shortTitle: 'TS_03',
            title: 'TS_03 - Set Up Brigades',
            maxRows: 8,
            load: turnSheetFactory.getTSSetUpBrigades,
            postType: 'SetUpBrigades',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'depot', displayName: 'Depot' },
                { field: 'batt1', displayName: 'Batt1' },
                { field: 'batt2', displayName: 'Batt2' },
                { field: 'batt3', displayName: 'Batt3' },
                { field: 'batt4', displayName: 'Batt4' },
                { field: 'batt5', displayName: 'Batt5' },
                { field: 'batt6', displayName: 'Batt6' },
                { field: 'batt7', displayName: 'Batt7' },
                { field: 'brigadeName', displayName: 'Brigade Name' }
            ]
        },
        {
            key: 'SetUpAdditionalBrigades',
            shortTitle: 'TS_04',
            title: 'TS_04 - Set Up Additional Brigades',
            maxRows: 6,
            load: turnSheetFactory.getTSSetUpAdditionalBrigades,
            postType: 'SetUpAdditionalBrigades',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'brigadeNo', displayName: 'Brigade No' },
                { field: 'battType', displayName: 'Battalion Type' }
            ]
        },
        {
            key: 'IncreaseHeadcount',
            shortTitle: 'TS_05',
            title: 'TS_05 - Increase Headcount',
            maxRows: 12,
            load: turnSheetFactory.getTSIncreaseHeadcount,
            postType: 'IncreaseHeadcount',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'brigadeOrFederation', displayName: 'Brigade/Federation' },
                { field: 'increaseAmount', displayName: 'Increase Amount' }
            ]
        },
        {
            key: 'IncreaseBrigadeXP',
            shortTitle: 'TS_06',
            title: 'TS_06 - Increase Brigade XP',
            maxRows: 16,
            load: turnSheetFactory.getTSIncreaseBrigadeXP,
            postType: 'IncreaseBrigadeXP',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'brigadeOrFederation', displayName: 'Brigade/Federation' }
            ]
        },
        {
            key: 'ExchangeBattalions',
            shortTitle: 'TS_07',
            title: 'TS_07 - Exchange Battalions',
            maxRows: 4,
            load: turnSheetFactory.getTSExchangeBattalions,
            postType: 'ExchangeBattalions',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'brigadeA', displayName: 'Brigade A' },
                { field: 'battA', displayName: 'Batt A' },
                { field: 'brigadeB', displayName: 'Brigade B' },
                { field: 'battB', displayName: 'Batt B' }
            ]
        },
        {
            key: 'MergeBattalions',
            shortTitle: 'TS_08',
            title: 'TS_08 - Merge Battalions',
            maxRows: 8,
            load: turnSheetFactory.getTSMergeBattalions,
            postType: 'MergeBattalions',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'bridageA', displayName: 'Brigade A' },
                { field: 'battA', displayName: 'Batt A' },
                { field: 'brigadeB', displayName: 'Brigade B' },
                { field: 'battB', displayName: 'Batt B' }
            ]
        },
        {
            key: 'RepairShips_BaggageTrains',
            shortTitle: 'TS_09',
            title: 'TS_09 - Repair Ships & Baggage Trains',
            maxRows: 6,
            load: turnSheetFactory.getTSRepairShips_BaggageTrains,
            postType: 'RepairShips_BaggageTrains',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'itemNo', displayName: 'Item No' }
            ]
        },
        {
            key: 'BuildShips',
            shortTitle: 'TS_10',
            title: 'TS_10 - Build Ships',
            maxRows: 8,
            load: turnSheetFactory.getTSBuildShips,
            postType: 'BuildShips',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'shipyard', displayName: 'Shipyard' },
                { field: 'shipType', displayName: 'Ship Type' },
                { field: 'name_WarshipOnly', displayName: 'Name (Warship only)' }
            ]
        },
        {
            key: 'BuildBaggageTrain',
            shortTitle: 'TS_11',
            title: 'TS_11 - Build Baggage Train',
            maxRows: 4,
            load: turnSheetFactory.getTSBuildBaggageTrain,
            postType: 'BuildBaggageTrain',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'barracks', displayName: 'Barracks' }
            ]
        },
        {
            key: 'IncreasePopulationDensity',
            shortTitle: 'TS_12',
            title: 'TS_12 - Increase Population Density',
            maxRows: 7,
            load: turnSheetFactory.getTSIncreasePopulationDensity,
            postType: 'IncreasePopulationDensity',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'x', displayName: 'X' },
                { field: 'y', displayName: 'Y' }
            ]
        },
        {
            key: 'BuildProductionSites',
            shortTitle: 'TS_13',
            title: 'TS_13 - Build Production Sites',
            maxRows: 10,
            load: turnSheetFactory.getTSBuildProductionSites,
            postType: 'BuildProductionSites',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'prodSiteType', displayName: 'Site Type' },
                { field: 'x', displayName: 'X' },
                { field: 'y', displayName: 'Y' }
            ]
        },
        {
            key: 'FormFederations',
            shortTitle: 'TS_14',
            title: 'TS_14 - Form Federations',
            maxRows: 21,
            load: turnSheetFactory.getTSFormFederations,
            postType: 'FormFederations',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'itemNo', displayName: 'Item No' },
                { field: 'federation_Fleet', displayName: 'Federation/Fleet' }
            ]
        },
        {
            key: 'CoastalDefence',
            shortTitle: 'TS_15',
            title: 'TS_15 - Coastal Defence',
            maxRows: 5,
            load: turnSheetFactory.getTSCoastalDefence,
            postType: 'CoastalDefence',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'fleetNo', displayName: 'Fleet No' }
            ]
        },
        {
            key: 'SeaBlockade',
            shortTitle: 'TS_16',
            title: 'TS_16 - Sea Blockade',
            maxRows: 3,
            load: turnSheetFactory.getTSSeaBlockade,
            postType: 'SeaBlockade',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'fleetNo', displayName: 'Fleet No' },
                { field: 'stateA_Or_Fleet0', displayName: 'State A/Fleet 0' },
                { field: 'stateB', displayName: 'State B' },
                { field: 'stateC', displayName: 'State C' },
                { field: 'stateD', displayName: 'State D' },
                { field: 'stateE', displayName: 'State E' }
            ]
        },
        {
            key: 'TradeAndLoading1',
            shortTitle: 'TS_17',
            title: 'TS_17 - Trade & Loading (Part 1)',
            maxRows: 18,
            load: turnSheetFactory.getTSTradeAndLoading1,
            postType: 'TradeAndLoading1',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'goods', displayName: 'Goods' },
                { field: 'quantity', displayName: 'Quantity' },
                { field: 'from', displayName: 'From' },
                { field: 'to', displayName: 'To' }
            ]
        },
        {
            key: 'Movement',
            shortTitle: 'TS_18',
            title: 'TS_18 - Movement',
            maxRows: 30,
            load: turnSheetFactory.getTSMovement,
            postType: 'Movement',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'itemNo', displayName: 'Item No' },
                { field: 'direction1', displayName: 'Dir1' },
                { field: 'distance1', displayName: 'Dist1' },
                { field: 'direction2', displayName: 'Dir2' },
                { field: 'distance2', displayName: 'Dist2' },
                { field: 'direction3', displayName: 'Dir3' },
                { field: 'distance3', displayName: 'Dist3' }
            ]
        },
        {
            key: 'TradeAndLoading2',
            shortTitle: 'TS_19',
            title: 'TS_19 - Trade & Loading (Part 2)',
            maxRows: 18,
            load: turnSheetFactory.getTSTradeAndLoading2,
            postType: 'TradeAndLoading2',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'goods', displayName: 'Goods' },
                { field: 'quantity', displayName: 'Quantity' },
                { field: 'source', displayName: 'Source' },
                { field: 'destination', displayName: 'Destination' }
            ]
        },
        {
            key: 'Boarding',
            shortTitle: 'TS_20',
            title: 'TS_20 - Boarding',
            maxRows: 16,
            load: turnSheetFactory.getTSBoarding,
            postType: 'Boarding',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'command', displayName: 'Command' },
                { field: 'itemNo', displayName: 'Item No' },
                { field: 'fleetNo', displayName: 'Fleet No' },
                { field: 'fleetOwner', displayName: 'Fleet Owner' }
            ]
        },
        {
            key: 'HandOverTerritory',
            shortTitle: 'TS_21',
            title: 'TS_21 - Hand Over Territory',
            maxRows: 6,
            load: turnSheetFactory.getTSHandOverTerritory,
            postType: 'HandOverTerritory',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'state', displayName: 'State' },
                { field: 'shipNumber', displayName: 'Ship No' },
                { field: 'x', displayName: 'X' },
                { field: 'y', displayName: 'Y' }
            ]
        },
        {
            key: 'ChangeNames',
            shortTitle: 'TS_22',
            title: 'TS_22 - Change Names',
            maxRows: 4,
            load: turnSheetFactory.getTSChangeNames,
            postType: 'ChangeNames',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'itemNo', displayName: 'Item No' },
                { field: 'name', displayName: 'New Name' }
            ]
        },
        {
            key: 'ChangeStateRelationships',
            shortTitle: 'TS_23',
            title: 'TS_23 - Change State Relationships',
            maxRows: 4,
            load: turnSheetFactory.getTSChangeStateRelationships,
            postType: 'ChangeStateRelationships',
            columns: [
                { field: 'orderNo', displayName: 'No' },
                { field: 'state', displayName: 'State' },
                { field: 'relationship', displayName: 'Relationship' }
            ]
        }
    ];

    var sectionsByKey = {};
    angular.forEach(sections, function (section) {
        sectionsByKey[section.key] = section;
    });

    function getOrderNo(row, fallback) {
        if (!row) {
            return fallback;
        }

        return row.orderNo || row.OrderNo || fallback;
    }

    function createEmptyRow(section, orderNo, turnId) {
        var row = {
            orderNo: orderNo
        };

        if (turnId) {
            row.turnId = turnId;
        }

        angular.forEach(section.columns, function (column) {
            if (column.field !== 'orderNo' && angular.isUndefined(row[column.field])) {
                row[column.field] = null;
            }
        });

        return row;
    }

    function normalizeSetUpBrigadesRow(row) {
        if (!row) {
            return row;
        }

        row.depot = turnSheetValueRulesFactory.toPositiveIntOrNull(row.depot);
        row.batt1 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt1);
        row.batt2 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt2);
        row.batt3 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt3);
        row.batt4 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt4);
        row.batt5 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt5);
        row.batt6 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt6);
        row.batt7 = turnSheetValueRulesFactory.toPositiveIntOrNull(row.batt7);

        var brigadeName = row.brigadeName == null ? '' : row.brigadeName.toString().trim();
        if (!brigadeName || brigadeName === '<Brigade Name>' || !row.depot) {
            row.brigadeName = '';
        }

        return row;
    }

    function normalizeTransferGoodsRow(row) {
        if (!row) {
            return row;
        }

        row.from = turnSheetValueRulesFactory.toPositiveIntOrNull(row.from);
        row.to = turnSheetValueRulesFactory.toPositiveIntOrNull(row.to);
        row.louisdore = turnSheetValueRulesFactory.toPositiveIntOrNull(row.louisdore);
        row.citizens = turnSheetValueRulesFactory.toPositiveIntOrNull(row.citizens);
        row.ecPts = turnSheetValueRulesFactory.toPositiveIntOrNull(row.ecPts);
        row.wood = turnSheetValueRulesFactory.toPositiveIntOrNull(row.wood);
        row.horses = turnSheetValueRulesFactory.toPositiveIntOrNull(row.horses);
        row.textiles = turnSheetValueRulesFactory.toPositiveIntOrNull(row.textiles);

        return row;
    }

    function normalizeSectionSpecificRow(section, row) {
        if (!section || !row) {
            return row;
        }

        if (section.key === 'SetUpBrigades') {
            return normalizeSetUpBrigadesRow(row);
        }

        if (section.key === 'TransferGoods') {
            return normalizeTransferGoodsRow(row);
        }

        return row;
    }

    function normalizeRows(section, rows, turnId) {
        rows = rows || [];

        var byOrderNo = {};
        var highestOrderNo = section.maxRows || 0;
        angular.forEach(rows, function (row, index) {
            row = normalizeSectionSpecificRow(section, row);
            var orderNo = getOrderNo(row, index + 1);
            highestOrderNo = Math.max(highestOrderNo, orderNo);
            byOrderNo[orderNo] = row;
        });

        var normalizedRows = [];
        for (var orderNo = 1; orderNo <= highestOrderNo; orderNo++) {
            normalizedRows.push(byOrderNo[orderNo] || createEmptyRow(section, orderNo, turnId));
        }

        return normalizedRows;
    }

    return {
        getAll: function () {
            return sections;
        },
        getByKey: function (key) {
            return sectionsByKey[key];
        },
        normalizeRows: normalizeRows
    };
});
