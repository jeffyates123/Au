"use strict";

austerlitzModule.factory("navalUnitsStateFactory", function () {
  function getStoredBool(key) {
    try {
      return window.localStorage.getItem(key) === "true";
    } catch (e) {
      return false;
    }
  }

  return {
    createInitialState: function () {
      return {
        isLoading: false,
        loadError: null,
        activeNavyTab: "setUpNavy",
        warshipRows: [],
        warshipPairRows: [],
        merchantRows: [],
        merchantPairRows: [],
        fleetSummaryPairRows: [],
        warshipsSectionCollapsed: getStoredBool(
          "austerlitz.navy.warshipsSectionCollapsed",
        ),
        merchantsSectionCollapsed: getStoredBool(
          "austerlitz.navy.merchantsSectionCollapsed",
        ),
        refShips: [],
        refShipsByType: {},
        eligibleShipyards: [],
        shipTypeOptions: [],
        tsNavyBuildList: [],
        tsNavyBuildRows: [],
        tsNavyTransferGoodsList: [],
        tsBoardingList: [],
        navyFormFederationRows: [],
        navyFormFederationModal: {
          isOpen: false,
          ship: null,
          targetFleetNo: null,
          validationError: "",
          stagedOrders: [],
        },
        navyRepairModal: {
          isOpen: false,
          stagedItemNos: {},
        },
        navyPositionFilter: null,
        navySphereFilter: null,
      };
    },
  };
});
