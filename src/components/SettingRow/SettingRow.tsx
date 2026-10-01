import type { ReactNode } from 'react';
import './SettingRow.css';

export interface SettingRowProps {
  /** Base id: the label gets `${id}-l`. */
  id: string;
  label: ReactNode;
  description?: ReactNode;
  /** Give the description the id `${id}-d`, for controls that point at it. */
  describedBy?: boolean;
  /** Put the control under the text instead of beside it. */
  stack?: boolean;
  children: ReactNode;
}

/** A labelled settings row, shared by Switch and Segmented. */
export function SettingRow({ id, label, description, describedBy = false, stack = false, children }: SettingRowProps) {
  return (
    <div className={stack ? 'setting setting--stack' : 'setting'}>
      <div className="setting__text">
        <span id={`${id}-l`} className="setting__label">
          {label}
        </span>
        {description && (
          <span id={describedBy ? `${id}-d` : undefined} className="setting__desc">
            {description}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
