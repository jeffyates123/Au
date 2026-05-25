'use strict';

austerlitzModule.factory('turnSheetValueRulesFactory', function () {
    function toPositiveIntOrNull(value) {
        var parsed = parseInt(value, 10);
        return isNaN(parsed) || parsed <= 0 ? null : parsed;
    }

    function hasPositiveIntValue(value) {
        return toPositiveIntOrNull(value) != null;
    }

    return {
        toPositiveIntOrNull: toPositiveIntOrNull,
        hasPositiveIntValue: hasPositiveIntValue
    };
});
