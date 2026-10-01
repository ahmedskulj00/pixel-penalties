import type { NationId } from '@/types';
import { Flag } from '@/components/Flag';
import { getNation } from '@/data/nations';
import './Slot.css';

export interface SlotProps {
  label: string;
  id: NationId | null;
  /** The slot the picker below fills. */
  active: boolean;
  onClick: () => void;
}

/** One side of the quick match: the nation picked for it, or a prompt. */
export function Slot({ label, id, active, onClick }: SlotProps) {
  const n = id ? getNation(id) : null;
  return (
    <button type="button" className={`slot${active ? ' is-active' : ''}`} aria-pressed={active} onClick={onClick}>
      <span className="slot__label">{label}</span>
      {n ? (
        <span className="slot__pick">
          <Flag id={n.id} size="lg" />
          <span className="slot__name">{n.name}</span>
        </span>
      ) : (
        <span className="slot__empty">Choose below</span>
      )}
    </button>
  );
}
