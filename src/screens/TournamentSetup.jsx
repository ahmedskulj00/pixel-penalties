import { useMemo, useState } from 'react';
import {
  GROUPS,
  COMPETITIONS,
  getCompetition,
  getEdition,
  editionStats,
  eligibleIds,
  championIds,
  formatOf,
  formatLabel,
  qualifyRule,
  leagueSpot,
  leagueFormat,
} from '../data/competitions.js';
import { NATIONS, NATION_BY_ID, GROUP_LABELS, getNation, nameIn, sectionIn } from '../data/nations.js';

const LIST = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
import { Flag, TrophyIcon } from '../components/pixel.jsx';
import { Badge, Button, BackIcon, IconButton, Switch } from '../components/ui.jsx';
import { NationPicker } from '../components/NationPicker.jsx';
import { useTournament } from '../state/stores.js';
import { play } from '../audio/sfx.js';

const STEPS = ['Competition', 'Edition', 'Nation'];

const STATUS = {
  upcoming: { tone: 'new', text: 'Upcoming' },
  cancelled: { tone: 'warn', text: 'Never played' },
  unfinished: { tone: 'warn', text: 'Unfinished' },
  nowinner: { tone: 'warn', text: 'No winner' },
  void: { tone: 'warn', text: 'Title void' },
  disputed: { tone: 'warn', text: 'Disputed' },
};

function Hosts({ edition, max = 3 }) {
  if (!edition.hosts.length) return <span className="hosts__note">{edition.hostNote ?? 'No fixed host'}</span>;
  const shown = edition.hosts.slice(0, max);
  const rest = edition.hosts.length - shown.length;
  return (
    <span className="hosts">
      {shown.map((id) => (
        <Flag key={id} id={id} size="sm" label />
      ))}
      {rest > 0 && <span className="hosts__more">+{rest}</span>}
    </span>
  );
}

function Champion({ edition }) {
  const ids = championIds(edition);
  const status = STATUS[edition.status];
  if (!ids.length) return status ? <Badge tone={status.tone}>{status.text}</Badge> : <span className="muted">Winner not recorded</span>;
  return (
    <span className="champ">
      <TrophyIcon kind="gold" scale={1} />
      {ids.map((id) => (
        <span key={id} className="champ__team">
          <Flag id={id} size="xs" />
          {nameIn(getNation(id), edition.year)}
        </span>
      ))}
      {edition.status === 'shared' && <Badge tone="neutral">Shared</Badge>}
    </span>
  );
}

