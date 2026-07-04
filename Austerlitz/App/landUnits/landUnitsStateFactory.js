"use strict";

austerlitzModule.factory("landUnitsStateFactory", function () {
  function getInitialSphereFilter(sphereOptions) {
    var stored = null;
    try {
      stored = window.localStorage.getItem(
        "austerlitz.landUnits.selectedSphere",
      );
    } catch (e) {}

    return sphereOptions.indexOf(stored) >= 0 ? stored : "All";
  }

  function getInitialCommandersSectionCollapsed() {
    var stored = null;
    try {
      stored = window.localStorage.getItem(
        "austerlitz.landUnits.commandersSectionCollapsed",
      );
    } catch (e) {}

    return stored === "true";
  }

  function emptyResources() {
    return {
      ld: "",
      citizens: "",
      ecPts: "",
      horses: "",
    };
  }

  function emptyHeadcountPreview() {
    return {
      affectedBrigades: 0,
      ld: 0,
      citizens: 0,
      ecPts: 0,
      horses: 0,
      efChanges: 0,
    };
  }

  function emptyTrainPreview() {
    return {
      affectedBrigades: 0,
      trainableBattalions: 0,
      skippedBattalions: 0,
      ld: 0,
      ecPts: 0,
      efChanges: 0,
    };
  }

  return {
    createInitialState: function () {
      var sphereOptions = ["All", "Europe", "Caribbean", "India"];

      return {
        brigadeRows: [],
        federationSummaryRows: [],
        federationSummaryPairRows: [],
        commanderRows: [],
        commanderOverflowCount: 0,
        commandersSectionCollapsed: getInitialCommandersSectionCollapsed(),
        isLoading: false,
        loadError: null,
        replayWarnings: [],
        armyListRows: [],
        armyListByShortName: {},
        headcountModal: {
          isOpen: false,
          brigade: null,
          targetHeadcount: 800,
          scope: "brigade",
          preview: emptyHeadcountPreview(),
        },
        trainModal: {
          isOpen: false,
          brigade: null,
          scope: "brigade",
          preview: emptyTrainPreview(),
        },
        battalionAction: {
          type: null,
          source: null,
          eligibleKeys: {},
        },
        addBattalionModal: {
          isOpen: false,
          brigade: null,
          selectedArmyItem: null,
          cost: emptyResources(),
        },
        formFederationModal: {
          isOpen: false,
          brigade: null,
          targetFederationNo: null,
          validationError: "",
          coordinateBrigades: [],
          stagedOrders: [],
        },
        sphereOptions: sphereOptions,
        selectedSphere: getInitialSphereFilter(sphereOptions),
        positionFilter: null,
        armyTabs: ["setUpBrigades", "existingArmy", "intelligence"],
        activeArmyTab: "setUpBrigades",
        tsSetUpBrigadesList: [],
        tsSetUpBrigadesRows: [],
        setupArmyListAllRows: [],
        setupArmyListRows: [],
        setupArmyListByItemNo: {},
        selectedSetUpArmyItem: null,
        setUpDepotOptions: [],
        setUpDepotOptionsBySphere: {},
        setUpDepotSelectionOptions: [],
        tsTransferGoodsList: [],
        tsSetUpAdditionalBrigadesList: [],
        tsIncreaseHeadcountList: [],
        tsIncreaseBrigadeXpList: [],
        economyTsCostSummarySections: [],
        economyTsCostWarnings: [],
        ts01BarracksSummaryRows: [],
        managedTransferGoodsRowOrderNos: [],
        brigadeActions: [
          "Movement",
          "Rename",
          "Add Battalion",
          "Headcount",
          "Experience",
          "Exchange Battalions",
          "Merge Battalions",
          "Form Federation",
          "Boarding",
          "Demolish",
        ],
      };
    },
  };
});
