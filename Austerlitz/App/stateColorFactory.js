'use strict';

austerlitzModule.factory('stateColorFactory', function ($window) {
    var fallbackColors = {
        A: 'rgb(198, 23, 23)',
        B: 'rgb(51,153,102)',
        D: 'rgb(255, 204, 153)',
        E: 'rgb(234, 230, 21)',
        F: 'rgb(0, 148, 255)',
        G: 'rgb(135, 219, 106)',
        H: 'rgb(255, 106, 0)',
        I: 'rgb(0, 255, 0)',
        K: 'rgb(181, 36, 165)',
        M: 'rgb(206, 203, 83)',
        N: 'rgb(128, 128, 0)',
        P: 'rgb(128, 128, 128)',
        R: 'rgb(192, 192, 192)',
        S: 'rgb(255, 255, 153)',
        T: 'black',
        W: 'rgb(0, 128, 0)'
    };

    function getCssVariableValue(variableName) {
        if (!$window || !$window.getComputedStyle || !$window.document || !$window.document.documentElement) {
            return '';
        }

        var computedStyles = $window.getComputedStyle($window.document.documentElement);
        return (computedStyles.getPropertyValue(variableName) || '').toString().trim();
    }

    function normalizeStateCode(stateCode) {
        return (stateCode || '').toString().trim().toUpperCase();
    }

    function getColor(stateCode) {
        var normalizedCode = normalizeStateCode(stateCode);
        var cssColor = getCssVariableValue('--state-color-' + normalizedCode);
        if (cssColor) return cssColor;

        return fallbackColors[normalizedCode] || 'rgb(248, 248, 248)';
    }

    function getTextColor(stateCode) {
        return normalizeStateCode(stateCode) === 'T' ? 'rgb(192, 192, 192)' : '#111111';
    }

    return {
        getColor: getColor,
        getTextColor: getTextColor,
        normalizeStateCode: normalizeStateCode
    };
});
