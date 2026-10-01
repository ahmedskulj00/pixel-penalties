import type { Format, GroupsFormat, KnockoutFormat, NationId, SecondStage, TableRow, Tournament } from '@/types';
import { qualifyRule } from '@/data/competitions';
import { getNation, nameIn } from '@/data/nations';
import { groupTable, qualifiers } from '@/engine/tournament';
import { formatList } from '@/utils/format';
import { tierLegend, tierState, type RowState } from '../../bracketUtils';
import { Fixtures } from '../Fixtures';
import { GroupTable } from '../GroupTable';
import './GroupStage.css';

export interface GroupStageProps {
  t: Tournament;
  year: number;
  /** Show the first stage (1) or the second (2); defaults to the current one. */
  stage?: 1 | 2;
}

/** A group stage never has a knockout format; a second stage is shown with one of its own (winners go through). */
type StageFormat = Exclude<Format, KnockoutFormat> | { type: 'league' | 'groups'; advance: number; extra: number };

/**
 * One group stage. With a second stage (World Cup 1950–82, final rounds) the first
 * stage stays on screen, finished, below the second.
 */
export function GroupStage({ t, year, stage }: GroupStageProps) {
  // Only read when a second stage is shown, so it exists then.
  const second = (t.format as GroupsFormat).second as SecondStage;
  const isSecond = (stage ?? (t.stage === 2 ? 2 : 1)) === 2;
  const isEarlier = !isSecond && t.stage === 2;
  const groups = (isEarlier ? t.firstGroups : t.groups)!;
  const f: StageFormat = isSecond ? { type: second.league ? 'league' : 'groups', advance: 1, extra: 0 } : (t.format as Exclude<Format, KnockoutFormat>);
  const tables = groups.map((g) => groupTable(g));
  const finished = isEarlier || t.phase !== 'groups';
  let through: Set<NationId | undefined> | null = null;
  if (finished && f.type === 'groups') {
    if (isEarlier) through = new Set(t.groups!.flatMap((g) => g.teams));
    else if (isSecond) through = new Set(tables.map((rows) => rows[0]?.id));
    else {
      const q = qualifiers(t, tables);
      through = new Set([...q.direct, ...q.extras].map((x) => x.id));
    }
  }
  const everyoneUp = f.type === 'promotion' && Object.values(f.fates).every((x) => x === 'promoted');
  const status = (r: TableRow): RowState | null => {
    if (f.type === 'league') return finished ? (r.pos === 1 ? 'in' : null) : null;
    if (f.type === 'promotion') {
      if (everyoneUp) return r.pos === 1 ? 'in' : null;
      return tierState(f.fates[r.pos]);
    }
    if (finished) return through!.has(r.id) ? 'in' : 'out';
    if (r.pos <= f.advance) return 'in';
    return f.extra && r.pos === f.advance + 1 ? 'maybe' : null;
  };
  const mine = groups.findIndex((g) => g.teams.includes(t.userId));
  const order = mine >= 0 ? [mine, ...groups.map((_, i) => i).filter((i) => i !== mine)] : groups.map((_, i) => i);
  const single = groups.length === 1;
  const rule = isSecond
    ? second.league
      ? 'Everyone plays everyone once. Top of the table takes the title.'
      : `Group winners ${second.pairs.length === 1 ? 'meet in the final' : 'go through to the semi-finals'}.`
    : isEarlier
      ? null
      : qualifyRule(f as Format);

  return (
    <>
      {rule && <p className="rule">{rule}</p>}
      {!isSecond && !!t.byes?.length && (
        <p className="rule">
          {t.byes.includes(t.userId)
            ? `${nameIn(getNation(t.userId), year)} are seeded straight into the knockouts, with ${
                formatList(t.byes.filter((id) => id !== t.userId).map((id) => nameIn(getNation(id), year))) || 'no one else'
              }.`
            : `Seeded straight into the knockouts: ${formatList(t.byes.map((id) => nameIn(getNation(id), year)))}.`}
        </p>
      )}
      {f.type === 'promotion' && (
        <ul className="legend" aria-label="Table key">
          <li>
            <span className="legend__swatch legend__swatch--in" /> {everyoneUp ? 'Group winners' : 'Promotion'}
          </li>
          {!everyoneUp && tierLegend(f.fates).maybe && (
            <li>
              <span className="legend__swatch legend__swatch--maybe" /> {tierLegend(f.fates).maybe}
            </li>
          )}
          {!everyoneUp && tierLegend(f.fates).down && (
            <li>
              <span className="legend__swatch legend__swatch--down" /> {tierLegend(f.fates).down}
            </li>
          )}
        </ul>
      )}
      {f.type === 'groups' && (
        <ul className="legend" aria-label="Table key">
          <li>
            <span className="legend__swatch legend__swatch--in" /> {finished ? 'Through' : 'Qualifying places'}
          </li>
          {!finished && f.extra > 0 && (
            <li>
              <span className="legend__swatch legend__swatch--maybe" /> {f.advance === 1 ? 'Best runner-up race' : 'Best third-placed race'}
            </li>
          )}
          {finished && (
            <li>
              <span className="legend__swatch legend__swatch--out" /> Out
            </li>
          )}
        </ul>
      )}
      <div className="groups-grid">
        {order.map((gi) => {
          const g = groups[gi];
          const isMine = gi === mine;
          const title = single ? 'Table' : `Group ${g.name}`;
          return (
            <section
              key={g.name}
              className={`group-card frame${isMine ? ' group-card--mine' : ''}${isMine ? ' group-card--wide' : ''}`}
              aria-label={single ? title : `Group ${g.name}`}
            >
              <h3 className="group-card__title">
                {title}
                {isMine && !single && <span className="group-card__you">Your group</span>}
              </h3>
              <div className={isMine ? 'group-card__body' : undefined}>
                <GroupTable group={g} rows={tables[gi]} userId={t.userId} year={year} status={status} />
                {isMine && <Fixtures group={g} userId={t.userId} year={year} nextDay={t.phase === 'groups' && !isEarlier ? t.day : -1} />}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
