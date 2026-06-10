var austerlitzModule = angular.module('austerlitzModule', ['ngRoute', 'ui.bootstrap', 'ngSanitize', 'ngGrid','ui-rangeSlider','smart-table'])
    .config(function ($routeProvider, $locationProvider) {
        $routeProvider
        .when('/home', {
            controller: 'homeController',
            templateUrl: '/Templates/homeTemplate.html'
        })
        .when('/TurnMaps', {
            controller: 'turnMapsController',
            templateUrl: '/Templates/turnMapsTemplate.html'
        })
        .when('/TurnSheet', {
            controller: 'turnSheetAllSectionsController',
            templateUrl: '/Templates/turnSheetAllSectionsTemplate.html'
        })
        .when('/TurnSheet/:section', {
            controller: 'turnSheetReadOnlySectionController',
            templateUrl: '/Templates/turnSheetSectionTemplate.html'
        })
        .when('/Military/Brigades', {
            controller: 'landUnitsController',
            templateUrl: '/Templates/landUnitsTemplate.html'
        })
        .when('/Military/MathBattles', {
            controller: 'mathBattlesController',
            templateUrl: '/Templates/mathBattlesTemplate.html'
        })
        .when('/Military/MathBattles/Stats', {
            controller: 'mathBattlesStatsController',
            templateUrl: '/Templates/mathBattlesStatsTemplate.html'
        })
        .when('/Section/Naval', {
            controller: 'navalUnitsController',
            templateUrl: '/Templates/navalUnitsTemplate.html'
        })
        .when('/Section/:sectionName', {
            controller: 'sectionPlaceholderController',
            templateUrl: '/Templates/sectionPlaceholderTemplate.html'
        })
        .otherwise({
            redirectTo: '/'
        });
        $locationProvider.html5Mode(true);
    });


