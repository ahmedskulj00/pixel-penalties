import type { Edition, EditionStatus } from '@/types';
import { Badge, type BadgeTone } from '@/components/Badge';
import { Flag } from '@/components/Flag';
import { TrophyIcon } from '@/components/TrophyIcon';
import { championIds } from '@/data/competitions';
import { getNation, nameIn } from '@/data/nations';
import './Champion.css';

/** Badges for editions without a normal champion. */
const STATUS: Partial<Record<EditionStatus, { tone: BadgeTone; text: string }>> = {
  upcoming: { tone: 'new', text: 'Upcoming' },
  cancelled: { tone: 'warn', text: 'Never played' },
  unfinished: { tone: 'warn', text: 'Unfinished' },
  nowinner: { tone: 'warn', text: 'No winner' },
  void: { tone: 'warn', text: 'Title void' },
  disputed: { tone: 'warn', text: 'Disputed' },
};

/** The real champion of an edition, or a badge saying why there is none. */
export function Champion({ edition }: { edition: Edition }) {
  const ids = championIds(edition);
  const status = STATUS[edition.status];
  if (!ids.length) return status ? <Badge tone={status.tone}>{status.text}</Badge> : <span className="muted">Winner not recorded</span>;
  return (
    <span className="champ">
      <TrophyIcon kind="gold" scale={1} />
      {ids.map((id) => (
        <span key={id} className="champ__team">
          <Flag id={id} size="xs" />
          {nameIn(getNation(id), edition.year)}
        </span>
      ))}
      {edition.status === 'shared' && <Badge tone="neutral">Shared</Badge>}
    </span>
  );
}
