import { useState } from 'react';
import { NATIONS, GROUP_LABELS, CURRENT_YEAR, fifaMember, getNation } from '../data/nations.js';
import { Flag } from '../components/pixel.jsx';
import { Button, BackIcon, IconButton } from '../components/ui.jsx';
import { NationPicker } from '../components/NationPicker.jsx';
import { newSeed, createRng } from '../engine/rng.js';
import { play } from '../audio/sfx.js';

const SECTIONS = Object.entries(GROUP_LABELS).map(([group, title]) => ({
  title,
  ids: NATIONS.filter((n) => n.group === group).map((n) => n.id),
}));

function Slot({ label, id, active, onClick }) {
  const n = id ? getNation(id) : null;
  return (
    <button type="button" className={`slot${active ? ' is-active' : ''}`} aria-pressed={active} onClick={onClick}>
      <span className="slot__label">{label}</span>
      {n ? (
        <span className="slot__pick">
          <Flag id={n.id} size="lg" />
          <span className="slot__name">{n.name}</span>
        </span>
      ) : (
        <span className="slot__empty">Choose below</span>
      )}
    </button>
  );
}

export default function QuickSetup({ initial, onStart, onHome }) {
  const [userId, setUserId] = useState(initial?.userId ?? null);
  const [cpuId, setCpuId] = useState(initial?.cpuId ?? null);
  const [picking, setPicking] = useState(initial?.userId ? 'cpu' : 'user');

  const choose = (id) => {
    if (picking === 'user') {
      setUserId(id);
      if (cpuId === id) setCpuId(null);
      setPicking('cpu');
    } else {
      if (id === userId) return;
      setCpuId(id);
    }
  };

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
      <header className="setup__head">
        <IconButton label="Back to menu" onClick={onHome}>
          <BackIcon />
        </IconButton>
        <div>
          <h1 className="screen-title">Quick shootout</h1>
          <p className="muted">Any nation that ever played, against any other.</p>
        </div>
      </header>

      <div className="slots">
        <Slot label="You" id={userId} active={picking === 'user'} onClick={() => setPicking('user')} />
        <span className="slots__vs" aria-hidden="true">
          v
        </span>
        <Slot label="Opponent" id={cpuId} active={picking === 'cpu'} onClick={() => setPicking('cpu')} />
      </div>

      <div className="panel__row panel__row--wrap">
        <Button variant="secondary" onClick={randomOpponent} disabled={!userId} sound={null}>
          Random opponent
        </Button>
        <Button variant="ghost" onClick={surprise} sound={null}>
          Surprise me with both
        </Button>
      </div>

      <h2 className="section-title section-title--big">{picking === 'user' ? 'Who do you play for?' : 'Who are you up against?'}</h2>
      <NationPicker
        sections={SECTIONS.map((s) => ({ ...s, ids: picking === 'cpu' ? s.ids.filter((id) => id !== userId) : s.ids }))}
        selected={picking === 'user' ? userId : cpuId}
        onSelect={choose}
      />

      <div className="start-bar">
        <div className="start-bar__inner frame">
          <span className="start-bar__pick">
            {userId ? <Flag id={userId} size="md" /> : null}
            <span className="muted">{userId && cpuId ? `${getNation(userId).name} v ${getNation(cpuId).name}` : 'Pick two nations'}</span>
            {cpuId ? <Flag id={cpuId} size="md" /> : null}
          </span>
          <Button variant="primary" size="lg" disabled={!userId || !cpuId} sound="select" onClick={() => onStart({ userId, cpuId })}>
            To the spot
          </Button>
        </div>
      </div>
    </div>
  );
}
