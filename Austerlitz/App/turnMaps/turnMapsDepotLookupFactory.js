'use strict';

austerlitzModule.factory('turnMapsDepotLookupFactory', function (ts01TransferGoodsUtilsFactory) {
    function getDepotReferenceByItemNo(masterData, depotItemNo) {
        return ts01TransferGoodsUtilsFactory.getDepotByItemNo(masterData && masterData.turnReport, depotItemNo);
    }

    function getSphereFromDepotItemNo(masterData, depotItemNo) {
        var depotRef = getDepotReferenceByItemNo(masterData, depotItemNo);
        if (!depotRef) return null;
        return ts01TransferGoodsUtilsFactory.getSphereFromCoordinate(depotRef.x, depotRef.y);
    }

    function getLocationLabel(masterData, locationItemNo) {
        var location = getDepotReferenceByItemNo(masterData, locationItemNo);
        var rawName = location && location.name ? location.name.toString().trim() : '';
        return rawName ? (locationItemNo + ' ' + rawName) : (locationItemNo != null ? locationItemNo.toString() : '');
    }

    function getLineLocationContext(masterData, depotItemNo) {
        if (!depotItemNo) {
            return null;
        }

        var sphere = getSphereFromDepotItemNo(masterData, depotItemNo);
        var fromWarehouse = ts01TransferGoodsUtilsFactory.getWarehouseNoFromSphere(sphere);
        if (!fromWarehouse) {
            return null;
        }

        return {
            fromWarehouse: fromWarehouse,
            toLocation: depotItemNo,
            locationLabel: getLocationLabel(masterData, depotItemNo)
        };
    }

    return {
        getDepotReferenceByItemNo: getDepotReferenceByItemNo,
        getSphereFromDepotItemNo: getSphereFromDepotItemNo,
        getLocationLabel: getLocationLabel,
        getLineLocationContext: getLineLocationContext
    };
});
