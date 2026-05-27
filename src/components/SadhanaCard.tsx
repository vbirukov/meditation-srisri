import type { SadhanaBlock, SadhanaPractice } from '@/types';
import { CardCornerTexture } from '@/components/CardCornerTexture';
import { useT } from '@/i18n';
import { formatPhaseDuration, sadhanaTotalSeconds } from '@/utils/sadhana';
import '@/styles/textured-surface.css';
import './SadhanaCard.css';

interface SadhanaCardProps {
  practice: SadhanaPractice;
  onSelect: (id: string) => void;
  expanded?: boolean;
  textureUrl?: string;
  blocks?: readonly SadhanaBlock[];
}

export function SadhanaCard({
  practice,
  onSelect,
  expanded = false,
  textureUrl,
  blocks = [],
}: SadhanaCardProps) {
  const t = useT();
  const total = sadhanaTotalSeconds(practice, blocks);
  const phaseCount = practice.phases.length;
  const phasesBadge = t('hub.phasesCount').replace('{count}', String(phaseCount));
  const totalLabel = total.hasUnknown
    ? `≈ ${formatPhaseDuration(total.totalSeconds)}`
    : formatPhaseDuration(total.totalSeconds);

  return (
    <button
      type="button"
      className={`card card--interactive sadhana-card${textureUrl ? ' card--has-texture' : ''}`}
      onClick={() => onSelect(practice.id)}
    >
      {textureUrl && <CardCornerTexture url={textureUrl} warm />}
      <div className="sadhana-card__row">
        <div className="sadhana-card__main">
          <span className="badge badge--secondary">{phasesBadge}</span>
          <h3 className="sadhana-card__title">{practice.title}</h3>
          {practice.description && (
            <p className="sadhana-card__desc">{practice.description}</p>
          )}
        </div>
        <span className="sadhana-card__duration">{totalLabel}</span>
      </div>
      {expanded && (
        <ol className="sadhana-card__phases">
          {practice.phases.map((phase, i) => (
            <li key={phase.id}>
              <span className="sadhana-card__phase-num">{i + 1}</span>
              <span className="sadhana-card__phase-label">{phase.label}</span>
              <span className="sadhana-card__phase-time">
                {typeof phase.durationSeconds === 'number'
                  ? formatPhaseDuration(phase.durationSeconds)
                  : '—'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </button>
  );
}
