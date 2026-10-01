import type { GroupsFormat, PromotionFormat } from '@/types';
import { Button } from '@/components/Button';
import { ButtonRow } from '@/components/ButtonRow';
import { Flag } from '@/components/Flag';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TrophyIcon } from '@/components/TrophyIcon';
import { championIds, fateText, formatLabel, getCompetition, getEdition } from '@/data/competitions';
import { getNation, nameIn } from '@/data/nations';
import { championOf, exitRound, knockoutPreview, leagueFate } from '@/engine/tournament';
import { useTournament } from '@/state';
import { ordinal } from '@/utils/format';
import { historyLine, locate, seededRound } from './bracketUtils';
import { BracketView } from './components/BracketView';
import { GroupStage } from './components/GroupStage';
import { NextMatch, type PlayRequest } from './components/NextMatch';
import './Bracket.css';

export interface BracketProps {
  onPlay: (request: PlayRequest) => void;
  onBye: () => void;
  onHome: () => void;
  onSetup: () => void;
  /** Run the same tournament again. */
  onRetry: () => void;
  onCabinet: () => void;
}

export function Bracket({ onPlay, onBye, onHome, onSetup, onRetry, onCabinet }: BracketProps) {
  const t = useTournament();
  if (!t) {
    return (
      <div className="empty-screen">
        <h1 className="screen-title">No tournament in progress</h1>
        <Button variant="primary" onClick={onSetup}>
          Start one
        </Button>
      </div>
    );
  }
  const comp = getCompetition(t.compId);
  const edition = getEdition(comp, t.editionId);
  const year = edition.year;
  const me = getNation(t.userId);
  const myName = nameIn(me, year);
  const champion = championOf(t);
  const hasGroups = Boolean(t.groups);
  const league = t.format.type === 'league';
  const tier = t.format.type === 'promotion';
  const tableOnly = league || tier;
  const fate = leagueFate(t);
  const fateLine = fate ? fateText(fate, { league: tier ? (t.format as PromotionFormat).league : 'A', name: myName, edition }) : '';
  const everyoneUp = tier && Object.values((t.format as PromotionFormat).fates).every((x) => x === 'promoted');
  const preview = t.phase === 'groups' ? knockoutPreview(t) : null;
  const exit = t.status === 'out' ? exitRound(t) : null;
  // With a second group stage the user may have gone out in the first one (t.firstGroups).
  const inStage = locate(t.groups, t.userId);
  const spot = inStage ?? locate(t.firstGroups, t.userId);
  const myRow = spot?.row ?? null;
  const groupName = spot?.group.name ?? '';
  const finalRound = t.stage === 2 && (t.format as GroupsFormat).second?.league;
  const outTitle = tier
    ? `${ordinal(myRow!.pos)} in Group ${groupName}`
    : league
      ? `${myName} finished ${ordinal(myRow!.pos)}`
      : finalRound && inStage
        ? `${myName} finished ${ordinal(myRow!.pos)} in the final round`
        : exit === 'Group stage'
          ? 'Out in the group stage'
          : `Out in the ${exit?.toLowerCase()}`;
  const outDetail = tier
    ? `${everyoneUp ? `${myName} still move up to League C with the rest of League D.` : fateLine} `
    : exit === 'Group stage' && myRow
      ? `You finished ${ordinal(myRow.pos)} in Group ${groupName}. ${fateLine} `
      : exit === 'Second round' && myRow
        ? `You finished ${ordinal(myRow.pos)} in second-round Group ${groupName}. `
        : '';

  const groupSection = hasGroups && (
    <>
      <section className="hub-section" aria-labelledby="groups-heading">
        <h2 id="groups-heading" className="section-title">
          {league
            ? 'League table'
            : tier
              ? `League ${(t.format as PromotionFormat).league}`
              : t.stage === 2
                ? finalRound
                  ? 'Final round'
                  : 'Second round'
                : 'Group stage'}
        </h2>
        <GroupStage t={t} year={year} />
      </section>
      {t.stage === 2 && (
        <section className="hub-section" aria-labelledby="first-round-heading">
          <h2 id="first-round-heading" className="section-title">
            First round
          </h2>
          <GroupStage t={t} year={year} stage={1} />
        </section>
      )}
    </>
  );
  const knockoutSection = !tableOnly && (t.rounds.length > 0 || preview) && (
    <section className="hub-section" aria-labelledby="ko-heading">
      <h2 id="ko-heading" className="section-title">
        {hasGroups ? 'Knockout stage' : 'Bracket'}
      </h2>
      {preview && <p className="rule">Slots fill in when the groups finish.</p>}
      <BracketView t={t} year={year} preview={preview} />
    </section>
  );

  return (
    <div className="bracket-screen">
      <ScreenHeader backLabel="Back to menu" onBack={onHome}>
        <p className="eyebrow-line">
          <Flag id={me.id} size="sm" /> {myName}
        </p>
        <h1 className="screen-title">
          {comp.short} {edition.label}
        </h1>
        <p className="muted format-line">{formatLabel(t.format)}</p>
      </ScreenHeader>

      {t.replaced && t.status === 'playing' && t.day === 0 && t.round === 0 && (
        <p className="notice">You take the place of {nameIn(getNation(t.replaced), year)} from the real line-up.</p>
      )}

      {t.byes?.includes(t.userId) && t.status === 'playing' && t.round === 0 && (
        <p className="notice">
          {myName} are seeded straight into the {seededRound(t.rounds[0].length)}: the group stage was played without them, and its results are below the
          bracket.
        </p>
      )}

      {t.status === 'playing' && <NextMatch t={t} me={me} myName={myName} year={year} comp={comp} edition={edition} onPlay={onPlay} onBye={onBye} />}

      {t.status === 'promoted' && (
        <section className="finale finale--win frame" aria-label={everyoneUp ? 'Group winners' : 'Promoted'}>
          <div>
            <h2 className="finale__title">{everyoneUp ? 'Group winners!' : 'Promoted!'}</h2>
            <p className="finale__text">
              {myName} {myRow!.pos === 1 ? 'win' : `finish ${ordinal(myRow!.pos)} in`} Group {groupName} of the {comp.short} {edition.label}.{' '}
              {everyoneUp
                ? 'They move up to League C with the rest of League D, as group winners.'
                : fateText(fate, { league: (t.format as PromotionFormat).league, name: 'They', edition })}
            </p>
            <ButtonRow wrap>
              <Button variant="primary" onClick={onSetup}>
                Play another tournament
              </Button>
              <Button variant="secondary" onClick={onRetry}>
                Play it again
              </Button>
            </ButtonRow>
          </div>
        </section>
      )}

      {t.status === 'champion' && (
        <section className="finale finale--win frame" aria-label="Champions">
          <TrophyIcon kind={comp.trophy} scale={6} className="finale__trophy" label={`${comp.name} trophy`} />
          <div>
            <h2 className="finale__title">Champions!</h2>
            <p className="finale__text">
              {myName} {league ? 'top the table in' : 'win'} the {comp.short} {edition.label}. {historyLine(edition, championIds(edition), t.userId, year)}
            </p>
            <ButtonRow wrap>
              <Button variant="primary" onClick={onSetup}>
                Play another tournament
              </Button>
              <Button variant="secondary" onClick={onCabinet}>
                Trophy cabinet
              </Button>
            </ButtonRow>
          </div>
        </section>
      )}

      {t.status === 'out' && (
        <section className="finale finale--out frame" aria-label={tableOnly ? 'Final standing' : 'Knocked out'}>
          <div>
            <h2 className="finale__title">{outTitle}</h2>
            <p className="finale__text">
              {outDetail}
              {champion ? `${nameIn(getNation(champion), year)} went on to ${league || finalRound ? 'take the title' : 'win it'}. ` : ''}
              {tier ? 'Run the group again or pick another tournament.' : 'Every shootout is a fresh start: run this tournament again or pick another year.'}
            </p>
            <ButtonRow wrap>
              <Button variant="primary" onClick={onRetry}>
                Try again
              </Button>
              <Button variant="secondary" onClick={onSetup}>
                Pick another tournament
              </Button>
            </ButtonRow>
          </div>
        </section>
      )}

      {t.phase === 'groups' || tableOnly || finalRound ? (
        <>
          {groupSection}
          {knockoutSection}
        </>
      ) : (
        <>
          {knockoutSection}
          {hasGroups && (
            <details className="hub-section groups-details">
              <summary className="groups-details__summary">Group stage results</summary>
              {t.stage === 2 ? (
                <>
                  <h3 className="section-title groups-details__round">Second round</h3>
                  <GroupStage t={t} year={year} />
                  <h3 className="section-title groups-details__round">First round</h3>
                  <GroupStage t={t} year={year} stage={1} />
                </>
              ) : (
                <GroupStage t={t} year={year} />
              )}
            </details>
          )}
        </>
      )}
    </div>
  );
}
