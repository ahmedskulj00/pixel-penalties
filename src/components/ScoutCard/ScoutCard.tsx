import type { KickerProfile } from '@/types';
import { ZONES } from '@/engine/kick';
import './ScoutCard.css';

/** How many of a player's recent kicks the card shows. */
const RECENT = 3;

/** What the keeper knows: a computer kicker's favourite spot, or where a player has shot so far (two-player games): the map marks their last few kicks. */
export type ScoutReport = { kind: 'cpu'; profile: KickerProfile } | { kind: 'player'; team: string; zones: readonly number[] };

export interface ScoutCardProps {
  /** The kicker's shirt number. */
  number: number;
  report: ScoutReport;
  /** Without assists there is no scouting report. */
  assist: boolean;
}

/** Scouting report on the next kicker, over a small map of the goal. */
export function ScoutCard({ number, report, assist }: ScoutCardProps) {
  if (!assist) {
    return <p className="scout scout--off">No scouting report. Trust your gut.</p>;
  }
  const recent = report.kind === 'cpu' ? [report.profile.fav] : report.zones.slice(-RECENT);
  return (
    <div className="scout">
      <div className="scout__goal" aria-hidden="true">
        {ZONES.map((z) => (
          <span key={z.id} className={`scout__cell${recent.includes(z.id) ? ' is-fav' : ''}`} />
        ))}
      </div>
      <p className="scout__text">
        {report.kind === 'cpu' ? (
          <>
            <strong>No. {number}</strong> usually goes <strong>{ZONES[report.profile.fav].name.toLowerCase()}</strong>. Stay calm: favourites are not
            certainties.
          </>
        ) : recent.length ? (
          <>
            <strong>{report.team}</strong> last went <strong>{ZONES[recent[recent.length - 1]].name.toLowerCase()}</strong>.
          </>
        ) : (
          <>
            <strong>{report.team}</strong> have not shot yet.
          </>
        )}
      </p>
    </div>
  );
}
