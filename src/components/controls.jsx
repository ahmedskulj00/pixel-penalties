import { useEffect, useImperativeHandle, useRef } from 'react';
import { ZONES, TECHNIQUE, DIFFICULTY, sweetSpot, composure, gradeStrike, COMPOSURE_BONUS, marks, tally } from '../engine/shootout.js';
import { Flag, KickMark } from './pixel.jsx';
import { Button, BallIcon } from './ui.jsx';

function RiskPips({ level }) {
  return (
    <span className="pips" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`pips__pip${i <= level ? ' is-on' : ''}`} />
      ))}
    </span>
  );
}

/** Step 1 of a spot kick: choose one of six zones. */
export function AimPad({ onAim, cursor, assist, habit }) {
  return (
    <div className="aimpad" role="group" aria-label="Choose where to shoot">
      {ZONES.map((z) => {
        const t = TECHNIQUE[z.kind];
        const habitual = habit === z.col;
        return (
          <button
            key={z.id}
            type="button"
            className={`aimpad__zone${cursor === z.id ? ' is-cursor' : ''}${habitual ? ' is-habit' : ''}`}
            onClick={() => onAim(z.id)}
            aria-label={`${z.name}. ${t.hint}.${habitual ? ' The keeper has seen you go this way.' : ''}`}
          >
            <span className="aimpad__label">{z.kind === 'high' ? 'Top corner' : t.label}</span>
            {assist && <RiskPips level={t.risk} />}
            <kbd className="aimpad__key">{z.keys[0].toUpperCase()}</kbd>
          </button>
        );
      })}
    </div>
  );
}

/** Where the marker is and how wide the green zone has grown, `elapsed` ms into the sweep. */
function sweep(elapsed, period, green) {
  const calm = composure(elapsed);
  return { pos: 1 - Math.abs(((elapsed / period) % 1) * 2 - 1), green: green * (1 + COMPOSURE_BONUS * calm), calm };
}

/** An event's time on the performance.now() clock (now, for synthetic events or old clocks). */
function eventTime(e) {
  const now = performance.now();
  const t = e?.timeStamp;
  return typeof t === 'number' && t > 0 && t <= now + 1 ? t : now;
}

/** After acting on a press, drop the click that follows it, so it can't land on whatever replaced the button. */
function swallowNextClick() {
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  window.addEventListener('click', stop, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 700);
}

/**
 * Step 2: timing. A marker sweeps the bar; the green sweet spot widens while you stay
 * composed (up to COMPOSURE_BONUS after COMPOSURE_MS). The rAF loop writes styles directly,
 * so the meter never re-renders React at 60 fps. A strike is graded at the moment of the
 * press (the finger touching down, not lifting), from the exact event time rather than the
 * last painted frame.
 */
