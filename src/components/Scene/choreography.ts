/**
 * Choreographs one penalty with the Web Animations API. The outcome is already decided
 * by the engine; this only makes it visible. Everything runs on transforms and opacity,
 * so it stays on the compositor, and an AbortSignal stops it cleanly on exit.
 */
import type { RefObject } from 'react';
import type { KickPlan, Side } from '@/types';
import type { SoundName } from '@/audio/sfx';
import { ZONES } from '@/engine/kick';
import type { Timing } from '@/hooks';
import type { Pose } from '@/pixel/sprites';
import { abortError, wait } from '@/utils/async';

/** [x, y, scale] in scene units (the scene is 320×180). */
export type Place = readonly [x: number, y: number, s: number];

/** Anything the choreography can move: SVG groups and shapes, or the scene's box. */
type Animated = HTMLElement | SVGElement;

/** The scene's moving parts. */
export interface SceneRefs {
  scene: RefObject<HTMLDivElement | null>;
  kicker: RefObject<SVGGElement | null>;
  keeper: RefObject<SVGGElement | null>;
  ball: RefObject<SVGGElement | null>;
  shadow: RefObject<SVGRectElement | null>;
  net: RefObject<SVGGElement | null>;
  crowdL: RefObject<SVGGElement | null>;
  crowdR: RefObject<SVGGElement | null>;
}

/** Where the keeper ends up, and where the ball meets the gloves. */
export interface KeeperPlan {
  pose: Pose;
  flip: boolean;
  to: Place;
  contact: [number, number];
  land?: Place;
  late?: boolean;
}

interface Flight {
  frames: Keyframe[];
  /** Where a goal settles in the net. */
  settle?: Keyframe[];
  duration: number;
  easing: string;
  /** Point of the flight (0–1) where the ball hits the keeper or the woodwork. */
  impact?: number;
}

export interface PoseUpdate {
  kicker?: Pose;
  keeper?: Pose;
  flip?: boolean;
}

export interface PlayKickOptions {
  refs: SceneRefs;
  plan: KickPlan;
  /** The side the player controls; the crowd reacts for them. */
  userSide: Side;
  timing: Timing;
  /** Swap sprite poses. */
  onPose: (update: PoseUpdate) => void;
  /** Sound and haptics. */
  fx: { sound: (name: SoundName) => void; buzz: (pattern: VibratePattern) => void };
  signal: AbortSignal;
}

export const T = (x: number, y: number, s = 1): string => `translate(${x}px, ${y}px) scale(${s})`;

export const POS: Record<'kickerStart' | 'kickerStrike' | 'keeper' | 'ball', Place> = {
  kickerStart: [124, 178, 2],
  kickerStrike: [147, 141, 1.72],
  keeper: [160, 100, 1.4],
  ball: [160, 136, 1.15],
};

export const BASE_TRANSFORM: Record<'kicker' | 'keeper' | 'ball', string> = {
  kicker: T(...POS.kickerStart),
  keeper: T(...POS.keeper),
  ball: T(...POS.ball),
};

const COL_X: readonly number[] = [112, 160, 208];

const ROW_Y: readonly number[] = [67, 91];

const IN_GOAL = 0.72;

export function zoneTarget(zoneId: number): [number, number] {
  const z = ZONES[zoneId];
  return [COL_X[z.col], ROW_Y[z.row]];
}

function animate(el: Animated | null, frames: Keyframe[], options: KeyframeAnimationOptions): Promise<unknown> {
  if (!el) return Promise.resolve();
  if (typeof el.animate !== 'function') {
    const last = frames[frames.length - 1];
    if (last.transform) el.style.transform = String(last.transform);
    if (last.opacity != null) el.style.opacity = String(last.opacity);
    return Promise.resolve();
  }
  return el.animate(frames, { fill: 'forwards', ...options }).finished.catch(() => {});
}

/** Put every actor back on its mark for the next kick. */
export function resetScene(refs: SceneRefs): void {
  for (const [name, ref] of Object.entries(refs) as [string, RefObject<Animated | null>][]) {
    const el = ref.current;
    if (!el) continue;
    el.getAnimations?.().forEach((a) => a.cancel());
    const base = (BASE_TRANSFORM as Record<string, string>)[name];
    if (base) el.style.transform = base;
    el.style.opacity = '';
  }
}

