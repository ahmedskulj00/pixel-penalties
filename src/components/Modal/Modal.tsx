import { useEffect, useId, useRef, type ReactNode } from 'react';
import { CloseIcon } from '../Icon';
import { IconButton } from '../IconButton';
import './Modal.css';

export interface ModalProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/** Native <dialog>: focus trapping, Escape and inertness come for free. */
export function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
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
