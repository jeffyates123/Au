var austerlitzModule = angular.module('austerlitzModule', ['ngRoute', 'ui.bootstrap', 'ngSanitize', 'ngGrid','ui-rangeSlider','smart-table'])
    .config(function ($routeProvider, $locationProvider) {
        $routeProvider
        .when('/home', {
            controller: 'homeController',
            templateUrl: '/Templates/homeTemplate.html'
        })
        .when('/BrigadeCalculator', {
            controller: 'brigadeCalculatorController',
            templateUrl: '/Templates/brigadeCalculatorTemplate.html'
        })
        .when('/Boarding', {
            controller: 'boardingController',
            templateUrl: '/Templates/boardingTemplate.html'
        })
        .when('/TurnMaps', {
            controller: 'turnMapsController',
            templateUrl: '/Templates/turnMapsTemplate.html'
        })
        .otherwise({
            redirectTo: '/'
        });
        //        // use the HTML5 History API
        $locationProvider.html5Mode(true);
    });


