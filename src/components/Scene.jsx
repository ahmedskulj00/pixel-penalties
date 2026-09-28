import { Actor } from './pixel.jsx';
import { DiveIcon } from './ui.jsx';
import { BASE_TRANSFORM } from './choreography.js';
import { BALL_PALETTE } from '../pixel/colors.js';
import { createRng } from '../engine/rng.js';
import { ZONES } from '../engine/shootout.js';

/** Scene geometry in SVG units (320×180). Overlays convert these to percentages. */
export const GOAL = { left: 102, right: 218, top: 58, bottom: 100 };

const SKIN = ['#f3cfb3', '#e8b992', '#c98c5c', '#8f5b3b', '#5e3b27'];
const NEUTRAL = ['#e9e4d4', '#8a8fa8', '#4a4f73', '#c7c2b0'];
const STRIPES = [52, 60, 69, 79, 90, 102, 115, 129, 144, 161, 180];

/**
 * How the 320×180 scene fills its box. Phones give it a box taller than 16:9, and the SVG then
 * covers it and crops the stands at the sides, so the goal, keeper and taker come out about
 * twice as big (see .scene in styles.css). Browsers without container queries, which the goal
 * overlay needs to follow that crop, keep the whole view instead.
 */
const FRAMING =
  typeof CSS !== 'undefined' && CSS.supports?.('container-type', 'size') ? 'xMidYMax slice' : 'xMidYMid meet';

const crowdCache = new Map();

/** Pixel crowd: your fans on the left, theirs on the right. Deterministic and cached. */
function crowdArt(leftKit, rightKit) {
  const key = `${leftKit.shirt}${leftKit.trim}${rightKit.shirt}${rightKit.trim}`;
  const cached = crowdCache.get(key);
  if (cached) return cached;
  const rng = createRng(20260924);
  const build = (kit, fromX, toX) => {
    const paths = new Map();
    const add = (c, x, y, w, h) => paths.set(c, `${paths.get(c) ?? ''}M${x} ${y}h${w}v${h}h-${w}z`);
    for (let row = 0; row < 6; row++) {
      const y = 3 + row * 7;
      for (let x = fromX + (row % 2) * 2; x < toX - 2; x += 4) {
        if (rng.chance(0.07)) continue;
        const r = rng.next();
        const body = r < 0.62 ? kit.shirt : r < 0.84 ? kit.trim : NEUTRAL[rng.int(NEUTRAL.length)];
        add(SKIN[rng.int(SKIN.length)], x + 1, y, 2, 2);
        add(body, x, y + 2, 4, 3);
        if (rng.chance(0.06)) add(kit.shirt, x + (rng.chance(0.5) ? -1 : 4), y - 2, 1, 4);
      }
    }
    return [...paths.entries()];
  };
  const art = { left: build(leftKit, 0, 160), right: build(rightKit, 160, 322) };
  crowdCache.set(key, art);
  return art;
}

function Pitch() {
  return (
    <g>
      {STRIPES.slice(0, -1).map((y, i) => (
        <rect key={y} x="0" y={y} width="320" height={STRIPES[i + 1] - y} className={i % 2 ? 'sc-grass-b' : 'sc-grass-a'} />
      ))}
      <rect x="0" y="100" width="320" height="1" className="sc-chalk" />
      <path className="sc-lines" d="M81 100.5L73 113.5H247L239 100.5" />
      <path className="sc-lines" d="M30 100.5L5 150.5H315L290 100.5" />
      <path className="sc-lines" d="M131 150.5Q160 163 189 150.5" />
      <rect x="158" y="137" width="4" height="2" className="sc-chalk" />
    </g>
  );
}

function Goal({ netRef }) {
  return (
    <g>
      <rect x={GOAL.left} y={GOAL.top} width={GOAL.right - GOAL.left} height={GOAL.bottom - GOAL.top} className="sc-goal-depth" />
      <g ref={netRef}>
        <rect x={GOAL.left} y={GOAL.top} width={GOAL.right - GOAL.left} height={GOAL.bottom - GOAL.top} fill="url(#pp-net)" />
      </g>
      <rect x="100" y="56" width="2" height="45" className="sc-post" />
      <rect x="218" y="56" width="2" height="45" className="sc-post" />
      <rect x="100" y="56" width="120" height="2" className="sc-post" />
      <rect x="102" y="58" width="116" height="1" className="sc-post-shade" />
      <rect x="99" y="100" width="4" height="1" className="sc-post-shade" />
      <rect x="217" y="100" width="4" height="1" className="sc-post-shade" />
    </g>
  );
}

/**
 * The stadium. Actors are positioned by an outer <g> whose CSS transform the
 * choreography animates; the sprite inside is offset so the transform origin is its anchor.
 */
export function Scene({ refs, kicker, keeper, board, leftKit, rightKit, focus = false, label, children }) {
  const crowd = crowdArt(leftKit, rightKit);
  return (
    <div className={`scene${focus ? ' scene--focus' : ''}`} ref={refs?.scene}>
      <svg
        className="scene__svg"
        viewBox="0 0 320 180"
        preserveAspectRatio={FRAMING}
        shapeRendering="crispEdges"
        role="img"
        aria-label={label}
      >
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

/** The goal mouth in scene units; .goal-targets turns them into a box that follows the framing. */
const GOAL_BOX = { '--x': GOAL.left, '--y': GOAL.top, '--w': GOAL.right - GOAL.left, '--h': GOAL.bottom - GOAL.top };

/**
 * Tap targets laid over the goal mouth, for pointer users. The labelled pads below the
 * scene are the accessible controls, so these stay out of the tab order.
 */
export function GoalTargets({ mode, onPick, highlight, habit }) {
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
