'use strict';

austerlitzModule.factory('turnMapsProductionSitesFactory', function () {
    return {
        attach: function ($scope) {
            $scope.normalizeBuildProductionSiteRows = function (rows) {
                return (rows || []).map(function (row) {
                    row.orderNo = row.orderNo != null ? row.orderNo : row.OrderNo;
                    row.prodSiteType = row.prodSiteType != null ? row.prodSiteType : row.ProdSiteType;
                    row.x = row.x != null ? row.x : row.X;
                    row.y = row.y != null ? row.y : row.Y;

                    row.OrderNo = row.orderNo;
                    row.ProdSiteType = row.prodSiteType;
                    row.X = row.x;
                    row.Y = row.y;
                    return row;
                });
            };

            $scope.getSelectedProductionSiteTypeNo = function () {
                if (!$scope.selectedProductionSite) {
                    return null;
                }

                var selectedTypeNo = $scope.selectedProductionSite.siteTypeNo;
                if (selectedTypeNo == null) {
                    selectedTypeNo = $scope.selectedProductionSite.sitezTypeNo;
                }

                var parsed = parseInt(selectedTypeNo, 10);
                return isNaN(parsed) ? null : parsed;
            };

            $scope.getProductionSiteEligibilityClass = function (coord) {
                if (!coord || !$scope.selectedProductionSite) {
                    return '';
                }

                var coordState = (coord.state || '').toString();
                var coordTerrain = (coord.terrain || '').toString();
                var coordProdSite = (coord.productionSite || '').toString();
                var coordBonus = (coord.bonus || '').toString();
                var coordPopulation = parseInt(coord.population, 10);
                var minPopulation = parseInt($scope.selectedProductionSite.minPopulation, 10);
                var maxPopulation = parseInt($scope.selectedProductionSite.maxPopulation, 10);
                var selectedSiteTypeNo = ($scope.selectedProductionSite.siteTypeNo || $scope.selectedProductionSite.sitezTypeNo || '').toString();
                var selectedStateCode = $scope.selectedState ? ($scope.selectedState.state || $scope.selectedState.State || '') : '';

                if (isNaN(coordPopulation)) coordPopulation = 0;
                if (isNaN(minPopulation)) minPopulation = 0;
                if (isNaN(maxPopulation)) maxPopulation = 0;

                if ($scope.selectedState != null && coordState != selectedStateCode) {
                    return '';
                }

                if ('.+*'.indexOf(coordTerrain) > -1) {
                    return 'terrain_sea';
                }

                if ($scope.selectedProductionSite.bonusSymbol == coordBonus) {
                    if (coordProdSite.trim().length > 0) return 'prodSite_Existing';
                    if (coordPopulation < minPopulation) return 'prodSite_TooFew';
                    if (coordPopulation > maxPopulation) return 'prodSite_TooMany';
                    return 'prodSite_Yes';
                }

                if (($scope.selectedProductionSite.terrain || '').indexOf(coordTerrain) > -1) {
                    if (coordPopulation < minPopulation) return 'prodSite_TooFew';
                    if (coordPopulation > maxPopulation) return 'prodSite_TooMany';

                    if (selectedSiteTypeNo == '1') {
                        if (coordProdSite.trim().length > 0) return 'prodSite_Yes';
                        return ' ';
                    }

                    if (coordProdSite.trim().length > 0) return 'prodSite_Existing';
                    return 'prodSite_Yes';
                }

                if (selectedSiteTypeNo == '21') {
                    if (coordProdSite.trim().length > 0 && ($scope.selectedProductionSite.terrain || '').indexOf(coordProdSite) > -1) return 'prodSite_Yes';
                    return ' ';
                }

                return '';
            };

            $scope.isAllowedProductionSiteClass = function (productionSiteClass) {
                var className = (productionSiteClass || '').toString().trim();
                if (!className) return false;
                if (className === 'terrain_sea') return false;

                return className.indexOf('prodSite_') === 0;
            };

            $scope.canAddProductionSiteAtCoordinate = function (coord, productionSiteClass) {
                var coordClass = productionSiteClass || $scope.getProductionSiteEligibilityClass(coord);
                return $scope.isAllowedProductionSiteClass(coordClass);
            };

            $scope.getProductionSiteRowTypeNo = function (row) {
                var rowTypeNo = row.prodSiteType != null ? row.prodSiteType : row.ProdSiteType;
                var parsed = parseInt(rowTypeNo, 10);
                return isNaN(parsed) ? null : parsed;
            };

            $scope.setProductionSiteRowValues = function (row, prodSiteTypeNo, x, y, productionSiteClass) {
                row.prodSiteType = prodSiteTypeNo;
                row.ProdSiteType = prodSiteTypeNo;
                row.x = x;
                row.X = x;
                row.y = y;
                row.Y = y;
                row.prodSiteStatusClass = productionSiteClass || '';
            };

            $scope.addOrUpdateProductionSiteRecord = function (x, y, productionSiteClass) {
                if (!$scope.tsBuildProductionSitesList) {
                    return;
                }

                var prodSiteTypeNo = $scope.getSelectedProductionSiteTypeNo();
                if (prodSiteTypeNo == null) {
                    return;
                }

                var rowsAtCoord = [];
                angular.forEach($scope.tsBuildProductionSitesList, function (row) {
                    var rowX = row.x != null ? row.x : row.X;
                    var rowY = row.y != null ? row.y : row.Y;

                    if (rowX == x && rowY == y) {
                        rowsAtCoord.push(row);
                    }
                });

                var selectedTypeRow = null;
                angular.forEach(rowsAtCoord, function (row) {
                    if (!selectedTypeRow && $scope.getProductionSiteRowTypeNo(row) === prodSiteTypeNo) {
                        selectedTypeRow = row;
                    }
                });

                if (selectedTypeRow) {
                    $scope.setProductionSiteRowValues(selectedTypeRow, prodSiteTypeNo, x, y, productionSiteClass);
                    $scope.queueAutoSaveTsGrid('BuildProductionSites');
                    return;
                }

                var hasDemolitionRow = rowsAtCoord.some(function (row) {
                    return $scope.getProductionSiteRowTypeNo(row) === 1;
                });

                var canAddSecondRow = rowsAtCoord.length < 2 && (prodSiteTypeNo === 1 || hasDemolitionRow);

                if (!canAddSecondRow && rowsAtCoord.length > 0) {
                    var rowToUpdate = rowsAtCoord[0];
                    angular.forEach(rowsAtCoord, function (row) {
                        if ($scope.getProductionSiteRowTypeNo(row) !== 1) {
                            rowToUpdate = row;
                        }
                    });

                    $scope.setProductionSiteRowValues(rowToUpdate, prodSiteTypeNo, x, y, productionSiteClass);
                    $scope.queueAutoSaveTsGrid('BuildProductionSites');
                    return;
                }

                var firstAvailableRow = null;
                angular.forEach($scope.tsBuildProductionSitesList, function (row) {
                    if (firstAvailableRow) return;

                    var rowX = row.x != null ? row.x : row.X;
                    var rowY = row.y != null ? row.y : row.Y;
                    if ((rowX == null || rowX === '') && (rowY == null || rowY === '')) {
                        firstAvailableRow = row;
                    }
                });

                if (firstAvailableRow) {
                    $scope.setProductionSiteRowValues(firstAvailableRow, prodSiteTypeNo, x, y, productionSiteClass);
                    $scope.queueAutoSaveTsGrid('BuildProductionSites');
                }
            };

            $scope.getProductionSiteRowClass = function (row) {
                if (!row) return '';

                var rowClass = row.prodSiteStatusClass || '';
                return $scope.isAllowedProductionSiteClass(rowClass) ? rowClass : '';
            };

            $scope.hasProductionSiteData = function (productionSiteRow) {
                if (!productionSiteRow) return false;

                var prodSiteType = productionSiteRow.prodSiteType != null ? productionSiteRow.prodSiteType : productionSiteRow.ProdSiteType;
                var x = productionSiteRow.x != null ? productionSiteRow.x : productionSiteRow.X;
                var y = productionSiteRow.y != null ? productionSiteRow.y : productionSiteRow.Y;

                return prodSiteType != null || x != null || y != null;
            };

            $scope.removeProductionSiteRow = function (row) {
                if (!row || !row.entity) return;

                row.entity.prodSiteType = null;
                row.entity.ProdSiteType = null;
                row.entity.x = null;
                row.entity.X = null;
                row.entity.y = null;
                row.entity.Y = null;

                $scope.queueAutoSaveTsGrid('BuildProductionSites');
            };
        }
    };
});
