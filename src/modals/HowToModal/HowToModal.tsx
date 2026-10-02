import { Modal } from '@/components/Modal';
import './HowToModal.css';

export function HowToModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose} size="lg">
      <div className="howto">
        <ol className="howto__steps">
          <li className="howto__step frame">
            <span className="howto__n">1</span>
            <div>
              <h3>Pick your spot</h3>
              <p>
                Six targets. Corners and the chip are hard to save but easy to miss; the middle is safe unless the keeper stays up. The pips show how narrow the
                sweet spot is.
              </p>
            </div>
          </li>
          <li className="howto__step frame">
            <span className="howto__n">2</span>
            <div>
              <h3>Strike in the green</h3>
              <p>A marker sweeps the bar. Hit Strike while it is in the green. Take one calm breath first: the green zone grows while you stay composed.</p>
            </div>
          </li>
          <li className="howto__step frame">
            <span className="howto__n">3</span>
            <div>
              <h3>In goal, read the scout</h3>
              <p>When they shoot, the scouting card shows the kicker&apos;s favourite spot. Dive left, dive right, or stay big in the middle.</p>
            </div>
          </li>
        </ol>
        <p>
          Real penalty takers pick their spot early and commit. Changing your mind at the last second is where misses come from, so the game gives you one
          decision at a time and no clock on the first one.
        </p>
        <h3 className="settings__title">Two players</h3>
        <p>
          Play a friend on one device. The kicker picks a spot and strikes while the keeper looks away, then passes the device over. The keeper picks a dive,
          and you both watch the kick. Roles swap every kick, so whoever just kept goal shoots next.
        </p>
        <h3 className="settings__title">Keyboard</h3>
        <table className="keys">
          <tbody>
            <tr>
              <th scope="row">Aim</th>
              <td>
                <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> top row, <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> bottom row, or arrows and <kbd>Space</kbd>
              </td>
            </tr>
            <tr>
              <th scope="row">Strike</th>
              <td>
                <kbd>Space</kbd>, or <kbd>Esc</kbd> to change spot
              </td>
            </tr>
            <tr>
              <th scope="row">Dive</th>
              <td>
                <kbd>A</kbd> left, <kbd>S</kbd> stay, <kbd>D</kbd> right (arrows work too)
              </td>
            </tr>
            <tr>
              <th scope="row">Other</th>
              <td>
                <kbd>P</kbd> pause, <kbd>M</kbd> mute
              </td>
            </tr>
          </tbody>
        </table>
        <p className="muted">Want it gentler? Settings has Focus mode, Calm mode, three-kick shootouts, Easy difficulty and a readable font.</p>
      </div>
    </Modal>
  );
}
