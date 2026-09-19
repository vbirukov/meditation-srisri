import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '@/analytics/track';
import { VideoBackground } from '@/components/VideoBackground';
import { Header } from '@/components/Header';
import { StreakPath } from '@/components/StreakPath';
import { useT } from '@/i18n';
import { STREAK_GOAL_DAYS } from '@/store/onboardingStore';
import { usePracticeStatsStore } from '@/store/practiceStatsStore';
import { useVkUserStore } from '@/store/vkUserStore';
import { getStreakView } from '@/utils/practiceStats';
import { getTexturePool, pickRandomFromUrls, textureStyle, withTexture } from '@/utils/textures';
import '@/styles/textured-surface.css';
import './WelcomeScreen.css';

const GREETING_TEXTURE_NAMES = ['end-stats', 'end-stats1'];

function pickWelcomeGreetingTexture(): string | undefined {
  const pool = getTexturePool('end-stats').filter((url) =>
    GREETING_TEXTURE_NAMES.some((name) => {
      const base = url.split('/').pop() ?? '';
      return base.replace(/\.[^.]+$/, '') === name;
    }),
  );
  return pickRandomFromUrls(pool);
}

export function WelcomeScreen() {
  const navigate = useNavigate();
  const t = useT();
  const greetingTexture = useMemo(() => pickWelcomeGreetingTexture(), []);
  const user = useVkUserStore((s) => s.user);
  const streakDays = usePracticeStatsStore((s) => s.streakDays);
  const lastPracticeDate = usePracticeStatsStore((s) => s.lastPracticeDate);
  const streak = useMemo(
    () => getStreakView(lastPracticeDate, streakDays),
    [lastPracticeDate, streakDays],
  );

  const greeting = user?.firstName
    ? t('welcome.greetingNamed').replace('{name}', user.firstName)
    : t('welcome.greeting');

  const streakMessage = streak.atRisk
    ? t('welcome.streakRisk').replace('{days}', String(streak.days))
    : streak.practicedToday
      ? t('welcome.streakSafe').replace('{days}', String(streak.days))
      : streak.days > 0
        ? t('welcome.streakActive').replace('{days}', String(streak.days))
        : null;

  const ctaLabel = streak.atRisk ? t('welcome.ctaSaveStreak') : t('welcome.cta');

  return (
    <div className="screen screen--immersive welcome-screen">
      <VideoBackground scene="welcome" overlay={0.5} variant="welcome" />
      <Header transparent />
      <div className="welcome-screen__body fade-in">
        <div className="welcome-screen__card glass-bar">
          {user?.photoUrl && (
            <img
              className="welcome-screen__avatar"
              src={user.photoUrl}
              alt=""
              width={56}
              height={56}
              decoding="async"
            />
          )}
          <h1
            className={withTexture(
              'heading-display welcome-screen__greeting',
              greetingTexture,
              'textured-surface--welcome-greeting',
            )}
            style={textureStyle(greetingTexture)}
          >
            <span className="welcome-screen__greeting-text">{greeting}</span>
          </h1>

          {(streak.days > 0 || streak.atRisk) && (
            <div
              className={`welcome-screen__streak${streak.atRisk ? ' welcome-screen__streak--risk' : ''}`}
            >
              <StreakPath
                current={streak.days}
                goal={STREAK_GOAL_DAYS}
                label={t('welcome.streakLabel')}
                highlightNext={streak.atRisk}
                compact
              />
              {streakMessage && (
                <p className="welcome-screen__streak-msg">{streakMessage}</p>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn-primary btn-primary--lg welcome-screen__cta"
            onClick={() => {
              track('welcome_cta', {
                streak: streak.days,
                at_risk: streak.atRisk,
              });
              navigate('/practice');
            }}
          >
            {ctaLabel}
          </button>
          <p className="welcome-screen__disclaimer text-muted">{t('welcome.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}