function CompetitionStep({ onPick, saved }) {
  return (
    <div className="step-body">
      {saved?.status === 'playing' && (
        <p className="notice">Starting a new tournament replaces the one you have in progress.</p>
      )}
      {GROUPS.map((g) => (
        <section key={g.id} className="group" aria-labelledby={`g-${g.id}`}>
          <h2 id={`g-${g.id}`} className="section-title">
            {g.label}
          </h2>
          <div className="card-grid">
            {COMPETITIONS.filter((c) => c.group === g.id).map((c) => {
              const s = editionStats(c);
              return (
                <button key={c.id} type="button" className="card comp-card" onClick={() => onPick(c.id)}>
                  <TrophyIcon kind={c.trophy} scale={3} className="comp-card__trophy" />
                  <span className="comp-card__text">
                    <span className="card__title">{c.name}</span>
                    <span className="card__meta">{s.first === s.last ? s.first : `${s.first}–${s.last}`}</span>
                    <span className="card__blurb">{c.blurb}</span>
                    <span className="card__tags">
                      {s.played > 0 && <Badge tone="neutral">{s.played === 1 ? '1 edition' : `${s.played} editions`}</Badge>}
                      {s.upcoming > 0 && <Badge tone="new">{s.upcoming} upcoming</Badge>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function EditionStep({ comp, onPick }) {
  const editions = [...comp.editions].reverse();
  const byDecade = editions.length > 24;
  const groups = [];
  for (const e of editions) {
    const key = byDecade ? `${Math.floor(e.year / 10) * 10}s` : 'all';
    if (!groups.length || groups[groups.length - 1].key !== key) groups.push({ key, items: [] });
    groups[groups.length - 1].items.push(e);
  }
  return (
    <div className="step-body">
      <p className="lede lede--small">{comp.blurb}</p>
      {byDecade && (
        <nav className="decades" aria-label="Jump to decade">
          {groups.map((g) => (
            <button
              key={g.key}
              type="button"
              className="chip"
              onClick={() => document.getElementById(`dec-${comp.id}-${g.key}`)?.scrollIntoView({ block: 'start' })}
            >
              {g.key}
            </button>
          ))}
        </nav>
      )}
      {groups.map((g) => (
        <section key={g.key} id={`dec-${comp.id}-${g.key}`} className="group">
          {byDecade && <h2 className="section-title">{g.key}</h2>}
          <div className="card-grid card-grid--editions">
            {g.items.map((e) => (
              <button key={e.id} type="button" className={`card ed-card ed-card--${e.status}`} onClick={() => onPick(e.id)}>
                <span className="ed-card__year">{e.label}</span>
                {e.era && <span className="ed-card__era">{e.era}</span>}
                <span className="ed-card__format">{e.leagues ? 'Leagues A to D, then League A knockouts' : formatLabel(formatOf(comp, e))}</span>
                <Hosts edition={e} />
                <Champion edition={e} />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const spotLabel = (edition, nationId, dream) => {
  const spot = leagueSpot(edition, nationId);
  return !spot || (dream && spot.league !== 'A') ? 'Dream entry, League A' : `League ${spot.league}, Group ${spot.name}`;
};

/** Where the chosen nation plays in an edition split into leagues. */
function LeagueLine({ comp, edition, nationId, dream }) {
  const nation = nationId ? getNation(nationId) : null;
  if (!nation) return <p className="edition-summary__league">Every nation plays in its real league. Pick one to see its group.</p>;
  const name = nameIn(nation, edition.year);
  const spot = leagueSpot(edition, nationId);
  if (!spot || (dream && spot.league !== 'A')) {
    return <p className="edition-summary__league">Dream entry: {name} take a place in League A and play for the trophy.</p>;
  }
  const mates = spot.teams.filter((id) => id !== nationId).map((id) => nameIn(getNation(id), edition.year));
  const rule = spot.league === 'A' ? qualifyRule(formatOf(comp, edition)) : leagueFormat(edition, spot.league).rule;
  return (
    <p className="edition-summary__league">
      {name} play in League {spot.league}, Group {spot.name}, with {LIST.format(mates)}. {rule}
      {spot.league !== 'A' && ' Switch on dream mode to take a League A place instead.'}
    </p>
  );
}

/** Split nation ids into picker sections by confederation (as it was in `year`), keeping their order. */
function byConfederation(ids, prefix, year) {
  const buckets = new Map(Object.keys(GROUP_LABELS).map((g) => [g, []]));
  for (const id of ids) buckets.get(year == null ? NATION_BY_ID.get(id).group : sectionIn(NATION_BY_ID.get(id), year))?.push(id);
  const filled = [...buckets].filter(([, list]) => list.length);
  if (filled.length <= 1) return [{ title: prefix, ids }];
  return filled.map(([g, list]) => ({ title: `${prefix}: ${GROUP_LABELS[g]}`, ids: list }));
}

/** Picker sections for an edition: the real line-up, everyone else eligible, then dream entries. */
function nationSections(comp, edition, dream) {
  const field = (edition.field ?? []).filter((id) => NATION_BY_ID.has(id));
  const eligible = eligibleIds(comp, edition);
  const inField = new Set(field);
  const others = eligible.filter((id) => !inField.has(id));
  const taken = new Set(eligible);
  const rest = NATIONS.map((n) => n.id).filter((id) => !taken.has(id));
  const sections = [];
  if (edition.leagues) {
    const byLeague = [['A', edition.groups], ...Object.entries(edition.leagues)];
    for (const [league, groups] of byLeague) sections.push({ title: `League ${league}`, ids: groups.flat() });
  } else {
    if (field.length) sections.push({ title: edition.status === 'upcoming' ? 'Confirmed teams' : 'In the real line-up', ids: field });
    if (others.length) sections.push(...byConfederation(others, field.length ? `Also eligible in ${edition.year}` : `Eligible in ${edition.year}`, edition.year));
  }
  if (dream && rest.length) sections.push(...byConfederation(rest, 'Dream entries'));
  return { sections, eligible };
}

function NationStep({ comp, edition, nationId, setNationId, dream, setDream }) {
  // Cached per edition, so picking a nation only re-renders the two tiles that change.
  const { sections, eligible } = useMemo(() => nationSections(comp, edition, dream), [comp, edition, dream]);

  return (
    <div className="step-body">
      <div className="edition-summary frame">
        <div>
          <p className="edition-summary__name">
            {comp.short} {edition.label}
          </p>
          <p className="muted">
            {edition.hosts.length ? 'Hosted by ' + edition.hosts.map((id) => nameIn(getNation(id), edition.year)).join(', ') : edition.hostNote ?? 'No fixed host'}
          </p>
          <p className="edition-summary__format">
            {edition.leagues ? 'League A: ' : ''}
            {formatLabel(formatOf(comp, edition))}. {qualifyRule(formatOf(comp, edition)) ?? ''}
          </p>
          {edition.leagues && <LeagueLine comp={comp} edition={edition} nationId={nationId} dream={dream} />}
          {edition.note && <p className="edition-summary__note">{edition.note}</p>}
        </div>
        <Champion edition={edition} />
      </div>
      <Switch
        label="Dream mode"
        description="Enter any nation from any era, like the Soviet Union at the 2030 World Cup."
        checked={dream}
        onChange={(v) => {
          setDream(v);
          if (!v && nationId && !eligible.includes(nationId)) setNationId(null);
        }}
      />
      <NationPicker sections={sections} year={edition.year} selected={nationId} onSelect={setNationId} />
    </div>
  );
}

export default function TournamentSetup({ onStart, onHome }) {
  const saved = useTournament();
  const [step, setStep] = useState(0);
  const [compId, setCompId] = useState(null);
  const [editionId, setEditionId] = useState(null);
  const [nationId, setNationId] = useState(null);
  const [dream, setDream] = useState(false);

  const comp = compId ? getCompetition(compId) : null;
  const edition = comp && editionId ? getEdition(comp, editionId) : null;
  const nation = nationId ? getNation(nationId) : null;

  const goStep = (n) => {
    setStep(n);
    window.scrollTo?.({ top: 0 });
  };

  const back = () => {
    play('back');
    if (step === 0) onHome();
    else goStep(step - 1);
  };

  return (
    <div className="setup">
      <header className="setup__head">
        <IconButton label={step === 0 ? 'Back to menu' : `Back to ${STEPS[step - 1].toLowerCase()}`} onClick={back}>
          <BackIcon />
        </IconButton>
        <div>
          <h1 className="screen-title">{['Pick a competition', comp ? `${comp.short}: pick a year` : '', 'Pick your nation'][step]}</h1>
          <ol className="stepper" aria-label="Setup progress">
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
                <span className="stepper__n">{i + 1}</span> {s}
              </li>
            ))}
          </ol>
        </div>
      </header>

      {step === 0 && (
        <CompetitionStep
          saved={saved}
          onPick={(id) => {
            play('select');
            setCompId(id);
            setEditionId(null);
            goStep(1);
          }}
        />
      )}
      {step === 1 && comp && (
        <EditionStep
          comp={comp}
          onPick={(id) => {
            play('select');
            setEditionId(id);
            const e = getEdition(comp, id);
            if (nationId && !dream && !eligibleIds(comp, e).includes(nationId)) setNationId(null);
            goStep(2);
          }}
        />
      )}
      {step === 2 && comp && edition && (
        <>
          <NationStep comp={comp} edition={edition} nationId={nationId} setNationId={setNationId} dream={dream} setDream={setDream} />
          <div className="start-bar">
            <div className="start-bar__inner frame">
              {nation ? (
                <span className="start-bar__pick">
                  <Flag id={nation.id} size="md" />
                  <span className="start-bar__who">
                    {nameIn(nation, edition.year)}
                    {edition.leagues && <span className="start-bar__spot">{spotLabel(edition, nation.id, dream)}</span>}
                  </span>
                </span>
              ) : (
                <span className="muted">Choose a nation to start</span>
              )}
              <Button
                variant="primary"
                size="lg"
                disabled={!nation}
                sound="select"
                onClick={() => onStart({ compId: comp.id, editionId: edition.id, userId: nation.id, dream })}
              >
                Start tournament
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
