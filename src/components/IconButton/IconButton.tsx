import type { ButtonHTMLAttributes } from 'react';
import { play } from '@/audio/sfx';
import './IconButton.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Accessible name, also shown as a tooltip. */
  label: string;
  pressed?: boolean;
}

export function IconButton({ label, children, onClick, pressed, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={(e) => {
        play('blip');
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
