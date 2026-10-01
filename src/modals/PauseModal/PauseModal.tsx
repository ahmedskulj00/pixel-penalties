import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import './PauseModal.css';

export interface PauseModalProps {
  onResume: () => void;
  onSettings: () => void;
  onHowTo: () => void;
  onQuit: () => void;
  quitLabel: string;
  /** What quitting means here, if it needs saying. */
  note: string | null;
}

export function PauseModal({ onResume, onSettings, onHowTo, onQuit, quitLabel, note }: PauseModalProps) {
  return (
    <Modal title="Paused" onClose={onResume} size="sm">
      <div className="pause">
        <Button variant="primary" size="lg" onClick={onResume} autoFocus>
          Resume
        </Button>
        <Button variant="secondary" onClick={onHowTo}>
          How to play
        </Button>
        <Button variant="secondary" onClick={onSettings}>
          Settings
        </Button>
        <Button variant="ghost" onClick={onQuit}>
          {quitLabel}
        </Button>
        {note && <p className="muted">{note}</p>}
      </div>
    </Modal>
  );
}
