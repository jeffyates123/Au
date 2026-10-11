'use strict';

austerlitzModule.factory('turnMapsPopulationDensityRulesFactory', function () {
    var terrainMaxDensityByCode = {
        B: 9,
        H: 7,
        K: 4,
        Q: 4,
        W: 3,
        T: 1,
        G: 2,
        S: 1,
        D: 0
    };

    var nextRaiseCostByCurrentDensity = {
        0: { citizens: 4000, goods: 320 },
        1: { citizens: 6000, goods: 480 },
        2: { citizens: 10000, goods: 800 },
        3: { citizens: 20000, goods: 1600 },
        4: { citizens: 20000, goods: 1600 },
        5: { citizens: 30000, goods: 2400 },
        6: { citizens: 30000, goods: 2400 },
        7: { citizens: 40000, goods: 3200 },
        8: { citizens: 40000, goods: 3200 }
    };

    function toInt(value, fallback) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? (fallback || 0) : parsed;
    }

    function normalizeStateCode(value) {
        return (value == null ? '' : value.toString()).trim().toUpperCase();
    }

    function getSphereFromCoordinates(x, y) {
        var parsedX = toInt(x, 0);
        var parsedY = toInt(y, 0);

        if (parsedX <= 80 && parsedY <= 65) return 'Europe';
        if (parsedX <= 40 && parsedY <= 99) return 'Caribbean';
        if (parsedX <= 90 && parsedY <= 99) return 'India';
        return 'Unknown';
    }

    function isSeaTerrain(terrainCode) {
        return '.+*'.indexOf((terrainCode || '').toString()) > -1;
    }

    function getTerrainMaxDensity(terrainCode) {
        var normalizedTerrain = normalizeStateCode(terrainCode);
        if (!Object.prototype.hasOwnProperty.call(terrainMaxDensityByCode, normalizedTerrain)) return 0;
        return terrainMaxDensityByCode[normalizedTerrain];
    }

    function getRaiseCostByCurrentDensity(currentDensity) {
        return nextRaiseCostByCurrentDensity[toInt(currentDensity, 0)] || null;
    }

    function resolveRaiseMaterial(selectedNationCode, nextDensity, sphere) {
        if (toInt(nextDensity, 0) >= 4) return 'stone';
        if (normalizeStateCode(selectedNationCode) === 'R') return 'wood';
        if (sphere === 'Caribbean' || sphere === 'India') return 'wood';
        return 'stone';
    }

    return {
        toInt: toInt,
        normalizeStateCode: normalizeStateCode,
        getSphereFromCoordinates: getSphereFromCoordinates,
        isSeaTerrain: isSeaTerrain,
        getTerrainMaxDensity: getTerrainMaxDensity,
        getRaiseCostByCurrentDensity: getRaiseCostByCurrentDensity,
        resolveRaiseMaterial: resolveRaiseMaterial
    };
});
