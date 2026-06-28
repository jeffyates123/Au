'use strict';

austerlitzModule.factory('turnMapsMovementItemFactory', function () {
    function toMovementPickerItemId(value) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }

    function getEffectiveMovementFederationNoForItem(item, movementEffectiveFederationByItemNo) {
        var itemNo = toMovementPickerItemId(item && (item.originalItemNo != null ? item.originalItemNo : item.itemNo));
        if (itemNo != null
            && movementEffectiveFederationByItemNo
            && Object.prototype.hasOwnProperty.call(movementEffectiveFederationByItemNo, itemNo)) {
            return movementEffectiveFederationByItemNo[itemNo];
        }
        return item && item.federationNo != null ? item.federationNo : null;
    }

    function getFederationMovementSummary(federationNo, movementItemList, movementEffectiveFederationByItemNo) {
        if (!movementItemList) return {};

        var parsedFederationNo = parseInt(federationNo, 10);
        if (isNaN(parsedFederationNo)) return {};

        var federationItems = movementItemList.filter(function (item) {
            return getEffectiveMovementFederationNoForItem(item, movementEffectiveFederationByItemNo) == parsedFederationNo;
        });

        if (!federationItems.length) return {};

        var slowestItem = federationItems[0];
        angular.forEach(federationItems, function (item) {
            var itemMp = item.originalMP != null ? item.originalMP : item.mp;
            var slowestMp = slowestItem.originalMP != null ? slowestItem.originalMP : slowestItem.mp;
            if (itemMp < slowestMp) {
                slowestItem = item;
            }
        });

        return {
            itemNo: parsedFederationNo,
            itemTypeName: 'Federation',
            itemType: slowestItem.itemType,
            shipTypeNo: slowestItem.shipTypeNo,
            mp: slowestItem.originalMP != null ? slowestItem.originalMP : slowestItem.mp,
            x: slowestItem.x,
            y: slowestItem.y,
            federationNo: parsedFederationNo,
            isFederation: true
        };
    }

    function getItemFromItemNo(itemNo, preferFederation, movementItemList, movementEffectiveFederationByItemNo) {
        var rtnItem = {};
        var parsedItemNo = parseInt(itemNo, 10);

        if (preferFederation) {
            rtnItem = getFederationMovementSummary(parsedItemNo, movementItemList, movementEffectiveFederationByItemNo);
            if (rtnItem && rtnItem.itemNo != null) {
                return rtnItem;
            }
        }

        angular.forEach(movementItemList || [], function (item) {
            if (item.originalItemNo == parsedItemNo) {
                rtnItem = item;
            }
        });

        if (!rtnItem || rtnItem.itemNo == null) {
            angular.forEach(movementItemList || [], function (item) {
                var memberMatch = item.memberItemNos && item.memberItemNos.indexOf(parsedItemNo) > -1;
                if (item.itemNo == parsedItemNo || memberMatch) {
                    rtnItem = item;
                }
            });
        }

        if (!rtnItem || rtnItem.itemNo == null) {
            rtnItem = getFederationMovementSummary(itemNo, movementItemList, movementEffectiveFederationByItemNo);
        }

        return rtnItem;
    }

    return {
        toMovementPickerItemId: toMovementPickerItemId,
        getEffectiveMovementFederationNoForItem: getEffectiveMovementFederationNoForItem,
        getFederationMovementSummary: getFederationMovementSummary,
        getItemFromItemNo: getItemFromItemNo
    };
});
