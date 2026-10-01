import type { ReactNode } from 'react';
import './ButtonRow.css';

export interface ButtonRowProps {
  /** Let the buttons wrap onto several lines on narrow screens. */
  wrap?: boolean;
  children: ReactNode;
}

/** A row of buttons. */
export function ButtonRow({ wrap = false, children }: ButtonRowProps) {
  return <div className={wrap ? 'panel__row panel__row--wrap' : 'panel__row'}>{children}</div>;
}
