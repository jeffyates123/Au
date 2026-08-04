# Federation and assignment replay

## Purpose

TS14 orders determine effective land federation and naval fleet assignments shown after a turn reload.

## Main files

- Resolver: `App/turnAssignmentResolverFactory.js`
- Army replay: `App/landUnits/landUnitsReplayFactory.js`
- Navy factories: `App/navalUnits/*.js`

## Rules

Replay derives the display assignment from current report data plus turnsheet orders; it must not mutate imported report rows. Land federation numbers are 61–90. Fleet numbers are 11–59. Keep those number ranges separate, especially when deriving movement highlighting or filtering.

## Verify

Create/change a TS14 assignment, reload the turn, confirm the right Army/Navy display, and check that Movement X marks only the matching federation or fleet.

## Related handoffs

- [Army](army.md)
- [Navy](navy.md)
- [Turn maps](turn-maps.md)
- [Turnsheet API and sections](02-turnsheet-api-and-sections.md)
