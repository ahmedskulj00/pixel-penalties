import { useEffect, useEffectEvent, useReducer, useRef, useState } from 'react';
import type { KickPlan, NationId, Quality, Side, UserResult } from '@/types';
import type { MatchContext } from '@/app/routes';
import { buzz } from '@/audio/haptics';
import { play } from '@/audio/sfx';
import { AimPad } from '@/components/AimPad';
import { Button } from '@/components/Button';
import { ButtonRow } from '@/components/ButtonRow';
import { DivePad } from '@/components/DivePad';
import { GoalTargets } from '@/components/GoalTargets';
import { Scene, playKick, resetScene, type ActorState, type SceneRefs } from '@/components/Scene';
import { Scoreboard } from '@/components/Scoreboard';
import { ScoutCard } from '@/components/ScoutCard';
import { StrikeMeter, type StrikeMeterHandle } from '@/components/StrikeMeter';
import { getNation, nameIn } from '@/data/nations';
import { cpuKeeperDive, cpuShot, habitColumn } from '@/engine/cpu';
import { OUTCOME_TEXT, TECHNIQUE, ZONES, resolveShot } from '@/engine/kick';
import { applyKick, isSuddenDeath, takerOf, tally } from '@/engine/shootout';
import { useKeydown, useTiming } from '@/hooks';
import { keeperShirt, playerLook, playerPalette } from '@/pixel/palettes';
import type { Pose } from '@/pixel/sprites';
import { recordStats, useSettings } from '@/state';
import { clamp } from '@/utils/math';
import { createRng, newSeed } from '@/utils/random';
import { CPU_NUMBERS, USER_NUMBERS, init, reducer } from './matchState';
import { stakes } from './stakes';
import './Match.css';

export interface MatchProps {
  userId: NationId;
  cpuId: NationId;
  year: number;
  context: MatchContext;
  /** A pop-up is open: no auto-continue and no shortcuts. */
  paused: boolean;
  onPause: () => void;
  /** A tournament shootout is over. */
  onFinish: (result: Required<UserResult>) => void;
  onRematch: () => void;
  /** Leave a finished quick match to pick other teams. */
  onExit: () => void;
}

interface Poses {
  kicker: Pose;
  keeper: Pose;
  flip: boolean;
}

const RESULT_TITLE: Record<KickPlan['outcome']['result'], string> = { goal: 'Goal!', save: 'Saved!', miss: 'Missed!' };

/** Arrow keys move the aim cursor: [columns, rows]. */
const ARROW_MOVES: Record<string, readonly [number, number]> = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };

/** Keys for the keeper's dive, by goal column. */
const DIVE_KEYS: Record<string, number> = { a: 0, arrowleft: 0, 4: 0, s: 1, arrowdown: 1, 5: 1, d: 2, arrowright: 2, 6: 2 };

