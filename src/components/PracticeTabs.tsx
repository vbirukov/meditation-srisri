import type { PracticeTab } from '@/types';
import './PracticeTabs.css';

interface PracticeTabsProps {
  active: PracticeTab;
  onChange: (tab: PracticeTab) => void;
  labels: { meditations: string; sadhana: string };
}

export function PracticeTabs({ active, onChange, labels }: PracticeTabsProps) {
  return (
    <div className="practice-tabs glass-bar" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'meditations'}
        className={`practice-tabs__btn ${active === 'meditations' ? 'practice-tabs__btn--active' : ''}`}
        onClick={() => onChange('meditations')}
      >
        {labels.meditations}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'sadhana'}
        className={`practice-tabs__btn ${active === 'sadhana' ? 'practice-tabs__btn--active' : ''}`}
        onClick={() => onChange('sadhana')}
      >
        {labels.sadhana}
      </button>
    </div>
  );
}
