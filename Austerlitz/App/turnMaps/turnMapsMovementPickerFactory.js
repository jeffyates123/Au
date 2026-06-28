'use strict';

austerlitzModule.factory('turnMapsMovementPickerFactory', function (turnAssignmentResolverFactory) {
    function getMovementPickerUnitKind(itemTypeName, options) {
        var opts = options || {};
        var normalizeItemTypeName = opts.normalizeItemTypeName || function (value) { return (value || '').toString(); };
        var isNavalItemTypeName = opts.isNavalItemTypeName || function () { return false; };
        var normalizedTypeName = normalizeItemTypeName(itemTypeName);

        if (isNavalItemTypeName(normalizedTypeName)) {
            return normalizedTypeName === 'Warship' ? 'warship' : 'merchant';
        }

        switch (normalizedTypeName) {
            case 'Brigade': return 'brigade';
            case 'Commander': return 'commander';
            case 'Spy': return 'spy';
            default: return 'other';
        }
    }

    function formatMovementPickerPosition(x, y) {
        var px = parseInt(x, 10);
        var py = parseInt(y, 10);
        if (isNaN(px) || isNaN(py) || px <= 0 || py <= 0) return '-';
        return px + '/' + py;
    }

    function buildMovementPickerBattalionSummary(brigade) {
        if (!brigade) return '-';

        var parts = [];
        for (var i = 1; i <= 7; i++) {
            var type = (brigade['batt' + i + 'Type'] || '').toString().trim();
            if (!type || type === '--') continue;

            var ef = brigade['batt' + i + 'EF'];
            var size = brigade['batt' + i + 'Size'];
            var section = type;
            if (ef != null && ef !== '') section += ' ' + ef;
            if (size != null && size !== '') section += ' ' + size;
            parts.push(section);
        }

        return parts.length ? parts.join(' | ') : '-';
    }

    function getMovementPickerMainDescription(itemRow) {
        if (!itemRow) return '-';
        var detail = itemRow.movementDetail || {};

        if (detail.unitKind === 'brigade') {
            var name = (detail.name || '').toString().trim();
            var battalions = (detail.battalions || '').toString().trim();
            if (name && battalions && battalions !== '-') return name + ' | ' + battalions;
            if (name) return name;
            if (battalions && battalions !== '-') return battalions;
        }

        return itemRow.description || '-';
    }

    function getMovementPickerTypeSortRank(itemTypeName) {
        var normalized = (itemTypeName || '').toString().trim();
        switch (normalized) {
            case 'Commander': return 1;
            case 'Brigade': return 2;
            case 'Warship': return 3;
            case 'MerchantShip': return 4;
            case 'BaggageTrain':
            case 'Bagagge':
                return 5;
            case 'Spy': return 6;
            default: return 99;
        }
    }

    function buildMovementPickerDetailLookups(turnReport, toMovementPickerItemId) {
        var report = turnReport || {};
        var toId = toMovementPickerItemId;
        var lookups = {
            brigadesById: {},
            commandersById: {},
            spiesById: {},
            warshipsById: {},
            merchantsById: {}
        };

        angular.forEach(report.brigades || [], function (brigade) {
            var id = toId(brigade && brigade.itemNo);
            if (id == null) return;
            lookups.brigadesById[id] = brigade;
        });

        angular.forEach(report.commanders || [], function (commander) {
            var id = toId(commander && commander.itemNo);
            if (id == null) return;
            lookups.commandersById[id] = commander;
        });

        angular.forEach(report.spies || [], function (spy) {
            var id = toId(spy && spy.itemNo);
            if (id == null) return;
            lookups.spiesById[id] = spy;
        });

        angular.forEach(report.warships || [], function (warship) {
            var id = toId(warship && warship.itemNo);
            if (id == null) return;
            lookups.warshipsById[id] = warship;
        });

        angular.forEach(report.merchantShips || [], function (merchant) {
            var id = toId(merchant && merchant.itemNo);
            if (id == null) return;
            lookups.merchantsById[id] = merchant;
        });

        return lookups;
    }

    function buildMovementPickerEffectiveFederationLookup(turnReport, movementFormFederationRows, toMovementPickerItemId, resolveItemTypeName, movementUnitKindResolver) {
        var report = turnReport || {};
        var movementItems = report.movementItemList || [];
        var shipsByItemNo = {};
        angular.forEach((report.warships || []).concat(report.merchantShips || []), function (ship) {
            var shipId = toMovementPickerItemId(ship && ship.itemNo);
            if (shipId == null) return;
            shipsByItemNo[shipId] = ship;
        });

        return turnAssignmentResolverFactory.buildEffectiveMovementFederationLookup(
            movementItems,
            movementFormFederationRows || [],
            function (item) {
                return movementUnitKindResolver(resolveItemTypeName(item));
            },
            shipsByItemNo
        );
    }

    function buildMovementPickerBoardingLookups(movementBoardingRows, effectiveFedLookupByItemNo, detailLookups, toMovementPickerItemId) {
        var unitBoardingByItemNo = {};
        var loadedFleetLookup = {};

        angular.forEach(movementBoardingRows || [], function (row) {
            var boardedUnitNo = toMovementPickerItemId(row && row.itemNo);
            var boardedFleetNo = toMovementPickerItemId(row && row.fleetNo);
            if (boardedUnitNo != null) {
                unitBoardingByItemNo[boardedUnitNo] = true;
            }
            if (boardedFleetNo != null && boardedFleetNo > 0) {
                loadedFleetLookup[boardedFleetNo] = true;
            }
        });

        angular.forEach(detailLookups.warshipsById || {}, function (warship, warshipId) {
            var brigade1 = parseInt(warship && warship.brigade1, 10) || 0;
            var brigade2 = parseInt(warship && warship.brigade2, 10) || 0;
            if (brigade1 + brigade2 <= 0) return;

            var parsedWarshipId = toMovementPickerItemId(warshipId);
            if (parsedWarshipId != null) {
                loadedFleetLookup[parsedWarshipId] = true;
                if (Object.prototype.hasOwnProperty.call(effectiveFedLookupByItemNo, parsedWarshipId)) {
                    var fleetNo = toMovementPickerItemId(effectiveFedLookupByItemNo[parsedWarshipId]);
                    if (fleetNo != null && fleetNo > 0) {
                        loadedFleetLookup[fleetNo] = true;
                    }
                }
            }
        });

        return {
            unitBoardingByItemNo: unitBoardingByItemNo,
            loadedFleetLookup: loadedFleetLookup
        };
    }

    function hasMovementPickerBoardingStatus(itemRow, detail, boardingLookups, effectiveFedLookupByItemNo, toMovementPickerItemId, movementUnitKindResolver) {
        var unitKind = (detail && detail.unitKind) || movementUnitKindResolver(itemRow && itemRow.itemTypeName);
        var itemId = toMovementPickerItemId(itemRow && itemRow.itemNo);
        if (itemId == null) return false;

        if (unitKind === 'brigade' || unitKind === 'commander' || unitKind === 'spy') {
            if (boardingLookups.unitBoardingByItemNo[itemId]) return true;
            var boarded = detail && detail.boarded != null ? detail.boarded : null;
            var boardedNo = parseInt(boarded, 10);
            return !isNaN(boardedNo) && boardedNo > 0;
        }

        if (unitKind === 'warship' || unitKind === 'merchant') {
            if (detail && detail.hasBrigadeLoad) return true;
            if (boardingLookups.loadedFleetLookup[itemId]) return true;

            var effectiveFleetNo = Object.prototype.hasOwnProperty.call(effectiveFedLookupByItemNo, itemId)
                ? toMovementPickerItemId(effectiveFedLookupByItemNo[itemId])
                : null;
            return effectiveFleetNo != null && boardingLookups.loadedFleetLookup[effectiveFleetNo];
        }

        return false;
    }

    function resolveMovementPickerDetail(itemRow, detailLookups, effectiveFedLookupByItemNo, options) {
        var opts = options || {};
        var movementUnitKindResolver = opts.getMovementPickerUnitKind;
        var toMovementPickerItemId = opts.toMovementPickerItemId;
        var buildMovementPickerBattalionSummaryFn = opts.buildMovementPickerBattalionSummary;
        var formatMovementPickerPositionFn = opts.formatMovementPickerPosition;
        var unitKind = movementUnitKindResolver(itemRow && itemRow.itemTypeName);
        var itemId = toMovementPickerItemId(itemRow && itemRow.itemNo);
        var effectiveFed = itemId != null
            && effectiveFedLookupByItemNo
            && Object.prototype.hasOwnProperty.call(effectiveFedLookupByItemNo, itemId)
            ? effectiveFedLookupByItemNo[itemId]
            : (itemRow && itemRow.fed != null ? itemRow.fed : null);

        if (!itemRow || itemId == null) {
            return {
                unitKind: unitKind,
                description: '-'
            };
        }

        if (unitKind === 'brigade') {
            var brigade = detailLookups.brigadesById[itemId];
            if (brigade) {
                return {
                    unitKind: unitKind,
                    id: brigade.itemNo,
                    name: brigade.name || '-',
                    position: formatMovementPickerPositionFn(brigade.x_OrState, brigade.y_OrFleet),
                    fed: effectiveFed != null ? effectiveFed : (brigade.federation != null ? brigade.federation : '-'),
                    mp: brigade.mp != null ? brigade.mp : itemRow.mp,
                    battalions: buildMovementPickerBattalionSummaryFn(brigade),
                    boarded: brigade.boarded != null && brigade.boarded !== '' ? brigade.boarded : '-'
                };
            }
        } else if (unitKind === 'commander') {
            var commander = detailLookups.commandersById[itemId];
            if (commander) {
                return {
                    unitKind: unitKind,
                    id: commander.itemNo,
                    name: commander.name || '-',
                    rank: commander.rank || '-',
                    position: formatMovementPickerPositionFn(commander.x, commander.y),
                    fed: effectiveFed != null ? effectiveFed : (commander.federation != null ? commander.federation : '-'),
                    mp: commander.mp != null ? commander.mp : itemRow.mp,
                    commandCapacity: commander.commandCapacity != null ? commander.commandCapacity : '-',
                    boarded: commander.boarded != null && commander.boarded !== '' ? commander.boarded : '-'
                };
            }
        } else if (unitKind === 'warship') {
            var warship = detailLookups.warshipsById[itemId];
            if (warship) {
                return {
                    unitKind: unitKind,
                    id: warship.itemNo,
                    shipType: warship.type || '-',
                    name: warship.name || '-',
                    position: formatMovementPickerPositionFn(warship.x, warship.y),
                    fleet: effectiveFed != null ? effectiveFed : (warship.fleetNo != null ? warship.fleetNo : '-'),
                    mp: warship.mp != null ? warship.mp : itemRow.mp,
                    condition: warship.condition != null ? warship.condition : '-',
                    age: warship.age != null ? warship.age : '-',
                    marines: warship.marines != null ? warship.marines : '-',
                    brigadeLoad: (warship.brigade1 || 0) + ' ' + (warship.brigade2 || 0),
                    hasBrigadeLoad: ((parseInt(warship.brigade1, 10) || 0) + (parseInt(warship.brigade2, 10) || 0)) > 0
                };
            }
        } else if (unitKind === 'merchant') {
            var merchant = detailLookups.merchantsById[itemId];
            if (merchant) {
                return {
                    unitKind: unitKind,
                    id: merchant.itemNo,
                    shipType: merchant.type || '-',
                    position: formatMovementPickerPositionFn(merchant.x, merchant.y),
                    fleet: effectiveFed != null ? effectiveFed : (merchant.fleetNo != null ? merchant.fleetNo : '-'),
                    mp: merchant.mp != null ? merchant.mp : itemRow.mp,
                    condition: merchant.condition != null ? merchant.condition : '-',
                    age: merchant.age != null ? merchant.age : '-',
                    goods1: merchant.goods1 || '-',
                    qty1: merchant.quantity1 != null ? merchant.quantity1 : '-',
                    goods2: merchant.goods2 || '-',
                    qty2: merchant.quantity2 != null ? merchant.quantity2 : '-',
                    money: merchant.money != null ? merchant.money : '-'
                };
            }
        } else if (unitKind === 'spy') {
            var spy = detailLookups.spiesById[itemId];
            if (spy) {
                return {
                    unitKind: unitKind,
                    id: spy.itemNo,
                    name: spy.name || '-',
                    position: formatMovementPickerPositionFn(spy.x, spy.y),
                    fed: effectiveFed != null ? effectiveFed : '-',
                    mp: spy.mp != null ? spy.mp : itemRow.mp,
                    boarded: spy.boarded != null && spy.boarded !== '' ? spy.boarded : '-'
                };
            }
        }

        return {
            unitKind: unitKind,
            id: itemRow.itemNo,
            position: itemRow.xy || '-',
            fed: itemRow.fed != null ? itemRow.fed : '-',
            mp: itemRow.mp != null ? itemRow.mp : '-',
            description: itemRow.description || '-'
        };
    }

    function filterMovementItemBySelectedMap(item, selectedMapChoice) {
        if (!item || !selectedMapChoice) return false;

        return item.x >= selectedMapChoice.rangeMinX
            && item.x <= selectedMapChoice.rangeMaxX
            && item.y >= selectedMapChoice.rangeMinY
            && item.y <= selectedMapChoice.rangeMaxY;
    }

    function buildFilteredMovementItemsForMap(options) {
        var opts = options || {};
        var turnReport = opts.turnReport || {};
        var movementItems = turnReport.movementItemList || [];
        var filteredRows = movementItems
            .filter(function (item) {
                return filterMovementItemBySelectedMap(item, opts.selectedMapChoice);
            })
            .map(function (item) {
                var itemNo = item.originalItemNo != null ? item.originalItemNo : item.itemNo;
                var itemTypeName = opts.getItemTypeName(item.itemType);
                if (itemTypeName === 'BaggageTrain') itemTypeName = 'Bagagge';

                var row = {
                    itemNo: itemNo,
                    originalItemNo: itemNo,
                    fed: Object.prototype.hasOwnProperty.call(opts.effectiveFedLookupByItemNo, itemNo)
                        ? opts.effectiveFedLookupByItemNo[itemNo]
                        : item.federationNo,
                    itemType: item.itemType,
                    shipTypeNo: item.shipTypeNo,
                    itemTypeName: itemTypeName,
                    description: item.description,
                    mp: item.originalMP != null ? item.originalMP : item.mp,
                    x: item.x,
                    y: item.y,
                    xy: item.x + '/' + item.y
                };

                row.movementDetail = opts.resolveMovementPickerDetail(
                    row,
                    opts.detailLookups,
                    opts.effectiveFedLookupByItemNo
                );
                row.mainDescription = getMovementPickerMainDescription(row);
                row.hasBoarding = opts.hasMovementPickerBoardingStatus(
                    row,
                    row.movementDetail,
                    opts.boardingLookups,
                    opts.effectiveFedLookupByItemNo
                );
                return row;
            })
            .sort(function (a, b) {
                var ax = parseInt(a.x, 10);
                var ay = parseInt(a.y, 10);
                var bx = parseInt(b.x, 10);
                var by = parseInt(b.y, 10);

                if (isNaN(ax)) ax = 999999;
                if (isNaN(ay)) ay = 999999;
                if (isNaN(bx)) bx = 999999;
                if (isNaN(by)) by = 999999;

                if (ax !== bx) return ax - bx;
                if (ay !== by) return ay - by;

                var typeRankA = getMovementPickerTypeSortRank(a.itemTypeName);
                var typeRankB = getMovementPickerTypeSortRank(b.itemTypeName);
                if (typeRankA !== typeRankB) return typeRankA - typeRankB;

                return a.itemNo - b.itemNo;
            });

        return filteredRows;
    }

    return {
        getMovementPickerUnitKind: getMovementPickerUnitKind,
        formatMovementPickerPosition: formatMovementPickerPosition,
        buildMovementPickerBattalionSummary: buildMovementPickerBattalionSummary,
        getMovementPickerMainDescription: getMovementPickerMainDescription,
        getMovementPickerTypeSortRank: getMovementPickerTypeSortRank,
        buildMovementPickerDetailLookups: buildMovementPickerDetailLookups,
        buildMovementPickerEffectiveFederationLookup: buildMovementPickerEffectiveFederationLookup,
        buildMovementPickerBoardingLookups: buildMovementPickerBoardingLookups,
        hasMovementPickerBoardingStatus: hasMovementPickerBoardingStatus,
        resolveMovementPickerDetail: resolveMovementPickerDetail,
        filterMovementItemBySelectedMap: filterMovementItemBySelectedMap,
        buildFilteredMovementItemsForMap: buildFilteredMovementItemsForMap
    };
});
