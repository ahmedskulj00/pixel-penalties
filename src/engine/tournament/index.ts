/**
 * A tournament is an optional group stage (mini-leagues where every match is a shootout)
 * followed by a knockout bracket, or a single league table (the old round-robin cups).
 * State is plain JSON (v2) so it can be saved and resumed; v1 saves are migrated on load.
 *
 * Nations League editions with leagues put each nation in its real tier; Leagues B–D play
 * their groups for promotion (format type 'promotion'), League A goes on to the knockouts.
 *
 * Some formats add a second group stage (`stage` 2, with the first stage kept in
 * `firstGroups`), and some seed teams straight into the knockouts (`byes`). A user with
 * a bye watches the groups resolve at creation and starts in the knockouts.
 */
export { buildField, type FieldOptions } from './field';
export { roundRobin, drawGroups, groupTable, groupTables, qualifiers, type GroupedRow, type Qualifier, type Qualifiers } from './groups';
export { assignExtras, bracketOrder, knockoutPreview, type KnockoutPreview } from './knockout';
export { createTournament, recordUserResult } from './progress';
export {
  userGroupIndex,
  inSecondStage,
  userMatch,
  roundName,
  stageLabel,
  championOf,
  exitRound,
  leagueFate,
  type UserMatch,
  type GroupUserMatch,
  type KnockoutUserMatch,
} from './queries';
export { validateTournament } from './storage';
