"use strict";

austerlitzModule.factory("economyParseUtilsFactory", function () {
  function toInt(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  function toFloat(value, fallback) {
    var parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  function toText(value, fallback) {
    if (value == null) {
      return fallback;
    }
    var text = value.toString().trim();
    return text ? text : fallback;
  }

  function normalizeStateCode(value) {
    var text = toText(value, "").toUpperCase();
    if (!text) {
      return "";
    }
    return text.charAt(0);
  }

  function normalizeStrictUpperStateCode(value) {
    var raw = toText(value, "");
    if (!raw) {
      return "";
    }
    var first = raw.charAt(0);
    // Economy production counting should ignore lower-case state markers.
    if (first < "A" || first > "Z") {
      return "";
    }
    return first;
  }

  return {
    toInt: toInt,
    toFloat: toFloat,
    toText: toText,
    normalizeStateCode: normalizeStateCode,
    normalizeStrictUpperStateCode: normalizeStrictUpperStateCode,
  };
});
