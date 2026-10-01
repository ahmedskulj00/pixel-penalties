import type { ReactNode } from 'react';
import type { Kit, KitPattern } from '@/types';
import { BALL_PALETTE, type Palette } from '@/pixel/palettes';
import type { Pose } from '@/pixel/sprites';
import { Actor } from '../Actor';
import { BASE_TRANSFORM, type SceneRefs } from './choreography';
import { crowdArt } from './crowd';
import { FRAMING } from './geometry';
import { Goal } from './Goal';
import { Pitch } from './Pitch';
import './Scene.css';

/** What an actor in the scene looks like right now. */
export interface ActorState {
  pose: Pose;
  palette: Palette;
  flip?: boolean;
  pattern?: KitPattern;
  number?: number;
}

export interface SceneProps {
  refs?: SceneRefs;
  kicker: ActorState;
  keeper: ActorState;
  /** Text on the advertising board. */
  board: ReactNode;
  /** The player's fans fill the left stand, the opponents' the right. */
  leftKit: Kit;
  rightKit: Kit;
  /** Dim the stands so the kick stands out. */
  focus?: boolean;
  label: string;
  children?: ReactNode;
}

/**
 * The stadium. Actors are positioned by an outer <g> whose CSS transform the
 * choreography animates; the sprite inside is offset so the transform origin is its anchor.
 */
export function Scene({ refs, kicker, keeper, board, leftKit, rightKit, focus = false, label, children }: SceneProps) {
  const crowd = crowdArt(leftKit, rightKit);
  return (
    <div className={`scene${focus ? ' scene--focus' : ''}`} ref={refs?.scene}>
      <svg className="scene__svg" viewBox="0 0 320 180" preserveAspectRatio={FRAMING} shapeRendering="crispEdges" role="img" aria-label={label}>
        <defs>
          <pattern id="pp-net" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M0 0h4v1h-4zM0 0h1v4h-1z" className="sc-net-line" />
          </pattern>
        </defs>
        <rect width="320" height="45" className="sc-stand" />
        <g className="sc-crowd">
          <g ref={refs?.crowdL}>
            {crowd.left.map(([c, d]) => (
              <path key={c} d={d} fill={c} />
            ))}
          </g>
          <g ref={refs?.crowdR}>
            {crowd.right.map(([c, d]) => (
              <path key={c} d={d} fill={c} />
            ))}
          </g>
        </g>
        <rect y="44" width="320" height="8" className="sc-board" />
        <text x="160" y="50.4" textAnchor="middle" className="sc-board-text">
          {board}
        </text>
        <Pitch />
        <Goal netRef={refs?.net} />
        <g ref={refs?.keeper} style={{ transform: BASE_TRANSFORM.keeper }}>
          <Actor pose={keeper.pose} palette={keeper.palette} flip={keeper.flip} />
        </g>
        <g ref={refs?.kicker} style={{ transform: BASE_TRANSFORM.kicker }}>
          <Actor pose={kicker.pose} palette={kicker.palette} pattern={kicker.pattern} number={kicker.number} />
        </g>
        <rect ref={refs?.shadow} x="155" y="139" width="10" height="2" className="sc-shadow" />
        <g ref={refs?.ball} style={{ transform: BASE_TRANSFORM.ball }}>
          <Actor pose="ball" palette={BALL_PALETTE} />
        </g>
      </svg>
      {children}
    </div>
  );
}
