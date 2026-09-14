import {
  SLOT_TIME_PRESETS,
  type PracticeSlot,
} from '@/store/onboardingStore';
import './ReminderTimePicker.css';

const SLOTS: PracticeSlot[] = ['morning', 'day', 'evening'];

interface ReminderTimePickerProps {
  slot: PracticeSlot | null;
  hour: number;
  minute: number;
  labels: {
    slotsTitle: string;
    timeTitle: string;
    slot: Record<PracticeSlot, string>;
    confirm: string;
    custom: string;
  };
  onSlotChange: (slot: PracticeSlot) => void;
  onTimeChange: (hour: number, minute: number) => void;
  onConfirm: () => void;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function ReminderTimePicker({
  slot,
  hour,
  minute,
  labels,
  onSlotChange,
  onTimeChange,
  onConfirm,
}: ReminderTimePickerProps) {
  const presets = slot ? SLOT_TIME_PRESETS[slot] : [7, 9, 13, 20];
  const timeValue = `${pad(hour)}:${pad(minute)}`;

  return (
    <div className="reminder-picker">
      <p className="reminder-picker__label">{labels.slotsTitle}</p>
      <div className="reminder-picker__slots" role="group">
        {SLOTS.map((s) => (
          <button
            key={s}
            type="button"
            className={`reminder-picker__slot${slot === s ? ' reminder-picker__slot--active' : ''}`}
            onClick={() => onSlotChange(s)}
          >
            {labels.slot[s]}
          </button>
        ))}
      </div>

      <p className="reminder-picker__label">{labels.timeTitle}</p>
      <div className="reminder-picker__hours" role="group">
        {presets.map((h) => (
          <button
            key={h}
            type="button"
            className={`reminder-picker__hour${hour === h && minute === 0 ? ' reminder-picker__hour--active' : ''}`}
            onClick={() => onTimeChange(h, 0)}
          >
            {pad(h)}:00
          </button>
        ))}
      </div>

      <label className="reminder-picker__custom">
        <span className="reminder-picker__custom-label">{labels.custom}</span>
        <input
          type="time"
          className="reminder-picker__input"
          value={timeValue}
          onChange={(e) => {
            const [hh, mm] = e.target.value.split(':').map(Number);
            if (!Number.isFinite(hh)) return;
            onTimeChange(hh, Number.isFinite(mm) ? mm : 0);
          }}
        />
      </label>

      <button type="button" className="btn-primary reminder-picker__cta" onClick={onConfirm}>
        {labels.confirm}
      </button>
    </div>
  );
}
