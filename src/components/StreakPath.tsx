import { STREAK_GOAL_DAYS } from '@/store/onboardingStore';
import './StreakPath.css';

interface StreakPathProps {
  current: number;
  goal?: number;
  label?: string;
  compact?: boolean;
  /** Highlight the next empty day (onboarding day-1 tease). */
  highlightNext?: boolean;
}

export function StreakPath({
  current,
  goal = STREAK_GOAL_DAYS,
  label,
  compact = false,
  highlightNext = false,
}: StreakPathProps) {
  const filled = Math.max(0, Math.min(goal, current));
  const nextIndex = highlightNext && filled < goal ? filled : -1;
  return (
    <div
      className={`streak-path${compact ? ' streak-path--compact' : ''}`}
      role="img"
      aria-label={label ?? `${filled} / ${goal}`}
    >
      {label && <p className="streak-path__label">{label}</p>}
      <div className="streak-path__dots">
        {Array.from({ length: goal }, (_, i) => (
          <span
            key={i}
            className={[
              'streak-path__dot',
              i < filled ? 'streak-path__dot--done' : '',
              i === filled - 1 ? 'streak-path__dot--today' : '',
              i === nextIndex ? 'streak-path__dot--next' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ))}
      </div>
      <p className="streak-path__count">
        {filled}
        <span className="streak-path__of"> / {goal}</span>
      </p>
    </div>
  );
}
