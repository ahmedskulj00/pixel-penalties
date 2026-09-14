import { getCompetition, getEdition, championIds, qualifyRule, formatLabel, fateText } from '../data/competitions.js';
import { getNation, nameIn } from '../data/nations.js';
import {
  roundName,
  userMatch,
  championOf,
  exitRound,
  stageLabel,
  groupTable,
  qualifiers,
  knockoutPreview,
  ordinal,
  leagueFate,
} from '../engine/tournament.js';
import { Flag, Stars, TrophyIcon } from '../components/pixel.jsx';
import { Button, BackIcon, IconButton } from '../components/ui.jsx';
import { useTournament } from '../state/stores.js';

const LIST = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

// Lower Nations League tiers: what a finishing place looks like in the table.
const TIER_STATE = { promoted: 'in', 'playoff-up': 'maybe', 'playoff-down': 'down', playout: 'down', relegated: 'down' };
const tierState = (fate) => {
  if (!Array.isArray(fate)) return TIER_STATE[fate] ?? null;
  if (fate.includes('promoted')) return 'maybe';
  return fate.some((x) => TIER_STATE[x] === 'down') ? 'down' : null;
};

function tierLegend(fates) {
  const all = Object.values(fates).flat();
  const downs = new Set(all.filter((x) => TIER_STATE[x] === 'down'));
  const maybe = all.includes('playoff-up')
    ? 'Promotion play-off'
    : Object.values(fates).some((x) => Array.isArray(x) && x.includes('promoted'))
      ? 'Best third-placed team goes up'
      : null;
  const down = !downs.size
    ? null
    : downs.has('relegated') && downs.size > 1
      ? 'Relegation or play-off'
      : downs.has('relegated')
        ? 'Relegation'
        : downs.has('playout')
          ? 'Relegation play-out'
          : 'Relegation play-off';
  return { maybe, down };
}
const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
/** 'the quarter-finals', 'the semi-finals', 'the round of 16' for a first knockout round of n matches. */
const seededRound = (n) => {
  const name = roundName(n).toLowerCase();
  return name.startsWith('round of') ? name : `${name}s`;
};

// ─── Knockout bracket ───────────────────────────────────────────────────────

function TeamLine({ id, year, score, won, me, slot }) {
  if (!id) {
    return (
      <div className={`bm__team is-tbd${slot ? ' is-slot' : ''}`}>
        <span className="bm__flag bm__flag--empty" />
        <span className="bm__name">{slot ?? 'To be decided'}</span>
      </div>
    );
  }
  return (
    <div className={`bm__team${won ? ' is-winner' : ''}${me ? ' is-me' : ''}`}>
      <Flag id={id} size="sm" />
      <span className="bm__name">{nameIn(getNation(id), year)}</span>
      {score != null && <span className="bm__score">{score}</span>}
    </div>
  );
}

function BracketMatch({ m, year, userId, slots }) {
  if (m?.bye) {
    return (
      <div className="bm bm--bye">
        <TeamLine id={m.a} year={year} won me={m.a === userId} />
        <div className="bm__team is-tbd">
          <span className="bm__name">Bye</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`bm${m && (m.a === userId || m.b === userId) ? ' bm--mine' : ''}`}>
      <TeamLine id={m?.a} year={year} score={m?.s?.[0]} won={m?.w && m.w === m.a} me={m?.a === userId} slot={slots?.[0]} />
      <TeamLine id={m?.b} year={year} score={m?.s?.[1]} won={m?.w && m.w === m.b} me={m?.b === userId} slot={slots?.[1]} />
    </div>
  );
}

