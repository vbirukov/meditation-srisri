import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '@/analytics/track';
import meditationsData from '@/data/meditations.json';
import sadhanaData from '@/data/sadhana.json';
import type { Meditation, SadhanaCatalog, SadhanaPractice } from '@/types';
import { Header } from '@/components/Header';
import { MoodSelector } from '@/components/MoodSelector';
import { StreakPath } from '@/components/StreakPath';
import { useLocaleStore, useT } from '@/i18n';
import { useSessionStore } from '@/store/sessionStore';
import { useCustomPracticeStore } from '@/store/customPracticeStore';
import { usePracticeStatsStore } from '@/store/practiceStatsStore';
import { STREAK_GOAL_DAYS } from '@/store/onboardingStore';
import {
  getGurujiMedia,
  getLocalized,
  getSessionSummary,
  pickPhoto,
  pickQuote,
} from '@/utils/gurujiContent';
import { formatMonthTotal, formatPracticeDuration } from '@/utils/practiceStats';
import { absoluteMediaUrl, isVkMiniApp } from '@/utils/vk';
import { buildShareMessage, shareLink, shareToStory, shareToWall } from '@/vk/share';
import {
  addAppToFavorites,
  shouldOfferFavorites,
  useVkFavoritesStore,
} from '@/vk/favorites';
import { showInviteBox } from '@/vk/invite';
import { END_SCREEN_TEXTURE_POOLS, textureStyle, usePageTextures, withTexture } from '@/utils/textures';
import '@/styles/textured-surface.css';
import './EndScreen.css';

const GURUJI_FALLBACK_PHOTO = '/media/images/guruji.svg';
const STORY_BG = '/media/posters/welcome1.jpg';
const meditations = meditationsData as Meditation[];
const sadhanaCatalog = sadhanaData as unknown as SadhanaCatalog;
const sadhanas = (sadhanaCatalog.practices ?? []) as SadhanaPractice[];

