import type { Meditation } from '@/types';
import { CardCornerTexture } from '@/components/CardCornerTexture';
import { formatTime } from '@/utils/time';
import '@/styles/textured-surface.css';
import './MeditationCard.css';

interface MeditationCardProps {
  meditation: Meditation;
  onSelect: (id: string) => void;
  textureUrl?: string;
  offlineUnavailable?: boolean;
  offlineLabel?: string;
}

export function MeditationCard({
  meditation,
  onSelect,
  textureUrl,
  offlineUnavailable = false,
  offlineLabel,
}: MeditationCardProps) {
  const minutes = Math.round(meditation.durationSeconds / 60);

  return (
    <button
      type="button"
      className={`card card--interactive meditation-card${textureUrl ? ' card--has-texture' : ''}${offlineUnavailable ? ' meditation-card--offline-disabled' : ''}`}
      onClick={() => onSelect(meditation.id)}
      disabled={offlineUnavailable}
      aria-disabled={offlineUnavailable}
    >
      {textureUrl && <CardCornerTexture url={textureUrl} />}
      <div className="meditation-card__row">
        <div className="meditation-card__main">
          <span className="meditation-card__badges">
            <span className={`badge meditation-card__type meditation-card__type--${meditation.type}`}>
              {meditation.type}
            </span>
            {offlineUnavailable && offlineLabel && (
              <span className="badge badge--secondary">{offlineLabel}</span>
            )}
          </span>
          <h3 className="meditation-card__title">{meditation.title}</h3>
          {meditation.description && (
            <p className="meditation-card__desc">{meditation.description}</p>
          )}
        </div>
        <span className="meditation-card__duration">
          {minutes} {formatTime(meditation.durationSeconds)}
        </span>
      </div>
    </button>
  );
}
