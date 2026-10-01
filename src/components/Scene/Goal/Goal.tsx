import type { Ref } from 'react';
import { GOAL } from '../geometry';
import './Goal.css';

/** Posts, bar and net; the net is a group the choreography can ripple. */
export function Goal({ netRef }: { netRef?: Ref<SVGGElement> }) {
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
