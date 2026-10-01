import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { play, type SoundName } from '@/audio/sfx';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: 'lg' | 'xl';
  /** Keyboard shortcut shown in the corner. */
  kbd?: ReactNode;
  /** Sound on click; null for none. */
  sound?: SoundName | null;
}

export function Button({ variant = 'secondary', size, kbd, className = '', children, onClick, sound = 'blip', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} ${size ? `btn--${size}` : ''} ${className}`}
      onClick={(e) => {
        if (sound) play(sound);
        onClick?.(e);
      }}
      {...rest}
    >
      <span className="btn__label">{children}</span>
      {kbd && (
        <kbd className="btn__kbd" aria-hidden="true">
          {kbd}
        </kbd>
      )}
    </button>
  );
}
