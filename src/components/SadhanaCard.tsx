import { useCallback, useRef, useState } from 'react';
import type { SadhanaBlock, SadhanaPractice } from '@/types';
import { CardCornerTexture } from '@/components/CardCornerTexture';
import { useT } from '@/i18n';
import { formatPhaseDuration, sadhanaTotalSeconds } from '@/utils/sadhana';
import '@/styles/textured-surface.css';
import './SadhanaCard.css';

const SWIPE_ACTION_WIDTH = 76;
const SWIPE_OPEN_THRESHOLD = 36;
const SWIPE_DELETE_THRESHOLD = 96;

interface SadhanaCardProps {
  practice: SadhanaPractice;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  expanded?: boolean;
  textureUrl?: string;
  blocks?: readonly SadhanaBlock[];
  badgeLabel?: string;
  offlineUnavailable?: boolean;
  offlineLabel?: string;
}

export function SadhanaCard({
  practice,
  onSelect,
  onEdit,
  onDelete,
  expanded = false,
  textureUrl,
  blocks = [],
  badgeLabel,
  offlineUnavailable = false,
  offlineLabel,
}: SadhanaCardProps) {
  const t = useT();
  const swipeable = Boolean(onDelete);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeDragging, setSwipeDragging] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOffset: number;
    active: boolean;
    axis: 'x' | 'y' | null;
  } | null>(null);

  const total = sadhanaTotalSeconds(practice, blocks);
  const phaseCount = practice.phases.length;
  const phasesBadge = t('hub.phasesCount').replace('{count}', String(phaseCount));
  const totalLabel = total.hasUnknown
    ? `≈ ${formatPhaseDuration(total.totalSeconds)}`
    : formatPhaseDuration(total.totalSeconds);
  const displayTitle = practice.title || t('customPractice.untitled');

  const confirmDelete = useCallback(() => {
    if (!onDelete) return false;
    const message = t('customPractice.deleteConfirm').replace('{title}', displayTitle);
    if (!window.confirm(message)) return false;
    onDelete(practice.id);
    setSwipeOffset(0);
    return true;
  }, [displayTitle, onDelete, practice.id, t]);

  const snapSwipe = useCallback(
    (offset: number) => {
      if (offset <= -SWIPE_DELETE_THRESHOLD) {
        confirmDelete();
        return;
      }
      if (offset <= -SWIPE_OPEN_THRESHOLD) {
        setSwipeOffset(-SWIPE_ACTION_WIDTH);
        return;
      }
      setSwipeOffset(0);
    },
    [confirmDelete],
  );

  const onSwipePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeable || e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffset: swipeOffset,
      active: true,
      axis: null,
    };
    setSwipeDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onSwipePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag?.active) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'y') {
        drag.active = false;
        setSwipeDragging(false);
        return;
      }
    }
    if (drag.axis !== 'x') return;
    const next = Math.min(0, Math.max(-SWIPE_ACTION_WIDTH, drag.startOffset + dx));
    setSwipeOffset(next);
  };

  const endSwipe = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (drag.active && drag.axis === 'x') {
      const dx = e.clientX - drag.startX;
      const finalOffset = Math.min(
        0,
        Math.max(-SWIPE_ACTION_WIDTH, drag.startOffset + dx),
      );
      setSwipeOffset(finalOffset);
      snapSwipe(finalOffset);
    }
    dragRef.current = null;
    setSwipeDragging(false);
  };

  const cardClassName = `card sadhana-card${textureUrl ? ' card--has-texture' : ''}${
    onEdit || onDelete ? ' sadhana-card--custom' : ''
  }${offlineUnavailable ? ' sadhana-card--offline-disabled' : ''}`;

  const cardContent = (
    <>
      {textureUrl && <CardCornerTexture url={textureUrl} warm />}
      <div className="sadhana-card__row">
        <button
          type="button"
          className="sadhana-card__body"
          disabled={offlineUnavailable}
          aria-disabled={offlineUnavailable}
          onClick={() => {
            if (offlineUnavailable) return;
            if (swipeOffset < 0) {
              setSwipeOffset(0);
              return;
            }
            onSelect(practice.id);
          }}
        >
          <div className="sadhana-card__main">
            <span className="sadhana-card__badges">
              {badgeLabel && <span className="badge badge--secondary">{badgeLabel}</span>}
              <span className="badge badge--secondary">{phasesBadge}</span>
              {offlineUnavailable && offlineLabel && (
                <span className="badge badge--secondary">{offlineLabel}</span>
              )}
            </span>
            <h3 className="sadhana-card__title">{practice.title}</h3>
            {practice.description && (
              <p className="sadhana-card__desc">{practice.description}</p>
            )}
          </div>
          <span className="sadhana-card__duration">{totalLabel}</span>
        </button>
        {(onEdit || onDelete) && (
          <div className="sadhana-card__actions">
            {onEdit && (
              <button
                type="button"
                className="btn-icon sadhana-card__action"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(practice.id);
                }}
                aria-label={t('customPractice.edit')}
                title={t('customPractice.edit')}
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn-icon sadhana-card__action sadhana-card__action--delete"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete();
                }}
                aria-label={t('customPractice.delete')}
                title={t('customPractice.delete')}
              >
                ×
              </button>
            )}
          </div>
        )}
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
    </>
  );

  if (!swipeable) {
    return <div className={cardClassName}>{cardContent}</div>;
  }

  return (
    <div className="sadhana-card-swipe">
      <div className="sadhana-card-swipe__behind" aria-hidden={swipeOffset === 0}>
        <button
          type="button"
          className="sadhana-card-swipe__delete"
          onClick={confirmDelete}
          tabIndex={swipeOffset < 0 ? 0 : -1}
        >
          {t('customPractice.delete')}
        </button>
      </div>
      <div
        ref={frontRef}
        className={`${cardClassName} sadhana-card-swipe__front${
          swipeDragging ? ' sadhana-card-swipe__front--dragging' : ''
        }`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onPointerDown={onSwipePointerDown}
        onPointerMove={onSwipePointerMove}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
      >
        {cardContent}
      </div>
    </div>
  );
}
