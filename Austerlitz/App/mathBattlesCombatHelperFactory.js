"use strict";

austerlitzModule.factory("mathBattlesCombatHelperFactory", function () {
    var ARTILLERY_ITEM_MIN = 41;
    var ARTILLERY_ITEM_MAX = 45;

    function toPositiveInt(value) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    }

    function toText(value) {
        return ((value || "") + "").trim();
    }

    function getField(entity, lowerName, upperName) {
        if (!entity) {
            return null;
        }

        return entity[lowerName] != null ? entity[lowerName] : entity[upperName];
    }

    function getItemNo(armyItem) {
        return toPositiveInt(getField(armyItem, "itemNo", "ItemNo"));
    }

    function isArtilleryArmyItem(armyItem) {
        var itemNo = getItemNo(armyItem);
        return itemNo >= ARTILLERY_ITEM_MIN && itemNo <= ARTILLERY_ITEM_MAX;
    }

    function classifyTroopType(armyItem) {
        if (!armyItem) {
            return "";
        }

        var itemNo = getItemNo(armyItem);
        if (!itemNo) {
            return "";
        }

        if (itemNo === 41 || itemNo === 43) {
            return "Artillery";
        }

        if (itemNo === 45) {
            return "MountedArt";
        }

        if (itemNo >= 21 && itemNo <= 29) {
            var troopSpecification = toText(getField(armyItem, "troopSpecification", "TroopSpecification"));
            return /lc/i.test(troopSpecification) ? "Lc" : "HC";
        }

        if (itemNo < 20) {
            var formation = toText(getField(armyItem, "formation", "Formation"));
            return /sk/i.test(formation) ? "Sk" : "Infantry";
        }

        return "";
    }

    function resolveTerrainTroopType(armyItem) {
        if (!armyItem) {
            return "";
        }

        var explicitType = toText(getField(armyItem, "terrainTroopType", "TerrainTroopType"));
        if (explicitType) {
            return explicitType;
        }

        return classifyTroopType(armyItem);
    }

    return {
        getItemNo: getItemNo,
        isArtilleryArmyItem: isArtilleryArmyItem,
        classifyTroopType: classifyTroopType,
        resolveTerrainTroopType: resolveTerrainTroopType
    };
});
