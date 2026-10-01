import type { CSSProperties } from 'react';
import { ZONES } from '@/engine/kick';
import { DiveIcon } from '../Icon';
import { GOAL } from '../Scene/geometry';
import './GoalTargets.css';

export interface GoalTargetsProps {
  /** Six aiming zones, or three dive columns. */
  mode: 'aim' | 'dive';
  /** Receives a zone id when aiming, a column when diving. */
  onPick: (index: number) => void;
  highlight?: number | null;
  habit?: number | null;
}

/** The goal mouth in scene units; .goal-targets turns them into a box that follows the framing. */
const GOAL_BOX = { '--x': GOAL.left, '--y': GOAL.top, '--w': GOAL.right - GOAL.left, '--h': GOAL.bottom - GOAL.top } as CSSProperties;

/**
 * Tap targets laid over the goal mouth, for pointer users. The labelled pads below the
 * scene are the accessible controls, so these stay out of the tab order.
 */
export function GoalTargets({ mode, onPick, highlight, habit }: GoalTargetsProps) {
  if (mode === 'aim') {
    return (
      <div className="goal-targets goal-targets--aim" style={GOAL_BOX} aria-hidden="true">
        {ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            tabIndex={-1}
            className={`goal-targets__cell${highlight === z.id ? ' is-hot' : ''}${habit === z.col ? ' is-habit' : ''}`}
            onClick={() => onPick(z.id)}
          >
            <span className="goal-targets__reticle" />
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="goal-targets goal-targets--dive" style={GOAL_BOX} aria-hidden="true">
      {[0, 1, 2].map((col) => (
        <button key={col} type="button" tabIndex={-1} className="goal-targets__cell" onClick={() => onPick(col)}>
          <span className="goal-targets__arrow">
            <DiveIcon col={col} />
          </span>
        </button>
      ))}
    </div>
  );
}