/** Where the keeper ends up, and where the ball meets the gloves. */
export function keeperPlan(plan: KickPlan): KeeperPlan {
  const z = ZONES[plan.zone];
  const { dive } = plan;
  const scored = plan.outcome.result === 'goal';
  if (dive === 1) {
    const high = z.row === 0 && z.col === 1;
    return high
      ? { pose: 'stretch', flip: false, to: [160, 97, 1.4], contact: [160, 64] }
      : { pose: 'ready', flip: false, to: [160, 100, 1.4], contact: [160, 86] };
  }
  const sameSide = dive === z.col;
  const high = sameSide ? z.row === 0 : false;
  const late = sameSide && scored;
  const dir = dive === 0 ? -1 : 1;
  const x = 160 + dir * (late ? 24 : 35);
  const y = high ? 72 : 90;
  return {
    pose: 'dive',
    flip: dive === 0,
    to: [x, y + (late ? 3 : 0), 1.4],
    contact: [x + dir * 15, high ? y - 5 : y + 2],
    land: [x, 94, 1.4],
    late,
  };
}

function ballFlight(plan: KickPlan, keeper: KeeperPlan): Flight {
  const z = ZONES[plan.zone];
  const [tx, ty] = zoneTarget(plan.zone);
  const [bx, by, bs] = POS.ball;
  const start: Keyframe = { transform: T(bx, by, bs), offset: 0 };
  const chip = z.kind === 'chip';
  const { result, how } = plan.outcome;
  const slow = plan.quality === 'poor' ? 1.25 : 1;
  const duration = (chip ? 820 : z.kind === 'middle' ? 430 : 470) * slow;
  const easing = chip ? 'cubic-bezier(.35,.55,.45,1)' : 'cubic-bezier(.15,.75,.35,1)';
  const arc: Keyframe[] = chip ? [{ transform: T(160, 64, 0.95), offset: 0.55 }] : [];
  const side = z.col === 0 ? -1 : 1;

  if (result === 'goal') {
    return {
      frames: [start, ...arc, { transform: T(tx, ty, IN_GOAL), offset: 1 }],
      settle: [{ transform: T(tx, ty, IN_GOAL) }, { transform: T(tx + (tx - 160) * 0.06, 97, 0.68) }],
      duration,
      easing,
    };
  }

  if (result === 'miss') {
    if (how === 'post') {
      const px = z.col === 0 ? 101 : 219;
      return {
        frames: [start, { transform: T(px, ty, 0.74), offset: 0.7 }, { transform: T(px + side * 22, ty + 26, 0.8), offset: 1 }],
        impact: 0.7,
        duration: duration * 1.25,
        easing: 'linear',
      };
    }
    if (how === 'bar') {
      return {
        frames: [
          start,
          { transform: T(160, 70, 0.9), offset: 0.45 },
          { transform: T(160, 57, 0.74), offset: 0.72 },
          { transform: T(166, 30, 0.6), opacity: 0, offset: 1 },
        ],
        impact: 0.72,
        duration: duration * 1.15,
        easing: 'linear',
      };
    }
    if (how === 'wide') {
      const wx = z.col === 0 ? 90 : 230;
      return {
        frames: [start, { transform: T(wx, ty, 0.72), offset: 0.75 }, { transform: T(wx + side * 14, ty - 3, 0.62), opacity: 0, offset: 1 }],
        duration: duration * 1.2,
        easing: 'linear',
      };
    }
    const ox = z.col === 1 ? 162 : tx + side * 6;
    return {
      frames: [
        start,
        ...(chip ? [{ transform: T(160, 50, 0.9), offset: 0.5 }] : []),
        { transform: T(ox, 42, 0.64), offset: 0.8 },
        { transform: T(ox, 26, 0.55), opacity: 0, offset: 1 },
      ],
      duration: duration * 1.15,
      easing: 'linear',
    };
  }

  const [cx, cy] = keeper.contact;
  const held = how === 'smothered' || how === 'straightAt' || how === 'panenkaRead';
  if (held) {
    return { frames: [start, ...arc, { transform: T(cx, cy, 0.78), offset: 1 }], duration, easing, impact: 1 };
  }
  const dir = cx < 160 ? -1 : 1;
  const high = cy < 75;
  return {
    frames: [start, { transform: T(cx, cy, 0.78), offset: 0.72 }, { transform: T(cx + dir * 26, high ? 44 : 110, 0.8), opacity: high ? 0 : 1, offset: 1 }],
    duration: duration * 1.3,
    easing: 'linear',
    impact: 0.72,
  };
}

/**
 * Play one kick. `refs` holds DOM refs (kicker, keeper, ball, shadow, net, crowdL, crowdR, scene).
 * `onPose` swaps sprite poses; `fx` plays sound/haptics.
 */
