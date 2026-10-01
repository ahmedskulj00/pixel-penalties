import type { KickerProfile } from '@/types';
import { ZONES } from '@/engine/kick';
import './ScoutCard.css';

export interface ScoutCardProps {
  /** The kicker's shirt number. */
  number: number;
  profile: KickerProfile;
  /** Without assists there is no scouting report. */
  assist: boolean;
}

/** Scouting report on the next computer kicker: a heat map of their favourite spot. */
export function ScoutCard({ number, profile, assist }: ScoutCardProps) {
  if (!assist) {
    return <p className="scout scout--off">No scouting report. Trust your gut.</p>;
  }
  return (
    <div className="scout">
      <div className="scout__goal" aria-hidden="true">
        {ZONES.map((z) => (
          <span key={z.id} className={`scout__cell${z.id === profile.fav ? ' is-fav' : ''}`} />
        ))}
      </div>
      <p className="scout__text">
        <strong>No. {number}</strong> usually goes <strong>{ZONES[profile.fav].name.toLowerCase()}</strong>. Stay calm: favourites are not certainties.
      </p>
    </div>
  );
}
