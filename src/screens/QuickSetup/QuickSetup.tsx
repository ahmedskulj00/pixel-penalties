import { useCallback, useState } from 'react';
import type { NationId, Side } from '@/types';
import type { QuickPair } from '@/app/routes';
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

export interface QuickSetupProps {
  /** Nations to preselect, e.g. when coming back to change teams. */
  initial?: QuickPair;
  onStart: (pair: QuickPair) => void;
  onHome: () => void;
}

export function QuickSetup({ initial, onStart, onHome }: QuickSetupProps) {
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
        <h1 className="screen-title">Quick shootout</h1>
        <p className="muted">Any nation that ever played, against any other.</p>
      </ScreenHeader>

      <div className="slots">
        <Slot label="You" id={userId} active={picking === 'user'} onClick={() => setPicking('user')} />
        <span className="slots__vs" aria-hidden="true">
          v
        </span>
        <Slot label="Opponent" id={cpuId} active={picking === 'cpu'} onClick={() => setPicking('cpu')} />
      </div>

      <ButtonRow wrap>
        <Button variant="secondary" onClick={randomOpponent} disabled={!userId} sound={null}>
          Random opponent
        </Button>
        <Button variant="ghost" onClick={surprise} sound={null}>
          Surprise me with both
        </Button>
      </ButtonRow>

      <h2 className="section-title section-title--big">{picking === 'user' ? 'Who do you play for?' : 'Who are you up against?'}</h2>
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
