import './KickMark.css';

type MarkKind = 'goal' | 'miss' | 'todo';

const MARK: Record<MarkKind, string> = {
  goal: 'M2 0h3v1h1v1h1v3h-1v1h-1v1h-3v-1h-1v-1h-1v-3h1v-1h1z',
  miss: 'M0 0h2v1h1v1h1v-1h1v-1h2v2h-1v1h-1v1h1v1h1v2h-2v-1h-1v-1h-1v1h-1v1h-2v-2h1v-1h1v-1h-1v-1h-1z',
  todo: 'M2 0h3v1h-3zM1 1h1v1h-1zM5 1h1v1h-1zM0 2h1v3h-1zM6 2h1v3h-1zM1 5h1v1h-1zM5 5h1v1h-1zM2 6h3v1h-3z',
};

/** One kick in the scoreboard: filled disc = scored, cross = missed, ring = to come. */
export function KickMark({ value }: { value: boolean | null }) {
  const kind: MarkKind = value === true ? 'goal' : value === false ? 'miss' : 'todo';
  return (
    <svg className={`mark mark--${kind}`} viewBox="0 0 7 7" shapeRendering="crispEdges" aria-hidden="true">
      <path d={MARK[kind]} />
    </svg>
  );
}
