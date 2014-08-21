austerlitzModule.controller("brigadeCalculatorController", function ($scope, $routeParams, rulesCatalogFactory, turnSheetFactory) {

    rulesCatalogFactory.getArmyList().then(function (armyList) {
        $scope.armyList = armyList;
    });

    turnSheetFactory.getTurnSheetSetUpBrigades("abc123").then(function (turnSheetSetUpBrigades) {
        $scope.turnSheetSetUpBrigades = turnSheetSetUpBrigades;
    });




//    $scope.armyList2 = [{ "itemNo": 1, "state": "E", "name": "Grenadier", "shortName": "GR", "cost": 160, "ecPtsPer25": 5, "ef": 8, "hc": 5, "lr": 3, "rg": 6, "simMP": 6, "mp": 28, "formation": "Co,Li, Sq", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 3, "state": "E", "name": "Light Infantry", "shortName": "Li", "cost": 100, "ecPtsPer25": 4, "ef": 6, "hc": 3, "lr": 2, "rg": 8, "simMP": 8, "mp": 28, "formation": "Co,Li,Sk", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 5, "state": "E", "name": "Line Infantry", "shortName": "Ln", "cost": 100, "ecPtsPer25": 4, "ef": 6, "hc": 4, "lr": 2, "rg": 6, "simMP": 6, "mp": 28, "formation": "Co,Li, Sq", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 7, "state": "E", "name": "Militia", "shortName": "Mi", "cost": 80, "ecPtsPer25": 2, "ef": 5, "hc": 3, "lr": 1, "rg": 6, "simMP": 8, "mp": 28, "formation": "Co", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 9, "state": "E", "name": "Pioneers", "shortName": "Pi", "cost": 180, "ecPtsPer25": 7, "ef": 6, "hc": 2, "lr": 1, "rg": 6, "simMP": 6, "mp": 28, "formation": "Co", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 11, "state": "E", "name": "Riflemen", "shortName": "Rm", "cost": 130, "ecPtsPer25": 5, "ef": 7, "hc": 3, "lr": 3, "rg": 8, "simMP": 8, "mp": 28, "formation": "Co,Li,Sk", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 17, "state": "E", "name": "Colonial Auxiliaries", "shortName": "Ca", "cost": 70, "ecPtsPer25": 2, "ef": 4, "hc": 2, "lr": 1, "rg": 6, "simMP": 10, "mp": 32, "formation": "Co", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 19, "state": "E", "name": "Colonial Troops", "shortName": "Kt", "cost": 400, "ecPtsPer25": 5, "ef": 6, "hc": 4, "lr": 2, "rg": 6, "simMP": 8, "mp": 32, "formation": "Co,Li,Sk,Sq", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 21, "state": "E", "name": "Cuirassier", "shortName": "Cu", "cost": 220, "ecPtsPer25": 14, "ef": 8, "hc": 8, "lr": 0, "rg": 0, "simMP": 14, "mp": 28, "formation": "Co,Li", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": "Cu" }, { "itemNo": 22, "state": "E", "name": "Garde de Corps", "shortName": "Gc", "cost": 230, "ecPtsPer25": 14, "ef": 10, "hc": 8, "lr": 2, "rg": 3, "simMP": 14, "mp": 32, "formation": "Co,Li", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": "Cu" }, { "itemNo": 23, "state": "E", "name": "Dragoon", "shortName": "Dr", "cost": 180, "ecPtsPer25": 8, "ef": 7, "hc": 6, "lr": 1, "rg": 3, "simMP": 18, "mp": 36, "formation": "Co,Li", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 25, "state": "E", "name": "Hussar", "shortName": "Hu", "cost": 120, "ecPtsPer25": 5, "ef": 7, "hc": 4, "lr": 1, "rg": 7, "simMP": 20, "mp": 36, "formation": "Co,Li,Sk", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": "Lc" }, { "itemNo": 27, "state": "E", "name": "Uhlan", "shortName": "Uh", "cost": 160, "ecPtsPer25": 8, "ef": 7, "hc": 5, "lr": 0, "rg": 0, "simMP": 20, "mp": 36, "formation": "Co,Li", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": "Lc,Lr" }, { "itemNo": 29, "state": "E", "name": "Militia Cavalry", "shortName": "Ml", "cost": 80, "ecPtsPer25": 3, "ef": 5, "hc": 3, "lr": 1, "rg": 3, "simMP": 20, "mp": 40, "formation": "Co", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": "Lc" }, { "itemNo": 37, "state": "E", "name": "Mounted Colonials", "shortName": "Mc", "cost": 100, "ecPtsPer25": 2, "ef": 4, "hc": 3, "lr": 1, "rg": 6, "simMP": 20, "mp": 40, "formation": "Co, Sk", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": "Lc" }, { "itemNo": 39, "state": "E", "name": "Colonial Cavalry", "shortName": "Cc", "cost": 120, "ecPtsPer25": 2, "ef": 4, "hc": 4, "lr": 0, "rg": 0, "simMP": 20, "mp": 40, "formation": "Co,Li", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": "Lc,Lr" }, { "itemNo": 41, "state": "E", "name": "Light Artillery", "shortName": "La", "cost": 200, "ecPtsPer25": 12, "ef": 6, "hc": 1, "lr": 5, "rg": 12, "simMP": 6, "mp": 28, "formation": "Co", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 43, "state": "E", "name": "Heavy Artillery", "shortName": "Ha", "cost": 330, "ecPtsPer25": 20, "ef": 7, "hc": 1, "lr": 5, "rg": 15, "simMP": 4, "mp": 24, "formation": "Co", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }, { "itemNo": 45, "state": "E", "name": "Mounted Artillery", "shortName": "Ma", "cost": 250, "ecPtsPer25": 16, "ef": 7, "hc": 1, "lr": 6, "rg": 10, "simMP": 12, "mp": 36, "formation": "Co", "allow_Co": true, "allow_Li": false, "allow_Sk": false, "allow_Sq": false, "isColonial": false, "troopSpecification": null }]

    $scope.lhsColWidth = "col-md-6";
    $scope.rhsColWidth = "col-md-6";
    $scope.selectedBrigadeNo = null;

    $scope.init = function () {
        $scope.lhsColWidth = "col-md-6";
        $scope.rhsColWidth = "col-md-6"; 
    };

    $scope.saveTurnSheetSetUpBrigades = function () {
        turnSheetFactory.postTurnSheetSetUpBrigades($scope.turnSheetSetUpBrigades).then(function (returnTurnSheetSetUpBrigades) {
            $scope.turnSheetSetUpBrigades = returnTurnSheetSetUpBrigades;
        });
    }

    $scope.addBrigadeToTurnSheet = function (selectedBrigadeNo, orderNo, battNo) {
        angular.forEach($scope.turnSheetSetUpBrigades, function (setupBrigade, index) {
            if (setupBrigade.orderNo == orderNo) {
                setupBrigade[battNo] = $scope.selectedBrigadeNo;
            }
        });
    };

    $scope.selectBrigadeToAdd = function (brigadeItemNo) {
        $scope.selectedBrigadeNo = brigadeItemNo;
    };

});