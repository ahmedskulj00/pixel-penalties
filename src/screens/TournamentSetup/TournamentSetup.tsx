import { useState } from 'react';
import type { Edition, NationId, NewTournament } from '@/types';
import { play } from '@/audio/sfx';
import { Button } from '@/components/Button';
import { Flag } from '@/components/Flag';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StartBar } from '@/components/StartBar';
import { eligibleIds, getCompetition, getEdition, leagueSpot } from '@/data/competitions';
import { getNation, nameIn } from '@/data/nations';
import { useTournament } from '@/state';
import { CompetitionStep } from './components/CompetitionStep';
import { EditionStep } from './components/EditionStep';
import { NationStep } from './components/NationStep';
import './TournamentSetup.css';

/** What the player chose: a new tournament needs only a seed on top. */
export type TournamentChoice = Omit<NewTournament, 'seed'>;

const STEPS: readonly string[] = ['Competition', 'Edition', 'Nation'];

/** The chosen nation's league and group, for editions split into leagues. */
const spotLabel = (edition: Edition, nationId: NationId, dream: boolean): string => {
  const spot = leagueSpot(edition, nationId);
  return !spot || (dream && spot.league !== 'A') ? 'Dream entry, League A' : `League ${spot.league}, Group ${spot.name}`;
};

export interface TournamentSetupProps {
  onStart: (choice: TournamentChoice) => void;
  onHome: () => void;
}

export function TournamentSetup({ onStart, onHome }: TournamentSetupProps) {
  const saved = useTournament();
  const [step, setStep] = useState(0);
  const [compId, setCompId] = useState<string | null>(null);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [nationId, setNationId] = useState<NationId | null>(null);
  const [dream, setDream] = useState(false);

  const comp = compId ? getCompetition(compId) : null;
  const edition = comp && editionId ? getEdition(comp, editionId) : null;
  const nation = nationId ? getNation(nationId) : null;

  const goStep = (n: number) => {
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
      <ScreenHeader backLabel={step === 0 ? 'Back to menu' : `Back to ${STEPS[step - 1].toLowerCase()}`} onBack={back}>
        <h1 className="screen-title">{['Pick a competition', comp ? `${comp.short}: pick a year` : '', 'Pick your nation'][step]}</h1>
        <ol className="stepper" aria-label="Setup progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
              <span className="stepper__n">{i + 1}</span> {s}
            </li>
          ))}
        </ol>
      </ScreenHeader>

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
          <StartBar>
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
              onClick={() => onStart({ compId: comp.id, editionId: edition.id, userId: nation!.id, dream })}
            >
              Start tournament
            </Button>
          </StartBar>
        </>
      )}
    </div>
  );
}
