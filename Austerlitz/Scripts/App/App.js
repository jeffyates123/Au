var austerlitzModule = angular.module('austerlitzModule', ['ngRoute', 'ui.bootstrap', 'ngSanitize', 'ngGrid','ui-rangeSlider'])
    .config(function ($routeProvider, $locationProvider) {
        $routeProvider
        .when('/Austerlitz/home', {
            controller: 'homeController',
            templateUrl: '/Austerlitz/Templates/home.html'
        })
        .when('/Austerlitz/BrigadeCalculator', {
            controller: 'brigadeCalculatorController',
            templateUrl: '/Austerlitz/Templates/brigadeCalculator.html'
        })
        .when('/Austerlitz/TurnMaps', {
            controller: 'turnMapsController',
            templateUrl: '/Austerlitz/Templates/turnMapsTemplate.html'
        })
        .otherwise({
            redirectTo: '/Austerlitz/brigadeCalculator'
        });
        //        // use the HTML5 History API
        $locationProvider.html5Mode(true);
    });


