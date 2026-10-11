"use strict";

austerlitzModule.controller("intelligencePageController", function ($scope, $location) {
  var intelligenceTabs = { taxRevenue: true };

  $scope.activeIntelligenceTab = "taxRevenue";

  $scope.selectIntelligenceTab = function (tabKey) {
    $scope.activeIntelligenceTab = intelligenceTabs[tabKey] ? tabKey : "taxRevenue";
  };

  $scope.initIntelligence = function () {
    var requestedTab = ($location.search() && $location.search().tab) || "";
    if (intelligenceTabs[requestedTab]) {
      $scope.activeIntelligenceTab = requestedTab;
      $location.search("tab", null);
    }
  };
});
