IF OBJECT_ID('dbo.REF_TurnErrorCodes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.REF_TurnErrorCodes (
        SectionNo SMALLINT NOT NULL,
        ErrorCode SMALLINT NOT NULL,
        [Message] NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_REF_TurnErrorCodes PRIMARY KEY (SectionNo, ErrorCode)
    );
END;

MERGE dbo.REF_TurnErrorCodes AS target
USING (VALUES
    (1, 2, N'Source and destination are same item.'),
    (1, 3, N'Source does not exist.'),
    (1, 4, N'Incorrect source registration number.'),
    (1, 5, N'Source is not in your empire.'),
    (1, 6, N'Destination does not exist.'),
    (1, 7, N'Incorrect destination registration number.'),
    (1, 8, N'Destination is not in your empire.'),

    (2, 2, N'Incorrect item registration number.'),
    (2, 3, N'Incorrect x/y co-ordinate.'),
    (2, 4, N'Item specified does not belong to you.'),
    (2, 5, N'Population of co-ordinate is already zero.'),
    (2, 6, N'Population has already been reduced this turn.'),
    (2, 7, N'Co-ordinate has not been under your control for five months.'),
    (2, 8, N'Item does not exist.'),
    (2, 9, N'Item is not in barracks or shipyard.'),
    (2, 10, N'Barracks/shipyard in trade city cannot be demolished.'),

    (8, 2, N'Brigade must be set up with minimum of 5 battalions.'),
    (8, 3, N'Incorrect barracks registration number.'),
    (8, 4, N'Barracks does not exist.'),
    (8, 5, N'Barracks is not in your territory.'),
    (8, 6, N'No more than two brigades can be set up outside your empire political sphere.'),
    (8, 7, N'No remaining registration numbers for brigades.'),
    (8, 8, N'Incorrect brigade registration number for battalions 6 or 7.'),
    (8, 9, N'Incorrect brigade registration number.'),
    (8, 10, N'Insufficient Louisdore (Money).'),
    (8, 11, N'Insufficient People.'),
    (8, 13, N'Insufficient Economic Points.'),
    (8, 22, N'Insufficient Horses.'),
    (8, 31, N'Brigade is not on map.'),
    (8, 32, N'Brigade does not exist.'),
    (8, 33, N'Brigade belongs to another player.'),
    (8, 34, N'Brigade is not in barracks/shipyard.'),
    (8, 35, N'Troop type cannot be set up in colonies.'),
    (8, 36, N'Your empire cannot build this troop type.'),
    (8, 37, N'Headcount is already maximum.'),
    (8, 38, N'Experience level is already maximum.'),
    (8, 39, N'Incorrect battalion number.'),
    (8, 40, N'Brigades are not at same position.'),
    (8, 41, N'Troop type can only be set up in colonies.'),
    (8, 42, N'Different troop types cannot be merged.'),
    (8, 50, N'Order could not be carried out as enemy brigades are present.'),
    (8, 51, N'No more than two brigades can be built in total in colonies.'),

    (11, 2, N'Incorrect registration number for barracks/shipyard.'),
    (11, 3, N'Barracks/shipyard does not exist.'),
    (11, 4, N'Barracks/shipyard does not belong to you.'),
    (11, 5, N'Ship type does not exist.'),
    (11, 6, N'Cannot build ship in barracks.'),
    (11, 7, N'Ships of class 3 to 5 cannot be built in colonies.'),
    (11, 8, N'Ship type can only be built by Morocco and Ottoman Empire.'),
    (11, 9, N'No remaining registration numbers for ship/baggage train.'),
    (11, 10, N'Insufficient Louisdore (Money).'),
    (11, 11, N'Insufficient People.'),
    (11, 13, N'Insufficient Economic Points.'),
    (11, 19, N'Insufficient Wood.'),
    (11, 22, N'Insufficient Horses.'),
    (11, 23, N'Insufficient Textiles.'),
    (11, 31, N'Ship/baggage train does not exist.'),
    (11, 32, N'Ship/baggage train is not on map.'),
    (11, 33, N'Ship/baggage train is not in one of your barracks/shipyards.'),
    (11, 34, N'Ship/baggage train is not in barracks or shipyard.'),
    (11, 35, N'Incorrect registration number for repaired item.'),

    (12, 2, N'Co-ordinate does not exist.'),
    (12, 3, N'Co-ordinate is not in your territory or is water.'),
    (12, 4, N'Population density already increased this month.'),
    (12, 5, N'Population density already at maximum.'),
    (12, 11, N'Insufficient People.'),
    (12, 18, N'Insufficient Stone.'),
    (12, 19, N'Insufficient Wood.'),

    (13, 2, N'Co-ordinate does not exist.'),
    (13, 3, N'Co-ordinate is owned by another player.'),
    (13, 4, N'Wrong terrain type.'),
    (13, 5, N'No mineable resources in this co-ordinate.'),
    (13, 6, N'Barracks/shipyard on co-ordinate must be demolished before production site build.'),
    (13, 7, N'Population density too low.'),
    (13, 8, N'Population density too high.'),
    (13, 9, N'No remaining registration numbers for production sites.'),
    (13, 10, N'Insufficient Money.'),
    (13, 11, N'Insufficient People.'),
    (13, 18, N'Insufficient Stone.'),
    (13, 19, N'Insufficient Wood.'),
    (13, 31, N'Fortress can only be built where there is barracks or shipyard.'),
    (13, 32, N'Fortress is already at maximum size.'),
    (13, 33, N'Mints can only be built in Europe.'),
    (13, 34, N'Barracks and shipyards cannot be destroyed with demolition gang.'),
    (13, 40, N'Order could not be carried out as enemy brigades are present.'),
    (13, 41, N'Cannot build and then fortify barracks in same turn.'),
    (13, 42, N'Cannot fortify barracks twice in same turn.'),

    (14, 2, N'Incorrect item registration number.'),
    (14, 3, N'Item can only join federation 61-90 or 0.'),
    (14, 4, N'Item can only join federation 11-60 or 0.'),
    (14, 5, N'Ship/fleet cannot join federation while loaded; on-board item cannot move directly into federation.'),
    (14, 6, N'Item is owned by another player.'),
    (14, 7, N'Item does not exist.'),
    (14, 8, N'Item is not on map.'),
    (14, 9, N'Item and federation are on different co-ordinates.'),

    (16, 2, N'Fleet does not exist.'),
    (16, 3, N'Fleet is not in shipyard.'),
    (16, 4, N'Fleet is not next to land co-ordinate.'),
    (16, 5, N'Relationship toward target empire is not War or Neutral.'),
    (16, 6, N'Maximum of three fleets on blockade exceeded.'),

    (18, 2, N'Incorrect registration number.'),
    (18, 3, N'Item belongs to another empire.'),
    (18, 4, N'Item has already been moved this month.'),
    (18, 5, N'Item is involved in battle.'),
    (18, 6, N'Item does not exist.'),
    (18, 7, N'Item is not on map.'),
    (18, 8, N'Item cannot be moved separately while in federation.'),
    (18, 9, N'Invalid direction specified.'),
    (18, 10, N'Item crossed map edge.'),
    (18, 11, N'Item stopped at water co-ordinate.'),
    (18, 12, N'Item stopped entering land co-ordinate that is not shipyard.'),
    (18, 13, N'Forced march allowed only on your own territory.'),
    (18, 14, N'Item ran out of movement points.'),
    (18, 15, N'Baggage trains cannot cross empires with War or Neutral relationship toward you.'),
    (18, 16, N'Troops without General can only move over Alliance relationship empires.'),
    (18, 17, N'Troops with General can only move over Alliance relationship empires.'),
    (18, 18, N'Cannot attack or conquer Gibraltar from prohibited side.'),
    (18, 19, N'Item was stopped by enemy.'),
    (18, 20, N'Shipyard moved into is owned by empire at War with your empire.'),
    (18, 21, N'Maximum movement for invading army reached.'),
    (18, 22, N'One or more brigades lost battle this month and cannot move.'),
    (18, 23, N'Fleet on Coastal Defence or Blockade cannot move.'),
    (18, 30, N'Brigade/Federation involved in simulated battle penalty loss cannot move this turn.'),

    (19, 2, N'Incorrect registration number for source.'),
    (19, 3, N'Incorrect registration number for destination.'),
    (19, 4, N'Cannot transfer from national warehouse because destination is not at barracks/shipyard.'),
    (19, 5, N'Cannot transfer into national warehouse because source is not at barracks/shipyard.'),
    (19, 6, N'Cannot transfer goods directly from one depot to another.'),
    (19, 7, N'Source and destination are same item.'),
    (19, 8, N'Source is not on map.'),
    (19, 9, N'Destination is not on map.'),
    (19, 10, N'Source item is owned by another player.'),
    (19, 11, N'Both source and destination are owned by another player.'),
    (19, 12, N'Source and destination are not in same co-ordinate.'),
    (19, 13, N'Cannot load goods onto warships.'),
    (19, 14, N'A order can only transfer goods from ship/baggage train to depot/trade city.'),
    (19, 15, N'Source has no goods to transfer.'),
    (19, 16, N'Destination has no spare capacity.'),
    (19, 17, N'Source and destination are on different maps.'),
    (19, 18, N'Not enough money in destination item to buy goods.'),
    (19, 19, N'No money in destination item to purchase goods.'),

    (20, 2, N'Item to be loaded belongs to another empire.'),
    (20, 3, N'Incorrect registration number for item to be loaded.'),
    (20, 4, N'Incorrect ship/fleet registration number.'),
    (20, 5, N'Item to be loaded is not on map.'),
    (20, 6, N'Item to be loaded does not exist.'),
    (20, 7, N'Item to be loaded is involved in battle.'),
    (20, 8, N'Fleet does not have sufficient loading capacity.'),
    (20, 9, N'Spies and generals can only be loaded onto single ships.'),
    (20, 10, N'Brigades and baggage trains can only be loaded onto fleets.'),
    (20, 11, N'Item to be loaded is neither same co-ordinate nor vertically/horizontally adjacent to ship/fleet.'),
    (20, 12, N'Owner of item to be loaded does not have Alliance relationship with ship/fleet owner.'),
    (20, 13, N'Owner of ship/fleet does not have Alliance relationship with item owner.'),
    (20, 14, N'Item is not on board ship/fleet.'),
    (20, 15, N'Unload only allowed on ship/fleet position or adjacent co-ordinate.'),
    (20, 16, N'Unload co-ordinate is outside map boundaries.'),
    (20, 17, N'Item is disembarking onto water co-ordinate.'),
    (20, 18, N'Item cannot be unloaded in same month it was loaded.'),
    (20, 19, N'No War or Alliance state between owner of co-ordinate and owner of disembarking troops.'),
    (20, 20, N'Fleet has lost battle.'),

    (21, 2, N'Item does not belong to your empire.'),
    (21, 3, N'Item does not exist.'),
    (21, 4, N'Item is not on map.'),
    (21, 5, N'Brigades/baggage trains are loaded on ship.'),
    (21, 6, N'Owner of shipyard where ship is berthed is not new vessel owner.'),
    (21, 7, N'Ship is not in one of new owner shipyards.'),
    (21, 8, N'Co-ordinate does not contain one of new owner brigades.'),
    (21, 9, N'Incorrect item registration number.'),

    (22, 2, N'Incorrect registration number.'),
    (22, 3, N'Item is owned by another empire.'),
    (22, 4, N'Merchant ships do not have names.')
) AS source(SectionNo, ErrorCode, [Message])
ON target.SectionNo = source.SectionNo
   AND target.ErrorCode = source.ErrorCode
