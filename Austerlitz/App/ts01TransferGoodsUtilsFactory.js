'use strict';

austerlitzModule.factory('ts01TransferGoodsUtilsFactory', function () {
    function toInt(value, fallback) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? (fallback || 0) : parsed;
    }

    function getSphereFromCoordinate(x, y) {
        var px = parseInt(x, 10);
        var py = parseInt(y, 10);
        if (isNaN(px) || isNaN(py)) return null;
        if (px <= 80 && py <= 65) return 'Europe';
        if (px <= 40 && py <= 99) return 'Carribbean';
        if (px <= 90 && py <= 99) return 'India';
        return null;
    }

    function getWarehouseNoFromSphere(sphere) {
        if (sphere === 'Europe') return 1;
        if (sphere === 'Carribbean') return 2;
        if (sphere === 'India') return 3;
        return null;
    }

    function getWarehouseNoForCoordinate(x, y) {
        return getWarehouseNoFromSphere(getSphereFromCoordinate(x, y));
    }

    function hasTransferGoodsData(transferRow, turnSheetValueRulesFactory) {
        if (!transferRow) return false;
        return turnSheetValueRulesFactory.hasPositiveIntValue(transferRow.from)
            || turnSheetValueRulesFactory.hasPositiveIntValue(transferRow.to)
            || turnSheetValueRulesFactory.hasPositiveIntValue(transferRow.louisdore)
            || turnSheetValueRulesFactory.hasPositiveIntValue(transferRow.citizens)
            || turnSheetValueRulesFactory.hasPositiveIntValue(transferRow.ecPts)
            || turnSheetValueRulesFactory.hasPositiveIntValue(transferRow.wood)
            || turnSheetValueRulesFactory.hasPositiveIntValue(transferRow.horses)
            || turnSheetValueRulesFactory.hasPositiveIntValue(transferRow.textiles);
    }

    function isTransferGoodsRowEmpty(row, turnSheetValueRulesFactory) {
        return !row || !hasTransferGoodsData(row, turnSheetValueRulesFactory);
    }

    function clearTransferGoodsRowValues(row) {
        if (!row) {
            return;
        }
        row.from = null;
        row.to = null;
        row.louisdore = null;
        row.citizens = null;
        row.ecPts = null;
        row.wood = null;
        row.horses = null;
        row.textiles = null;
    }

    function buildManagedStorageKey(prefix, turnId) {
        return prefix + (turnId || '');
    }

    function loadManagedOrderNos(prefix, turnId) {
        try {
            var raw = window.localStorage.getItem(buildManagedStorageKey(prefix, turnId));
            var parsed = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed.map(function (value) {
                return toInt(value, 0);
            }).filter(function (value) {
                return value > 0;
            });
        } catch (e) {
            return [];
        }
    }

    function saveManagedOrderNos(prefix, turnId, orderNos) {
        try {
            window.localStorage.setItem(buildManagedStorageKey(prefix, turnId), JSON.stringify(orderNos || []));
        } catch (e) {
        }
    }

    function getDepotByItemNo(turnReport, depotItemNo) {
        if (!turnReport || depotItemNo == null) return null;
        var barracks = turnReport.barracks || [];
        for (var i = 0; i < barracks.length; i++) {
            if (barracks[i].itemNo == depotItemNo) return barracks[i];
        }

        var ports = turnReport.tradingPortsAndCities || [];
        for (var j = 0; j < ports.length; j++) {
            if (ports[j].itemNo == depotItemNo) return ports[j];
        }

        return null;
    }

    function getDepotSourceItemNoAtCoordinate(turnReport, x, y) {
        if (!turnReport) return null;
        var barracks = turnReport.barracks || [];
        for (var i = 0; i < barracks.length; i++) {
            if (toInt(barracks[i].x, NaN) === toInt(x, NaN) && toInt(barracks[i].y, NaN) === toInt(y, NaN)) return barracks[i].itemNo;
        }

        var ports = turnReport.tradingPortsAndCities || [];
        for (var j = 0; j < ports.length; j++) {
            if (toInt(ports[j].x, NaN) === toInt(x, NaN) && toInt(ports[j].y, NaN) === toInt(y, NaN)) return ports[j].itemNo;
        }

        return null;
    }

    return {
        toInt: toInt,
        getSphereFromCoordinate: getSphereFromCoordinate,
        getWarehouseNoFromSphere: getWarehouseNoFromSphere,
        getWarehouseNoForCoordinate: getWarehouseNoForCoordinate,
        hasTransferGoodsData: hasTransferGoodsData,
        isTransferGoodsRowEmpty: isTransferGoodsRowEmpty,
        clearTransferGoodsRowValues: clearTransferGoodsRowValues,
        buildManagedStorageKey: buildManagedStorageKey,
        loadManagedOrderNos: loadManagedOrderNos,
        saveManagedOrderNos: saveManagedOrderNos,
        getDepotByItemNo: getDepotByItemNo,
        getDepotSourceItemNoAtCoordinate: getDepotSourceItemNoAtCoordinate
    };
});
