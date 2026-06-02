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
  };
});
