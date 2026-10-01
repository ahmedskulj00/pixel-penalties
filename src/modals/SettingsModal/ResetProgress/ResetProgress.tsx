import { useState } from 'react';
import { Button } from '@/components/Button';
import { ButtonRow } from '@/components/ButtonRow';
import { resetProgress } from '@/state';
import './ResetProgress.css';

/** Delete trophies, stats and the saved tournament, after asking once. */
export function ResetProgress() {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  if (done) return <p className="setting__desc">Progress deleted. Fresh start.</p>;
  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Reset progress
      </Button>
    );
  }
  return (
    <div className="confirm" role="group" aria-label="Confirm reset">
      <p className="confirm__text">Delete your trophies, stats and the tournament in progress?</p>
      <ButtonRow wrap>
        <Button
          variant="danger"
          onClick={() => {
            resetProgress();
            setDone(true);
          }}
        >
          Yes, delete it all
        </Button>
        <Button variant="secondary" sound="back" onClick={() => setConfirming(false)}>
          Keep my progress
        </Button>
      </ButtonRow>
    </div>
  );
}
