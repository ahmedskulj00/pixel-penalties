import { useState } from 'react';
import { COMPETITIONS, TOTAL_EDITIONS, getCompetition, getEdition, knownTrophies } from '../data/competitions.js';
import { NATION_BY_ID, getNation, nameIn } from '../data/nations.js';
import { Flag, TrophyIcon } from '../components/pixel.jsx';
import { BackIcon, Button, IconButton, Modal, Segmented, Switch } from '../components/ui.jsx';
import { useCabinet, useSettings, useStats, updateSettings, resetProgress } from '../state/stores.js';

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–');

export function Cabinet({ onHome, onSetup }) {
  const saved = useCabinet();
  const stats = useStats();
  // Trophies from competitions that have since been retired stay saved but are not shown.
  const cabinet = knownTrophies(saved).filter((t) => NATION_BY_ID.has(t.nationId));
  const byComp = COMPETITIONS.map((c) => ({ comp: c, items: cabinet.filter((t) => t.compId === c.id) })).filter((g) => g.items.length);
  const uniqueEditions = new Set(cabinet.map((t) => `${t.compId}/${t.editionId}`)).size;

  return (
    <div className="cabinet">
      <header className="setup__head">
        <IconButton label="Back to menu" onClick={onHome}>
          <BackIcon />
        </IconButton>
        <div>
          <h1 className="screen-title">Trophy cabinet</h1>
          <p className="muted">
            {uniqueEditions} of {TOTAL_EDITIONS} editions won
          </p>
        </div>
      </header>

      <div className="progress" aria-hidden="true">
        <span className="progress__fill" style={{ width: `${(uniqueEditions / TOTAL_EDITIONS) * 100}%` }} />
      </div>

      <dl className="stat-grid">
        <div className="stat frame">
          <dt>Shootouts won</dt>
          <dd>
            {stats.shootoutsWon}
            <small>/{stats.shootouts}</small>
          </dd>
        </div>
        <div className="stat frame">
          <dt>Penalties scored</dt>
          <dd>
            {stats.scored}
            <small>{pct(stats.scored, stats.taken)}</small>
          </dd>
        </div>
        <div className="stat frame">
          <dt>Penalties saved</dt>
          <dd>
            {stats.saved}
            <small>{pct(stats.saved, stats.faced)}</small>
          </dd>
        </div>
        <div className="stat frame">
          <dt>Best scoring run</dt>
          <dd>{stats.bestStreak}</dd>
        </div>
        <div className="stat frame">
          <dt>Panenkas scored</dt>
          <dd>{stats.panenkas}</dd>
        </div>
      </dl>

      {byComp.length === 0 ? (
        <div className="empty frame">
          <TrophyIcon kind="locked" scale={5} />
          <p>No trophies yet. Win any tournament and it lands on this shelf.</p>
          <Button variant="primary" onClick={onSetup}>
            Start a tournament
          </Button>
        </div>
      ) : (
        byComp.map(({ comp, items }) => (
          <section key={comp.id} className="shelf" aria-labelledby={`shelf-${comp.id}`}>
            <h2 id={`shelf-${comp.id}`} className="section-title">
              {comp.name}
            </h2>
            <ul className="shelf__row">
              {items.map((t) => {
                const edition = getEdition(getCompetition(t.compId), t.editionId);
                return (
                  <li key={`${t.editionId}-${t.nationId}`} className="shelf__item">
                    <TrophyIcon kind={comp.trophy} scale={3} />
                    <span className="shelf__year">{edition.label}</span>
                    <span className="shelf__team">
                      <Flag id={t.nationId} size="xs" />
                      {nameIn(getNation(t.nationId), edition.year)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function ResetProgress() {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  if (done) return <p className="setting__desc">Progress deleted. Fresh start.</p>;
  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Reset progress
      </Button>
    );
  }
  return (
    <div className="confirm" role="group" aria-label="Confirm reset">
      <p className="confirm__text">Delete your trophies, stats and the tournament in progress?</p>
      <div className="panel__row panel__row--wrap">
        <Button
          variant="danger"
          onClick={() => {
            resetProgress();
            setDone(true);
          }}
        >
          Yes, delete it all
        </Button>
        <Button variant="secondary" sound="back" onClick={() => setConfirming(false)}>
          Keep my progress
        </Button>
      </div>
    </div>
  );
}

export function SettingsModal({ onClose }) {
  const s = useSettings();
  return (
    <Modal title="Settings" onClose={onClose} size="lg">
      <div className="settings">
        <section className="settings__group">
          <h3 className="settings__title">Game</h3>
          <Segmented
            label="Difficulty"
            description="Changes the sweet spot, the meter speed and how fast keepers learn your habits."
            value={s.difficulty}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'normal', label: 'Normal' },
              { value: 'hard', label: 'Hard' },
            ]}
            onChange={(v) => updateSettings({ difficulty: v })}
          />
          <Segmented
            label="Shootout length"
            description="Kicks per side before sudden death. Three makes for short, sharp sessions."
            value={s.kicks}
            options={[
              { value: 3, label: '3 kicks' },
              { value: 5, label: '5 kicks' },
            ]}
            onChange={(v) => updateSettings({ kicks: v })}
          />
          <Segmented
            label="Animation speed"
            value={s.speed}
            options={[
              { value: 'relaxed', label: 'Relaxed' },
              { value: 'normal', label: 'Normal' },
              { value: 'turbo', label: 'Turbo' },
            ]}
            onChange={(v) => updateSettings({ speed: v })}
          />
          <Switch
            label="Auto-continue"
            description="Move on to the next kick by itself. Turn off to go at your own pace."
            checked={s.autoContinue}
            onChange={(v) => updateSettings({ autoContinue: v })}
          />
        </section>

        <section className="settings__group">
          <h3 className="settings__title">Focus and comfort</h3>
          <Switch
            label="Coaching"
            description="Risk pips on each spot, scouting reports and habit warnings."
            checked={s.assist}
            onChange={(v) => updateSettings({ assist: v })}
          />
          <Switch
            label="Focus mode"
            description="Dims the crowd and hides tips and commentary."
            checked={s.focus}
            onChange={(v) => updateSettings({ focus: v })}
          />
          <Switch
            label="Calm mode"
            description="Slower strike meter, softer sound, no screen shake."
            checked={s.calm}
            onChange={(v) => updateSettings({ calm: v })}
          />
          <Segmented
            label="Motion"
            value={s.motion}
            options={[
              { value: 'system', label: 'Follow system' },
              { value: 'reduced', label: 'Reduced' },
              { value: 'full', label: 'Full' },
            ]}
            onChange={(v) => updateSettings({ motion: v })}
          />
          <Switch
            label="Readable font"
            description="Swap the pixel font for Atkinson Hyperlegible."
            checked={s.readable}
            onChange={(v) => updateSettings({ readable: v })}
          />
          <Segmented
            label="Theme"
            value={s.theme}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'day', label: 'Day match' },
              { value: 'night', label: 'Night match' },
            ]}
            onChange={(v) => updateSettings({ theme: v })}
          />
        </section>

        <section className="settings__group">
          <h3 className="settings__title">Feedback</h3>
          <Switch label="Sound" description="Press M at any time to mute." checked={s.sound} onChange={(v) => updateSettings({ sound: v })} />
          <Switch label="Vibration" description="On phones that support it." checked={s.haptics} onChange={(v) => updateSettings({ haptics: v })} />
        </section>

        <section className="settings__group">
          <h3 className="settings__title">Saved data</h3>
          <p className="setting__desc">Progress is stored in this browser only.</p>
          <ResetProgress />
        </section>
      </div>
    </Modal>
  );
}

export function HowToModal({ onClose }) {
  return (
    <Modal title="How to play" onClose={onClose} size="lg">
      <div className="howto">
        <ol className="howto__steps">
          <li className="howto__step frame">
            <span className="howto__n">1</span>
            <div>
              <h3>Pick your spot</h3>
              <p>
                Six targets. Corners and the chip are hard to save but easy to miss; the middle is safe unless the
                keeper stays up. The pips show how narrow the sweet spot is.
              </p>
            </div>
          </li>
          <li className="howto__step frame">
            <span className="howto__n">2</span>
            <div>
              <h3>Strike in the green</h3>
              <p>
                A marker sweeps the bar. Hit Strike while it is in the green. Take one calm breath first: the green zone
                grows while you stay composed.
              </p>
            </div>
          </li>
          <li className="howto__step frame">
            <span className="howto__n">3</span>
            <div>
              <h3>In goal, read the scout</h3>
              <p>
                When they shoot, the scouting card shows the kicker&apos;s favourite spot. Dive left, dive right, or stay
                big in the middle.
              </p>
            </div>
          </li>
        </ol>
        <p>
          Real penalty takers pick their spot early and commit. Changing your mind at the last second is where misses come
          from, so the game gives you one decision at a time and no clock on the first one.
        </p>
        <h3 className="settings__title">Keyboard</h3>
        <table className="keys">
          <tbody>
            <tr>
              <th scope="row">Aim</th>
              <td>
                <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> top row, <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> bottom row, or arrows
                and <kbd>Space</kbd>
              </td>
            </tr>
            <tr>
              <th scope="row">Strike</th>
              <td>
                <kbd>Space</kbd>, or <kbd>Esc</kbd> to change spot
              </td>
            </tr>
            <tr>
              <th scope="row">Dive</th>
              <td>
                <kbd>A</kbd> left, <kbd>S</kbd> stay, <kbd>D</kbd> right (arrows work too)
              </td>
            </tr>
            <tr>
              <th scope="row">Other</th>
              <td>
                <kbd>P</kbd> pause, <kbd>M</kbd> mute
              </td>
            </tr>
          </tbody>
        </table>
        <p className="muted">
          Want it gentler? Settings has Focus mode, Calm mode, three-kick shootouts, Easy difficulty and a readable font.
        </p>
      </div>
    </Modal>
  );
}

export function PauseModal({ onResume, onSettings, onHowTo, onQuit, quitLabel, note }) {
  return (
    <Modal title="Paused" onClose={onResume} size="sm">
      <div className="pause">
        <Button variant="primary" size="lg" onClick={onResume} autoFocus>
          Resume
        </Button>
        <Button variant="secondary" onClick={onHowTo}>
          How to play
        </Button>
        <Button variant="secondary" onClick={onSettings}>
          Settings
        </Button>
        <Button variant="ghost" onClick={onQuit}>
          {quitLabel}
        </Button>
        {note && <p className="muted">{note}</p>}
      </div>
    </Modal>
  );
}
