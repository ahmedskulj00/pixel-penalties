import { useEffect, useImperativeHandle, useRef, type MouseEvent, type PointerEvent, type Ref } from 'react';
import type { Difficulty, Quality } from '@/types';
import { COMPOSURE_BONUS, DIFFICULTY, composure, gradeStrike, sweetSpot } from '@/engine/kick';
import { eventTime, swallowNextClick } from '@/utils/pointer';
import { Button } from '../Button';
import './StrikeMeter.css';

/** Lets the match screen strike from its keyboard shortcut. */
export interface StrikeMeterHandle {
  strike: (e?: { timeStamp?: number }) => void;
}

export interface StrikeMeterProps {
  ref?: Ref<StrikeMeterHandle>;
  zone: number;
  difficulty: Difficulty;
  /** The kicker's team rating, which widens the sweet spot. */
  rating: number;
  calm: boolean;
  onStrike: (quality: Quality) => void;
  onCancel: () => void;
}

/** Where the marker is and how wide the green zone has grown, `elapsed` ms into the sweep. */
function sweep(elapsed: number, period: number, green: number): { pos: number; green: number; calm: number } {
  const calm = composure(elapsed);
  return { pos: 1 - Math.abs(((elapsed / period) % 1) * 2 - 1), green: green * (1 + COMPOSURE_BONUS * calm), calm };
}

/**
 * Step 2: timing. A marker sweeps the bar; the green sweet spot widens while you stay
 * composed (up to COMPOSURE_BONUS after COMPOSURE_MS). The rAF loop writes styles directly,
 * so the meter never re-renders React at 60 fps. A strike is graded at the moment of the
 * press (the finger touching down, not lifting), from the exact event time rather than the
 * last painted frame.
 */
export function StrikeMeter({ ref, zone, difficulty, rating, calm, onStrike, onCancel }: StrikeMeterProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const calmRef = useRef<HTMLSpanElement>(null);
  const startedAt = useRef(0);
  const pressedAt = useRef(-Infinity);
  const { green, yellow } = sweetSpot(zone, { difficulty, rating });
  const period = (DIFFICULTY[difficulty] ?? DIFFICULTY.normal).period * (calm ? 1.35 : 1);

  useEffect(() => {
    const bar = barRef.current!;
    const track = trackRef.current!;
    const calmBar = calmRef.current!;
    let raf = 0;
    let lastCalm = -1;
    const t0 = performance.now();
    startedAt.current = t0;
    bar.style.setProperty('--y', `${yellow * 100}%`);
    const frame = (now: number) => {
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

  const strikeAt = (time: number) => {
    const { pos, green: g } = sweep(Math.max(0, time - startedAt.current), period, green);
    onStrike(gradeStrike(pos, g, yellow));
  };

  // Touch, pen or mouse: strike as the press lands.
  const onPress = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    pressedAt.current = performance.now();
    swallowNextClick();
    strikeAt(eventTime(e));
  };

  // Keyboard and assistive-technology activation arrives as a click with no press before it.
  const onActivate = (e: MouseEvent<HTMLButtonElement>) => {
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
