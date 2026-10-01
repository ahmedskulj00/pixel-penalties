import type { Competition, Edition, GroupsFormat, Nation, NationId, Tournament } from '@/types';
import { Button } from '@/components/Button';
import { Flag } from '@/components/Flag';
import { Stars } from '@/components/Stars';
import { getNation, nameIn } from '@/data/nations';
import { groupTable, stageLabel, userMatch } from '@/engine/tournament';
import { ordinal } from '@/utils/format';
import './NextMatch.css';

/** Everything the app needs to start the player's next tournament match. */
export interface PlayRequest {
  userId: NationId;
  cpuId: NationId;
  year: number;
  stage: string;
  comp: Competition;
  edition: Edition;
  backLabel: string;
}

export interface NextMatchProps {
  t: Tournament;
  me: Nation;
  myName: string;
  year: number;
  comp: Competition;
  edition: Edition;
  onPlay: (request: PlayRequest) => void;
  /** Move on from a rest day or a bye. */
  onBye: () => void;
}

/** The player's next fixture, a rest day or a bye. */
export function NextMatch({ t, me, myName, year, comp, edition, onPlay, onBye }: NextMatchProps) {
  const current = userMatch(t);
  if (!current) return null;
  const stage = stageLabel(t);
  const opponent = current.opponent ? getNation(current.opponent) : null;
  let standing: string | null = null;
  if (t.phase === 'groups' && t.day > 0) {
    const row = groupTable(t.groups![current.group!]).find((r) => r.id === t.userId)!;
    const where =
      t.format.type === 'league'
        ? 'in the table'
        : t.stage === 2 && (t.format as GroupsFormat).second!.league
          ? 'in the final round'
          : `in ${t.stage === 2 ? 'second-round ' : ''}Group ${t.groups![current.group!].name}`;
    standing = `You are ${ordinal(row.pos)} ${where} with ${row.pts} ${row.pts === 1 ? 'point' : 'points'}.`;
  }

  if (current.rest || current.bye) {
    return (
      <section className="next-match frame" aria-label="Your next match">
        <p className="next-match__stage">{stage}</p>
        <p className="next-match__bye">
          {current.rest ? 'Rest day: the other teams play this matchday without you.' : 'You have a bye. Straight through to the next round.'}
        </p>
        {standing && <p className="next-match__standing">{standing}</p>}
        <Button variant="primary" size="xl" onClick={onBye} sound="select">
          {current.rest ? 'Play the matchday' : 'Continue'}
        </Button>
      </section>
    );
  }

  return (
    <section className="next-match frame" aria-label="Your next match">
      <p className="next-match__stage">{stage}</p>
      <div className="versus">
        <div className="versus__team">
          <Flag id={me.id} size="xl" />
          <span className="versus__name">{myName}</span>
          <Stars rating={me.rating} />
        </div>
        <span className="versus__v" aria-hidden="true">
          v
        </span>
        <div className="versus__team">
          <Flag id={opponent!.id} size="xl" />
          <span className="versus__name">{nameIn(opponent!, year)}</span>
          <Stars rating={opponent!.rating} />
        </div>
      </div>
      {standing && <p className="next-match__standing">{standing}</p>}
      <Button
        variant="primary"
        size="xl"
        sound="select"
        onClick={() =>
          onPlay({
            userId: me.id,
            cpuId: opponent!.id,
            year,
            stage: stageLabel(t, { short: true }),
            comp,
            edition,
            backLabel: t.phase === 'groups' ? (t.format.type === 'league' ? 'Back to the table' : 'Back to the groups') : 'Back to the bracket',
          })
        }
      >
        Take the shootout
      </Button>
    </section>
  );
}
