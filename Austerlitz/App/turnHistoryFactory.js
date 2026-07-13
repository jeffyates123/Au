'use strict';

austerlitzModule.factory('turnHistoryFactory', function () {
    var monthCodes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function getTurnMonthNumber(monthText) {
        var monthCode = (monthText || '').toString().trim().substr(0, 3).toUpperCase();

        switch (monthCode) {
            case 'JAN': return 1;
            case 'FEB': return 2;
            case 'MAR': return 3;
            case 'APR': return 4;
            case 'MAY': return 5;
            case 'JUN': return 6;
            case 'JUL': return 7;
            case 'AUG': return 8;
            case 'SEP': return 9;
            case 'OCT': return 10;
            case 'NOV': return 11;
            case 'DEC': return 12;
            default: return 0;
        }
    }

    function getMonthCodeFromNumber(monthNumber) {
        if (monthNumber < 1 || monthNumber > 12) return '';
        return monthCodes[monthNumber - 1];
    }

    function parseTurnSummary(turn) {
        if (!turn) return null;

        var turnId = (turn.turnId || turn.TurnId || '').toString().trim();
        if (!turnId) return null;

        var gameNo = (turn.gameNo || turn.GameNo || (turnId.length >= 3 ? turnId.substr(0, 3) : '')).toString().trim();
        var state = (turn.state || turn.State || (turnId.length >= 4 ? turnId.substr(3, 1) : '')).toString().trim().toUpperCase();
        var monthTextFromTurn = (turn.month || turn.Month || '').toString().trim();
        var monthTextFromTurnId = (turnId.length >= 8 ? turnId.substring(4, turnId.length - 4) : '').toString().trim();
        var monthText = monthTextFromTurn || monthTextFromTurnId;
        var parsedYear = parseInt(turn.year || turn.Year || (turnId.length >= 8 ? turnId.substr(turnId.length - 4) : ''), 10);
        if (isNaN(parsedYear)) parsedYear = 0;
        var parsedMonth = getTurnMonthNumber(monthText);
        if (parsedMonth === 0 && monthTextFromTurnId) {
            // Some payloads send full month names; turnId still carries canonical short month code.
            parsedMonth = getTurnMonthNumber(monthTextFromTurnId);
            if (parsedMonth > 0) monthText = monthTextFromTurnId;
        }

        return {
            turnId: turnId,
            gameNo: gameNo,
            state: state,
            monthText: monthText,
            year: parsedYear,
            turnSortKey: (parsedYear * 100) + parsedMonth
        };
    }

    function getPreviousTurnId(turnsList, currentTurnId) {
        var normalizedCurrentTurnId = (currentTurnId || '').toString().trim();
        var normalizedCurrentTurnIdUpper = normalizedCurrentTurnId.toUpperCase();
        if (!normalizedCurrentTurnId || !turnsList || !turnsList.length) return null;

        var parsedTurns = [];
        angular.forEach(turnsList, function (turn) {
            var parsed = parseTurnSummary(turn);
            if (parsed) parsedTurns.push(parsed);
        });

        var currentTurn = null;
        angular.forEach(parsedTurns, function (turn) {
            if (!currentTurn && (turn.turnId || '').toUpperCase() === normalizedCurrentTurnIdUpper) {
                currentTurn = turn;
            }
        });
        if (!currentTurn) return null;

        var matchingTurns = parsedTurns.filter(function (turn) {
            return turn.gameNo === currentTurn.gameNo && turn.state === currentTurn.state;
        });

        matchingTurns.sort(function (a, b) {
            if (a.turnSortKey !== b.turnSortKey) return b.turnSortKey - a.turnSortKey;
            if (a.turnId < b.turnId) return 1;
            if (a.turnId > b.turnId) return -1;
            return 0;
        });

        for (var i = 0; i < matchingTurns.length; i++) {
            if ((matchingTurns[i].turnId || '').toUpperCase() === normalizedCurrentTurnIdUpper) {
                return i + 1 < matchingTurns.length ? matchingTurns[i + 1].turnId : null;
            }
        }

        return null;
    }

    function getPreviousMonthTurnIdFromTurnId(turnId) {
        var normalizedTurnId = (turnId || '').toString().trim();
        if (!normalizedTurnId || normalizedTurnId.length < 8) return null;

        var prefix = normalizedTurnId.substring(0, 4);
        var monthToken = normalizedTurnId.substring(4, normalizedTurnId.length - 4);
        var year = parseInt(normalizedTurnId.substring(normalizedTurnId.length - 4), 10);
        var monthNumber = getTurnMonthNumber(monthToken);

        if (isNaN(year) || monthNumber < 1) return null;

        var previousMonthNumber = monthNumber - 1;
        var previousYear = year;
        if (previousMonthNumber < 1) {
            previousMonthNumber = 12;
            previousYear--;
        }

        var previousMonthCode = getMonthCodeFromNumber(previousMonthNumber);
        if (!previousMonthCode) return null;

        return prefix + previousMonthCode + previousYear;
    }

    function containsTurnId(turnsList, turnId) {
        var normalizedTurnId = (turnId || '').toString().trim().toUpperCase();
        if (!normalizedTurnId) return false;

        var hasTurn = false;
        angular.forEach(turnsList || [], function (turn) {
            if (hasTurn) return;
            var rowTurnId = (turn && (turn.turnId || turn.TurnId) ? (turn.turnId || turn.TurnId) : '').toString().trim().toUpperCase();
            if (rowTurnId === normalizedTurnId) hasTurn = true;
        });

        return hasTurn;
    }

    return {
        getTurnMonthNumber: getTurnMonthNumber,
        parseTurnSummary: parseTurnSummary,
        getPreviousTurnId: getPreviousTurnId,
        getPreviousMonthTurnIdFromTurnId: getPreviousMonthTurnIdFromTurnId,
        containsTurnId: containsTurnId
    };
});
