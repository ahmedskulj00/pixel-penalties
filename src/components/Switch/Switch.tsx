import { useId, type ReactNode } from 'react';
import { play } from '@/audio/sfx';
import { SettingRow } from '../SettingRow';
import './Switch.css';

export interface SwitchProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, description, checked, onChange }: SwitchProps) {
  const id = useId();
  return (
    <SettingRow id={id} label={label} description={description} describedBy>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={description ? `${id}-d` : undefined}
        className="switch"
        onClick={() => {
          play('blip');
          onChange(!checked);
        }}
      >
        <span className="switch__knob" />
      </button>
    </SettingRow>
  );
}
