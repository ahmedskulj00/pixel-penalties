import { useId, type ReactNode } from 'react';
import { play } from '@/audio/sfx';
import { SettingRow } from '../SettingRow';
import './Segmented.css';

export interface SegmentedOption<T> {
  value: T;
  label: ReactNode;
}

export interface SegmentedProps<T> {
  label: ReactNode;
  description?: ReactNode;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
}

/** A row of mutually exclusive options (a radio group styled as buttons). */
export function Segmented<T extends string | number>({ label, description, value, options, onChange }: SegmentedProps<T>) {
  const id = useId();
  return (
    <SettingRow id={id} label={label} description={description} stack>
      <div className="segmented" role="radiogroup" aria-labelledby={`${id}-l`}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className="segmented__opt"
            onClick={() => {
              play('blip');
              onChange(o.value);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </SettingRow>
  );
}