function BracketView({ t, year, preview }) {
  const size = t.rounds.length ? t.rounds[0].length * 2 : preview.size;
  const roundCount = Math.log2(size);
  const columns = Array.from({ length: roundCount }, (_, r) => t.rounds[r] ?? Array.from({ length: size / 2 ** (r + 1) }, () => null));
  return (
    <div className="bracket" role="region" aria-label="Knockout bracket" tabIndex={0}>
      {columns.map((matches, r) => (
        <section key={r} className="bracket__round" aria-label={roundName(matches.length)}>
          <h3 className="bracket__title">{roundName(matches.length)}</h3>
          <div className="bracket__matches">
            {matches.map((m, i) => (
              <BracketMatch key={i} m={m} year={year} userId={t.userId} slots={!t.rounds.length && r === 0 ? preview?.first[i] : null} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Group stage ────────────────────────────────────────────────────────────

function GroupTable({ group, rows, userId, year, status }) {
  return (
    <table className="gtable">
      <caption className="sr-only">Group {group.name} table</caption>
      <thead>
        <tr>
          <th scope="col" className="gtable__pos">
            <span className="sr-only">Position</span>
          </th>
          <th scope="col" className="gtable__team">
            Team
          </th>
          <th scope="col">
            <abbr title="Played">P</abbr>
          </th>
          <th scope="col">
            <abbr title="Won">W</abbr>
          </th>
          <th scope="col">
            <abbr title="Lost">L</abbr>
          </th>
          <th scope="col">
            <abbr title="Penalty difference">+/−</abbr>
          </th>
          <th scope="col">
            <abbr title="Points">Pts</abbr>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const state = status(r);
          return (
            <tr key={r.id} className={`${state ? `is-${state}` : ''}${r.id === userId ? ' is-me' : ''}`}>
              <td className="gtable__pos">
                {r.pos}
                {state && <span className="sr-only">{{ in: ', qualifying', maybe: ', play-off or best-placed spot', down: ', relegation zone', out: ', eliminated' }[state]}</span>}
              </td>
              <th scope="row" className="gtable__team">
                <span className="gtable__who">
                  <Flag id={r.id} size="xs" />
                  <span className="gtable__name">{nameIn(getNation(r.id), year)}</span>
                </span>
              </th>
              <td>{r.p}</td>
              <td>{r.w}</td>
              <td>{r.l}</td>
              <td>{signed(r.gd)}</td>
              <td className="gtable__pts">{r.pts}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function FixtureTeam({ id, year, won, side }) {
  return (
    <span className={`fixture__team fixture__team--${side}${won ? ' is-win' : ''}`}>
      <Flag id={id} size="xs" />
      <span className="fixture__name">{nameIn(getNation(id), year)}</span>
    </span>
  );
}

function Fixtures({ group, userId, year, nextDay }) {
  return (
    <ol className="fixtures" aria-label={`Group ${group.name} fixtures`}>
      {group.days.map((day, d) => {
        const playing = new Set(day.flatMap((m) => [m.a, m.b]));
        const resting = group.teams.filter((id) => !playing.has(id));
        return (
          <li key={d} className={`fixtures__day${d === nextDay ? ' is-next' : ''}`}>
            <span className="fixtures__label">
              Matchday {d + 1}
              {d === nextDay && <span className="fixtures__next">Next</span>}
            </span>
            <ul className="fixtures__list">
              {day.map((m, i) => (
                <li key={i} className={`fixture${m.a === userId || m.b === userId ? ' is-mine' : ''}`}>
                  <FixtureTeam id={m.a} year={year} won={m.w === m.a} side="a" />
                  <span className="fixture__score">{m.s ? `${m.s[0]}–${m.s[1]}` : 'v'}</span>
                  <FixtureTeam id={m.b} year={year} won={m.w === m.b} side="b" />
                </li>
              ))}
              {resting.map((id) => (
                <li key={id} className={`fixture fixture--rest${id === userId ? ' is-mine' : ''}`}>
                  {id === userId ? 'You rest this matchday' : `${nameIn(getNation(id), year)} rests`}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

/** Where the user played in a set of groups: { group, row }, or null. */
function locate(groups, userId) {
  const group = (groups ?? []).find((g) => g.teams.includes(userId));
  return group ? { group, row: groupTable(group).find((r) => r.id === userId) } : null;
}

/**
 * One group stage. With a second stage (World Cup 1950–82, final rounds) the first
 * stage stays on screen, finished, below the second.
 */
function GroupStage({ t, year, stage }) {
  const second = t.format.second;
  const isSecond = (stage ?? (t.stage === 2 ? 2 : 1)) === 2;
  const isEarlier = !isSecond && t.stage === 2;
  const groups = isEarlier ? t.firstGroups : t.groups;
  const f = isSecond ? { type: second.league ? 'league' : 'groups', advance: 1, extra: 0 } : t.format;
  const tables = groups.map((g) => groupTable(g));
  const finished = isEarlier || t.phase !== 'groups';
  let through = null;
  if (finished && f.type === 'groups') {
    if (isEarlier) through = new Set(t.groups.flatMap((g) => g.teams));
    else if (isSecond) through = new Set(tables.map((rows) => rows[0]?.id));
    else {
      const q = qualifiers(t, tables);
      through = new Set([...q.direct, ...q.extras].map((x) => x.id));
    }
  }
  const everyoneUp = f.type === 'promotion' && Object.values(f.fates).every((x) => x === 'promoted');
  const status = (r) => {
    if (f.type === 'league') return finished ? (r.pos === 1 ? 'in' : null) : null;
    if (f.type === 'promotion') {
      if (everyoneUp) return r.pos === 1 ? 'in' : null;
      return tierState(f.fates[r.pos]);
    }
    if (finished) return through.has(r.id) ? 'in' : 'out';
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
      : qualifyRule(f);

  return (
    <>
      {rule && <p className="rule">{rule}</p>}
      {!isSecond && t.byes?.length > 0 && (
        <p className="rule">
          {t.byes.includes(t.userId)
            ? `${nameIn(getNation(t.userId), year)} are seeded straight into the knockouts, with ${LIST.format(
                t.byes.filter((id) => id !== t.userId).map((id) => nameIn(getNation(id), year)),
              ) || 'no one else'}.`
            : `Seeded straight into the knockouts: ${LIST.format(t.byes.map((id) => nameIn(getNation(id), year)))}.`}
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

// ─── Screen ─────────────────────────────────────────────────────────────────

function historyLine(edition, winnerIds, userId, year) {
  if (edition.status === 'upcoming') return `You won it before a ball has been kicked. See you in ${year}.`;
  if (edition.status === 'cancelled') return 'The tournament that never was finally has a winner.';
  if (edition.status === 'unfinished' || edition.status === 'nowinner' || edition.status === 'disputed')
    return 'History never settled this one. You just did.';
  if (!winnerIds.length) return 'Your name goes on the trophy.';
  if (winnerIds.includes(userId)) return `Just like in ${year}: history repeats itself.`;
  const names = LIST.format(winnerIds.map((id) => nameIn(getNation(id), year)));
  return `In real life ${names} ${winnerIds.length > 1 ? 'shared' : 'won'} it. You rewrote history.`;
}

function NextMatch({ t, me, myName, year, comp, edition, onPlay, onBye }) {
  const current = userMatch(t);
  if (!current) return null;
  const stage = stageLabel(t);
  const opponent = current.opponent ? getNation(current.opponent) : null;
  let standing = null;
  if (t.phase === 'groups' && t.day > 0) {
    const row = groupTable(t.groups[current.group]).find((r) => r.id === t.userId);
    const where =
      t.format.type === 'league' ? 'in the table'
      : t.stage === 2 && t.format.second.league ? 'in the final round'
      : `in ${t.stage === 2 ? 'second-round ' : ''}Group ${t.groups[current.group].name}`;
    standing = `You are ${ordinal(row.pos)} ${where} with ${row.pts} ${row.pts === 1 ? 'point' : 'points'}.`;
  }

  if (current.rest || current.bye) {
    return (
      <section className="next-match frame" aria-label="Your next match">
        <p className="next-match__stage">{stage}</p>
        <p className="next-match__bye">
          {current.rest ? 'Rest day: the other teams play this matchday without you.' : 'You have a bye. Straight through to the next round.'}
        </p>
        {standing && <p className="next-match__standing">{standing}</p>}
        <Button variant="primary" size="xl" onClick={onBye} sound="select">
          {current.rest ? 'Play the matchday' : 'Continue'}
        </Button>
      </section>
    );
  }

  return (
    <section className="next-match frame" aria-label="Your next match">
      <p className="next-match__stage">{stage}</p>
      <div className="versus">
        <div className="versus__team">
          <Flag id={me.id} size="xl" />
          <span className="versus__name">{myName}</span>
          <Stars rating={me.rating} />
        </div>
        <span className="versus__v" aria-hidden="true">
          v
        </span>
        <div className="versus__team">
          <Flag id={opponent.id} size="xl" />
          <span className="versus__name">{nameIn(opponent, year)}</span>
          <Stars rating={opponent.rating} />
        </div>
      </div>
      {standing && <p className="next-match__standing">{standing}</p>}
      <Button
        variant="primary"
        size="xl"
        sound="select"
        onClick={() =>
          onPlay({
            userId: me.id,
            cpuId: opponent.id,
            year,
            stage: stageLabel(t, { short: true }),
            comp,
            edition,
            backLabel: t.phase === 'groups' ? (t.format.type === 'league' ? 'Back to the table' : 'Back to the groups') : 'Back to the bracket',
          })
        }
      >
        Take the shootout
      </Button>
    </section>
  );
}

export default function Bracket({ onPlay, onBye, onHome, onSetup, onRetry, onCabinet }) {
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
  const fateLine = fate ? fateText(fate, { league: tier ? t.format.league : 'A', name: myName, edition }) : '';
  const everyoneUp = tier && Object.values(t.format.fates).every((x) => x === 'promoted');
  const preview = t.phase === 'groups' ? knockoutPreview(t) : null;
  const exit = t.status === 'out' ? exitRound(t) : null;
  // With a second group stage the user may have gone out in the first one (t.firstGroups).
  const inStage = locate(t.groups, t.userId);
  const spot = inStage ?? locate(t.firstGroups, t.userId);
  const myRow = spot?.row ?? null;
  const groupName = spot?.group.name ?? '';
  const finalRound = t.stage === 2 && t.format.second?.league;
  const outTitle = tier
    ? `${ordinal(myRow.pos)} in Group ${groupName}`
    : league
      ? `${myName} finished ${ordinal(myRow.pos)}`
      : finalRound && inStage
        ? `${myName} finished ${ordinal(myRow.pos)} in the final round`
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
          {league ? 'League table' : tier ? `League ${t.format.league}` : t.stage === 2 ? (finalRound ? 'Final round' : 'Second round') : 'Group stage'}
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
      <header className="setup__head">
        <IconButton label="Back to menu" onClick={onHome}>
          <BackIcon />
        </IconButton>
        <div>
          <p className="eyebrow-line">
            <Flag id={me.id} size="sm" /> {myName}
          </p>
          <h1 className="screen-title">
            {comp.short} {edition.label}
          </h1>
          <p className="muted format-line">{formatLabel(t.format)}</p>
        </div>
      </header>

      {t.replaced && t.status === 'playing' && t.day === 0 && t.round === 0 && (
        <p className="notice">You take the place of {nameIn(getNation(t.replaced), year)} from the real line-up.</p>
      )}

      {t.byes?.includes(t.userId) && t.status === 'playing' && t.round === 0 && (
        <p className="notice">
          {myName} are seeded straight into the {seededRound(t.rounds[0].length)}: the group stage was played without them, and its results are below
          the bracket.
        </p>
      )}

      {t.status === 'playing' && (
        <NextMatch t={t} me={me} myName={myName} year={year} comp={comp} edition={edition} onPlay={onPlay} onBye={onBye} />
      )}

      {t.status === 'promoted' && (
        <section className="finale finale--win frame" aria-label={everyoneUp ? 'Group winners' : 'Promoted'}>
          <div>
            <h2 className="finale__title">{everyoneUp ? 'Group winners!' : 'Promoted!'}</h2>
            <p className="finale__text">
              {myName} {myRow.pos === 1 ? 'win' : `finish ${ordinal(myRow.pos)} in`} Group {groupName} of the {comp.short} {edition.label}.{' '}
              {everyoneUp
                ? 'They move up to League C with the rest of League D, as group winners.'
                : fateText(fate, { league: t.format.league, name: 'They', edition })}
            </p>
            <div className="panel__row panel__row--wrap">
              <Button variant="primary" onClick={onSetup}>
                Play another tournament
              </Button>
              <Button variant="secondary" onClick={onRetry}>
                Play it again
              </Button>
            </div>
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
            <div className="panel__row panel__row--wrap">
              <Button variant="primary" onClick={onSetup}>
                Play another tournament
              </Button>
              <Button variant="secondary" onClick={onCabinet}>
                Trophy cabinet
              </Button>
            </div>
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
            <div className="panel__row panel__row--wrap">
              <Button variant="primary" onClick={onRetry}>
                Try again
              </Button>
              <Button variant="secondary" onClick={onSetup}>
                Pick another tournament
              </Button>
            </div>
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
