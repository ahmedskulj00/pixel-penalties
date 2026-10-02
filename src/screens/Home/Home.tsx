import type { NationId } from '@/types';
import type { Navigate } from '@/app/routes';
import { Flag } from '@/components/Flag';
import { BallIcon, HelpIcon, PlayersIcon } from '@/components/Icon';
import { Scene } from '@/components/Scene';
import { TrophyIcon } from '@/components/TrophyIcon';
import { COMPETITIONS, TOTAL_EDITIONS, getCompetition, getEdition, knownTrophies } from '@/data/competitions';
import { NATIONS, getNation, nameIn } from '@/data/nations';
import { stageLabel, userMatch } from '@/engine/tournament';
import { keeperShirt, playerLook, playerPalette } from '@/pixel/palettes';
import { useCabinet, useTournament } from '@/state';
import { MenuItem } from './MenuItem';
import './Home.css';

// Famous shootouts: EURO 1976, World Cups 1994, 2002, 2010 and 2022, Copa 2015, AFCON 1992 and 2021.
const HERO_PAIRS: readonly (readonly [NationId, NationId])[] = [
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

export interface HomeProps {
  go: Navigate;
  openHowTo: () => void;
}

export function Home({ go, openHowTo }: HomeProps) {
  const saved = useTournament();
  const cabinet = knownTrophies(useCabinet());
  const day = Math.floor(Date.now() / 86_400_000);
  const [kickerId, keeperId] = saved ? [saved.userId, saved.userId === 'ITA' ? 'ESP' : 'ITA'] : HERO_PAIRS[day % HERO_PAIRS.length];
  const kicker = getNation(kickerId);
  const keeperNation = getNation(keeperId);

  let resume: { title: string; detail: string } | null = null;
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
          Every national team, every international tournament from {FIRST_YEAR} to {LAST_YEAR}. Settle them all from the penalty spot, one calm decision at a
          time.
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
          <MenuItem primary icon={<Flag id={saved!.userId} size="md" />} title={resume.title} detail={resume.detail} onClick={() => go({ name: 'bracket' })} />
        )}
        <MenuItem
          primary={!resume}
          icon={<TrophyIcon kind="silver" scale={2} />}
          title="Tournament"
          detail="Choose a competition, a year and your nation"
          onClick={() => go({ name: 'setup' })}
        />
        <MenuItem icon={<BallIcon />} title="Quick shootout" detail="Any two nations, straight to the spot" onClick={() => go({ name: 'quick' })} />
        <MenuItem
          icon={<PlayersIcon />}
          title="Two players"
          detail="One device: strike, then pass it to the keeper"
          onClick={() => go({ name: 'quick', players: 2 })}
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
