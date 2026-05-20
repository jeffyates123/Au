'use strict';

austerlitzModule.factory('turnMapsFormFederationsFactory', function () {
    return {
        attach: function ($scope) {
            $scope.normalizeFormFederationRows = function (rows) {
                return rows || [];
            };

            $scope.isFederationColumnClick = function (col) {
                if (!col) return false;

                var fieldName = col.field || (col.colDef && col.colDef.field) || '';
                return fieldName === 'fed';
            };

            $scope.isValueAlreadyUsedInMovementOrFormFederation = function (itemOrFedNo) {
                if (itemOrFedNo == null || itemOrFedNo === '') return false;

                var inMovement = $scope.tsMovementList && $scope.tsMovementList.some(function (movementRow) {
                    return movementRow.itemNo == itemOrFedNo;
                });

                if (inMovement) return true;

                var inFormFederation = $scope.tsFormFederationsList && $scope.tsFormFederationsList.some(function (row) {
                    return row.itemNo == itemOrFedNo;
                });

                return !!inFormFederation;
            };

            $scope.getCurrentStateCode = function () {
                return ($scope.masterData && $scope.masterData.selectedState ? $scope.masterData.selectedState : '').toString().trim().toUpperCase();
            };

            $scope.isSeaItemType = function (item) {
                if (!item) return false;

                var typeName = $scope.getItemTypeName(item.itemType);
                if (!typeName && item.itemTypeName) {
                    typeName = item.itemTypeName;
                }

                return typeName === 'Warship' || typeName === 'MerchantShip';
            };

            $scope.isFederationEligibleItem = function (item) {
                if (!item) return false;

                var typeName = $scope.getItemTypeName(item.itemType);
                if (!typeName && item.itemTypeName) {
                    typeName = item.itemTypeName;
                }

                return typeName === 'Commander'
                    || typeName === 'Brigade'
                    || typeName === 'BaggageTrain'
                    || typeName === 'Warship'
                    || typeName === 'MerchantShip';
            };

            $scope.getFormFederationCandidateItems = function () {
                if (!$scope.filteredMovementItemsForMap || !$scope.mapCoordinates) {
                    return [];
                }

                var currentStateCode = $scope.getCurrentStateCode();

                return $scope.filteredMovementItemsForMap.filter(function (item) {
                    if (!item || item.itemNo == null) return false;
                    if (!$scope.isFederationEligibleItem(item)) return false;

                    var coord = $scope.getCoordinateByXY(item.x, item.y);
                    if (!coord) return false;

                    var coordState = (coord.state || '').toString().trim().toUpperCase();
                    return coordState === currentStateCode;
                });
            };

            $scope.isItemAlreadyInFormFederationGrid = function (itemNo) {
                if (!itemNo || !$scope.tsFormFederationsList) return false;

                return $scope.tsFormFederationsList.some(function (row) {
                    return row.itemNo == itemNo;
                });
            };

            $scope.getUsedFederationNumbers = function () {
                var used = {};

                if ($scope.masterData && $scope.masterData.turnReport && $scope.masterData.turnReport.movementItemList) {
                    angular.forEach($scope.masterData.turnReport.movementItemList, function (item) {
                        if (item.federationNo != null && item.federationNo !== '') {
                            used[parseInt(item.federationNo, 10)] = true;
                        }
                    });
                }

                if ($scope.tsFormFederationsList) {
                    angular.forEach($scope.tsFormFederationsList, function (row) {
                        if (row.federation_Fleet != null && row.federation_Fleet !== '') {
                            used[parseInt(row.federation_Fleet, 10)] = true;
                        }
                    });
                }

                return used;
            };

            $scope.getNextAvailableFederationNo = function (isSeaUnit) {
                var rangeStart = isSeaUnit ? 11 : 61;
                var rangeEnd = isSeaUnit ? 60 : 90;
                var used = $scope.getUsedFederationNumbers();

                for (var fedNo = rangeStart; fedNo <= rangeEnd; fedNo++) {
                    if (!used[fedNo]) return fedNo;
                }

                return null;
            };

            $scope.getExistingFederationForCoordinateAndType = function (x, y, isSeaUnit) {
                if (!$scope.tsFormFederationsList || !$scope.masterData || !$scope.masterData.turnReport || !$scope.masterData.turnReport.movementItemList) {
                    return null;
                }

                for (var i = $scope.tsFormFederationsList.length - 1; i >= 0; i--) {
                    var federationRow = $scope.tsFormFederationsList[i];

                    if (federationRow.itemNo == null || federationRow.itemNo === '' || federationRow.federation_Fleet == null || federationRow.federation_Fleet === '') {
                        continue;
                    }

                    var existingItem = $scope.getItemFromItemNo(federationRow.itemNo);
                    if (!existingItem || existingItem.itemNo == null) {
                        continue;
                    }

                    if (existingItem.x == x
                        && existingItem.y == y
                        && $scope.isSeaItemType(existingItem) === isSeaUnit) {
                        var parsedFed = parseInt(federationRow.federation_Fleet, 10);
                        return isNaN(parsedFed) ? null : parsedFed;
                    }
                }

                return null;
            };

            $scope.addItemToFormFederationGrid = function (row, clickedFederationColumn) {
                if (!row || !row.entity || !row.entity.itemNo || !$scope.tsFormFederationsList) return;

                var sourceItemNo = row.entity.originalItemNo != null ? row.entity.originalItemNo : row.entity.itemNo;
                if (clickedFederationColumn && row.entity.fed != null && row.entity.fed !== '') {
                    sourceItemNo = row.entity.fed;
                }

                if (!$scope.isFederationEligibleItem(row.entity)) return;

                if ($scope.isItemAlreadyInFormFederationGrid(sourceItemNo)) {
                    alert('This unit/federation is already used in Form Federation grid.');
                    return;
                }

                var isSeaUnit = $scope.isSeaItemType(row.entity);
                var federationNo = $scope.getExistingFederationForCoordinateAndType(row.entity.x, row.entity.y, isSeaUnit);

                if (federationNo == null) {
                    federationNo = $scope.getNextAvailableFederationNo(isSeaUnit);
                    if (federationNo == null) {
                        alert(isSeaUnit ? 'No available fleet federation numbers (11-60).' : 'No available land federation numbers (61-90).');
                        return;
                    }
                }

                var firstAvailableRow = null;
                angular.forEach($scope.tsFormFederationsList, function (federationRow) {
                    if (firstAvailableRow == null && (federationRow.itemNo == null || federationRow.itemNo === '')) {
                        firstAvailableRow = federationRow;
                    }
                });

                if (!firstAvailableRow) {
                    alert('No empty TS_14 row is available.');
                    return;
                }

                firstAvailableRow.itemNo = sourceItemNo;
                firstAvailableRow.federation_Fleet = federationNo;
            };

            $scope.hasFormFederationItemNo = function (federationRow) {
                if (!federationRow) return false;

                return federationRow.itemNo != null && federationRow.itemNo.toString().trim() !== '';
            };

            $scope.removeFormFederationRow = function (row) {
                if (!row || !row.entity) return;

                row.entity.itemNo = null;
                row.entity.federation_Fleet = null;

                $scope.queueAutoSaveTsGrid('FormFederations');
            };
        }
    };
});
