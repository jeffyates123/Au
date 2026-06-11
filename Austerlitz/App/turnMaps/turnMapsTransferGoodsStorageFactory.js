'use strict';

austerlitzModule.factory('turnMapsTransferGoodsStorageFactory', function (ts01TransferGoodsUtilsFactory) {
    function getTransferGoodsRowSignature(row, toInt) {
        return [
            toInt(row && row.orderNo, 0),
            row && row.turnSheetSectionNo != null ? row.turnSheetSectionNo : '',
            row && row.from != null ? row.from : '',
            row && row.to != null ? row.to : '',
            row && row.louisdore != null ? row.louisdore : '',
            row && row.citizens != null ? row.citizens : '',
            row && row.ecPts != null ? row.ecPts : '',
            row && row.wood != null ? row.wood : '',
            row && row.horses != null ? row.horses : '',
            row && row.textiles != null ? row.textiles : ''
        ].join('|');
    }

    function loadManagedTransferGoodsRows(turnId, storageKeyPrefix) {
        return ts01TransferGoodsUtilsFactory.loadManagedOrderNos(storageKeyPrefix, turnId);
    }

    function saveManagedTransferGoodsRows(turnId, storageKeyPrefix, orderNos) {
        ts01TransferGoodsUtilsFactory.saveManagedOrderNos(storageKeyPrefix, turnId, orderNos);
    }

    function buildEconomyTsCostSummary(lines, hasAnyGoods, tsCostLabels, getTsTypeSortOrder, toInt) {
        var grouped = {};
        angular.forEach(lines || [], function (line) {
            if (!line || !line.tsType || !hasAnyGoods(line.goods)) return;
            if (!grouped[line.tsType]) {
                grouped[line.tsType] = { tsType: line.tsType, tsLabel: line.tsLabel || tsCostLabels[line.tsType] || line.tsType, rows: [] };
            }

            grouped[line.tsType].rows.push({
                from: line.from,
                to: line.to,
                locationLabel: line.locationLabel || line.to,
                goods: line.goods
            });
        });

        return Object.keys(grouped).map(function (tsType) {
            var section = grouped[tsType];
            section.rows.sort(function (left, right) { return toInt(left.to, 0) - toInt(right.to, 0); });
            return section;
        }).sort(function (left, right) {
            return getTsTypeSortOrder(left.tsType) - getTsTypeSortOrder(right.tsType);
        });
    }

    return {
        getTransferGoodsRowSignature: getTransferGoodsRowSignature,
        clearTransferGoodsRowValues: ts01TransferGoodsUtilsFactory.clearTransferGoodsRowValues,
        loadManagedTransferGoodsRows: loadManagedTransferGoodsRows,
        saveManagedTransferGoodsRows: saveManagedTransferGoodsRows,
        buildEconomyTsCostSummary: buildEconomyTsCostSummary
    };
});
