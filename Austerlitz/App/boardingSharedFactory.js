"use strict";

austerlitzModule.factory("boardingSharedFactory", function () {
  function toInt(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  function toKey(value) {
    return value == null ? "" : value.toString().trim();
  }

  function roundTo2(value) {
    return Math.round((parseFloat(value) || 0) * 100) / 100;
  }

  function floorToWhole(value) {
    var parsed = parseFloat(value) || 0;
    return Math.floor(parsed);
  }

  function toLoadCapacityUnits(rawWeight) {
    return roundTo2((parseFloat(rawWeight) || 0) / 1000);
  }

  function getSphereFromCoordinates(x, y) {
    var parsedX = parseInt(x, 10);
    var parsedY = parseInt(y, 10);
    if (isNaN(parsedX) || isNaN(parsedY)) {
      return "Unknown";
    }

    if (parsedX <= 80 && parsedY <= 65) return "Europe";
    if (parsedX <= 40 && parsedY <= 99) return "Caribbean";
    if (parsedX <= 90 && parsedY <= 99) return "India";
    return "Unknown";
  }

  function hasAnyTurnSheetValue(row, fields) {
    if (!row) {
      return false;
    }

    for (var i = 0; i < fields.length; i++) {
      if (row[fields[i]] != null && row[fields[i]] !== "") {
        return true;
      }
    }

    return false;
  }

  function findTurnSheetRowByOrderNo(rows, orderNo, sameNullableInt) {
    for (var i = 0; rows && i < rows.length; i++) {
      if (
        sameNullableInt
          ? sameNullableInt(rows[i].orderNo, orderNo)
          : parseInt(rows[i].orderNo, 10) === parseInt(orderNo, 10)
      ) {
        return rows[i];
      }
    }

    return null;
  }

  function findNextEmptyTurnSheetRowWithinLimit(
    rows,
    fields,
    maxRows,
    turnId,
    sameNullableInt,
  ) {
    rows = rows || [];
    for (var orderNo = 1; orderNo <= maxRows; orderNo++) {
      var row = findTurnSheetRowByOrderNo(rows, orderNo, sameNullableInt);
      if (!row) {
        row = { turnId: turnId, orderNo: orderNo };
        rows.push(row);
        return row;
      }

      if (!hasAnyTurnSheetValue(row, fields)) {
        return row;
      }
    }

    return null;
  }

  function findMatchingBoardingRow(rows, itemNo, sameNullableInt) {
    for (var i = 0; rows && i < rows.length; i++) {
      if (
        sameNullableInt
          ? sameNullableInt(rows[i].itemNo, itemNo)
          : parseInt(rows[i].itemNo, 10) === parseInt(itemNo, 10)
      ) {
        return rows[i];
      }
    }

    return null;
  }

  function isSameNullableInt(left, right, sameNullableInt) {
    if (sameNullableInt) {
      return sameNullableInt(left, right);
    }

    return parseInt(left, 10) === parseInt(right, 10);
  }

  function buildBoardingAssignmentLookup(rows) {
    var byItemNo = {};
    angular.forEach(rows || [], function (row) {
      var itemNo = toInt(row && row.itemNo, null);
      var fleetNo = toInt(row && row.fleetNo, null);
      if (itemNo == null || fleetNo == null || fleetNo <= 0) {
        return;
      }
      byItemNo[itemNo] = fleetNo;
    });
    return byItemNo;
  }

  function applyBoardingAssignments(options) {
    var opts = options || {};
    var units = opts.units || [];
    var getUnitId =
      opts.getUnitId ||
      function (unit) {
        return toInt(unit && unit.id, null);
      };
    var applyAssigned = opts.applyAssigned || angular.noop;
    var applyUnassigned = opts.applyUnassigned || angular.noop;
    var clearUnassigned = opts.clearUnassigned === true;
    var lookup = opts.assignmentsByItemNo || buildBoardingAssignmentLookup(opts.rows);

    angular.forEach(units, function (unit) {
      var unitId = getUnitId(unit);
      if (unitId == null) {
        return;
      }

      if (Object.prototype.hasOwnProperty.call(lookup, unitId)) {
        applyAssigned(unit, lookup[unitId]);
        return;
      }

      if (clearUnassigned) {
        applyUnassigned(unit);
      }
    });
  }

  function replayBoardingAssignments(options) {
    var opts = options || {};
    var rows = opts.rows || [];
    var units = opts.units || [];
    var getUnitId =
      opts.getUnitId ||
      function (unit) {
        return toInt(unit && unit.id, null);
      };
    var onUnmatchedAssignment = opts.onUnmatchedAssignment || angular.noop;
    var assignmentLookup = buildBoardingAssignmentLookup(rows);
    var unitLookup = {};

    angular.forEach(units, function (unit) {
      var unitId = getUnitId(unit);
      if (unitId != null) {
        unitLookup[unitId] = true;
      }
    });

    applyBoardingAssignments({
      units: units,
      assignmentsByItemNo: assignmentLookup,
      getUnitId: getUnitId,
      applyAssigned: opts.applyAssigned,
      applyUnassigned: opts.applyUnassigned,
      clearUnassigned: opts.clearUnassigned,
    });

    angular.forEach(rows, function (row) {
      var itemNo = toInt(row && row.itemNo, null);
      var fleetNo = toInt(row && row.fleetNo, null);
      if (itemNo == null || fleetNo == null || fleetNo <= 0) {
        return;
      }

      if (!Object.prototype.hasOwnProperty.call(unitLookup, itemNo)) {
        onUnmatchedAssignment(row, itemNo, fleetNo);
      }
    });
  }

  function buildShipCapacityLookupByType(rulesCatalog) {
    var lookup = {};
    var ships = (rulesCatalog && rulesCatalog.ships) || [];
    angular.forEach(ships, function (ship) {
      var key = toKey(ship && ship.type).toUpperCase();
      if (key) {
        lookup[key] = ship;
      }
    });
    return lookup;
  }

  function buildArmyListLookupByShortName(rulesCatalog) {
    var lookup = {};
    var allArmyItems =
      (rulesCatalog && (rulesCatalog.armyList || rulesCatalog.ArmyList)) || [];

    angular.forEach(allArmyItems, function (armyItem) {
      var shortName = toKey(armyItem && armyItem.shortName).toUpperCase();
      if (shortName) {
        lookup[shortName] = armyItem;
      }
    });

    return lookup;
  }

  function getBattalionWeightPerMan(armyItem) {
    // Unknown/missing army-list rows still board as infantry weight.
    if (!armyItem) return 200;
    var itemNo = parseInt(armyItem.itemNo || armyItem.ItemNo, 10);
    if (armyItem.isCavalry || armyItem.IsCavalry) return 400;
    if (!isNaN(itemNo) && itemNo >= 40) return 600;
    return 200;
  }

  function getBrigadeRawWeight(turnReport, rulesCatalog, itemNo, sameNullableInt) {
    var brigades = (turnReport && turnReport.brigades) || [];
    var armyLookup = buildArmyListLookupByShortName(rulesCatalog);

    for (var i = 0; i < brigades.length; i++) {
      var isSame = sameNullableInt
        ? sameNullableInt(brigades[i].itemNo, itemNo)
        : parseInt(brigades[i].itemNo, 10) === parseInt(itemNo, 10);
      if (!isSame) continue;

      var totalWeight = 0;
      for (var b = 1; b <= 7; b++) {
        var battType = toKey(brigades[i]["batt" + b + "Type"]).toUpperCase();
        var battSize = parseInt(brigades[i]["batt" + b + "Size"], 10) || 0;
        if (!battType || battType === "--" || battSize <= 0) continue;
        totalWeight += battSize * getBattalionWeightPerMan(armyLookup[battType]);
      }
      return totalWeight;
    }

    return 0;
  }

  function getBaggageTrainRawWeight(turnReport, itemNo, sameNullableInt) {
    var baggageTrains = (turnReport && turnReport.baggageTrains) || [];

    for (var i = 0; i < baggageTrains.length; i++) {
      var isSame = sameNullableInt
        ? sameNullableInt(baggageTrains[i].itemNo, itemNo)
        : parseInt(baggageTrains[i].itemNo, 10) === parseInt(itemNo, 10);
      if (!isSame) continue;

      var qty1 = parseInt(baggageTrains[i].quantity1, 10) || 0;
      var qty2 = parseInt(baggageTrains[i].quantity2, 10) || 0;
      return 500000 + qty1 + qty2;
    }

    return 0;
  }

  function getBoardedItemLoadCapacity(turnReport, rulesCatalog, itemNo, sameNullableInt) {
    return toLoadCapacityUnits(
      getBrigadeRawWeight(turnReport, rulesCatalog, itemNo, sameNullableInt) ||
        getBaggageTrainRawWeight(turnReport, itemNo, sameNullableInt),
    );
  }

  function buildFleetUsedCapacityLookup(
    boardingRows,
    excludedItemNo,
    includeExcludedItem,
    getItemLoadCapacity,
    sameNullableInt,
  ) {
    var lookup = {};
    angular.forEach(boardingRows || [], function (row) {
      var fleetNo = parseInt(row && row.fleetNo, 10);
      var itemNo = parseInt(row && row.itemNo, 10);
      if (isNaN(fleetNo) || fleetNo <= 0 || isNaN(itemNo)) return;
      if (
        excludedItemNo != null &&
        !includeExcludedItem &&
        (sameNullableInt
          ? sameNullableInt(itemNo, excludedItemNo)
          : parseInt(itemNo, 10) === parseInt(excludedItemNo, 10))
      ) {
        return;
      }
      lookup[fleetNo] = roundTo2(
        (lookup[fleetNo] || 0) + ((getItemLoadCapacity && getItemLoadCapacity(itemNo)) || 0),
      );
    });
    return lookup;
  }

  function collectTurnReportShips(turnReport) {
    var ships = [];
    var report = turnReport || {};

    angular.forEach(report.warships || [], function (warship) {
      ships.push(angular.extend({}, warship, { kind: "warship" }));
    });
    angular.forEach(report.merchantShips || [], function (merchant) {
      ships.push(angular.extend({}, merchant, { kind: "merchant" }));
    });

    return ships;
  }

  function findOptionByFleetNo(options, fleetNo, sameNullableInt) {
    for (var i = 0; options && i < options.length; i++) {
      if (isSameNullableInt(options[i].fleetNo, fleetNo, sameNullableInt)) {
        return options[i];
      }
    }

    return null;
  }

  var unloadDirectionLookup = {
    1: true,
    3: true,
    5: true,
    7: true,
    9: true,
  };

  function parseUnloadDirection(value) {
    var direction = toInt(value, null);
    if (direction == null || !unloadDirectionLookup[direction]) {
      return null;
    }
    return direction;
  }

  function isBoardingCommandE(row) {
    if (!row || row.command == null) {
      return false;
    }
    return row.command.toString().trim().toUpperCase() === "E";
  }

  function isUnloadDirectionCommand(row) {
    return parseUnloadDirection(row && row.command) != null;
  }

  function buildUnloadDirectionLookup(rows) {
    var byItemNo = {};
    angular.forEach(rows || [], function (row) {
      var itemNo = toInt(row && row.itemNo, null);
      var direction = parseUnloadDirection(row && row.command);
      if (itemNo == null || direction == null) {
        return;
      }
      byItemNo[itemNo] = direction;
    });
    return byItemNo;
  }

  function writeUnloadDirectionRow(row, turnId, itemNo, fleetNo, direction) {
    if (!row) {
      return row;
    }

    row.turnId = turnId;
    row.command = parseUnloadDirection(direction);
    row.itemNo = toInt(itemNo, null);
    row.fleetNo = toInt(fleetNo, null);
    row.fleetOwner = null;
    return row;
  }

  function writeBoardingRow(row, turnId, itemNo, fleetNo) {
    if (!row) {
      return row;
    }

    row.turnId = turnId;
    row.command = "E";
    row.itemNo = toInt(itemNo, null);
    row.fleetNo = toInt(fleetNo, null);
    row.fleetOwner = null;
    return row;
  }

  function clearBoardingRow(row, turnId) {
    if (!row) {
      return row;
    }

    row.turnId = turnId;
    row.command = null;
    row.itemNo = null;
    row.fleetNo = null;
    row.fleetOwner = null;
    return row;
  }

  function showTurnSheetOrderError(error, fallbackMessage) {
    var detail =
      error && error.data
        ? error.data
        : fallbackMessage || "Unable to save turn-sheet order.";
    alert(detail);
  }

  function getConditionAdjustedShipCapacity(ship, shipLookupByType) {
    if (!ship) {
      return 0;
    }

    var typeKey = toKey(ship.type).toUpperCase();
    var shipDef = shipLookupByType[typeKey];
    var baseCapacity = toInt(shipDef && shipDef.loadCapacity, 0);
    var condition = parseFloat(ship.condition);
    if (isNaN(condition)) {
      condition = 100;
    }

    return Math.floor(baseCapacity * (condition / 100));
  }

  function buildIndividualShipOptions(config) {
    var cfg = config || {};
    var ships = cfg.ships || [];
    var unitSphere = cfg.unitSphere;
    var currentAssignedFleetNo = toInt(cfg.currentAssignedFleetNo, null);
    var usedCapacityLookup = cfg.usedCapacityLookup || {};
    var currentUnitCapacity = parseFloat(cfg.currentUnitCapacity) || 0;
    var getShipItemNo = cfg.getShipItemNo;
    var sameNullableInt = cfg.sameNullableInt;
    var shipLookupByType = cfg.shipLookupByType || {};
    var options = [];

    function isSame(left, right) {
      if (sameNullableInt) {
        return sameNullableInt(left, right);
      }
      return parseInt(left, 10) === parseInt(right, 10);
    }

    function pushShipOption(ship, kind) {
      if (!ship) {
        return;
      }

      var shipItemNo = getShipItemNo ? getShipItemNo(ship) : toInt(ship.itemNo, null);
      if (shipItemNo == null || shipItemNo <= 0) {
        return;
      }

      var shipSphere = getSphereFromCoordinates(ship.x, ship.y);
      var isCurrentlyAssigned =
        currentAssignedFleetNo != null && isSame(shipItemNo, currentAssignedFleetNo);

      if (unitSphere && shipSphere !== unitSphere && !isCurrentlyAssigned) {
        return;
      }

      var totalCapacity = getConditionAdjustedShipCapacity(ship, shipLookupByType);
      var usedCapacity = roundTo2(usedCapacityLookup[shipItemNo] || 0);
      var usedCapacityWhole = floorToWhole(usedCapacity);
      var availableCapacity = totalCapacity - usedCapacityWhole;

      options.push({
        fleetNo: shipItemNo,
        warshipCount: kind === "warship" ? 1 : 0,
        merchantCount: kind === "merchant" ? 1 : 0,
        totalShips: 1,
        totalCapacity: totalCapacity,
        usedCapacity: usedCapacity,
        usedCapacityWhole: usedCapacityWhole,
        availableCapacity: availableCapacity,
        remainingCapacity: availableCapacity,
        currentUnitCapacity: currentUnitCapacity,
        currentUnitCapacityWholeUp: Math.ceil(currentUnitCapacity || 0),
        wouldExceedForCurrentUnit: currentUnitCapacity > availableCapacity,
        position: toInt(ship.x, 0) + "/" + toInt(ship.y, 0),
        typeLabel: kind === "warship" ? "Warship" : "Merchant",
        warshipType:
          kind === "warship" && ship.type != null && ship.type !== ""
            ? toKey(ship.type)
            : "-",
        warshipName:
          kind === "warship" && toKey(ship.name) ? toKey(ship.name) : "-",
        conditionLabel: (toInt(ship.condition, 100) || 100).toString() + "%",
        isIndividualShip: true,
        isCurrentlyAssigned: isCurrentlyAssigned,
      });
    }

    angular.forEach(ships, function (ship) {
      var kind = cfg.getShipKind ? cfg.getShipKind(ship) : ship.kind;
      pushShipOption(ship, kind || "merchant");
    });

    return options.sort(function (left, right) {
      return toInt(left.fleetNo, 0) - toInt(right.fleetNo, 0);
    });
  }

  return {
    toInt: toInt,
    toKey: toKey,
    roundTo2: roundTo2,
    floorToWhole: floorToWhole,
    toLoadCapacityUnits: toLoadCapacityUnits,
    getSphereFromCoordinates: getSphereFromCoordinates,
    hasAnyTurnSheetValue: hasAnyTurnSheetValue,
    findTurnSheetRowByOrderNo: findTurnSheetRowByOrderNo,
    findNextEmptyTurnSheetRowWithinLimit: findNextEmptyTurnSheetRowWithinLimit,
    findMatchingBoardingRow: findMatchingBoardingRow,
    buildBoardingAssignmentLookup: buildBoardingAssignmentLookup,
    applyBoardingAssignments: applyBoardingAssignments,
    replayBoardingAssignments: replayBoardingAssignments,
    buildArmyListLookupByShortName: buildArmyListLookupByShortName,
    getBattalionWeightPerMan: getBattalionWeightPerMan,
    getBrigadeRawWeight: getBrigadeRawWeight,
    getBaggageTrainRawWeight: getBaggageTrainRawWeight,
    getBoardedItemLoadCapacity: getBoardedItemLoadCapacity,
    buildFleetUsedCapacityLookup: buildFleetUsedCapacityLookup,
    collectTurnReportShips: collectTurnReportShips,
    findOptionByFleetNo: findOptionByFleetNo,
    parseUnloadDirection: parseUnloadDirection,
    isBoardingCommandE: isBoardingCommandE,
    isUnloadDirectionCommand: isUnloadDirectionCommand,
    buildUnloadDirectionLookup: buildUnloadDirectionLookup,
    writeUnloadDirectionRow: writeUnloadDirectionRow,
    writeBoardingRow: writeBoardingRow,
    clearBoardingRow: clearBoardingRow,
    showTurnSheetOrderError: showTurnSheetOrderError,
    buildShipCapacityLookupByType: buildShipCapacityLookupByType,
    getConditionAdjustedShipCapacity: getConditionAdjustedShipCapacity,
    buildIndividualShipOptions: buildIndividualShipOptions,
  };
});
