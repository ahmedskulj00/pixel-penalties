import { useEffect, useRef, useState } from 'react';
import Home from './screens/Home.jsx';
import TournamentSetup from './screens/TournamentSetup.jsx';
import QuickSetup from './screens/QuickSetup.jsx';
import Bracket from './screens/Bracket.jsx';
import Match from './screens/Match.jsx';
import { Cabinet, SettingsModal, HowToModal, PauseModal } from './screens/Cabinet.jsx';
import { IconButton, GearIcon, HelpIcon, PauseIcon, SoundOnIcon, SoundOffIcon, BallIcon } from './components/ui.jsx';
import { useKeydown, useReducedMotion } from './hooks/useKeydown.js';
import { useSettings, updateSettings, tournamentStore, addTrophy } from './state/stores.js';
import { createTournament, recordUserResult } from './engine/tournament.js';
import { newSeed } from './engine/rng.js';
import { configureAudio, configureHaptics, unlockAudio, play } from './audio/sfx.js';

const THIS_YEAR = 2026;

export default function App() {
  const settings = useSettings();
  const reduced = useReducedMotion();
  const [route, setRoute] = useState({ name: 'home' });
  const [modal, setModal] = useState(null);
  const [matchKey, setMatchKey] = useState(0);
  const mainRef = useRef(null);
  const navigated = useRef(false);

  // Document-level preferences: theme, font, motion.
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-pp-theme');
    else root.setAttribute('data-pp-theme', settings.theme);
    root.toggleAttribute('data-readable', settings.readable);
    root.toggleAttribute('data-reduced-motion', reduced);
  }, [settings.theme, settings.readable, reduced]);

  useEffect(() => {
    configureAudio({ sound: settings.sound, calmMode: settings.calm });
    configureHaptics(settings.haptics);
  }, [settings.sound, settings.calm, settings.haptics]);

  // After navigating, start at the top and move focus to the new screen.
  useEffect(() => {
    if (!navigated.current) return;
    window.scrollTo?.({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [route]);

  const go = (next) => {
    navigated.current = true;
    setModal(null);
    setRoute(next);
  };

  const toggleSound = () => {
    const on = !settings.sound;
    updateSettings({ sound: on });
    configureAudio({ sound: on, calmMode: settings.calm });
    if (on) {
      unlockAudio();
      play('select');
    }
  };

  useKeydown((e) => {
    if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      toggleSound();
    }
  });

  // ─── Tournament flow ───

  const startTournament = ({ compId, editionId, userId, dream }) => {
    tournamentStore.set(createTournament({ compId, editionId, userId, dream, seed: newSeed() }));
    go({ name: 'bracket' });
  };

  const retryTournament = () => {
    const t = tournamentStore.get();
    if (t) startTournament(t);
  };

  const playTournamentMatch = ({ userId, cpuId, year, stage, comp, edition, backLabel }) => {
    setMatchKey((k) => k + 1);
    go({
      name: 'match',
      mode: 'tournament',
      userId,
      cpuId,
      year,
      stage,
      backLabel,
      board: `${comp.short} ${edition.label} ${stage}`.toUpperCase(),
    });
    if (!settings.seenHowTo) setModal('howto');
  };

  const finishTournamentMatch = (result) => {
    const t = tournamentStore.get();
    if (t) {
      const next = recordUserResult(t, result);
      tournamentStore.set(next);
      if (next.status === 'champion') addTrophy({ compId: t.compId, editionId: t.editionId, nationId: t.userId });
    }
    go({ name: 'bracket' });
  };

  const takeBye = () => {
    const t = tournamentStore.get();
    if (t) tournamentStore.set(recordUserResult(t, { won: true, score: [0, 0] }));
  };

  const startQuick = ({ userId, cpuId }) => {
    setMatchKey((k) => k + 1);
    go({ name: 'match', mode: 'quick', userId, cpuId, year: THIS_YEAR, stage: 'Friendly', board: 'PIXEL PENALTIES' });
    if (!settings.seenHowTo) setModal('howto');
  };

  const closeHowTo = () => {
    if (!settings.seenHowTo) updateSettings({ seenHowTo: true });
    setModal(null);
  };

  const inMatch = route.name === 'match';
  let screen;
  switch (route.name) {
    case 'setup':
      screen = <TournamentSetup onStart={startTournament} onHome={() => go({ name: 'home' })} />;
      break;
    case 'quick':
      screen = <QuickSetup initial={route.initial} onStart={startQuick} onHome={() => go({ name: 'home' })} />;
      break;
    case 'bracket':
      screen = (
        <Bracket
          onPlay={playTournamentMatch}
          onBye={takeBye}
          onHome={() => go({ name: 'home' })}
          onSetup={() => go({ name: 'setup' })}
          onRetry={retryTournament}
          onCabinet={() => go({ name: 'cabinet' })}
        />
      );
      break;
    case 'match':
      screen = (
        <Match
          key={matchKey}
          userId={route.userId}
          cpuId={route.cpuId}
          year={route.year}
          context={{ mode: route.mode, stage: route.stage, board: route.board, backLabel: route.backLabel }}
          paused={modal !== null}
          onPause={() => setModal('pause')}
          onFinish={finishTournamentMatch}
          onRematch={() => setMatchKey((k) => k + 1)}
          onExit={() => go({ name: 'quick', initial: { userId: route.userId, cpuId: route.cpuId } })}
        />
      );
      break;
    case 'cabinet':
      screen = <Cabinet onHome={() => go({ name: 'home' })} onSetup={() => go({ name: 'setup' })} />;
      break;
    default:
      screen = <Home go={go} openHowTo={() => setModal('howto')} />;
  }

  return (
    <div className={`app app--${route.name}`} onPointerDownCapture={unlockAudio} onKeyDownCapture={unlockAudio}>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={() => (inMatch ? setModal('pause') : go({ name: 'home' }))}
          aria-label={inMatch ? 'Pause and show menu' : 'Pixel Penalties home'}
        >
          <BallIcon />
          <span className="brand__name">Pixel Penalties</span>
        </button>
        <div className="topbar__actions">
          {inMatch && (
            <IconButton label="Pause" onClick={() => setModal('pause')}>
              <PauseIcon />
            </IconButton>
          )}
          <IconButton label={settings.sound ? 'Mute sound (M)' : 'Turn sound on (M)'} onClick={toggleSound}>
            {settings.sound ? <SoundOnIcon /> : <SoundOffIcon />}
          </IconButton>
          <IconButton label="How to play" onClick={() => setModal('howto')}>
            <HelpIcon />
          </IconButton>
          <IconButton label="Settings" onClick={() => setModal('settings')}>
            <GearIcon />
          </IconButton>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className={`main main--${route.name}`}>
        {screen}
      </main>

      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'howto' && <HowToModal onClose={closeHowTo} />}
      {modal === 'pause' && (
        <PauseModal
          onResume={() => setModal(null)}
          onSettings={() => setModal('settings')}
          onHowTo={() => setModal('howto')}
          quitLabel={route.mode === 'tournament' ? 'Quit to the tournament' : 'Quit to the menu'}
          note={route.mode === 'tournament' ? 'Quitting abandons this shootout only. Your tournament stays saved, and you can take it again.' : null}
          onQuit={() => go(route.mode === 'tournament' ? { name: 'bracket' } : { name: 'home' })}
        />
      )}
    </div>
  );
}
