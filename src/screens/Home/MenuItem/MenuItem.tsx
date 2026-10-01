import type { ReactNode } from 'react';
import { play } from '@/audio/sfx';
import './MenuItem.css';

export interface MenuItemProps {
  icon: ReactNode;
  title: string;
  detail?: string;
  onClick: () => void;
  /** Highlight the main action. */
  primary?: boolean;
}

export function MenuItem({ icon, title, detail, onClick, primary }: MenuItemProps) {
  return (
    <button
      type="button"
      className={`menu-item${primary ? ' menu-item--primary' : ''}`}
      onClick={() => {
        play('select');
        onClick();
      }}
    >
      <span className="menu-item__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="menu-item__text">
        <span className="menu-item__title">{title}</span>
        {detail && <span className="menu-item__detail">{detail}</span>}
      </span>
    </button>
  );
}
