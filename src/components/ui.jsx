import { useEffect, useId, useRef } from 'react';
import { play } from '../audio/sfx.js';

export function Button({ variant = 'secondary', size, kbd, className = '', children, onClick, sound = 'blip', ...rest }) {
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

export function IconButton({ label, children, onClick, pressed, ...rest }) {
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

export function Switch({ label, description, checked, onChange }) {
  const id = useId();
  return (
    <div className="setting">
      <div className="setting__text">
        <span id={`${id}-l`} className="setting__label">
          {label}
        </span>
        {description && (
          <span id={`${id}-d`} className="setting__desc">
            {description}
          </span>
        )}
      </div>
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
    </div>
  );
}

export function Segmented({ label, description, value, options, onChange }) {
  const id = useId();
  return (
    <div className="setting setting--stack">
      <div className="setting__text">
        <span id={`${id}-l`} className="setting__label">
          {label}
        </span>
        {description && <span className="setting__desc">{description}</span>}
      </div>
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
    </div>
  );
}

/** Native <dialog>: focus trapping, Escape and inertness come for free. */
export function Modal({ title, onClose, children, size = 'md' }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    return () => dialog?.close?.();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal__inner frame">
        <header className="modal__head">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </dialog>
  );
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

// ─── Pixel icons (8×8 grids) ────────────────────────────────────────────────

function Icon({ d, label }) {
  return (
    <svg className="icon" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden={label ? undefined : true} aria-label={label}>
      <path d={d} />
    </svg>
  );
}

export const CloseIcon = () => <Icon d="M0 0h2v1h1v1h2v-1h1v-1h2v2h-1v1h-1v2h1v1h1v2h-2v-1h-1v-1h-2v1h-1v1h-2v-2h1v-1h1v-2h-1v-1h-1z" />;
export const GearIcon = () => (
  <Icon d="M3 0h2v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-2h1v-1h1v-1h1zM3 3v2h2v-2z" />
);
export const HelpIcon = () => <Icon d="M2 0h4v1h1v3h-1v1h-2v1h-2v-2h1v-1h2v-1h-2v1h-2v-2h1zM2 7h2v1h-2z" />;
export const SoundOnIcon = () => <Icon d="M0 2h2v-1h1v-1h1v8h-1v-1h-1v-1h-2zM5 2h1v4h-1zM7 1h1v6h-1z" />;
export const SoundOffIcon = () => <Icon d="M0 2h2v-1h1v-1h1v8h-1v-1h-1v-1h-2zM5 2h1v1h1v-1h1v1h-1v2h1v1h-1v-1h-1v1h-1v-1h1v-2h-1z" />;
export const PauseIcon = () => <Icon d="M1 0h2v8h-2zM5 0h2v8h-2z" />;

/** The keeper's three choices, by goal column: dive left, stay big (gloves up), dive right. */
const DIVE_PATHS = [
  'M0 3h1v2h-1zM1 2h1v4h-1zM2 1h1v6h-1zM3 0h1v8h-1zM4 3h4v2h-4z',
  'M0 0h2v2h-2zM6 0h2v2h-2zM3 1h2v2h-2zM1 2h1v1h-1zM6 2h1v1h-1zM1 3h6v1h-6zM2 4h4v2h-4zM2 6h1v1h-1zM5 6h1v1h-1zM1 7h2v1h-2zM5 7h2v1h-2z',
  'M7 3h1v2h-1zM6 2h1v4h-1zM5 1h1v6h-1zM4 0h1v8h-1zM0 3h4v2h-4z',
];
export const DiveIcon = ({ col }) => <Icon d={DIVE_PATHS[col]} />;
export const BackIcon = () => <Icon d="M3 1h2v1h-1v1h4v2h-4v1h1v1h-2v-1h-1v-1h-1v-2h1v-1h1z" />;
export const BallIcon = () => <Icon d="M2 0h4v1h1v1h1v4h-1v1h-1v1h-4v-1h-1v-1h-1v-4h1v-1h1zM3 2v2h2v-2z" />;
