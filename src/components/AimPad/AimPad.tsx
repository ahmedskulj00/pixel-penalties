import { TECHNIQUE, ZONES } from '@/engine/kick';
import { RiskPips } from './RiskPips';
import './AimPad.css';

export interface AimPadProps {
  onAim: (zone: number) => void;
  /** Zone highlighted by the keyboard or a hover over the goal. */
  cursor: number | null;
  /** Show the risk pips. */
  assist: boolean;
  /** The column the keeper has seen the player choose again and again. */
  habit: number | null;
}

/** Step 1 of a spot kick: choose one of six zones. */
export function AimPad({ onAim, cursor, assist, habit }: AimPadProps) {
  return (
    <div className="aimpad" role="group" aria-label="Choose where to shoot">
      {ZONES.map((z) => {
        const t = TECHNIQUE[z.kind];
        const habitual = habit === z.col;
        return (
          <button
            key={z.id}
            type="button"
            className={`aimpad__zone${cursor === z.id ? ' is-cursor' : ''}${habitual ? ' is-habit' : ''}`}
            onClick={() => onAim(z.id)}
            aria-label={`${z.name}. ${t.hint}.${habitual ? ' The keeper has seen you go this way.' : ''}`}
          >
            <span className="aimpad__label">{z.kind === 'high' ? 'Top corner' : t.label}</span>
            {assist && <RiskPips level={t.risk} />}
            <kbd className="aimpad__key">{z.keys[0].toUpperCase()}</kbd>
          </button>
        );
      })}
    </div>
  );
}