export function StrikeMeter({ ref, zone, difficulty, rating, calm, onStrike, onCancel }) {
  const barRef = useRef(null);
  const trackRef = useRef(null);
  const calmRef = useRef(null);
  const startedAt = useRef(0);
  const pressedAt = useRef(-Infinity);
  const { green, yellow } = sweetSpot(zone, { difficulty, rating });
  const period = (DIFFICULTY[difficulty] ?? DIFFICULTY.normal).period * (calm ? 1.35 : 1);

  useEffect(() => {
    const bar = barRef.current;
    const track = trackRef.current;
    const calmBar = calmRef.current;
    let raf = 0;
    let lastCalm = -1;
    const t0 = performance.now();
    startedAt.current = t0;
    bar.style.setProperty('--y', `${yellow * 100}%`);
    const frame = (now) => {
      const { pos, green: g, calm: c } = sweep(now - t0, period, green);
      track.style.transform = `translateX(${pos * 100}%)`;
      if (c !== lastCalm) {
        lastCalm = c;
        bar.style.setProperty('--g', `${g * 100}%`);
        calmBar.style.transform = `scaleX(${c})`;
        bar.classList.toggle('is-composed', c >= 1);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [green, yellow, period]);

  const strikeAt = (time) => {
    const { pos, green: g } = sweep(Math.max(0, time - startedAt.current), period, green);
    onStrike(gradeStrike(pos, g, yellow));
  };

  // Touch, pen or mouse: strike as the press lands.
  const onPress = (e) => {
    if (e.button !== 0) return;
    pressedAt.current = performance.now();
    swallowNextClick();
    strikeAt(eventTime(e));
  };

  // Keyboard and assistive-technology activation arrives as a click with no press before it.
  const onActivate = (e) => {
    if (performance.now() - pressedAt.current > 700) strikeAt(eventTime(e));
  };

  // Lets the match screen trigger the same strike from its keyboard shortcut.
  useImperativeHandle(ref, () => ({ strike: (e) => strikeAt(eventTime(e)) }));

  return (
    <div className="meter">
      <div className="meter__composure" aria-hidden="true">
        <span>Composure</span>
        <span className="meter__calm">
          <span ref={calmRef} className="meter__calm-fill" />
        </span>
      </div>
      <div ref={barRef} className="meter__bar" aria-hidden="true">
        <div ref={trackRef} className="meter__track">
          <span className="meter__marker" />
        </div>
      </div>
      <div className="meter__actions">
        <Button variant="primary" size="xl" kbd="Space" onPointerDown={onPress} onClick={onActivate} sound={null} className="meter__strike">
          Strike
        </Button>
        <Button variant="ghost" kbd="Esc" onClick={onCancel} sound="back">
          Change spot
        </Button>
      </div>
      <p className="sr-only">Press Strike when the moving marker is inside the green zone.</p>
    </div>
  );
}

/** Keeper's choice when the computer shoots. */
export function DivePad({ onDive }) {
  return (
    <div className="divepad" role="group" aria-label="Choose which way to dive">
      <Button variant="secondary" size="lg" kbd="A" onClick={() => onDive(0)} sound={null}>
        ◀ Dive left
      </Button>
      <Button variant="secondary" size="lg" kbd="S" onClick={() => onDive(1)} sound={null}>
        Stay big
      </Button>
      <Button variant="secondary" size="lg" kbd="D" onClick={() => onDive(2)} sound={null}>
        Dive right ▶
      </Button>
    </div>
  );
}

/** Scouting report on the next computer kicker: a heat map of their favourite spot. */
export function ScoutCard({ number, profile, assist }) {
  if (!assist) {
    return <p className="scout scout--off">No scouting report. Trust your gut.</p>;
  }
  return (
    <div className="scout">
      <div className="scout__goal" aria-hidden="true">
        {ZONES.map((z) => (
          <span key={z.id} className={`scout__cell${z.id === profile.fav ? ' is-fav' : ''}`} />
        ))}
      </div>
      <p className="scout__text">
        <strong>No. {number}</strong> usually goes <strong>{ZONES[profile.fav].name.toLowerCase()}</strong>. Stay
        calm: favourites are not certainties.
      </p>
    </div>
  );
}

function Side({ nation, name, so, side, active, align }) {
  const t = tally(so)[side];
  return (
    <div className={`board-side board-side--${align}${active ? ' is-active' : ''}`}>
      <div className="board-side__team">
        <Flag id={nation.id} size="md" />
        {active && (
          <span className="board-side__turn" title="Taking this kick">
            <BallIcon />
          </span>
        )}
        <span className="board-side__name">
          <span className="board-side__full">{name}</span>
          <span className="board-side__code">{nation.id}</span>
        </span>
      </div>
      <ol className="board-side__marks" aria-label={`${name}: ${t.scored} of ${t.taken} scored`}>
        {marks(so, side).map((m, i) => (
          <li key={i}>
            <KickMark value={m} />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Scoreboard({ user, cpu, userName, cpuName, so, taker, stage }) {
  const t = tally(so);
  return (
    <section className="scoreboard frame" aria-label="Shootout score">
      <Side nation={user} name={userName} so={so} side="user" active={taker === 'user'} align="start" />
      <div className="scoreboard__mid">
        {stage && <span className="scoreboard__stage">{stage}</span>}
        <span className="scoreboard__score" aria-live="off">
          {t.user.scored}
          <span className="scoreboard__dash">-</span>
          {t.cpu.scored}
        </span>
      </div>
      <Side nation={cpu} name={cpuName} so={so} side="cpu" active={taker === 'cpu'} align="end" />
    </section>
  );
}