export function EndScreen() {
  const navigate = useNavigate();
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const mood = useSessionStore((s) => s.mood);
  const setMood = useSessionStore((s) => s.setMood);
  const reset = useSessionStore((s) => s.reset);
  const inVk = isVkMiniApp();

  const lastSession = usePracticeStatsStore((s) => s.lastSession);
  const streakDays = usePracticeStatsStore((s) => s.streakDays);
  const secondsThisMonth = usePracticeStatsStore((s) => s.secondsThisMonth);
  const totalSessions = usePracticeStatsStore((s) => s.totalSessions);

  const quote = useMemo(() => pickQuote(locale), [locale]);
  const photoSrc = useMemo(() => pickPhoto() ?? GURUJI_FALLBACK_PHOTO, []);
  const textures = usePageTextures(END_SCREEN_TEXTURE_POOLS);
  const media = getGurujiMedia();
  const [photoFailed, setPhotoFailed] = useState(false);
  const [shareBusy, setShareBusy] = useState<'wall' | 'story' | 'link' | 'invite' | null>(null);
  const [favBusy, setFavBusy] = useState(false);
  const [showFavorites, setShowFavorites] = useState(() => shouldOfferFavorites(totalSessions));
  const markAsked = useVkFavoritesStore((s) => s.markAsked);
  const displayPhoto = photoFailed ? GURUJI_FALLBACK_PHOTO : photoSrc;

  const customPractices = useCustomPracticeStore((s) => s.practices);
  const meditation = meditations.find((m) => m.id === lastSession?.meditationId);
  const sadhana = sadhanas.find((s) => s.id === lastSession?.sadhanaId);
  const customPractice = customPractices.find(
    (p) => p.id === lastSession?.customPracticeId,
  );
  const practiceTitle =
    meditation?.title ??
    sadhana?.title ??
    customPractice?.title.trim() ??
    (lastSession?.mode === 'timer'
      ? t('timer.title')
      : lastSession?.mode === 'custom'
        ? t('customTrack.yours')
        : lastSession?.mode === 'custom-practice'
          ? t('customPractice.untitled')
          : t('end.practiceFallback'));

  const summaryText = lastSession
    ? getSessionSummary(
        lastSession.mode,
        lastSession.meditationId,
        locale,
        lastSession.sadhanaId,
      )
    : getSessionSummary('timer', undefined, locale);

  const durationLabel = lastSession
    ? formatPracticeDuration(lastSession.durationSeconds, locale)
    : '—';

  const finish = () => {
    reset();
    navigate('/practice');
  };

  const again = () => {
    reset();
    navigate(
      lastSession?.sadhanaId || lastSession?.customPracticeId
        ? '/practice?tab=sadhana&focus=continue'
        : '/practice?focus=continue',
    );
  };

  const streakHint =
    streakDays >= STREAK_GOAL_DAYS
      ? t('end.streakDone')
      : t('end.streakKeep').replace('{next}', String(Math.min(STREAK_GOAL_DAYS, streakDays + 1)));

  const runShare = async (kind: 'wall' | 'story' | 'link' | 'invite') => {
    if (shareBusy) return;
    setShareBusy(kind);
    try {
      if (kind === 'wall') {
        await shareToWall(
          buildShareMessage({
            locale,
            practiceTitle,
            durationLabel,
            streakDays,
          }),
        );
      } else if (kind === 'story') {
        await shareToStory(absoluteMediaUrl(STORY_BG));
      } else if (kind === 'invite') {
        await showInviteBox();
      } else {
        await shareLink();
      }
      track('end_share', { kind, mode: lastSession?.mode });
    } finally {
      setShareBusy(null);
    }
  };

  const runFavorites = async () => {
    if (favBusy) return;
    setFavBusy(true);
    try {
      await addAppToFavorites();
      track('end_share', { kind: 'favorites', mode: lastSession?.mode });
    } finally {
      setFavBusy(false);
      setShowFavorites(false);
    }
  };

  const dismissFavorites = () => {
    markAsked();
    setShowFavorites(false);
  };

  return (
    <div
      className={`screen end-screen${textures['end-screen'] ? ' end-screen--textured' : ''}`}
      style={textureStyle(textures['end-screen'])}
    >
      <div className="screen__body screen__body--scroll fade-in">
        <Header title={t('end.title')} />

        <div
          className={withTexture('end-screen__hero glass-panel', textures['end-hero'])}
          style={textureStyle(textures['end-hero'])}
        >
          <figure className="end-screen__portrait">
            {media.video ? (
              <video
                className="end-screen__portrait-media"
                src={media.video}
                autoPlay
                muted
                loop
                playsInline
                poster={displayPhoto}
              />
            ) : (
              <img
                className="end-screen__portrait-media"
                src={displayPhoto}
                alt=""
                onError={() => setPhotoFailed(true)}
              />
            )}
          </figure>
          <blockquote className="end-screen__quote">
            <p className="end-screen__quote-text">{getLocalized(quote.text, locale)}</p>
            {quote.source && getLocalized(quote.source, locale) && (
              <footer className="end-screen__quote-source">
                {getLocalized(quote.source, locale)}
              </footer>
            )}
          </blockquote>
        </div>

        {lastSession && (
          <section
            className={withTexture('end-screen__summary panel-elevated', textures['end-summary'])}
            style={textureStyle(textures['end-summary'])}
          >
            <h2 className="end-screen__summary-title">{t('end.sessionSummary')}</h2>
            <p className="end-screen__practice-name">{practiceTitle}</p>
            <p className="end-screen__practice-duration">
              {t('end.duration')}: <strong>{durationLabel}</strong>
            </p>
            <p className="end-screen__summary-text text-muted">{summaryText}</p>
          </section>
        )}

        <section
          className={withTexture('end-screen__stats glass-panel', textures['end-stats'])}
          style={textureStyle(textures['end-stats'])}
          aria-label={t('end.statsTitle')}
        >
          <div className="end-screen__streak-path">
            <StreakPath
              current={streakDays}
              goal={STREAK_GOAL_DAYS}
              label={t('end.streakPath')
                .replace('{current}', String(Math.min(streakDays, STREAK_GOAL_DAYS)))
                .replace('{goal}', String(STREAK_GOAL_DAYS))}
            />
            <p className="end-screen__streak-hint text-muted">{streakHint}</p>
          </div>
          <div className="end-screen__stat-row">
            <div className="end-screen__stat">
              <span className="end-screen__stat-value">{streakDays}</span>
              <span className="end-screen__stat-label">{t('end.streak')}</span>
            </div>
            <div className="end-screen__stat">
              <span className="end-screen__stat-value">
                {formatMonthTotal(secondsThisMonth, locale)}
              </span>
              <span className="end-screen__stat-label">{t('end.monthTotal')}</span>
            </div>
            <div className="end-screen__stat">
              <span className="end-screen__stat-value">{totalSessions}</span>
              <span className="end-screen__stat-label">{t('end.totalSessions')}</span>
            </div>
          </div>
        </section>

        <section
          className={withTexture('end-screen__mood glass-panel', textures['end-mood'])}
          style={textureStyle(textures['end-mood'])}
        >
          <h2 className="end-screen__mood-title">{t('end.subtitle')}</h2>
          <MoodSelector value={mood} onChange={setMood} />
        </section>

        <div className="end-screen__actions">
          {showFavorites && (
            <section className="end-screen__favorites glass-panel" aria-label={t('end.favoritesTitle')}>
              <p className="end-screen__favorites-title">{t('end.favoritesTitle')}</p>
              <p className="end-screen__favorites-hint text-muted">{t('end.favoritesHint')}</p>
              <div className="end-screen__favorites-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={favBusy}
                  onClick={() => void runFavorites()}
                >
                  {t('end.favoritesAction')}
                </button>
                <button type="button" className="btn-secondary" disabled={favBusy} onClick={dismissFavorites}>
                  {t('end.favoritesLater')}
                </button>
              </div>
            </section>
          )}
          {inVk && (
            <div className="end-screen__share" role="group" aria-label={t('end.shareLink')}>
              <button
                type="button"
                className="btn-secondary"
                disabled={shareBusy !== null}
                onClick={() => void runShare('wall')}
              >
                {t('end.shareWall')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={shareBusy !== null}
                onClick={() => void runShare('story')}
              >
                {t('end.shareStory')}
              </button>
              <button
                type="button"
                className="btn-secondary end-screen__share-link"
                disabled={shareBusy !== null}
                onClick={() => void runShare('link')}
              >
                {t('end.shareLink')}
              </button>
              <button
                type="button"
                className="btn-secondary end-screen__share-link"
                disabled={shareBusy !== null}
                onClick={() => void runShare('invite')}
              >
                {t('end.inviteFriends')}
              </button>
            </div>
          )}
          <button type="button" className="btn-primary btn-primary--lg" onClick={again}>
            {t('end.again')}
          </button>
          <button type="button" className="btn-secondary" onClick={finish}>
            {t('end.finish')}
          </button>
        </div>
      </div>
    </div>
  );
}
