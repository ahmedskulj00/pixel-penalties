import type { ReactNode } from 'react';
import './StartBar.css';

/** The bar pinned to the bottom of a setup screen: the current pick and the start button. */
export function StartBar({ children }: { children: ReactNode }) {
  return (
    <div className="start-bar">
      <div className="start-bar__inner frame">{children}</div>
    </div>
  );
}
