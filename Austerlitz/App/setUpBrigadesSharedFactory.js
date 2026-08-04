"use strict";

austerlitzModule.factory("setUpBrigadesSharedFactory", function () {
  var TS_COST_TYPE_ORDER = ["TS03", "TS04", "TS05", "TS06"];
  var TS_COST_LABELS = {
    TS03: "Set Up Brigades",
    TS04: "Set Up Additional Battalions",
    TS05: "Increase Headcount",
    TS06: "Increase Brigade XP (Train)",
  };
  var BATT_FIELDS = [
    "batt1",
    "batt2",
    "batt3",
    "batt4",
    "batt5",
    "batt6",
    "batt7",
  ];

  var MAX_SET_UP_BRIGADES_ROWS = 8;
  var RECRUITS_PER_BATTALION = 800;
  var RECRUITS_PER_EC_BLOCK = 25;
  var MANAGED_TS01_ROW_LIMIT = 10;

  function hasMeaningfulText(value) {
    if (value == null) return false;
    var text = value.toString().trim();
    return (
      !!text &&
      text !== "<Brigade Name>" &&
      text.toLowerCase() !== "temp brigade name"
    );
  }

  function hasAnyGoods(goods, toInt) {
    if (!goods) return false;
    return (
      toInt(goods.louisdore, 0) > 0 ||
      toInt(goods.citizens, 0) > 0 ||
      toInt(goods.ecPts, 0) > 0 ||
      toInt(goods.horses, 0) > 0 ||
      toInt(goods.wood, 0) > 0 ||
      toInt(goods.textiles, 0) > 0
    );
  }

  function toFloat(value, fallback) {
    var parsed = parseFloat(value);
    return isNaN(parsed) ? fallback || 0 : parsed;
  }

  function getSectionNoFromTsType(tsType) {
    var text = (tsType || "").toString().trim().toUpperCase();
    if (!text) return null;
    if (text.indexOf("TS") === 0) text = text.substring(2);
    var parsed = parseInt(text, 10);
    return isNaN(parsed) ? null : parsed;
  }

  function getTsTypeSortOrder(tsType) {
    var idx = TS_COST_TYPE_ORDER.indexOf(tsType);
    return idx >= 0 ? idx : TS_COST_TYPE_ORDER.length + 99;
  }

  function getSortedFilledRows(rows, requiredFields, toInt) {
    return (rows || [])
      .filter(function (row) {
        return requiredFields.every(function (field) {
          return row && row[field] != null && row[field] !== "";
        });
      })
      .sort(function (left, right) {
        return toInt(left && left.orderNo, 0) - toInt(right && right.orderNo, 0);
      });
  }

  function normalizeSetUpBrigadeRow(row, valueRules) {
    angular.forEach(["depot"].concat(BATT_FIELDS), function (field) {
      row[field] = valueRules.toPositiveIntOrNull(row[field]);
    });
    if (!row.depot || !hasMeaningfulText(row.brigadeName)) {
      row.brigadeName = "";
    }
    return row;
  }

  function normalizeTransferGoodsRows(rows, valueRules) {
    return (rows || []).map(function (row) {
      angular.forEach(
        ["from", "to", "louisdore", "citizens", "ecPts", "wood", "horses", "textiles"],
        function (field) {
          row[field] = valueRules.toPositiveIntOrNull(row[field]);
        },
      );
      return row;
    });
  }

  function getTransferGoodsCostRows(rows) {
    return (rows || []).filter(function (row) {
      return (
        row.from != null ||
        row.to != null ||
        row.louisdore != null ||
        row.citizens != null ||
        row.ecPts != null ||
        row.horses != null
      );
    });
  }

  function calculateHeadcountEfDrop(missingMen, size) {
    if (missingMen <= 0) return 0;
    if (missingMen > size) return 2;
    if (missingMen > size * 0.5) return 1;
    return 0;
  }

  function isMountedArmyItem(armyItem) {
    if (!armyItem) return false;
    var shortName = (armyItem.shortName || "").toString();
    var name = (armyItem.name || "").toString();
    return (
      !!armyItem.isCavalry || /mounted/i.test(name) || /^mc$/i.test(shortName)
    );
  }

  return {
    TS_COST_TYPE_ORDER: TS_COST_TYPE_ORDER,
    TS_COST_LABELS: TS_COST_LABELS,
    BATT_FIELDS: BATT_FIELDS,
    MAX_SET_UP_BRIGADES_ROWS: MAX_SET_UP_BRIGADES_ROWS,
    RECRUITS_PER_BATTALION: RECRUITS_PER_BATTALION,
    RECRUITS_PER_EC_BLOCK: RECRUITS_PER_EC_BLOCK,
    MANAGED_TS01_ROW_LIMIT: MANAGED_TS01_ROW_LIMIT,
    hasMeaningfulText: hasMeaningfulText,
    hasAnyGoods: hasAnyGoods,
    toFloat: toFloat,
    getSectionNoFromTsType: getSectionNoFromTsType,
    getTsTypeSortOrder: getTsTypeSortOrder,
    getSortedFilledRows: getSortedFilledRows,
    normalizeSetUpBrigadeRow: normalizeSetUpBrigadeRow,
    normalizeTransferGoodsRows: normalizeTransferGoodsRows,
    getTransferGoodsCostRows: getTransferGoodsCostRows,
    calculateHeadcountEfDrop: calculateHeadcountEfDrop,
    isMountedArmyItem: isMountedArmyItem,
  };
});
