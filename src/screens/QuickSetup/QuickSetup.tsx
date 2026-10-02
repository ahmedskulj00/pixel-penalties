import { useCallback, useState } from 'react';
import type { NationId, Side } from '@/types';
import type { Players, QuickPair } from '@/app/routes';
import { play } from '@/audio/sfx';
import { Button } from '@/components/Button';
import { ButtonRow } from '@/components/ButtonRow';
import { Flag } from '@/components/Flag';
import { NationPicker, type NationSection } from '@/components/NationPicker';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StartBar } from '@/components/StartBar';
import { CURRENT_YEAR, GROUP_LABELS, NATIONS, fifaMember, getNation } from '@/data/nations';
import { createRng, newSeed } from '@/utils/random';
import { Slot } from './Slot';
import './QuickSetup.css';

const SECTIONS: NationSection[] = Object.entries(GROUP_LABELS).map(([group, title]) => ({
  title,
  ids: NATIONS.filter((n) => n.group === group).map((n) => n.id),
}));

/** The screen's words for one player against the computer, and for two players on one device. */
const TEXT = {
  1: {
    title: 'Quick shootout',
    lede: 'Any nation that ever played, against any other.',
    first: 'You',
    second: 'Opponent',
    random: 'Random opponent',
    surprise: 'Surprise me with both',
    pickFirst: 'Who do you play for?',
    pickSecond: 'Who are you up against?',
  },
  2: {
    title: 'Two players',
    lede: 'One device, two players: the kicker strikes, then passes it to the keeper.',
    first: 'Player 1',
    second: 'Player 2',
    random: 'Random team for Player 2',
    surprise: 'Surprise us with both',
    pickFirst: 'Player 1, pick your nation',
    pickSecond: 'Player 2, pick your nation',
  },
} as const satisfies Record<Players, Record<string, string>>;

export interface QuickSetupProps {
  /** Against the computer (1), or two players on this device (2). */
  players?: Players;
  /** Nations to preselect, e.g. when coming back to change teams. */
  initial?: QuickPair;
  onStart: (pair: QuickPair) => void;
  onHome: () => void;
}

export function QuickSetup({ players = 1, initial, onStart, onHome }: QuickSetupProps) {
  const text = TEXT[players];
  const [userId, setUserId] = useState<NationId | null>(initial?.userId ?? null);
  const [cpuId, setCpuId] = useState<NationId | null>(initial?.cpuId ?? null);
  const [picking, setPicking] = useState<Side>(initial?.userId ? 'cpu' : 'user');

  // Stable between renders so the nation tiles can skip re-rendering.
  const choose = useCallback(
    (id: NationId) => {
      if (picking === 'user') {
        setUserId(id);
        if (cpuId === id) setCpuId(null);
        setPicking('cpu');
      } else {
        if (id === userId) return;
        setCpuId(id);
      }
    },
    [picking, userId, cpuId],
  );

  const randomOpponent = () => {
    const rng = createRng(newSeed());
    const pool = NATIONS.filter((n) => n.id !== userId && fifaMember(n, CURRENT_YEAR));
    setCpuId(rng.pick(pool).id);
    play('select');
  };

  const surprise = () => {
    const rng = createRng(newSeed());
    const [a, b] = rng.shuffle(NATIONS).slice(0, 2);
    setUserId(a.id);
    setCpuId(b.id);
    setPicking('cpu');
    play('select');
  };

  return (
    <div className="setup">
      <ScreenHeader backLabel="Back to menu" onBack={onHome}>
        <h1 className="screen-title">{text.title}</h1>
        <p className="muted">{text.lede}</p>
      </ScreenHeader>

      <div className="slots">
        <Slot label={text.first} id={userId} active={picking === 'user'} onClick={() => setPicking('user')} />
        <span className="slots__vs" aria-hidden="true">
          v
        </span>
        <Slot label={text.second} id={cpuId} active={picking === 'cpu'} onClick={() => setPicking('cpu')} />
      </div>

      <ButtonRow wrap>
        <Button variant="secondary" onClick={randomOpponent} disabled={!userId} sound={null}>
          {text.random}
        </Button>
        <Button variant="ghost" onClick={surprise} sound={null}>
          {text.surprise}
        </Button>
      </ButtonRow>

      <h2 className="section-title section-title--big">{picking === 'user' ? text.pickFirst : text.pickSecond}</h2>
      <NationPicker
        sections={SECTIONS.map((s) => ({ ...s, ids: picking === 'cpu' ? s.ids.filter((id) => id !== userId) : s.ids }))}
        selected={picking === 'user' ? userId : cpuId}
        onSelect={choose}
      />

      <StartBar>
        <span className="start-bar__pick">
          {userId ? <Flag id={userId} size="md" /> : null}
          <span className="muted">{userId && cpuId ? `${getNation(userId).name} v ${getNation(cpuId).name}` : 'Pick two nations'}</span>
          {cpuId ? <Flag id={cpuId} size="md" /> : null}
        </span>
        <Button variant="primary" size="lg" disabled={!userId || !cpuId} sound="select" onClick={() => onStart({ userId: userId!, cpuId: cpuId! })}>
          To the spot
        </Button>
      </StartBar>
    </div>
  );
}