export function Match({ userId, cpuId, year, context, paused, onPause, onFinish, onRematch, onExit }: MatchProps) {
  const settings = useSettings();
  const timing = useTiming();
  // Two players on this device: both sides shoot and keep goal, passing the device in between.
  const local = context.mode === 'local';
  const [seed] = useState(newSeed);
  const [state, dispatch] = useReducer(reducer, { seed, kicks: settings.kicks, difficulty: settings.difficulty, local }, init);
  const [rng] = useState(() => createRng(seed ^ 0x5bd1e995));
  const [poses, setPoses] = useState<Poses>({ kicker: 'idle', keeper: 'ready', flip: false });
  const strikeRef = useRef<StrikeMeterHandle>(null);
  // Each ref is its own top-level hook call; grouping happens afterwards so the
  // compiler can memoise the object without ever skipping a hook.
  const sceneRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<SVGGElement>(null);
  const keeperRef = useRef<SVGGElement>(null);
  const ballRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGRectElement>(null);
  const netRef = useRef<SVGGElement>(null);
  const crowdLRef = useRef<SVGGElement>(null);
  const crowdRRef = useRef<SVGGElement>(null);
  const refs: SceneRefs = {
    scene: sceneRef,
    kicker: kickerRef,
    keeper: keeperRef,
    ball: ballRef,
    shadow: shadowRef,
    net: netRef,
    crowdL: crowdLRef,
    crowdR: crowdRRef,
  };

  const user = getNation(userId);
  const cpu = getNation(cpuId);
  const userName = nameIn(user, year);
  const cpuName = nameIn(cpu, year);
  const { phase, so, plan } = state;
  const t = tally(so);
  const settled = phase === 'result' || phase === 'done';
  const last = so.log[so.log.length - 1];
  const taker = settled && last ? last.side : takerOf(so);
  const takenBefore = (side: Side) => t[side].taken - (settled && last?.side === side ? 1 : 0);
  const keeperSide: Side = taker === 'user' ? 'cpu' : 'user';
  const kickerNation = taker === 'user' ? user : cpu;
  const keeperNation = taker === 'user' ? cpu : user;
  const kickerName = taker === 'user' ? userName : cpuName;
  const keeperName = taker === 'user' ? cpuName : userName;
  const kickerNumber = (taker === 'user' ? USER_NUMBERS : CPU_NUMBERS)[takenBefore(taker) % USER_NUMBERS.length];
  const cpuProfile = state.profiles[takenBefore('cpu') % state.profiles.length];
  /** The goal columns a side has shot at, oldest first. */
  const columns = (side: Side) => state.shots[side].map((z) => ZONES[z].col);
  // Against the computer the keeper learns the player's habit; with two players, each kicker's own habit is on show.
  const habit = habitColumn(columns(local ? taker : 'user'));
  const round = Math.floor((so.log.length - (settled ? 1 : 0)) / 2) + 1;
  const cursor = state.cursorShown ? state.cursor : null;

  // ─── Actions (random decisions happen here, in event handlers, never in render) ───

  const begin = () => {
    if (phase !== 'intro') return;
    play('whistle');
    dispatch({ type: 'start' });
  };

  const aim = (zone: number) => {
    if (phase !== 'aim' && phase !== 'strike') return;
    play('select');
    dispatch({ type: 'aim', zone });
  };

  const unaim = () => {
    if (phase !== 'strike') return;
    play('back');
    dispatch({ type: 'unaim' });
  };

  const strike = (quality: Quality) => {
    if (phase !== 'strike' || state.zone == null) return;
    if (local) {
      // Keep the strike hidden and pass the device to the keeper.
      dispatch({ type: 'handoff', quality });
      return;
    }
    const dive = cpuKeeperDive(columns('user'), settings.difficulty, rng);
    const outcome = resolveShot({ zone: state.zone, quality, dive, keeperRating: cpu.rating, rng });
    const col = ZONES[state.zone].col;
    dispatch({
      type: 'plan',
      plan: { taker: 'user', zone: state.zone, quality, dive, outcome, readHabit: dive === col && habit === col },
    });
  };

  const ready = () => {
    if (phase !== 'handoff') return;
    play('select');
    dispatch({ type: 'ready' });
  };

  const diveTo = (col: number) => {
    if (phase !== 'dive') return;
    play('blip');
    if (local && state.pending) {
      const { zone, quality } = state.pending;
      const outcome = resolveShot({ zone, quality, dive: col, keeperRating: keeperNation.rating, rng });
      dispatch({ type: 'plan', plan: { taker, zone, quality, dive: col, outcome } });
      return;
    }
    const pressure = isSuddenDeath(so) || t.cpu.taken >= so.kicks - 1;
    const shot = cpuShot(cpuProfile, { rating: cpu.rating, difficulty: settings.difficulty, pressure }, rng);
    const outcome = resolveShot({ zone: shot.zone, quality: shot.quality, dive: col, keeperRating: user.rating, rng });
    dispatch({ type: 'plan', plan: { taker: 'cpu', zone: shot.zone, quality: shot.quality, dive: col, outcome } });
  };

  const advance = () => {
    if (phase !== 'result') return;
    if (!so.winner) {
      resetScene(refs);
      setPoses({ kicker: 'idle', keeper: 'ready', flip: false });
    } else {
      play(local || so.winner === 'user' ? 'win' : 'lose');
    }
    dispatch({ type: 'next' });
  };

  const finish = () => onFinish({ won: so.winner === 'user', score: [t.user.scored, t.cpu.scored] });

  // ─── Effects ───

  const finishKick = (done: KickPlan) => {
    // The stats are the player's record against the computer, so two-player games leave them alone.
    if (!local) {
      const scored = done.outcome.result === 'goal';
      if (done.taker === 'user') {
        recordStats({
          taken: 1,
          scored: scored ? 1 : 0,
          panenkas: scored && done.outcome.how === 'panenka' ? 1 : 0,
          bestStreak: scored ? state.streaks.user + 1 : 0,
        });
      } else {
        recordStats({ faced: 1, saved: done.outcome.result === 'save' ? 1 : 0 });
      }
      const after = applyKick(so, scored);
      if (after.winner) recordStats({ shootouts: 1, shootoutsWon: after.winner === 'user' ? 1 : 0 });
    }
    dispatch({ type: 'resolved' });
  };

  const runKick = useEffectEvent((current: KickPlan, signal: AbortSignal) =>
    playKick({
      refs,
      plan: current,
      userSide: 'user',
      local,
      timing,
      onPose: (p) => setPoses((prev) => ({ ...prev, ...p })),
      fx: { sound: play, buzz },
      signal,
    }).then(() => {
      if (!signal.aborted) finishKick(current);
    }),
  );

  useEffect(() => {
    if (phase !== 'kick' || !plan) return undefined;
    const controller = new AbortController();
    runKick(plan, controller.signal).catch(() => {});
    return () => controller.abort();
  }, [phase, plan]);

  const autoAdvance = useEffectEvent(() => advance());
  const autoDelay = (so.winner ? 1600 : 1500) * timing.speed;
  useEffect(() => {
    if (phase !== 'result' || paused || !settings.autoContinue) return undefined;
    const id = setTimeout(() => autoAdvance(), autoDelay);
    return () => clearTimeout(id);
  }, [phase, paused, settings.autoContinue, state.turn, autoDelay]);

  useKeydown((e) => {
    const key = e.key.toLowerCase();
    if (key === 'p' || (key === 'escape' && phase !== 'strike')) {
      if (phase === 'kick') return;
      e.preventDefault();
      onPause();
      return;
    }
    const zoneFor = (k: string) => ZONES.find((z) => z.keys.includes(k));
    const confirm = key === ' ' || key === 'enter';
    if (phase === 'intro' && confirm) {
      e.preventDefault();
      begin();
    } else if (phase === 'aim') {
      const z = zoneFor(key);
      const move = ARROW_MOVES[key];
      if (z) {
        e.preventDefault();
        aim(z.id);
      } else if (move) {
        e.preventDefault();
        const c = ZONES[state.cursor];
        dispatch({ type: 'cursor', cursor: clamp(c.row + move[1], 0, 1) * 3 + clamp(c.col + move[0], 0, 2) });
      } else if (confirm) {
        e.preventDefault();
        aim(state.cursor);
      }
    } else if (phase === 'strike') {
      const z = zoneFor(key);
      if (confirm) {
        e.preventDefault();
        strikeRef.current?.strike(e);
      } else if (key === 'escape' || key === 'backspace') {
        e.preventDefault();
        unaim();
      } else if (z) {
        e.preventDefault();
        aim(z.id);
      }
    } else if (phase === 'handoff' && confirm) {
      e.preventDefault();
      ready();
    } else if (phase === 'dive') {
      const col = DIVE_KEYS[key];
      if (col != null) {
        e.preventDefault();
        diveTo(col);
      }
    } else if (phase === 'result' && confirm) {
      e.preventDefault();
      advance();
    } else if (phase === 'done' && confirm) {
      e.preventDefault();
      if (context.mode === 'tournament') finish();
      else onRematch();
    }
  }, !paused);

  // ─── View ───

  const gk = keeperShirt(keeperNation.kit, kickerNation.kit);
  const kicker: ActorState = {
    pose: poses.kicker,
    palette: playerPalette(kickerNation.kit, playerLook(kickerNation.id, kickerNumber)),
    pattern: kickerNation.kit.pattern,
    number: kickerNumber,
  };
  const keeper: ActorState = {
    pose: poses.keeper,
    flip: poses.flip,
    palette: playerPalette(keeperNation.kit, playerLook(keeperNation.id, 1), { keeper: gk }),
  };
  // Spelled out for whoever is deciding: the kicker while aiming, the keeper while diving (always the player against the computer).
  const risk = local ? stakes(so, phase === 'handoff' || phase === 'dive' ? keeperSide : taker, { user: userName, cpu: cpuName }) : stakes(so);
  const outcome = settled && plan ? plan.outcome : null;
  // Against the computer a kick goes well when it is good for the player; with two players every goal and save is someone's to celebrate.
  const happy = outcome ? (local ? outcome.result !== 'miss' : (plan!.taker === 'user') === (outcome.result === 'goal')) : false;
  const streak = plan ? state.streaks[plan.taker] : 0;
  const winnerName = so.winner === 'user' ? userName : cpuName;
  const announcement =
    phase === 'result' && outcome
      ? `${RESULT_TITLE[outcome.result]} ${OUTCOME_TEXT[outcome.how]} ${userName} ${t.user.scored}, ${cpuName} ${t.cpu.scored}.`
      : phase === 'done'
        ? `${so.winner === 'user' ? `${userName} win` : `${cpuName} win`} the shootout ${Math.max(t.user.scored, t.cpu.scored)} to ${Math.min(t.user.scored, t.cpu.scored)}.`
        : '';

  return (
    <div className={`match${settings.focus ? ' match--focus' : ''}`}>
      <Scoreboard user={user} cpu={cpu} userName={userName} cpuName={cpuName} so={so} taker={settled ? null : taker} stage={context.stage} />

      <Scene
        refs={refs}
        kicker={kicker}
        keeper={keeper}
        board={context.board}
        leftKit={user.kit}
        rightKit={cpu.kit}
        focus={settings.focus}
        label={`${kickerName} number ${kickerNumber} steps up to take a penalty.`}
      >
        {phase === 'aim' && <GoalTargets mode="aim" onPick={aim} highlight={cursor} habit={settings.assist ? habit : null} />}
        {phase === 'strike' && <GoalTargets mode="aim" onPick={aim} highlight={state.zone} habit={null} />}
        {phase === 'dive' && <GoalTargets mode="dive" onPick={diveTo} />}
        {phase === 'result' && outcome && (
          <div className={`banner banner--${outcome.result}${happy ? ' is-happy' : ''}`} aria-hidden="true">
            <span className="banner__title">{RESULT_TITLE[outcome.result]}</span>
          </div>
        )}
        {phase === 'done' && (
          <div className={`banner banner--final${local || so.winner === 'user' ? ' is-happy' : ''}`} aria-hidden="true">
            <span className="banner__title">
              {local ? `${winnerName} win!` : so.winner === 'user' ? 'You win!' : context.mode === 'tournament' ? 'Knocked out' : 'Beaten'}
            </span>
          </div>
        )}
      </Scene>

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      <section className="panel frame" aria-label="Controls">
        {phase === 'intro' && (
          <div className="panel__stack">
            <h2 className="panel__title">
              {userName} <span className="panel__vs">v</span> {cpuName}
            </h2>
            <p className="panel__text">
              {local
                ? `${so.order[0] === 'user' ? userName : cpuName} won the coin toss and shoot first, so hand them the device. ${so.order[0] === 'user' ? cpuName : userName} start in goal.`
                : so.order[0] === 'user'
                  ? 'You won the coin toss, so you shoot first.'
                  : `${cpuName} won the coin toss and shoot first. You start in goal.`}{' '}
              Best of {so.kicks}, then sudden death.
            </p>
            <Button variant="primary" size="xl" kbd="Space" onClick={begin} sound={null}>
              Start the shootout
            </Button>
          </div>
        )}

        {(phase === 'aim' || phase === 'strike' || phase === 'handoff' || phase === 'dive' || phase === 'kick') && (
          <header className="panel__head">
            <span className="panel__kick">{round > so.kicks ? `Sudden death, round ${round}` : `Round ${round} of ${so.kicks}`}</span>
            {!settings.focus && risk && <span className={`stakes stakes--${risk.tone}`}>{risk.text}</span>}
          </header>
        )}

        {phase === 'aim' && (
          <div className="panel__stack">
            <h2 className="panel__title">
              <span className="step">1/2</span>
              {` ${local ? `${kickerName} to shoot` : 'Pick your spot'}`}
            </h2>
            <AimPad onAim={aim} cursor={cursor} assist={settings.assist} habit={settings.assist ? habit : null} />
            {!settings.focus &&
              (local ? (
                <p className="tip tip--optional">
                  {keeperName}, look away while {kickerName} aim.
                </p>
              ) : (
                <p className={habit != null && settings.assist ? 'tip' : 'tip tip--optional'}>
                  {habit != null && settings.assist
                    ? 'You keep going the same way. The keeper is learning, so mix it up.'
                    : 'Decide before the run-up, then commit. More pips means a smaller sweet spot.'}
                </p>
              ))}
          </div>
        )}

        {phase === 'strike' && (
          <div className="panel__stack">
            <h2 className="panel__title">
              <span className="step">2/2</span> Strike: {TECHNIQUE[ZONES[state.zone!].kind].label.toLowerCase()}
              {ZONES[state.zone!].col !== 1 ? `, ${ZONES[state.zone!].col === 0 ? 'left' : 'right'}` : ''}
            </h2>
            <StrikeMeter
              ref={strikeRef}
              key={state.zone}
              zone={state.zone!}
              difficulty={settings.difficulty}
              rating={kickerNation.rating}
              calm={settings.calm}
              onStrike={strike}
              onCancel={unaim}
            />
            {!settings.focus && <p className="tip tip--optional">Breathe out first. The green zone grows while you stay composed.</p>}
          </div>
        )}

        {phase === 'handoff' && (
          <div className="panel__stack">
            <h2 className="panel__title">Pass to {keeperName}</h2>
            <p className="panel__text">
              {kickerName} have struck. {keeperName}, you are in goal.
            </p>
            <Button variant="primary" size="xl" kbd="Space" onClick={ready} sound={null}>
              Ready to dive
            </Button>
          </div>
        )}

        {phase === 'dive' && (
          <div className="panel__stack">
            <h2 className="panel__title">{local ? `${keeperName} in goal` : 'You are in goal'}</h2>
            <ScoutCard
              number={kickerNumber}
              report={local ? { kind: 'player', team: kickerName, zones: state.shots[taker] } : { kind: 'cpu', profile: cpuProfile }}
              assist={settings.assist}
            />
            <DivePad onDive={diveTo} />
          </div>
        )}

        {phase === 'kick' && (
          <div className="panel__stack panel__stack--quiet" aria-hidden="true">
            <h2 className="panel__title">{local || plan?.taker === 'user' ? 'Here goes…' : 'Here it comes…'}</h2>
          </div>
        )}

        {phase === 'result' && outcome && (
          <div className="panel__stack">
            <h2 className={`panel__title outcome outcome--${happy ? 'good' : 'bad'}`}>{OUTCOME_TEXT[outcome.how]}</h2>
            {plan!.readHabit && !settings.focus && <p className="tip tip--warn">The keeper read your habit. Try a different side next time.</p>}
            {streak >= 3 && (local || plan!.taker === 'user') && outcome.result === 'goal' && !settings.focus && (
              <p className="tip tip--good">{streak} in a row. Ice cold.</p>
            )}
            <Button variant="primary" size="lg" kbd="Space" onClick={advance} sound={null}>
              {so.winner ? 'See the result' : 'Next kick'}
            </Button>
            {settings.autoContinue && !paused && (
              <span key={state.turn} className="countdown" style={{ animationDuration: `${autoDelay}ms` }} aria-hidden="true" />
            )}
          </div>
        )}

        {phase === 'done' && (
          <div className="panel__stack">
            <h2 className={`panel__title outcome outcome--${local || so.winner === 'user' ? 'good' : 'bad'}`}>
              {so.winner === 'user' ? `${userName} win ` : `${cpuName} win `}
              {Math.max(t.user.scored, t.cpu.scored)}-{Math.min(t.user.scored, t.cpu.scored)} on penalties
            </h2>
            <ButtonRow>
              {context.mode === 'tournament' ? (
                <Button variant="primary" size="lg" kbd="Enter" onClick={finish}>
                  {context.backLabel ?? 'Back to the bracket'}
                </Button>
              ) : (
                <>
                  <Button variant="primary" size="lg" kbd="Enter" onClick={onRematch}>
                    Rematch
                  </Button>
                  <Button variant="secondary" size="lg" onClick={onExit}>
                    Change teams
                  </Button>
                </>
              )}
            </ButtonRow>
          </div>
        )}
      </section>
    </div>
  );
}
