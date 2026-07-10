"use strict";

austerlitzModule.factory(
  "landUnitsSetUpBrigadesFactory",
  function (
    turnSheetValueRulesFactory,
    ts01TransferGoodsUtilsFactory,
    turnMapsDepotLookupFactory,
    turnMapsTsTransferBuilderFactory,
    turnMapsTransferGoodsStorageFactory,
    setUpBrigadesSharedFactory,
    setUpTransferPipelineFactory,
  ) {
    var TS_COST_TYPE_ORDER = setUpBrigadesSharedFactory.TS_COST_TYPE_ORDER;
    var TS_COST_LABELS = setUpBrigadesSharedFactory.TS_COST_LABELS;
    var BATT_FIELDS = setUpBrigadesSharedFactory.BATT_FIELDS;
    var MAX_SET_UP_BRIGADES_ROWS =
      setUpBrigadesSharedFactory.MAX_SET_UP_BRIGADES_ROWS;
    var RECRUITS_PER_BATTALION =
      setUpBrigadesSharedFactory.RECRUITS_PER_BATTALION;
    var RECRUITS_PER_EC_BLOCK =
      setUpBrigadesSharedFactory.RECRUITS_PER_EC_BLOCK;
    var MANAGED_TS01_ROW_LIMIT =
      setUpBrigadesSharedFactory.MANAGED_TS01_ROW_LIMIT;
    var MANAGED_TS01_STORAGE_KEY_PREFIX =
      "austerlitz.landUnits.managedTs01Rows.";
    var ARMY_MANAGED_TS01_SECTIONS = { 3: true, 4: true, 5: true, 6: true };
    var SPHERE_ALL = "All";
    var SPHERE_EUROPE = "Europe";
    var SPHERE_CARIBBEAN = "Caribbean";
    var SPHERE_INDIA = "India";
    var SPHERE_UNKNOWN = "Unknown";
    var DEFAULT_TURN_STATE_CODE = "E";

    function toInt(value, fallback) {
      return ts01TransferGoodsUtilsFactory.toInt(value, fallback);
    }

    function toFloat(value, fallback) {
      var parsed = parseFloat(value);
      return isNaN(parsed) ? fallback || 0 : parsed;
    }

    function hasMeaningfulText(value) {
      return setUpBrigadesSharedFactory.hasMeaningfulText(value);
    }

    function hasAnyGoods(goods) {
      return setUpBrigadesSharedFactory.hasAnyGoods(goods, toInt);
    }

    function normalizeSphereName(sphere) {
      var text = (sphere || "").toString().trim();
      if (!text) return SPHERE_UNKNOWN;
      var upper = text.toUpperCase();
      if (upper === "ALL") return SPHERE_ALL;
      if (upper === "EUROPE") return SPHERE_EUROPE;
      if (upper === "INDIA") return SPHERE_INDIA;
      if (
        upper === "CARIBBEAN" ||
        upper === "CARRIBEAN" ||
        upper === "CARRIBBEAN"
      )
        return SPHERE_CARIBBEAN;
      return text;
    }

    function hasPositiveIntValue(value) {
      return turnSheetValueRulesFactory.hasPositiveIntValue(value);
    }

    function getSectionNumber(sectionNo) {
      var text = (sectionNo || "").toString().trim().toUpperCase();
      if (!text) return null;
      if (text.indexOf("TS") === 0) text = text.substring(2);
      var parsed = parseInt(text, 10);
      return isNaN(parsed) ? null : parsed;
    }

    function getSectionNoFromTsType(tsType) {
      var text = (tsType || "").toString().trim().toUpperCase();
      if (!text) return null;
      if (text.indexOf("TS") === 0) {
        text = text.substring(2);
      }
      var parsed = parseInt(text, 10);
      return isNaN(parsed) ? null : parsed;
    }

    function hasAnySetUpBattalion(row) {
      return BATT_FIELDS.some(function (field) {
        return hasPositiveIntValue(row && row[field]);
      });
    }

    function hasAnySetUpRowData(row) {
      return (
        hasPositiveIntValue(row && row.depot) ||
        hasAnySetUpBattalion(row) ||
        hasMeaningfulText(row && row.brigadeName)
      );
    }

    function hasFirstFiveBattalions(row) {
      if (!row) return false;
      for (var i = 1; i <= 5; i++) {
        if (!hasPositiveIntValue(row["batt" + i])) {
          return false;
        }
      }
      return true;
    }

    function createEmptySetUpRow(orderNo) {
      var row = { orderNo: orderNo, depot: null, brigadeName: "" };
      angular.forEach(BATT_FIELDS, function (field) {
        row[field] = null;
      });
      return row;
    }

    function normalizeSetUpBrigadeRow(row) {
      angular.forEach(["depot"].concat(BATT_FIELDS), function (field) {
        row[field] = turnSheetValueRulesFactory.toPositiveIntOrNull(row[field]);
      });
      if (!row.depot || !hasMeaningfulText(row.brigadeName)) {
        row.brigadeName = "";
      }
      return row;
    }

    return {
      attach: function ($scope, rulesCatalogFactory, turnSheetFactory) {
        // SECTION: Shared sort and normalization helpers.
        $scope.getTsTypeSortOrder = function (tsType) {
          var idx = TS_COST_TYPE_ORDER.indexOf(tsType);
          return idx >= 0 ? idx : TS_COST_TYPE_ORDER.length + 99;
        };

        $scope.normalizeSetUpBrigadesRows = function (rows) {
          return (rows || []).map(normalizeSetUpBrigadeRow);
        };

        $scope.normalizeTransferGoodsRows = function (rows) {
          return (rows || []).map(function (row) {
            row.from = turnSheetValueRulesFactory.toPositiveIntOrNull(row.from);
            row.to = turnSheetValueRulesFactory.toPositiveIntOrNull(row.to);
            row.louisdore = turnSheetValueRulesFactory.toPositiveIntOrNull(
              row.louisdore,
            );
            row.citizens = turnSheetValueRulesFactory.toPositiveIntOrNull(
              row.citizens,
            );
            row.ecPts = turnSheetValueRulesFactory.toPositiveIntOrNull(
              row.ecPts,
            );
            row.wood = turnSheetValueRulesFactory.toPositiveIntOrNull(row.wood);
            row.horses = turnSheetValueRulesFactory.toPositiveIntOrNull(
              row.horses,
            );
            row.textiles = turnSheetValueRulesFactory.toPositiveIntOrNull(
              row.textiles,
            );
            return row;
          });
        };

        // SECTION: TS03 rows and row-edit actions.
        $scope.refreshSetUpBrigadesRows = function () {
          var topRows = ($scope.tsSetUpBrigadesList || [])
            .filter(function (row) {
              return toInt(row.orderNo, 0) <= MAX_SET_UP_BRIGADES_ROWS;
            })
            .sort(function (left, right) {
              return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
            });

          for (
            var orderNo = 1;
            orderNo <= MAX_SET_UP_BRIGADES_ROWS;
            orderNo++
          ) {
            var found = false;
            for (var i = 0; i < topRows.length; i++) {
              if (toInt(topRows[i].orderNo, 0) === orderNo) {
                found = true;
                break;
              }
            }
            if (!found) {
              var newRow = createEmptySetUpRow(orderNo);
              topRows.push(newRow);
              $scope.tsSetUpBrigadesList = (
                $scope.tsSetUpBrigadesList || []
              ).concat([newRow]);
            }
          }

          topRows.sort(function (left, right) {
            return toInt(left.orderNo, 0) - toInt(right.orderNo, 0);
          });
          $scope.tsSetUpBrigadesRows = topRows;
        };

        $scope.buildSetUpDepotOptions = function () {
          var bySphere = { Europe: [], Caribbean: [], India: [], Unknown: [] };
          var turnReport = $scope.masterData && $scope.masterData.turnReport;
          var barracks = (turnReport && turnReport.barracks) || [];

          function mapDepot(raw, sourceType) {
            var sphere = normalizeSphereName(
              ts01TransferGoodsUtilsFactory.getSphereFromCoordinate(
                raw.x,
                raw.y,
              ),
            );
            var name = (raw.name || "").toString().trim();
            var itemNo = toInt(raw.itemNo, 0);
            return {
              itemNo: itemNo > 0 ? itemNo : null,
              name: name,
              x: toInt(raw.x, null),
              y: toInt(raw.y, null),
              sphere: sphere,
              sourceType: sourceType,
              label:
                itemNo +
                (name ? " - " + name : "") +
                " (" +
                raw.x +
                "/" +
                raw.y +
                ") [" +
                sphere +
                "]",
            };
          }

          angular.forEach(barracks, function (raw) {
            var depot = mapDepot(raw, "Barracks");
            if (!depot.itemNo) return;
            bySphere[depot.sphere] = (bySphere[depot.sphere] || []).concat([
              depot,
            ]);
          });

          angular.forEach(Object.keys(bySphere), function (key) {
            bySphere[key].sort(function (left, right) {
              return toInt(left.itemNo, 0) - toInt(right.itemNo, 0);
            });
          });

          $scope.setUpDepotOptionsBySphere = bySphere;
          $scope.setUpDepotOptions = []
            .concat(bySphere.Europe || [])
            .concat(bySphere.Caribbean || [])
            .concat(bySphere.India || [])
            .concat(bySphere.Unknown || []);
          $scope.refreshSetUpDepotSelectionOptions();
        };

        $scope.refreshSetUpDepotSelectionOptions = function () {
          var scoped = ($scope.setUpDepotOptions || []).slice();
          var seen = {};
          angular.forEach(scoped, function (depot) {
            seen[toInt(depot && depot.itemNo, 0)] = true;
          });
          angular.forEach($scope.tsSetUpBrigadesRows || [], function (row) {
            var selectedDepot = $scope.getSetUpDepotOptionByItemNo(
              row && row.depot,
            );
            var selectedNo = toInt(selectedDepot && selectedDepot.itemNo, 0);
            if (!selectedNo || seen[selectedNo]) return;
            scoped.push(selectedDepot);
            seen[selectedNo] = true;
          });
          scoped.sort(function (left, right) {
            return (
              toInt(left && left.itemNo, 0) - toInt(right && right.itemNo, 0)
            );
          });
          $scope.setUpDepotSelectionOptions = scoped;
        };

        $scope.getSetUpDepotOptionByItemNo = function (itemNo) {
          var target = toInt(itemNo, 0);
          if (!target) return null;
          var options = $scope.setUpDepotOptions || [];
          for (var i = 0; i < options.length; i++) {
            if (toInt(options[i].itemNo, 0) === target) {
              return options[i];
            }
          }
          return null;
        };

        // SECTION: Depot options and turn-state helpers.
        $scope.getTurnStateCodeForSetUp = function () {
          if (typeof $scope.getTurnStateCode === "function") {
            var resolvedState = $scope.getTurnStateCode();
            if (resolvedState) return resolvedState;
          }
          if ($scope.masterData && $scope.masterData.selectedState) {
            return $scope.masterData.selectedState;
          }
          if (
            $scope.masterData &&
            $scope.masterData.turnId &&
            $scope.masterData.turnId.length >= 4
          ) {
            return $scope.masterData.turnId.substr(3, 1);
          }
          return DEFAULT_TURN_STATE_CODE;
        };

        $scope.loadSetUpArmyListForTurnState = function () {
          var stateCode = (
            $scope.getTurnStateCodeForSetUp() || DEFAULT_TURN_STATE_CODE
          )
            .toString()
            .trim()
            .toUpperCase();
          return rulesCatalogFactory.getArmyList(stateCode).then(
            function (armyList) {
              var filtered = (armyList || []).filter(function (item) {
                var itemNo = parseInt(item.itemNo, 10);
                return !isNaN(itemNo) && itemNo > 0 && itemNo % 2 === 1;
              });

              $scope.setupArmyListAllRows = filtered;
              $scope.setupArmyListByItemNo = {};
              angular.forEach(filtered, function (armyItem) {
                var key = toInt(armyItem.itemNo, 0);
                if (key > 0 && !$scope.setupArmyListByItemNo[key]) {
                  $scope.setupArmyListByItemNo[key] = armyItem;
                }
              });
              $scope.refreshSetUpArmyListBySphere();
              $scope.recalculateTransferGoodsForSetUpBrigades();
            },
            function () {
              $scope.setupArmyListAllRows = [];
              $scope.setupArmyListRows = [];
              $scope.setupArmyListByItemNo = {};
            },
          );
        };

        $scope.getArmyListItemByItemNo = function (itemNo) {
          return itemNo == null
            ? null
            : $scope.setupArmyListByItemNo[toInt(itemNo, 0)] || null;
        };

        $scope.getArmyListItemByShortName = function (shortName) {
          var match = null;
          var normalized = (shortName || "").toString().trim().toUpperCase();
          if (!normalized) return null;
          angular.forEach($scope.setupArmyListRows || [], function (armyItem) {
            if (match) return;
            var key = (armyItem.shortName || "")
              .toString()
              .trim()
              .toUpperCase();
            if (key === normalized) match = armyItem;
          });
          return match;
        };

        $scope.canAddArmyItemToDepotSphere = function (armyItemNo, sphere) {
          var armyItem = $scope.getArmyListItemByItemNo(armyItemNo);
          if (!armyItem) return false;
          var normalizedSphere = normalizeSphereName(sphere);
          if (!normalizedSphere || normalizedSphere === SPHERE_ALL) return true;

          var shortName = (armyItem.shortName || "")
            .toString()
            .trim()
            .toUpperCase();
          var name = (armyItem.name || "").toString();
          var isColonial = !!armyItem.isColonial || /colonial/i.test(name);
          var isKt = shortName === "KT";

          if (
            normalizedSphere === SPHERE_CARIBBEAN ||
            normalizedSphere === SPHERE_INDIA
          ) {
            return isColonial && !isKt;
          }
          if (normalizedSphere === SPHERE_EUROPE) {
            return !isColonial || isKt;
          }
          return true;
        };

        $scope.refreshSetUpArmyListBySphere = function () {
          var allRows = $scope.setupArmyListAllRows || [];
          $scope.setupArmyListRows = allRows.slice();
        };

        $scope.calculateHeadcountEfDrop = function (missingMen, size) {
          if (missingMen <= 0) return 0;
          if (missingMen > size) return 2;
          if (missingMen > size * 0.5) return 1;
          return 0;
        };

        $scope.isMountedArmyItem = function (armyItem) {
          if (!armyItem) return false;
          var shortName = (armyItem.shortName || "").toString();
          var name = (armyItem.name || "").toString();
          return (
            !!armyItem.isCavalry ||
            /mounted/i.test(name) ||
            /^mc$/i.test(shortName)
          );
        };

        $scope.pickSetUpArmyItem = function (armyItem) {
          $scope.selectedSetUpArmyItem = armyItem || null;
        };

        $scope.isSetUpArmyItemSelected = function (armyItem) {
          return !!(
            armyItem &&
            $scope.selectedSetUpArmyItem &&
            toInt(armyItem.itemNo, 0) ===
              toInt($scope.selectedSetUpArmyItem.itemNo, 0)
          );
        };

        // SECTION: Army-list setup rules and row editing actions.
        $scope.setSetUpDepot = function (row) {
          if (!row) return;
          var currentOrderNo = toInt(row.orderNo, 0);
          var selectedDepot = toInt(row.depot, 0);
          if (currentOrderNo > 0 && selectedDepot > 0) {
            var previousActiveRow = null;
            angular.forEach(
              $scope.tsSetUpBrigadesRows || [],
              function (candidate) {
                if (!candidate) return;
                var candidateOrderNo = toInt(candidate.orderNo, 0);
                if (!candidateOrderNo || candidateOrderNo >= currentOrderNo)
                  return;
                if (!hasAnySetUpRowData(candidate)) return;
                if (
                  !previousActiveRow ||
                  candidateOrderNo > toInt(previousActiveRow.orderNo, 0)
                ) {
                  previousActiveRow = candidate;
                }
              },
            );

            if (
              previousActiveRow &&
              !hasFirstFiveBattalions(previousActiveRow)
            ) {
              row.depot = null;
              alert("cant add new brigade until first 5 batts are filled in");
              $scope.recalculateTransferGoodsForSetUpBrigades();
              return;
            }
          }
          $scope.queueSetUpTsSave("SetUpBrigades");
          $scope.recalculateTransferGoodsForSetUpBrigades();
        };

        $scope.paintSetUpBattalion = function (row, battField) {
          if (
            !row ||
            BATT_FIELDS.indexOf(battField) === -1 ||
            !$scope.selectedSetUpArmyItem
          )
            return;
          if (!hasPositiveIntValue(row.depot)) {
            alert(
              "Select a barracks/shipyard for this row before adding battalions.",
            );
            return;
          }
          var itemNo = toInt($scope.selectedSetUpArmyItem.itemNo, 0);
          var rowSphere = normalizeSphereName(
            $scope.getSphereFromDepotItemNo(row.depot),
          );
          if (
            rowSphere &&
            !$scope.canAddArmyItemToDepotSphere(itemNo, rowSphere)
          ) {
            var regionLabel =
              rowSphere === SPHERE_EUROPE ? "Europe" : "the Colonies";
            alert(
              "This troop type cannot be built at the selected barracks in " +
                regionLabel +
                ".",
            );
            return;
          }
          row[battField] = itemNo;
          if (!row.brigadeName || row.brigadeName === "<Brigade Name>") {
            row.brigadeName = ($scope.selectedSetUpArmyItem.name || "")
              .toString()
              .trim();
          }
          $scope.queueSetUpTsSave("SetUpBrigades");
          $scope.recalculateTransferGoodsForSetUpBrigades();
        };

        $scope.updateSetUpBrigadeName = function (row) {
          if (!row) return;
          if (!hasMeaningfulText(row.brigadeName)) row.brigadeName = "";
          $scope.queueSetUpTsSave("SetUpBrigades");
        };

        $scope.clearSetUpBrigadesRow = function (row) {
          if (!row) return;
          row.depot = null;
          angular.forEach(BATT_FIELDS, function (field) {
            row[field] = null;
          });
          row.brigadeName = "";
          $scope.queueSetUpTsSave("SetUpBrigades");
          $scope.recalculateTransferGoodsForSetUpBrigades();
        };

        $scope.isBrigadeSetupIncomplete = function (setUpRow) {
          if (!setUpRow) return false;
          var hasDepot = hasPositiveIntValue(setUpRow.depot);
          var hasAnyBattalion = hasAnySetUpBattalion(setUpRow);

          if (
            !hasDepot &&
            (hasAnyBattalion || hasMeaningfulText(setUpRow.brigadeName))
          ) {
            return true;
          }

          if (hasDepot) {
            if (
              !hasPositiveIntValue(setUpRow.batt1) ||
              !hasPositiveIntValue(setUpRow.batt2) ||
              !hasPositiveIntValue(setUpRow.batt3) ||
              !hasPositiveIntValue(setUpRow.batt4) ||
              !hasPositiveIntValue(setUpRow.batt5)
            )
              return true;
            if (
              hasPositiveIntValue(setUpRow.batt7) &&
              !hasPositiveIntValue(setUpRow.batt6)
            )
              return true;
          }
          return false;
        };

        $scope.getSetUpDepotPositionText = function (setUpRow) {
          var depot = $scope.getDepotReferenceByItemNo(
            setUpRow && setUpRow.depot,
          );
          if (!depot) return "--/--";
          return depot.x + "/" + depot.y;
        };

        $scope.getMapCoordinateForSetUpDepot = function (depotItemNo) {
          var depot = $scope.getDepotReferenceByItemNo(depotItemNo);
          if (!depot) return null;
          var mapRows =
            ($scope.masterData &&
              $scope.masterData.turnReport &&
              $scope.masterData.turnReport.mapCoordinates) ||
            [];
          var x = toInt(depot.x, 0);
          var y = toInt(depot.y, 0);
          return mapRows[y] && mapRows[y][x] ? mapRows[y][x] : null;
        };

        $scope.getTs03EuropeCostRule = function (depotItemNo) {
          var sphere = normalizeSphereName(
            $scope.getSphereFromDepotItemNo(depotItemNo),
          );
          if (sphere !== SPHERE_EUROPE) {
            return {
              code: "",
              tooltip: "",
              moneyMultiplier: 1,
              isForeignEuropeOutsideSphere: false,
            };
          }
          var mapCoord = $scope.getMapCoordinateForSetUpDepot(depotItemNo);
          if (typeof $scope.getEuropeLocationCostRule === "function") {
            return $scope.getEuropeLocationCostRule(
              mapCoord,
              $scope.getTurnStateCodeForSetUp(),
            );
          }
          return {
            code: "",
            tooltip: "",
            moneyMultiplier: 1,
            isForeignEuropeOutsideSphere: false,
          };
        };

        $scope.getLocationCostBadgeForSetUpRow = function (setUpRow) {
          if (!setUpRow || !setUpRow.depot) {
            return { code: "", tooltip: "" };
          }

          var sphere = normalizeSphereName(
            $scope.getSphereFromDepotItemNo(setUpRow.depot),
          );
          if (sphere === SPHERE_CARIBBEAN) {
            return {
              code: "C",
              tooltip: "C - 1x cost as brigade resides in Caribbean region.",
            };
          }
          if (sphere === SPHERE_INDIA) {
            return {
              code: "I",
              tooltip: "I - 1x cost as brigade resides in India region.",
            };
          }
          if (sphere !== SPHERE_EUROPE) {
            return { code: "", tooltip: "" };
          }

          var europeRule = $scope.getTs03EuropeCostRule(setUpRow.depot);
          if (!europeRule || !europeRule.code) {
            return { code: "", tooltip: "" };
          }
          return { code: europeRule.code, tooltip: europeRule.tooltip };
        };

        $scope.getSetUpLocationBadge = function (setUpRow) {
          return $scope.getLocationCostBadgeForSetUpRow(setUpRow);
        };

        $scope.getSetUpBattalionDisplay = function (setUpRow, battField) {
          var armyItem = $scope.getArmyListItemByItemNo(
            setUpRow && setUpRow[battField],
          );
          if (!armyItem) return "- -- ---";
          return $scope.formatBattalionParts(
            armyItem.shortName,
            3,
            RECRUITS_PER_BATTALION,
          );
        };

        // SECTION: Cost display and location helpers.
        $scope.getSetUpRowCostSummary = function (setUpRow) {
          var result = { louisdore: 0, citizens: 0, ecPts: 0, horses: 0 };
          angular.forEach(BATT_FIELDS, function (field) {
            var armyItem = $scope.getArmyListItemByItemNo(
              setUpRow && setUpRow[field],
            );
            if (!armyItem) return;
            var recruits = RECRUITS_PER_BATTALION;
            result.citizens += recruits;
            result.louisdore += Math.round(
              recruits * toFloat(armyItem.cost, 0),
            );
            result.ecPts += Math.round(
              Math.ceil(recruits / RECRUITS_PER_EC_BLOCK) *
                toFloat(armyItem.ecPtsPer25, 0),
            );
            if ($scope.isMountedArmyItem(armyItem)) result.horses += recruits;
          });
          return result;
        };

        $scope.getSetUpTotalCostSummary = function () {
          var totals = { louisdore: 0, citizens: 0, ecPts: 0, horses: 0 };
          angular.forEach($scope.tsSetUpBrigadesRows || [], function (row) {
            var rowTotals = $scope.getSetUpRowCostSummary(row);
            totals.louisdore += rowTotals.louisdore;
            totals.citizens += rowTotals.citizens;
            totals.ecPts += rowTotals.ecPts;
            totals.horses += rowTotals.horses;
          });
          return totals;
        };

        // SECTION: Transfer-goods pipeline and storage integration.
        $scope.getTransferGoodsRowByOrderNo = function (orderNo) {
          return setUpTransferPipelineFactory.getTransferGoodsRowByOrderNo(
            $scope.tsTransferGoodsList,
            orderNo,
            toInt,
          );
        };

        $scope.refreshTransferGoodsCostRows = function () {
          $scope.tsTransferGoodsCostRows = (
            $scope.tsTransferGoodsList || []
          ).filter(function (row) {
            return (
              row.from != null ||
              row.to != null ||
              row.louisdore != null ||
              row.citizens != null ||
              row.ecPts != null ||
              row.horses != null
            );
          });
        };

        $scope.loadManagedTransferGoodsRowsFromStorage = function () {
          $scope.managedTransferGoodsRowOrderNos =
            turnMapsTransferGoodsStorageFactory.loadManagedTransferGoodsRows(
              $scope.masterData && $scope.masterData.turnId,
              MANAGED_TS01_STORAGE_KEY_PREFIX,
            );
        };

        $scope.saveManagedTransferGoodsRowsToStorage = function () {
          turnMapsTransferGoodsStorageFactory.saveManagedTransferGoodsRows(
            $scope.masterData && $scope.masterData.turnId,
            MANAGED_TS01_STORAGE_KEY_PREFIX,
            $scope.managedTransferGoodsRowOrderNos || [],
          );
        };

        $scope.getTransferGoodsRowSignature = function (row) {
          return turnMapsTransferGoodsStorageFactory.getTransferGoodsRowSignature(
            row,
            toInt,
          );
        };

        $scope.clearTransferGoodsRowValues =
          turnMapsTransferGoodsStorageFactory.clearTransferGoodsRowValues;
        $scope.hasTransferGoodsData = function (transferRow) {
          return ts01TransferGoodsUtilsFactory.hasTransferGoodsData(
            transferRow,
            turnSheetValueRulesFactory,
          );
        };
        $scope.isTransferGoodsRowEmpty = function (row) {
          return ts01TransferGoodsUtilsFactory.isTransferGoodsRowEmpty(
            row,
            turnSheetValueRulesFactory,
          );
        };

        $scope.getDepotReferenceByItemNo = function (depotItemNo) {
          return turnMapsDepotLookupFactory.getDepotReferenceByItemNo(
            $scope.masterData,
            depotItemNo,
          );
        };
        $scope.getSphereFromDepotItemNo = function (depotItemNo) {
          return turnMapsDepotLookupFactory.getSphereFromDepotItemNo(
            $scope.masterData,
            depotItemNo,
          );
        };
        $scope.getLocationLabel = function (locationItemNo) {
          return turnMapsDepotLookupFactory.getLocationLabel(
            $scope.masterData,
            locationItemNo,
          );
        };
        $scope.getLineLocationContext = function (depotItemNo) {
          return turnMapsDepotLookupFactory.getLineLocationContext(
            $scope.masterData,
            depotItemNo,
          );
        };
        $scope.getWarehouseNoFromSphere =
          ts01TransferGoodsUtilsFactory.getWarehouseNoFromSphere;

        function getTransferCalcContext() {
          return {
            tsCostLabels: TS_COST_LABELS,
            masterData: $scope.masterData,
            // Use visible/capped TS03 rows only; hidden legacy rows can duplicate costs.
            tsSetUpBrigadesList: $scope.tsSetUpBrigadesRows,
            tsSetUpAdditionalBrigadesList: $scope.tsSetUpAdditionalBrigadesList,
            tsIncreaseHeadcountList: $scope.tsIncreaseHeadcountList,
            tsIncreaseBrigadeXpList: $scope.tsIncreaseBrigadeXpList,
            toInt: toInt,
            toFloat: toFloat,
            hasAnyGoods: hasAnyGoods,
            getTsTypeSortOrder: $scope.getTsTypeSortOrder,
            getSortedFilledRows: function (rows, requiredFields) {
              return (rows || [])
                .filter(function (row) {
                  return requiredFields.every(function (field) {
                    return row && row[field] != null && row[field] !== "";
                  });
                })
                .sort(function (left, right) {
                  return (
                    toInt(left && left.orderNo, 0) -
                    toInt(right && right.orderNo, 0)
                  );
                });
            },
            getSphereFromDepotItemNo: $scope.getSphereFromDepotItemNo,
            getWarehouseNoFromSphere: $scope.getWarehouseNoFromSphere,
            getArmyListItemByItemNo: $scope.getArmyListItemByItemNo,
            getArmyListItemByShortName: $scope.getArmyListItemByShortName,
            getLocationLabel: $scope.getLocationLabel,
            getLineLocationContext: $scope.getLineLocationContext,
            getTs03EuropeCostRule: $scope.getTs03EuropeCostRule,
            getDepotForBrigadeState: function (brigadeState) {
              return ts01TransferGoodsUtilsFactory.getDepotSourceItemNoAtCoordinate(
                $scope.masterData && $scope.masterData.turnReport,
                brigadeState.x,
                brigadeState.y,
              );
            },
            calculateHeadcountEfDrop: $scope.calculateHeadcountEfDrop,
            isMountedArmyItem: $scope.isMountedArmyItem,
          };
        }

        $scope.calculateTsCostTransferLines = function () {
          return turnMapsTsTransferBuilderFactory.calculateTsCostTransferLines(
            getTransferCalcContext(),
          );
        };

        $scope.buildEconomyTsCostSummary = function (lines) {
          $scope.economyTsCostSummarySections =
            turnMapsTransferGoodsStorageFactory.buildEconomyTsCostSummary(
              lines,
              hasAnyGoods,
              TS_COST_LABELS,
              $scope.getTsTypeSortOrder,
              toInt,
            );
        };

        $scope.buildTs01BarracksSummaryRows = function () {
          $scope.ts01BarracksSummaryRows =
            setUpTransferPipelineFactory.buildTs01BarracksSummaryRows(
              $scope.latestTsCostTransferLines,
              hasAnyGoods,
              $scope.getLocationLabel,
              toInt,
            );
        };

        $scope.writeManagedTransferGoodsRows = function (lines) {
          if (!$scope.tsTransferGoodsList) return;
          $scope.economyTsCostWarnings = [];
          var previousManagedOrderNos = (
            $scope.managedTransferGoodsRowOrderNos || []
          ).slice();
          angular.forEach($scope.tsTransferGoodsList || [], function (row) {
            var orderNo = toInt(row && row.orderNo, 0);
            if (orderNo <= 0) return;
            if (
              ARMY_MANAGED_TS01_SECTIONS[
                getSectionNumber(row && row.turnSheetSectionNo)
              ] &&
              previousManagedOrderNos.indexOf(orderNo) < 0
            ) {
              previousManagedOrderNos.push(orderNo);
            }
          });

          var result =
            setUpTransferPipelineFactory.writeManagedTransferGoodsRows({
              lines: lines,
              transferGoodsRows: $scope.tsTransferGoodsList,
              previousManagedOrderNos: previousManagedOrderNos,
              rowLimit: MANAGED_TS01_ROW_LIMIT,
              isTransferGoodsRowEmpty: $scope.isTransferGoodsRowEmpty,
              getRowSignature: $scope.getTransferGoodsRowSignature,
              clearTransferGoodsRowValues: $scope.clearTransferGoodsRowValues,
              resolveManagedSectionNo: function (line) {
                return getSectionNoFromTsType(line && line.tsType);
              },
              isManagedRowOwned: function (row) {
                // Own TS03/TS04/TS05/TS06 rows; allow blank/legacy rows to migrate.
                var sectionNo = getSectionNumber(row && row.turnSheetSectionNo);
                return sectionNo == null || !!ARMY_MANAGED_TS01_SECTIONS[sectionNo];
              },
              toInt: toInt,
            });

          if (result.overflowCount > 0) {
            $scope.economyTsCostWarnings.push(
              "TS01 managed rows are full. " +
                result.overflowCount +
                " cost line(s) could not be written.",
            );
          }

          $scope.managedTransferGoodsRowOrderNos = result.managedOrderNos;
          $scope.saveManagedTransferGoodsRowsToStorage();
          $scope.refreshTransferGoodsCostRows();
          if (result.changed) {
            $scope.queueSetUpTsSave("TransferGoods");
          }
        };

        $scope.recalculateTransferGoodsForSetUpBrigades = function () {
          if (!$scope.tsTransferGoodsList) return;
          var lines = $scope.calculateTsCostTransferLines();
          $scope.latestTsCostTransferLines = lines;
          $scope.buildEconomyTsCostSummary(lines);
          $scope.writeManagedTransferGoodsRows(lines);
          $scope.buildTs01BarracksSummaryRows();
        };

        // SECTION: Turnsheet data loading.
        $scope.loadSetUpBrigadesData = function () {
          var turnId = $scope.masterData && $scope.masterData.turnId;
          if (!turnId || turnId === "Unknown") return;

          turnSheetFactory.getTSSetUpBrigades(turnId).then(function (rows) {
            $scope.tsSetUpBrigadesList =
              $scope.normalizeSetUpBrigadesRows(rows);
            $scope.refreshSetUpBrigadesRows();
            $scope.recalculateTransferGoodsForSetUpBrigades();
          });
          turnSheetFactory
            .getTSSetUpAdditionalBrigades(turnId)
            .then(function (rows) {
              $scope.tsSetUpAdditionalBrigadesList = rows || [];
              $scope.recalculateTransferGoodsForSetUpBrigades();
            });
          turnSheetFactory.getTSIncreaseHeadcount(turnId).then(function (rows) {
            $scope.tsIncreaseHeadcountList = rows || [];
            $scope.recalculateTransferGoodsForSetUpBrigades();
          });
          turnSheetFactory.getTSIncreaseBrigadeXP(turnId).then(function (rows) {
            $scope.tsIncreaseBrigadeXpList = rows || [];
            $scope.recalculateTransferGoodsForSetUpBrigades();
          });
          turnSheetFactory.getTSTransferGoods(turnId).then(function (rows) {
            $scope.tsTransferGoodsList =
              $scope.normalizeTransferGoodsRows(rows);
            $scope.loadManagedTransferGoodsRowsFromStorage();
            $scope.refreshTransferGoodsCostRows();
            $scope.recalculateTransferGoodsForSetUpBrigades();
          });
        };
      },
    };
  },
);
