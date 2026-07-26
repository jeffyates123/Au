'use strict';

austerlitzModule.factory('turnMapsConfigFactory', function () {
    function clone(value) {
        return angular.copy(value);
    }

    var mapChoices = [
        { mapName: 'Europe Full', mapId: 'E', rangeMinX: 1, rangeMaxX: 80, minX: 1, maxX: 80, rangeMinY: 1, rangeMaxY: 65, minY: 10, maxY: 65 },
        { mapName: 'Europe West', mapId: 'EW', rangeMinX: 1, rangeMaxX: 40, minX: 1, maxX: 40, rangeMinY: 1, rangeMaxY: 65, minY: 20, maxY: 65 },
        { mapName: 'Europe East', mapId: 'EE', rangeMinX: 41, rangeMaxX: 80, minX: 41, maxX: 80, rangeMinY: 1, rangeMaxY: 65, minY: 10, maxY: 65 },
        { mapName: 'Caribbean', mapId: 'C', rangeMinX: 1, rangeMaxX: 40, minX: 1, maxX: 40, rangeMinY: 70, rangeMaxY: 99, minY: 70, maxY: 99 },
        { mapName: 'India', mapId: 'I', rangeMinX: 51, rangeMaxX: 90, minX: 51, maxX: 90, rangeMinY: 70, rangeMaxY: 99, minY: 70, maxY: 99 }
    ];

    var displayOptions = [
        { name: 'Terrain', state: false, population: false, productionSite: false, owner: false, terrain: true, bonus: true },
        { name: 'State', state: true, population: true, productionSite: true, owner: false, terrain: false, bonus: false },
        { name: 'ProductionSite', state: false, population: false, productionSite: true, owner: false, terrain: true, bonus: true },
        { name: 'Intelligence', state: true, population: true, productionSite: true, owner: false, terrain: false, bonus: false },
        { name: 'Movement', state: true, population: true, productionSite: true, owner: false, terrain: false, bonus: false },
        { name: 'Movement X', state: true, population: true, productionSite: true, owner: false, terrain: false, bonus: false }
    ];
    var wideScreenMinViewportWidth = 1500;

    return {
        createInitialState: function () {
            var choices = clone(mapChoices);
            var displays = clone(displayOptions);

            return {
                rhsColWidth: 'col-md-12',
                mapChoice: choices,
                selectedMapChoice: choices[1],
                mapOptions: ['State', 'Population', 'ProductionSite', 'Owner', 'Terrain', 'Bonus'],
                selectedMapOptions: ['State', 'Population', 'ProductionSite'],
                displayOptions: displays,
                selectedDisplayOption: displays[5],
                wideScreenMinViewportWidth: wideScreenMinViewportWidth
            };
        },

        getSelectedOptions: function (displayOption) {
            var selectedOptions = [];

            if (displayOption.state) selectedOptions.push('State');
            if (displayOption.population) selectedOptions.push('Population');
            if (displayOption.productionSite) selectedOptions.push('ProductionSite');
            if (displayOption.owner) selectedOptions.push('Owner');
            if (displayOption.terrain) selectedOptions.push('Terrain');
            if (displayOption.bonus) selectedOptions.push('Bonus');

            return selectedOptions;
        },

        isMode: function (selectedDisplayOption, modeName) {
            return selectedDisplayOption && selectedDisplayOption.name === modeName;
        },

        getWideScreenMinViewportWidth: function () {
            return wideScreenMinViewportWidth;
        }
    };
});
