import type { Edition } from '@/types';
import { Flag } from '@/components/Flag';
import './Hosts.css';

/** Host flags (up to `max`, then a count), or the edition's host note. */
export function Hosts({ edition, max = 3 }: { edition: Edition; max?: number }) {
  if (!edition.hosts.length) return <span className="hosts__note">{edition.hostNote ?? 'No fixed host'}</span>;
  const shown = edition.hosts.slice(0, max);
  const rest = edition.hosts.length - shown.length;
  return (
    <span className="hosts">
      {shown.map((id) => (
        <Flag key={id} id={id} size="sm" label />
      ))}
      {rest > 0 && <span className="hosts__more">+{rest}</span>}
    </span>
  );
}