export async function playKick({ refs, plan, userSide, timing, onPose, fx, signal }: PlayKickOptions): Promise<void> {
  const k = (ms: number) => Math.max(16, ms * timing.speed * (timing.reduced ? 0.4 : 1));
  const el = (name: keyof SceneRefs): Animated | null => refs[name].current;
  const { result } = plan.outcome;
  const keeper = keeperPlan(plan);
  const flight = ballFlight(plan, keeper);

  // Run-up
  onPose({ kicker: 'runA' });
  const [sx, sy, ss] = POS.kickerStart;
  const [ex, ey, es] = POS.kickerStrike;
  animate(el('kicker'), [{ transform: T(sx, sy, ss) }, { transform: T(ex, ey, es) }], { duration: k(560), easing: 'linear' });
  if (timing.reduced) {
    await wait(k(560), signal);
  } else {
    for (const pose of ['runB', 'runA', 'runB'] as const) {
      await wait(k(140), signal);
      onPose({ kicker: pose });
    }
    await wait(k(140), signal);
  }

  // Strike
  onPose({ kicker: 'strike' });
  fx.sound('kick');
  fx.buzz(15);
  animate(el('shadow'), [{ opacity: 1 }, { opacity: 0 }], { duration: k(160) });
  const flightMs = k(flight.duration);
  const ballDone = animate(el('ball'), flight.frames, { duration: flightMs, easing: flight.easing });

  // Keeper reacts
  const reactAt = keeper.late ? 0.34 : 0.22;
  const arriveAt = flight.impact != null ? flight.impact : 0.78;
  await wait(flightMs * reactAt, signal);
  onPose({ keeper: keeper.pose, flip: keeper.flip });
  const [kx, ky, ks] = POS.keeper;
  animate(el('keeper'), [{ transform: T(kx, ky, ks) }, { transform: T(...keeper.to) }], {
    duration: Math.max(60, flightMs * (arriveAt - reactAt)),
    easing: 'cubic-bezier(.2,.8,.3,1)',
  });

  if (flight.impact != null && flight.impact < 1) {
    await wait(flightMs * (flight.impact - reactAt), signal);
    if (plan.outcome.how === 'post' || plan.outcome.how === 'bar') fx.sound('post');
    else fx.sound('blip');
  }
  await ballDone;
  if (signal.aborted) throw abortError();

  // Outcome
  const takerIsUser = plan.taker === userSide;
  if (result === 'goal') {
    animate(el('ball'), flight.settle!, { duration: k(260), easing: 'ease-in' });
    if (!timing.reduced) {
      animate(
        el('net'),
        [{ transform: 'translate(0,0)' }, { transform: 'translate(0,-2px)' }, { transform: 'translate(0,1px)' }, { transform: 'translate(0,0)' }],
        { duration: k(360) },
      );
      const crowd = takerIsUser ? el('crowdL') : el('crowdR');
      animate(crowd, [{ transform: 'translate(0,0)' }, { transform: 'translate(0,-2px)' }, { transform: 'translate(0,0)' }], {
        duration: k(220),
        iterations: 4,
      });
      if (!timing.calm) {
        animate(
          el('scene'),
          [{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(3px,-2px)' }, { transform: 'translate(0,0)' }],
          { duration: 220 },
        );
      }
    }
    fx.sound(takerIsUser ? 'goal' : 'concede');
    fx.buzz(takerIsUser ? [40, 40, 70] : 30);
    onPose({ kicker: 'cheer' });
  } else {
    if (keeper.land && !(plan.outcome.how === 'parried' || plan.outcome.how === 'tipped' || plan.outcome.how === 'fingertips')) {
      animate(el('keeper'), [{ transform: T(...keeper.to) }, { transform: T(...keeper.land) }], { duration: k(200), easing: 'ease-in' });
    }
    if (result === 'save' && !timing.reduced) {
      const crowd = takerIsUser ? el('crowdR') : el('crowdL');
      animate(crowd, [{ transform: 'translate(0,0)' }, { transform: 'translate(0,-2px)' }, { transform: 'translate(0,0)' }], {
        duration: k(220),
        iterations: 3,
      });
    }
    if (result === 'save') fx.sound(takerIsUser ? 'groan' : 'save');
    else if (plan.outcome.how !== 'post' && plan.outcome.how !== 'bar') fx.sound(takerIsUser ? 'groan' : 'save');
    fx.buzz(takerIsUser ? 25 : [60, 30, 60]);
    onPose({ kicker: 'sad' });
  }
  await wait(k(380), signal);
}
