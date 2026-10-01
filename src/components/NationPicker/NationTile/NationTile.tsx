import { memo } from 'react';
import type { NationId } from '@/types';
import { play } from '@/audio/sfx';
import { NATION_BY_ID, activeLabel, nameIn } from '@/data/nations';
import { Flag } from '../../Flag';
import { Stars } from '../../Stars';
import './NationTile.css';

export interface NationTileProps {
  id: NationId;
  /** Year for the team's name at the time. */
  year?: number;
  selected: boolean;
  onSelect: (id: NationId) => void;
  /** Replaces the active years under the name. */
  tag?: string;
}

function NationTileView({ id, year, selected, onSelect, tag }: NationTileProps) {
  const n = NATION_BY_ID.get(id)!;
  const name = nameIn(n, year);
  return (
    <button
      type="button"
      className={`nation${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      onClick={() => {
        play('blip');
        onSelect(id);
      }}
    >
      <Flag id={id} size="lg" />
      <span className="nation__text">
        <span className="nation__name">{name}</span>
        <span className="nation__meta">{tag ?? activeLabel(n)}</span>
        <Stars rating={n.rating} label={false} />
      </span>
    </button>
  );
}

// Memoised: selecting a nation or typing a search re-renders only the tiles that change.
export const NationTile = memo(NationTileView);
