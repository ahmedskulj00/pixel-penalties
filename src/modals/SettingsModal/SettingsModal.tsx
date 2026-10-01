import { Modal } from '@/components/Modal';
import { Segmented } from '@/components/Segmented';
import { Switch } from '@/components/Switch';
import { updateSettings, useSettings } from '@/state';
import { ResetProgress } from './ResetProgress';
import './SettingsModal.css';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  return (
    <Modal title="Settings" onClose={onClose} size="lg">
      <div className="settings">
        <section className="settings__group">
          <h3 className="settings__title">Game</h3>
          <Segmented
            label="Difficulty"
            description="Changes the sweet spot, the meter speed and how fast keepers learn your habits."
            value={s.difficulty}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'normal', label: 'Normal' },
              { value: 'hard', label: 'Hard' },
            ]}
            onChange={(v) => updateSettings({ difficulty: v })}
          />
          <Segmented
            label="Shootout length"
            description="Kicks per side before sudden death. Three makes for short, sharp sessions."
            value={s.kicks}
            options={[
              { value: 3, label: '3 kicks' },
              { value: 5, label: '5 kicks' },
            ]}
            onChange={(v) => updateSettings({ kicks: v })}
          />
          <Segmented
            label="Animation speed"
            value={s.speed}
            options={[
              { value: 'relaxed', label: 'Relaxed' },
              { value: 'normal', label: 'Normal' },
              { value: 'turbo', label: 'Turbo' },
            ]}
            onChange={(v) => updateSettings({ speed: v })}
          />
          <Switch
            label="Auto-continue"
            description="Move on to the next kick by itself. Turn off to go at your own pace."
            checked={s.autoContinue}
            onChange={(v) => updateSettings({ autoContinue: v })}
          />
        </section>

        <section className="settings__group">
          <h3 className="settings__title">Focus and comfort</h3>
          <Switch
            label="Coaching"
            description="Risk pips on each spot, scouting reports and habit warnings."
            checked={s.assist}
            onChange={(v) => updateSettings({ assist: v })}
          />
          <Switch
            label="Focus mode"
            description="Dims the crowd and hides tips and commentary."
            checked={s.focus}
            onChange={(v) => updateSettings({ focus: v })}
          />
          <Switch
            label="Calm mode"
            description="Slower strike meter, softer sound, no screen shake."
            checked={s.calm}
            onChange={(v) => updateSettings({ calm: v })}
          />
          <Segmented
            label="Motion"
            value={s.motion}
            options={[
              { value: 'system', label: 'Follow system' },
              { value: 'reduced', label: 'Reduced' },
              { value: 'full', label: 'Full' },
            ]}
            onChange={(v) => updateSettings({ motion: v })}
          />
          <Switch
            label="Readable font"
            description="Swap the pixel font for Atkinson Hyperlegible."
            checked={s.readable}
            onChange={(v) => updateSettings({ readable: v })}
          />
          <Segmented
            label="Theme"
            value={s.theme}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'day', label: 'Day match' },
              { value: 'night', label: 'Night match' },
            ]}
            onChange={(v) => updateSettings({ theme: v })}
          />
        </section>

        <section className="settings__group">
          <h3 className="settings__title">Feedback</h3>
          <Switch label="Sound" description="Press M at any time to mute." checked={s.sound} onChange={(v) => updateSettings({ sound: v })} />
          <Switch label="Vibration" description="On phones that support it." checked={s.haptics} onChange={(v) => updateSettings({ haptics: v })} />
        </section>

        <section className="settings__group">
          <h3 className="settings__title">Saved data</h3>
          <p className="setting__desc">Progress is stored in this browser only.</p>
          <ResetProgress />
        </section>
      </div>
    </Modal>
  );
}
