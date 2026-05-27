import type { MoodId } from '@/types';
import { useT } from '@/i18n';
import './MoodSelector.css';

const MOODS: { id: MoodId; emoji: string }[] = [
  { id: 'calm', emoji: '🌿' },
  { id: 'grateful', emoji: '🙏' },
  { id: 'peaceful', emoji: '🕊️' },
  { id: 'energized', emoji: '☀️' },
  { id: 'tired', emoji: '🌙' },
];

interface MoodSelectorProps {
  value: string | null;
  onChange: (mood: string) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const t = useT();

  return (
    <div className="mood-selector" role="group" aria-label={t('end.subtitle')}>
      {MOODS.map(({ id, emoji }) => (
        <button
          key={id}
          type="button"
          className={`mood-selector__item ${value === id ? 'mood-selector__item--active' : ''}`}
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          aria-label={t(`mood.${id}`)}
        >
          <span className="mood-selector__emoji" aria-hidden>
            {emoji}
          </span>
          <span className="mood-selector__label">{t(`mood.${id}`)}</span>
        </button>
      ))}
    </div>
  );
}
