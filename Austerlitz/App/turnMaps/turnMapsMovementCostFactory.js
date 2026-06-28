'use strict';

austerlitzModule.factory('turnMapsMovementCostFactory', function () {
    function isColonialCoordinate(coord) {
        if (!coord || coord.y == null) return false;
        return parseInt(coord.y, 10) >= 70;
    }

    function isShipyardCoordinate(coord) {
        if (!coord || !coord.productionSite) return false;

        var site = coord.productionSite.toString().toUpperCase();
        return site === '&' || site === '$';
    }

    function isShipItem(item, isNavalMovementItem) {
        if (!item) return false;
        if (typeof isNavalMovementItem !== 'function') return false;
        return isNavalMovementItem(item);
    }

    function getTerrainMPForItem(coord, item, options) {
        if (!coord) return 999;

        var opts = options || {};
        var terrain = coord.terrain;
        var isSea = '*+.'.indexOf(terrain) > -1;
        var isShip = isShipItem(item, opts.isNavalMovementItem);
        var moveCost = 0;

        if (isShip) {
            if (isSea || isShipyardCoordinate(coord)) {
                moveCost = 1;
            } else {
                return 999;
            }
        } else {
            if (isSea) return 999;
            if (typeof opts.getTerrainMP !== 'function') return 999;
            moveCost = opts.getTerrainMP(terrain);
        }

        if (isColonialCoordinate(coord) && moveCost > 0 && moveCost < 999) {
            moveCost = moveCost * 2;
        }

        return moveCost;
    }

    return {
        isColonialCoordinate: isColonialCoordinate,
        isShipyardCoordinate: isShipyardCoordinate,
        isShipItem: isShipItem,
        getTerrainMPForItem: getTerrainMPForItem
    };
});
