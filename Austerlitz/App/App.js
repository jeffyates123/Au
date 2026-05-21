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
        .when('/TurnSheet/:section', {
            controller: 'turnSheetSectionController',
            templateUrl: '/Templates/turnSheetSectionTemplate.html'
        })
        .otherwise({
            redirectTo: '/'
        });
        $locationProvider.html5Mode(true);
    });


