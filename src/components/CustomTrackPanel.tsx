import { useRef } from 'react';
import { useT } from '@/i18n';
import { useCustomTrackStore } from '@/store/customTrackStore';
import { CUSTOM_TRACK_ACCEPT } from '@/utils/audioMeta';
import { formatTime } from '@/utils/time';
import './CustomTrackPanel.css';

interface CustomTrackPanelProps {
  onStart?: () => void;
  compact?: boolean;
}

export function CustomTrackPanel({ onStart, compact }: CustomTrackPanelProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const track = useCustomTrackStore((s) => s.track);
  const loading = useCustomTrackStore((s) => s.loading);
  const error = useCustomTrackStore((s) => s.error);
  const upload = useCustomTrackStore((s) => s.upload);
  const remove = useCustomTrackStore((s) => s.remove);
  const clearError = useCustomTrackStore((s) => s.clearError);

  const pickFile = () => {
    clearError();
    inputRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await upload(file);
  };

  const errorText = error ? t(`customTrack.errors.${error}`) : null;

  return (
    <div className={`custom-track ${compact ? 'custom-track--compact' : ''}`}>
      <input
        ref={inputRef}
        type="file"
        accept={CUSTOM_TRACK_ACCEPT}
        className="sr-only"
        onChange={onFile}
      />

      {track ? (
        <div className="custom-track__current panel-elevated">
          <div className="custom-track__info">
            <span className="custom-track__label">{t('customTrack.yours')}</span>
            <strong className="custom-track__name" title={track.name}>
              {track.name}
            </strong>
            {track.durationSeconds > 0 && (
              <span className="custom-track__duration text-muted">
                {formatTime(track.durationSeconds)}
              </span>
            )}
          </div>
          <div className="custom-track__actions">
            {onStart && (
              <button type="button" className="btn-primary" onClick={onStart} disabled={loading}>
                {t('customTrack.start')}
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={pickFile} disabled={loading}>
              {t('customTrack.replace')}
            </button>
            <button
              type="button"
              className="btn-icon custom-track__remove"
              onClick={() => remove()}
              disabled={loading}
              aria-label={t('customTrack.remove')}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="card card--interactive custom-track__upload"
          onClick={pickFile}
          disabled={loading}
        >
          <span className="custom-track__upload-icon" aria-hidden>
            ♫
          </span>
          <div className="custom-track__upload-text">
            <strong>{t('customTrack.upload')}</strong>
            <span className="text-muted">{t('customTrack.uploadHint')}</span>
          </div>
        </button>
      )}

      {errorText && (
        <p className="custom-track__error" role="alert">
          {errorText}
        </p>
      )}
      <p className="custom-track__storage text-muted">{t('customTrack.localOnly')}</p>
    </div>
  );
}
