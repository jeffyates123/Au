"use strict";

austerlitzModule.factory("navyFleetValidationFactory", function () {
  var FLEET_MIN = 11;
  var FLEET_MAX = 30;

  function toInt(value) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  return {
    min: FLEET_MIN,
    max: FLEET_MAX,
    toInt: toInt,
    isClearFleetNo: function (value) {
      var n = toInt(value);
      return n === 0;
    },
    isAssignedFleetNo: function (value) {
      var n = toInt(value);
      return n != null && n > 0;
    },
    isPlayableFleetNo: function (value) {
      var n = toInt(value);
      return n != null && n >= FLEET_MIN && n <= FLEET_MAX;
    },
    isValidOrderFleetNo: function (value) {
      return this.isClearFleetNo(value) || this.isPlayableFleetNo(value);
    },
  };
});