WHEN MATCHED THEN
    UPDATE SET [Message] = source.[Message]
WHEN NOT MATCHED THEN
    INSERT (SectionNo, ErrorCode, [Message])
    VALUES (source.SectionNo, source.ErrorCode, source.[Message]);

;WITH sharedSections AS (
    SELECT CAST(3 AS SMALLINT) AS SectionNo UNION ALL
    SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
)
MERGE dbo.REF_TurnErrorCodes AS target
USING (
    SELECT s.SectionNo, r.ErrorCode, r.[Message]
    FROM sharedSections s
    JOIN dbo.REF_TurnErrorCodes r ON r.SectionNo = 8
) AS source
ON target.SectionNo = source.SectionNo
   AND target.ErrorCode = source.ErrorCode
WHEN MATCHED THEN
    UPDATE SET [Message] = source.[Message]
WHEN NOT MATCHED THEN
    INSERT (SectionNo, ErrorCode, [Message])
    VALUES (source.SectionNo, source.ErrorCode, source.[Message]);

;WITH sharedSections AS (
    SELECT CAST(9 AS SMALLINT) AS SectionNo UNION ALL
    SELECT 10
)
MERGE dbo.REF_TurnErrorCodes AS target
USING (
    SELECT s.SectionNo, r.ErrorCode, r.[Message]
    FROM sharedSections s
    JOIN dbo.REF_TurnErrorCodes r ON r.SectionNo = 11
) AS source
ON target.SectionNo = source.SectionNo
   AND target.ErrorCode = source.ErrorCode
WHEN MATCHED THEN
    UPDATE SET [Message] = source.[Message]
WHEN NOT MATCHED THEN
    INSERT (SectionNo, ErrorCode, [Message])
    VALUES (source.SectionNo, source.ErrorCode, source.[Message]);

MERGE dbo.REF_TurnErrorCodes AS target
USING (
    SELECT CAST(17 AS SMALLINT) AS SectionNo, ErrorCode, [Message]
    FROM dbo.REF_TurnErrorCodes
    WHERE SectionNo = 19
) AS source
ON target.SectionNo = source.SectionNo
   AND target.ErrorCode = source.ErrorCode
WHEN MATCHED THEN
    UPDATE SET [Message] = source.[Message]
WHEN NOT MATCHED THEN
    INSERT (SectionNo, ErrorCode, [Message])
    VALUES (source.SectionNo, source.ErrorCode, source.[Message]);
