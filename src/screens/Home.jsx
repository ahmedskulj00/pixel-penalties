import { COMPETITIONS, TOTAL_EDITIONS, getCompetition, getEdition, knownTrophies } from '../data/competitions.js';
import { NATIONS, getNation, nameIn } from '../data/nations.js';
import { Scene } from '../components/Scene.jsx';
import { Flag, TrophyIcon } from '../components/pixel.jsx';
import { BallIcon, HelpIcon } from '../components/ui.jsx';
import { playerPalette, playerLook, keeperShirt } from '../pixel/colors.js';
import { useCabinet, useTournament } from '../state/stores.js';
import { stageLabel, userMatch } from '../engine/tournament.js';
import { play } from '../audio/sfx.js';

// Famous shootouts: EURO 1976, World Cups 1994, 2002, 2010 and 2022, Copa 2015, AFCON 1992 and 2021.
const HERO_PAIRS = [
  ['TCH', 'FRG'],
  ['ARG', 'FRA'],
  ['BRA', 'ITA'],
  ['MAR', 'ESP'],
  ['URU', 'GHA'],
  ['CHI', 'ARG'],
  ['CIV', 'GHA'],
  ['KOR', 'ESP'],
  ['SEN', 'EGY'],
  ['CRO', 'BRA'],
  ['ENG', 'GER'],
  ['ITA', 'ENG'],
];

const YEARS = COMPETITIONS.flatMap((c) => c.editions.map((e) => e.year));
const FIRST_YEAR = Math.min(...YEARS);
const LAST_YEAR = Math.max(...YEARS);

function MenuItem({ icon, title, detail, onClick, primary }) {
  return (
    <button
      type="button"
      className={`menu-item${primary ? ' menu-item--primary' : ''}`}
      onClick={() => {
        play('select');
        onClick();
      }}
    >
      <span className="menu-item__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="menu-item__text">
        <span className="menu-item__title">{title}</span>
        {detail && <span className="menu-item__detail">{detail}</span>}
      </span>
    </button>
  );
}

export default function Home({ go, openHowTo }) {
  const saved = useTournament();
  const cabinet = knownTrophies(useCabinet());
  const day = Math.floor(Date.now() / 86_400_000);
  const [kickerId, keeperId] = saved ? [saved.userId, saved.userId === 'ITA' ? 'ESP' : 'ITA'] : HERO_PAIRS[day % HERO_PAIRS.length];
  const kicker = getNation(kickerId);
  const keeperNation = getNation(keeperId);

  let resume = null;
  if (saved?.status === 'playing') {
    const comp = getCompetition(saved.compId);
    const edition = getEdition(comp, saved.editionId);
    const m = userMatch(saved);
    const nation = getNation(saved.userId);
    resume = {
      title: `Continue ${comp.short} ${edition.label}`,
      detail: `${nameIn(nation, edition.year)}. Next: ${stageLabel(saved)}${m?.opponent ? ` against ${nameIn(getNation(m.opponent), edition.year)}` : m?.rest ? ' (rest day)' : ''}`,
    };
  }

  return (
    <div className="home">
      <div className="home__intro">
        <h1 className="title">
          <span className="title__line">Pixel</span>
          <span className="title__line title__line--accent">Penalties</span>
        </h1>
        <p className="lede">
          Every national team, every international tournament from {FIRST_YEAR} to {LAST_YEAR}. Settle them all from twelve
          yards, one calm decision at a time.
        </p>
        <dl className="home__stats">
          <div>
            <dt>Nations</dt>
            <dd>{NATIONS.length}</dd>
          </div>
          <div>
            <dt>Competitions</dt>
            <dd>{COMPETITIONS.length}</dd>
          </div>
          <div>
            <dt>Editions</dt>
            <dd>{TOTAL_EDITIONS}</dd>
          </div>
        </dl>
      </div>

      <div className="home__stage">
        <Scene
          kicker={{
            pose: 'idle',
            palette: playerPalette(kicker.kit, playerLook(kicker.id, 10)),
            pattern: kicker.kit.pattern,
            number: 10,
          }}
          keeper={{
            pose: 'ready',
            palette: playerPalette(keeperNation.kit, playerLook(keeperNation.id, 1), { keeper: keeperShirt(keeperNation.kit, kicker.kit) }),
          }}
          board="PIXEL PENALTIES"
          leftKit={kicker.kit}
          rightKit={keeperNation.kit}
          label={`A ${kicker.name} player places the ball on the spot.`}
        />
      </div>

      <nav className="menu" aria-label="Main menu">
        {resume && (
          <MenuItem
            primary
            icon={<Flag id={saved.userId} size="md" />}
            title={resume.title}
            detail={resume.detail}
            onClick={() => go({ name: 'bracket' })}
          />
        )}
        <MenuItem
          primary={!resume}
          icon={<TrophyIcon kind="silver" scale={2} />}
          title="Tournament"
          detail="Choose a competition, a year and your nation"
          onClick={() => go({ name: 'setup' })}
        />
        <MenuItem
          icon={<BallIcon />}
          title="Quick shootout"
          detail="Any two nations, straight to the spot"
          onClick={() => go({ name: 'quick' })}
        />
        <MenuItem
          icon={<TrophyIcon kind="gold" scale={2} />}
          title="Trophy cabinet"
          detail={cabinet.length ? `${cabinet.length} ${cabinet.length === 1 ? 'trophy' : 'trophies'} won` : 'Empty for now'}
          onClick={() => go({ name: 'cabinet' })}
        />
        <MenuItem icon={<HelpIcon />} title="How to play" detail="Two decisions per kick, explained in a minute" onClick={openHowTo} />
      </nav>
    </div>
  );
}
