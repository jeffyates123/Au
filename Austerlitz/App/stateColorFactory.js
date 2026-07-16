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

    function parseColorToRgb(colorValue) {
        var value = (colorValue || '').toString().trim().toLowerCase();
        if (!value) return null;

        if (value === 'black') return { r: 0, g: 0, b: 0 };
        if (value === 'white') return { r: 255, g: 255, b: 255 };

        var rgbMatch = value.match(/^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/);
        if (rgbMatch) {
            return {
                r: Math.max(0, Math.min(255, parseInt(rgbMatch[1], 10))),
                g: Math.max(0, Math.min(255, parseInt(rgbMatch[2], 10))),
                b: Math.max(0, Math.min(255, parseInt(rgbMatch[3], 10)))
            };
        }

        var hexMatch = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
        if (hexMatch) {
            var hex = hexMatch[1];
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }

            return {
                r: parseInt(hex.substr(0, 2), 16),
                g: parseInt(hex.substr(2, 2), 16),
                b: parseInt(hex.substr(4, 2), 16)
            };
        }

        return null;
    }

    function getLuminance(colorValue) {
        var rgb = parseColorToRgb(colorValue);
        if (!rgb) return 0;

        return ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
    }

    function getReadableTextColor(colorValue) {
        return getLuminance(colorValue) >= 145 ? '#111111' : '#ffffff';
    }

    function getReadableTextClass(colorValue) {
        return getReadableTextColor(colorValue) === '#111111' ? 'intelText_Dark' : 'intelText_Light';
    }

    return {
        getColor: getColor,
        getTextColor: getTextColor,
        normalizeStateCode: normalizeStateCode,
        getLuminance: getLuminance,
        getReadableTextColor: getReadableTextColor,
        getReadableTextClass: getReadableTextClass
    };
});
