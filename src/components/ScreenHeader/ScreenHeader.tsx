import type { ReactNode } from 'react';
import { BackIcon } from '../Icon';
import { IconButton } from '../IconButton';
import './ScreenHeader.css';

export interface ScreenHeaderProps {
  /** Accessible name of the back button. */
  backLabel: string;
  onBack: () => void;
  /** The title block: the screen title and whatever sits under it. */
  children: ReactNode;
}

/** The top of a screen: a back button beside the title block. */
export function ScreenHeader({ backLabel, onBack, children }: ScreenHeaderProps) {
  return (
    <header className="setup__head">
      <IconButton label={backLabel} onClick={onBack}>
        <BackIcon />
      </IconButton>
      <div>{children}</div>
    </header>
  );
}
