import { DiveIcon } from '../Icon';
import '../Button/Button.css';
import './DivePad.css';

/** Keeper's choice when the computer shoots. */
const DIVES: readonly { label: string; key: string }[] = [
  { label: 'Dive left', key: 'A' },
  { label: 'Stay big', key: 'S' },
  { label: 'Dive right', key: 'D' },
];

/** Keeper controls, laid out like the aim pad: icon above a centred label, keyboard key in the corner. */
export function DivePad({ onDive }: { onDive: (col: number) => void }) {
  return (
    <div className="divepad" role="group" aria-label="Choose which way to dive">
      {DIVES.map((d, col) => (
        <button key={d.key} type="button" className="btn btn--secondary divepad__btn" aria-keyshortcuts={d.key} onClick={() => onDive(col)}>
          <DiveIcon col={col} />
          <span className="divepad__label">{d.label}</span>
          <kbd className="divepad__key" aria-hidden="true">
            {d.key}
          </kbd>
        </button>
      ))}
    </div>
  );
}
